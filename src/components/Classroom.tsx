import React, { useState, useEffect } from 'react';
import { UserPlus, Download, Trash2, BookOpen, Calendar, Clock, Plus, X, Image as ImageIcon, Video, Loader2, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Student, Homework, Game, UserProfile } from '../types';
import { storage, db, auth } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, deleteDoc, collection, getDocs, getDoc, writeBatch } from 'firebase/firestore';
import * as XLSX from 'xlsx';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export default function Classroom({ userProfile, students, setStudents, homework, setHomework, offlineGames }: { userProfile: UserProfile | null, students: Student[], setStudents: any, homework: Homework[], setHomework: any, offlineGames: Game[] }) {
  const [activeTab, setActiveTab] = useState<'students' | 'homework'>('students');
  const [currentClass, setCurrentClass] = useState<any>(null);

  useEffect(() => {
    if (userProfile?.schoolId && userProfile?.classId) {
      loadClassData();
    }
  }, [userProfile]);

  const loadClassData = async () => {
    if (!userProfile?.schoolId || !userProfile?.classId) return;
    try {
      const classDoc = await getDoc(doc(db, 'schools', userProfile.schoolId, 'classes', userProfile.classId));
      if (classDoc.exists()) {
        setCurrentClass(classDoc.data());
        const studentsSnap = await getDocs(collection(db, 'schools', userProfile.schoolId, 'classes', userProfile.classId, 'students'));
        setStudents(studentsSnap.docs.map(doc => doc.data() as Student));
      }
    } catch (error) {
      console.error("Error loading class data:", error);
    }
  };
  
  const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
        isAnonymous: auth.currentUser?.isAnonymous,
        tenantId: auth.currentUser?.tenantId,
        providerInfo: auth.currentUser?.providerData.map(provider => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL
        })) || []
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  };
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isHomeworkModalOpen, setIsHomeworkModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isImportingStudents, setIsImportingStudents] = useState(false);
  const DEFAULT_AVATARS = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Milo',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Willow',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Jasper',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Oscar',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Cleo',
  ];
  const [newStudent, setNewStudent] = useState({ id: '', name: '', user: '', pass: '123456', avatar: DEFAULT_AVATARS[0] });
  const [studentErrors, setStudentErrors] = useState<Record<string, string>>({});
  const [newHomework, setNewHomework] = useState<{
    title: string;
    subject: string;
    dueDate: string;
    gameId: string;
    questions: any[];
  }>({ title: '', subject: 'Toán', dueDate: '', gameId: '', questions: [] });

  const SUBJECTS = ['Toán', 'Tiếng Việt', 'Tiếng Anh', 'Tự nhiên và Xã hội', 'Khoa học', 'Lịch sử và Địa lý', 'Khác'];
  const [homeworkErrors, setHomeworkErrors] = useState<Record<string, string>>({});
  const [showTitleSuggestions, setShowTitleSuggestions] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<any>({
    type: 'multiple_choice',
    text: '',
    options: ['', '', '', ''],
    correct: 0,
    mediaUrl: ''
  });

  const commonHomeworkTitles = [
    "Ôn tập Toán cuối tuần",
    "Bài tập Tiếng Việt chương 1",
    "Kiểm tra Tiếng Anh định kỳ",
    "Ôn tập kiến thức tổng hợp",
    "Bài tập nâng cao cuối kỳ",
    "Thử thách tư duy logic"
  ];

  const validateStudent = () => {
    const errors: Record<string, string> = {};
    const effectiveId = newStudent.id.trim() || newStudent.user.trim();
    
    if (effectiveId && students.some(s => s.id === effectiveId)) errors.id = "Mã HS hoặc tài khoản đã tồn tại";
    if (!newStudent.name.trim()) errors.name = "Họ và tên không được để trống";
    if (!newStudent.user.trim()) errors.user = "Tài khoản không được để trống";
    if (students.some(s => s.user === newStudent.user)) errors.user = "Tài khoản đã tồn tại";
    if (newStudent.pass.length < 6) errors.pass = "Mật khẩu phải từ 6 ký tự";
    
    setStudentErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleStudentNameChange = (name: string) => {
    // Auto-generate username from name: "Nguyen Van A" -> "nguyenvana"
    const suggestedUser = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "");
    
    setNewStudent({ ...newStudent, name, user: suggestedUser });
    if (studentErrors.name) setStudentErrors({ ...studentErrors, name: '' });
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStudent()) return;

    setIsUploading(true);
    const effectiveId = newStudent.id.trim() || newStudent.user.trim();

    try {
      // Check global uniqueness for ID
      const idDoc = await getDoc(doc(db, 'edupro_student_ids', effectiveId));
      if (idDoc.exists()) {
        setStudentErrors(prev => ({ ...prev, id: "Mã HS này đã được sử dụng ở lớp khác" }));
        setIsUploading(false);
        return;
      }

      // Check global uniqueness for User
      const userDoc = await getDoc(doc(db, 'edupro_students', newStudent.user));
      if (userDoc.exists()) {
        setStudentErrors(prev => ({ ...prev, user: "Tài khoản này đã tồn tại" }));
        setIsUploading(false);
        return;
      }

      const student: Student = {
        id: effectiveId,
        name: newStudent.name,
        user: newStudent.user,
        passHash: newStudent.pass, // In real app, hash it
        avatar: newStudent.avatar,
        schoolId: userProfile?.schoolId,
        classId: userProfile?.classId,
        xp: 0,
        level: 1,
        badges: [],
        streak: 0
      };

      if (userProfile?.schoolId && userProfile?.classId) {
        const batch = writeBatch(db);
        
        // 1. Create global lookup for student login
        batch.set(doc(db, 'edupro_students', student.user), {
          teacherUid: auth.currentUser?.uid,
          schoolId: userProfile.schoolId,
          classId: userProfile.classId,
          passHash: student.passHash,
          studentName: student.name
        });

        // 2. Create global lookup for student ID uniqueness
        batch.set(doc(db, 'edupro_student_ids', student.id), {
          user: student.user,
          schoolId: userProfile.schoolId,
          classId: userProfile.classId
        });
        
        // 3. Save student to class collection
        batch.set(doc(db, 'schools', userProfile.schoolId, 'classes', userProfile.classId, 'students', student.id), student);
        
        await batch.commit();
      }

      // Update local state
      setStudents([...students, student]);
      setIsStudentModalOpen(false);
      setNewStudent({ id: '', name: '', user: '', pass: '123456', avatar: DEFAULT_AVATARS[0] });
    } catch (error) {
      console.error("Error adding student:", error);
      alert("Lỗi khi tạo tài khoản học sinh. Vui lòng thử lại!");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    setIsUploading(true);
    try {
      const file = e.target.files[0];
      const storageRef = ref(storage, `homework_media/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      setCurrentQuestion({ ...currentQuestion, mediaUrl: url });
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Tải file thất bại. Vui lòng thử lại!");
    } finally {
      setIsUploading(false);
    }
  };

  const addQuestionToHomework = () => {
    if (!currentQuestion.text) return;
    setNewHomework({
      ...newHomework,
      questions: [...newHomework.questions, { ...currentQuestion, id: Date.now().toString() }]
    });
    setCurrentQuestion({
      type: 'multiple_choice',
      text: '',
      options: ['', '', '', ''],
      correct: 0,
      mediaUrl: ''
    });
  };

  const validateHomework = () => {
    const errors: Record<string, string> = {};
    if (!newHomework.title.trim()) errors.title = "Tiêu đề không được để trống";
    if (!newHomework.dueDate) {
      errors.dueDate = "Vui lòng chọn hạn nộp";
    } else {
      const selectedDate = new Date(newHomework.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) errors.dueDate = "Hạn nộp không được ở quá khứ";
    }
    
    setHomeworkErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateHomework()) return;
    
    let questions = [...newHomework.questions];
    
    // If a game is selected, merge its questions
    if (newHomework.gameId) {
      const selectedGame = offlineGames.find(g => g.id === newHomework.gameId);
      if (selectedGame) {
        questions = [...questions, ...selectedGame.questionsList];
      }
    }

    if (questions.length === 0) {
      alert("Vui lòng thêm ít nhất một câu hỏi hoặc chọn trò chơi!");
      return;
    }

    const hw: Homework = {
      id: Date.now().toString(),
      title: newHomework.title,
      dueDate: newHomework.dueDate,
      mode: 'home',
      questions: questions
    };

    const teacherUid = auth.currentUser?.uid;
    if (teacherUid) {
      try {
        await setDoc(doc(db, 'teachers', teacherUid, 'homework', hw.id), hw);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `teachers/${teacherUid}/homework/${hw.id}`);
      }
    }

    setHomework([...homework, hw]);
    setIsHomeworkModalOpen(false);
    setNewHomework({ title: '', subject: 'Toán', dueDate: '', gameId: '', questions: [] });
  };

  const updateHomeworkFeedback = async (hwId: string, studentUid: string, fbk: string) => {
    const hw = homework.find(h => h.id === hwId);
    if (!hw || !userProfile?.schoolId || !userProfile?.classId) return;

    const newFeedback = { ...(hw.feedback || {}), [studentUid]: fbk };
    try {
      await setDoc(doc(db, 'schools', userProfile.schoolId, 'classes', userProfile.classId, 'homework', hwId), { feedback: newFeedback }, { merge: true });
      setHomework(homework.map(h => h.id === hwId ? { ...h, feedback: newFeedback } : h));
    } catch (e) {
      console.error(e);
    }
  };

  const exportToExcel = () => {
    if (students.length === 0) {
      alert("Không có dữ liệu học sinh để xuất!");
      return;
    }

    const data = students.map((s: any, index: number) => ({
      'STT': index + 1,
      'Họ và tên': s.name,
      'Tên đăng nhập': s.user,
      'Mật khẩu': s.passHash
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sách học sinh");

    const wscols = [
      { wch: 5 },
      { wch: 25 },
      { wch: 15 },
      { wch: 15 }
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `Danh_sach_hoc_sinh_${Date.now()}.xlsx`);
  };

  const downloadStudentTemplate = () => {
    const template = [
      { "Họ và tên": "Nguyễn Văn A", "Tài khoản": "hs001", "Mật khẩu": "123456" },
      { "Họ và tên": "Trần Thị B", "Tài khoản": "hs002", "Mật khẩu": "123456" }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "Mau_Danh_Sach_Hoc_Sinh.xlsx");
  };

  const handleStudentImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userProfile?.schoolId || !userProfile?.classId) return;

    setIsImportingStudents(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        const importedStudents: Student[] = [];
        const batch = writeBatch(db);
        let duplicateCount = 0;

        for (const row of data) {
          // Normalize keys
          const normalizedRow: any = {};
          Object.keys(row).forEach(key => {
            normalizedRow[key.trim().toLowerCase()] = row[key];
          });

          const name = normalizedRow["họ và tên"] || normalizedRow["tên"] || normalizedRow["name"] || normalizedRow["displayname"];
          const user = normalizedRow["tài khoản"] || normalizedRow["user"] || normalizedRow["username"];
          const id = normalizedRow["mã hs"] || normalizedRow["id"] || normalizedRow["mã học sinh"] || user;
          const pass = normalizedRow["mật khẩu"] || normalizedRow["pass"] || normalizedRow["password"] || "123456";

          if (name && user) {
            const studentId = String(id);
            const studentUser = String(user);
            
            // Check uniqueness
            const idDoc = await getDoc(doc(db, 'edupro_student_ids', studentId));
            const userDoc = await getDoc(doc(db, 'edupro_students', studentUser));
            
            if (idDoc.exists() || userDoc.exists()) {
              duplicateCount++;
              continue; // Skip duplicates
            }

            const student: Student = {
              id: studentId,
              name: String(name),
              user: studentUser,
              passHash: String(pass),
              avatar: DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)],
              schoolId: userProfile.schoolId,
              classId: userProfile.classId,
              xp: 0,
              level: 1,
              badges: [],
              streak: 0
            };
            
            // Global lookup
            batch.set(doc(db, 'edupro_students', student.user), {
              teacherUid: auth.currentUser?.uid,
              schoolId: userProfile.schoolId,
              classId: userProfile.classId,
              passHash: student.passHash,
              studentName: student.name
            });

            // Global ID lookup
            batch.set(doc(db, 'edupro_student_ids', student.id), {
              user: student.user,
              schoolId: userProfile.schoolId,
              classId: userProfile.classId
            });

            // Class collection
            batch.set(doc(db, 'schools', userProfile.schoolId, 'classes', userProfile.classId, 'students', student.id), student);
            importedStudents.push(student);
          }
        }

        if (importedStudents.length > 0) {
          await batch.commit();
          setStudents(prev => [...prev, ...importedStudents]);
        }
        
        if (duplicateCount > 0) {
          alert(`Đã nhập thành công ${importedStudents.length} học sinh. Bỏ qua ${duplicateCount} học sinh do trùng mã HS hoặc tài khoản.`);
        } else {
          alert(`Đã nhập thành công ${importedStudents.length} học sinh!`);
        }
      } catch (error) {
        console.error("Error importing students:", error);
        alert("Lỗi khi nhập dữ liệu từ Excel!");
      } finally {
        setIsImportingStudents(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const [studentToDeleteId, setStudentToDeleteId] = useState<string | null>(null);

  const deleteStudent = async (id: string) => {
    const studentToDelete = students.find(s => s.id === id);
    if (!studentToDelete || !userProfile?.schoolId || !userProfile?.classId) return;

    try {
      const batch = writeBatch(db);
      // Delete global lookup
      batch.delete(doc(db, 'edupro_students', studentToDelete.user));
      // Delete global ID lookup
      batch.delete(doc(db, 'edupro_student_ids', studentToDelete.id));
      // Delete from class collection
      batch.delete(doc(db, 'schools', userProfile.schoolId, 'classes', userProfile.classId, 'students', id));
      
      await batch.commit();
      setStudents(students.filter(s => s.id !== id));
      setStudentToDeleteId(null);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `edupro_students/${studentToDelete.user}`);
    }
  };

  const deleteHomework = async (id: string) => {
    const teacherUid = auth.currentUser?.uid;
    if (teacherUid) {
      try {
        await deleteDoc(doc(db, 'teachers', teacherUid, 'homework', id));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `teachers/${teacherUid}/homework/${id}`);
      }
    }
    setHomework(homework.filter(h => h.id !== id));
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden h-full flex flex-col">
      <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between shrink-0">
        <div className="flex bg-slate-200/50 dark:bg-slate-700/50 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'students' ? 'bg-white dark:bg-slate-600 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
          >
            Danh sách Học sinh
          </button>
          <button 
            onClick={() => setActiveTab('homework')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'homework' ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
          >
            Giao bài tập
          </button>
        </div>
        
        <div className="flex gap-2">
          {activeTab === 'students' ? (
            <>
              <button 
                onClick={downloadStudentTemplate}
                className="px-3 py-2 bg-white dark:bg-slate-800 border text-slate-700 dark:text-slate-300 rounded-lg text-sm font-bold flex items-center gap-1"
              >
                <Download className="w-4 h-4" /> Mẫu Excel
              </button>
              <label className="px-3 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg text-sm font-bold flex items-center gap-1 cursor-pointer hover:bg-emerald-100 transition">
                {isImportingStudents ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                Nhập Excel
                <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleStudentImport} disabled={isImportingStudents} />
              </label>
              <button 
                onClick={exportToExcel}
                className="px-3 py-2 bg-white dark:bg-slate-800 border text-slate-700 dark:text-slate-300 rounded-lg text-sm font-bold flex items-center gap-1"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> Xuất Excel
              </button>
              <button onClick={() => setIsStudentModalOpen(true)} className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold flex items-center gap-1">
                <UserPlus className="w-4 h-4" /> Thêm học sinh
              </button>
            </>
          ) : (
            <button onClick={() => setIsHomeworkModalOpen(true)} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold flex items-center gap-1">
              <Plus className="w-4 h-4" /> Giao bài mới
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="flex-1 overflow-auto p-6"
        >
          {activeTab === 'students' ? (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3">Ảnh</th>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Họ và Tên</th>
                <th className="px-4 py-3">Tài khoản</th>
                <th className="px-4 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {students.map(s => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-4 py-4">
                    <img 
                      src={s.avatar || DEFAULT_AVATARS[0]} 
                      alt={s.name} 
                      className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200" 
                      referrerPolicy="no-referrer"
                    />
                  </td>
                  <td className="px-4 py-4">{s.id}</td>
                  <td className="px-4 py-4 font-bold text-slate-700 dark:text-slate-200">{s.name}</td>
                  <td className="px-4 py-4">{s.user}</td>
                  <td className="px-4 py-4 text-right">
                    <button onClick={() => setStudentToDeleteId(s.id)} className="text-red-500 bg-red-50 dark:bg-red-900/30 px-3 py-1 rounded-lg font-medium hover:bg-red-100 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-slate-400">Chưa có học sinh nào trong lớp.</td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {homework.map(hw => (
              <div key={hw.id} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 relative group">
                <button onClick={() => deleteHomework(hw.id)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-800 dark:text-white truncate">{hw.title}</h4>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                       <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 px-2 py-0.5 rounded font-black uppercase">{hw.subject || 'Toán'}</span>
                       <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-bold"><Calendar className="w-3 h-3" /> {hw.dueDate}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <div className="flex gap-2">
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded">Đang giao</span>
                    <button 
                      onClick={() => {
                        const fbk = prompt("Gửi lời nhận xét cho cả lớp:", hw.feedback?.[students[0]?.id] || '');
                        if (fbk !== null && students.length > 0) {
                          students.forEach(s => updateHomeworkFeedback(hw.id, s.id, fbk));
                        }
                      }}
                      className="text-xs font-bold text-amber-600 hover:bg-amber-50 p-1 rounded"
                    >
                      Nhận xét
                    </button>
                  </div>
                  <button className="text-xs font-bold text-blue-600 hover:underline">Chi tiết</button>
                </div>
              </div>
            ))}
            {homework.length === 0 && (
              <div className="col-span-full py-20 text-center text-slate-400">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Chưa có bài tập nào được giao.</p>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>

      {studentToDeleteId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center border border-slate-200 dark:border-slate-700"
          >
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Xác nhận xóa?</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium leading-relaxed">
              Dữ liệu của học sinh <span className="font-bold text-slate-800 dark:text-slate-200">{students.find(s => s.id === studentToDeleteId)?.name}</span> sẽ bị xóa vĩnh viễn và không thể khôi phục.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setStudentToDeleteId(null)}
                className="py-3.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 font-bold rounded-2xl transition"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={() => deleteStudent(studentToDeleteId)}
                className="py-3.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl shadow-lg shadow-red-500/20 transition"
              >
                Xác nhận xóa
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {isStudentModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 border-b pb-3">Thêm học sinh mới</h3>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div className="flex flex-col items-center gap-3 mb-4">
                <label className="text-xs font-bold text-slate-500 uppercase">Chọn Avatar</label>
                <div className="flex flex-wrap justify-center gap-2">
                  {DEFAULT_AVATARS.map((av, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNewStudent({ ...newStudent, avatar: av })}
                      className={`p-0.5 rounded-full border-2 transition ${newStudent.avatar === av ? 'border-emerald-500 bg-emerald-50' : 'border-transparent hover:border-slate-200'}`}
                    >
                      <img src={av} alt="avatar" className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <input 
                  type="text" 
                  placeholder="Mã HS (Nếu có)" 
                  value={newStudent.id}
                  onChange={e => {
                    setNewStudent({...newStudent, id: e.target.value});
                    if (studentErrors.id) setStudentErrors({...studentErrors, id: ''});
                  }}
                  className={`w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-xl outline-none transition-colors ${studentErrors.id ? 'border-red-500 focus:border-red-500' : 'focus:border-emerald-500'}`} 
                />
                {studentErrors.id && <p className="text-red-500 text-xs mt-1 ml-1">{studentErrors.id}</p>}
              </div>
              
              <div>
                <input 
                  type="text" 
                  placeholder="Họ và tên" 
                  value={newStudent.name}
                  onChange={e => handleStudentNameChange(e.target.value)}
                  className={`w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-xl outline-none transition-colors ${studentErrors.name ? 'border-red-500 focus:border-red-500' : 'focus:border-emerald-500'}`} 
                />
                {studentErrors.name && <p className="text-red-500 text-xs mt-1 ml-1">{studentErrors.name}</p>}
              </div>

              <div>
                <input 
                  type="text" 
                  placeholder="Tài khoản (Tự động tạo)" 
                  value={newStudent.user}
                  onChange={e => {
                    setNewStudent({...newStudent, user: e.target.value});
                    if (studentErrors.user) setStudentErrors({...studentErrors, user: ''});
                  }}
                  className={`w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-xl outline-none transition-colors ${studentErrors.user ? 'border-red-500 focus:border-red-500' : 'focus:border-emerald-500'}`} 
                />
                {studentErrors.user && <p className="text-red-500 text-xs mt-1 ml-1">{studentErrors.user}</p>}
              </div>

              <div>
                <input 
                  type="text" 
                  placeholder="Mật khẩu (Mặc định: 123456)"
                  value={newStudent.pass}
                  onChange={e => {
                    setNewStudent({...newStudent, pass: e.target.value});
                    if (studentErrors.pass) setStudentErrors({...studentErrors, pass: ''});
                  }}
                  className={`w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-xl outline-none transition-colors ${studentErrors.pass ? 'border-red-500 focus:border-red-500' : 'focus:border-emerald-500'}`} 
                />
                {studentErrors.pass && <p className="text-red-500 text-xs mt-1 ml-1">{studentErrors.pass}</p>}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsStudentModalOpen(false)} className="px-5 py-2.5 bg-slate-100 dark:bg-slate-700 font-bold rounded-xl">Hủy</button>
                <button type="submit" className="px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-xl">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isHomeworkModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="text-xl font-bold">Giao bài tập mới</h3>
              <button onClick={() => setIsHomeworkModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleAddHomework} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-sm font-bold mb-1">Tiêu đề bài tập</label>
                  <input 
                    type="text" 
                    placeholder="VD: Ôn tập Toán cuối tuần" 
                    value={newHomework.title}
                    onFocus={() => setShowTitleSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowTitleSuggestions(false), 200)}
                    onChange={e => {
                      setNewHomework({...newHomework, title: e.target.value});
                      if (homeworkErrors.title) setHomeworkErrors({...homeworkErrors, title: ''});
                    }}
                    className={`w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-xl outline-none transition-colors ${homeworkErrors.title ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'}`} 
                  />
                  {homeworkErrors.title && <p className="text-red-500 text-xs mt-1 ml-1">{homeworkErrors.title}</p>}
                  
                  {showTitleSuggestions && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden">
                      {commonHomeworkTitles
                        .filter(t => t.toLowerCase().includes(newHomework.title.toLowerCase()))
                        .map((suggestion, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setNewHomework({...newHomework, title: suggestion});
                              setShowTitleSuggestions(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Hạn nộp</label>
                  <input 
                    type="date" 
                    value={newHomework.dueDate}
                    onChange={e => {
                      setNewHomework({...newHomework, dueDate: e.target.value});
                      if (homeworkErrors.dueDate) setHomeworkErrors({...homeworkErrors, dueDate: ''});
                    }}
                    className={`w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-xl outline-none transition-colors ${homeworkErrors.dueDate ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'}`} 
                  />
                  {homeworkErrors.dueDate && <p className="text-red-500 text-xs mt-1 ml-1">{homeworkErrors.dueDate}</p>}
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800">
                <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Thêm câu hỏi mới
                </h4>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <button 
                      type="button"
                      onClick={() => setCurrentQuestion({...currentQuestion, type: 'multiple_choice'})}
                      className={`flex-1 py-2 rounded-lg font-bold text-sm border-2 transition ${currentQuestion.type === 'multiple_choice' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}
                    >
                      Trắc nghiệm
                    </button>
                    <button 
                      type="button"
                      onClick={() => setCurrentQuestion({...currentQuestion, type: 'essay'})}
                      className={`flex-1 py-2 rounded-lg font-bold text-sm border-2 transition ${currentQuestion.type === 'essay' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}
                    >
                      Tự luận
                    </button>
                  </div>

                  <textarea 
                    placeholder="Nhập câu hỏi tại đây..." 
                    value={currentQuestion.text}
                    onChange={e => setCurrentQuestion({...currentQuestion, text: e.target.value})}
                    className="w-full p-3 bg-white dark:bg-slate-900 border rounded-xl outline-none focus:border-blue-500 min-h-[80px]"
                  />

                  <div className="flex gap-2 items-center">
                    <div className="flex-1 p-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-500 truncate">
                      {currentQuestion.mediaUrl ? currentQuestion.mediaUrl : "Chưa có file đính kèm"}
                    </div>
                    <input 
                      type="file" 
                      id="hw-media-upload" 
                      className="hidden" 
                      accept="image/*,video/mp4" 
                      onChange={handleFileUpload} 
                    />
                    <button 
                      type="button" 
                      disabled={isUploading}
                      onClick={() => document.getElementById('hw-media-upload')?.click()}
                      className="p-2.5 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 transition flex items-center gap-2"
                    >
                      {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5 text-slate-500" />}
                      <span className="text-xs font-bold hidden sm:inline">Tải lên</span>
                    </button>
                    {currentQuestion.mediaUrl && (
                      <button 
                        type="button"
                        onClick={() => setCurrentQuestion({...currentQuestion, mediaUrl: ''})}
                        className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  {currentQuestion.type === 'multiple_choice' && (
                    <div className="grid grid-cols-2 gap-3">
                      {currentQuestion.options.map((opt: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input 
                            type="radio" 
                            name="correct-opt" 
                            checked={currentQuestion.correct === idx}
                            onChange={() => setCurrentQuestion({...currentQuestion, correct: idx})}
                          />
                          <input 
                            type="text" 
                            placeholder={`Đáp án ${idx + 1}`} 
                            value={opt}
                            onChange={e => {
                              const newOpts = [...currentQuestion.options];
                              newOpts[idx] = e.target.value;
                              setCurrentQuestion({...currentQuestion, options: newOpts});
                            }}
                            className="flex-1 p-2 bg-white dark:bg-slate-900 border rounded-lg outline-none text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <button 
                    type="button"
                    onClick={addQuestionToHomework}
                    className="w-full py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-xl font-bold hover:bg-slate-900 transition"
                  >
                    Thêm vào danh sách ({newHomework.questions.length} câu đã có)
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t">
                <label className="block text-sm font-bold mb-2">Hoặc chọn từ kho trò chơi</label>
                <select 
                  value={newHomework.gameId}
                  onChange={e => setNewHomework({...newHomework, gameId: e.target.value})}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-xl outline-none focus:border-blue-500"
                >
                  <option value="">-- Chọn trò chơi --</option>
                  {offlineGames.map(g => (
                    <option key={g.id} value={g.id}>{g.title}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsHomeworkModalOpen(false)} className="px-5 py-2.5 bg-slate-100 dark:bg-slate-700 font-bold rounded-xl">Hủy</button>
                <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 dark:shadow-none">Giao bài ngay</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
