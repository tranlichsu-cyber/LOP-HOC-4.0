import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, RefreshCcw, Timer, Search } from 'lucide-react';
import { Game } from '../../types';
import { playSound, startBackgroundMusic, stopBackgroundMusic } from '../../lib/sounds';

const GRID_SIZE = 10;

export default function WordSearchGame({ game, onClose }: { game: Game, onClose: () => void }) {
  const [grid, setGrid] = useState<string[][]>([]);
  const [words, setWords] = useState<string[]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [selection, setSelection] = useState<{ r: number, c: number }[]>([]);
  const [timeLeft, setTimeLeft] = useState(game.timeLimit || 120);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [score, setScore] = useState(0);

  useEffect(() => {
    const gameWords = game.questionsList.map(q => q.text.toUpperCase().replace(/\s/g, '')).filter(w => w.length <= GRID_SIZE);
    setWords(gameWords);
    generateGrid(gameWords);
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

  const generateGrid = (wordsToPlace: string[]) => {
    const newGrid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(''));
    
    // Place words
    wordsToPlace.forEach(word => {
      let placed = false;
      let attempts = 0;
      while (!placed && attempts < 100) {
        const direction = Math.random() > 0.5 ? 'H' : 'V';
        const r = Math.floor(Math.random() * GRID_SIZE);
        const c = Math.floor(Math.random() * GRID_SIZE);
        
        if (canPlace(newGrid, word, r, c, direction)) {
          placeWord(newGrid, word, r, c, direction);
          placed = true;
        }
        attempts++;
      }
    });

    // Fill empty cells
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (newGrid[r][c] === '') {
          newGrid[r][c] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        }
      }
    }
    setGrid(newGrid);
  };

  const canPlace = (grid: string[][], word: string, r: number, c: number, dir: 'H' | 'V') => {
    if (dir === 'H') {
      if (c + word.length > GRID_SIZE) return false;
      for (let i = 0; i < word.length; i++) {
        if (grid[r][c + i] !== '' && grid[r][c + i] !== word[i]) return false;
      }
    } else {
      if (r + word.length > GRID_SIZE) return false;
      for (let i = 0; i < word.length; i++) {
        if (grid[r + i][c] !== '' && grid[r + i][c] !== word[i]) return false;
      }
    }
    return true;
  };

  const placeWord = (grid: string[][], word: string, r: number, c: number, dir: 'H' | 'V') => {
    for (let i = 0; i < word.length; i++) {
      if (dir === 'H') grid[r][c + i] = word[i];
      else grid[r + i][c] = word[i];
    }
  };

  const handleCellClick = (r: number, c: number) => {
    if (gameState !== 'playing') return;

    const newSelection = [...selection];
    const index = newSelection.findIndex(s => s.r === r && s.c === c);

    if (index !== -1) {
      newSelection.splice(index, 1);
    } else {
      newSelection.push({ r, c });
    }
    setSelection(newSelection);

    // Check if selection matches any word
    const selectedText = newSelection.map(s => grid[s.r][s.c]).join('');
    const reversedText = selectedText.split('').reverse().join('');

    const foundWord = words.find(w => (w === selectedText || w === reversedText) && !foundWords.includes(w));
    if (foundWord) {
      const newFound = [...foundWords, foundWord];
      setFoundWords(newFound);
      setScore(prev => prev + 50);
      setSelection([]);
      playSound('correct');

      if (newFound.length === words.length) {
        setGameState('won');
        playSound('winner');
        stopBackgroundMusic();
      }
    }
  };

  const resetGame = () => {
    setFoundWords([]);
    setSelection([]);
    setTimeLeft(game.timeLimit || 120);
    setGameState('playing');
    setScore(0);
    generateGrid(words);
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
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Trò chơi tìm từ</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-white/10 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/10 flex items-center gap-3">
            <Timer className={`w-5 h-5 ${timeLeft < 15 ? 'text-red-500 animate-pulse' : 'text-blue-400'}`} />
            <span className={`text-xl font-black ${timeLeft < 15 ? 'text-red-500' : 'text-white'}`}>{timeLeft}s</span>
          </div>
          <div className="bg-white/10 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/10 flex items-center gap-3">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span className="text-xl font-black text-white">{score}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full max-w-6xl flex flex-col md:flex-row gap-8 overflow-hidden">
        {/* Grid */}
        <div className="flex-1 bg-white/5 p-4 rounded-[2.5rem] border border-white/10 flex items-center justify-center">
          <div className="grid grid-cols-10 gap-1 sm:gap-2">
            {grid.map((row, r) => row.map((char, c) => {
              const isSelected = selection.some(s => s.r === r && s.c === c);
              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  className={`
                    w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl font-black text-lg sm:text-xl transition-all
                    ${isSelected ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 scale-110' : 'bg-white/10 text-slate-300 hover:bg-white/20'}
                  `}
                >
                  {char}
                </button>
              );
            }))}
          </div>
        </div>

        {/* Word List */}
        <div className="w-full md:w-72 bg-white/5 p-8 rounded-[2.5rem] border border-white/10 flex flex-col">
          <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-400" />
            Từ cần tìm
          </h3>
          <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
            {words.map((word, idx) => (
              <div 
                key={idx}
                className={`
                  p-4 rounded-2xl font-bold transition-all border
                  ${foundWords.includes(word) ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 line-through' : 'bg-white/5 border-white/10 text-slate-400'}
                `}
              >
                {word}
              </div>
            ))}
          </div>
        </div>
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
                {gameState === 'won' ? 'Thám tử tài ba!' : 'Hết giờ rồi!'}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">
                {gameState === 'won' ? `Em đã tìm thấy tất cả các từ ẩn giấu với ${score} điểm!` : 'Hãy tinh mắt hơn ở lần chơi sau nhé!'}
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
