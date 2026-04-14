import React, { useState, useEffect } from 'react';
import { X, Trophy, RotateCcw, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Game } from '../../types';

interface DragDropGameProps {
  game: Game;
  onClose: () => void;
}

interface MatchPair {
  id: string;
  draggable: string;
  target: string;
  isMatched: boolean;
}

export default function DragDropGame({ game, onClose }: DragDropGameProps) {
  const [pairs, setPairs] = useState<MatchPair[]>([]);
  const [draggables, setDraggables] = useState<MatchPair[]>([]);
  const [targets, setTargets] = useState<MatchPair[]>([]);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  useEffect(() => {
    initGame();
  }, [game]);

  const initGame = () => {
    if (!game.questionsList || game.questionsList.length === 0) return;

    const initialPairs: MatchPair[] = game.questionsList.map((q: any, index: number) => ({
      id: q.id || index.toString(),
      draggable: q.text,
      target: q.options?.[0] || q.text,
      isMatched: false
    }));

    setPairs(initialPairs);
    
    // Shuffle draggables and targets independently
    setDraggables([...initialPairs].sort(() => Math.random() - 0.5));
    setTargets([...initialPairs].sort(() => Math.random() - 0.5));
    
    setScore(0);
    setIsGameOver(false);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItemId(id);
    e.dataTransfer.setData('text/plain', id);
    setTimeout(() => {
      if (e.target) (e.target as HTMLElement).style.opacity = '0.5';
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.target) (e.target as HTMLElement).style.opacity = '1';
    setDraggedItemId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    processDrop(draggedId, targetId);
  };

  // Touch support for mobile
  const handleTouchStart = (e: React.TouchEvent, id: string) => {
    setDraggedItemId(id);
    if (e.target) (e.target as HTMLElement).style.opacity = '0.5';
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault(); // Prevent scrolling while dragging
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.target) (e.target as HTMLElement).style.opacity = '1';
    
    if (!draggedItemId) return;
    
    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (element) {
      // Find the closest drop target
      const targetEl = element.closest('[data-target-id]');
      if (targetEl) {
        const targetId = targetEl.getAttribute('data-target-id');
        if (targetId) {
          processDrop(draggedItemId, targetId);
        }
      }
    }
    setDraggedItemId(null);
  };

  const processDrop = (draggedId: string, targetId: string) => {
    if (draggedId === targetId) {
      setPairs(prev => prev.map(p => p.id === draggedId ? { ...p, isMatched: true } : p));
      setScore(prev => prev + 10);
      
      const matchedCount = pairs.filter(p => p.isMatched).length + 1;
      if (matchedCount === pairs.length) {
        setTimeout(() => setIsGameOver(true), 500);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/90 z-[100] flex flex-col">
      <div className="p-4 flex justify-between items-center bg-slate-800 text-white shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold">{game.title}</h2>
          <div className="px-4 py-1 bg-slate-700 rounded-full font-bold text-orange-400">
            Điểm: {score}
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full transition">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-8 flex items-center justify-center">
        {isGameOver ? (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-800 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl"
          >
            <Trophy className="w-24 h-24 text-yellow-500 mx-auto mb-6" />
            <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-2">Tuyệt vời!</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Bạn đã hoàn thành trò chơi với {score} điểm</p>
            <div className="flex gap-4 justify-center">
              <button 
                onClick={initGame}
                className="px-6 py-3 bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-600 flex items-center gap-2"
              >
                <RotateCcw className="w-5 h-5" /> Chơi lại
              </button>
              <button 
                onClick={onClose}
                className="px-6 py-3 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300"
              >
                Thoát
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
            {/* Draggables Container */}
            <div className="space-y-4">
              <h3 className="text-center text-white font-bold text-xl mb-6">Kéo các mục ở đây</h3>
              <div className="flex flex-wrap gap-4 justify-center">
                <AnimatePresence>
                  {draggables.map((item) => {
                    const isMatched = pairs.find(p => p.id === item.id)?.isMatched;
                    if (isMatched) return null;
                    
                    return (
                      <motion.div
                        key={`drag-${item.id}`}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                      >
                        <div
                          draggable
                          onDragStart={(e: any) => handleDragStart(e, item.id)}
                          onDragEnd={handleDragEnd}
                          onTouchStart={(e: any) => handleTouchStart(e, item.id)}
                          onTouchMove={handleTouchMove}
                          onTouchEnd={handleTouchEnd}
                          className="px-6 py-4 bg-white text-slate-800 font-bold rounded-2xl shadow-lg cursor-grab active:cursor-grabbing border-4 border-indigo-200 hover:border-indigo-400 transition-colors select-none text-lg"
                        >
                          {item.draggable}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>

            {/* Targets Container */}
            <div className="space-y-4">
              <h3 className="text-center text-white font-bold text-xl mb-6">Thả vào ô tương ứng</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {targets.map((item) => {
                  const isMatched = pairs.find(p => p.id === item.id)?.isMatched;
                  
                  return (
                    <div
                      key={`target-${item.id}`}
                      data-target-id={item.id}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, item.id)}
                      className={`relative p-6 rounded-2xl border-4 border-dashed flex items-center justify-center text-center min-h-[100px] transition-colors ${
                        isMatched 
                          ? 'bg-green-500/20 border-green-500 text-green-400' 
                          : 'bg-slate-800/50 border-slate-600 text-slate-300 hover:border-indigo-400 hover:bg-slate-800'
                      }`}
                    >
                      {isMatched ? (
                        <div className="flex flex-col items-center gap-2">
                          <CheckCircle2 className="w-8 h-8 text-green-500" />
                          <span className="font-bold">{item.draggable} = {item.target}</span>
                        </div>
                      ) : (
                        <span className="font-bold text-lg">{item.target}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
