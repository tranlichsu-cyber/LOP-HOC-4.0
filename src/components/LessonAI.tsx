import React, { useState, useRef } from 'react';
import { Sparkles, Cpu, Loader2, Bot, Download, Upload, FileCheck, X, Eye } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import mammoth from 'mammoth';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { db, auth } from '../firebase';
import { getVietnam34ProvincesContext } from '../data/vietnam34Provinces';
import { getTextbookContext } from '../data/textbookTNXH2';
import { getKetNoiTriThucContext } from '../data/ketNoiTriThucContext';
import { getNLSContext } from '../data/nlsContext';
import { getTextbookUpdates } from '../data/textbookUpdates';
import { findLessons, LessonEntry } from '../data/textbookLessons';

export default function LessonAI() {
  const [subject, setSubject] = useState('Tiếng Việt');
  const [grade, setGrade] = useState('Lớp 3');
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState<number | string>(1);
  const [extraPrompt, setExtraPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [result, setResult] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [fileText, setFileText] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<LessonEntry[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic lesson suggestions from textbook database
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTitle(value);
    if (errors.title) setErrors({...errors, title: ''});
    
    if (value.trim()) {
      const g = grade === "Không chọn" ? undefined : grade;
      const s = subject === "Không chọn" ? undefined : subject;
      const found = findLessons(value, g, s);
      setSuggestions(found);
      setShowSuggestions(found.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectLesson = (lesson: LessonEntry) => {
    setTitle(lesson.title);
    setGrade(lesson.grade);
    setSubject(lesson.subject);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const validate = () => {
    if (file) return true; // Skip validation if file is uploaded
    
    const newErrors: Record<string, string> = {};
    if (grade === "Không chọn") newErrors.grade = "Vui lòng chọn lớp";
    if (subject === "Không chọn") newErrors.subject = "Vui lòng chọn môn học";
    if (!title.trim()) newErrors.title = "Vui lòng nhập tên bài dạy";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setIsProcessingFile(true);
      setFile(selectedFile);
      
      // Create preview for images
      if (selectedFile.type.startsWith('image/')) {
        const readerPreview = new FileReader();
        readerPreview.onload = (event) => {
          setFilePreview(event.target?.result as string);
        };
        readerPreview.readAsDataURL(selectedFile);
      } else {
        setFilePreview(null);
      }
      
      const cleanup = () => setIsProcessingFile(false);

      try {
        if (selectedFile.name.endsWith('.docx')) {
          const reader = new FileReader();
          reader.onload = async (event) => {
            try {
              const arrayBuffer = event.target?.result as ArrayBuffer;
              const result = await mammoth.extractRawText({ arrayBuffer });
              setFileText(result.value);
              setFileBase64(null);
            } catch (err) {
              console.error("Mammoth error:", err);
              alert("Không thể đọc file Word này. Vui lòng thử lại hoặc chuyển sang PDF.");
            } finally {
              cleanup();
            }
          };
          reader.onerror = () => {
            alert("Lỗi đọc file.");
            cleanup();
          };
          reader.readAsArrayBuffer(selectedFile);
        } else if (selectedFile.type.startsWith('text/')) {
          const reader = new FileReader();
          reader.onload = (event) => {
            setFileText(event.target?.result as string);
            setFileBase64(null);
            cleanup();
          };
          reader.onerror = () => {
            alert("Lỗi đọc file.");
            cleanup();
          };
          reader.readAsText(selectedFile);
        } else {
          // PDF or Images
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = event.target?.result as string;
            setFileBase64(base64.split(',')[1]);
            setFileText(null);
            cleanup();
          };
          reader.onerror = () => {
            alert("Lỗi đọc file.");
            cleanup();
          };
          reader.readAsDataURL(selectedFile);
        }
      } catch (err) {
        console.error("File processing error:", err);
        cleanup();
      }
    }
  };

  const removeFile = () => {
    setFile(null);
    setFilePreview(null);
    setFileBase64(null);
    setFileText(null);
    setShowPreview(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadDocx = async () => {
    if (!result) return;
    setIsDownloading(true);
    const selectedTheme = { primary: '#1e40af', secondary: '#3b82f6' };
    
    try {
      const docChildren: any[] = [];

      // Add Title Page / Header
      docChildren.push(new Paragraph({
        children: [
          new TextRun({
            text: title.toUpperCase() || "KẾ HOẠCH BÀI DẠY",
            bold: true,
            size: 32,
            color: selectedTheme.primary.replace('#', ''),
            font: "Times New Roman"
          }),
        ],
        alignment: "center",
        spacing: { after: 300, line: 276 },
      }));

      const lines = result.split('\n');
      let currentTableRows: any[] = [];
      let inTable = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.startsWith('|') && line.includes('|')) {
          if (line.includes('---')) {
            inTable = true;
            continue;
          }

          const actualCells = line.startsWith('|') ? line.slice(1, -1).split('|') : line.split('|');

          currentTableRows.push(
            new TableRow({
              children: actualCells.map((cellText, idx) => 
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  shading: i === 0 || (inTable && currentTableRows.length === 0) ? { fill: selectedTheme.secondary.replace('#', ''), color: "auto" } : undefined,
                  children: [new Paragraph({ 
                    children: [new TextRun({ 
                      text: cellText.trim(), 
                      size: 24,
                      color: i === 0 || (inTable && currentTableRows.length === 0) ? "FFFFFF" : "000000",
                      font: "Times New Roman"
                    })],
                    spacing: { line: 276, before: 100, after: 100 }
                  })],
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1, color: selectedTheme.primary.replace('#', '') },
                    bottom: { style: BorderStyle.SINGLE, size: 1, color: selectedTheme.primary.replace('#', '') },
                    left: { style: BorderStyle.SINGLE, size: 1, color: selectedTheme.primary.replace('#', '') },
                    right: { style: BorderStyle.SINGLE, size: 1, color: selectedTheme.primary.replace('#', '') },
                  }
                })
              ),
            })
          );
          inTable = true;
        } else {
          if (inTable && currentTableRows.length > 0) {
            docChildren.push(new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: currentTableRows,
            }));
            currentTableRows = [];
            inTable = false;
          }
          
          if (line) {
            const isHeader = /^(I|II|III|IV)\./.test(line);
            const isSubHeader = /^(Hoạt động|Mục tiêu|Nội dung|Sản phẩm|Tổ chức)/.test(line);
            
            docChildren.push(new Paragraph({
              children: [
                new TextRun({
                  text: line,
                  bold: isHeader || isSubHeader,
                  size: isHeader ? 28 : 24,
                  color: isHeader ? selectedTheme.primary.replace('#', '') : "000000",
                  font: "Times New Roman"
                }),
              ],
              spacing: { 
                before: isHeader ? 200 : (isSubHeader ? 100 : 0), 
                after: isHeader ? 100 : 0, 
                line: 276 
              },
            }));
          } else {
            // Optional: Only add a small space for empty lines to avoid double-gaps
            docChildren.push(new Paragraph({ spacing: { after: 60, line: 276 } }));
          }
        }
      }

      // Final table if exists
      if (currentTableRows.length > 0) {
        docChildren.push(new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: currentTableRows,
        }));
      }

      const doc = new Document({
        sections: [{
          properties: {},
          children: docChildren,
        }],
      });

      const blob = await Packer.toBlob(doc);
      const fileName = `Giao_an_${title.replace(/\s+/g, '_') || 'AI'}.docx`;
      saveAs(blob, fileName);
    } catch (error) {
      console.error("Download error:", error);
      alert("Có lỗi xảy ra khi tải file. Vui lòng thử lại.");
    } finally {
      setIsDownloading(false);
    }
  };

  const generateLesson = async () => {
    if (!validate()) {
      alert("Vui lòng điền đầy đủ thông tin: Lớp, Môn học và Tên bài học.");
      return;
    }
    
    setIsGenerating(true);
    setResult('');
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const isGeographyOrProvinces = subject.toLowerCase().includes('địa lí') || 
                                     subject.toLowerCase().includes('tự nhiên và xã hội') ||
                                     title.toLowerCase().includes('tỉnh') || 
                                     title.toLowerCase().includes('thành phố') ||
                                     title.toLowerCase().includes('sáp nhập') ||
                                     title.toLowerCase().includes('34');
      
      const isTNXH2 = subject.toLowerCase().includes('tự nhiên và xã hội') && grade.includes('2');
      const isGrade5 = grade.includes('5');
      
      const provinceContext = isGeographyOrProvinces ? `\n\nKIẾN THỨC NỀN TẢNG QUAN TRỌNG (Cập nhật mới nhất):\n${getVietnam34ProvincesContext()}\nHãy sử dụng thông tin trên nếu bài học liên quan đến các tỉnh thành Việt Nam.` : '';
      const textbookContext = isTNXH2 ? `\n\nTHAM KHẢO NỘI DUNG SÁCH GIÁO KHOA (Kết nối tri thức):\n${getTextbookContext()}\nHãy bám sát khung chương trình này khi soạn bài.` : '';
      const textbookUpdatesContent = getTextbookUpdates(grade, subject);
      const textbookUpdatesContext = textbookUpdatesContent ? `\n\nTHÔNG TIN ĐÍNH CHÍNH VÀ CẬP NHẬT SÁCH GIÁO KHOA (Bộ Kết nối tri thức):\n${textbookUpdatesContent}\nBẮT BUỘC: Bạn PHẢI TUÂN THỦ các đính chính này. Nếu nội dung trong bản cũ hoặc kiến thức cũ mâu thuẫn với đính chính này, bạn phải sử dụng thông tin đính chính.` : '';
      const ketNoiTriThucContext = `\n\nKIẾN THỨC BỘ SÁCH KẾT NỐI TRI THỨC VỚI CUỘC SỐNG:\n${getKetNoiTriThucContext()}\nĐây là kim chỉ nam cho phương pháp và nội dung dạy học.`;
      const nlsDetailedContext = `\n\nDANH MỤC MÃ CHỈ BÁO NĂNG LỰC SỐ (CV 3456):\n${getNLSContext()}\nQUY TẮC: Khi lồng ghép NLS, phải ghi đúng định dạng "Mã : Nội dung" (Ví dụ: 1.1.CB1a : Xác định được nhu cầu thông tin...).`;

      const promptTemplate = `Bạn là một chuyên gia sư phạm cấp tiểu học xuất sắc tại Việt Nam, am hiểu sâu sắc Chương trình Giáo dục Phổ thông 2018 (CTGDPT 2018) và bộ sách "Kết nối tri thức với cuộc sống". Bạn cũng nắm vững các văn bản quy phạm pháp luật sau:
1. Công văn 2345/BGDĐT-GDTH: Hướng dẫn xây dựng kế hoạch giáo dục nhà trường và Kế hoạch bài dạy (giáo án).
2. Thông tư 08/2024/TT-BGDĐT: Hướng dẫn lồng ghép nội dung giáo dục quốc phòng và an ninh.
3. Thông tư 02/2025/TT-BGDĐT & Công văn 3456/BGDĐT-GDPT: Khung năng lực số (NLS) cho người học.
4. Quyết định 3439/QĐ-BGDĐT: Khung nội dung thí điểm giáo dục Trí tuệ nhân tạo (AI).

Nhiệm vụ: ${fileText || fileBase64 ? 'CẬP NHẬT VÀ LỒNG GHÉP NỘI DUNG VÀO GIÁO ÁN CÓ SẴN.' : `Hãy soạn kế hoạch bài dạy (Giáo án) theo CTGDPT 2018 cho bài học: ${title} - Môn: ${subject} - Lớp: ${grade}. ${duration ? `Số tiết: ${duration}.` : ''}`} ${provinceContext}${textbookContext}${textbookUpdatesContext}${ketNoiTriThucContext}${nlsDetailedContext}

${fileText || fileBase64 ? `QUAN TRỌNG: Bạn đang được cung cấp một bản giáo án cũ. 
YÊU CẦU BẮT BUỘC: 
- GIỮ NGUYÊN HOÀN TOÀN TỪNG CÂU CHỮ, NỘI DUNG VÀ BỐ CỤC (layout) của giáo án cũ. KHÔNG được tóm tắt, không được thay đổi từ ngữ vốn có.
- CHỈ ĐƯỢC PHÉP CHÈN THÊM (lồng ghép) các nội dung mới (Năng lực số, AI, An ninh quốc phòng) vào các vị trí phù hợp.
- Nội dung lồng ghép phải được trình bày tự nhiên, không làm gãy mạch logic của giáo án cũ.` : ''}

YÊU CẦU QUAN TRỌNG:
- BÁM SÁT CTGDPT 2018: Phải đảm bảo các yêu cầu cần đạt (YCCĐ) theo đúng khung chương trình mới.
- BÁM SÁT VÀ KHAI THÁC SÂU SGK: Nội dung bài dạy phải đi sâu vào các chi tiết, tình huống và kiến thức trong SGK đã cung cấp.
- TRÌNH BÀY KHOA HỌC: Các bước thực hiện rõ ràng, mạch lạc.
- TƯƠNG TÁC HÀI HÒA & CÓ CÂU DẪN: Hoạt động của giáo viên phải bao gồm các câu hỏi gợi mở, lời giảng chi tiết (câu dẫn cụ thể). Hoạt động của học sinh phải có câu trả lời dự kiến cụ thể. Đảm bảo các hoạt động giữa Giáo viên và Học sinh diễn ra cân đối, hài hòa về khối lượng công việc.
- Đảm bảo đủ 4 bước Tổ chức thực hiện trong mỗi hoạt động: Chuyển giao nhiệm vụ -> Thực hiện nhiệm vụ -> Báo cáo, thảo luận -> Kết luận, nhận định.

Yêu cầu về cấu trúc đầu ra (Chuẩn CV 2345):
I. YÊU CẦU CẦN ĐẠT
- Năng lực đặc thù: Đúng chuẩn môn học.
- Năng lực chung: Tự chủ/tự học, Giao tiếp/hợp tác, Giải quyết vấn đề/sáng tạo.
- Phẩm chất: Yêu nước, Nhân ái, Chăm chỉ, Trung thực, Trách nhiệm.
- Yêu cầu cần đạt về NLS và AI: (Nếu có lồng ghép).

II. ĐỒ DÙNG DẠY HỌC
- Giáo viên: Thiết bị số, học liệu điện tử, phần mềm AI...
- Học sinh: SGK, vở, vật liệu thực hành.

III. CÁC HOẠT ĐỘNG DẠY HỌC CHỦ YẾU
(BẮT BUỘC: Sử dụng bảng Markdown 2 cột cho phần tổ chức thực hiện. Các cột phải có khối lượng nội dung tương đương nhau để đảm bảo tính cân đối: | Hoạt động của giáo viên | Hoạt động của học sinh |)

Yêu cầu lồng ghép (Tích hợp tự nhiên):
- An ninh quốc phòng (TT 08/2024).
- Năng lực số (TT 02/2025).
- Giáo dục AI (QĐ 3439).

LƯU Ý ĐỊNH DẠNG: 
- CẤM TUYỆT ĐỐI SỬ DỤNG KÝ HIỆU ** (DẤU SAO ĐÔI).
- KHÔNG dùng thẻ HTML.
- Sử dụng bảng Markdown khi cần chia cột.`;

      const contents: any[] = [{ text: promptTemplate }];
      
      if (fileText) {
        contents.push({ text: `ĐÂY LÀ NỘI DUNG GIÁO ÁN GỐC CẦN GIỮ NGUYÊN: \n\n ${fileText}` });
      } else if (file && fileBase64) {
        contents.push({
          inlineData: {
            mimeType: file.type,
            data: fileBase64
          }
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts: contents },
      });

      let text = response.text || "AI không trả về kết quả. Vui lòng thử lại.";
      
      // Clean up unwanted characters like <br> and technical symbols like .*
      text = text.replace(/<br\s*\/?>/gi, '\n');
      text = text.replace(/\.\*/g, '');
      
      setResult(text);
    } catch (error: any) {
      console.error("Gemini Error:", error);
      let errorMessage = error.message || String(error);
      
      // Try to parse if it's a JSON string from the API
      try {
        if (errorMessage.includes('{')) {
          const jsonStart = errorMessage.indexOf('{');
          const jsonStr = errorMessage.substring(jsonStart);
          const parsed = JSON.parse(jsonStr);
          if (parsed.error && parsed.error.message) {
            errorMessage = parsed.error.message;
          }
        }
      } catch (e) {
        // Not a valid JSON or parsing failed, keep original message
      }
      
      const isLeaked = errorMessage.toLowerCase().includes('leaked');
      const isQuota = errorMessage.includes('429') || errorMessage.toLowerCase().includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED');
      
      if (isQuota) {
        setResult("Hệ thống đang tạm thời quá tải hoặc bạn đã hết hạn mức sử dụng miễn phí trong hôm nay. \n\nVui lòng thử lại sau 1-2 phút hoặc quay lại vào ngày mai. Nếu bạn đang tải lên file giáo án quá lớn, hãy thử chia nhỏ nội dung để AI xử lý tốt hơn.");
      } else if (isLeaked || errorMessage.includes('403')) {
        setResult(`LỖI BẢO MẬT/TRUY CẬP: ${errorMessage}\n\nCÁCH KHẮC PHỤC:\n1. Truy cập https://aistudio.google.com/app/apikey để tạo API Key mới.\n2. Mở menu 'Settings' (biểu tượng bánh răng) trong AI Studio.\n3. Cập nhật API Key mới vào mục 'GEMINI_API_KEY'.\n4. Tải lại trang và thử lại.`);
      } else {
        setResult("LỖI KẾT NỐI GEMINI: " + errorMessage);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      <div className="w-full lg:w-1/3 space-y-6 flex flex-col h-full overflow-y-auto pr-2">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm shrink-0">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800 dark:text-white">
            <Cpu className="text-indigo-600 w-5 h-5" /> Trợ lý Soạn giáo án AI
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Lớp {file && <span className="text-[10px] text-slate-400 font-normal">(Tùy chọn)</span>}</label>
                <select 
                  value={grade} 
                  onChange={(e) => {
                    setGrade(e.target.value);
                    if (errors.grade) setErrors({...errors, grade: ''});
                  }}
                  className={`w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg outline-none transition-colors dark:text-white ${errors.grade ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-slate-600 focus:border-purple-400'}`}
                >
                  <option>Không chọn</option>
                  <option>Lớp 1</option>
                  <option>Lớp 2</option>
                  <option>Lớp 3</option>
                  <option>Lớp 4</option>
                  <option>Lớp 5</option>
                </select>
                {errors.grade && <p className="text-red-500 text-[10px] mt-1">{errors.grade}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Môn học {file && <span className="text-[10px] text-slate-400 font-normal">(Tùy chọn)</span>}</label>
                <select 
                  value={subject} 
                  onChange={(e) => {
                    setSubject(e.target.value);
                    if (errors.subject) setErrors({...errors, subject: ''});
                  }}
                  className={`w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg outline-none transition-colors dark:text-white ${errors.subject ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-slate-600 focus:border-purple-400'}`}
                >
                  <option>Không chọn</option>
                  <option>Tiếng Việt</option>
                  <option>Toán</option>
                  <option>Ngoại ngữ 1 (Tiếng Anh)</option>
                  <option>Đạo đức</option>
                  <option>Tự nhiên và Xã hội</option>
                  <option>Lịch sử và Địa lí</option>
                  <option>Khoa học</option>
                  <option>Tin học</option>
                  <option>Công nghệ</option>
                  <option>Giáo dục thể chất</option>
                  <option>Hoạt động trải nghiệm</option>
                </select>
                {errors.subject && <p className="text-red-500 text-[10px] mt-1">{errors.subject}</p>}
              </div>
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tên bài dạy {file && <span className="text-[10px] text-slate-400 font-normal">(Tùy chọn)</span>}</label>
              <input 
                type="text" 
                value={title} 
                onFocus={() => {
                  if (title.trim()) {
                    const g = grade === "Không chọn" ? undefined : grade;
                    const s = subject === "Không chọn" ? undefined : subject;
                    const found = findLessons(title, g, s);
                    setSuggestions(found);
                    setShowSuggestions(found.length > 0);
                  }
                }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onChange={handleTitleChange}
                className={`w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg outline-none transition-colors dark:text-white ${errors.title ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-slate-600 focus:border-purple-400'}`}
                placeholder="Nhập tên bài dạy (ví dụ: Ôn tập các số đến 10)..."
              />
              {errors.title && <p className="text-red-500 text-[10px] mt-1">{errors.title}</p>}
              
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                  <div className="p-2 bg-slate-50 dark:bg-slate-900 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-100 dark:border-slate-700">Mục lục sách Kết nối tri thức</div>
                  {suggestions.map((lesson) => (
                    <button
                      key={lesson.id}
                      type="button"
                      onClick={() => selectLesson(lesson)}
                      className="w-full text-left px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors border-b border-slate-50 dark:border-slate-700 last:border-0 group"
                    >
                      <div className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 transition-colors">{lesson.title}</div>
                      <div className="text-[10px] text-slate-500 flex gap-2 mt-0.5">
                        <span className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{lesson.grade}</span>
                        <span className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{lesson.subject}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tiết số</label>
              <input 
                type="number" 
                min="1" 
                value={duration} 
                onChange={(e) => {
                  const val = e.target.value;
                  setDuration(val === '' ? '' : parseInt(val));
                }}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-purple-400 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col flex-1 min-h-[300px]">
          <div className="mb-4 relative">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
              <Upload className="w-4 h-4 text-blue-500" /> Tải lên giáo án cũ để lồng ghép (Tùy chọn)
            </label>
            {!file ? (
              <label 
                htmlFor="lesson-file-input"
                className={`border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition block overflow-hidden ${isProcessingFile ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isProcessingFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                    <p className="text-xs text-slate-500">Đang xử lý file...</p>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-slate-500">Hỗ trợ PDF, Word (.docx), Ảnh, Text...</p>
                    <p className="text-[10px] text-slate-400 mt-1">(Kéo thả hoặc bấm để chọn)</p>
                  </>
                )}
                <input 
                  type="file" 
                  id="lesson-file-input"
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept=".pdf,.docx,.txt,image/*"
                />
              </label>
            ) : (
              <div className="space-y-2">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl flex items-center justify-between border border-blue-100 dark:border-blue-800">
                  <div className="flex items-center gap-2 overflow-hidden">
                    {filePreview ? (
                      <img src={filePreview} alt="Preview" className="w-8 h-8 rounded object-cover shadow-sm" />
                    ) : (
                      <FileCheck className="w-4 h-4 text-blue-600 shrink-0" />
                    )}
                    <span className="text-xs font-medium text-blue-800 dark:text-blue-300 truncate">{file.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {fileText && (
                      <button 
                        onClick={() => setShowPreview(!showPreview)} 
                        className="p-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-full text-blue-600"
                        title="Xem trước nội dung"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={removeFile} className="p-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-full text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {showPreview && fileText && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] max-h-32 overflow-y-auto font-mono text-slate-600 dark:text-slate-400">
                    {fileText}
                  </div>
                )}
              </div>
            )}
          </div>

          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Yêu cầu thêm cho AI</label>
          <textarea 
            value={extraPrompt} 
            onChange={(e) => setExtraPrompt(e.target.value)}
            className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg outline-none h-20 resize-none text-sm mb-4 focus:border-purple-400 dark:text-white" 
            placeholder="Ví dụ: Tập trung vào hoạt động trải nghiệm thực tế..."
          />

          <button 
            onClick={generateLesson} 
            disabled={isGenerating || isProcessingFile}
            className="w-full mt-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black py-4 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 disabled:opacity-50 active:scale-95"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            Tạo giáo án bằng AI
          </button>
        </div>
      </div>

      <div className="w-full lg:w-2/3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col overflow-hidden h-full">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <h3 className="font-bold text-slate-700 dark:text-slate-300">Kết quả soạn thảo</h3>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={downloadDocx}
              disabled={!result || isDownloading}
              className="px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg flex items-center gap-2 font-black transition-all disabled:opacity-50 active:scale-95"
            >
              {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Tải .docx
            </button>
          </div>
        </div>
        <div className="flex-1 relative overflow-hidden">
          <div className="w-full h-full p-8 font-times text-slate-800 dark:text-slate-200 text-lg leading-relaxed absolute inset-0 z-10 bg-transparent overflow-y-auto prose dark:prose-invert max-w-none prose-table:border prose-table:border-slate-300 dark:prose-table:border-slate-700 prose-th:border prose-th:border-slate-300 dark:prose-th:border-slate-700 prose-td:border prose-td:border-slate-300 dark:prose-td:border-slate-700 prose-td:p-2 prose-th:p-2 prose-th:bg-slate-100 dark:prose-th:bg-slate-800">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {result}
            </ReactMarkdown>
          </div>
          
          {!result && !isGenerating && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 z-0 bg-white dark:bg-slate-800 transition-colors">
              <Bot className="w-16 h-16 mb-4 opacity-50 text-emerald-500" />
              <p className="font-medium text-slate-500 dark:text-slate-400">Hệ thống đã kết nối Gemini AI</p>
              <p className="text-sm mt-2 max-w-sm text-center">Chỉ cần bấm nút, AI sẽ thiết kế toàn bộ tiến trình học tập chuẩn mực nhất theo Công văn 2345.</p>
            </div>
          )}

          {isGenerating && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-slate-800/80 z-20 backdrop-blur-sm">
              <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
              <p className="font-bold text-purple-700 dark:text-purple-400">Đang soạn giáo án...</p>
              <p className="text-sm text-slate-500 mt-2">Vui lòng đợi trong giây lát</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
