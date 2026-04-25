import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { X, Users, Sparkles, UserCheck } from 'lucide-react';
import { Student } from '../../types';
import { playSound } from '../../lib/sounds';

const wheelColors = ['#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9'];

export default function WheelGame({ students, onClose }: { students: Student[], onClose: () => void }) {
  const [names, setNames] = useState<string[]>(students.length > 0 ? students.map(s => s.name) : ["An", "Bình", "Cường", "Dung", "Hoa"]);
  const [namesInput, setNamesInput] = useState(names.join('\n'));
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelAngle, setWheelAngle] = useState(0);
  const [winner, setWinner] = useState<string | null>(null);
  const [isPlayMode, setIsPlayMode] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    drawWheel();
  }, [names, wheelAngle]);

  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cX = canvas.width / 2;
    const cY = canvas.height / 2;
    const r = Math.min(cX, cY) - 10;
    const sA = (2 * Math.PI) / names.length;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < names.length; i++) {
      const start = wheelAngle + i * sA;
      const end = start + sA;
      
      ctx.beginPath();
      ctx.moveTo(cX, cY);
      ctx.arc(cX, cY, r, start, end);
      ctx.closePath();
      
      ctx.fillStyle = wheelColors[i % wheelColors.length];
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 4;
      ctx.stroke();
      
      ctx.save();
      ctx.translate(cX, cY);
      ctx.rotate(start + sA / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#fff";
      ctx.font = "900 24px Arial";
      ctx.fillText(names[i], r - 20, 10);
      ctx.restore();
    }
  };

  const spinWheel = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setWinner(null);

    const spinAmt = Math.random() * Math.PI * 10 + Math.PI * 10;
    const duration = 4000;
    const startTime = performance.now();
    const startAngle = wheelAngle;
    playSound('spin');

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      if (elapsed < duration) {
        const progress = elapsed / duration;
        const easeOut = 1 - Math.pow(1 - progress, 4);
        setWheelAngle(startAngle + spinAmt * easeOut);
        requestAnimationFrame(animate);
      } else {
        const finalAngle = startAngle + spinAmt;
        setWheelAngle(finalAngle);
        setIsSpinning(false);
        
        const sA = (2 * Math.PI) / names.length;
        const nA = finalAngle % (2 * Math.PI);
        let pA = (3 * Math.PI / 2) - nA;
        if (pA < 0) pA += 2 * Math.PI;
        const winnerIdx = Math.floor(pA / sA);
        setWinner(names[winnerIdx]);
        playSound('winner');
      }
    };
    requestAnimationFrame(animate);
  };

  const updateNames = () => {
    const newNames = namesInput.split('\n').map(n => n.trim()).filter(n => n);
    if (newNames.length > 1) {
      setNames(newNames);
    }
  };

  return (
    <div className="bg-kids-sky fixed inset-0 z-[100] flex flex-col w-full h-full font-kids">
      <div className="w-full flex justify-between items-center p-2 sm:p-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-sm border-b border-blue-200 dark:border-slate-700 shrink-0 z-10">
        <h2 className="text-xl font-black flex items-center gap-2 uppercase text-blue-800 dark:text-white"><Sparkles className="text-rose-500 w-6 h-6" /> Vòng quay may mắn</h2>
        <div className="flex gap-3">
          {isPlayMode && <button onClick={() => setIsPlayMode(false)} className="text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl font-bold border-2 border-rose-200 hover:bg-rose-100 transition shadow-sm text-sm">Cài đặt</button>}
          <button onClick={onClose} className="text-slate-600 bg-white px-3 py-1.5 rounded-xl font-bold border-2 border-slate-200 hover:bg-slate-50 transition shadow-sm text-sm">Thoát</button>
        </div>
      </div>

      <div className="flex-1 w-full p-4 flex items-center justify-center relative">
        <div className="flex flex-col md:flex-row gap-6 lg:gap-12 h-full max-w-6xl mx-auto w-full items-center md:items-stretch z-10">
          {!isPlayMode && (
            <div className="w-full md:w-[350px] bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-xl border-4 border-white flex flex-col shrink-0 h-auto">
              <h3 className="text-2xl font-black mb-6 text-slate-800 dark:text-white flex items-center gap-2"><Users className="text-blue-500" /> Danh sách học sinh</h3>
              <textarea 
                value={namesInput} 
                onChange={(e) => setNamesInput(e.target.value)}
                className="w-full h-40 p-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl resize-y text-base font-medium outline-none focus:border-blue-400"
              />
              <div className="flex flex-col gap-3 mt-6">
                <button onClick={updateNames} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-black py-4 rounded-xl transition shadow-[0_4px_0_#1e3a8a] active:translate-y-1 active:shadow-none border-2 border-blue-400 uppercase">Lưu Danh Sách</button>
                <button onClick={() => setIsPlayMode(true)} className="w-full bg-rose-500 hover:bg-rose-600 text-white font-black py-4 rounded-xl transition shadow-[0_4px_0_#be123c] active:translate-y-1 active:shadow-none border-2 border-rose-400 uppercase">Chơi Toàn Màn</button>
              </div>
            </div>
          )}
          
          <div className={`flex-1 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-[3rem] shadow-2xl border-4 border-white flex flex-col items-center justify-center relative overflow-hidden p-8 w-full ${isPlayMode ? 'mx-auto max-w-5xl' : ''}`}>
            <div className="relative flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-20">
              <button 
                onClick={spinWheel} 
                disabled={isSpinning}
                className={`order-2 lg:order-1 px-10 py-6 bg-rose-500 hover:bg-rose-600 text-white rounded-[2.5rem] font-black text-2xl lg:text-3xl shadow-[0_10px_0_#be123c] active:translate-y-1 active:shadow-none transition-all hover:scale-105 border-4 border-white uppercase tracking-widest z-30 shrink-0 min-w-[200px] ${isSpinning ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSpinning ? 'Đang quay...' : 'Bắt đầu'}
              </button>

              <div className="relative order-1 lg:order-2 flex flex-col items-center">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[20px] border-r-[20px] border-t-[40px] border-transparent border-t-rose-600 z-20 filter drop-shadow-md"></div>
                <div className="rounded-full shadow-[0_0_40px_rgba(0,0,0,0.2)] border-[15px] border-white p-3 bg-gradient-to-br from-rose-100 to-blue-100 relative">
                  <canvas ref={canvasRef} width="600" height="600" className="rounded-full max-w-[320px] sm:max-w-[400px] lg:max-w-[500px] w-full h-auto bg-white shadow-inner"></canvas>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-white rounded-full border-4 border-rose-500 z-30 shadow-inner"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {winner && (
        <div className="absolute inset-0 z-[110] flex items-center justify-center bg-slate-900/60 p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-md text-center border-8 border-yellow-300"
          >
            <div className="text-8xl mb-6 animate-bounce">🎉</div>
            <p className="text-slate-500 font-black mb-2 uppercase tracking-widest text-lg bg-slate-100 inline-block px-4 py-1 rounded-full">Xin chúc mừng</p>
            <h2 className="text-6xl font-black text-rose-500 mb-10 uppercase break-words drop-shadow-sm mt-4">{winner}</h2>
            <button onClick={() => setWinner(null)} className="w-full px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white font-black text-xl rounded-2xl transition shadow-[0_6px_0_#1e3a8a] active:translate-y-1 active:shadow-none uppercase">Tiếp tục quay</button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
