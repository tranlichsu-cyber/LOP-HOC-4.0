import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Sparkles, 
  FilePlus2, 
  Gamepad2, 
  Users, 
  BookOpenCheck, 
  Joystick, 
  LogOut, 
  Moon, 
  Sun, 
  Bell,
  Menu,
  X,
  ShieldCheck,
  Globe,
  GraduationCap,
  Trophy,
  Flame,
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  auth, 
  db, 
  getDocFromServer,
  onAuthStateChanged, 
  signOut, 
  signInAnonymously, 
  updatePassword,
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  deleteDoc
} from './firebase';
import { UserRole, UserProfile, School, Class, Game, Student, Homework, Lesson, Worksheet as WorksheetType } from './types';
import { calculateLevel, checkAwards } from './lib/gamification';

// Views
import Dashboard from './components/Dashboard';
import PrincipalDashboard from './components/PrincipalDashboard';
import ParentDashboard from './components/ParentDashboard';
import LessonAI from './components/LessonAI';
import Games from './components/Games';
import Classroom from './components/Classroom';
import SchoolAdmin from './components/SchoolAdmin';
import StudentHomework from './components/StudentHomework';
import StudentGames from './components/StudentGames';
import ResourceLibrary from './components/ResourceLibrary';
import TestGeneratorAI from './components/TestGeneratorAI';
import Worksheet from './components/Worksheet';
import Login from './components/Login';

