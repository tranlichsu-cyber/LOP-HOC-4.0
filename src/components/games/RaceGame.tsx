import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Swords, Play, ChevronRight, RotateCcw, Trophy } from 'lucide-react';
import { Game, GameSession } from '../../types';
import { playSound, startBackgroundMusic, stopBackgroundMusic } from '../../lib/sounds';
import { db, auth } from '../../firebase';
import { collection, doc, setDoc, onSnapshot, updateDoc, deleteDoc } from 'firebase/firestore';

const LIVE_TEAM_COLORS = [
    { bg: 'bg-red-500', bgSoft: 'bg-red-50', text: 'text-red-500', textDark: 'text-red-900', border: 'border-red-400', name: 'Đội Đỏ', emoji: '🔴' },
    { bg: 'bg-blue-500', bgSoft: 'bg-blue-50', text: 'text-blue-500', textDark: 'text-blue-900', border: 'border-blue-400', name: 'Đội Xanh', emoji: '🔵' },
    { bg: 'bg-green-500', bgSoft: 'bg-green-50', text: 'text-green-500', textDark: 'text-green-900', border: 'border-green-400', name: 'Đội Lục', emoji: '🟢' },
    { bg: 'bg-yellow-500', bgSoft: 'bg-yellow-50', text: 'text-yellow-500', textDark: 'text-yellow-900', border: 'border-yellow-400', name: 'Đội Vàng', emoji: '🟡' },
    { bg: 'bg-purple-500', bgSoft: 'bg-purple-50', text: 'text-purple-500', textDark: 'text-purple-900', border: 'border-purple-400', name: 'Đội Tím', emoji: '🟣' },
    { bg: 'bg-orange-500', bgSoft: 'bg-orange-50', text: 'text-orange-500', textDark: 'text-orange-900', border: 'border-orange-400', name: 'Đội Cam', emoji: '🟠' },
    { bg: 'bg-pink-500', bgSoft: 'bg-pink-50', text: 'text-pink-500', textDark: 'text-pink-900', border: 'border-pink-400', name: 'Đội Hồng', emoji: '🌸' },
    { bg: 'bg-teal-500', bgSoft: 'bg-teal-50', text: 'text-teal-500', textDark: 'text-teal-900', border: 'border-teal-400', name: 'Đội Ngọc', emoji: '💠' },
    { bg: 'bg-indigo-500', bgSoft: 'bg-indigo-50', text: 'text-indigo-500', textDark: 'text-indigo-900', border: 'border-indigo-400', name: 'Đội Chàm', emoji: '🎆' },
    { bg: 'bg-lime-500', bgSoft: 'bg-lime-50', text: 'text-lime-500', textDark: 'text-lime-900', border: 'border-lime-400', name: 'Đội Chanh', emoji: '🍋' }
];

