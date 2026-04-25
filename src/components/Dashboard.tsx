import React from 'react';
import { Users, BookOpen, Gamepad2, ShieldCheck, Sparkles, LayoutPanelLeft, Loader2, BrainCircuit, Trophy, Zap } from 'lucide-react';
import { motion, Variants, AnimatePresence } from 'motion/react';
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

import { GoogleGenAI } from "@google/genai";

export default function Dashboard({ role, stats, studentsList = [], homeworkList = [], studentProfile }: { 
  role: string, 
  stats: { students: number, games: number },
  studentsList?: Student[],
  homeworkList?: Homework[],
  studentProfile?: Student | null
}) {
  const [aiAdvice, setAiAdvice] = React.useState<string>('');
  const [isGeneratingAdvice, setIsGeneratingAdvice] = React.useState(false);

  const generateAIAdvice = async () => {
    setIsGeneratingAdvice(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const classContext = `
        Báo cáo tình hình lớp học:
        - Số lượng học sinh: ${studentsList.length}
        - Số lượng bài tập đã giao: ${homeworkList.length}
        - Tỷ lệ hoàn thành trung bình: ${subjectData.reduce((acc, curr) => acc + curr.rate, 0) / (subjectData.length || 1)}%
        - Môn có tỷ lệ thấp nhất: ${[...subjectData].sort((a,b) => a.rate - b.rate)[0]?.name || 'N/A'}
      `;

      const prompt = `Bạn là một chuyên gia tư vấn giáo dục. Hãy phân tích dữ liệu lớp học sau và đưa ra 3 lời khuyên ngắn gọn, thiết thực cho giáo viên để cải thiện kết quả học tập. Phản hồi bằng tiếng Việt, giọng điệu chuyên nghiệp nhưng gần gũi. 
      Dữ liệu: ${classContext}`;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      setAiAdvice(result.text || "Hệ thống không đưa ra được lời khuyên lúc này.");
    } catch (error) {
      console.error("AI Advice error:", error);
      setAiAdvice("Hệ thống AI đang bận, vui lòng thử lại sau!");
    } finally {
      setIsGeneratingAdvice(false);
    }
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

  const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];
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
            <motion.div variants={item}><StatCard icon={<Users />} label="Học sinh" value={stats.students} color="bg-blue-500" /></motion.div>
            <motion.div variants={item}><StatCard icon={<Gamepad2 />} label="Game đã tạo" value={stats.games} color="bg-orange-500" /></motion.div>
            {role === 'admin' && <motion.div variants={item}><StatCard icon={<ShieldCheck />} label="Quyền hạn" value="Quản trị viên" color="bg-indigo-500" /></motion.div>}
          </>
        ) : (
          <>
            <motion.div variants={item}>
              <StatCard 
                icon={<BookOpen />} 
                label="Bài tập của em" 
                value={homeworkList.filter(h => !h.feedback?.[studentProfile?.id || '']).length} 
                color="bg-rose-500" 
                studentMode
              />
            </motion.div>
            <motion.div variants={item}>
              <StatCard 
                icon={<Trophy />} 
                label="Cúp đạt được" 
                value={studentProfile?.badges?.length || 0} 
                color="bg-yellow-500" 
                studentMode
              />
            </motion.div>
            <motion.div variants={item}>
              <StatCard 
                icon={<Zap />} 
                label="Điểm XP" 
                value={studentProfile?.xp || 0} 
                color="bg-indigo-500" 
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
                      fill="#3b82f6" 
                      radius={[8, 8, 0, 0]} 
                      barSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <motion.div variants={item} className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl shadow-slate-200/20 dark:shadow-none">
              <h3 className="font-black text-xl text-slate-800 dark:text-white mb-6 flex items-center gap-3">
                <div className="w-2 h-6 bg-purple-500 rounded-full" />
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
                      fill="#8b5cf6" 
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

          <motion.div variants={item} className="bg-gradient-to-br from-indigo-500 to-purple-600 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 opacity-10"><BrainCircuit className="w-40 h-40" /></div>
             <div className="relative z-10 flex flex-col items-center text-center">
                <h3 className="text-2xl font-black mb-4 flex items-center gap-2">
                   <Sparkles className="w-8 h-8 text-yellow-300" /> Trợ Lý AI: Tư Vấn Lớp Học
                </h3>
                <p className="text-indigo-100 mb-8 font-medium max-w-md">
                   Sử dụng trí tuệ nhân tạo để phân tích dữ liệu và nhận các lời khuyên chuyên sâu cho lớp học của bạn.
                </p>
                
                <AnimatePresence mode="wait">
                   {aiAdvice ? (
                     <motion.div 
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-left w-full border border-white/20 mb-6"
                     >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{aiAdvice}</p>
                     </motion.div>
                   ) : null}
                </AnimatePresence>

                <button 
                  onClick={generateAIAdvice}
                  disabled={isGeneratingAdvice}
                  className="px-10 py-4 bg-white text-indigo-600 rounded-2xl font-black hover:scale-105 transition disabled:opacity-50 flex items-center gap-2 shadow-2xl"
                >
                  {isGeneratingAdvice ? <Loader2 className="w-5 h-5 animate-spin" /> : <BrainCircuit className="w-5 h-5" />}
                  {aiAdvice ? 'Cập nhật tư vấn' : 'Phân tích dữ liệu'}
                </button>
             </div>
          </motion.div>
        </div>
      )}

      <motion.div 
        variants={item} 
        className={`relative p-10 rounded-[2.5rem] border overflow-hidden group shadow-2xl ${role === 'student' ? 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 border-white/20' : 'bg-gradient-to-br from-slate-900 to-slate-800 dark:from-indigo-950 dark:to-slate-900 border-white/10'}`}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-700" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -ml-20 -mb-20 group-hover:scale-110 transition-transform duration-700" />
        
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-[1.5rem] flex items-center justify-center mb-6 border border-white/30 shadow-inner group-hover:rotate-12 transition-transform">
            <Sparkles className="text-yellow-300 w-10 h-10 drop-shadow-lg" />
          </div>
          <h3 className="text-4xl font-black text-white tracking-tight mb-4">
            {role === 'student' ? `Chào ${studentProfile?.name || 'em'} yêu! 👋` : 'Chào mừng trở lại!'}
          </h3>
          <p className="text-white/80 max-w-lg leading-relaxed font-bold text-lg">
            {role === 'admin' ? 'Hệ thống đang hoạt động ổn định. Bạn có toàn quyền quản trị và điều hành các hoạt động của trường.' : 
             role === 'teacher' ? 'Dữ liệu của bạn được đồng bộ tự động. Hãy bắt đầu tạo những bài giảng thú vị cho học sinh ngay hôm nay.' : 
             'Hôm nay em muốn nhận bao nhiêu Cúp nào? Hãy cùng nhau vượt qua các thử thách và trở thành Nhà Thông Thái nhé! 🏆'}
          </p>
          {role === 'student' && (
            <div className="mt-8 flex gap-4">
               <div className="bg-white/20 backdrop-blur-md px-6 py-2 rounded-2xl border border-white/30 text-white font-black text-sm">
                  🚀 Level {studentProfile?.level || 1}
               </div>
               <div className="bg-white/20 backdrop-blur-md px-6 py-2 rounded-2xl border border-white/30 text-white font-black text-sm">
                  🔥 {studentProfile?.streak || 0} Ngày
               </div>
            </div>
          )}
        </div>
      </motion.div>
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
