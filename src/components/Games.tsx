import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Rocket, Swords, Play, X, Star, Brain, Sparkles, Loader2, Gamepad2, Accessibility, Puzzle, Dices, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Game } from '../types';
import { GoogleGenAI } from '@google/genai';
import { getVietnam34ProvincesContext } from '../data/vietnam34Provinces';
import { getTextbookContext } from '../data/textbookTNXH2';
import MillionaireGame from './games/MillionaireGame';
import RaceGame from './games/RaceGame';
import WheelGame from './games/WheelGame';
import OfflineGame from './games/OfflineGame';
import WiseOneGame from './games/WiseOneGame';
import MatchingGame from './games/MatchingGame';
import MemoryGame from './games/MemoryGame';
import WordSearchGame from './games/WordSearchGame';
import WordLinkGame from './games/WordLinkGame';
import CrosswordGame from './games/CrosswordGame';
import DragDropGame from './games/DragDropGame';

import { db, auth } from '../firebase';
import { doc, deleteDoc, setDoc } from 'firebase/firestore';

export default function Games({ offlineGames, liveGames, setOfflineGames, setLiveGames, students }: any) {
  const [activeTab, setActiveTab] = useState<'live' | 'offline' | 'wheel'>('live');
  const [playingGame, setPlayingGame] = useState<Game | null>(null);
  const [isWheelOpen, setIsWheelOpen] = useState(false);

  const GAME_TEMPLATES = [
    { 
      id: 'tug-of-war', 
      title: "Kéo Co - Đua thuyền kiến thức", 
      desc: "Hai đội thi đấu trả lời câu hỏi để giành chiến thắng trong trò chơi dân gian đầy sôi động",
      icon: <Swords className="w-6 h-6 text-emerald-600" />,
      color: "bg-emerald-500/20",
      badge: null
    },
    { 
      id: 'tilt-quiz', 
      title: "Quiz Nghiêng Đầu", 
      desc: "Học sinh nghiêng đầu sang trái hoặc phải để chọn đáp án, nhận diện qua camera",
      icon: <Brain className="w-6 h-6 text-purple-600" />,
      color: "bg-purple-500/20",
      badge: null
    },
    { 
      id: 'slash-fruit', 
      title: "Chém Hoa Quả / Bắn Bong Bóng", 
      desc: "Trắc nghiệm tương tác bằng cử chỉ tay — chém hoa quả bay hoặc chọc bóng nổ để chọn đáp án đúng",
      icon: <Gamepad2 className="w-6 h-6 text-indigo-600" />,
      color: "bg-indigo-500/20",
      badge: "NEW"
    },
    { 
      id: 'star-race', 
      title: "Cuộc đua ngôi sao", 
      desc: "Hai học sinh giữ ngón tay lần lượt tương ứng với 4 đáp án — trả lời đúng để lấy các ngôi sao và giành chiến thắng",
      icon: <Star className="w-6 h-6 text-orange-600" />,
      color: "bg-orange-500/20",
      badge: "NEW"
    },
    { 
      id: 'abc-gym', 
      title: "Thể dục ABC", 
      desc: "Học sinh thực hiện động tác thể dục theo hình ảnh minh họa kết hợp trả lời câu hỏi trắc nghiệm",
      icon: <Accessibility className="w-6 h-6 text-red-600" />,
      color: "bg-red-500/20",
      badge: null
    },
    { 
      id: 'puzzle-flip', 
      title: "Trò Chơi Lật Mảnh Ghép", 
      desc: "Học sinh trả lời câu hỏi để mở từng mảnh ghép, đoán tên bức ảnh để chiến thắng",
      icon: <Puzzle className="w-6 h-6 text-pink-600" />,
      color: "bg-pink-500/20",
      badge: null
    },
    { 
      id: 'turn-based', 
      title: "Game Theo Lượt", 
      desc: "Tung xúc xắc, di chuyển nhân vật, vượt chướng ngại vật bằng câu hỏi. Phù hợp chơi nhóm 2-4 người trên cùng một thiết bị.",
      icon: <Dices className="w-6 h-6 text-teal-600" />,
      color: "bg-teal-500/20",
      badge: null
    },
    { 
      id: 'versus', 
      title: "Game Đối Kháng", 
      desc: "Học sinh thi đấu 1v1 trên thiết bị riêng — trả lời đúng để đẩy đối thủ ra phía sau. Giáo viên mở phòng và tham gia trực tiếp.",
      icon: <Zap className="w-6 h-6 text-red-600" />,
      color: "bg-red-500/20",
      badge: "PRO"
    }
  ];

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [newGame, setNewGame] = useState<any>({
    title: '',
    type: 'math',
    subject: 'Toán',
    grade: 'Lớp 3',
    questionsList: [],
    timeLimit: 30,
    lessonContent: ''
  });

  const [filterSubject, setFilterSubject] = useState<string>('Tất cả');

  const SUBJECTS = ['Toán', 'Tiếng Việt', 'Tiếng Anh', 'Tự nhiên và Xã hội', 'Khoa học', 'Lịch sử và Địa lý', 'Khác'];
  const GRADEs = ['Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5'];

  const [newQuestion, setNewQuestion] = useState<any>({
    type: 'multiple_choice',
    text: '',
    options: ['', '', '', ''],
    correct: 0,
    mediaUrl: '',
    timeLimit: 30
  });

  const [isAIGenerating, setIsAIGenerating] = useState(false);

  const handleAIGenerateGame = async () => {
    if (!newGame.title) {
      alert("Vui lòng nhập tên trò chơi để AI biết chủ đề!");
      return;
    }

    setIsAIGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      const isGeographyOrProvinces = newGame.title.toLowerCase().includes('địa lí') || 
                                     newGame.title.toLowerCase().includes('tự nhiên và xã hội') ||
                                     newGame.title.toLowerCase().includes('tỉnh') || 
                                     newGame.title.toLowerCase().includes('thành phố') ||
                                     newGame.title.toLowerCase().includes('sáp nhập') ||
                                     newGame.title.toLowerCase().includes('34');
      
      const isTNXH2 = newGame.title.toLowerCase().includes('tự nhiên và xã hội');
      
      const provinceContext = isGeographyOrProvinces ? `\n\nKIẾN THỨC NỀN TẢNG QUAN TRỌNG (Cập nhật mới nhất):\n${getVietnam34ProvincesContext()}\nHãy sử dụng thông tin trên nếu câu hỏi liên quan đến các tỉnh thành Việt Nam.` : '';
      const textbookContext = isTNXH2 ? `\n\nTHAM KHẢO NỘI DUNG SÁCH GIÁO KHOA (Kết nối tri thức):\n${getTextbookContext()}\nHãy bám sát khung chương trình này khi tạo câu hỏi.` : '';

      const lessonContextPrompt = newGame.lessonContent ? `\nDỰA TRÊN NỘI DUNG BÀI HỌC SAU ĐÂY:\n${newGame.lessonContent}\n` : '';

      const prompt = `Bạn là một chuyên gia giáo dục tiểu học tại Việt Nam. 
      Hãy tạo bộ nội dung cho trò chơi "${newGame.title}" loại "${newGame.type}".${lessonContextPrompt}${provinceContext}${textbookContext}
      Yêu cầu:
      - Tạo 10 câu hỏi/mục phù hợp với lứa tuổi tiểu học.
      - Nếu có "DỰA TRÊN NỘI DUNG BÀI HỌC" ở trên, hãy bám sát nội dung đó để đặt câu hỏi.
      - Nếu là trắc nghiệm (multiple_choice): mỗi câu có 4 đáp án, 1 đáp án đúng.
      - Nếu là nối thẻ/kéo thả: tạo các cặp (text là từ khóa, options[0] là đáp án tương ứng).
      - Định dạng trả về: JSON array các object có cấu trúc:
        {
          "text": "Nội dung câu hỏi/Từ khóa",
          "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
          "correct": 0 (index của đáp án đúng)
        }
      - Trả về DUY NHẤT mảng JSON, không thêm văn bản giải thích.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts: [{ text: prompt }] }
      });

      const text = response.text || "";
      const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedQuestions = JSON.parse(cleanedText);
      const questionsWithIds = parsedQuestions.map((q: any) => ({
        ...q,
        id: Math.random().toString(36).substr(2, 9),
        type: 'multiple_choice'
      }));

      setNewGame({ ...newGame, questionsList: [...(newGame.questionsList || []), ...questionsWithIds] });
    } catch (e) {
      console.error("AI Generate Game Error:", e);
      alert("Lỗi khi tạo nội dung bằng AI!");
    } finally {
      setIsAIGenerating(false);
    }
  };

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
        subject: newGame.subject,
        grade: newGame.grade,
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
        setNewGame({ title: '', type: 'math', subject: 'Toán', grade: 'Lớp 3', questionsList: [], lessonContent: '' });
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
    if (playingGame.type === 'word_link') {
      return <WordLinkGame game={playingGame} onClose={() => setPlayingGame(null)} />;
    }
    if (playingGame.type === 'crossword') {
      return <CrosswordGame game={playingGame} onClose={() => setPlayingGame(null)} />;
    }
    if (playingGame.type === 'drag_drop') {
      return <DragDropGame game={playingGame} onClose={() => setPlayingGame(null)} />;
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
          Lớp đang chơi
          <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">LIVE</span>
        </button>
        <button 
          onClick={() => setActiveTab('offline')} 
          className={`px-6 py-3 font-bold text-sm border-b-4 transition-colors font-kids uppercase tracking-wider ${activeTab === 'offline' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500'}`}
        >
          Kho trò chơi
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
            <div className="space-y-10 pb-20">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-black text-3xl text-slate-800 dark:text-white font-kids tracking-tight uppercase italic">Kho Trò Chơi</h3>
                  <p className="text-slate-500 font-medium text-lg mt-1 italic">Học tập vui nhộn qua hệ thống trò chơi tương tác thế hệ mới</p>
                </div>
                <button 
                  onClick={() => {
                    setNewGame({ title: '', type: 'math', questionsList: [] });
                    setIsAddModalOpen(true);
                  }}
                  className="bg-orange-500 text-white px-8 py-3.5 rounded-2xl font-black text-base flex items-center gap-2 hover:bg-orange-600 shadow-xl shadow-orange-200 transition-all hover:scale-105 active:scale-95"
                >
                  <Plus className="w-6 h-6" /> Tạo trò chơi mới
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
                {GAME_TEMPLATES.map((tmpl) => (
                  <div key={tmpl.id} className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 shadow-sm border-[3px] border-slate-50 dark:border-slate-700 relative group hover:shadow-2xl hover:border-indigo-400 dark:hover:border-indigo-500 transition-all duration-500 flex flex-col min-h-[340px] transform hover:-translate-y-2">
                    {tmpl.badge ? (
                      <div className={`absolute -top-3 -right-3 rotate-12 ${tmpl.badge === 'PRO' ? 'bg-orange-500' : 'bg-red-500'} text-white text-[12px] font-black px-4 py-1.5 rounded-xl shadow-lg z-10 flex items-center gap-1.5 ring-4 ring-white dark:ring-slate-900`}>
                        {tmpl.badge === 'PRO' && <Zap className="w-3.5 h-3.5 fill-current" />}
                        {tmpl.badge}
                      </div>
                    ) : null}
                    
                    <div className="flex items-start gap-5 mb-6">
                      <div className={`w-16 h-16 rounded-[1.25rem] ${tmpl.color} flex items-center justify-center shrink-0 shadow-inner group-hover:rotate-12 transition-transform duration-500`}>
                        {tmpl.icon}
                      </div>
                      <div className="pt-1">
                        <h4 className="font-extrabold text-slate-800 dark:text-white text-xl leading-[1.2] group-hover:text-indigo-600 transition-colors">
                          {tmpl.title}
                        </h4>
                      </div>
                    </div>
                    
                    <p className="flex-1 text-slate-500 dark:text-slate-400 text-[15px] leading-relaxed font-medium line-clamp-4 italic border-l-4 border-slate-100 dark:border-slate-700 pl-4">
                      {tmpl.desc}
                    </p>
                    
                    <div className="mt-8">
                      <button 
                        onClick={() => {
                          setNewGame({ 
                            title: tmpl.title, 
                            type: tmpl.id.includes('race') || tmpl.id.includes('star') || tmpl.id.includes('versus') ? 'race' : 'math', 
                            questionsList: "" 
                          });
                          setIsAddModalOpen(true);
                        }}
                        className="w-full py-4 bg-[#6366f1] text-white rounded-[1.25rem] text-[17px] font-black hover:bg-[#4f46e5] transition-all shadow-lg shadow-indigo-100 dark:shadow-none hover:scale-[1.02] active:scale-95"
                      >
                        Bắt đầu
                      </button>
                    </div>
                  </div>
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-300">Môn học</label>
                      <select 
                        value={newGame.subject}
                        onChange={e => setNewGame({...newGame, subject: e.target.value})}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-orange-500 dark:text-white"
                      >
                        {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-300">Khối lớp</label>
                      <select 
                        value={newGame.grade}
                        onChange={e => setNewGame({...newGame, grade: e.target.value})}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-orange-500 dark:text-white"
                      >
                        {GRADEs.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
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
                      <option value="word_link">Nối từ (Offline)</option>
                      <option value="crossword">Giải đố ô chữ (Offline)</option>
                      <option value="drag_drop">Kéo thả (Offline)</option>
                      <option value="race">Đua top (Trực tiếp)</option>
                      <option value="wise_one">Ai là nhà thông thái (AI)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-300">Nội dung bài học (Tùy chọn - Để AI tạo quiz sát hơn)</label>
                    <textarea 
                      placeholder="Dán nội dung bài học hoặc kiến thức trọng tâm vào đây..." 
                      value={newGame.lessonContent}
                      onChange={e => setNewGame({...newGame, lessonContent: e.target.value})}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-orange-500 dark:text-white text-sm h-32 resize-none" 
                    />
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
                    <div className="flex justify-between items-center mb-2">
                       <h4 className="font-bold text-slate-800 dark:text-white">Danh sách câu hỏi ({newGame.questionsList?.length || 0})</h4>
                       <button
                         type="button"
                         onClick={handleAIGenerateGame}
                         disabled={isAIGenerating}
                         className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded-xl text-xs font-bold hover:bg-purple-200 transition disabled:opacity-50"
                       >
                         {isAIGenerating ? (
                           <Loader2 className="w-3.5 h-3.5 animate-spin" />
                         ) : (
                           <Sparkles className="w-3.5 h-3.5" />
                         )}
                         Tạo bằng AI
                       </button>
                    </div>
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
