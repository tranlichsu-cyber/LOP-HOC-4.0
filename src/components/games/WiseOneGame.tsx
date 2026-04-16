import React, { useState, useEffect } from 'react';
import { X, Brain, Trophy, Loader2, Sparkles, ChevronRight, HelpCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Game, Question } from '../../types';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { playSound, startBackgroundMusic, stopBackgroundMusic } from '../../lib/sounds';
import { getVietnam34ProvincesContext } from '../../data/vietnam34Provinces';
import { getTextbookContext } from '../../data/textbookTNXH2';

export default function WiseOneGame({ game, onClose }: { game: Game, onClose: () => void }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [questions, setQuestions] = useState<Question[]>(game.questionsList || []);
  const [topic, setTopic] = useState('Khoa học');
  const [grade, setGrade] = useState('Lớp 3');

  useEffect(() => {
    return () => stopBackgroundMusic();
  }, []);

  const generateQuestions = async () => {
    setIsGenerating(true);
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
      
      const isGeographyOrProvinces = topic.toLowerCase().includes('địa lí') || 
                                     topic.toLowerCase().includes('tự nhiên và xã hội') ||
                                     topic.toLowerCase().includes('tỉnh') || 
                                     topic.toLowerCase().includes('thành phố') ||
                                     topic.toLowerCase().includes('sáp nhập') ||
                                     topic.toLowerCase().includes('34');
      
      const isTNXH2 = topic.toLowerCase().includes('tự nhiên và xã hội') && grade.includes('2');
      
      const provinceContext = isGeographyOrProvinces ? `\n\nKIẾN THỨC NỀN TẢNG QUAN TRỌNG (Cập nhật mới nhất):\n${getVietnam34ProvincesContext()}\nHãy sử dụng thông tin trên nếu câu hỏi liên quan đến các tỉnh thành Việt Nam.` : '';
      const textbookContext = isTNXH2 ? `\n\nTHAM KHẢO NỘI DUNG SÁCH GIÁO KHOA (Kết nối tri thức):\n${getTextbookContext()}\nHãy bám sát khung chương trình này khi tạo câu hỏi.` : '';

      const prompt = `Hãy tạo 10 câu hỏi trắc nghiệm về chủ đề "${topic}" cho học sinh "${grade}" tại Việt Nam.${provinceContext}${textbookContext}
      Yêu cầu:
      - Mỗi câu hỏi có 4 lựa chọn (A, B, C, D).
      - Chỉ có 1 đáp án đúng.
      - Ngôn ngữ: Tiếng Việt.
      - Định dạng trả về: JSON array các object có cấu trúc:
        {
          "text": "Nội dung câu hỏi",
          "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
          "correct": 0 (index của đáp án đúng từ 0-3)
        }
      - Trả về DUY NHẤT mảng JSON, không thêm lời dẫn.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedQuestions = JSON.parse(cleanedText);
      
      const formattedQuestions = parsedQuestions.map((q: any, idx: number) => ({
        id: `ai-q-${idx}-${Date.now()}`,
        type: 'multiple_choice',
        ...q
      }));

      setQuestions(formattedQuestions);
      setCurrentIdx(0);
      setScore(0);
      setIsGameOver(false);
      startBackgroundMusic();
    } catch (error: any) {
      console.error("Error generating questions:", error);
      const msg = error.message || "";
      if (msg.includes('leaked')) {
        alert("LỖI BẢO MẬT: API Key của bạn đã bị lộ. Vui lòng cập nhật API Key mới trong phần Settings của AI Studio.");
      } else {
        alert("Lỗi khi tạo câu hỏi từ AI. Vui lòng thử lại! " + msg);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswer = (idx: number) => {
    if (isAnswered) return;
    setSelectedIdx(idx);
    setIsAnswered(true);
    
    if (idx === questions[currentIdx].correct) {
      setScore(score + 10);
      playSound('correct');
    } else {
      playSound('wrong');
    }

    setTimeout(() => {
      if (currentIdx + 1 < questions.length) {
        setCurrentIdx(currentIdx + 1);
        setSelectedIdx(null);
        setIsAnswered(false);
      } else {
        setIsGameOver(true);
        playSound('winner');
        stopBackgroundMusic();
      }
    }, 1500);
  };

  if (questions.length === 0 && !isGenerating) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl border-4 border-purple-500">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black text-purple-600 flex items-center gap-2">
              <Brain className="w-8 h-8" /> Ai là Nhà Thông Thái?
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <p className="text-slate-600 dark:text-slate-400 mb-6 font-medium">
            Hãy chọn chủ đề và khối lớp để AI tạo ra bộ câu hỏi thử thách trí tuệ dành cho bạn!
          </p>

          <div className="space-y-4 mb-8">
            <div>
              <label className="block text-sm font-bold text-slate-500 uppercase mb-1">Chủ đề</label>
              <select 
                value={topic}
                onChange={e => setTopic(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-purple-500 dark:text-white font-bold"
              >
                <option>Khoa học</option>
                <option>Lịch sử Việt Nam</option>
                <option>Địa lý</option>
                <option>Thế giới động vật</option>
                <option>Vũ trụ bao la</option>
                <option>Văn hóa dân gian</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-500 uppercase mb-1">Khối lớp</label>
              <select 
                value={grade}
                onChange={e => setGrade(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-purple-500 dark:text-white font-bold"
              >
                <option>Lớp 1</option>
                <option>Lớp 2</option>
                <option>Lớp 3</option>
                <option>Lớp 4</option>
                <option>Lớp 5</option>
              </select>
            </div>
          </div>

          <button 
            onClick={generateQuestions}
            className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl shadow-lg shadow-purple-200 dark:shadow-none transition transform active:scale-95 flex items-center justify-center gap-2 text-lg"
          >
            <Sparkles className="w-6 h-6" /> Bắt đầu thử thách
          </button>
        </div>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-900 flex items-center justify-center p-4 overflow-hidden">
        <div className="text-center relative">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0]
            }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="mb-8"
          >
            <Brain className="w-24 h-24 text-purple-400 mx-auto drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]" />
          </motion.div>
          <h2 className="text-3xl font-black text-white mb-4">Nhà Thông Thái đang suy nghĩ...</h2>
          <p className="text-purple-300 font-medium animate-pulse">AI đang tạo ra những câu hỏi hóc búa nhất dành cho bạn</p>
          
          <div className="mt-12 flex justify-center gap-2">
            {[0, 1, 2].map(i => (
              <motion.div 
                key={i}
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.2 }}
                className="w-3 h-3 bg-purple-500 rounded-full"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isGameOver) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-10 max-w-md w-full shadow-2xl border-4 border-yellow-400 text-center relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-400/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"></div>

          <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
          <h2 className="text-4xl font-black text-slate-800 dark:text-white mb-2 uppercase">Hoàn thành!</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 font-bold">Bạn đã chứng minh được trí tuệ của mình</p>
          
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 mb-8 border-2 border-slate-100 dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400 text-sm uppercase font-black tracking-widest mb-1">Tổng điểm</p>
            <p className="text-6xl font-black text-purple-600">{score}</p>
            <p className="text-sm text-slate-400 mt-2">({Math.round((score / (questions.length * 10)) * 100)}% chính xác)</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => {
                setQuestions([]);
                setIsGameOver(false);
              }}
              className="py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 transition"
            >
              Chơi lại
            </button>
            <button 
              onClick={onClose}
              className="py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 shadow-lg shadow-purple-200 dark:shadow-none transition"
            >
              Thoát
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 dark:bg-slate-900 flex flex-col font-sans">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
            <Brain className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="font-black text-slate-800 dark:text-white leading-tight">Ai là Nhà Thông Thái?</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{topic} • {grade}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Điểm số</p>
            <p className="text-xl font-black text-purple-600">{score}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 relative">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
          className="h-full bg-purple-600 shadow-[0_0_10px_rgba(147,51,234,0.5)]"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col items-center">
        <div className="w-full max-w-3xl">
          {/* Question Card */}
          <motion.div 
            key={currentIdx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl border-2 border-slate-100 dark:border-slate-700 mb-8 relative"
          >
            <div className="absolute -top-4 left-10 bg-purple-600 text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest shadow-lg">
              Câu hỏi {currentIdx + 1}
            </div>
            
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white leading-relaxed mt-4">
              {currentQuestion.text}
            </h2>
          </motion.div>

          {/* Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentQuestion.options?.map((opt, idx) => {
              const isSelected = selectedIdx === idx;
              const isCorrect = isAnswered && idx === currentQuestion.correct;
              const isWrong = isAnswered && isSelected && idx !== currentQuestion.correct;
              
              return (
                <motion.button
                  key={idx}
                  whileHover={!isAnswered ? { scale: 1.02, y: -2 } : {}}
                  whileTap={!isAnswered ? { scale: 0.98 } : {}}
                  onClick={() => handleAnswer(idx)}
                  disabled={isAnswered}
                  className={`
                    p-5 rounded-2xl text-left font-bold text-lg transition-all border-4 flex items-center justify-between
                    ${!isAnswered ? 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-purple-200 dark:hover:border-purple-900/50 text-slate-700 dark:text-slate-300 shadow-md' : ''}
                    ${isCorrect ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-700 dark:text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : ''}
                    ${isWrong ? 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-700 dark:text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : ''}
                    ${isAnswered && !isCorrect && !isWrong ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 text-slate-400 opacity-60' : ''}
                  `}
                >
                  <div className="flex items-center gap-4">
                    <span className={`
                      w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black
                      ${!isAnswered ? 'bg-slate-100 dark:bg-slate-700 text-slate-500' : ''}
                      ${isCorrect ? 'bg-emerald-500 text-white' : ''}
                      ${isWrong ? 'bg-red-500 text-white' : ''}
                      ${isAnswered && !isCorrect && !isWrong ? 'bg-slate-200 dark:bg-slate-800 text-slate-400' : ''}
                    `}>
                      {['A', 'B', 'C', 'D'][idx]}
                    </span>
                    <span>{opt}</span>
                  </div>
                  
                  {isCorrect && <CheckCircle2 className="w-6 h-6 text-emerald-500" />}
                  {isWrong && <AlertCircle className="w-6 h-6 text-red-500" />}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-6 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-center items-center gap-8">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
          <span className="text-xs font-bold text-slate-500 uppercase">Trí tuệ</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
          <span className="text-xs font-bold text-slate-500 uppercase">Chính xác</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
          <span className="text-xs font-bold text-slate-500 uppercase">Tốc độ</span>
        </div>
      </div>
    </div>
  );
}
