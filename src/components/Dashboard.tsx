import React from 'react';
import { Users, BookOpen, Gamepad2, ShieldCheck, Sparkles } from 'lucide-react';
import { motion, Variants } from 'motion/react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function Dashboard({ role, stats }: { role: string, stats: { students: number, games: number } }) {
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

  const barData = {
    labels: ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'],
    datasets: [
      {
        label: 'Tỷ lệ hoàn thành',
        data: [65, 78, 82, 95],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderRadius: 12,
        hoverBackgroundColor: 'rgba(59, 130, 246, 1)',
      },
    ],
  };

  const pieData = {
    labels: ['Giỏi', 'Khá', 'Trung bình', 'Yếu'],
    datasets: [
      {
        data: [35, 45, 15, 5],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderWidth: 0,
        hoverOffset: 10
      },
    ],
  };

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
            <motion.div variants={item}><StatCard icon={<BookOpen />} label="Bài tập cần làm" value={3} color="bg-rose-500" /></motion.div>
            <motion.div variants={item}><StatCard icon={<Users />} label="Điểm trung bình" value={9.5} color="bg-emerald-500" /></motion.div>
            <motion.div variants={item}><StatCard icon={<Gamepad2 />} label="Cúp thưởng" value={15} color="bg-amber-500" /></motion.div>
          </>
        )}
      </div>

      {(role === 'teacher' || role === 'admin') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div variants={item} className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl shadow-slate-200/20 dark:shadow-none">
            <h3 className="font-black text-xl text-slate-800 dark:text-white mb-6 flex items-center gap-2">
              <div className="w-2 h-6 bg-blue-500 rounded-full" />
              Tỷ lệ hoàn thành bài tập
            </h3>
            <div className="h-72">
              <Bar data={barData} options={{ 
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: { beginAtZero: true, grid: { display: false } },
                  x: { grid: { display: false } }
                }
              }} />
            </div>
          </motion.div>
          <motion.div variants={item} className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl shadow-slate-200/20 dark:shadow-none">
            <h3 className="font-black text-xl text-slate-800 dark:text-white mb-6 flex items-center gap-2">
              <div className="w-2 h-6 bg-emerald-500 rounded-full" />
              Phân loại học lực
            </h3>
            <div className="h-72 flex items-center justify-center">
              <Pie data={pieData} options={{ 
                maintainAspectRatio: false,
                plugins: { legend: { position: 'right' } }
              }} />
            </div>
          </motion.div>
        </div>
      )}

      <motion.div 
        variants={item} 
        className="relative bg-gradient-to-br from-slate-900 to-slate-800 dark:from-indigo-950 dark:to-slate-900 p-10 rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden group"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-blue-500/20 transition-all duration-700" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -ml-20 -mb-20 group-hover:bg-purple-500/20 transition-all duration-700" />
        
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-6 border border-white/20">
            <Sparkles className="text-yellow-400 w-8 h-8" />
          </div>
          <h3 className="text-3xl font-black text-white tracking-tight mb-3">Chào mừng trở lại!</h3>
          <p className="text-slate-400 max-w-lg leading-relaxed font-medium">
            {role === 'admin' ? 'Hệ thống đang hoạt động ổn định. Bạn có toàn quyền quản trị và điều hành các hoạt động của trường.' : 
             role === 'teacher' ? 'Dữ liệu của bạn được đồng bộ tự động. Hãy bắt đầu tạo những bài giảng thú vị cho học sinh ngay hôm nay.' : 
             'Chào em! Hôm nay em muốn khám phá kiến thức gì nào? Hãy cùng nhau hoàn thành các bài tập để nhận thật nhiều cúp nhé!'}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

function StatCard({ icon, label, value, color }: any) {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl shadow-slate-200/20 dark:shadow-none flex items-center gap-5 transition-all hover:scale-[1.02] group">
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg ${color} group-hover:rotate-6 transition-transform duration-300`}>
        {React.cloneElement(icon, { className: "w-8 h-8" })}
      </div>
      <div>
        <p className="text-xs text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest mb-1">{label}</p>
        <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{value}</p>
      </div>
    </div>
  );
}
