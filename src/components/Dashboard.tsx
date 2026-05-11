import React from 'react';
import { Users, BookOpen, Gamepad2, ShieldCheck, Sparkles, Loader2, Trophy, Zap, Camera } from 'lucide-react';
import { motion, Variants } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend as RechartsLegend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { Student, Homework } from '../types';

export default function Dashboard({ role, stats, studentsList = [], homeworkList = [], studentProfile, onUpdateStudentProfile }: { 
  role: string, 
  stats: { students: number, games: number },
  studentsList?: Student[],
  homeworkList?: Homework[],
  studentProfile?: Student | null,
  onUpdateStudentProfile?: (updatedData: Partial<Student>) => void
}) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (onUpdateStudentProfile) {
        onUpdateStudentProfile({ avatar: base64String });
      }
    };
    reader.readAsDataURL(file);
  };
  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item: Variants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    show: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  // Process data for charts
  const getSubjectData = () => {
    if (homeworkList.length === 0) {
      return [
        { name: 'Toán', rate: 85 },
        { name: 'Tiếng Việt', rate: 72 },
        { name: 'Tiếng Anh', rate: 90 },
        { name: 'Tự nhiên & XH', rate: 65 },
      ];
    }

    const subjectsMap: Record<string, { total: number, submitted: number }> = {};
    const studentCount = studentsList.length || 1;

    homeworkList.forEach(hw => {
      const subj = hw.subject || 'Khác';
      if (!subjectsMap[subj]) subjectsMap[subj] = { total: 0, submitted: 0 };
      
      subjectsMap[subj].total += studentCount;
      // We assume feedback presence means submission for this simple dashboard
      subjectsMap[subj].submitted += Object.keys(hw.feedback || {}).length;
    });

    return Object.entries(subjectsMap).map(([name, data]) => ({
      name,
      rate: Math.round((data.submitted / data.total) * 100) || 0
    }));
  };

  const getWeeklyData = () => {
    // Mocking weekly data as we don't have historical progression yet
    return [
      { week: 'Tuần 1', progress: 65 },
      { week: 'Tuần 2', progress: 78 },
      { week: 'Tuần 3', progress: 82 },
      { week: 'Tuần 4', progress: 95 },
    ];
  };

  const subjectData = getSubjectData();
  const weeklyData = getWeeklyData();

  const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'];
  const pieData = [
    { name: 'Giỏi', value: 35 },
    { name: 'Khá', value: 45 },
    { name: 'Trung bình', value: 15 },
    { name: 'Yếu', value: 5 },
  ];

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {role === 'teacher' || role === 'admin' ? (
          <>
            <motion.div variants={item}><StatCard icon={<Users />} label="Học sinh" value={stats.students} color="bg-blue-600" /></motion.div>
            <motion.div variants={item}><StatCard icon={<Gamepad2 />} label="Game đã tạo" value={stats.games} color="bg-purple-600" /></motion.div>
            {role === 'admin' && <motion.div variants={item}><StatCard icon={<ShieldCheck />} label="Quyền hạn" value="Quản trị viên" color="bg-emerald-600" /></motion.div>}
          </>
        ) : (
          <>
            <motion.div variants={item}>
              <StatCard 
                icon={<BookOpen />} 
                label="Bài tập của em" 
                value={homeworkList.filter(h => !h.feedback?.[studentProfile?.id || '']).length} 
                color="bg-indigo-600" 
                studentMode
              />
            </motion.div>
            <motion.div variants={item}>
              <StatCard 
                icon={<Trophy />} 
                label="Cúp đạt được" 
                value={studentProfile?.badges?.length || 0} 
                color="bg-amber-500" 
                studentMode
              />
            </motion.div>
            <motion.div variants={item}>
              <StatCard 
                icon={<Zap />} 
                label="Điểm XP" 
                value={studentProfile?.xp || 0} 
                color="bg-rose-500" 
                studentMode
              />
            </motion.div>
          </>
        )}
      </div>

      {(role === 'teacher' || role === 'admin') && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div variants={item} className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl shadow-slate-200/20 dark:shadow-none">
              <h3 className="font-black text-xl text-slate-800 dark:text-white mb-6 flex items-center gap-3">
                <div className="w-2 h-6 bg-blue-500 rounded-full" />
                Tiến độ theo môn học (%)
              </h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjectData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontWeight: 600, fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontWeight: 600, fontSize: 12 }} 
                      dx={-10}
                    />
                    <RechartsTooltip 
                      cursor={{ fill: '#f1f5f9' }}
                      contentStyle={{ 
                        borderRadius: '16px', 
                        border: 'none', 
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                        fontWeight: 'bold'
                      }}
                    />
                    <Bar 
                      dataKey="rate" 
                      fill="#64748b" 
                      radius={[8, 8, 0, 0]} 
                      barSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <motion.div variants={item} className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
              <h3 className="font-black text-xl text-slate-800 dark:text-white mb-6 flex items-center gap-3">
                <div className="w-2 h-6 bg-slate-400 rounded-full" />
                Tiến độ hoàn thành theo tuần (%)
              </h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="week" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontWeight: 600, fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontWeight: 600, fontSize: 12 }}
                      dx={-10}
                    />
                    <RechartsTooltip 
                      cursor={{ fill: '#f1f5f9' }}
                      contentStyle={{ 
                        borderRadius: '16px', 
                        border: 'none', 
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                        fontWeight: 'bold'
                      }}
                    />
                    <Bar 
                      dataKey="progress" 
                      fill="#94a3b8" 
                      radius={[8, 8, 0, 0]} 
                      barSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          <motion.div variants={item} className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl shadow-slate-200/20 dark:shadow-none">
            <h3 className="font-black text-xl text-slate-800 dark:text-white mb-6 flex items-center gap-3">
              <div className="w-2 h-6 bg-emerald-500 rounded-full" />
              Phân loại học lực lớp học
            </h3>
            <div className="h-72 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', fontWeight: 'bold' }}
                  />
                  <RechartsLegend verticalAlign="middle" align="right" layout="vertical" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

        </div>
      )}

      {role === 'student' && (
        <motion.div 
          variants={item} 
          className="relative p-10 rounded-[2.5rem] border overflow-hidden group shadow-sm bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 border-white/20 shadow-xl"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-700" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -ml-20 -mb-20 group-hover:scale-110 transition-transform duration-700" />
          
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="relative mb-6 group">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-[2rem] overflow-hidden border-4 border-white/50 shadow-2xl bg-white/20 backdrop-blur-xl group-hover:scale-105 transition-transform duration-500">
                <img 
                  src={studentProfile?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${studentProfile?.name || 'Student'}`} 
                  alt="Avatar" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 bg-white text-indigo-600 p-3 rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all border-2 border-indigo-100"
                title="Đổi ảnh đại diện"
              >
                <Camera className="w-5 h-5" />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleAvatarUpload} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
            {!studentProfile?.avatar && (
              <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-[1.5rem] flex items-center justify-center mb-6 border border-white/30 shadow-inner group-hover:rotate-12 transition-transform">
                <Sparkles className="text-yellow-300 w-10 h-10 drop-shadow-lg" />
              </div>
            )}
            <h3 className="text-4xl font-black tracking-tight mb-4 text-white">
              Chào {studentProfile?.name || 'em'} yêu! 👋
            </h3>
            <p className="max-w-lg leading-relaxed font-bold text-lg text-white/80">
              Hôm nay em muốn nhận bao nhiêu Cúp nào? Hãy cùng nhau vượt qua các thử thách và trở thành Nhà Thông Thái nhé! 🏆
            </p>
            <div className="mt-8 flex gap-4">
               <div className="bg-white/20 backdrop-blur-md px-6 py-2 rounded-2xl border border-white/30 text-white font-black text-sm">
                  🚀 Level {studentProfile?.level || 1}
               </div>
               <div className="bg-white/20 backdrop-blur-md px-6 py-2 rounded-2xl border border-white/30 text-white font-black text-sm">
                  🔥 {studentProfile?.streak || 0} Ngày
               </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function StatCard({ icon, label, value, color, studentMode = false }: any) {
  return (
    <div className={`${studentMode ? 'bg-white border-4 border-indigo-100' : 'bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50'} p-6 rounded-[2rem] shadow-xl shadow-slate-200/20 dark:shadow-none flex items-center gap-5 transition-all hover:scale-[1.02] hover:-translate-y-1 group`}>
      <div className={`w-16 h-16 rounded-[1.25rem] flex items-center justify-center text-white shadow-lg ${color} group-hover:rotate-6 transition-transform duration-300`}>
        {React.cloneElement(icon, { className: "w-8 h-8" })}
      </div>
      <div>
        <p className={`text-xs font-black uppercase tracking-widest mb-1 ${studentMode ? 'text-indigo-300' : 'text-slate-400 dark:text-slate-500'}`}>{label}</p>
        <p className={`text-3xl font-black tracking-tight ${studentMode ? 'text-indigo-900' : 'text-slate-800 dark:text-white'}`}>{value}</p>
      </div>
    </div>
  );
}
