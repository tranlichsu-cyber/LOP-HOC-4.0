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
  ArrowLeft,
  ShieldCheck,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, getDocFromServer } from './firebase';
import { onAuthStateChanged, signOut, signInAnonymously } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { UserRole, UserProfile, School, Class, Game, Student, Homework, Lesson, Worksheet as WorksheetType } from './types';
import { calculateLevel, checkAwards } from './lib/gamification';

// Views
import Dashboard from './components/Dashboard';
import PrincipalDashboard from './components/PrincipalDashboard';
import ParentDashboard from './components/ParentDashboard';
import LessonAI from './components/LessonAI';
import Worksheet from './components/Worksheet';
import Games from './components/Games';
import Classroom from './components/Classroom';
import SchoolAdmin from './components/SchoolAdmin';
import StudentHomework from './components/StudentHomework';
import StudentGames from './components/StudentGames';
import ResourceLibrary from './components/ResourceLibrary';
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
            
            console.log("Auth State Changed - Email:", userEmail, "Is Admin Email:", isAdminEmail);

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
            console.log("Role set to:", currentRole, "for email:", userEmail);
            
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
          const studentData = studentSnap.data();
          
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

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': 
        if (role === 'principal') return <PrincipalDashboard schoolStats={{ totalStudents: 500, totalTeachers: 45, totalClasses: 20, avgCompletionRate: 82, activeSessions: 12 }} />;
        if (role === 'parent') return <ParentDashboard childrenList={students.filter(s => userProfile?.studentIds?.includes(s.id))} homeworkList={homework} />;
        return <Dashboard role={role} stats={{ students: students.length, games: offlineGames.length + liveGames.length }} studentsList={students} homeworkList={homework} studentProfile={studentProfile} />;
      
      case 'school-admin': return userProfile ? <SchoolAdmin userProfile={userProfile} /> : null;
      case 'lesson-ai': return <LessonAI />;
      case 'worksheet': return <Worksheet />;
      case 'games': return <Games offlineGames={offlineGames} liveGames={liveGames} setOfflineGames={setOfflineGames} setLiveGames={setLiveGames} students={students} />;
      case 'classroom': return <Classroom userProfile={userProfile} students={students} setStudents={setStudents} homework={homework} setHomework={setHomework} offlineGames={offlineGames} />;
      case 'resource-library': return userProfile ? <ResourceLibrary userProfile={userProfile} /> : null;
      case 'student-homework': return <StudentHomework homework={homework} />;
      case 'student-games': return <StudentGames offlineGames={offlineGames} studentProfile={studentProfile} onCompleteGame={() => awardStudentXP(100)} />;
      default: return <Dashboard role={role} stats={{ students: students.length, games: offlineGames.length + liveGames.length }} studentsList={students} homeworkList={homework} studentProfile={studentProfile} />;
    }
  };

  return (
    <div className={`h-screen flex overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-300 ${role === 'teacher' ? 'role-teacher' : 'role-student'}`}>
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
        fixed md:relative h-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-700/50 flex-col shadow-xl transition-all duration-500 z-50 flex
      `}>
        <div className="p-8 flex items-center gap-3 border-b border-slate-100/50 dark:border-slate-700/50">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${role === 'teacher' ? 'from-blue-600 to-indigo-600' : 'from-emerald-500 to-teal-600'} flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0`}>
            <Sparkles className="text-white w-6 h-6" />
          </div>
          {isSidebarOpen && (
            <motion.h1 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xl font-black text-slate-800 dark:text-white tracking-tight"
            >
              Edu<span className={role === 'teacher' ? 'text-blue-600' : 'text-emerald-500'}>Pro</span>
            </motion.h1>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <NavItem 
            icon={<LayoutDashboard />} 
            label="Tổng quan" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')}
            collapsed={!isSidebarOpen}
          />

          {(role === 'school_admin' || user?.email?.toLowerCase() === 'tranlichsu@gmail.com' || user?.email?.toLowerCase() === 'tienganhltt@thainguyen.edu.vn') && (
            <>
              <div className="pt-4 pb-2">
                {isSidebarOpen && <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3">Hệ thống</p>}
              </div>
              <NavItem 
                icon={<ShieldCheck className="text-indigo-500" />} 
                label="Quản trị Trường học" 
                active={activeTab === 'school-admin'} 
                onClick={() => setActiveTab('school-admin')}
                color="text-indigo-600 dark:text-indigo-400"
                bgColor="bg-indigo-50 dark:bg-indigo-900/30"
                collapsed={!isSidebarOpen}
              />
            </>
          )}

          {(role === 'teacher' || role === 'homeroom_teacher' || role === 'principal') && (
            <>
              <div className="pt-4 pb-2">
                {isSidebarOpen && <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3">Công cụ Giáo dục</p>}
              </div>
              {(role === 'teacher' || role === 'homeroom_teacher') && (
                <>
                  <NavItem 
                    icon={<Sparkles />} 
                    label="Soạn giáo án AI" 
                    active={activeTab === 'lesson-ai'} 
                    onClick={() => setActiveTab('lesson-ai')}
                    color="text-purple-600 dark:text-purple-400"
                    bgColor="bg-purple-50 dark:bg-purple-900/30"
                    collapsed={!isSidebarOpen}
                  />
                  <NavItem 
                    icon={<FilePlus2 />} 
                    label="Tạo phiếu học tập" 
                    active={activeTab === 'worksheet'} 
                    onClick={() => setActiveTab('worksheet')}
                    color="text-pink-600 dark:text-pink-400"
                    bgColor="bg-pink-50 dark:bg-pink-900/30"
                    collapsed={!isSidebarOpen}
                  />
                  <NavItem 
                    icon={<Gamepad2 />} 
                    label="Trò chơi Tương tác" 
                    active={activeTab === 'games'} 
                    onClick={() => setActiveTab('games')}
                    color="text-orange-500 dark:text-orange-400"
                    bgColor="bg-orange-50 dark:bg-orange-900/30"
                    collapsed={!isSidebarOpen}
                  />
                </>
              )}
              <NavItem 
                icon={<Users />} 
                label={role === 'principal' ? "Thống kê Trường" : "Lớp học & Học sinh"} 
                active={activeTab === 'classroom'} 
                onClick={() => setActiveTab('classroom')}
                color="text-emerald-600 dark:text-emerald-400"
                bgColor="bg-emerald-50 dark:bg-emerald-900/30"
                collapsed={!isSidebarOpen}
              />
            </>
          )}

          <div className="pt-4 pb-2">
            {isSidebarOpen && <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3">Học Liệu</p>}
          </div>
          <NavItem 
            icon={<Globe />} 
            label="Kho học liệu số" 
            active={activeTab === 'resource-library'} 
            onClick={() => setActiveTab('resource-library')}
            color="text-indigo-600 dark:text-indigo-400"
            bgColor="bg-indigo-50 dark:bg-indigo-900/30"
            collapsed={!isSidebarOpen}
          />

          {(role === 'student' || role === 'parent') && (
            <>
              <div className="pt-4 pb-2">
                {isSidebarOpen && <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3">Góc Gia Đình</p>}
              </div>
              <NavItem 
                icon={<BookOpenCheck />} 
                label={role === 'parent' ? "Kết quả của con" : "Bài tập của tôi"} 
                active={activeTab === 'student-homework'} 
                onClick={() => setActiveTab('student-homework')}
                color="text-blue-600 dark:text-blue-400"
                bgColor="bg-blue-50 dark:bg-blue-900/30"
                collapsed={!isSidebarOpen}
              />
              {role === 'student' && (
                <NavItem 
                  icon={<Joystick />} 
                  label="Trò chơi Tương tác" 
                  active={activeTab === 'student-games'} 
                  onClick={() => setActiveTab('student-games')}
                  color="text-orange-500 dark:text-orange-400"
                  bgColor="bg-orange-50 dark:bg-orange-900/30"
                  collapsed={!isSidebarOpen}
                />
              )}
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden border border-slate-300 dark:border-slate-600 shrink-0 shadow-inner">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email || 'Student'}`} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            {isSidebarOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="overflow-hidden"
              >
                <p className="text-sm font-bold text-slate-800 dark:text-white truncate max-w-[120px]">
                  {user.displayName || (user.email ? user.email.split('@')[0] : 'Người dùng')}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[120px] font-medium">
                  {user.email}
                </p>
              </motion.div>
            )}
          </div>
          {isSidebarOpen && (
            <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-all p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl">
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between px-4 sm:px-8 z-30 shrink-0 transition-all">
          <div className="flex items-center gap-3 sm:gap-6">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-all active:scale-95 md:flex hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            {/* Mobile Menu Toggle */}
            <div className="md:hidden">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>

            <div className="flex flex-col">
              <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight leading-none">
                {activeTab === 'dashboard' ? 'Tổng quan' : 
                 activeTab === 'lesson-ai' ? 'Soạn giáo án AI' :
                 activeTab === 'worksheet' ? 'Phiếu học tập' :
                 activeTab === 'games' ? 'Trò chơi' :
                 activeTab === 'classroom' ? 'Lớp học' :
                 activeTab === 'student-homework' ? 'Bài tập' :
                 activeTab === 'student-games' ? 'Trò chơi' : 'EduPro'}
              </h2>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                Trường TH Lý Tự Trọng
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button 
                onClick={() => setIsDarkMode(false)} 
                className={`p-2 rounded-lg transition-all ${!isDarkMode ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600' : 'text-slate-400'}`}
              >
                <Sun className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setIsDarkMode(true)} 
                className={`p-2 rounded-lg transition-all ${isDarkMode ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-400' : 'text-slate-400'}`}
              >
                <Moon className="w-4 h-4" />
              </button>
            </div>
            
            <button className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-all relative active:scale-95">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 border-2 border-white dark:border-slate-800 rounded-full"></span>
            </button>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto p-8 relative">
          {connectionError && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-400 font-medium shadow-sm">
              <X className="w-5 h-5 shrink-0" />
              <p className="flex-1">{connectionError}</p>
              <button 
                onClick={() => loadData(teacherUid)} 
                className="px-3 py-1 bg-red-100 dark:bg-red-800 rounded-lg text-xs hover:bg-red-200 transition"
              >
                Thử lại
              </button>
              <button onClick={() => setConnectionError(null)} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
            </div>
          )}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
              transition={{ 
                duration: 0.4, 
                ease: [0.23, 1, 0.32, 1] // Custom cubic-bezier for smoothness
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
        <div className="md:hidden h-16 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-around px-2 z-50">
          <MobileNavItem icon={<LayoutDashboard />} active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          {(role === 'school_admin' || user?.email?.toLowerCase() === 'tranlichsu@gmail.com') && (
            <MobileNavItem icon={<ShieldCheck className="text-indigo-500" />} active={activeTab === 'school-admin'} onClick={() => setActiveTab('school-admin')} />
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
        ${active ? `${bgColor} ${color} shadow-lg shadow-slate-200 dark:shadow-none` : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-700/50'}
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
