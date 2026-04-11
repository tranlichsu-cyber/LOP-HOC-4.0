import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, RefreshCcw, Timer, Brain } from 'lucide-react';
import { Game } from '../../types';
import { playSound, startBackgroundMusic, stopBackgroundMusic } from '../../lib/sounds';

interface Card {
  id: string;
  content: string;
  mediaUrl?: string;
  pairId: string;
}

export default function MemoryGame({ game, onClose }: { game: Game, onClose: () => void }) {
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(game.timeLimit || 60);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [score, setScore] = useState(0);

  useEffect(() => {
    const baseCards = game.questionsList.slice(0, 8).map(q => ({
      pairId: q.id,
      content: q.text,
      mediaUrl: q.mediaUrl
    }));

    const duplicatedCards: Card[] = [
      ...baseCards.map((c, i) => ({ ...c, id: `a-${i}` })),
      ...baseCards.map((c, i) => ({ ...c, id: `b-${i}` }))
    ];

    setCards(duplicatedCards.sort(() => Math.random() - 0.5));
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

  const handleCardClick = (cardId: string) => {
    if (gameState !== 'playing' || flipped.length === 2 || flipped.includes(cardId) || matched.includes(cardId)) return;

    const newFlipped = [...flipped, cardId];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      const [firstId, secondId] = newFlipped;
      const firstCard = cards.find(c => c.id === firstId);
      const secondCard = cards.find(c => c.id === secondId);

      if (firstCard?.pairId === secondCard?.pairId) {
        // Match!
        const newMatched = [...matched, firstId, secondId];
        setMatched(newMatched);
        setScore(prev => prev + 20);
        setFlipped([]);
        playSound('correct');

        if (newMatched.length === cards.length) {
          setGameState('won');
          playSound('winner');
          stopBackgroundMusic();
        }
      } else {
        // No match
        playSound('wrong');
        setTimeout(() => {
          setFlipped([]);
        }, 1000);
      }
    }
  };

  const resetGame = () => {
    setMatched([]);
    setFlipped([]);
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
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Trò chơi lật hình</p>
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
      <div className="flex-1 w-full max-w-4xl grid grid-cols-4 gap-4">
        {cards.map((card) => {
          const isFlipped = flipped.includes(card.id) || matched.includes(card.id);
          const isMatched = matched.includes(card.id);

          return (
            <motion.div
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className="relative perspective-1000 cursor-pointer h-full min-h-[120px]"
            >
              <motion.div
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                className="w-full h-full relative preserve-3d"
              >
                {/* Front (Hidden) */}
                <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl border-4 border-white/20 flex items-center justify-center shadow-xl">
                  <Brain className="w-12 h-12 text-white/20" />
                </div>

                {/* Back (Revealed) */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white rounded-3xl border-4 border-white flex items-center justify-center overflow-hidden shadow-xl">
                  {card.mediaUrl ? (
                    <img src={card.mediaUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="p-4 text-slate-800 font-black text-center text-sm md:text-base leading-tight">
                      {card.content}
                    </span>
                  )}
                  {isMatched && (
                    <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                      <div className="bg-emerald-500 p-2 rounded-full shadow-lg">
                        <Trophy className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          );
        })}
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
                {gameState === 'won' ? 'Siêu trí tuệ!' : 'Tiếc quá!'}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">
                {gameState === 'won' ? `Em đã ghi nhớ tất cả các cặp hình với ${score} điểm!` : 'Hãy rèn luyện trí nhớ thêm một chút nữa nhé!'}
              </p>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={resetGame}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20"
                >
                  <RefreshCcw className="w-5 h-5" />
                  Thử lại
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

      <style dangerouslySetInnerHTML={{ __html: `
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}} />
    </div>
  );
}
