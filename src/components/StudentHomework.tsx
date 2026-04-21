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
    <div className="bg-kids-sky rounded-3xl border border-blue-200 p-6 shadow-sm overflow-hidden h-full flex flex-col font-kids">
      <div className="flex items-center justify-between mb-8 bg-white/70 backdrop-blur-sm p-4 rounded-2xl shadow-sm border border-blue-100">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500 p-3 rounded-xl text-white shadow-md"><BookOpenCheck className="w-7 h-7" /></div>
          <h3 className="text-3xl font-black text-blue-900 uppercase">Bài Tập Của Em</h3>
        </div>
        <div className="text-5xl">📚</div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {homework.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {homework.map(hw => (
              <div key={hw.id} className="bg-white rounded-[2.5rem] p-6 shadow-xl border-4 border-white transform hover:-translate-y-1 transition group">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shrink-0 relative">
                    <BookOpenCheck className="w-8 h-8" />
                    {hw.subject && (
                      <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-black px-2 py-1 rounded-full shadow-md border-2 border-white">
                        {hw.subject}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-2xl font-black text-blue-900 truncate">{hw.title}</h4>
                    <div className="flex flex-col gap-1 mt-2">
                      <span className="flex items-center gap-2 text-blue-600 font-bold">
                        <Calendar className="w-4 h-4" /> Hạn nộp: {hw.dueDate}
                      </span>
                      <span className="flex items-center gap-2 text-slate-500 font-bold">
                        <Clock className="w-4 h-4" /> {hw.questions.length} câu hỏi
                      </span>
                    </div>
                  </div>
                </div>

                {hw.feedback && auth.currentUser?.uid && hw.feedback[auth.currentUser.uid] && (
                  <div className="mt-4 bg-amber-50 border-2 border-amber-200 p-4 rounded-2xl flex gap-3 items-start animate-in fade-in slide-in-from-top-1 duration-500">
                    <MessageCircle className="w-5 h-5 text-amber-500 shrink-0 mt-1" />
                    <div>
                      <p className="text-xs font-black text-amber-600 uppercase mb-1">Lời nhắn từ Thầy/Cô:</p>
                      <p className="text-sm font-bold text-amber-800 italic">"{hw.feedback[auth.currentUser.uid]}"</p>
                    </div>
                  </div>
                )}

                <div className="mt-6">
                  <button 
                    onClick={() => setPlayingHomework(hw)}
                    className="w-full bg-rose-500 hover:bg-rose-600 text-white font-black py-4 rounded-2xl flex justify-center gap-3 items-center text-xl shadow-[0_4px_0_#be123c] active:translate-y-1 active:shadow-none transition"
                  >
                    <Play className="w-6 h-6 fill-current" /> LÀM BÀI NGAY
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center py-20 text-blue-400">
            <PartyPopper className="w-24 h-24 mb-4 text-rose-400 animate-bounce" />
            <p className="text-2xl font-black">Tuyệt vời! Em đã hoàn thành hết bài tập.</p>
          </div>
        )}
      </div>
    </div>
  );
}
