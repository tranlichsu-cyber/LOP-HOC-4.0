import React, { useState } from 'react';
import { BookOpenCheck, PartyPopper, Calendar, Clock, Play, MessageCircle } from 'lucide-react';
import { Homework, Game } from '../types';
import { auth } from '../firebase';
import OfflineGame from './games/OfflineGame';
import MillionaireGame from './games/MillionaireGame';

export default function StudentHomework({ homework }: { homework: Homework[] }) {
  const [playingHomework, setPlayingHomework] = useState<Homework | null>(null);

  if (playingHomework) {
    // Convert homework to a temporary game object for the game components
    const tempGame: Game = {
      id: playingHomework.id,
      title: playingHomework.title,
      type: 'math', // Default to math mode for offline homework
      questionsList: playingHomework.questions
    };

    return <OfflineGame game={tempGame} onClose={() => setPlayingHomework(null)} />;
  }

  return (
    <div className="bg-kids-sky rounded-[3rem] border-4 border-white p-8 sm:p-12 shadow-[0_20px_50px_rgba(37,99,235,0.1)] overflow-hidden h-full flex flex-col font-kids">
      <div className="flex items-center justify-between mb-10 bg-white/80 backdrop-blur-md p-6 rounded-[2rem] shadow-xl border-4 border-white">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl text-white shadow-lg transform -rotate-3"><BookOpenCheck className="w-8 h-8" /></div>
          <h3 className="text-3xl sm:text-4xl font-black text-indigo-950 uppercase tracking-tight">Bài Tập Của Em</h3>
        </div>
        <div className="text-6xl animate-bounce-short">📚</div>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {homework.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {homework.map(hw => (
              <div key={hw.id} className="bg-white rounded-[2.5rem] p-8 shadow-2xl border-4 border-transparent hover:border-blue-400 transform hover:-translate-y-2 transition-all duration-300 group">
                <div className="flex items-start gap-5">
                  <div className="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center text-blue-600 shrink-0 relative group-hover:scale-110 transition-transform shadow-inner">
                    <BookOpenCheck className="w-10 h-10" />
                    {hw.subject && (
                      <span className="absolute -top-3 -right-3 bg-rose-500 text-white text-xs font-black px-3 py-1.5 rounded-2xl shadow-lg border-4 border-white uppercase tracking-tighter">
                        {hw.subject}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-2xl font-black text-indigo-950 truncate mb-2">{hw.title}</h4>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-blue-600 font-black text-sm bg-blue-50 px-3 py-1 rounded-full w-fit">
                        <Calendar className="w-4 h-4" /> Hạn nộp: {hw.dueDate}
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 font-bold text-sm bg-slate-50 px-3 py-1 rounded-full w-fit">
                        <Clock className="w-4 h-4" /> {hw.questions.length} câu hỏi vui
                      </div>
                    </div>
                  </div>
                </div>

                {hw.feedback && auth.currentUser?.uid && hw.feedback[auth.currentUser.uid] && (
                  <div className="mt-6 bg-amber-50 border-4 border-amber-100 p-5 rounded-3xl flex gap-4 items-start shadow-inner">
                    <div className="bg-amber-400 p-2 rounded-xl text-white shadow-md rotate-12">
                      <MessageCircle className="w-5 h-5 fill-current" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-amber-600 uppercase mb-1 tracking-widest">Lời nhắn từ Thầy/Cô:</p>
                      <p className="text-base font-bold text-amber-900 italic">"{hw.feedback[auth.currentUser.uid]}"</p>
                    </div>
                  </div>
                )}

                <div className="mt-8">
                  <button 
                    onClick={() => setPlayingHomework(hw)}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black py-5 rounded-[1.5rem] flex justify-center gap-3 items-center text-2xl shadow-[0_8px_0_#1e3a8a] active:translate-y-2 active:shadow-none transition-all duration-200 border-2 border-white/20 uppercase tracking-widest"
                  >
                    <Play className="w-8 h-8 fill-current" /> BẮT ĐẦU NGAY
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center py-20 text-blue-500">
            <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-2xl mb-8 border-8 border-indigo-100">
               <PartyPopper className="w-16 h-16 text-rose-500 animate-bounce" />
            </div>
            <p className="text-3xl font-black text-indigo-950 mb-2">Tuyệt vời quá!</p>
            <p className="text-xl font-bold text-indigo-400">Em đã hoàn thành hết bài tập rồi. Cùng đi chơi nhé! 🚀</p>
          </div>
        )}
      </div>
    </div>
  );
}
