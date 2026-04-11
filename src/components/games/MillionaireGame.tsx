import React, { useState, useEffect } from 'react';
import { X, Phone, Users, Star, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Game } from '../../types';
import { playSound, startBackgroundMusic, stopBackgroundMusic } from '../../lib/sounds';

const milPrizes = [200, 400, 600, 1000, 2000, 3000, 6000, 10000, 14000, 22000, 30000, 40000, 60000, 85000, 150000];

export default function MillionaireGame({ game, onClose }: { game: Game, onClose: () => void }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [lifelines, setLifelines] = useState({ fifty: true, phone: true, audience: true });
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [correctIdx, setCorrectIdx] = useState<number | null>(null);
  const [wrongIdx, setWrongIdx] = useState<number | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWin, setIsWin] = useState(false);
  const [hint, setHint] = useState<{ title: string, message: string } | null>(null);
  const [hiddenOptions, setHiddenOptions] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(30);

  const currentQuestion = game.questionsList[currentIdx];

  useEffect(() => {
    startBackgroundMusic();
    return () => stopBackgroundMusic();
  }, []);

  useEffect(() => {
    
    const limit = currentQuestion.timeLimit || game.timeLimit || 30;
    setTimeLeft(limit);
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIdx, isGameOver, selectedIdx]);

  const handleTimeUp = () => {
    if (selectedIdx !== null || isGameOver) return;
    setWrongIdx(-1); // Mark as time up
    setCorrectIdx(currentQuestion.correct!);
    playSound('wrong');
    stopBackgroundMusic();
    setTimeout(() => {
      setIsWin(false);
      setIsGameOver(true);
      playSound('game_over');
    }, 2000);
  };

  const handleAnswer = (idx: number) => {
    if (selectedIdx !== null || isGameOver) return;
    
    setSelectedIdx(idx);
    playSound('click');
    
    setTimeout(() => {
      if (idx === currentQuestion.correct) {
        setCorrectIdx(idx);
        playSound('correct');
        setTimeout(() => {
          if (currentIdx + 1 < Math.min(15, game.questionsList.length)) {
            setCurrentIdx(currentIdx + 1);
            setSelectedIdx(null);
            setCorrectIdx(null);
            setHiddenOptions([]);
          } else {
            setIsWin(true);
            setIsGameOver(true);
            playSound('winner');
            stopBackgroundMusic();
          }
        }, 2000);
      } else {
        setWrongIdx(idx);
        setCorrectIdx(currentQuestion.correct!);
        playSound('wrong');
        stopBackgroundMusic();
        setTimeout(() => {
          setIsWin(false);
          setIsGameOver(true);
          playSound('game_over');
        }, 2000);
      }
    }, 2000);
  };

  const playHintSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.5);

      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.error("Audio error", e);
    }
  };

  const useLifeline = (type: 'fifty' | 'phone' | 'audience') => {
    if (!lifelines[type] || isGameOver) return;
    
    setLifelines({ ...lifelines, [type]: false });
    playHintSound();
    
    if (type === 'fifty') {
      const wrong = [0, 1, 2, 3]
        .filter(i => i !== currentQuestion.correct)
        .sort(() => 0.5 - Math.random())
        .slice(0, 2);
      setHiddenOptions(wrong);
    } else if (type === 'phone') {
      setHint({
        title: '📞 Gọi điện cho người thân',
        message: `"Ừ... để tớ nghĩ xem... Tớ nghĩ là đáp án ${['A', 'B', 'C', 'D'][currentQuestion.correct!]}."`
      });
    } else if (type === 'audience') {
      setHint({
        title: '👥 Hỏi ý kiến khán giả',
        message: `Khán giả bình chọn: ${['A', 'B', 'C', 'D'][currentQuestion.correct!]} chiếm 75%, các đáp án khác chiếm 25%`
      });
    }
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
    const pIdx = isWin ? currentIdx : (currentIdx >= 5 ? 4 : -1);
    const prize = pIdx >= 0 ? milPrizes[pIdx] : 0;

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 z-10 w-full text-center bg-slate-900 text-white">
        <Award className="w-32 h-32 text-yellow-400 mb-6 drop-shadow-[0_0_20px_rgba(250,204,21,0.5)]" />
        <h2 className="text-3xl sm:text-5xl font-black mb-4 uppercase drop-shadow-md">{isWin ? "CHÚC MỪNG BẠN!" : "DỪNG CUỘC CHƠI!"}</h2>
        <p className="text-xl sm:text-2xl text-blue-200 font-bold mb-8">Bạn đã giành được: <br/><span className="text-6xl text-yellow-400 font-black mt-2 inline-block">{prize.toLocaleString()} ĐIỂM</span></p>
        <button onClick={onClose} className="px-10 py-4 mil-polygon border-2 border-yellow-400 text-yellow-400 font-bold hover:bg-yellow-400 hover:text-slate-900 transition text-xl">Rời khỏi trường quay</button>
      </div>
    );
  }

  return (
    <div className="mil-bg-gradient fixed inset-0 z-[100] flex flex-col md:flex-row overflow-hidden font-sans">
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#4338ca 1px, transparent 1px), linear-gradient(90deg, #4338ca 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      
      <div className="flex-1 flex flex-col items-center justify-end p-4 sm:p-8 z-10 w-full relative">
        <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex gap-2 sm:gap-3 z-30">
          <button onClick={() => useLifeline('fifty')} disabled={!lifelines.fifty} className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-yellow-500 flex items-center justify-center text-yellow-500 font-black text-sm sm:text-xl transition shadow-[0_0_15px_rgba(234,179,8,0.4)] bg-slate-900/80 ${!lifelines.fifty ? 'lifeline-used' : 'hover:bg-yellow-500 hover:text-slate-900'}`}>50</button>
          <button onClick={() => useLifeline('phone')} disabled={!lifelines.phone} className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-yellow-500 flex items-center justify-center text-yellow-500 font-black transition shadow-[0_0_15px_rgba(234,179,8,0.4)] bg-slate-900/80 ${!lifelines.phone ? 'lifeline-used' : 'hover:bg-yellow-500 hover:text-slate-900'}`}><Phone className="w-5 h-5 sm:w-6 sm:h-6" /></button>
          <button onClick={() => useLifeline('audience')} disabled={!lifelines.audience} className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-yellow-500 flex items-center justify-center text-yellow-500 font-black transition shadow-[0_0_15px_rgba(234,179,8,0.4)] bg-slate-900/80 ${!lifelines.audience ? 'lifeline-used' : 'hover:bg-yellow-500 hover:text-slate-900'}`}><Users className="w-5 h-5 sm:w-6 sm:h-6" /></button>
        </div>

        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 text-center w-full flex justify-center pointer-events-none"
        >
          <div className="bg-blue-900/80 p-4 rounded-xl border-2 border-blue-400/50 text-white font-black text-xl shadow-[0_0_20px_rgba(59,130,246,0.5)]">
            AI LÀ TRIỆU PHÚ
          </div>
        </motion.div>

        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-4 z-30">
          <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center font-black text-2xl shadow-lg transition-colors ${timeLeft <= 5 ? 'border-red-500 text-red-500 animate-pulse bg-red-900/20' : 'border-blue-400 text-blue-400 bg-blue-900/20'}`}>
            {timeLeft}
          </div>
          <button onClick={onClose} className="text-blue-300 hover:text-white p-2 rounded-full border border-blue-700 hover:bg-blue-800 transition"><X className="w-6 h-6" /></button>
        </div>

        <div className="w-full max-w-4xl px-4 mb-4 mt-28 z-10">
          <div className="flex justify-between text-blue-200 text-xs font-bold mb-1 uppercase tracking-wider">
            <span>Câu hỏi {currentIdx + 1} / {Math.min(15, game.questionsList.length)}</span>
            <span>{Math.round(((currentIdx + 1) / Math.min(15, game.questionsList.length)) * 100)}%</span>
          </div>
          <div className="w-full h-2.5 bg-blue-900/50 rounded-full overflow-hidden border border-blue-400/30">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${((currentIdx + 1) / Math.min(15, game.questionsList.length)) * 100}%` }}
              transition={{ type: "spring", stiffness: 50, damping: 15 }}
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 shadow-[0_0_10px_rgba(59,130,246,0.8)]"
            />
          </div>
        </div>

        <div className="w-full max-w-4xl text-center mb-6 z-10">
          <div className="mil-polygon bg-blue-900 border-2 border-blue-400 p-8 shadow-[0_0_20px_rgba(59,130,246,0.5)] text-white">
            {renderMedia(currentQuestion.mediaUrl)}
            <div className="mt-4 text-xl font-bold">{currentQuestion.text}</div>
          </div>
        </div>
        
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-4 gap-y-4 mb-4 z-10">
          {currentQuestion.options?.map((opt, idx) => (
            <button 
              key={idx}
              disabled={selectedIdx !== null || hiddenOptions.includes(idx)}
              onClick={() => handleAnswer(idx)}
              className={`mil-btn w-full px-6 py-4 text-white font-bold text-left ${selectedIdx === idx ? 'selected' : ''} ${correctIdx === idx ? 'correct' : ''} ${wrongIdx === idx ? 'wrong' : ''} ${hiddenOptions.includes(idx) ? 'opacity-0 pointer-events-none' : ''}`}
            >
              <span className="text-orange-400 font-black w-6 inline-block">{['A','B','C','D'][idx]}:</span> {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full md:w-64 bg-slate-900/80 border-l border-blue-800 p-4 flex flex-col z-10 shrink-0">
        <div className="hidden md:flex flex-col flex-1 overflow-y-auto justify-center">
          {[...Array(Math.min(15, game.questionsList.length))].map((_, i) => {
            const idx = Math.min(15, game.questionsList.length) - 1 - i;
            const isCurrent = idx === currentIdx;
            const isPassed = idx < currentIdx;
            const isMilestone = idx === 4 || idx === 9 || idx === 14;
            
            return (
              <div key={idx} className={`flex justify-between px-3 py-1 text-sm md:text-base ${isCurrent ? "bg-orange-500 text-white font-black rounded-lg" : isPassed ? "text-green-400" : isMilestone ? "text-white font-bold" : "text-yellow-500"}`}>
                <span>{idx + 1}</span>
                <span>{milPrizes[idx].toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {hint && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.5, rotate: -5, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="mil-polygon bg-slate-900 border-2 border-yellow-400 p-8 max-w-sm w-full mx-4 text-center shadow-[0_0_50px_rgba(250,204,21,0.5)] relative overflow-hidden"
            >
              {/* Background Logo */}
              <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/vi/c/c5/Ai_l%C3%A0_tri%E1%BB%87u_ph%C3%BA_logo.png" 
                  alt="Logo" 
                  className="w-full h-full object-contain scale-150"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="relative z-10">
                <p className="text-yellow-400 font-black text-xl mb-4 uppercase tracking-wider drop-shadow-md">{hint.title}</p>
                <p className="text-white text-lg leading-relaxed mb-6 font-medium" dangerouslySetInnerHTML={{ __html: hint.message }}></p>
                <button 
                  onClick={() => setHint(null)} 
                  className="mil-polygon border-2 border-yellow-400 text-yellow-400 font-bold px-8 py-3 hover:bg-yellow-400 hover:text-slate-900 transition text-base uppercase shadow-lg active:scale-95"
                >
                  Đã hiểu, cảm ơn!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
