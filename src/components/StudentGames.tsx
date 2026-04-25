import React, { useState, useEffect } from 'react';
import { Gamepad2, Swords, Joystick, Play, Loader2, X, Trophy, Star, Zap, Flame, Award } from 'lucide-react';
import { Game, GameSession } from '../types';
import { getProgressToNextLevel } from '../lib/gamification';
import MillionaireGame from './games/MillionaireGame';
import OfflineGame from './games/OfflineGame';
import WiseOneGame from './games/WiseOneGame';
import MatchingGame from './games/MatchingGame';
import MemoryGame from './games/MemoryGame';
import WordSearchGame from './games/WordSearchGame';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

export default function StudentGames({ offlineGames, studentProfile, onCompleteGame }: { offlineGames: Game[], studentProfile: any, onCompleteGame: () => void }) {
  const [playingGame, setPlayingGame] = useState<Game | null>(null);
  const [pin, setPin] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [activeSession, setActiveSession] = useState<GameSession | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!activeSession) return;
    const unsub = onSnapshot(doc(db, 'game_sessions', activeSession.id), (snap) => {
      if (snap.exists()) {
        setActiveSession(snap.data() as GameSession);
      } else {
        setActiveSession(null);
      }
    });
    return () => unsub();
  }, [activeSession?.id]);

  const handleJoinSession = async () => {
    if (!pin) return;
    setIsJoining(true);
    setError('');
    try {
      const q = query(collection(db, 'game_sessions'), where('pin', '==', pin), where('status', '==', 'waiting'));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        setError('Mã PIN không đúng hoặc phòng đã bắt đầu.');
        setIsJoining(false);
        return;
      }

      const session = snap.docs[0].data() as GameSession;
      const user = auth.currentUser;
      if (!user) {
        setError('Bạn cần đăng nhập để tham gia.');
        setIsJoining(false);
        return;
      }

      // Join the session
      const updatedScores = { ...session.scores };
      updatedScores[user.uid] = {
        name: studentProfile?.name || user.displayName || user.email?.split('@')[0] || 'Học sinh',
        score: 0,
        avatar: studentProfile?.avatar || ''
      };

      await updateDoc(doc(db, 'game_sessions', session.id), { scores: updatedScores });
      setActiveSession(session);
    } catch (err: any) {
      setError('Lỗi khi tham gia: ' + err.message);
    } finally {
      setIsJoining(false);
    }
  };

  if (activeSession) {
    const sortedScores = Object.values(activeSession.scores).sort((a, b) => b.score - a.score);

    return (
      <div className="bg-indigo-900 fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 text-white font-kids">
        <div className="w-full max-w-2xl bg-white/10 backdrop-blur-md rounded-[3rem] p-8 border border-white/20 shadow-2xl text-center">
          <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-6 animate-bounce" />
          <h2 className="text-4xl font-black mb-2 uppercase tracking-tight">Đã tham gia phòng!</h2>
          <p className="text-indigo-200 mb-8 font-bold">Chờ thầy cô bắt đầu trò chơi...</p>
          
          <div className="bg-black/30 rounded-2xl p-6 border border-white/10">
            <h3 className="text-xl font-black mb-4 flex items-center justify-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" /> BẢNG XẾP HẠNG THỜI GIAN THỰC
            </h3>
            <div className="space-y-3">
              {sortedScores.map((s, i) => (
                <div key={i} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10">
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black ${i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-slate-300' : i === 2 ? 'bg-amber-600' : 'bg-indigo-700'}`}>
                      {i + 1}
                    </span>
                    <img src={s.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'} alt="avatar" className="w-8 h-8 rounded-full bg-indigo-800" referrerPolicy="no-referrer" />
                    <span className="font-bold">{s.name}</span>
                  </div>
                  <span className="font-black text-xl text-yellow-400">{s.score}</span>
                </div>
              ))}
              {sortedScores.length === 0 && <p className="text-indigo-300 italic">Đang chờ các bạn khác...</p>}
            </div>
          </div>

          <button 
            onClick={() => setActiveSession(null)}
            className="mt-8 text-indigo-300 hover:text-white font-bold flex items-center justify-center gap-2 mx-auto"
          >
            <X className="w-5 h-5" /> Thoát phòng
          </button>
        </div>
      </div>
    );
  }

  const finishGame = () => {
    onCompleteGame();
    setPlayingGame(null);
  };

  if (playingGame) {
    if (playingGame.type === 'millionaire') {
      return <MillionaireGame game={playingGame} onClose={finishGame} />;
    }
    if (playingGame.type === 'wise_one') {
      return <WiseOneGame game={playingGame} onClose={finishGame} />;
    }
    if (playingGame.type === 'matching') {
      return <MatchingGame game={playingGame} onClose={finishGame} />;
    }
    if (playingGame.type === 'memory') {
      return <MemoryGame game={playingGame} onClose={finishGame} />;
    }
    if (playingGame.type === 'word_search') {
      return <WordSearchGame game={playingGame} onClose={finishGame} />;
    }
    return <OfflineGame game={playingGame} onClose={finishGame} />;
  }

  return (
    <div className="flex flex-col gap-8 h-full w-full pb-10 font-kids">
      {/* Gamification Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
        <motion.div 
          whileHover={{ scale: 1.02, rotate: 1 }}
          className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-[2.5rem] p-8 text-white shadow-2xl border-4 border-white flex items-center gap-5 relative overflow-hidden group"
        >
          <Star className="w-20 h-20 text-white/20 absolute -top-4 -right-4 rotate-12 group-hover:rotate-45 transition-transform duration-700" />
          <div className="bg-white/20 p-4 rounded-3xl backdrop-blur-md shadow-inner border border-white/30">
            <Zap className="w-10 h-10 fill-current text-white" />
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-widest opacity-80 mb-1">Cấp độ {studentProfile?.level || 1}</div>
            <div className="text-3xl font-black drop-shadow-md">{studentProfile?.xp || 0} XP</div>
            <div className="w-32 h-3 bg-black/20 rounded-full mt-3 overflow-hidden border border-white/20">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${getProgressToNextLevel(studentProfile?.xp || 0)}%` }}
                className="h-full bg-white shadow-[0_0_10px_#fff]"
              ></motion.div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02, rotate: -1 }}
          className="bg-gradient-to-br from-rose-400 to-pink-600 rounded-[2.5rem] p-8 text-white shadow-2xl border-4 border-white flex items-center gap-5 relative overflow-hidden group"
        >
          <Flame className="w-20 h-20 text-white/20 absolute -top-4 -right-4 rotate-12 group-hover:scale-125 transition-transform duration-700" />
          <div className="bg-white/20 p-4 rounded-3xl backdrop-blur-md shadow-inner border border-white/30">
            <Flame className="w-10 h-10 fill-current text-white" />
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-widest opacity-80 mb-1">Chuỗi học tập</div>
            <div className="text-3xl font-black drop-shadow-md">{studentProfile?.streak || 0} Ngày</div>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02, rotate: 1 }}
          className="bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 rounded-[2.5rem] p-8 text-white shadow-2xl border-4 border-white flex items-center gap-5 relative overflow-hidden group"
        >
          <Award className="w-20 h-20 text-white/20 absolute -top-4 -right-4 rotate-12 group-hover:rotate-[-12deg] transition-transform duration-700" />
          <div className="bg-white/20 p-4 rounded-3xl backdrop-blur-md shadow-inner border border-white/30">
            <Award className="w-10 h-10 fill-current text-white" />
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-widest opacity-80 mb-1">Huy hiệu</div>
            <div className="text-3xl font-black drop-shadow-md">{studentProfile?.badges?.length || 0} Đã đạt</div>
          </div>
        </motion.div>
      </div>

      <div className="flex flex-col lg:flex-row gap-10 flex-1 min-h-0">
        {/* JOIN ROOM CARD */}
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-full lg:w-1/3 bg-kids-fun rounded-[3.5rem] p-10 sm:p-14 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-2xl shrink-0 border-4 border-white h-full"
        >
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
          <div className="relative z-10 flex flex-col items-center w-full">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-xl mb-8 border-4 border-rose-100 group">
               <Swords className="w-14 h-14 text-rose-500 animate-bounce cursor-pointer group-hover:scale-110 transition-transform" />
            </div>
            <h3 className="text-4xl sm:text-5xl font-black text-rose-600 mb-6 drop-shadow-sm uppercase leading-tight">Đấu Trường<br/>Tri Thức!</h3>
            
            <div className="w-full space-y-4 mb-2">
              <input 
                type="text" 
                placeholder="NHẬP MÃ PIN" 
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full max-w-[300px] bg-white border-4 border-rose-200 rounded-[2rem] p-6 text-center text-4xl font-black text-rose-600 uppercase outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-100 transition-all shadow-inner placeholder-rose-200" 
              />
              {error && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-rose-500 font-black text-sm bg-rose-50 px-4 py-2 rounded-xl border border-rose-100"
                >
                  {error}
                </motion.p>
              )}
            </div>

            <button 
              onClick={handleJoinSession}
              disabled={isJoining || !pin}
              className="w-full max-w-[300px] mt-6 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-black py-6 rounded-[2rem] text-3xl uppercase shadow-[0_12px_0_#9f1239] active:translate-y-2 active:shadow-none transition-all duration-200 border-2 border-white/20 tracking-[0.2em] disabled:opacity-50 flex items-center justify-center gap-4 group"
            >
              {isJoining ? (
                <Loader2 className="w-10 h-10 animate-spin" />
              ) : (
                <>
                  VÀO CHƠI <Zap className="w-8 h-8 fill-current group-hover:scale-125 transition-transform" />
                </>
              )}
            </button>
            <p className="mt-6 text-rose-400 font-bold text-sm uppercase tracking-widest opacity-80">Hỏi Thầy Cô mã PIN để bắt đầu</p>
          </div>
        </motion.div>
        
        {/* OFFLINE GAMES LIST */}
        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-full lg:w-2/3 bg-white/90 backdrop-blur-md p-10 rounded-[3.5rem] shadow-2xl overflow-y-auto flex-1 border-4 border-white flex flex-col"
        >
          <div className="flex items-center justify-between mb-10 border-b-4 border-indigo-50 pb-6">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-2xl text-white shadow-lg transform -rotate-2">
                <Gamepad2 className="w-10 h-10" />
              </div>
              <h3 className="text-3xl sm:text-4xl font-black text-indigo-950 uppercase tracking-tight">Rèn luyện ngay</h3>
            </div>
            <div className="text-5xl hidden sm:block animate-pulse">🎮</div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-8 pr-2 custom-scrollbar">
            {offlineGames.map((game: Game) => (
              <motion.div 
                key={game.id} 
                whileHover={{ y: -8 }}
                onClick={() => setPlayingGame(game)}
                className="bg-white rounded-[2.5rem] border-4 border-indigo-50 shadow-xl flex flex-col h-[220px] cursor-pointer relative overflow-hidden group transition-all"
              >
                <div className="h-24 bg-gradient-to-br from-indigo-400 via-purple-500 to-indigo-500 p-5 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                  <Joystick className="absolute -top-4 -right-4 w-24 h-24 text-white/30 group-hover:rotate-12 transition-transform duration-500" />
                  {game.subject && (
                    <span className="absolute top-3 left-3 bg-white/20 backdrop-blur-md text-white text-[10px] sm:text-xs font-black px-3 py-1 rounded-xl border border-white/30 uppercase tracking-widest">
                      {game.subject}
                    </span>
                  )}
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between bg-indigo-50/30">
                  <h3 className="font-black text-indigo-950 text-xl sm:text-2xl line-clamp-1">{game.title}</h3>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-indigo-400 font-bold text-sm">Chơi cùng AI 🤖</span>
                    <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-6 py-2.5 rounded-2xl flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all active:scale-95 text-sm uppercase tracking-widest">
                      <Play className="w-4 h-4 fill-current" /> CHƠI
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
            {offlineGames.length === 0 && (
              <div className="text-center py-16 bg-slate-50 rounded-[2.5rem] border-4 border-dashed border-slate-200 col-span-2">
                 <div className="text-5xl mb-4">🎈</div>
                 <p className="text-xl font-black text-slate-400">Chưa có trò chơi mới.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
