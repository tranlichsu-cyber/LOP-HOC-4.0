import React, { useState } from 'react';
import { 
  auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup, 
  sendPasswordResetEmail 
} from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, GraduationCap, UserCircle, KeyRound, ArrowRight, Chrome, BookOpen, BrainCircuit, Gamepad2, LineChart, ShieldCheck } from 'lucide-react';

export default function Login({ onStudentLogin }: { onStudentLogin: (studentId: string, pass: string) => Promise<{success: boolean, message?: string}> }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studentId, setStudentId] = useState('');
  const [studentPass, setStudentPass] = useState('');
  const [message, setMessage] = useState('');
  const [studentMessage, setStudentMessage] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'teacher' | 'student'>('teacher');

  const handleTeacherLogin = async () => {
    if (!email || !password) {
      setMessage("Vui lòng nhập Email và Mật khẩu!");
      return;
    }
    try {
      setIsLoading(true);
      setMessage("Đang kiểm tra...");
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      let errorMsg = isRegistering ? "Đăng ký thất bại: " + error.message : "Đăng nhập thất bại. Sai email hoặc mật khẩu.";
      if (error.code === 'auth/network-request-failed') {
        errorMsg = "Lỗi kết nối: Vui lòng thử mở ứng dụng trong tab mới.";
      }
      setMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setMessage("Đang mở cửa sổ đăng nhập Google...");
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Google Login Error:", error);
      if (error.code === 'auth/operation-not-allowed') {
        setMessage("Lỗi: Bạn chưa bật đăng nhập Google trong Firebase Console.");
      } else if (error.code === 'auth/unauthorized-domain') {
        setMessage("Lỗi: Tên miền này chưa được xác thực trong Firebase.");
      } else if (error.code === 'auth/popup-blocked') {
        setMessage("Lỗi: Trình duyệt đã chặn cửa sổ bật lên.");
      } else {
        setMessage("Lỗi: " + (error.message || "Không rõ nguyên nhân"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setMessage("Vui lòng nhập email để đặt lại mật khẩu!");
      return;
    }
    try {
      setIsLoading(true);
      await sendPasswordResetEmail(auth, email);
      setMessage("Liên kết đặt lại mật khẩu đã được gửi đến email!");
    } catch (error: any) {
      setMessage("Lỗi: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStudentLogin = async () => {
    if (!studentId || !studentPass) {
      setStudentMessage("Vui lòng nhập đầy đủ thông tin!");
      return;
    }
    setIsLoading(true);
    setStudentMessage("Đang đăng nhập...");
    const result = await onStudentLogin(studentId, studentPass);
    if (!result.success) {
      setStudentMessage(result.message || "Đăng nhập thất bại!");
      setIsLoading(false);
    }
  };

  const features = [
    { icon: <ShieldCheck className="w-5 h-5" />, title: "An Toàn & Bảo Mật", desc: "Hệ thống quản lý nội bộ bảo vệ dữ liệu nhà trường." },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex flex-col md:flex-row bg-white dark:bg-slate-950 overflow-hidden font-sans">
      
      {/* Left Pane: Simple School Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-blue-700 border-r border-blue-800 relative group overflow-hidden">
        {/* Animated Background Gradients */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-400/20 rounded-full blur-[140px] translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[140px] -translate-x-1/2 translate-y-1/2" />
        
        {/* Header Branding */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative z-10 flex items-center gap-3"
        >
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-2xl shadow-white/10 overflow-hidden">
            <img 
              src="school-logo.png" 
              alt="Logo Trường Tiểu học Lý Tự Trọng" 
              className="w-full h-full object-contain p-0.5" 
            />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-widest uppercase">Trường Lý Tự Trọng</h2>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">Hệ thống giáo dục thông minh nội bộ</span>
            </div>
          </div>
        </motion.div>

        {/* Simplified Intro */}
        <div className="relative z-10 space-y-6 max-w-lg">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl font-black text-white leading-tight"
          >
            Chào mừng <br/> Quý thầy cô & các em.
          </motion.h1>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 gap-6 pt-8"
          >
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-4 group/feat">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-blue-200 group-hover/feat:bg-white group-hover/feat:text-blue-700 transition-all cursor-default">
                  {f.icon}
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm tracking-wide">{f.title}</h4>
                  <p className="text-xs text-blue-100/70 leading-normal">{f.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Footer info */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="relative z-10 text-blue-200/50 text-xs font-bold uppercase tracking-widest"
        >
          Trường Tiểu học Lý Tự Trọng &copy; 2026
        </motion.div>
      </div>

      {/* Right Pane: Login Portal */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 md:p-12 relative overflow-y-auto">
        {/* Mobile Header Branding (Visible only on small screens) */}
        <div className="lg:hidden mb-12 text-center">
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-600/10 overflow-hidden border border-slate-100">
                <img 
                  src="school-logo.png" 
                  alt="Logo Trường Tiểu học Lý Tự Trọng" 
                  className="w-full h-full object-contain p-0.5" 
                />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Trường Lý Tự Trọng</h1>
            <p className="text-sm font-bold text-slate-400">Hệ thống giáo dục thông minh nội bộ</p>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm"
        >
          {/* Tab Switcher */}
          <div className="flex p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl mb-10">
            <button 
              onClick={() => setActiveTab('teacher')}
              className={`flex-1 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'teacher' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-xl' : 'text-slate-400'}`}
            >
              Cổng Giáo Viên
            </button>
            <button 
              onClick={() => setActiveTab('student')}
              className={`flex-1 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'student' ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow-xl' : 'text-slate-400'}`}
            >
              Cổng Học Sinh
            </button>
          </div>

          <div className="space-y-8">
            <AnimatePresence mode="wait">
              {activeTab === 'teacher' ? (
                <motion.div 
                    key="teacher-form"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                >
                  <div className="space-y-3">
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <UserCircle className="text-slate-400 w-5 h-5 group-focus-within:text-blue-600 transition-colors" />
                      </div>
                      <input 
                        type="email" 
                        placeholder="Địa chỉ Email" 
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 dark:text-white transition-all font-bold placeholder:text-slate-400 text-sm" 
                      />
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <KeyRound className="text-slate-400 w-5 h-5 group-focus-within:text-blue-600 transition-colors" />
                      </div>
                      <input 
                        type="password" 
                        placeholder="Mật khẩu" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 dark:text-white transition-all font-bold placeholder:text-slate-400 text-sm" 
                      />
                    </div>
                  </div>
                  
                  {message && (
                    <motion.p 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className={`text-xs font-black text-center py-2 px-4 rounded-xl ${message.includes('thành công') || message.includes('gửi') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}
                    >
                        {message}
                    </motion.p>
                  )}

                  <div className="flex flex-col gap-4 pt-4">
                    <button 
                      disabled={isLoading} 
                      onClick={handleTeacherLogin} 
                      className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-blue-500/20 hover:translate-y-[-2px] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                      {isRegistering ? 'Xác nhận tạo tài khoản' : 'Đăng nhập giáo viên'}
                      <ArrowRight className="w-5 h-5" />
                    </button>

                    {!isRegistering && (
                      <button 
                        disabled={isLoading}
                        onClick={handleGoogleLogin}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-black py-4 rounded-2xl transition-all hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 shadow-sm border-b-4 border-slate-200 active:border-b-0"
                      >
                        <Chrome className="w-5 h-5 text-blue-500" />
                        Đăng nhập với Google
                      </button>
                    )}

                    <div className="flex flex-col items-center gap-3 mt-4">
                      <button 
                        onClick={() => setIsRegistering(!isRegistering)} 
                        className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] hover:text-blue-600 transition-colors"
                      >
                        {isRegistering ? 'Bạn đã có tài khoản?' : 'Tạo tài khoản mới'}
                      </button>
                      {!isRegistering && (
                        <button 
                          onClick={handleForgotPassword}
                          className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] hover:text-indigo-600 transition-colors"
                        >
                          Quên mật khẩu?
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                    key="student-form"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                >
                  <div className="space-y-4">
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <GraduationCap className="text-emerald-500 w-5 h-5 group-focus-within:text-emerald-600 transition-colors" />
                      </div>
                      <input 
                        type="text" 
                        placeholder="Mã định danh học sinh (ID)" 
                        value={studentId}
                        onChange={e => setStudentId(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-emerald-50/20 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 border-b-4 rounded-2xl outline-none focus:border-emerald-500 dark:text-white transition-all font-bold placeholder:text-emerald-300 text-sm" 
                      />
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <KeyRound className="text-emerald-500 w-5 h-5 group-focus-within:text-emerald-600 transition-colors" />
                      </div>
                      <input 
                        type="password" 
                        placeholder="Mã bí mật" 
                        value={studentPass}
                        onChange={e => setStudentPass(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-emerald-50/20 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 border-b-4 rounded-2xl outline-none focus:border-emerald-500 dark:text-white transition-all font-bold placeholder:text-emerald-300 text-sm" 
                      />
                    </div>
                  </div>
                  
                  {studentMessage && (
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-red-500 font-black text-center py-2 bg-red-50 rounded-xl"
                    >
                        {studentMessage}
                    </motion.p>
                  )}

                  <button 
                    disabled={isLoading}
                    onClick={handleStudentLogin}
                    className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white font-black py-5 rounded-[2rem] transition-all shadow-xl shadow-emerald-600/20 hover:translate-y-[-4px] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 text-lg"
                  >
                    Bắt đầu học ngay!
                    <ArrowRight className="w-6 h-6" />
                  </button>

                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                    <p className="text-[10px] text-slate-500 text-center font-bold leading-relaxed">
                        Mã học sinh và mã bí mật do giáo viên chủ nhiệm cung cấp. Nếu quên mã, vui lòng liên hệ giáo viên.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
        
        {/* Visual Decoration for Login side (Subtle) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.02] dark:opacity-[0.05] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>
    </div>
  );
}
