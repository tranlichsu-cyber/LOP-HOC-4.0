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
    <div className="flex flex-col gap-6 h-full w-full pb-6 font-kids">
      {/* Gamification Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
        <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-[2rem] p-6 text-white shadow-lg border-4 border-white flex items-center gap-4 relative overflow-hidden">
          <Star className="w-12 h-12 text-white/50 absolute -top-2 -right-2 rotate-12" />
          <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
            <Zap className="w-8 h-8 fill-current" />
          </div>
          <div>
            <div className="text-xs font-black uppercase opacity-80">Cấp độ {studentProfile?.level || 1}</div>
            <div className="text-2xl font-black">{studentProfile?.xp || 0} XP</div>
            <div className="w-32 h-2 bg-black/20 rounded-full mt-2 overflow-hidden border border-white/20">
              <div className="h-full bg-white" style={{ width: `${getProgressToNextLevel(studentProfile?.xp || 0)}%` }}></div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-rose-400 to-pink-500 rounded-[2rem] p-6 text-white shadow-lg border-4 border-white flex items-center gap-4 relative overflow-hidden">
          <Flame className="w-12 h-12 text-white/50 absolute -top-2 -right-2 rotate-12" />
          <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
            <Flame className="w-8 h-8 fill-current" />
          </div>
          <div>
            <div className="text-xs font-black uppercase opacity-80">Chuỗi học tập</div>
            <div className="text-2xl font-black">{studentProfile?.streak || 0} Ngày</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-400 to-purple-500 rounded-[2rem] p-6 text-white shadow-lg border-4 border-white flex items-center gap-4 relative overflow-hidden">
          <Award className="w-12 h-12 text-white/50 absolute -top-2 -right-2 rotate-12" />
          <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
            <Award className="w-8 h-8 fill-current" />
          </div>
          <div>
            <div className="text-xs font-black uppercase opacity-80">Huy hiệu đạt được</div>
            <div className="text-2xl font-black">{studentProfile?.badges?.length || 0} Badges</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-0">
        <div className="w-full lg:w-1/3 bg-kids-fun rounded-[3rem] p-8 sm:p-12 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-xl shrink-0 border-4 border-white h-full">
          <Swords className="w-24 h-24 text-rose-500 mb-6 z-10 animate-bounce" />
          <h3 className="text-3xl sm:text-5xl font-black text-rose-600 mb-4 z-10 drop-shadow-sm uppercase">Vào phòng ngay!</h3>
          <input 
            type="text" 
            placeholder="NHẬP MÃ PIN" 
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full max-w-[280px] bg-white/80 border-4 border-white rounded-3xl p-5 text-center text-3xl font-black text-rose-600 uppercase outline-none focus:border-rose-400 z-10 mb-2 shadow-inner placeholder-rose-300" 
          />
          {error && <p className="text-red-500 font-bold text-xs mb-4 z-10">{error}</p>}
          <button 
            onClick={handleJoinSession}
            disabled={isJoining || !pin}
            className="w-full max-w-[280px] bg-rose-500 hover:bg-rose-600 text-white font-black py-5 rounded-3xl z-10 text-2xl uppercase shadow-[0_8px_0_#be123c] active:translate-y-2 active:shadow-none transition border-2 border-rose-400 tracking-widest disabled:opacity-50"
          >
            {isJoining ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : 'VÀO CHƠI'}
          </button>
        </div>
        
        <div className="w-full lg:w-2/3 bg-white/80 backdrop-blur-md p-8 rounded-[3rem] shadow-xl overflow-y-auto flex-1 border-4 border-white flex flex-col">
          <div className="flex items-center justify-between mb-8 border-b-2 border-indigo-100 pb-4">
            <h3 className="text-3xl font-black flex items-center gap-3 text-indigo-800 uppercase">
              <div className="bg-indigo-500 p-2 rounded-xl text-white"><Gamepad2 className="w-8 h-8" /></div> 
              Tự Luyện Tập
            </h3>
            <div className="text-4xl">🎮</div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {offlineGames.map((game: Game) => (
              <div key={game.id} className="bg-white rounded-3xl border-4 border-indigo-100 shadow-xl flex flex-col h-[200px] transform hover:-translate-y-2 transition cursor-pointer relative overflow-hidden group" onClick={() => setPlayingGame(game)}>
                <div className="h-20 bg-gradient-to-br from-indigo-400 to-purple-500 p-4 relative overflow-hidden">
                  <Joystick className="absolute -top-4 -right-4 w-20 h-20 text-white/30" />
                  {game.subject && (
                    <span className="absolute top-2 left-2 bg-white/20 backdrop-blur-md text-white text-[10px] font-black px-2 py-0.5 rounded-lg border border-white/30 uppercase tracking-tighter">
                      {game.subject}
                    </span>
                  )}
                </div>
                <div className="p-5 flex-1 flex flex-col bg-indigo-50/50">
                  <h3 className="font-black text-indigo-900 text-xl">{game.title}</h3>
                  <div className="mt-auto">
                    <button className="w-full bg-slate-800 text-white font-bold py-2 rounded-xl flex justify-center gap-2 items-center">
                      <Play className="w-4 h-4 fill-current" /> Chơi ngay
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {offlineGames.length === 0 && (
              <p className="text-center text-slate-400 col-span-2 py-10">Chưa có trò chơi nào được giao.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
