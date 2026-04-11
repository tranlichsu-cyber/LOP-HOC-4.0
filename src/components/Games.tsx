import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Rocket, Swords, Play, X, Star, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Game } from '../types';
import MillionaireGame from './games/MillionaireGame';
import RaceGame from './games/RaceGame';
import WheelGame from './games/WheelGame';
import OfflineGame from './games/OfflineGame';
import WiseOneGame from './games/WiseOneGame';
import MatchingGame from './games/MatchingGame';
import MemoryGame from './games/MemoryGame';
import WordSearchGame from './games/WordSearchGame';

import { db, auth } from '../firebase';
import { doc, deleteDoc, setDoc } from 'firebase/firestore';

export default function Games({ offlineGames, liveGames, setOfflineGames, setLiveGames, students }: any) {
  const [activeTab, setActiveTab] = useState<'live' | 'offline' | 'wheel'>('live');
  const [playingGame, setPlayingGame] = useState<Game | null>(null);
  const [isWheelOpen, setIsWheelOpen] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [newGame, setNewGame] = useState<Partial<Game>>({
    title: '',
    type: 'math',
    questionsList: [],
    timeLimit: 30
  });

  const [newQuestion, setNewQuestion] = useState<any>({
    type: 'multiple_choice',
    text: '',
    options: ['', '', '', ''],
    correct: 0,
    mediaUrl: '',
    timeLimit: 30
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setNewQuestion({ ...newQuestion, mediaUrl: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const addQuestion = () => {
    if (!newQuestion.text) return;
    const updatedQuestions = [...(newGame.questionsList || []), { ...newQuestion, id: Date.now().toString() }];
    setNewGame({ ...newGame, questionsList: updatedQuestions });
    setNewQuestion({ type: 'multiple_choice', text: '', options: ['', '', '', ''], correct: 0, mediaUrl: '', timeLimit: newGame.timeLimit || 30 });
  };

  const deleteGame = async (id: string, type: string) => {
    const teacherUid = auth.currentUser?.uid;
    if (teacherUid) {
      if (!confirm("Bạn có chắc chắn muốn xóa trò chơi này?")) return;
      try {
        await deleteDoc(doc(db, 'teachers', teacherUid, 'games', id));
        if (type === 'race') {
          setLiveGames(liveGames.filter((g: Game) => g.id !== id));
        } else {
          setOfflineGames(offlineGames.filter((g: Game) => g.id !== id));
        }
      } catch (e) {
        console.error("Error deleting game:", e);
        alert("Lỗi khi xóa trò chơi!");
      }
    }
  };

  const handleAddGame = async (e: React.FormEvent) => {
    e.preventDefault();
    const teacherUid = auth.currentUser?.uid;
    if (teacherUid && newGame.title) {
      const game: Game = {
        id: editingGame?.id || Date.now().toString(),
        title: newGame.title,
        type: newGame.type as any,
        questionsList: newGame.questionsList || [],
        timeLimit: newGame.timeLimit
      };
      try {
        await setDoc(doc(db, 'teachers', teacherUid, 'games', game.id), game);
        if (game.type === 'race') {
          const filtered = liveGames.filter((g: Game) => g.id !== game.id);
          setLiveGames([...filtered, game]);
        } else {
          const filtered = offlineGames.filter((g: Game) => g.id !== game.id);
          setOfflineGames([...filtered, game]);
        }
        setIsAddModalOpen(false);
        setEditingGame(null);
        setNewGame({ title: '', type: 'math', questionsList: [] });
      } catch (e) {
        console.error("Error saving game:", e);
        alert("Lỗi khi lưu trò chơi!");
      }
    }
  };

  if (isWheelOpen) {
    return <WheelGame students={students} onClose={() => setIsWheelOpen(false)} />;
  }

  if (playingGame) {
    if (playingGame.type === 'millionaire') {
      return <MillionaireGame game={playingGame} onClose={() => setPlayingGame(null)} />;
    }
    if (playingGame.type === 'race') {
      return <RaceGame game={playingGame} onClose={() => setPlayingGame(null)} />;
    }
    if (playingGame.type === 'wise_one') {
      return <WiseOneGame game={playingGame} onClose={() => setPlayingGame(null)} />;
    }
    if (playingGame.type === 'matching') {
      return <MatchingGame game={playingGame} onClose={() => setPlayingGame(null)} />;
    }
    if (playingGame.type === 'memory') {
      return <MemoryGame game={playingGame} onClose={() => setPlayingGame(null)} />;
    }
    if (playingGame.type === 'word_search') {
      return <WordSearchGame game={playingGame} onClose={() => setPlayingGame(null)} />;
    }
    return <OfflineGame game={playingGame} onClose={() => setPlayingGame(null)} />;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex gap-4 mb-6 border-b border-slate-200 dark:border-slate-700 pb-px shrink-0">
        <button 
          onClick={() => setActiveTab('live')} 
          className={`px-6 py-3 font-bold text-sm border-b-4 transition-colors font-kids uppercase tracking-wider flex items-center gap-2 ${activeTab === 'live' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500'}`}
        >
          Trò chơi tương tác
          <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">LIVE</span>
        </button>
        <button 
          onClick={() => setActiveTab('offline')} 
          className={`px-6 py-3 font-bold text-sm border-b-4 transition-colors font-kids uppercase tracking-wider ${activeTab === 'offline' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500'}`}
        >
          Trò chơi offline
        </button>
        <button 
          onClick={() => setIsWheelOpen(true)} 
          className={`px-6 py-3 font-bold text-sm border-b-4 transition-colors font-kids uppercase tracking-wider border-transparent text-slate-500 hover:text-slate-700`}
        >
          Vòng quay may mắn
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="flex-1 overflow-auto"
        >
          {activeTab === 'live' && (
            <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">Kho trò chơi trực tiếp</h3>
              <div className="flex gap-2">
                <button 
                  onClick={async () => {
                    const teacherUid = auth.currentUser?.uid;
                    if (!teacherUid) return;
                    const sampleGames: Game[] = [
                      {
                        id: 'sample-race-1-' + Date.now(),
                        title: "Cuộc đua Rừng Xanh",
                        type: 'race',
                        questionsList: [
                          { id: '1', type: 'multiple_choice', text: "Con vật nào chạy nhanh nhất?", options: ["Báo săn", "Sư tử", "Ngựa", "Voi"], correct: 0 },
                          { id: '2', type: 'multiple_choice', text: "Con gì có vòi dài?", options: ["Hổ", "Khỉ", "Voi", "Hươu"], correct: 2 }
                        ]
                      },
                      {
                        id: 'sample-race-2-' + Date.now(),
                        title: "Giải cứu Đại dương",
                        type: 'race',
                        questionsList: [
                          { id: '1', type: 'multiple_choice', text: "Cá gì lớn nhất đại dương?", options: ["Cá mập", "Cá voi xanh", "Cá heo", "Cá ngừ"], correct: 1 }
                        ]
                      }
                    ];
                    try {
                      for (const g of sampleGames) {
                        await setDoc(doc(db, 'teachers', teacherUid, 'games', g.id), g);
                      }
                      setLiveGames([...liveGames, ...sampleGames]);
                      alert("Đã thêm các trò chơi tương tác mẫu!");
                    } catch (e) {
                      console.error(e);
                      alert("Lỗi khi thêm trò chơi mẫu!");
                    }
                  }}
                  className="px-4 py-2 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-200 transition border border-indigo-200 dark:border-indigo-800"
                >
                  <Rocket className="w-4 h-4" /> Tạo trò chơi mẫu
                </button>
                <button 
                  onClick={() => {
                    setNewGame({ title: '', type: 'race', questionsList: [] });
                    setIsAddModalOpen(true);
                  }}
                  className="px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-orange-600 transition"
                >
                  <Plus className="w-4 h-4" /> Thêm trò chơi mới
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {liveGames.map((game: Game) => (
                <GameCard 
                  key={game.id} 
                  game={game} 
                  onPlay={() => setPlayingGame(game)} 
                  onDelete={() => deleteGame(game.id, game.type)} 
                  onEdit={() => {
                    setEditingGame(game);
                    setNewGame(game);
                    setIsAddModalOpen(true);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'offline' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">Kho trò chơi ôn tập</h3>
              <div className="flex gap-2">
                <button 
                  onClick={async () => {
                    const teacherUid = auth.currentUser?.uid;
                    if (!teacherUid) return;
                    const sampleWord: Game = {
                      id: 'sample-word-' + Date.now(),
                      title: "Tìm từ: Chủ đề Trái cây",
                      type: 'word_search',
                      questionsList: [
                        { id: '1', type: 'multiple_choice', text: "APPLE" },
                        { id: '2', type: 'multiple_choice', text: "BANANA" },
                        { id: '3', type: 'multiple_choice', text: "ORANGE" },
                        { id: '4', type: 'multiple_choice', text: "GRAPES" },
                        { id: '5', type: 'multiple_choice', text: "MANGO" },
                        { id: '6', type: 'multiple_choice', text: "LEMON" }
                      ],
                      timeLimit: 120
                    };
                    try {
                      await setDoc(doc(db, 'teachers', teacherUid, 'games', sampleWord.id), sampleWord);
                      setOfflineGames([...offlineGames, sampleWord]);
                      alert("Đã thêm trò chơi 'Tìm từ' mẫu!");
                    } catch (e) {
                      console.error(e);
                      alert("Lỗi khi thêm trò chơi mẫu!");
                    }
                  }}
                  className="px-4 py-2 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-yellow-200 transition border border-yellow-200 dark:border-yellow-800"
                >
                  <Plus className="w-4 h-4" /> Tạo trò chơi Tìm từ
                </button>
                <button 
                  onClick={async () => {
                    const teacherUid = auth.currentUser?.uid;
                    if (!teacherUid) return;
                    const sampleMemory: Game = {
                      id: 'sample-memory-' + Date.now(),
                      title: "Lật hình: Động vật ngộ nghĩnh",
                      type: 'memory',
                      questionsList: [
                        { id: '1', type: 'multiple_choice', text: "Con Mèo", mediaUrl: "https://picsum.photos/seed/cat/200/200" },
                        { id: '2', type: 'multiple_choice', text: "Con Chó", mediaUrl: "https://picsum.photos/seed/dog/200/200" },
                        { id: '3', type: 'multiple_choice', text: "Con Thỏ", mediaUrl: "https://picsum.photos/seed/rabbit/200/200" },
                        { id: '4', type: 'multiple_choice', text: "Con Gấu", mediaUrl: "https://picsum.photos/seed/bear/200/200" },
                        { id: '5', type: 'multiple_choice', text: "Con Hổ", mediaUrl: "https://picsum.photos/seed/tiger/200/200" },
                        { id: '6', type: 'multiple_choice', text: "Con Sư Tử", mediaUrl: "https://picsum.photos/seed/lion/200/200" },
                        { id: '7', type: 'multiple_choice', text: "Con Voi", mediaUrl: "https://picsum.photos/seed/elephant/200/200" },
                        { id: '8', type: 'multiple_choice', text: "Con Khỉ", mediaUrl: "https://picsum.photos/seed/monkey/200/200" }
                      ],
                      timeLimit: 60
                    };
                    try {
                      await setDoc(doc(db, 'teachers', teacherUid, 'games', sampleMemory.id), sampleMemory);
                      setOfflineGames([...offlineGames, sampleMemory]);
                      alert("Đã thêm trò chơi 'Lật hình' mẫu!");
                    } catch (e) {
                      console.error(e);
                      alert("Lỗi khi thêm trò chơi mẫu!");
                    }
                  }}
                  className="px-4 py-2 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-200 transition border border-blue-200 dark:border-blue-800"
                >
                  <Plus className="w-4 h-4" /> Tạo trò chơi Lật hình
                </button>
                <button 
                  onClick={async () => {
                    const teacherUid = auth.currentUser?.uid;
                    if (!teacherUid) return;
                    const sampleMatching: Game = {
                      id: 'sample-match-' + Date.now(),
                      title: "Nối thẻ: Từ vựng Tiếng Anh",
                      type: 'matching',
                      questionsList: [
                        { id: '1', type: 'multiple_choice', text: "Apple", options: ["Quả táo"], correct: 0 },
                        { id: '2', type: 'multiple_choice', text: "Banana", options: ["Quả chuối"], correct: 0 },
                        { id: '3', type: 'multiple_choice', text: "Orange", options: ["Quả cam"], correct: 0 },
                        { id: '4', type: 'multiple_choice', text: "Grapes", options: ["Quả nho"], correct: 0 },
                        { id: '5', type: 'multiple_choice', text: "Watermelon", options: ["Dưa hấu"], correct: 0 },
                        { id: '6', type: 'multiple_choice', text: "Strawberry", options: ["Dâu tây"], correct: 0 }
                      ],
                      timeLimit: 60
                    };
                    try {
                      await setDoc(doc(db, 'teachers', teacherUid, 'games', sampleMatching.id), sampleMatching);
                      setOfflineGames([...offlineGames, sampleMatching]);
                      alert("Đã thêm trò chơi 'Nối thẻ' mẫu!");
                    } catch (e) {
                      console.error(e);
                      alert("Lỗi khi thêm trò chơi mẫu!");
                    }
                  }}
                  className="px-4 py-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-emerald-200 transition border border-emerald-200 dark:border-emerald-800"
                >
                  <Plus className="w-4 h-4" /> Tạo trò chơi Nối thẻ
                </button>
                <button 
                  onClick={async () => {
                    const teacherUid = auth.currentUser?.uid;
                    if (!teacherUid) return;
                    const sampleWise: Game = {
                      id: 'sample-wise-' + Date.now(),
                      title: "Ai Là Nhà Thông Thái: Khoa học vui",
                      type: 'wise_one',
                      questionsList: []
                    };
                    try {
                      await setDoc(doc(db, 'teachers', teacherUid, 'games', sampleWise.id), sampleWise);
                      setOfflineGames([...offlineGames, sampleWise]);
                      alert("Đã thêm trò chơi 'Ai Là Nhà Thông Thái'!");
                    } catch (e) {
                      console.error(e);
                      alert("Lỗi khi thêm trò chơi mẫu!");
                    }
                  }}
                  className="px-4 py-2 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-purple-200 transition border border-purple-200 dark:border-purple-800"
                >
                  <Brain className="w-4 h-4" /> Tạo trò chơi AI
                </button>
                <button 
                  onClick={async () => {
                    const teacherUid = auth.currentUser?.uid;
                    if (!teacherUid) return;
                    const sampleMil: Game = {
                      id: 'sample-mil-' + Date.now(),
                      title: "Ai Là Triệu Phú: Kiến thức tổng hợp",
                      type: 'millionaire',
                      questionsList: [
                        { id: '1', type: 'multiple_choice', text: "Đỉnh núi cao nhất thế giới là gì?", options: ["Fansipan", "Everest", "Phú Sĩ", "K2"], correct: 1 },
                        { id: '2', type: 'multiple_choice', text: "Ai là người đầu tiên đặt chân lên Mặt Trăng?", options: ["Yuri Gagarin", "Neil Armstrong", "Buzz Aldrin", "Michael Collins"], correct: 1 },
                        { id: '3', type: 'multiple_choice', text: "Thủ đô của nước Pháp là gì?", options: ["London", "Berlin", "Paris", "Rome"], correct: 2 },
                        { id: '4', type: 'multiple_choice', text: "Hành tinh nào gần Mặt Trời nhất?", options: ["Kim tinh", "Thủy tinh", "Hỏa tinh", "Trái Đất"], correct: 1 },
                        { id: '5', type: 'multiple_choice', text: "Loài động vật nào lớn nhất thế giới?", options: ["Voi", "Cá voi xanh", "Khủng long", "Hươu cao cổ"], correct: 1 }
                      ]
                    };
                    try {
                      await setDoc(doc(db, 'teachers', teacherUid, 'games', sampleMil.id), sampleMil);
                      setOfflineGames([...offlineGames, sampleMil]);
                      alert("Đã thêm trò chơi 'Ai Là Triệu Phú' mẫu!");
                    } catch (e) {
                      console.error(e);
                      alert("Lỗi khi thêm trò chơi mẫu!");
                    }
                  }}
                  className="px-4 py-2 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-200 transition border border-indigo-200 dark:border-indigo-800"
                >
                  <Star className="w-4 h-4" /> Tạo trò chơi mẫu
                </button>
                <button 
                  onClick={() => {
                    setNewGame({ title: '', type: 'math', questionsList: [] });
                    setIsAddModalOpen(true);
                  }}
                  className="px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-600 transition"
                >
                  <Plus className="w-4 h-4" /> Thêm trò chơi mới
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {offlineGames.map((game: Game) => (
                <GameCard 
                  key={game.id} 
                  game={game} 
                  onPlay={() => setPlayingGame(game)} 
                  onDelete={() => deleteGame(game.id, game.type)} 
                  onEdit={() => {
                    setEditingGame(game);
                    setNewGame(game);
                    setIsAddModalOpen(true);
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{editingGame ? 'Chỉnh sửa trò chơi' : 'Thêm trò chơi mới'}</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleAddGame} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-300">Tên trò chơi</label>
                    <input 
                      type="text" 
                      placeholder="VD: Đua top Rừng Xanh" 
                      value={newGame.title}
                      onChange={e => setNewGame({...newGame, title: e.target.value})}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-orange-500 dark:text-white" 
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-300">Loại trò chơi</label>
                    <select 
                      value={newGame.type}
                      onChange={e => setNewGame({...newGame, type: e.target.value as any})}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-orange-500 dark:text-white"
                    >
                      <option value="math">Toán học (Offline)</option>
                      <option value="millionaire">Ai là triệu phú (Offline)</option>
                      <option value="matching">Nối thẻ (Offline)</option>
                      <option value="memory">Lật hình (Offline)</option>
                      <option value="word_search">Tìm từ (Offline)</option>
                      <option value="race">Đua top (Trực tiếp)</option>
                      <option value="wise_one">Ai là nhà thông thái (AI)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-300">Thời gian mặc định (giây)</label>
                    <input 
                      type="number" 
                      value={newGame.timeLimit}
                      onChange={e => setNewGame({...newGame, timeLimit: parseInt(e.target.value)})}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-orange-500 dark:text-white" 
                      min="5"
                    />
                  </div>

                  <div className="pt-4">
                    <h4 className="font-bold text-slate-800 dark:text-white mb-2">Danh sách câu hỏi ({newGame.questionsList?.length || 0})</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                      {newGame.questionsList?.map((q: any, idx: number) => (
                        <div key={q.id} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                          <div className="truncate flex-1">
                            <span className="font-bold text-orange-500 mr-2">{idx + 1}.</span>
                            <span className="text-sm dark:text-slate-300">{q.text}</span>
                          </div>
                          <button 
                            type="button"
                            onClick={() => {
                              const updated = newGame.questionsList?.filter((_: any, i: number) => i !== idx);
                              setNewGame({...newGame, questionsList: updated});
                            }}
                            className="text-red-500 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {(!newGame.questionsList || newGame.questionsList.length === 0) && (
                        <p className="text-sm text-slate-400 italic">Chưa có câu hỏi nào.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                  <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Plus className="w-4 h-4 text-orange-500" /> Thêm câu hỏi
                  </h4>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nội dung câu hỏi</label>
                    <textarea 
                      value={newQuestion.text}
                      onChange={e => setNewQuestion({...newQuestion, text: e.target.value})}
                      className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-orange-500 dark:text-white text-sm h-20 resize-none"
                      placeholder="Nhập câu hỏi..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {newQuestion.options.map((opt: string, idx: number) => (
                      <div key={idx}>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Đáp án {['A','B','C','D'][idx]}</label>
                        <input 
                          type="text"
                          value={opt}
                          onChange={e => {
                            const updated = [...newQuestion.options];
                            updated[idx] = e.target.value;
                            setNewQuestion({...newQuestion, options: updated});
                          }}
                          className={`w-full p-2 bg-white dark:bg-slate-800 border rounded-lg outline-none text-xs dark:text-white ${newQuestion.correct === idx ? 'border-green-500 ring-1 ring-green-500' : 'border-slate-200 dark:border-slate-700'}`}
                          placeholder={`Nhập đáp án ${['A','B','C','D'][idx]}...`}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Đáp án đúng</label>
                      <select 
                        value={newQuestion.correct}
                        onChange={e => setNewQuestion({...newQuestion, correct: parseInt(e.target.value)})}
                        className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-xs dark:text-white"
                      >
                        <option value={0}>Đáp án A</option>
                        <option value={1}>Đáp án B</option>
                        <option value={2}>Đáp án C</option>
                        <option value={3}>Đáp án D</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hình ảnh/Video</label>
                      <input type="file" id="game-media" className="hidden" accept="image/*,video/mp4" onChange={handleFileUpload} />
                      <button 
                        type="button"
                        onClick={() => document.getElementById('game-media')?.click()}
                        className={`w-full p-2 border-2 border-dashed rounded-lg text-xs font-medium transition flex items-center justify-center gap-2 ${newQuestion.mediaUrl ? 'border-green-500 text-green-600 bg-green-50 dark:bg-green-900/20' : 'border-slate-300 dark:border-slate-700 text-slate-500'}`}
                      >
                        {newQuestion.mediaUrl ? 'Đã chọn file' : 'Tải lên Media'}
                      </button>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Thời gian (giây)</label>
                      <input 
                        type="number" 
                        value={newQuestion.timeLimit}
                        onChange={e => setNewQuestion({...newQuestion, timeLimit: parseInt(e.target.value)})}
                        className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-xs dark:text-white"
                        min="5"
                      />
                    </div>
                  </div>

                  <button 
                    type="button"
                    onClick={addQuestion}
                    className="w-full py-2.5 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition text-sm"
                  >
                    Thêm vào danh sách
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-6 py-2.5 bg-slate-100 dark:bg-slate-700 font-bold rounded-xl text-slate-700 dark:text-slate-300">Hủy</button>
                <button type="submit" className="px-8 py-2.5 bg-orange-500 text-white font-bold rounded-xl shadow-lg shadow-orange-200 dark:shadow-none">Lưu trò chơi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function GameCard({ game, onPlay, onDelete, onEdit }: any) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl border-4 border-indigo-100 dark:border-slate-700 shadow-xl flex flex-col h-[260px] transform hover:-translate-y-2 transition cursor-pointer relative overflow-hidden group">
      <div className="absolute top-2 right-2 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="bg-white p-2 rounded-xl text-blue-600 shadow-sm border"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }} 
          className="bg-white p-2 rounded-xl text-red-600 shadow-sm border"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <div onClick={onPlay} className={`h-28 p-4 relative overflow-hidden ${game.type === 'race' ? 'bg-gradient-to-br from-orange-400 to-red-500' : 'bg-gradient-to-br from-indigo-400 to-purple-500'}`}>
        {game.type === 'race' ? <Swords className="absolute -top-4 -right-4 w-24 h-24 text-white/30" /> : <Rocket className="absolute -top-4 -right-4 w-24 h-24 text-white/30" />}
      </div>
      <div onClick={onPlay} className="p-5 flex-1 flex flex-col bg-indigo-50/50 dark:bg-slate-900/50">
        <h3 className="font-black text-indigo-900 dark:text-white text-xl">{game.title}</h3>
        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">{game.questionsList?.length || 0} câu hỏi</p>
        <div className="mt-auto">
          <button className="w-full bg-slate-800 text-white font-bold py-2 rounded-xl flex justify-center gap-2 items-center">
            <Play className="w-4 h-4 fill-current" /> Chơi ngay
          </button>
        </div>
      </div>
    </div>
  );
}