export default function RaceGame({ game, onClose }: { game: Game, onClose: () => void }) {
  const [step, setStep] = useState<'setup' | 'waiting' | 'play'>('setup');
  const [teamCount, setTeamCount] = useState<number | 'all'>(2);
  const [customTeamNames, setCustomTeamNames] = useState<string[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [winner, setWinner] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [sessionData, setSessionData] = useState<GameSession | null>(null);

  useEffect(() => {
    if (step === 'play' && !winner) {
      startBackgroundMusic();
    } else {
      stopBackgroundMusic();
    }
    return () => stopBackgroundMusic();
  }, [step, winner]);

  useEffect(() => {
    if (!sessionId) return;
    const unsub = onSnapshot(doc(db, 'game_sessions', sessionId), (snap) => {
      if (snap.exists()) {
        setSessionData(snap.data() as GameSession);
      }
    });
    return () => unsub();
  }, [sessionId]);

  useEffect(() => {
    if (step !== 'play' || winner) return;
    
    const currentQuestion = game.questionsList[currentQIdx];
    const limit = currentQuestion.timeLimit || game.timeLimit || 30;
    setTimeLeft(limit);
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQIdx, step, winner]);

  useEffect(() => {
    if (teamCount === 'all') {
      setCustomTeamNames(['Cả lớp 👨‍👩‍👧‍👦']);
    } else {
      const names = Array.from({ length: teamCount }).map((_, i) => `${LIVE_TEAM_COLORS[i].name} ${LIVE_TEAM_COLORS[i].emoji}`);
      setCustomTeamNames(names);
    }
  }, [teamCount]);

  const handleSetup = async () => {
    const newPin = Math.floor(100000 + Math.random() * 900000).toString();
    setPin(newPin);
    
    const user = auth.currentUser;
    if (!user) return;

    const newSessionId = `session_${Date.now()}`;
    const newSession: GameSession = {
      id: newSessionId,
      gameId: game.id,
      teacherUid: user.uid,
      pin: newPin,
      status: 'waiting',
      currentQuestionIndex: 0,
      scores: {},
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, 'game_sessions', newSessionId), newSession);
    setSessionId(newSessionId);

    let initialTeams = [];
    if (teamCount === 'all') {
      initialTeams = [{
        id: 0,
        name: customTeamNames[0] || 'Cả lớp 👨‍👩‍👧‍👦',
        score: 0,
        colorInfo: LIVE_TEAM_COLORS[0]
      }];
    } else {
      initialTeams = Array.from({ length: teamCount }).map((_, i) => ({
        id: i,
        name: customTeamNames[i] || `${LIVE_TEAM_COLORS[i].name} ${LIVE_TEAM_COLORS[i].emoji}`,
        score: 0,
        colorInfo: LIVE_TEAM_COLORS[i]
      }));
    }
    setTeams(initialTeams);
    setStep('waiting');
  };

  const handleStart = async () => {
    if (sessionId) {
      // If students joined, we might want to use them as teams
      const joinedStudents = sessionData?.scores ? Object.entries(sessionData.scores) : [];
      if (joinedStudents.length > 0) {
        const studentTeams = joinedStudents.map(([uid, data], i) => ({
          id: i,
          studentUid: uid,
          name: data.name,
          score: 0,
          colorInfo: LIVE_TEAM_COLORS[i % LIVE_TEAM_COLORS.length]
        }));
        setTeams(studentTeams);
      }
      await updateDoc(doc(db, 'game_sessions', sessionId), { status: 'playing' });
    }
    setStep('play');
  };

  const awardPoints = async (idx: number) => {
    if (winner) return;
    
    const newTeams = [...teams];
    newTeams[idx].score += 10;
    setTeams(newTeams);
    playSound('correct');
    
    if (sessionId && sessionData) {
      // If it's a student-joined session, update their score in Firestore
      const studentUid = newTeams[idx].studentUid;
      if (studentUid) {
        const updatedScores = { ...sessionData.scores };
        updatedScores[studentUid].score = newTeams[idx].score;
        await updateDoc(doc(db, 'game_sessions', sessionId), { scores: updatedScores });
      }
    }

    if (newTeams[idx].score >= 50) {
      setWinner(newTeams[idx]);
      playSound('winner');
      stopBackgroundMusic();
      if (sessionId) {
        await updateDoc(doc(db, 'game_sessions', sessionId), { status: 'finished' });
      }
    }
  };

  const nextQuestion = async () => {
    if (currentQIdx + 1 < game.questionsList.length) {
      setCurrentQIdx(currentQIdx + 1);
      if (sessionId) {
        await updateDoc(doc(db, 'game_sessions', sessionId), { currentQuestionIndex: currentQIdx + 1 });
      }
    }
  };

  const handleClose = async () => {
    if (sessionId) {
      await deleteDoc(doc(db, 'game_sessions', sessionId));
    }
    onClose();
  };

  const resetRace = () => {
    setTeams(teams.map(t => ({ ...t, score: 0 })));
    setWinner(null);
    setCurrentQIdx(0);
  };

  if (step === 'setup') {
    return (
      <div className="h-full flex flex-col lg:flex-row gap-6 p-8 bg-slate-50 dark:bg-slate-900 font-kids">
        <div className="w-full lg:w-2/3 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-auto flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition bg-slate-100 dark:bg-slate-700 p-1.5 rounded-xl"><X className="w-6 h-6" /></button>
              <h3 className="font-extrabold text-xl text-slate-800 dark:text-white flex items-center gap-2"><Swords className="text-orange-500 w-7 h-7" /> Cài đặt Trò chơi</h3>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase">Số lượng đội chơi</label>
            <select 
              value={teamCount} 
              onChange={(e) => {
                const val = e.target.value;
                setTeamCount(val === 'all' ? 'all' : parseInt(val));
              }}
              className="w-full sm:w-1/3 p-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:border-orange-500 font-bold text-lg transition"
            >
              <option value="all">Cả lớp (1 Đội)</option>
              {[2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n} Đội</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {teamCount === 'all' ? (
              <div className={`${LIVE_TEAM_COLORS[0].bgSoft} p-4 rounded-2xl border-2 ${LIVE_TEAM_COLORS[0].border}`}>
                <label className="block text-xs font-black mb-2 ${LIVE_TEAM_COLORS[0].text}">Chế độ</label>
                <input 
                  type="text" 
                  value={customTeamNames[0] || ''} 
                  onChange={(e) => setCustomTeamNames([e.target.value])}
                  className={`w-full p-3 rounded-xl border font-bold ${LIVE_TEAM_COLORS[0].textDark} bg-white/50 focus:bg-white outline-none transition`} 
                />
              </div>
            ) : (
              Array.from({ length: teamCount as number }).map((_, i) => (
                <div key={i} className={`${LIVE_TEAM_COLORS[i].bgSoft} p-4 rounded-2xl border-2 ${LIVE_TEAM_COLORS[i].border}`}>
                  <label className="block text-xs font-black mb-2 ${LIVE_TEAM_COLORS[i].text}">Đội {i+1}</label>
                  <input 
                    type="text" 
                    value={customTeamNames[i] || ''} 
                    onChange={(e) => {
                      const newNames = [...customTeamNames];
                      newNames[i] = e.target.value;
                      setCustomTeamNames(newNames);
                    }}
                    className={`w-full p-3 rounded-xl border font-bold ${LIVE_TEAM_COLORS[i].textDark} bg-white/50 focus:bg-white outline-none transition`} 
                  />
                </div>
              ))
            )}
          </div>
        </div>

        <div className="w-full lg:w-1/3 bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-32 h-32 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-orange-500 mb-6 animate-bounce shadow-inner">
            <span className="text-6xl">🏁</span>
          </div>
          <h3 className="font-black text-2xl mb-2 text-slate-800 dark:text-white">Sẵn sàng Đua Top!</h3>
          <button onClick={handleSetup} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-2xl text-xl flex items-center justify-center gap-2 shadow-[0_6px_0_#c2410c] active:translate-y-1 active:shadow-none transition-all mt-auto">
            <Play className="fill-current w-6 h-6" /> MỞ PHÒNG NGAY
          </button>
        </div>
      </div>
    );
  }

  if (step === 'waiting') {
    const joinedStudents = sessionData?.scores ? Object.values(sessionData.scores) : [];
    
    return (
      <div className="bg-indigo-900 fixed inset-0 z-[100] flex flex-col items-center justify-center p-10 text-white overflow-y-auto font-kids">
        <h2 className="text-4xl font-black text-indigo-200 z-10 mb-8 mt-4 text-center">Truy cập <span className="text-white bg-indigo-800 px-4 py-2 rounded-xl mx-1 border border-indigo-600 shadow-inner">play.edupro.vn</span> và nhập mã PIN</h2>
        <div className="flex flex-col md:flex-row gap-8 items-start justify-center z-10 mb-12 w-full max-w-6xl">
          <div className="flex-1 flex flex-col items-center bg-white/10 p-8 md:p-10 rounded-[3rem] backdrop-blur-md border border-white/20 shadow-2xl w-full">
            <div className="text-center mb-8">
              <p className="text-indigo-200 font-bold mb-2 uppercase tracking-widest text-xl">Mã PIN Trò Chơi</p>
              <div className="text-7xl md:text-9xl font-black tracking-widest font-mono text-yellow-400 drop-shadow-lg">{pin}</div>
            </div>
            
            <div className="w-full">
              <p className="text-indigo-200 font-bold mb-4 uppercase tracking-widest text-center">Học sinh đã tham gia ({joinedStudents.length})</p>
              <div className="flex flex-wrap justify-center gap-3">
                {joinedStudents.map((s, i) => (
                  <motion.div 
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="bg-white/20 px-4 py-2 rounded-full font-bold text-lg border border-white/30"
                  >
                    {s.name}
                  </motion.div>
                ))}
                {joinedStudents.length === 0 && <p className="text-indigo-300 italic">Đang chờ học sinh tham gia...</p>}
              </div>
            </div>
          </div>
        </div>
        <button onClick={handleStart} className="bg-green-500 hover:bg-green-600 px-10 py-4 rounded-3xl font-black text-2xl shadow-[0_6px_0_#15803d] active:translate-y-1 active:shadow-none transition-all uppercase">Bắt đầu Trò Chơi</button>
        <button onClick={handleClose} className="absolute top-8 right-8 text-indigo-300 hover:text-white z-20 bg-black/20 px-6 py-3 rounded-xl font-bold text-lg transition border border-indigo-700">Thoát</button>
      </div>
    );
  }

  return (
    <div className="bg-indigo-950 fixed inset-0 z-[100] flex flex-col items-center p-4 sm:p-8 text-white overflow-hidden font-kids">
      <div className="flex justify-between items-center w-full max-w-7xl z-10 mb-4 sm:mb-8 bg-black/30 p-4 rounded-3xl border border-white/10">
        <div className="flex items-center gap-4 flex-1 truncate pr-4">
          <div className={`w-14 h-14 rounded-full border-4 flex items-center justify-center font-black text-xl shrink-0 ${timeLeft <= 5 ? 'border-red-500 text-red-500 animate-pulse' : 'border-yellow-400 text-yellow-400'}`}>
            {timeLeft}
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-yellow-300 truncate">Câu {currentQIdx + 1}: {game.questionsList[currentQIdx].text}</h2>
        </div>
        <button onClick={nextQuestion} className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-2xl shadow-[0_4px_0_#15803d] active:translate-y-1 active:shadow-none border-2 border-green-400 whitespace-nowrap">Câu tiếp <ChevronRight className="w-5 h-5 inline" /></button>
      </div>

      <div className="w-full max-w-7xl px-4 mb-6 z-10">
        <div className="flex justify-between text-indigo-200 text-xs font-bold mb-1 uppercase tracking-wider">
          <span>Tiến trình: {currentQIdx + 1} / {game.questionsList.length} câu hỏi</span>
          <span>{Math.round(((currentQIdx + 1) / game.questionsList.length) * 100)}%</span>
        </div>
        <div className="w-full h-2.5 bg-indigo-900/50 rounded-full overflow-hidden border border-indigo-400/30">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${((currentQIdx + 1) / game.questionsList.length) * 100}%` }}
            transition={{ type: "spring", stiffness: 50, damping: 15 }}
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-400 shadow-[0_0_10px_rgba(99,102,241,0.8)]"
          />
        </div>
      </div>
      
      <div className="flex flex-col gap-4 w-full max-w-7xl flex-1 justify-center z-10 p-6 bg-black/40 rounded-[2rem] border-2 border-white/10 shadow-2xl relative overflow-y-auto">
        <div className="absolute top-4 right-8 flex items-center gap-2 text-yellow-400 font-black uppercase tracking-widest bg-black/40 px-4 py-2 rounded-full border border-yellow-400/30">
          <Trophy className="w-6 h-6" /> Bảng Xếp Hạng
        </div>
        <div className="space-y-4 mt-8">
          {teams.map((t, i) => (
            <div key={i} className="flex items-center gap-4 bg-white/10 p-3 rounded-[2rem] border border-white/20">
              <div className="w-32 font-black text-lg text-white text-right truncate">{t.name}</div>
              <div className="flex-1 bg-black/40 h-8 rounded-full relative overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(t.score * 2, 100)}%` }}
                  className={`absolute top-0 left-0 h-full ${t.colorInfo.bg} transition-all duration-700 rounded-full min-w-[2rem]`}
                />
              </div>
              <div className="w-20 font-black text-3xl text-white text-center">{t.score}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full max-w-7xl mt-6 mb-4 z-10 text-center">
        <p className="text-indigo-200 mb-2 text-sm uppercase tracking-wider font-bold">Giáo viên: Cộng điểm cho đội trả lời đúng</p>
        <div className="flex flex-wrap justify-center gap-4">
          {teams.map((t, i) => (
            <button key={i} onClick={() => awardPoints(i)} className={`p-3 rounded-2xl font-black text-white ${t.colorInfo.bg} flex-1 min-w-[120px] shadow-md hover:brightness-110 active:scale-95 transition`}>
              +10 ĐIỂM<br/><span className="text-xs mt-1 truncate block">{t.name}</span>
            </button>
          ))}
        </div>
      </div>

      {winner && (
        <div className="absolute inset-0 bg-black/90 rounded-[2rem] sm:rounded-[3rem] flex flex-col items-center justify-center z-30 p-4 text-center backdrop-blur-md">
          <div className="text-8xl sm:text-9xl mb-4 sm:mb-8 animate-bounce">🏆</div>
          <h2 className="text-5xl sm:text-7xl font-black text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.5)] mb-10 uppercase">{winner.name} CHIẾN THẮNG!</h2>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full sm:w-auto">
            <button onClick={resetRace} className="px-8 py-4 sm:px-12 sm:py-5 bg-white/20 hover:bg-white/30 rounded-3xl font-black transition text-xl sm:text-3xl w-full sm:w-auto border-2 border-white/30 flex items-center justify-center gap-2"><RotateCcw /> Chơi lại</button>
            <button onClick={onClose} className="px-8 py-4 sm:px-12 sm:py-5 bg-blue-500 hover:bg-blue-600 rounded-3xl font-black transition text-xl sm:text-3xl shadow-[0_6px_0_#1e3a8a] active:translate-y-1 active:shadow-none w-full sm:w-auto">Thoát trò chơi</button>
          </div>
        </div>
      )}

      <button onClick={handleClose} className="absolute top-4 right-4 sm:top-8 sm:right-8 text-indigo-300 hover:text-white z-20 bg-black/40 border border-indigo-700 px-6 py-3 sm:px-8 sm:py-4 rounded-2xl font-bold text-sm sm:text-xl transition hover:bg-black/60">Thoát</button>
    </div>
  );
}
