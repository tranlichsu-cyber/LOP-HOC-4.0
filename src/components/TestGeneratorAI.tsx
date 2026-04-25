import React, { useState, useRef } from 'react';
import { Sparkles, Cpu, Loader2, Download, Bot, GraduationCap, ChevronRight, AlertCircle, FileText, Share2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { db, auth } from '../firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

const TEST_LEVELS = [
  { id: 'm1', label: 'Mức 1', description: 'Nhận biết, nhắc lại nội dung đã học (30-40%)' },
  { id: 'm2', label: 'Mức 2', description: 'Kết nối, sắp xếp để giải quyết vấn đề tương tự (30-40%)' },
  { id: 'm3', label: 'Mức 3', description: 'Vận dụng để giải quyết vấn đề mới (20-30%)' }
];

export default function TestGeneratorAI() {
  const [subject, setSubject] = useState('Toán');
  const [grade, setGrade] = useState('Lớp 3');
  const [testType, setTestType] = useState('Đánh giá định kỳ học kỳ I');
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(10);
  const [structure, setStructure] = useState({ m1: 4, m2: 4, m3: 2 });
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState('');
  const [activeTab, setActiveTab] = useState<'config' | 'result'>('config');

  const subjects = ["Toán", "Tiếng Việt", "Tiếng Anh", "Tự nhiên và Xã hội", "Lịch sử và Địa lí", "Khoa học", "Tin học"];
  const grades = ["Lớp 1", "Lớp 2", "Lớp 3", "Lớp 4", "Lớp 5"];
  const testTypes = ["Đánh giá thường xuyên", "Đánh giá định kỳ giữa học kỳ I", "Đánh giá định kỳ cuối học kỳ I", "Đánh giá định kỳ giữa học kỳ II", "Đánh giá định kỳ cuối năm học"];

  const generateTest = async () => {
    if (!topic.trim()) {
      alert("Vui lòng nhập chủ đề hoặc nội dung SGK");
      return;
    }

    setIsGenerating(true);
    setActiveTab('result');

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("API Key chưa được cấu hình. Vui lòng kiểm tra Settings.");
      }

      const ai = new GoogleGenAI({ apiKey });

      const prompt = `
        Bạn là một chuyên gia giáo dục tiểu học tại Việt Nam.
        Nhiệm vụ: Tạo một đề thi ${testType} cho môn ${subject}, ${grade}.
        
        QUAN TRỌNG: Nội dung đề thi PHẢI dựa hoàn toàn vào kiến thức trong Sách giáo khoa hiện hành cho chủ đề: ${topic}
        
        Cấu trúc đề thi gồm ${numQuestions} câu hỏi được phân bổ như sau:
        - Nhận biết (${structure.m1} câu): Nhắc lại hoặc mô tả được nội dung đã học.
        - Thông hiểu (${structure.m2} câu): Giải quyết vấn đề có nội dung tương tự SGK.
        - Vận dụng (${structure.m3} câu): Giải quyết vấn đề mới hoặc tình huống thực tế.

        Yêu cầu định dạng phản hồi:
        Sử dụng Markdown. Đề thi bao gồm:
        1. Tiêu đề đề thi (Trường, Lớp, Môn, Thời gian)
        2. Phần 1: Trắc nghiệm (nếu phù hợp môn học)
        3. Phần 2: Tự luận
        4. Đáp án và Thang điểm chi tiết cho từng câu, ghi rõ câu đó thuộc Mức nào.

        Lưu ý đặc biệt: Nội dung phải bám sát chương trình Giáo dục phổ thông 2018 và sách giáo khoa hiện hành.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts: [{ text: prompt }] },
      });
      
      const text = response.text || "AI không trả về kết quả. Vui lòng thử lại.";
      setResult(text);
    } catch (error: any) {
      console.error("AI Generation Error:", error);
      let errorMessage = error.message || String(error);
      
      const isQuota = errorMessage.includes('429') || errorMessage.toLowerCase().includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED');
      const isKeyError = errorMessage.includes('403') || errorMessage.toLowerCase().includes('api key') || errorMessage.includes('Key chưa được cấu hình');

      if (isQuota) {
        setResult("Hệ thống đang tạm thời quá tải hoặc bạn đã hết hạn mức sử dụng miễn phí hôm nay. Vui lòng thử lại sau 1-2 phút.");
      } else if (isKeyError) {
        setResult("LỖI CẤU HÌNH: Không tìm thấy API Key. \n\nCÁCH KHẮC PHỤC:\n1. Mở menu Settings (biểu tượng bánh răng).\n2. Đảm bảo mục GEMINI_API_KEY đã có giá trị.\n3. Nếu chưa có, hãy tạo tại https://aistudio.google.com/app/apikey.");
      } else {
        setResult("Có lỗi xảy ra khi tạo đề thi: " + errorMessage);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadDoc = async () => {
    if (!result) return;
    
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: `ĐỀ THI ${testType.toUpperCase()}`,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: `Môn: ${subject} - ${grade}`,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: "" }),
          ...result.split('\n').map(line => new Paragraph({
            children: [new TextRun(line.replace(/[*#]/g, ''))]
          }))
        ]
      }]
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `De_thi_${subject}_${grade}.docx`);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 overflow-hidden">
      <div className="flex items-center justify-between p-6 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
            <GraduationCap className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Tạo đề thi bằng AI</h2>
            <p className="text-sm text-slate-500">Dựa vào nội dung trong sách giáo khoa</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'config' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700'}`}
          >
            Cấu hình
          </button>
          <button 
            disabled={!result}
            onClick={() => setActiveTab('result')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'result' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 disabled:opacity-50'}`}
          >
            Kết quả
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto">
          {activeTab === 'config' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" /> Thông tin cơ bản
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Môn học</label>
                        <select 
                          value={subject} 
                          onChange={(e) => setSubject(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                          {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Khối lớp</label>
                        <select 
                          value={grade} 
                          onChange={(e) => setGrade(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                          {grades.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Loại bài kiểm tra</label>
                      <select 
                        value={testType} 
                        onChange={(e) => setTestType(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                        {testTypes.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Chủ đề / Nội dung bài học (theo SGK)</label>
                      <textarea 
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        rows={3}
                        placeholder="VD: Phép cộng trừ trong phạm vi 100, Ôn tập các bài tập đọc tuần 12..."
                        className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-white flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-indigo-600" /> Ma trận đề thi
                  </h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tổng số câu hỏi</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="range" min="5" max="30" step="1"
                          value={numQuestions}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setNumQuestions(val);
                            // Auto adjust distribution
                            setStructure({
                              m1: Math.floor(val * 0.4),
                              m2: Math.floor(val * 0.4),
                              m3: val - Math.floor(val * 0.4) * 2
                            });
                          }}
                          className="w-32 accent-indigo-600"
                        />
                        <span className="w-8 text-center font-bold text-indigo-600">{numQuestions}</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {TEST_LEVELS.map(level => (
                        <div key={level.id} className="p-3 border border-slate-100 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{level.label}</span>
                            <span className="text-sm font-bold text-indigo-600">{structure[level.id as keyof typeof structure]} câu</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mb-2">{level.description}</p>
                          <input 
                            type="range" min="0" max={numQuestions} step="1"
                            value={structure[level.id as keyof typeof structure]}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              setStructure({ ...structure, [level.id]: val });
                            }}
                            className="w-full h-1.5 accent-indigo-400 bg-slate-200 rounded-full appearance-none"
                          />
                        </div>
                      ))}
                    </div>

                    <button 
                      onClick={generateTest}
                      disabled={isGenerating}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2 group disabled:opacity-50"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" /> Đang soạn thảo...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 group-hover:scale-110 transition" /> Tạo đề thi ngay
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden flex flex-col h-[70vh]">
              <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-indigo-600" />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Đề thi gợi ý từ AI</span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleDownloadDoc}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg flex items-center gap-2 text-xs font-bold transition"
                  >
                    <Download className="w-4 h-4" /> Xuất file Word
                  </button>
                  <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-8 prose prose-slate dark:prose-invert max-w-none">
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center h-full space-y-4">
                    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                    <p className="text-slate-500 font-medium animate-pulse">AI đang phân tích ma trận và nội dung bài học...</p>
                  </div>
                ) : (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {result}
                  </ReactMarkdown>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
