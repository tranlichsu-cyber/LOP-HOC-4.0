import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';
import { motion } from 'motion/react';
import { Sparkles, GraduationCap, UserCircle, KeyRound, ArrowRight, Chrome } from 'lucide-react';

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
      setMessage("Đang kết nối Google...");
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      setMessage("Lỗi đăng nhập Google: " + error.message);
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
      setMessage("Liên kết đặt lại mật khẩu đã được gửi đến email của bạn.");
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.03] dark:opacity-[0.05]" 
             style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-[440px] p-4"
      >
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl p-8 rounded-[2.5rem] shadow-2xl border border-white dark:border-slate-800">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/20">
              <Sparkles className="text-white w-8 h-8" />
            </div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight leading-tight">
              Trường Tiểu học<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Lý Tự Trọng</span>
            </h1>
          </div>

          {/* Tab Switcher */}
          <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-8">
            <button 
              onClick={() => setActiveTab('teacher')}
              className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'teacher' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500'}`}
            >
              Giáo viên
            </button>
            <button 
              onClick={() => setActiveTab('student')}
              className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'student' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500'}`}
            >
              Học sinh
            </button>
          </div>

          <div className="space-y-6">
            {activeTab === 'teacher' ? (
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="relative">
                    <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input 
                      type="email" 
                      placeholder="Email của bạn" 
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-blue-500 dark:text-white transition-all font-medium" 
                    />
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input 
                      type="password" 
                      placeholder="Mật khẩu" 
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-blue-500 dark:text-white transition-all font-medium" 
                    />
                  </div>
                </div>
                
                {message && <p className={`text-xs font-bold text-center ${message.includes('thành công') ? 'text-emerald-500' : 'text-red-500'}`}>{message}</p>}

                <div className="flex flex-col gap-3 pt-2">
                  <button 
                    disabled={isLoading} 
                    onClick={handleTeacherLogin} 
                    className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-black py-4 rounded-2xl transition-all shadow-xl hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isRegistering ? 'Tạo tài khoản' : 'Đăng nhập ngay'}
                    <ArrowRight className="w-5 h-5" />
                  </button>

                  {!isRegistering && (
                    <div className="flex items-center gap-4 py-2">
                      <div className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-800" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hoặc</span>
                      <div className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-800" />
                    </div>
                  )}

                  {!isRegistering && (
                    <button 
                      disabled={isLoading}
                      onClick={handleGoogleLogin}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold py-4 rounded-2xl transition-all hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 shadow-sm"
                    >
                      <Chrome className="w-5 h-5 text-blue-500" />
                      Đăng nhập bằng Google
                    </button>
                  )}

                  <div className="flex flex-col gap-2 mt-2">
                    <button 
                      onClick={() => setIsRegistering(!isRegistering)} 
                      className="w-full text-slate-500 dark:text-slate-400 text-sm font-bold hover:text-blue-600 transition-colors"
                    >
                      {isRegistering ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký ngay'}
                    </button>
                    {!isRegistering && (
                      <button 
                        onClick={handleForgotPassword}
                        className="w-full text-slate-400 text-xs font-medium hover:text-indigo-600 transition-colors"
                      >
                        Quên mật khẩu?
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="relative">
                    <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 w-5 h-5" />
                    <input 
                      type="text" 
                      placeholder="Nhập ID học sinh..." 
                      value={studentId}
                      onChange={e => setStudentId(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl outline-none focus:border-emerald-500 dark:text-white transition-all font-medium" 
                    />
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 w-5 h-5" />
                    <input 
                      type="password" 
                      placeholder="Mật khẩu..." 
                      value={studentPass}
                      onChange={e => setStudentPass(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl outline-none focus:border-emerald-500 dark:text-white transition-all font-medium" 
                    />
                  </div>
                </div>
                
                {studentMessage && <p className="text-xs text-red-500 font-bold text-center">{studentMessage}</p>}

                <button 
                  disabled={isLoading}
                  onClick={handleStudentLogin}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  Vào học ngay!
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
        
        <p className="text-center mt-8 text-slate-400 dark:text-slate-600 text-xs font-bold uppercase tracking-widest">
          Hệ thống quản lý giáo dục thông minh
        </p>
      </motion.div>
    </div>
  );
}
