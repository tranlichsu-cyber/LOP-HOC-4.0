import React, { useState, useRef } from 'react';
import { Play, Pause, RotateCcw, Lightbulb, Microscope, Atom, Globe, BookOpen, ChevronRight, Sparkles, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function InteractiveLibrary() {
  const [activeTab, setActiveTab] = useState<'simulations' | 'videos'>('simulations');
  const [selectedSim, setSelectedSim] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const simulations = [
    {
      id: 'balance',
      title: 'Cân Thăng Bằng 3D',
      subject: 'Toán học',
      description: 'Khám phá khái niệm về trọng lượng và sự cân bằng thông qua việc đặt các vật thể lên bàn cân 3D sinh động.',
      icon: <Microscope className="w-6 h-6" />,
      color: 'bg-gradient-to-br from-blue-400 to-blue-600',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4'
    },
    {
      id: 'solar',
      title: 'Vũ Trụ 3D',
      subject: 'Khoa học',
      description: 'Mô phỏng 3D quỹ đạo của các hành tinh và tìm hiểu thông tin thú vị về hệ mặt trời.',
      icon: <Globe className="w-6 h-6" />,
      color: 'bg-gradient-to-br from-purple-400 to-purple-600',
      videoUrl: 'https://www.w3schools.com/html/movie.mp4'
    },
    {
      id: 'fractions',
      title: 'Phân Số Bánh Quy',
      subject: 'Toán học',
      description: 'Học phân số cực vui bằng cách chia những chiếc bánh quy 3D thơm ngon.',
      icon: <Atom className="w-6 h-6" />,
      color: 'bg-gradient-to-br from-orange-400 to-orange-600',
      videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4'
    },
    {
      id: 'seeds',
      title: 'Sự nảy mầm 3D',
      subject: 'Khoa học',
      description: 'Quan sát quá trình hạt đậu nảy mầm thành cây con qua mô phỏng 3D sinh động.',
      icon: <Lightbulb className="w-6 h-6" />,
      color: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
      videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4'
    }
  ];

  const handleTogglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const duration = videoRef.current.duration;
      setProgress((current / duration) * 100);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current && isFinite(videoRef.current.duration)) {
      const seekTime = (parseFloat(e.target.value) / 100) * videoRef.current.duration;
      videoRef.current.currentTime = seekTime;
      setProgress(parseFloat(e.target.value));
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 font-sans">
      {/* Header */}
      <div className="p-6 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-yellow-500" /> Thư Viện Học Liệu Số
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Học tập trực quan qua các thí nghiệm ảo và video tương tác</p>
          </div>
          
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl self-start">
            <button 
              onClick={() => setActiveTab('simulations')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'simulations' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Thí nghiệm ảo
            </button>
            <button 
              onClick={() => setActiveTab('videos')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'videos' ? 'bg-white dark:bg-slate-700 shadow-sm text-purple-600 dark:text-purple-400' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Video tương tác
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'simulations' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {simulations.map(sim => (
              <motion.div 
                key={sim.id}
                whileHover={{ y: -10, rotateX: 5, rotateY: 5 }}
                style={{ transformStyle: 'preserve-3d' }}
                className="bg-white dark:bg-slate-800 rounded-2xl border-4 border-white dark:border-slate-700 shadow-xl overflow-hidden flex flex-col group transition-all duration-300"
              >
                <div className={`h-40 ${sim.color} flex items-center justify-center text-white relative overflow-hidden`}>
                  <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                  <motion.div 
                    animate={{ rotateY: [0, 360] }}
                    transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    {React.cloneElement(sim.icon as React.ReactElement<any>, { className: "w-20 h-20 relative z-10 drop-shadow-2xl" })}
                  </motion.div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{sim.subject}</span>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{sim.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 line-clamp-2">{sim.description}</p>
                  <div className="mt-auto flex gap-2">
                    <button 
                      onClick={() => setSelectedSim(sim.id)}
                      className="flex-1 py-2.5 bg-slate-900 dark:bg-slate-700 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition flex items-center justify-center gap-2"
                    >
                      Mô phỏng <ChevronRight className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedVideo(sim.id);
                        setIsPlaying(false);
                        setProgress(0);
                      }}
                      className="px-4 py-2.5 bg-purple-500 text-white rounded-xl font-bold text-sm hover:bg-purple-600 transition flex items-center justify-center"
                      title="Xem video bài học"
                    >
                      <Play className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-4">
              <Play className="w-10 h-10 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Video Tương Tác Đang Được Cập Nhật</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-md">Tính năng cho phép dừng video để trả lời câu hỏi và nhận phản hồi trực tiếp đang được hoàn thiện.</p>
          </div>
        )}
      </div>

      {/* Simulation Modal */}
      <AnimatePresence>
        {selectedSim === 'balance' && (
          <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border-4 border-blue-500"
            >
              <div className="p-4 border-b flex justify-between items-center bg-blue-50 dark:bg-blue-900/20">
                <h3 className="font-black text-blue-600 flex items-center gap-2 uppercase tracking-wider">
                  <Microscope className="w-5 h-5" /> Thí nghiệm: Cân Thăng Bằng
                </h3>
                <button onClick={() => setSelectedSim(null)} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-full transition">
                  <RotateCcw className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              
              <div className="flex-1 p-8 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 min-h-[400px]">
                {/* Simple Balance Scale SVG Simulation */}
                <div className="relative w-full max-w-lg aspect-video flex items-center justify-center">
                   <svg viewBox="0 0 400 300" className="w-full h-full">
                      {/* Base */}
                      <path d="M150 280 L250 280 L200 200 Z" fill="#475569" />
                      {/* Beam */}
                      <motion.g animate={{ rotate: 0 }}>
                        <rect x="50" y="145" width="300" height="10" rx="5" fill="#94a3b8" />
                        {/* Left Pan */}
                        <line x1="50" y1="150" x2="50" y2="230" stroke="#64748b" strokeWidth="2" />
                        <path d="M20 230 Q50 260 80 230 Z" fill="#cbd5e1" />
                        {/* Right Pan */}
                        <line x1="350" y1="150" x2="350" y2="230" stroke="#64748b" strokeWidth="2" />
                        <path d="M320 230 Q350 260 380 230 Z" fill="#cbd5e1" />
                      </motion.g>
                   </svg>
                   
                   <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center">
                      <p className="text-slate-400 text-xs font-bold uppercase mb-2">Kéo thả các vật thể để bắt đầu</p>
                      <div className="flex gap-4 justify-center">
                        <div className="w-12 h-12 bg-red-500 rounded-lg shadow-lg cursor-grab active:cursor-grabbing flex items-center justify-center text-white font-bold">5kg</div>
                        <div className="w-10 h-10 bg-blue-500 rounded-lg shadow-lg cursor-grab active:cursor-grabbing flex items-center justify-center text-white font-bold">3kg</div>
                        <div className="w-8 h-8 bg-yellow-500 rounded-lg shadow-lg cursor-grab active:cursor-grabbing flex items-center justify-center text-white font-bold">1kg</div>
                      </div>
                   </div>
                </div>
              </div>

              <div className="p-6 bg-white dark:bg-slate-800 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3 text-slate-500">
                  <Info className="w-5 h-5 text-blue-500" />
                  <p className="text-sm font-medium italic">"Khi tổng trọng lượng hai bên bằng nhau, thanh xà sẽ nằm ngang."</p>
                </div>
                <button onClick={() => setSelectedSim(null)} className="px-8 py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200 dark:shadow-none uppercase tracking-widest text-xs">
                  Hoàn thành
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {simulations.find(s => s.id === selectedSim)?.id === 'seeds' && (
          <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
             {/* Similar simulation logic for seeds could go here, for now using balance as baseline */}
             <div className="bg-white dark:bg-slate-800 p-10 rounded-3xl">
                <h2 className="text-2xl font-bold mb-4">Mô phỏng Sự nảy mầm đang phát triển...</h2>
                <button onClick={() => setSelectedSim(null)} className="px-6 py-2 bg-slate-900 text-white rounded-lg">Đóng</button>
             </div>
          </div>
        )}

        {/* Video Player Modal */}
        {selectedVideo && (
           <div className="fixed inset-0 z-[110] bg-slate-900/95 backdrop-blur-lg flex items-center justify-center p-4">
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="bg-black rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl border border-white/10 flex flex-col"
             >
                <div className="p-4 flex justify-between items-center bg-zinc-900 text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                      <Play className="w-4 h-4 fill-current" />
                    </div>
                    <h3 className="font-bold text-lg">
                      {simulations.find(s => s.id === selectedVideo)?.title} - Video Bài Học
                    </h3>
                  </div>
                  <button 
                    onClick={() => setSelectedVideo(null)} 
                    className="w-10 h-10 hover:bg-white/10 rounded-full flex items-center justify-center transition"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="relative aspect-video bg-black group">
                  <video 
                    ref={videoRef}
                    src={simulations.find(s => s.id === selectedVideo)?.videoUrl}
                    className="w-full h-full object-contain"
                    onTimeUpdate={handleTimeUpdate}
                    onClick={handleTogglePlay}
                  />
                  
                  {/* Custom Controls Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                    <div className="mb-4 flex items-center gap-4">
                      <button 
                        onClick={handleTogglePlay}
                        className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 transition active:scale-95 shadow-xl"
                      >
                        {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                      </button>
                      
                      <div className="flex-1 flex flex-col gap-1">
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          step="0.1"
                          value={progress}
                          onChange={handleSeek}
                          className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                        <div className="flex justify-between text-[10px] font-bold text-white/50 uppercase tracking-tighter">
                          <span>{formatTime(videoRef.current?.currentTime || 0)}</span>
                          <span>{formatTime(videoRef.current?.duration || 0)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Big Play Button when paused */}
                  {!isPlaying && (
                    <button 
                      onClick={handleTogglePlay}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-purple-500/50 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-purple-500 transition-all border-4 border-white/20"
                    >
                      <Play className="w-10 h-10 fill-current ml-2" />
                    </button>
                  )}
                </div>
                
                <div className="p-6 bg-zinc-900 border-t border-white/5">
                  <p className="text-zinc-400 text-sm italic">
                    Gợi ý: Theo dõi video để nắm rõ kiến thức trước khi thực hiện thí nghiệm ảo.
                  </p>
                </div>
             </motion.div>
           </div>
        )}
      </AnimatePresence>
    </div>
  );
}
