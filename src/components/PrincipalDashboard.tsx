import React from 'react';
import { Users, BookOpen, Gamepad2, TrendingUp, Award, BarChart3, PieChart as PieIcon, LineChart as LineIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid 
} from 'recharts';

interface PrincipalDashboardProps {
  schoolStats: {
    totalStudents: number;
    totalTeachers: number;
    totalClasses: number;
    avgCompletionRate: number;
    activeSessions: number;
  };
}

export default function PrincipalDashboard({ schoolStats }: PrincipalDashboardProps) {
  const data = [
    { name: 'Khối 1', students: 120, completion: 85 },
    { name: 'Khối 2', students: 115, completion: 78 },
    { name: 'Khối 3', students: 130, completion: 92 },
    { name: 'Khối 4', students: 105, completion: 65 },
    { name: 'Khối 5', students: 110, completion: 88 },
  ];

  const pieData = [
    { name: 'Hoàn thành', value: 75, color: '#10b981' },
    { name: 'Đang thực hiện', value: 20, color: '#f59e0b' },
    { name: 'Chưa bắt đầu', value: 5, color: '#ef4444' },
  ];

  return (
    <div className="space-y-8 pb-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<Users className="text-blue-500" />} label="Tổng học sinh" value={schoolStats.totalStudents} color="bg-blue-50" />
        <StatCard icon={<BookOpen className="text-purple-500" />} label="Giáo viên" value={schoolStats.totalTeachers} color="bg-purple-50" />
        <StatCard icon={<TrendingUp className="text-emerald-500" />} label="Tỉ lệ hoàn thành" value={`${schoolStats.avgCompletionRate}%`} color="bg-emerald-50" />
        <StatCard icon={<Award className="text-orange-500" />} label="Hoạt động" value={schoolStats.activeSessions} color="bg-orange-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl">
          <h3 className="text-xl font-black mb-6 flex items-center gap-2">
            <BarChart3 className="text-blue-500" /> Thống kê theo Khối lớp
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="completion" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl">
          <h3 className="text-xl font-black mb-6 flex items-center gap-2">
            <PieIcon className="text-emerald-500" /> Tình trạng bài tập toàn trường
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={60} outerRadius={80} dataKey="value">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string | number, color: string }) {
  return (
    <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg flex items-center gap-4">
      <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>{icon}</div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-black text-slate-800 dark:text-white">{value}</p>
      </div>
    </motion.div>
  );
}
