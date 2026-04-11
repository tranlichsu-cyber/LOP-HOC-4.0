import React, { useState, useEffect } from 'react';
import { Users, BookOpen, Settings, Plus, Trash2, Edit2, Save, X, School as SchoolIcon, UserCheck, ShieldCheck, FileSpreadsheet, Download, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, query, where, writeBatch, getDoc } from 'firebase/firestore';
import { School, UserProfile, Class } from '../types';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export default function SchoolAdmin({ userProfile }: { userProfile: UserProfile }) {
  const [activeTab, setActiveTab] = useState<'teachers' | 'classes' | 'settings'>('teachers');
  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [school, setSchool] = useState<School | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);

  // Modals
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);

  // New Data
  const [newTeacher, setNewTeacher] = useState({ email: '', displayName: '', role: 'teacher' as const });
  const [newClass, setNewClass] = useState({ name: '', grade: 'Lớp 1', teacherUid: '' });

  useEffect(() => {
    if (userProfile.schoolId) {
      loadSchoolData(userProfile.schoolId);
    }
  }, [userProfile.schoolId]);

  const loadSchoolData = async (schoolId: string) => {
    setIsLoading(true);
    try {
      const [schoolSnap, teachersSnap, classesSnap] = await Promise.all([
        getDoc(doc(db, 'schools', schoolId)),
        getDocs(query(collection(db, 'users'), where('schoolId', '==', schoolId), where('role', '==', 'teacher'))),
        getDocs(collection(db, 'schools', schoolId, 'classes'))
      ]);

      if (schoolSnap.exists()) {
        setSchool(schoolSnap.data() as School);
      }
      setTeachers(teachersSnap.docs.map(doc => doc.data() as UserProfile));
      setClasses(classesSnap.docs.map(doc => doc.data() as Class));
    } catch (error) {
      console.error("Error loading school data:", error);
    }
    setIsLoading(false);
  };

  const handleCreateSchool = async (name: string) => {
    if (!name) return;
    const schoolId = 'school_' + Date.now();
    const newSchool: School = {
      id: schoolId,
      name: name,
      adminUid: userProfile.uid
    };
    
    try {
      await setDoc(doc(db, 'schools', schoolId), newSchool);
      await setDoc(doc(db, 'users', userProfile.uid), { schoolId }, { merge: true });
      setSchool(newSchool);
      // Update local profile too
      userProfile.schoolId = schoolId;
      loadSchoolData(schoolId);
    } catch (error) {
      console.error("Error creating school:", error);
      alert("Lỗi khi tạo trường học!");
    }
  };

  const handleAddTeacher = async () => {
    if (!newTeacher.email || !userProfile.schoolId) return;
    
    const cleanEmail = newTeacher.email.trim().toLowerCase();
    const teacherUid = 'teacher_' + btoa(cleanEmail).replace(/=/g, '').substring(0, 20);
    
    const profile: UserProfile = {
      uid: teacherUid,
      email: cleanEmail,
      displayName: newTeacher.displayName || cleanEmail.split('@')[0],
      role: 'teacher',
      schoolId: userProfile.schoolId
    };

    try {
      await setDoc(doc(db, 'users', teacherUid), profile);
      setTeachers([...teachers, profile]);
      setIsTeacherModalOpen(false);
      setNewTeacher({ email: '', displayName: '', role: 'teacher' });
      alert(`Đã cấp tài khoản cho giáo viên: ${profile.displayName}\nTài khoản: ${profile.email}\nMật khẩu mặc định: 123456`);
    } catch (error) {
      console.error("Error adding teacher:", error);
      alert("Lỗi khi thêm giáo viên!");
    }
  };

  const handleAddClass = async () => {
    if (!newClass.name || !userProfile.schoolId) return;
    const classId = Date.now().toString();
    const classData: Class = {
      id: classId,
      name: newClass.name,
      grade: newClass.grade,
      teacherUid: newClass.teacherUid,
      schoolId: userProfile.schoolId
    };
    
    try {
      await setDoc(doc(db, 'schools', userProfile.schoolId, 'classes', classId), classData);
      setClasses([...classes, classData]);
      setIsClassModalOpen(false);
      setNewClass({ name: '', grade: 'Lớp 1', teacherUid: '' });
    } catch (error) {
      console.error("Error adding class:", error);
    }
  };

  const handleResetSystem = async () => {
    if (!confirm("CẢNH BÁO: Hành động này sẽ xóa TOÀN BỘ dữ liệu (Trường học, Giáo viên, Lớp học, Học sinh, Trò chơi, Bài tập) trên hệ thống. Bạn có chắc chắn muốn tiếp tục?")) return;
    if (!confirm("XÁC NHẬN LẦN CUỐI: Dữ liệu sẽ không thể khôi phục. Tiếp tục xóa?")) return;

    setIsLoading(true);
    try {
      // Note: This only clears Firestore data. Auth accounts must be deleted in Firebase Console.
      const collectionsToClear = ['schools', 'users', 'edupro_students', 'game_sessions'];
      const batch = writeBatch(db);

      for (const collName of collectionsToClear) {
        const snap = await getDocs(collection(db, collName));
        snap.forEach(doc => {
          batch.delete(doc.ref);
        });
      }

      // Also clear teacher subcollections if any (this is complex, but we'll clear the main ones)
      const teachersSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'teacher')));
      for (const tDoc of teachersSnap.docs) {
        const subColls = ['students', 'homework', 'worksheets', 'games'];
        for (const sub of subColls) {
          const subSnap = await getDocs(collection(db, 'teachers', tDoc.id, sub));
          subSnap.forEach(d => batch.delete(d.ref));
        }
      }

      await batch.commit();
      alert("Hệ thống đã được đặt lại thành công! Vui lòng tải lại trang.");
      window.location.reload();
    } catch (error) {
      console.error("Error resetting system:", error);
      alert("Lỗi khi đặt lại hệ thống!");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTeacherTemplate = () => {
    const template = [
      { "Họ và tên": "Nguyễn Văn A", "Email": "nguyenvana@gmail.com" },
      { "Họ và tên": "Trần Thị B", "Email": "tranthib@gmail.com" }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Teachers");
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: "application/octet-stream" }), "Mau_Danh_Sach_Giao_Vien.xlsx");
  };

  const handleTeacherImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userProfile.schoolId) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        const wb = XLSX.read(data, { type: 'array' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const jsonData = XLSX.utils.sheet_to_json(ws) as any[];

        const batch = writeBatch(db);
        const importedTeachers: UserProfile[] = [];

        for (const row of jsonData) {
          // Normalize keys to handle different casing or spaces
          const normalizedRow: any = {};
          Object.keys(row).forEach(key => {
            normalizedRow[key.trim().toLowerCase()] = row[key];
          });

          const email = normalizedRow["email"] || normalizedRow["email address"] || normalizedRow["địa chỉ email"];
          const name = normalizedRow["họ và tên"] || normalizedRow["tên"] || normalizedRow["name"] || normalizedRow["displayname"];

          if (email && typeof email === 'string') {
            const cleanEmail = email.trim().toLowerCase();
            // Use a deterministic UID based on email for demo purposes
            // In production, you'd use Firebase Auth to create users
            const teacherUid = 'teacher_' + btoa(cleanEmail).replace(/=/g, '').substring(0, 20);
            
            const profile: UserProfile = {
              uid: teacherUid,
              email: cleanEmail,
              displayName: name || cleanEmail.split('@')[0],
              role: 'teacher',
              schoolId: userProfile.schoolId
            };
            batch.set(doc(db, 'users', teacherUid), profile);
            importedTeachers.push(profile);
          }
        }

        if (importedTeachers.length > 0) {
          await batch.commit();
          setTeachers(prev => {
            const existingEmails = new Set(prev.map(t => t.email.toLowerCase()));
            const newOnes = importedTeachers.filter(t => !existingEmails.has(t.email.toLowerCase()));
            return [...prev, ...newOnes];
          });
          alert(`Đã nhập thành công ${importedTeachers.length} giáo viên!`);
        } else {
          alert("Không tìm thấy dữ liệu giáo viên hợp lệ trong file. Vui lòng kiểm tra lại tiêu đề cột (Email, Họ và tên).");
        }
      } catch (error) {
        console.error("Error importing teachers:", error);
        alert("Lỗi khi nhập dữ liệu từ Excel! Vui lòng đảm bảo file đúng định dạng.");
      } finally {
        setIsImporting(false);
        if (e.target) e.target.value = ''; // Reset input
      }
    };
    reader.readAsArrayBuffer(file);
  };

  if (!userProfile.schoolId && !school) {
    return (
      <div className="p-12 max-w-2xl mx-auto text-center">
        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <SchoolIcon className="w-10 h-10 text-indigo-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Chào mừng Quản trị viên!</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          Bạn chưa khởi tạo thông tin trường học. Vui lòng nhập tên trường để bắt đầu quản lý.
        </p>
        <div className="flex gap-2">
          <input 
            id="school-name-init"
            type="text" 
            placeholder="Tên trường học của bạn..."
            className="flex-1 p-3 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 dark:bg-slate-800 dark:text-white"
          />
          <button 
            onClick={() => {
              const input = document.getElementById('school-name-init') as HTMLInputElement;
              handleCreateSchool(input.value);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition"
          >
            Khởi tạo
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-indigo-600" />
            Quản trị Trường học
          </h1>
          <p className="text-slate-500 dark:text-slate-400">{school?.name || 'Đang tải...'}</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('teachers')}
            className={`px-4 py-2 rounded-lg font-medium transition ${activeTab === 'teachers' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'}`}
          >
            Giáo viên
          </button>
          <button 
            onClick={() => setActiveTab('classes')}
            className={`px-4 py-2 rounded-lg font-medium transition ${activeTab === 'classes' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'}`}
          >
            Lớp học
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-lg font-medium transition ${activeTab === 'settings' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'}`}
          >
            Cấu hình
          </button>
          <button 
            onClick={handleResetSystem}
            className="px-4 py-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg font-medium transition flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Đặt lại hệ thống
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'teachers' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold dark:text-white">Danh sách Giáo viên</h2>
                <div className="flex gap-2">
                  <button 
                    onClick={downloadTeacherTemplate}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-slate-50 transition"
                  >
                    <Download className="w-4 h-4" /> Mẫu Excel
                  </button>
                  <label className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition cursor-pointer">
                    {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                    Nhập Excel
                    <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleTeacherImport} disabled={isImporting} />
                  </label>
                  <button 
                    onClick={() => setIsTeacherModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition"
                  >
                    <Plus className="w-4 h-4" /> Thêm Giáo viên
                  </button>
                </div>
              </div>
              
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/50 border-bottom border-slate-200 dark:border-slate-700">
                      <th className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Họ và tên</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Email</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Lớp phụ trách</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {teachers.map((teacher) => (
                      <tr key={teacher.uid} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 font-bold text-xs">
                              {teacher.displayName?.charAt(0) || 'T'}
                            </div>
                            <span className="text-sm font-medium dark:text-white">{teacher.displayName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{teacher.email}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                          {classes.find(c => c.teacherUid === teacher.uid)?.name || 'Chưa gán'}
                        </td>
                        <td className="px-6 py-4">
                          <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-indigo-600 transition">
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'classes' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold dark:text-white">Danh sách Lớp học</h2>
                <button 
                  onClick={() => setIsClassModalOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition"
                >
                  <Plus className="w-4 h-4" /> Thêm Lớp học
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {classes.map((cls) => (
                  <div key={cls.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <button className="text-slate-400 hover:text-red-500 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <h3 className="font-bold text-lg dark:text-white mb-1">{cls.name}</h3>
                    <p className="text-sm text-slate-500 mb-4">{cls.grade}</p>
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                      <span className="text-xs text-slate-400">Giáo viên:</span>
                      <span className="text-xs font-medium text-indigo-600">
                        {teachers.find(t => t.uid === cls.teacherUid)?.displayName || 'Chưa gán'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-2xl bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <h2 className="text-lg font-semibold dark:text-white mb-6">Cấu hình Trường học</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tên trường</label>
                  <input 
                    type="text" 
                    value={school?.name || ''} 
                    onChange={(e) => setSchool(prev => prev ? { ...prev, name: e.target.value } : null)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 dark:text-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Địa chỉ</label>
                  <input 
                    type="text" 
                    value={school?.address || ''} 
                    onChange={(e) => setSchool(prev => prev ? { ...prev, address: e.target.value } : null)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 dark:text-white transition-colors"
                  />
                </div>
                <button 
                  onClick={async () => {
                    if (school && userProfile.schoolId) {
                      try {
                        await setDoc(doc(db, 'schools', userProfile.schoolId), school);
                        alert("Đã lưu cấu hình thành công!");
                        // Force a reload of school data to be sure
                        loadSchoolData(userProfile.schoolId);
                      } catch (error) {
                        console.error("Error saving school settings:", error);
                        alert("Lỗi khi lưu cấu hình!");
                      }
                    }
                  }}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition shadow-sm mt-4"
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Modals */}
      {isTeacherModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="text-xl font-bold dark:text-white">Thêm Giáo viên mới</h3>
              <button onClick={() => setIsTeacherModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Họ và tên</label>
                <input 
                  type="text" 
                  value={newTeacher.displayName}
                  onChange={e => setNewTeacher({...newTeacher, displayName: e.target.value})}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 dark:text-white"
                  placeholder="VD: Nguyễn Văn A"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Email (Tài khoản)</label>
                <input 
                  type="email" 
                  value={newTeacher.email}
                  onChange={e => setNewTeacher({...newTeacher, email: e.target.value})}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 dark:text-white"
                  placeholder="VD: gv_a@truong.edu.vn"
                />
              </div>
              <p className="text-xs text-slate-500 italic">* Mật khẩu mặc định sẽ là: 123456</p>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button onClick={() => setIsTeacherModalOpen(false)} className="px-5 py-2.5 bg-slate-100 dark:bg-slate-700 font-bold rounded-xl dark:text-white">Hủy</button>
                <button onClick={handleAddTeacher} className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl">Thêm ngay</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isClassModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="text-xl font-bold dark:text-white">Thêm Lớp học mới</h3>
              <button onClick={() => setIsClassModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Tên lớp</label>
                <input 
                  type="text" 
                  value={newClass.name}
                  onChange={e => setNewClass({...newClass, name: e.target.value})}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 dark:text-white"
                  placeholder="VD: 1A, 2B..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Khối</label>
                <select 
                  value={newClass.grade}
                  onChange={e => setNewClass({...newClass, grade: e.target.value})}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 dark:text-white"
                >
                  <option>Lớp 1</option>
                  <option>Lớp 2</option>
                  <option>Lớp 3</option>
                  <option>Lớp 4</option>
                  <option>Lớp 5</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Giáo viên phụ trách</label>
                <select 
                  value={newClass.teacherUid}
                  onChange={e => setNewClass({...newClass, teacherUid: e.target.value})}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 dark:text-white"
                >
                  <option value="">-- Chọn giáo viên --</option>
                  {teachers.map(t => (
                    <option key={t.uid} value={t.uid}>{t.displayName}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button onClick={() => setIsClassModalOpen(false)} className="px-5 py-2.5 bg-slate-100 dark:bg-slate-700 font-bold rounded-xl dark:text-white">Hủy</button>
                <button onClick={handleAddClass} className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl">Tạo lớp</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
