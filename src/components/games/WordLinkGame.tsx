import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, ArrowRight, RefreshCw, Sparkles, MessageSquare } from 'lucide-react';
import { Game } from '../../types';
import { playSound } from '../../lib/sounds';

export default function WordLinkGame({ game, onClose }: { game: Game, onClose: () => void }) {
  const [currentWord, setCurrentWord] = useState('');
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [message, setMessage] = useState('Hãy bắt đầu bằng một từ bất kỳ!');
  const [usedWords, setUsedWords] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (timeLeft > 0 && !isGameOver) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      handleGameOver();
    }
  }, [timeLeft, isGameOver]);

  const handleGameOver = () => {
    setIsGameOver(true);
    playSound('game_over');
  };

  const validateWord = (word: string) => {
    const cleanWord = word.trim().toLowerCase();
    if (!cleanWord) return false;
    if (usedWords.has(cleanWord)) {
      setMessage('Từ này đã được sửate dụng rồi!');
      return false;
    }
    
    if (currentWord) {
      const currentLastSyllable = currentWord.split(' ').pop()?.toLowerCase();
      const nextFirstSyllable = cleanWord.split(' ')[0].toLowerCase();
      
      if (currentLastSyllable !== nextFirstSyllable) {
        setMessage(`Từ phải bắt đầu bằng "${currentLastSyllable}"!`);
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isGameOver) return;

    if (validateWord(input)) {
      const cleanWord = input.trim();
      setUsedWords(new Set([...usedWords, cleanWord.toLowerCase()]));
      setHistory([...history, cleanWord]);
      setCurrentWord(cleanWord);
      setScore(score + 10);
      setInput('');
      setMessage('Giỏi quá! Tiếp tục nào!');
      playSound('correct');
      setTimeLeft(prev => Math.min(prev + 5, 60)); // Bonus time
    } else {
      playSound('wrong');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-indigo-600 flex flex-col items-center justify-center p-4 font-kids">
      <div className="absolute top-6 right-6 flex gap-4">
        <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/30 text-white flex items-center gap-3">
          <Trophy className="w-6 h-6 text-yellow-300" />
          <span className="text-2xl font-black">{score}</span>
        </div>
        <button onClick={onClose} className="bg-white/20 backdrop-blur-md p-3 rounded-2xl border border-white/30 text-white hover:bg-white/30 transition">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl p-8 flex flex-col items-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500" />
        
        <div className="mb-8 text-center">
          <h2 className="text-4xl font-black text-indigo-900 mb-2">TRÒ CHƠI NỐI TỪ</h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest">{game.title}</p>
        </div>

        {!isGameOver ? (
          <>
            <div className="w-full mb-8">
              <div className="flex justify-between items-center mb-4">
                <span className="text-slate-400 font-bold">THỜI GIAN CÒN LẠI</span>
                <span className={`text-2xl font-black ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-indigo-600'}`}>
                  {timeLeft}s
                </span>
              </div>
              <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-indigo-500"
                  initial={{ width: '100%' }}
                  animate={{ width: `${(timeLeft / 60) * 100}%` }}
                />
              </div>
            </div>

            <div className="w-full bg-indigo-50 rounded-3xl p-8 mb-8 flex flex-col items-center border-4 border-indigo-100">
              <p className="text-slate-500 font-bold mb-4">TỪ HIỆN TẠI</p>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentWord}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-5xl font-black text-indigo-600 uppercase tracking-tight text-center"
                >
                  {currentWord || 'BẮT ĐẦU'}
                </motion.div>
              </AnimatePresence>
            </div>

            <form onSubmit={handleSubmit} className="w-full space-y-4">
              <div className="relative">
                <input 
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Nhập từ nối tiếp..."
                  autoFocus
                  className="w-full p-6 bg-slate-50 border-4 border-slate-100 rounded-3xl outline-none focus:border-indigo-500 text-2xl font-bold text-indigo-900 transition-all placeholder:text-slate-300"
                />
                <button 
                  type="submit"
                  className="absolute right-3 top-3 bottom-3 px-8 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition flex items-center gap-2"
                >
                  GỬI <ArrowRight className="w-6 h-6" />
                </button>
              </div>
              <p className={`text-center font-bold ${message.includes('Giỏi') ? 'text-emerald-500' : 'text-orange-500'}`}>
                {message}
              </p>
            </form>

            <div className="w-full mt-8">
              <p className="text-slate-400 font-bold mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> LỊCH SỬ TỪ
              </p>
              <div className="flex flex-wrap gap-2">
                {history.map((word, idx) => (
                  <span key={idx} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold border border-slate-200">
                    {word}
                  </span>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="w-32 h-32 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-16 h-16 text-yellow-500" />
            </div>
            <h3 className="text-4xl font-black text-indigo-900 mb-2">HẾT GIỜ!</h3>
            <p className="text-xl text-slate-500 mb-8 font-bold">Bạn đã đạt được <span className="text-indigo-600">{score}</span> điểm</p>
            
            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => {
                  setScore(0);
                  setHistory([]);
                  setCurrentWord('');
                  setUsedWords(new Set());
                  setTimeLeft(60);
                  setIsGameOver(false);
                  setMessage('Hãy bắt đầu bằng một từ bất kỳ!');
                }}
                className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition flex items-center gap-2"
              >
                <RefreshCw className="w-6 h-6" /> CHƠI LẠI
              </button>
              <button 
                onClick={onClose}
                className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition"
              >
                THOÁT
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