import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole>('teacher');
  const [school, setSchool] = useState<School | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [teacherUid, setTeacherUid] = useState<string | null>(null);
  const [studentProfile, setStudentProfile] = useState<Student | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const avatarInputRef = React.useRef<HTMLInputElement>(null);

  // Data State
  const [students, setStudents] = useState<Student[]>([]);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [worksheets, setWorksheets] = useState<WorksheetType[]>([]);
  const [offlineGames, setOfflineGames] = useState<Game[]>([
    { 
        id: 'g1', title: 'Toán học vui nhộn', type: 'math',
        questionsList: [
            { id: 'q1', type: 'multiple_choice', text: '5 x 5 = ?', options: ['15', '20', '25', '30'], correct: 2 },
            { id: 'q2', type: 'essay', text: 'Em hãy viết phép tính trừ có kết quả bằng 10.', options: [], correct: 0 }
        ]
    },
    {
        id: 'g3', title: 'Ai là Triệu phú: Lịch sử VN', type: 'millionaire',
        questionsList: [
            { id: 'm1', type: 'multiple_choice', text: 'Vị vua nào lập ra nhà Lý?', mediaUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/48/Statue_of_L%C3%BD_Th%C3%A1i_T%E1%BB%95_2.jpg', options: ['Lý Thái Tổ', 'Lý Thánh Tông', 'Lý Nam Đế', 'Lý Nhân Tông'], correct: 0 },
            { id: 'm2', type: 'multiple_choice', text: 'Bản Tuyên ngôn Độc lập được Bác Hồ đọc tại đâu?', mediaUrl: 'https://www.youtube.com/watch?v=1r05dK_wRkE', options: ['Bến Nhà Rồng', 'Quảng trường Ba Đình', 'Dinh Độc Lập', 'Pác Bó'], correct: 1 },
            { id: 'm3', type: 'multiple_choice', text: 'Chiến thắng Bạch Đằng năm 938 do ai lãnh đạo?', options: ['Trần Hưng Đạo', 'Lê Lợi', 'Ngô Quyền', 'Quang Trung'], correct: 2 }
        ]
    },
    {
        id: 'g4', title: 'Nhà Thông Thái AI', type: 'wise_one',
        questionsList: [] // AI will generate these
    }
  ]);
  const [liveGames, setLiveGames] = useState<Game[]>([
    { 
        id: 'l1', title: 'Đua top Rừng Xanh', type: 'race',
        questionsList: [
            { id: 'q1', type: 'multiple_choice', text: 'Con vật nào kêu Gâu Gâu?', options: ['Con Mèo', 'Con Chó', 'Con Gà', 'Con Lợn'], correct: 1 }
        ]
    }
  ]);

  useEffect(() => {
    if (role === 'school_admin' as any) {
      setActiveTab('school-admin');
    }
  }, [role]);

  useEffect(() => {
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  }, [activeTab]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        if (!currentUser.isAnonymous) {
          // Fetch user profile from Firestore
          try {
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            const userEmail = currentUser.email?.toLowerCase();
            const isAdminEmail = userEmail === 'tranlichsu@gmail.com' || userEmail === 'tienganhltt@thainguyen.edu.vn';

            let currentRole: UserRole = isAdminEmail ? 'school_admin' : 'teacher';
            
            if (userDoc.exists()) {
              const profile = userDoc.data() as UserProfile;
              
              // Auto-upgrade to school_admin if email matches
              if (isAdminEmail && profile.role !== 'school_admin') {
                profile.role = 'school_admin';
                await setDoc(doc(db, 'users', currentUser.uid), profile, { merge: true });
              }
              
              setUserProfile(profile);
              currentRole = profile.role;

              if (profile.schoolId) {
                const schoolDoc = await getDoc(doc(db, 'schools', profile.schoolId));
                if (schoolDoc.exists()) {
                  setSchool(schoolDoc.data() as School);
                }
              }
            } else {
              // Create default profile for new user
              const newProfile: UserProfile = {
                uid: currentUser.uid,
                email: currentUser.email || '',
                displayName: currentUser.displayName || '',
                role: isAdminEmail ? 'school_admin' : 'teacher'
              };
              await setDoc(doc(db, 'users', currentUser.uid), newProfile);
              setUserProfile(newProfile);
              currentRole = newProfile.role;
            }
            
            setRole(currentRole);
            
            document.body.classList.remove('role-teacher', 'role-student', 'role-school_admin', 'role-admin');
            document.body.classList.add(`role-${currentRole}`);
          } catch (error) {
            console.error("Error fetching user profile:", error);
          }
          
          setTeacherUid(currentUser.uid);
          await loadData(currentUser.uid);
        } else {
          setRole('student');
          document.body.classList.remove('role-teacher', 'role-student', 'role-admin');
          document.body.classList.add('role-student');
        }
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const loadData = async (uid: string) => {
    if (!uid) return;
    setConnectionError(null);
    try {
      console.log("Attempting to load data for UID:", uid);
      
      // Use Promise.all for faster loading
      const [studentsSnap, homeworkSnap, worksheetsSnap, gamesSnap] = await Promise.all([
        getDocs(collection(db, 'teachers', uid, 'students')),
        getDocs(collection(db, 'teachers', uid, 'homework')),
        getDocs(collection(db, 'teachers', uid, 'worksheets')),
        getDocs(collection(db, 'teachers', uid, 'games'))
      ]);

      setStudents(studentsSnap.docs.map(doc => doc.data() as Student));
      setHomework(homeworkSnap.docs.map(doc => doc.data() as Homework));
      setWorksheets(worksheetsSnap.docs.map(doc => doc.data() as WorksheetType));
      
      const loadedGames = gamesSnap.docs.map(doc => doc.data() as Game);
      console.log("Loaded games count:", loadedGames.length);
      setOfflineGames(loadedGames.filter(g => g.type !== 'race'));
      setLiveGames(loadedGames.filter(g => g.type === 'race'));

      console.log("Data loaded successfully");
    } catch (e: any) {
      console.error("Firestore Load Error:", e);
      setConnectionError(`Lỗi tải dữ liệu: ${e.message || "Vui lòng kiểm tra quyền truy cập hoặc kết nối mạng."}`);
    }
  };

  // Remove automatic saveData useEffect to prevent unnecessary writes
  // Components will now handle their own individual writes

  const handleLogout = async () => {
    await signOut(auth);
    window.location.reload();
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !newPassword) return;
    if (newPassword.length < 6) {
      setPasswordStatus({ type: 'error', message: 'Mật khẩu phải ít nhất 6 ký tự!' });
      return;
    }

    setIsChangingPassword(true);
    setPasswordStatus({ type: null, message: '' });

    try {
      await updatePassword(auth.currentUser, newPassword);
      setPasswordStatus({ type: 'success', message: 'Đổi mật khẩu thành công!' });
      setNewPassword('');
      setTimeout(() => setShowPasswordModal(false), 2000);
    } catch (error: any) {
      console.error("Change password error:", error);
      if (error.code === 'auth/requires-recent-login') {
        setPasswordStatus({ type: 'error', message: 'Vui lòng đăng xuất và đăng nhập lại để thực hiện thay đổi này vì lý do bảo mật.' });
      } else {
        setPasswordStatus({ type: 'error', message: error.message || 'Lỗi đổi mật khẩu. Vui lòng thử lại!' });
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  if (!isAuthReady) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return <Login onStudentLogin={async (studentId, password) => {
      try {
        // 1. Find the student in the global lookup collection
        const studentRef = doc(db, 'edupro_students', studentId);
        const studentSnap = await getDocFromServer(studentRef);
        
        if (studentSnap.exists()) {
          const studentData = studentSnap.data() as any;
          
          if (studentData.passHash === password) {
            // 1. Sign in anonymously FIRST to have a Firebase user session for security rules
            await signInAnonymously(auth);

            let loadedHomework: Homework[] = [];
            let loadedGames: Game[] = [];

            if (studentData.schoolId && studentData.classId) {
              // New structure
              const homeworkSnap = await getDocs(collection(db, 'schools', studentData.schoolId, 'classes', studentData.classId, 'homework'));
              const gamesSnap = await getDocs(collection(db, 'schools', studentData.schoolId, 'classes', studentData.classId, 'games'));
              loadedHomework = homeworkSnap.docs.map(doc => doc.data() as Homework);
              loadedGames = gamesSnap.docs.map(doc => doc.data() as Game);
            } else if (studentData.teacherUid) {
              // Legacy structure
              const homeworkSnap = await getDocs(collection(db, 'teachers', studentData.teacherUid, 'homework'));
              const gamesSnap = await getDocs(collection(db, 'teachers', studentData.teacherUid, 'games'));
              loadedHomework = homeworkSnap.docs.map(doc => doc.data() as Homework);
              loadedGames = gamesSnap.docs.map(doc => doc.data() as Game);
            }

            setRole('student');
            setTeacherUid(studentData.teacherUid || null);
            setStudentProfile({
              id: studentId,
              name: studentData.studentName,
              user: studentId,
              passHash: password,
              avatar: studentData.avatar,
              schoolId: studentData.schoolId,
              classId: studentData.classId,
              xp: studentData.xp || 0,
              level: studentData.level || 1,
              badges: studentData.badges || [],
              streak: studentData.streak || 0
            });
            setStudents([]); 
            setHomework(loadedHomework);
            setOfflineGames(loadedGames.filter(g => g.type !== 'race'));
            setLiveGames(loadedGames.filter(g => g.type === 'race'));
            return { success: true };
          } else {
            return { success: false, message: "Sai mật khẩu học sinh!" };
          }
        } else {
          return { success: false, message: "ID học sinh không tồn tại!" };
        }
      } catch (e) {
        console.error("Student login error:", e);
        return { success: false, message: "Lỗi kết nối. Vui lòng thử lại!" };
      }
    }} />;
  }

  const awardStudentXP = async (amount: number) => {
    if (!studentProfile || !auth.currentUser) return;

    const newXP = (studentProfile.xp || 0) + amount;
    const newLevel = calculateLevel(newXP);
    
    // Check for badges
    const newBadges = checkAwards(studentProfile, { type: 'complete_game' });
    const updatedBadges = [...(studentProfile.badges || [])];
    
    newBadges.forEach(nb => {
      if (!updatedBadges.find(ub => ub.id === nb.id)) {
        updatedBadges.push(nb);
      }
    });

    const updatedProfile = {
      ...studentProfile,
      xp: newXP,
      level: newLevel,
      badges: updatedBadges
    };

    setStudentProfile(updatedProfile);

    // Persist to Firestore
    try {
      const studentClassRef = doc(db, 'schools', studentProfile.schoolId || '', 'classes', studentProfile.classId || '', 'students', studentProfile.id);
      await setDoc(studentClassRef, { xp: newXP, level: newLevel, badges: updatedBadges }, { merge: true });
    } catch (e) {
      console.error("Error awarding XP:", e);
    }
  };

  const updateStudentProfile = async (updatedData: Partial<Student>) => {
    if (!studentProfile) return;

    const updatedProfile = { ...studentProfile, ...updatedData };
    setStudentProfile(updatedProfile);

    try {
      // 1. Update in lookup collection
      await setDoc(doc(db, 'edupro_students', studentProfile.id), updatedData, { merge: true });
      
      // 2. Update in class collection if exists
      if (studentProfile.schoolId && studentProfile.classId) {
        await setDoc(doc(db, 'schools', studentProfile.schoolId, 'classes', studentProfile.classId, 'students', studentProfile.id), updatedData, { merge: true });
      }
    } catch (e) {
      console.error("Error updating student profile:", e);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUpdatingAvatar(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        
        if (role === 'student' && studentProfile) {
          updateStudentProfile({ avatar: base64 });
        } else if (userProfile) {
          const updatedProfile = { ...userProfile, avatar: base64 };
          setUserProfile(updatedProfile);
          await setDoc(doc(db, 'users', user?.uid), { avatar: base64 }, { merge: true });
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error updating avatar:", error);
      alert("Lỗi khi cập nhật ảnh đại diện!");
    } finally {
      setIsUpdatingAvatar(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': 
        if (role === 'principal') return <PrincipalDashboard schoolStats={{ totalStudents: 500, totalTeachers: 45, totalClasses: 20, avgCompletionRate: 82, activeSessions: 12 }} />;
        if (role === 'parent') return <ParentDashboard childrenList={students.filter(s => userProfile?.studentIds?.includes(s.id))} homeworkList={homework} />;
        return <Dashboard 
          role={role} 
          stats={{ students: students.length, games: offlineGames.length + liveGames.length }} 
          studentsList={students} 
          homeworkList={homework} 
          studentProfile={studentProfile} 
          onUpdateStudentProfile={updateStudentProfile}
        />;
      
      case 'school-admin': return userProfile ? <SchoolAdmin userProfile={userProfile} /> : null;
      case 'lesson-ai': return <LessonAI />;
      case 'worksheet': return <Worksheet />;
      case 'test-ai': return <TestGeneratorAI />;
      case 'games': return <Games offlineGames={offlineGames} liveGames={liveGames} setOfflineGames={setOfflineGames} setLiveGames={setLiveGames} students={students} />;
      case 'classroom': return <Classroom userProfile={userProfile} students={students} setStudents={setStudents} homework={homework} setHomework={setHomework} offlineGames={offlineGames} />;
      case 'resource-library': return userProfile ? <ResourceLibrary userProfile={userProfile} /> : null;
      case 'student-homework': return <StudentHomework homework={homework} />;
      case 'student-games': return <StudentGames offlineGames={offlineGames} studentProfile={studentProfile} onCompleteGame={() => awardStudentXP(100)} />;
      default: return <Dashboard 
        role={role} 
        stats={{ students: students.length, games: offlineGames.length + liveGames.length }} 
        studentsList={students} 
        homeworkList={homework} 
        studentProfile={studentProfile} 
        onUpdateStudentProfile={updateStudentProfile}
      />;
    }
  };

  return (
    <div className={`h-screen flex overflow-hidden transition-colors duration-500 relative ${role === 'student' ? 'bg-amber-50/30' : 'bg-slate-50 dark:bg-slate-950'}`}>
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20 dark:opacity-10">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-purple-400 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -right-24 w-80 h-80 bg-blue-400 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute -bottom-24 left-1/3 w-64 h-64 bg-emerald-400 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        ${isSidebarOpen ? 'w-72 translate-x-0' : 'w-20 -translate-x-full md:translate-x-0'} 
        fixed md:relative h-full ${role === 'student' ? 'bg-white/90 border-r-4 border-indigo-100 shadow-2xl backdrop-blur-md' : 'bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-700/50 shadow-xl'} flex-col transition-all duration-500 z-50 flex
      `}>
        <div className={`p-8 flex items-center gap-3 ${role === 'student' ? 'border-b-4 border-indigo-50' : 'border-b border-slate-100/50 dark:border-slate-700/50'}`}>
          <div className={`w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-lg transform hover:rotate-6 transition-transform shrink-0 overflow-hidden border-2 border-indigo-100`}>
            <img 
              src="school-logo.png" 
              alt="Logo Trường Tiểu học Lý Tự Trọng" 
              className="w-full h-full object-contain p-0.5" 
            />
          </div>
          {isSidebarOpen && (
            <motion.h1 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`text-2xl font-black tracking-tight ${role === 'student' ? 'text-indigo-900' : 'text-slate-800 dark:text-white'}`}
            >
              Lý Tự Trọng
            </motion.h1>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-3 overflow-y-auto">
          <NavItem 
            icon={<LayoutDashboard />} 
            label="Tổng quan" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')}
            collapsed={!isSidebarOpen}
            role={role}
          />

          {(role === 'school_admin' || user?.email?.toLowerCase() === 'tranlichsu@gmail.com' || user?.email?.toLowerCase() === 'tienganhltt@thainguyen.edu.vn') && (
            <>
              <div className="pt-4 pb-2">
                {isSidebarOpen && <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3">Hệ thống</p>}
              </div>
              <NavItem 
                icon={<ShieldCheck />} 
                label="Quản trị Trường học" 
                active={activeTab === 'school-admin'} 
                onClick={() => setActiveTab('school-admin')}
                color="text-slate-700 dark:text-slate-200"
                bgColor="bg-slate-100 dark:bg-slate-700"
                collapsed={!isSidebarOpen}
                role={role}
              />
            </>
          )}

          {(role === 'teacher' || role === 'homeroom_teacher' || role === 'principal') && (
            <>
              <div className="pt-4 pb-2">
                {isSidebarOpen && <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3">Công cụ Giáo dục</p>}
              </div>
              {(role === 'teacher' || role === 'homeroom_teacher') && (
                <>
                  <NavItem 
                    icon={<Sparkles />} 
                    label="Soạn giáo án AI" 
                    active={activeTab === 'lesson-ai'} 
                    onClick={() => setActiveTab('lesson-ai')}
                    color="text-slate-700 dark:text-slate-200"
                    bgColor="bg-slate-100 dark:bg-slate-700"
                    collapsed={!isSidebarOpen}
                    role={role}
                  />
                  <NavItem 
                    icon={<GraduationCap />} 
                    label="Tạo đề thi AI" 
                    active={activeTab === 'test-ai'} 
                    onClick={() => setActiveTab('test-ai')}
                    color="text-slate-700 dark:text-slate-200"
                    bgColor="bg-slate-100 dark:bg-slate-700"
                    collapsed={!isSidebarOpen}
                    role={role}
                  />
                  <NavItem 
                    icon={<Gamepad2 />} 
                    label="Trò chơi Tương tác" 
                    active={activeTab === 'games'} 
                    onClick={() => setActiveTab('games')}
                    color="text-slate-700 dark:text-slate-200"
                    bgColor="bg-slate-100 dark:bg-slate-700"
                    collapsed={!isSidebarOpen}
                    role={role}
                  />
                </>
              )}
              <NavItem 
                icon={<Users />} 
                label={role === 'principal' ? "Thống kê Trường" : "Lớp học & Học sinh"} 
                active={activeTab === 'classroom'} 
                onClick={() => setActiveTab('classroom')}
                color="text-slate-700 dark:text-slate-200"
                bgColor="bg-slate-100 dark:bg-slate-700"
                collapsed={!isSidebarOpen}
                role={role}
              />
            </>
          )}

          <div className="pt-4 pb-2">
            {isSidebarOpen && <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3">Học Liệu</p>}
          </div>
          <NavItem 
            icon={<Globe />} 
            label="Kho học liệu số" 
            active={activeTab === 'resource-library'} 
            onClick={() => setActiveTab('resource-library')}
            color="text-slate-700 dark:text-slate-200"
            bgColor="bg-slate-100 dark:bg-slate-700"
            collapsed={!isSidebarOpen}
            role={role}
          />

          {(role === 'student' || role === 'parent') && (
            <>
              <div className="pt-4 pb-2">
                {isSidebarOpen && <p className={`text-xs font-black uppercase tracking-widest px-3 ${role === 'student' ? 'text-indigo-400' : 'text-slate-400'}`}>Góc Của Em</p>}
              </div>
              <NavItem 
                icon={<BookOpenCheck />} 
                label={role === 'parent' ? "Kết quả của con" : "Bài tập của em"} 
                active={activeTab === 'student-homework'} 
                onClick={() => setActiveTab('student-homework')}
                color={role === 'student' ? "text-blue-600" : "text-blue-600"}
                bgColor={role === 'student' ? "bg-blue-100" : "bg-blue-50"}
                collapsed={!isSidebarOpen}
                role={role}
              />
              {role === 'student' && (
                <NavItem 
                  icon={<Joystick />} 
                  label="Vui chơi cùng AI" 
                  active={activeTab === 'student-games'} 
                  onClick={() => setActiveTab('student-games')}
                  color="text-orange-500"
                  bgColor="bg-orange-100"
                  collapsed={!isSidebarOpen}
                  role={role}
                />
              )}
            </>
          )}
        </nav>

        <div className={`p-4 ${role === 'student' ? 'border-t-4 border-indigo-50 bg-indigo-50/30' : 'border-t border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/50'} flex items-center justify-between`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <button 
              onClick={() => avatarInputRef.current?.click()}
              disabled={isUpdatingAvatar}
              className={`group relative w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden border-2 ${role === 'student' ? 'border-indigo-200 bg-indigo-100' : 'border-slate-300 dark:border-slate-600 bg-slate-200 dark:bg-slate-700'} shrink-0 shadow-inner hover:scale-105 active:scale-95 transition-all`}
              title="Thay đổi ảnh đại diện"
            >
              <img src={studentProfile?.avatar || userProfile?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email || 'Student'}`} alt="Avatar" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {isUpdatingAvatar ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <ShieldCheck className="w-4 h-4 text-white" />}
              </div>
              <input 
                type="file" 
                ref={avatarInputRef} 
                onChange={handleAvatarChange} 
                className="hidden" 
                accept="image/*" 
              />
            </button>
            {isSidebarOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="overflow-hidden"
              >
                <p className={`text-sm font-black truncate max-w-[120px] ${role === 'student' ? 'text-indigo-900' : 'text-slate-800 dark:text-white'}`}>
                  {studentProfile?.name || userProfile?.displayName || user.displayName || (user.email ? user.email.split('@')[0] : 'Người dùng')}
                </p>
                <p className={`text-[10px] truncate max-w-[120px] font-bold ${role === 'student' ? 'text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  {role === 'student' ? `Cấp độ ${studentProfile?.level || 1}` : user.email}
                </p>
              </motion.div>
            )}
          </div>
            {isSidebarOpen && (
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => {
                    setPasswordStatus({ type: null, message: '' });
                    setShowPasswordModal(true);
                  }}
                  className={`transition-all p-2 rounded-xl ${role === 'student' ? 'text-indigo-300 hover:text-indigo-600 hover:bg-indigo-50' : 'text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30'}`}
                  title="Đổi mật khẩu"
                >
                  <KeyRound className="w-5 h-5" />
                </button>
                <button onClick={handleLogout} className={`transition-all p-2 rounded-xl ${role === 'student' ? 'text-indigo-300 hover:text-red-500 hover:bg-red-50' : 'text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30'}`}>
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className={`h-24 px-4 sm:px-8 flex items-center justify-between z-30 shrink-0 transition-all ${role === 'student' ? 'bg-white/80 backdrop-blur-md border-b-4 border-indigo-50' : 'bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 shadow-sm'}`}>
          <div className="flex items-center gap-3 sm:gap-6">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className={`p-3 rounded-2xl transition-all active:scale-95 md:flex hidden ${role === 'student' ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
            >
              <Menu className="w-6 h-6" />
            </button>
            
            {/* Mobile Menu Toggle */}
            <div className="md:hidden">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={`p-3 rounded-2xl shadow-lg ${role === 'student' ? 'bg-indigo-600 text-white' : 'bg-blue-600 text-white'}`}
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>

            <div className="flex flex-col">
              <h2 className={`text-3xl font-black tracking-tight leading-none ${role === 'student' ? 'text-indigo-900' : 'text-slate-800 dark:text-white'}`}>
                {activeTab === 'dashboard' ? (role === 'student' ? 'Chào em!' : 'Bảng điều khiển') : 
                 activeTab === 'lesson-ai' ? 'Soạn giáo án AI' :
                 activeTab === 'worksheet' ? 'Phiếu học tập' :
                 activeTab === 'test-ai' ? 'Tạo đề thi AI' :
                 activeTab === 'games' ? 'Trò chơi' :
                 activeTab === 'classroom' ? 'Lớp học' :
                 activeTab === 'student-homework' ? 'Bài tập của em' :
                 activeTab === 'student-games' ? 'Vui chơi thôi nào!' : 'Lý Tự Trọng'}
              </h2>
              <p className={`text-xs font-black uppercase tracking-widest mt-2 ${role === 'student' ? 'text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>
                {school?.name || 'Trường TH Lý Tự Trọng'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {role !== 'student' && (
              <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner">
                <button 
                  onClick={() => setIsDarkMode(false)} 
                  className={`p-2 rounded-xl transition-all ${!isDarkMode ? 'bg-white dark:bg-slate-800 shadow-md text-blue-600' : 'text-slate-400'}`}
                >
                  <Sun className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setIsDarkMode(true)} 
                  className={`p-2 rounded-xl transition-all ${isDarkMode ? 'bg-white dark:bg-slate-800 shadow-md text-blue-400' : 'text-slate-400'}`}
                >
                  <Moon className="w-5 h-5" />
                </button>
              </div>
            )}
            
            {role === 'student' && studentProfile && (
              <div className="hidden sm:flex items-center gap-4 px-4 py-2 bg-indigo-50 border-2 border-indigo-100 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <span className="font-black text-indigo-900">{studentProfile.xp || 0} XP</span>
                </div>
                <div className="w-[2px] h-6 bg-indigo-200" />
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  <span className="font-black text-indigo-900">{studentProfile.streak || 0} Ngày</span>
                </div>
              </div>
            )}

            <button className={`p-3 rounded-2xl transition-all relative active:scale-95 ${role === 'student' ? 'bg-indigo-50 text-indigo-500 hover:bg-indigo-100' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-50'}`}>
              <Bell className="w-6 h-6" />
              <span className="absolute top-3 right-3 w-3 h-3 bg-red-500 border-2 border-white dark:border-slate-800 rounded-full shadow-sm"></span>
            </button>
          </div>
        </header>
        
        <div className={`flex-1 overflow-auto p-4 sm:p-10 relative ${role === 'student' ? 'bg-indigo-50/50' : ''}`}>
          {connectionError && (
            <div className="mb-8 p-5 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl flex items-center gap-4 text-red-700 dark:text-red-400 font-bold shadow-sm animate-in fade-in slide-in-from-top-2">
              <X className="w-6 h-6 shrink-0" />
              <p className="flex-1">{connectionError}</p>
              <button 
                onClick={() => loadData(teacherUid || '')} 
                className="px-4 py-2 bg-red-100 dark:bg-red-800 rounded-xl text-sm hover:bg-red-200 transition active:scale-95"
              >
                Thử lại
              </button>
              <button onClick={() => setConnectionError(null)} className="text-red-400 hover:text-red-600 transition-colors"><X className="w-5 h-5" /></button>
            </div>
          )}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              transition={{ 
                duration: 0.4, 
                ease: [0.23, 1, 0.32, 1]
              }}
              className="h-full"
            >
              <ErrorBoundary>
                {renderContent()}
              </ErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className={`md:hidden h-20 border-t flex items-center justify-around px-2 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] ${role === 'student' ? 'bg-white border-indigo-50' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
          <MobileNavItem icon={<LayoutDashboard />} active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          {(role === 'school_admin' || user?.email?.toLowerCase() === 'tranlichsu@gmail.com') && (
            <MobileNavItem icon={<ShieldCheck />} active={activeTab === 'school-admin'} onClick={() => setActiveTab('school-admin')} />
          )}
          {role === 'teacher' || role === 'homeroom_teacher' || role === 'principal' || role === 'school_admin' ? (
            <>
              <MobileNavItem icon={<Sparkles />} active={activeTab === 'lesson-ai'} onClick={() => setActiveTab('lesson-ai')} />
              <MobileNavItem icon={<Gamepad2 />} active={activeTab === 'games'} onClick={() => setActiveTab('games')} />
            </>
          ) : (
            <>
              <MobileNavItem icon={<BookOpenCheck />} active={activeTab === 'student-homework'} onClick={() => setActiveTab('student-homework')} />
              <MobileNavItem icon={<Joystick />} active={activeTab === 'student-games'} onClick={() => setActiveTab('student-games')} />
            </>
          )}
        </div>

        {/* Change Password Modal */}
        <AnimatePresence>
          {showPasswordModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowPasswordModal(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 w-full max-w-md border border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <KeyRound className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white">Đổi mật khẩu</h3>
                  </div>
                  <button onClick={() => setShowPasswordModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Mật khẩu mới</label>
                    <div className="relative">
                      <input 
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Nhập ít nhất 6 ký tự"
                        className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all dark:text-white"
                        required
                        minLength={6}
                      />
                      <button 
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {passwordStatus.type && (
                    <div className={`p-4 rounded-xl text-sm font-bold ${passwordStatus.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                      {passwordStatus.message}
                    </div>
                  )}

                  <button 
                    type="submit"
                    disabled={isChangingPassword}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isChangingPassword ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                    ) : 'Cập nhật mật khẩu'}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>

  );
}

function MobileNavItem({ icon, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`p-3 rounded-xl transition-colors ${active ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}
    >
      {React.cloneElement(icon, { className: "w-6 h-6" })}
    </button>
  );
}

function NavItem({ icon, label, active, onClick, color = "text-slate-600 dark:text-slate-300", bgColor = "bg-slate-100 dark:bg-slate-700", collapsed = false }: any) {
  return (
    <button 
      onClick={onClick} 
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 font-bold border border-transparent group relative overflow-hidden active:scale-[0.98]
        ${active ? `${bgColor} ${color} shadow-sm` : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-700/50'}
      `}
    >
      {active && (
        <motion.div 
          layoutId="nav-active"
          className="absolute inset-0 bg-white/40 dark:bg-white/5 pointer-events-none"
        />
      )}
      <span className={`${active ? color : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'} transition-colors shrink-0`}>
        {React.cloneElement(icon, { className: "w-5 h-5" })}
      </span>
      {!collapsed && <span className="truncate">{label}</span>}
      {active && !collapsed && (
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`ml-auto w-1.5 h-1.5 rounded-full ${color.replace('text-', 'bg-')}`} 
        />
      )}
    </button>
  );
}
