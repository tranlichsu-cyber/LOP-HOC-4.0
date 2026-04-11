import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, RefreshCcw, Timer } from 'lucide-react';
import { Game } from '../../types';
import { playSound, startBackgroundMusic, stopBackgroundMusic } from '../../lib/sounds';

interface Card {
  id: string;
  content: string;
  pairId: string;
  type: 'left' | 'right';
}

export default function MatchingGame({ game, onClose }: { game: Game, onClose: () => void }) {
  const [cards, setCards] = useState<Card[]>([]);
  const [selected, setSelected] = useState<Card | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [wrong, setWrong] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(game.timeLimit || 60);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [score, setScore] = useState(0);

  useEffect(() => {
    const pairs = game.questionsList.map(q => ({
      id: q.id,
      left: q.text,
      right: q.options?.[0] || ''
    }));

    const leftCards: Card[] = pairs.map(p => ({ id: `l-${p.id}`, content: p.left, pairId: p.id, type: 'left' }));
    const rightCards: Card[] = pairs.map(p => ({ id: `r-${p.id}`, content: p.right, pairId: p.id, type: 'right' }));

    setCards([...leftCards, ...rightCards].sort(() => Math.random() - 0.5));
    startBackgroundMusic();
    return () => stopBackgroundMusic();
  }, [game]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameState('lost');
          playSound('game_over');
          stopBackgroundMusic();
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  const handleCardClick = (card: Card) => {
    if (gameState !== 'playing' || matched.includes(card.id) || selected?.id === card.id) return;

    if (!selected) {
      setSelected(card);
    } else {
      if (selected.pairId === card.pairId && selected.type !== card.type) {
        // Match!
        const newMatched = [...matched, selected.id, card.id];
        setMatched(newMatched);
        setScore(prev => prev + 10);
        setSelected(null);
        playSound('correct');

        if (newMatched.length === cards.length) {
          setGameState('won');
          playSound('winner');
          stopBackgroundMusic();
        }
      } else {
        // Wrong
        setWrong([selected.id, card.id]);
        playSound('wrong');
        setTimeout(() => {
          setWrong([]);
          setSelected(null);
        }, 1000);
      }
    }
  };

  const resetGame = () => {
    setMatched([]);
    setWrong([]);
    setSelected(null);
    setTimeLeft(game.timeLimit || 60);
    setGameState('playing');
    setScore(0);
    setCards(prev => [...prev].sort(() => Math.random() - 0.5));
    startBackgroundMusic();
  };

  return (
    <div className="fixed inset-0 z-[150] bg-slate-900 flex flex-col items-center justify-center p-4 md:p-8">
      {/* Header */}
      <div className="w-full max-w-5xl flex justify-between items-center mb-8">
        <div className="flex items-center gap-6">
          <button onClick={onClose} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">{game.title}</h2>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Trò chơi nối thẻ</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-white/10 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/10 flex items-center gap-3">
            <Timer className={`w-5 h-5 ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-blue-400'}`} />
            <span className={`text-xl font-black ${timeLeft < 10 ? 'text-red-500' : 'text-white'}`}>{timeLeft}s</span>
          </div>
          <div className="bg-white/10 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/10 flex items-center gap-3">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span className="text-xl font-black text-white">{score}</span>
          </div>
        </div>
      </div>

      {/* Game Board */}
      <div className="flex-1 w-full max-w-5xl grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 overflow-y-auto pr-2 custom-scrollbar">
        <AnimatePresence>
          {cards.map((card) => {
            const isSelected = selected?.id === card.id;
            const isMatched = matched.includes(card.id);
            const isWrong = wrong.includes(card.id);

            return (
              <motion.button
                key={card.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: isMatched ? 0.5 : 1, 
                  scale: isSelected ? 1.05 : 1,
                  y: isMatched ? -10 : 0
                }}
                whileHover={{ scale: isMatched ? 1 : 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleCardClick(card)}
                className={`
                  relative h-32 md:h-40 p-4 rounded-3xl border-4 transition-all flex items-center justify-center text-center
                  ${isSelected ? 'border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/20' : 
                    isMatched ? 'border-emerald-500 bg-emerald-500/20' : 
                    isWrong ? 'border-red-500 bg-red-500/20 animate-shake' : 
                    'border-white/10 bg-white/5 hover:bg-white/10'}
                `}
              >
                <span className={`font-bold text-sm md:text-base leading-tight ${isMatched ? 'text-emerald-400' : 'text-white'}`}>
                  {card.content}
                </span>
                
                {isMatched && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg"
                  >
                    <Trophy className="w-4 h-4 text-white" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {gameState !== 'playing' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-2xl max-w-md w-full text-center border border-white/10"
            >
              <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl ${gameState === 'won' ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-red-500 shadow-red-500/20'}`}>
                {gameState === 'won' ? <Trophy className="w-12 h-12 text-white" /> : <X className="w-12 h-12 text-white" />}
              </div>
              
              <h3 className="text-3xl font-black text-slate-800 dark:text-white mb-2">
                {gameState === 'won' ? 'Tuyệt vời!' : 'Hết giờ rồi!'}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">
                {gameState === 'won' ? `Em đã hoàn thành xuất sắc trò chơi với ${score} điểm!` : 'Đừng buồn nhé, hãy thử lại để đạt kết quả tốt hơn!'}
              </p>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={resetGame}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20"
                >
                  <RefreshCcw className="w-5 h-5" />
                  Chơi lại
                </button>
                <button 
                  onClick={onClose}
                  className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black py-4 rounded-2xl transition-all"
                >
                  Thoát
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
