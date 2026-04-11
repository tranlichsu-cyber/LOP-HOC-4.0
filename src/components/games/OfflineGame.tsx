import React, { useState } from 'react';
import { X, Star, Send } from 'lucide-react';
import { Game, Question } from '../../types';
import { playSound, startBackgroundMusic, stopBackgroundMusic } from '../../lib/sounds';

export default function OfflineGame({ game, onClose }: { game: Game, onClose: () => void }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [essayAnswer, setEssayAnswer] = useState('');

  React.useEffect(() => {
    startBackgroundMusic();
    return () => stopBackgroundMusic();
  }, []);

  const currentQuestion = game.questionsList[currentIdx];

  const handleAnswer = (idx: number) => {
    if (selectedIdx !== null || isGameOver) return;
    
    setSelectedIdx(idx);
    
    if (idx === currentQuestion.correct) {
      setScore(score + 10);
      playSound('correct');
    } else {
      playSound('wrong');
    }
    
    setTimeout(() => {
      if (currentIdx + 1 < game.questionsList.length) {
        setCurrentIdx(currentIdx + 1);
        setSelectedIdx(null);
      } else {
        setIsGameOver(true);
        playSound('winner');
        stopBackgroundMusic();
      }
    }, 1500);
  };

  const handleEssaySubmit = () => {
    if (!essayAnswer.trim() || isGameOver) return;
    
    setScore(score + 10);
    playSound('correct');
    setTimeout(() => {
      if (currentIdx + 1 < game.questionsList.length) {
        setCurrentIdx(currentIdx + 1);
        setEssayAnswer('');
      } else {
        setIsGameOver(true);
        playSound('winner');
        stopBackgroundMusic();
      }
    }, 1500);
  };

  const renderMedia = (url?: string) => {
    if (!url) return null;
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.includes('v=') ? url.split('v=')[1].split('&')[0] : url.split('/').pop();
      return <iframe className="w-full max-w-2xl mx-auto h-[250px] sm:h-[350px] rounded-2xl shadow-lg border-4 border-slate-200" src={`https://www.youtube.com/embed/${videoId}`} frameBorder="0" allowFullScreen></iframe>;
    }
    return <img src={url} className="max-h-[300px] mx-auto rounded-2xl shadow-lg border-4 border-slate-200 object-contain" />;
  };

  if (isGameOver) {
    return (
      <div className="bg-kids-fun fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 sm:p-12 text-center font-kids">
        <div className="text-9xl mb-6 animate-bounce">🏆</div>
        <h2 className="text-5xl font-black text-indigo-900 mb-4 uppercase">Tuyệt Cú Mèo!</h2>
        <p className="text-3xl text-slate-600 font-bold mb-10">Điểm của em: <span className="text-rose-500 font-black text-5xl bg-rose-100 px-4 py-2 rounded-2xl ml-2">{score}</span></p>
        <button onClick={onClose} className="px-10 py-5 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-full text-2xl shadow-[0_6px_0_#047857] active:translate-y-1 active:shadow-none transition uppercase tracking-wider border-2 border-emerald-300">Nhận Thưởng & Trở Về</button>
      </div>
    );
  }

  return (
    <div className="bg-kids-fun fixed inset-0 z-[100] flex flex-col w-full h-full font-kids">
      <div className="bg-white/40 backdrop-blur-md p-6 text-indigo-900 flex justify-between items-center z-10 border-b-4 border-white/50 shadow-sm">
        <h3 className="font-black text-3xl uppercase tracking-wider flex items-center gap-3">
          <Star className="text-yellow-500 fill-current w-8 h-8" /> {game.title}
        </h3>
        <div className="flex gap-4">
          <span className="bg-white px-6 py-3 rounded-full font-black text-xl shadow-sm text-rose-500 border-2 border-rose-100">Điểm: {score}</span>
          <button onClick={onClose} className="bg-white text-slate-500 hover:text-red-500 p-3 rounded-full transition shadow-sm border-2 border-slate-100"><X className="w-6 h-6 font-bold" /></button>
        </div>
      </div>
      
      <div className="p-4 sm:p-12 flex-1 flex flex-col items-center justify-center w-full relative overflow-y-auto">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
        
        <div className="w-full max-w-5xl px-4 mb-8 z-10">
          <div className="flex justify-between text-indigo-900/60 text-sm font-black mb-2 uppercase tracking-widest">
            <span>Câu hỏi {currentIdx + 1} / {game.questionsList.length}</span>
            <span>{Math.round(((currentIdx + 1) / game.questionsList.length) * 100)}%</span>
          </div>
          <div className="w-full h-4 bg-white/40 rounded-full overflow-hidden border-2 border-white shadow-inner">
            <div 
              style={{ width: `${((currentIdx + 1) / game.questionsList.length) * 100}%` }}
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out rounded-full"
            />
          </div>
        </div>

        <div className="w-full max-w-5xl flex flex-col items-center z-10 bg-white/60 p-8 sm:p-12 rounded-[3rem] shadow-xl border-4 border-white backdrop-blur-sm">
          <div className="w-full text-center mb-10">
            {renderMedia(currentQuestion.mediaUrl)}
            <h2 className="text-3xl sm:text-5xl font-black text-indigo-900 mt-10 leading-tight drop-shadow-sm">{currentQuestion.text}</h2>
          </div>
          
          <div className="w-full">
            {currentQuestion.type === 'essay' ? (
              <div className="w-full flex flex-col gap-4">
                <textarea 
                  placeholder="Gõ câu trả lời..." 
                  value={essayAnswer}
                  onChange={(e) => setEssayAnswer(e.target.value)}
                  className="w-full p-6 text-2xl border-4 rounded-[2rem] h-40 outline-none focus:border-indigo-400 transition"
                />
                <button onClick={handleEssaySubmit} className="bg-emerald-500 hover:bg-emerald-600 text-white font-black text-3xl py-6 rounded-[2rem] shadow-[0_6px_0_#047857] active:translate-y-1 active:shadow-none transition flex items-center justify-center gap-2">
                  <Send className="w-8 h-8" /> GỬI
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
                {currentQuestion.options?.map((ans, idx) => {
                  const colors = ['bg-blue-500', 'bg-rose-500', 'bg-amber-500', 'bg-emerald-500'];
                  const isCorrect = idx === currentQuestion.correct;
                  const isSelected = selectedIdx === idx;
                  
                  return (
                    <button 
                      key={idx}
                      disabled={selectedIdx !== null}
                      onClick={() => handleAnswer(idx)}
                      className={`${colors[idx % colors.length]} text-white border-4 border-white/20 p-6 rounded-[2rem] text-3xl font-black transition-all hover:scale-105 active:scale-95 ${isSelected ? (isCorrect ? 'ring-8 ring-green-400' : 'ring-8 ring-red-400') : ''} ${selectedIdx !== null && isCorrect ? 'ring-8 ring-green-400' : ''}`}
                    >
                      {ans}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
