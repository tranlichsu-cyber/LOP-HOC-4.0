import React, { useState } from 'react';
import { Sparkles, Cpu, FileText, Loader2, Bot, Download, FileCheck, Save } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

export default function Worksheet() {
  const [subject, setSubject] = useState('Tiếng Việt');
  const [grade, setGrade] = useState('Lớp 3');
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [result, setResult] = useState('');

  const generateWorksheet = async () => {
    if (!title.trim() || !topic.trim()) {
      alert("Vui lòng điền đầy đủ Tên phiếu và Chủ đề kiến thức.");
      return;
    }
    
    setIsGenerating(true);
    setResult('');
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const promptTemplate = `Bạn là một chuyên gia thiết kế học liệu tiểu học. Hãy thiết kế một PHIẾU BÀI TẬP (Worksheet) cho:
Tên phiếu: ${title}
Môn học: ${subject}
Lớp: ${grade}
Chủ đề kiến thức: ${topic}

YÊU CẦU CẤU TRÚC PHIẾU:
1. Phần Tiêu đề: Đẹp mắt, chuyên nghiệp.
2. Phần Thông tin: Họ và tên, Lớp.
3. Phần I: Kiến thức cần nhớ (Tóm tắt ngắn gọn các quy tắc, công thức hoặc lý thuyết trọng tâm).
4. Phần II: Bài tập thực hành. Phải bao gồm các dạng:
   - Trắc nghiệm (ít nhất 3 câu).
   - Điền vào chỗ trống hoặc Nối.
   - Bài tập tự luận hoặc Giải toán có lời văn (ít nhất 2 bài).
5. Phần III: Thử thách/Vận dụng (Câu hỏi nâng cao nhẹ).

LƯU Ý: 
- Trình bày rõ ràng, dễ hiểu cho học sinh tiểu học.
- Sử dụng ngôn ngữ gần gũi, khích lệ.
- CẤM TUYỆT ĐỐI SỬ DỤNG KÝ HIỆU ** (DẤU SAO ĐÔI).
- Sử dụng bảng Markdown cho các phần cần kẻ khung.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts: [{ text: promptTemplate }] },
      });

      setResult(response.text || "AI không trả về kết quả.");
    } catch (error: any) {
      console.error("Gemini Error:", error);
      setResult("LỖI KẾT NỐI GEMINI: " + (error.message || String(error)));
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadDocx = async () => {
    if (!result) return;
    setIsDownloading(true);
    
    try {
      const docChildren: any[] = [];
      
      // Header
      docChildren.push(new Paragraph({
        children: [new TextRun({ text: title.toUpperCase(), bold: true, size: 32, font: "Times New Roman" })],
        alignment: "center",
        spacing: { after: 300 }
      }));

      docChildren.push(new Paragraph({
        children: [new TextRun({ text: "Họ và tên: ........................................................... Lớp: .................", size: 24, font: "Times New Roman" })],
        spacing: { after: 300 }
      }));

      const lines = result.split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        const isHeader = /^(PHẦN|I|II|III|IV)\./.test(line);
        docChildren.push(new Paragraph({
          children: [new TextRun({ text: line, bold: isHeader, size: isHeader ? 28 : 24, font: "Times New Roman" })],
          spacing: { after: 120, line: 276 }
        }));
      }

      const doc = new Document({
        sections: [{ children: docChildren }]
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `Phieu_bai_tap_${title.replace(/\s+/g, '_')}.docx`);
    } catch (error) {
      console.error("Download error:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      <div className="w-full lg:w-1/3 space-y-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800 dark:text-white">
            <Cpu className="text-pink-600 w-5 h-5" /> Trợ lý Tạo phiếu học tập
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Lớp</label>
                <select 
                  value={grade} 
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-pink-400 dark:text-white"
                >
                  <option>Lớp 1</option>
                  <option>Lớp 2</option>
                  <option>Lớp 3</option>
                  <option>Lớp 4</option>
                  <option>Lớp 5</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Môn học</label>
                <select 
                  value={subject} 
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-pink-400 dark:text-white"
                >
                  <option>Tiếng Việt</option>
                  <option>Toán</option>
                  <option>Tự nhiên và Xã hội</option>
                  <option>Lịch sử và Địa lí</option>
                  <option>Khoa học</option>
                  <option>Tin học</option>
                  <option>Tiếng Anh</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tên phiếu</label>
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-pink-400 dark:text-white"
                placeholder="Ví dụ: Phiếu ôn tập cuối tuần 20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Chủ đề kiến thức</label>
              <textarea 
                value={topic} 
                onChange={(e) => setTopic(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg outline-none h-32 resize-none text-sm focus:border-pink-400 dark:text-white" 
                placeholder="Ví dụ: Phép nhân 2 chữ số, các đoạn văn miêu tả cây cối..."
              />
            </div>

            <button 
              onClick={generateWorksheet} 
              disabled={isGenerating}
              className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              Tạo phiếu bằng AI
            </button>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-2/3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col overflow-hidden h-full">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-slate-700 dark:text-slate-300">Nội dung phiếu học tập</h3>
          <button 
            onClick={downloadDocx}
            disabled={!result || isDownloading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm font-medium transition disabled:opacity-50"
          >
            {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Tải File Word
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-8 font-times text-slate-800 dark:text-slate-200 text-lg leading-relaxed relative">
          {result ? (
            <div className="prose dark:prose-invert max-w-none prose-table:border prose-table:border-slate-300 dark:prose-table:border-slate-700 prose-td:border prose-td:border-slate-300 dark:prose-td:border-slate-700 prose-td:p-2 prose-th:p-2">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {result}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
              <FileText className="w-16 h-16 mb-4" />
              <p>Nội dung phiếu bài tập sẽ hiển thị tại đây</p>
            </div>
          )}
          
          {isGenerating && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-slate-800/80 z-20 backdrop-blur-sm">
              <Loader2 className="w-12 h-12 text-pink-600 animate-spin mb-4" />
              <p className="font-bold text-pink-700 dark:text-pink-400">Đang thiết kế phiếu học tập...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
