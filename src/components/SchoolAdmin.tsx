import React, { useState, useEffect } from 'react';
import { Users, BookOpen, Settings, Plus, Trash2, Edit2, Save, X, School as SchoolIcon, UserCheck, ShieldCheck, FileSpreadsheet, Download, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, query, where, writeBatch, getDoc } from 'firebase/firestore';
import { School, UserProfile, Class, Department } from '../types';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export default function SchoolAdmin({ userProfile }: { userProfile: UserProfile }) {
  const [activeTab, setActiveTab] = useState<'staff' | 'classes' | 'departments' | 'settings'>('staff');
  const [staff, setStaff] = useState<UserProfile[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [school, setSchool] = useState<School | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);

  // Modals
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<UserProfile | null>(null);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false);

  // New Data
  const [newStaff, setNewStaff] = useState({ email: '', displayName: '', role: 'teacher' as any });
  const [newClass, setNewClass] = useState({ name: '', grade: 'Lớp 1', teacherUid: '' });
  const [newDepartment, setNewDepartment] = useState({ name: '' });

  useEffect(() => {
    if (userProfile.schoolId) {
      loadSchoolData(userProfile.schoolId);
    }
  }, [userProfile.schoolId]);

  const loadSchoolData = async (schoolId: string) => {
    setIsLoading(true);
    try {
      const [schoolSnap, staffSnap, classesSnap, deptsSnap] = await Promise.all([
        getDoc(doc(db, 'schools', schoolId)),
        getDocs(query(collection(db, 'users'), where('schoolId', '==', schoolId), where('role', 'in', ['principal', 'teacher', 'homeroom_teacher']))),
        getDocs(collection(db, 'schools', schoolId, 'classes')),
        getDocs(collection(db, 'schools', schoolId, 'departments'))
      ]);

      if (schoolSnap.exists()) {
        setSchool(schoolSnap.data() as School);
      }
      setStaff(staffSnap.docs.map(doc => doc.data() as UserProfile));
      setClasses(classesSnap.docs.map(doc => doc.data() as Class));
      setDepartments(deptsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Department));
    } catch (error) {
      console.error("Error loading school data:", error);
    }
    setIsLoading(false);
  };

  const handleAddDepartment = async () => {
    if (!newDepartment.name || !userProfile.schoolId) return;
    const deptId = 'dept_' + Date.now();
    const deptData: Department = {
      id: deptId,
      name: newDepartment.name,
      schoolId: userProfile.schoolId,
      memberIds: []
    };

    try {
      await setDoc(doc(db, 'schools', userProfile.schoolId, 'departments', deptId), deptData);
      setDepartments([...departments, deptData]);
      setIsDepartmentModalOpen(false);
      setNewDepartment({ name: '' });
    } catch (error) {
      console.error("Error adding department:", error);
    }
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

  const handleAddStaff = async () => {
    if (!newStaff.email || !userProfile.schoolId) return;
    
    if (editingStaff) {
      // Logic for updating existing staff
      try {
        const updatedProfile = {
          ...editingStaff,
          displayName: newStaff.displayName || editingStaff.displayName,
          role: newStaff.role
        };
        await setDoc(doc(db, 'users', editingStaff.uid), updatedProfile, { merge: true });
        setStaff(staff.map(s => s.uid === editingStaff.uid ? updatedProfile : s));
        setIsStaffModalOpen(false);
        setEditingStaff(null);
        setNewStaff({ email: '', displayName: '', role: 'teacher' as any });
        alert(`Đã cập nhật thông tin cho: ${updatedProfile.displayName}`);
      } catch (error) {
        console.error("Error updating staff:", error);
        alert("Lỗi khi cập nhật nhân sự!");
      }
      return;
    }

    const cleanEmail = newStaff.email.trim().toLowerCase();
    const uid = 'staff_' + btoa(cleanEmail).replace(/=/g, '').substring(0, 20);
    
    const profile: UserProfile = {
      uid: uid,
      email: cleanEmail,
      displayName: newStaff.displayName || cleanEmail.split('@')[0],
      role: newStaff.role,
      schoolId: userProfile.schoolId
    };

    try {
      await setDoc(doc(db, 'users', uid), profile);
      setStaff([...staff, profile]);
      setIsStaffModalOpen(false);
      setNewStaff({ email: '', displayName: '', role: 'teacher' as any });
      alert(`Đã cấp tài khoản cho ${profile.role === 'principal' ? 'Ban giám hiệu' : 'Giáo viên'}: ${profile.displayName}\nTài khoản: ${profile.email}`);
    } catch (error) {
      console.error("Error adding staff:", error);
      alert("Lỗi khi thêm nhân sự!");
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

  const handleDeleteClass = async (classId: string) => {
    if (!userProfile.schoolId || !confirm("Bạn có chắc chắn muốn xóa lớp học này?")) return;
    try {
      await deleteDoc(doc(db, 'schools', userProfile.schoolId, 'classes', classId));
      setClasses(classes.filter(c => c.id !== classId));
    } catch (error) {
      console.error("Error deleting class:", error);
      alert("Lỗi khi xóa lớp học!");
    }
  };

  const handleDeleteDepartment = async (deptId: string) => {
    if (!userProfile.schoolId || !confirm("Bạn có chắc chắn muốn xóa tổ chuyên môn này?")) return;
    try {
      await deleteDoc(doc(db, 'schools', userProfile.schoolId, 'departments', deptId));
      setDepartments(departments.filter(d => d.id !== deptId));
    } catch (error) {
      console.error("Error deleting department:", error);
      alert("Lỗi khi xóa tổ chuyên môn!");
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
          setStaff(prev => {
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
            onClick={() => setActiveTab('staff')}
            className={`px-4 py-2 rounded-lg font-medium transition ${activeTab === 'staff' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'}`}
          >
            Nhân sự
          </button>
          <button 
            onClick={() => setActiveTab('classes')}
            className={`px-4 py-2 rounded-lg font-medium transition ${activeTab === 'classes' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'}`}
          >
            Lớp học
          </button>
          <button 
            onClick={() => setActiveTab('departments')}
            className={`px-4 py-2 rounded-lg font-medium transition ${activeTab === 'departments' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'}`}
          >
            Tổ chuyên môn
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
          {activeTab === 'staff' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold dark:text-white">Danh sách Nhân sự</h2>
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
                    onClick={() => setIsStaffModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition"
                  >
                    <Plus className="w-4 h-4" /> Thêm Nhân sự
                  </button>
                </div>
              </div>
              
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/50 border-bottom border-slate-200 dark:border-slate-700">
                      <th className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Họ và tên</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Email</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Vai trò</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {staff.map((member) => (
                      <tr key={member.uid} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 font-bold text-xs">
                              {member.displayName?.charAt(0) || 'S'}
                            </div>
                            <span className="text-sm font-medium dark:text-white">{member.displayName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{member.email}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                            member.role === 'principal' ? 'bg-purple-100 text-purple-600' :
                            member.role === 'homeroom_teacher' ? 'bg-emerald-100 text-emerald-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            {member.role === 'principal' ? 'Ban giám hiệu' :
                             member.role === 'homeroom_teacher' ? 'GV Chủ nhiệm' : 'Giáo viên'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => {
                              setEditingStaff(member);
                              setNewStaff({
                                email: member.email,
                                displayName: member.displayName || '',
                                role: member.role
                              });
                              setIsStaffModalOpen(true);
                            }}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-indigo-600 transition"
                          >
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
                      <button 
                        onClick={() => handleDeleteClass(cls.id)}
                        className="text-slate-400 hover:text-red-500 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <h3 className="font-bold text-lg dark:text-white mb-1">{cls.name}</h3>
                    <p className="text-sm text-slate-500 mb-4">{cls.grade}</p>
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                      <span className="text-xs text-slate-400">Giáo viên:</span>
                      <span className="text-xs font-medium text-indigo-600">
                        {staff.find(t => t.uid === cls.teacherUid)?.displayName || 'Chưa gán'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'departments' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold dark:text-white">Danh sách Tổ chuyên môn</h2>
                <button 
                  onClick={() => setIsDepartmentModalOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition"
                >
                  <Plus className="w-4 h-4" /> Thêm Tổ chuyên môn
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {departments.map((dept) => (
                  <div key={dept.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600">
                        <Users className="w-6 h-6" />
                      </div>
                      <button 
                        onClick={() => handleDeleteDepartment(dept.id)}
                        className="text-slate-400 hover:text-red-500 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <h3 className="font-bold text-lg dark:text-white mb-1">{dept.name}</h3>
                    <p className="text-sm text-slate-500 mb-4">{dept.memberIds.length} thành viên</p>
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                      <button className="text-xs font-medium text-indigo-600 hover:underline">
                        Quản lý thành viên
                      </button>
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
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-slate-800 dark:text-white">
                {editingStaff ? 'Sửa thông tin Nhân sự' : 'Thêm Nhân sự mới'}
              </h3>
              <button 
                onClick={() => {
                  setIsStaffModalOpen(false);
                  setEditingStaff(null);
                  setNewStaff({ email: '', displayName: '', role: 'teacher' as any });
                }} 
                className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Họ và tên</label>
                <input 
                  type="text" 
                  value={newStaff.displayName}
                  onChange={e => setNewStaff({...newStaff, displayName: e.target.value})}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white transition-all shadow-inner"
                  placeholder="VD: Nguyễn Văn A"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Email (Không thể đổi)</label>
                <input 
                  type="email" 
                  value={newStaff.email}
                  disabled={!!editingStaff}
                  onChange={e => setNewStaff({...newStaff, email: e.target.value})}
                  className={`w-full p-4 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-inner ${editingStaff ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 dark:text-white'}`}
                  placeholder="VD: gv_a@truong.edu.vn"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Vai trò</label>
                <select 
                  value={newStaff.role}
                  onChange={e => setNewStaff({...newStaff, role: e.target.value as any})}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white transition-all shadow-inner appearance-none"
                >
                  <option value="teacher">Giáo viên</option>
                  <option value="homeroom_teacher">Giáo viên Chủ nhiệm</option>
                  <option value="principal">Ban giám hiệu (Hiệu trưởng/Phó)</option>
                </select>
              </div>
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-800">
                <p className="text-xs text-amber-700 dark:text-amber-400 font-bold">Lưu ý:</p>
                <p className="text-xs text-amber-600 dark:text-amber-500">Mật khẩu đăng nhập mặc định sẽ là "123456"</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => {
                    setIsStaffModalOpen(false);
                    setEditingStaff(null);
                    setNewStaff({ email: '', displayName: '', role: 'teacher' as any });
                  }} 
                  className="flex-1 py-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-white font-black rounded-2xl transition hover:bg-slate-200 active:scale-95"
                >
                  Hủy
                </button>
                <button onClick={handleAddStaff} className="flex-[2] py-4 bg-indigo-600 text-white font-black rounded-2xl transition hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 active:scale-95">
                  {editingStaff ? 'Lưu thay đổi' : 'Xác nhận thêm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isClassModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-slate-800 dark:text-white">Thêm Lớp học mới</h3>
              <button onClick={() => setIsClassModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-full"><X className="w-6 h-6" /></button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Tên lớp</label>
                <input 
                  type="text" 
                  value={newClass.name}
                  onChange={e => setNewClass({...newClass, name: e.target.value})}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white transition-all shadow-inner"
                  placeholder="VD: 1A, 2B..."
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Khối</label>
                <select 
                  value={newClass.grade}
                  onChange={e => setNewClass({...newClass, grade: e.target.value})}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none appearance-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white transition-all shadow-inner"
                >
                  <option>Lớp 1</option>
                  <option>Lớp 2</option>
                  <option>Lớp 3</option>
                  <option>Lớp 4</option>
                  <option>Lớp 5</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Giáo viên Chủ nhiệm</label>
                <select 
                  value={newClass.teacherUid}
                  onChange={e => setNewClass({...newClass, teacherUid: e.target.value})}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none appearance-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white transition-all shadow-inner"
                >
                  <option value="">-- Chọn giáo viên --</option>
                  {staff.filter(s => s.role === 'homeroom_teacher' || s.role === 'teacher').map(t => (
                    <option key={t.uid} value={t.uid}>{t.displayName}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setIsClassModalOpen(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-white font-black rounded-2xl transition hover:bg-slate-200 active:scale-95">Hủy</button>
                <button onClick={handleAddClass} className="flex-[2] py-4 bg-emerald-600 text-white font-black rounded-2xl transition hover:bg-emerald-700 shadow-lg shadow-emerald-500/30 active:scale-95">Tạo lớp ngay</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isDepartmentModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-slate-800 dark:text-white">Thêm Tổ chuyên môn</h3>
              <button onClick={() => setIsDepartmentModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-full"><X className="w-6 h-6" /></button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Tên tổ</label>
                <input 
                  type="text" 
                  value={newDepartment.name}
                  onChange={e => setNewDepartment({...newDepartment, name: e.target.value})}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white transition-all shadow-inner"
                  placeholder="VD: Tổ Tự nhiên, Tổ Xã hội..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setIsDepartmentModalOpen(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-white font-black rounded-2xl transition hover:bg-slate-200 active:scale-95">Hủy</button>
                <button onClick={handleAddDepartment} className="flex-[2] py-4 bg-indigo-600 text-white font-black rounded-2xl transition hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 active:scale-95">Xác nhận tạo</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
