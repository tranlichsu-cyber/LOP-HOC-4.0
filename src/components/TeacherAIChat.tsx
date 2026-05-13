import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, User, Loader2, Trash2, X, MessageSquare, Sparkles } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function TeacherAIChat() {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('teacher_ai_messages');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('teacher_ai_messages', JSON.stringify(messages));
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const history = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: "Bạn là một trợ lý AI dành cho giáo viên Việt Nam. Bạn giúp giáo viên soạn giáo án, quản lý lớp học, giải đáp thắc mắc chuyên môn, và gợi ý các trò chơi giáo dục. Hãy trả lời bằng tiếng Việt một cách chuyên nghiệp, tận tâm và thân thiện.",
        },
        history: history as any,
      });

      const result = await chat.sendMessage({ message: input });
      const aiResponse = result.text;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse || "Xin lỗi, tôi không thể trả lời lúc này.",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("AI Error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Đã xảy ra lỗi khi kết nối với AI. Vui lòng kiểm tra lại cấu hình API key của bạn.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    if (confirm("Bạn có chắc muốn xóa lịch sử trò chuyện?")) {
      setMessages([]);
      localStorage.removeItem('teacher_ai_messages');
    }
  };

  const deleteMessage = (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Trợ lý Giáo viên AI</h3>
            <p className="text-xs text-indigo-100">Luôn sẵn sàng hỗ trợ bạn</p>
          </div>
        </div>
        <button 
          onClick={clearChat}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-indigo-100 hover:text-white"
          title="Xóa lịch sử"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth bg-slate-50/50 dark:bg-slate-950/20"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-10 space-y-4">
            <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 animate-bounce">
              <Sparkles className="w-10 h-10" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Chào mừng Thầy/Cô!</h4>
              <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                Tôi có thể giúp bạn soạn giáo án, đặt câu hỏi kiểm tra, hoặc gợi ý hoạt động lớp học. Hãy thử hỏi tôi điều gì đó!
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {['Soạn giáo án môn Toán lớp 3', 'Gợi ý trò chơi khởi động', 'Cách quản lý học sinh cá biệt'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => { setInput(suggestion); }}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-sm text-slate-600 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} group/msg`}
            >
              <div className={`flex gap-3 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center shadow-sm ${
                  message.role === 'user' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-white dark:bg-slate-800 text-purple-600 border border-slate-100 dark:border-slate-700'
                }`}>
                  {message.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>
                <div className={`p-5 rounded-[2rem] shadow-sm relative group ${
                  message.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-700'
                }`}>
                  {/* Individual Delete Button */}
                  <button
                    onClick={() => deleteMessage(message.id)}
                    className={`absolute top-2 ${message.role === 'user' ? 'left-2' : 'right-2'} p-2 rounded-full bg-slate-100/10 hover:bg-slate-100/20 opacity-0 group-hover/msg:opacity-100 transition-all text-current`}
                    title="Xóa tin nhắn này"
                  >
                    <X className="w-3 h-3" />
                  </button>

                  <div className="prose prose-base dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:text-white prose-headings:text-indigo-600 dark:prose-headings:text-indigo-400">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                  <p className="text-[10px] mt-2 opacity-50 font-medium">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[85%]">
              <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 text-purple-600 border border-slate-100 dark:border-slate-700 flex items-center justify-center shadow-sm">
                <Bot className="w-5 h-5 animate-pulse" />
              </div>
              <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                <span className="text-sm text-slate-500 animate-pulse font-medium">Đang suy nghĩ...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form 
        onSubmit={handleSend}
        className="p-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800"
      >
        <div className="relative group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Đặt câu hỏi cho AI..."
            disabled={isLoading}
            className="w-full pl-6 pr-14 py-4 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 transition-all dark:text-white"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-2 bottom-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-50 disabled:bg-slate-300 dark:disabled:bg-slate-800 transition-all flex items-center justify-center"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
        <p className="mt-3 text-[10px] text-center text-slate-400 font-medium">
          AI có thể mắc sai sót. Vui lòng kiểm tra lại thông tin quan trọng.
        </p>
      </form>
    </div>
  );
}
