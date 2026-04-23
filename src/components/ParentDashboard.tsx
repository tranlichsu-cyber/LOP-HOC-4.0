import React from 'react';
import { User, Award, BookOpen, Clock, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Student, Homework } from '../types';

interface ParentDashboardProps {
  childrenList: Student[];
  homeworkList: Homework[];
}

export default function ParentDashboard({ childrenList, homeworkList }: ParentDashboardProps) {
  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row gap-6">
        {childrenList.map((child) => (
          <div key={child.id} className="flex-1 bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg border-2 border-emerald-500">
                <img src={child.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${child.user}`} alt="Avatar" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white">{child.name}</h3>
                <p className="text-emerald-500 font-bold">Cấp độ {child.level || 1} • {child.xp || 0} XP</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-slate-500 uppercase tracking-widest text-xs">Bài tập cần hoàn thành</h4>
              {homeworkList.filter(hw => !hw.feedback?.[child.id]).slice(0, 3).map(hw => (
                <div key={hw.id} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-between border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <BookOpen className="text-blue-500 w-5 h-5" />
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white text-sm">{hw.title}</p>
                      <p className="text-[10px] text-slate-400">Hạn chót: {hw.dueDate}</p>
                    </div>
                  </div>
                  <ChevronRight className="text-slate-300 w-5 h-5" />
                </div>
              ))}
              
              {homeworkList.filter(hw => !hw.feedback?.[child.id]).length === 0 && (
                <p className="text-center py-4 text-slate-400 text-sm italic">Con đã hoàn thành tất cả bài tập!</p>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700">
              <h4 className="font-bold text-slate-500 uppercase tracking-widest text-xs mb-4">Huy hiệu đạt được</h4>
              <div className="flex gap-2">
                {child.badges?.slice(0, 4).map(badge => (
                  <div key={badge.id} className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center" title={badge.name}>
                    <span className="text-lg">{badge.icon}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2.5rem] p-10 text-white relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-black mb-4 flex items-center gap-3">
            <Clock className="w-8 h-8" /> Nhận xét từ Giáo viên
          </h2>
          <div className="space-y-4">
             {homeworkList.filter(hw => childrenList.some(c => hw.feedback?.[c.id])).map(hw => (
               <div key={hw.id} className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20">
                  <p className="font-black mb-1">{hw.title}</p>
                  <p className="text-sm opacity-90 italic">"{hw.feedback?.[childrenList[0].id]}"</p>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}
