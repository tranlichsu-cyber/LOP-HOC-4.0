import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, RefreshCw, HelpCircle, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';
import { Game } from '../../types';
import { playSound } from '../../lib/sounds';

interface CrosswordCell {
  char: string;
  isBlocked: boolean;
  number?: number;
  userInput: string;
  row: number;
  col: number;
}

export default function CrosswordGame({ game, onClose }: { game: Game, onClose: () => void }) {
  const [grid, setGrid] = useState<CrosswordCell[][]>([]);
  const [clues, setClues] = useState<{ number: number, clue: string, answer: string, direction: 'across' | 'down', row: number, col: number }[]>([]);
  const [selectedClue, setSelectedClue] = useState<number | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [focusedCell, setFocusedCell] = useState<{ row: number, col: number } | null>(null);

  useEffect(() => {
    generateGrid();
  }, [game]);

  useEffect(() => {
    if (timeLeft > 0 && !isGameOver) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setIsGameOver(true);
      playSound('game_over');
    }
  }, [timeLeft, isGameOver]);

  const generateGrid = () => {
    // For simplicity, we'll use the questionsList as clues
    // Each question should have text (clue) and options[0] (answer)
    const gridSize = 10;
    const newGrid: CrosswordCell[][] = Array(gridSize).fill(null).map((_, r) => 
      Array(gridSize).fill(null).map((_, c) => ({
        char: '',
        isBlocked: true,
        userInput: '',
        row: r,
        col: c
      }))
    );

    const newClues: any[] = [];
    let currentNumber = 1;

    // Simple placement logic: alternate across and down
    game.questionsList.forEach((q, idx) => {
      const answer = (q.options?.[0] || '').toUpperCase();
      if (!answer) return;

      const direction = idx % 2 === 0 ? 'across' : 'down';
      let placed = false;
      let attempts = 0;

      while (!placed && attempts < 50) {
        const r = Math.floor(Math.random() * (gridSize - (direction === 'down' ? answer.length : 0)));
        const c = Math.floor(Math.random() * (gridSize - (direction === 'across' ? answer.length : 0)));

        // Check if space is available
        let canPlace = true;
        for (let i = 0; i < answer.length; i++) {
          const cellR = direction === 'down' ? r + i : r;
          const cellC = direction === 'across' ? c + i : c;
          if (!newGrid[cellR][cellC].isBlocked && newGrid[cellR][cellC].char !== answer[i]) {
            canPlace = false;
            break;
          }
        }

        if (canPlace) {
          for (let i = 0; i < answer.length; i++) {
            const cellR = direction === 'down' ? r + i : r;
            const cellC = direction === 'across' ? c + i : c;
            newGrid[cellR][cellC].char = answer[i];
            newGrid[cellR][cellC].isBlocked = false;
            if (i === 0) newGrid[cellR][cellC].number = currentNumber;
          }
          newClues.push({ number: currentNumber, clue: q.text, answer, direction, row: r, col: c });
          currentNumber++;
          placed = true;
        }
        attempts++;
      }
    });

    setGrid(newGrid);
    setClues(newClues);
    if (newClues.length > 0) setSelectedClue(newClues[0].number);
  };

  const handleInput = (r: number, c: number, val: string) => {
    if (isGameOver) return;
    const newGrid = [...grid];
    newGrid[r][c].userInput = val.toUpperCase().slice(-1);
    setGrid(newGrid);

    // Auto-focus next cell
    if (val && selectedClue) {
      const clue = clues.find(cl => cl.number === selectedClue);
      if (clue) {
        const nextR = clue.direction === 'down' ? r + 1 : r;
        const nextC = clue.direction === 'across' ? c + 1 : c;
        if (nextR < 10 && nextC < 10 && !grid[nextR][nextC].isBlocked) {
          setFocusedCell({ row: nextR, col: nextC });
        }
      }
    }
  };

  const checkAnswers = () => {
    let correctCount = 0;
    let totalCells = 0;
    grid.forEach(row => row.forEach(cell => {
      if (!cell.isBlocked) {
        totalCells++;
        if (cell.char === cell.userInput) correctCount++;
      }
    }));

    if (correctCount === totalCells) {
      setScore(100);
      setIsGameOver(true);
      playSound('winner');
    } else {
      setScore(Math.floor((correctCount / totalCells) * 100));
      playSound('correct');
      alert(`Bạn đã đúng ${correctCount}/${totalCells} ô!`);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-emerald-600 flex flex-col items-center justify-center p-4 font-kids">
      <div className="absolute top-6 right-6 flex gap-4">
        <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/30 text-white flex items-center gap-3">
          <Trophy className="w-6 h-6 text-yellow-300" />
          <span className="text-2xl font-black">{score}</span>
        </div>
        <button onClick={onClose} className="bg-white/20 backdrop-blur-md p-3 rounded-2xl border border-white/30 text-white hover:bg-white/30 transition">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="w-full max-w-5xl bg-white rounded-[2rem] shadow-2xl p-8 flex flex-col md:flex-row gap-8 relative overflow-hidden h-[90vh]">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 via-teal-500 to-blue-500" />
        
        {/* Left: Grid */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="mb-6 text-center">
            <h2 className="text-3xl font-black text-emerald-900 mb-1 uppercase tracking-tight">GIẢI ĐỐ Ô CHỮ</h2>
            <p className="text-slate-500 font-bold text-sm">{game.title}</p>
          </div>

          <div className="grid grid-cols-10 gap-1 bg-slate-200 p-1 rounded-xl shadow-inner">
            {grid.map((row, r) => row.map((cell, c) => (
              <div 
                key={`${r}-${c}`}
                className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center relative rounded-md transition-all ${
                  cell.isBlocked ? 'bg-slate-800' : 'bg-white'
                } ${focusedCell?.row === r && focusedCell?.col === c ? 'ring-4 ring-emerald-400 z-10' : ''}`}
              >
                {!cell.isBlocked && (
                  <>
                    {cell.number && <span className="absolute top-0.5 left-1 text-[8px] sm:text-[10px] font-bold text-slate-400">{cell.number}</span>}
                    <input 
                      type="text"
                      value={cell.userInput}
                      onChange={e => handleInput(r, c, e.target.value)}
                      onFocus={() => setFocusedCell({ row: r, col: c })}
                      className="w-full h-full bg-transparent text-center text-lg sm:text-2xl font-black text-emerald-700 outline-none uppercase"
                    />
                  </>
                )}
              </div>
            )))}
          </div>

          <div className="mt-8 flex gap-4 w-full">
            <div className="flex-1 bg-emerald-50 rounded-2xl p-4 border-2 border-emerald-100 flex items-center justify-between">
              <span className="text-slate-500 font-bold text-xs uppercase">Thời gian</span>
              <span className={`text-xl font-black ${timeLeft < 30 ? 'text-red-500 animate-pulse' : 'text-emerald-600'}`}>
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <button 
              onClick={checkAnswers}
              className="flex-[2] bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-700 transition shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-6 h-6" /> KIỂM TRA
            </button>
          </div>
        </div>

        {/* Right: Clues */}
        <div className="w-full md:w-80 flex flex-col bg-slate-50 rounded-3xl border-2 border-slate-100 overflow-hidden">
          <div className="p-4 bg-white border-b-2 border-slate-100 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-emerald-500" />
            <h4 className="font-black text-slate-800 uppercase tracking-wider">Gợi ý ô chữ</h4>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {clues.map(cl => (
              <button
                key={cl.number}
                onClick={() => {
                  setSelectedClue(cl.number);
                  setFocusedCell({ row: cl.row, col: cl.col });
                }}
                className={`w-full text-left p-4 rounded-2xl transition-all border-2 ${
                  selectedClue === cl.number 
                    ? 'bg-white border-emerald-500 shadow-md scale-[1.02]' 
                    : 'bg-white border-transparent hover:border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center text-xs font-black">
                    {cl.number}
                  </span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {cl.direction === 'across' ? 'Hàng ngang' : 'Hàng dọc'}
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-700 leading-snug">{cl.clue}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isGameOver && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[110] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[3rem] p-12 text-center max-w-md w-full shadow-2xl"
            >
              <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-12 h-12 text-yellow-500" />
              </div>
              <h3 className="text-4xl font-black text-slate-900 mb-2">HOÀN THÀNH!</h3>
              <p className="text-xl text-slate-500 mb-8 font-bold">Điểm số của bạn: <span className="text-emerald-600">{score}</span></p>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    setIsGameOver(false);
                    setTimeLeft(300);
                    setScore(0);
                    generateGrid();
                  }}
                  className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-700 transition flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" /> CHƠI LẠI
                </button>
                <button 
                  onClick={onClose}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition"
                >
                  THOÁT
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
