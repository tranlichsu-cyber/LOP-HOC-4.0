import React, { useState, useRef } from 'react';
import { ImagePlus, FileEdit, ScanText, Loader2, Download, Palette, Banana, Sparkles } from 'lucide-react';
import { db, auth } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { GoogleGenAI } from "@google/genai";
import html2canvas from 'html2canvas';
import mammoth from 'mammoth';
import { getVietnam34ProvincesContext } from '../data/vietnam34Provinces';
import { getTextbookContext } from '../data/textbookTNXH2';

export default function Worksheet() {
  const worksheetRef = useRef<HTMLDivElement>(null);
  const [fileName, setFileName] = useState('Kéo thả file vào đây');
  const [worksheetTitle, setWorksheetTitle] = useState('');
  const [subject, setSubject] = useState('Tiếng Việt');
  const [grade, setGrade] = useState('Lớp 3');
  const [content, setContent] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [isGeneratingAIImage, setIsGeneratingAIImage] = useState(false);
  const [aiImageUrl, setAiImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [theme, setTheme] = useState<'classic' | 'banana'>('banana');

  const commonWorksheetTitles = [
    "Phiếu ôn tập Toán cuối tuần",
    "Phiếu bài tập Tiếng Việt",
    "Phiếu kiểm tra Tiếng Anh",
    "Phiếu thực hành Tin học",
    "Phiếu trải nghiệm sáng tạo"
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFileName(selectedFile.name);
      setFile(selectedFile);
      setError('');
      
      // Create preview for images
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setFilePreview(event.target?.result as string);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleDownloadImage = async () => {
    if (!worksheetRef.current) return;
    setIsGeneratingImage(true);
    try {
      const canvas = await html2canvas(worksheetRef.current, {
        scale: 2, // Higher quality
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      canvas.toBlob((blob) => {
        if (!blob) {
          alert("Lỗi khi tạo ảnh phiếu bài tập!");
          setIsGeneratingImage(false);
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `${worksheetTitle || 'phieu-bai-tap'}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        setIsGeneratingImage(false);
      }, 'image/png', 1.0);
    } catch (e) {
      console.error("Error generating image:", e);
      alert("Lỗi khi tạo ảnh phiếu bài tập!");
      setIsGeneratingImage(false);
    }
  };

  const handleDownloadAIImage = async () => {
    if (!aiImageUrl) return;
    try {
      const response = await fetch(aiImageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${worksheetTitle || 'phieu-bai-tap-ai'}.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Error downloading AI image:", e);
      alert("Lỗi khi tải ảnh AI về máy!");
    }
  };

  const handleAIGenerate = async () => {
    if (!worksheetTitle.trim()) {
      alert("Vui lòng nhập tên phiếu bài tập để AI biết chủ đề!");
      return;
    }
    setIsGeneratingContent(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const isGeographyOrProvinces = subject.toLowerCase().includes('địa lí') || 
                                     subject.toLowerCase().includes('tự nhiên và xã hội') ||
                                     worksheetTitle.toLowerCase().includes('tỉnh') || 
                                     worksheetTitle.toLowerCase().includes('thành phố') ||
                                     worksheetTitle.toLowerCase().includes('sáp nhập') ||
                                     worksheetTitle.toLowerCase().includes('34');
      
      const isTNXH2 = subject.toLowerCase().includes('tự nhiên và xã hội') && grade.includes('2');
      
      const provinceContext = isGeographyOrProvinces ? `\n\nKIẾN THỨC NỀN TẢNG QUAN TRỌNG (Cập nhật mới nhất):\n${getVietnam34ProvincesContext()}\nHãy sử dụng thông tin trên nếu bài tập liên quan đến các tỉnh thành Việt Nam.` : '';
      const textbookContext = isTNXH2 ? `\n\nTHAM KHẢO NỘI DUNG SÁCH GIÁO KHOA (Kết nối tri thức):\n${getTextbookContext()}\nHãy bám sát khung chương trình này khi tạo nội dung.` : '';

      const prompt = `Bạn là một chuyên gia thiết kế phiếu bài tập tiểu học. 
      Hãy tạo nội dung cho phiếu bài tập: "${worksheetTitle}" cho môn ${subject}, ${grade}.${provinceContext}${textbookContext}
      Yêu cầu:
      1. Cấu trúc gồm 2 phần chính: 
         - I. Kiến thức cần nhớ (Tóm tắt ngắn gọn, dễ hiểu).
         - II. Bài tập (Gồm các bài tập trắc nghiệm và tự luận, có chỗ trống để học sinh làm bài).
      2. Nội dung phong phú, sáng tạo, phù hợp lứa tuổi.
      3. Sử dụng ngôn ngữ gần gũi, khích lệ học sinh.
      4. Trình bày rõ ràng, sạch sẽ.
      Chỉ trả về nội dung bài tập, không thêm lời dẫn.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts: [{ text: prompt }] }
      });
      setContent(response.text || "");
    } catch (e: any) {
      console.error("AI Generate error:", e);
      const msg = e.message || "";
      if (msg.includes('leaked')) {
        alert("LỖI BẢO MẬT: API Key của bạn đã bị lộ. Vui lòng cập nhật API Key mới trong phần Settings của AI Studio.");
      } else if (msg.includes('429') || msg.toLowerCase().includes('quota')) {
        alert("Hệ thống đang tạm thời quá tải hoặc bạn đã hết hạn mức sử dụng miễn phí trong hôm nay. Vui lòng thử lại sau 1-2 phút hoặc quay lại vào ngày mai.");
      } else {
        alert("Lỗi khi tạo nội dung bằng AI! " + msg);
      }
    }
    setIsGeneratingContent(false);
  };

  const handleAIGenerateImage = async () => {
    if (!worksheetTitle.trim()) {
      alert("Vui lòng nhập tên phiếu bài tập để AI biết chủ đề!");
      return;
    }
    setIsGeneratingAIImage(true);
    setAiImageUrl(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Create a high-quality, colorful, and cute educational worksheet for Vietnamese primary school students. 
      Title: "${worksheetTitle}"
      Subject: ${subject}, Grade: ${grade}
      Content to include: ${content || "General exercises for this topic"}
      Style: NaNo Banana 2 style, kawaii, pastel colors (soft pink, blue, yellow, green), rounded containers, cute icons (smiling stars, clouds, books, pencils, globes). 
      Layout: Structured with clear sections like 'I. Kiến thức cần nhớ' and 'II. Bài tập', decorative borders with educational icons. 
      Language: Vietnamese. The text should be clear and legible. 
      Overall vibe: Fun, engaging, and professional for kids. Like a high-end educational poster.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: {
          imageConfig: {
            aspectRatio: "3:4",
          }
        }
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64 = part.inlineData.data;
          setAiImageUrl(`data:image/png;base64,${base64}`);
          break;
        }
      }
    } catch (e: any) {
      console.error("AI Image Generate error:", e);
      const msg = e.message || "";
      if (msg.includes('leaked')) {
        alert("LỖI BẢO MẬT: API Key của bạn đã bị lộ. Vui lòng cập nhật API Key mới trong phần Settings của AI Studio.");
      } else if (msg.includes('429') || msg.toLowerCase().includes('quota')) {
        alert("Hệ thống đã hết hạn mức tạo ảnh miễn phí cho hôm nay (Quota Exceeded). Vui lòng thử lại vào ngày mai hoặc sử dụng API Key có trả phí.");
      } else {
        alert("Lỗi khi tạo ảnh bằng NaNo Banana 2. Vui lòng thử lại sau. " + msg);
      }
    }
    setIsGeneratingAIImage(false);
  };

  const handleAIExtract = async () => {
    if (!file) {
      alert("Vui lòng tải lên file hoặc ảnh trước!");
      return;
    }
    setIsExtracting(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      if (file.name.endsWith('.docx')) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const arrayBuffer = event.target?.result as ArrayBuffer;
            const result = await mammoth.extractRawText({ arrayBuffer });
            const extractedText = result.value;
            
            // Send extracted text to AI to format it nicely as a worksheet
            const response = await ai.models.generateContent({
              model: "gemini-3-flash-preview",
              contents: {
                parts: [
                  { text: "Dưới đây là nội dung trích xuất từ một tài liệu. Hãy phân tích, chắt lọc các kiến thức TRỌNG TÂM nhất và thiết kế lại thành một phiếu bài tập hoàn chỉnh. Cấu trúc gồm:\nI. Kiến thức trọng tâm (tóm tắt ngắn gọn, súc tích).\nII. Bài tập thực hành (bám sát nội dung trọng tâm vừa nêu).\nTrình bày sạch sẽ, rõ ràng. Chỉ trả về nội dung phiếu bài tập, không thêm lời dẫn." },
                  { text: extractedText }
                ]
              }
            });
            setContent(response.text || "");
          } catch (err) {
            console.error("Mammoth error:", err);
            alert("Không thể đọc file Word này. Vui lòng thử lại.");
          } finally {
            setIsExtracting(false);
          }
        };
        reader.readAsArrayBuffer(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const base64 = (event.target?.result as string).split(',')[1];
          const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: {
              parts: [
                { text: "Hãy phân tích hình ảnh/tài liệu này, chắt lọc các kiến thức TRỌNG TÂM nhất và thiết kế lại thành một phiếu bài tập hoàn chỉnh. Cấu trúc gồm:\nI. Kiến thức trọng tâm (tóm tắt ngắn gọn, súc tích).\nII. Bài tập thực hành (bám sát nội dung trọng tâm vừa nêu).\nTrình bày sạch sẽ, rõ ràng. Chỉ trả về nội dung phiếu bài tập, không thêm lời dẫn." },
                {
                  inlineData: {
                    mimeType: file.type,
                    data: base64
                  }
                }
              ]
            }
          });
          setContent(response.text || "");
        } catch (e: any) {
          console.error("AI Extract inner error:", e);
          const msg = e.message || "";
          if (msg.includes('leaked')) {
            alert("LỖI BẢO MẬT: API Key của bạn đã bị lộ. Vui lòng cập nhật API Key mới trong phần Settings của AI Studio.");
          } else if (msg.includes('429') || msg.toLowerCase().includes('quota')) {
            alert("Hệ thống đang tạm thời quá tải hoặc bạn đã hết hạn mức sử dụng miễn phí. Vui lòng thử lại sau.");
          } else {
            alert("Lỗi khi trích xuất dữ liệu! " + msg);
          }
        } finally {
          setIsExtracting(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (e: any) {
      console.error("AI Extract error:", e);
      const msg = e.message || "";
      if (msg.includes('leaked')) {
        alert("LỖI BẢO MẬT: API Key của bạn đã bị lộ. Vui lòng cập nhật API Key mới trong phần Settings của AI Studio.");
      } else {
        alert("Lỗi khi trích xuất dữ liệu! " + msg);
      }
      setIsExtracting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col h-full transition-colors">
      <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center shrink-0">
        <div>
          <h3 className="font-bold text-lg text-slate-800 dark:text-white">Thiết kế Phiếu học tập</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Tạo phiếu bài tập từ file Word, ảnh hoặc tự soạn thảo</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleDownloadImage}
            disabled={isGeneratingImage}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 font-bold transition shadow-sm disabled:opacity-50"
          >
            {isGeneratingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Tải ảnh (PNG)
          </button>
          <button 
            onClick={() => setTheme(theme === 'classic' ? 'banana' : 'classic')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 font-bold transition shadow-sm ${theme === 'banana' ? 'bg-yellow-400 text-slate-900 hover:bg-yellow-500' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
          >
            <Palette className="w-4 h-4" />
            {theme === 'banana' ? 'Chế độ NaNo Banana' : 'Chế độ Cổ điển'}
          </button>
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/3 border-r border-slate-200 dark:border-slate-700 p-6 overflow-y-auto bg-white dark:bg-slate-800 transition-colors">
          <div className="space-y-5">
            <div className="relative">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Tên phiếu bài tập</label>
              <input 
                type="text" 
                placeholder="VD: Phiếu ôn tập Toán cuối tuần 5" 
                value={worksheetTitle}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onChange={e => {
                  setWorksheetTitle(e.target.value);
                  if (error) setError('');
                }}
                className={`w-full p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg outline-none transition dark:text-white ${error ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-slate-600 focus:border-pink-500'}`} 
              />
              {error && <p className="text-red-500 text-[10px] mt-1">{error}</p>}
              
              {showSuggestions && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden">
                  {commonWorksheetTitles
                    .filter(t => t.toLowerCase().includes(worksheetTitle.toLowerCase()))
                    .map((suggestion, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setWorksheetTitle(suggestion);
                          setShowSuggestions(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-pink-50 dark:hover:bg-pink-900/30 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Môn học</label>
                <select 
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-pink-500 dark:text-white transition"
                >
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
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Lớp</label>
                <select 
                  value={grade}
                  onChange={e => setGrade(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-pink-500 dark:text-white transition"
                >
                  <option>Lớp 1</option>
                  <option>Lớp 2</option>
                  <option>Lớp 3</option>
                  <option>Lớp 4</option>
                  <option>Lớp 5</option>
                </select>
              </div>
            </div>
            
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Tải lên tài liệu gốc (Word / Ảnh)</label>
              <input 
                type="file" 
                id="file-worksheet" 
                className="hidden" 
                accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.webp" 
                onChange={handleFileUpload} 
              />
              <label 
                htmlFor="file-worksheet"
                className="block border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer bg-slate-50/50 dark:bg-slate-900/50 overflow-hidden"
              >
                {filePreview ? (
                  <div className="relative group">
                    <img src={filePreview} alt="Preview" className="mx-auto max-h-32 rounded-lg shadow-sm" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-white text-xs font-bold">Thay đổi ảnh</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <ImagePlus className="mx-auto text-slate-400 dark:text-slate-500 w-8 h-8 mb-2" />
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate px-2">{fileName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Hỗ trợ: .docx, .png, .jpg, .pdf</p>
                  </>
                )}
                <div className="mt-4 px-4 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded shadow-sm text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-pink-600 transition inline-block">
                  {file ? 'Chọn file khác' : 'Chọn file tải lên'}
                </div>
              </label>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Trợ lý AI</label>
              <div className="grid grid-cols-1 gap-2">
                <button 
                  onClick={handleAIGenerate}
                  disabled={isGeneratingContent}
                  className="w-full bg-pink-600 hover:bg-pink-700 text-white font-medium py-2.5 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isGeneratingContent ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Tạo nội dung bằng AI
                </button>
                <button 
                  onClick={handleAIGenerateImage}
                  disabled={isGeneratingAIImage}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2.5 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isGeneratingAIImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Banana className="w-4 h-4" />}
                  Tạo phiếu ảnh AI (NaNo Banana 2)
                </button>
                <button 
                  onClick={handleAIExtract}
                  disabled={isExtracting}
                  className="w-full bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white font-medium py-2.5 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isExtracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanText className="w-4 h-4" />}
                  Trích xuất chữ từ Ảnh/File
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="w-2/3 bg-slate-200/60 dark:bg-slate-900/60 p-8 overflow-y-auto flex justify-center transition-colors">
          <div 
            ref={worksheetRef}
            className={`w-full max-w-2xl min-h-[842px] shadow-md border p-10 flex flex-col transition-all duration-500 ${
              theme === 'banana' 
                ? 'bg-white border-yellow-300 relative overflow-hidden' 
                : 'bg-white border-slate-200'
            }`}
          >
            {theme === 'banana' && (
              <>
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 via-green-400 to-yellow-400" />
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-100 rounded-full opacity-50 blur-2xl" />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-green-100 rounded-full opacity-50 blur-2xl" />
                <Banana className="absolute top-4 right-4 text-yellow-500/20 w-12 h-12 rotate-12" />
              </>
            )}

            <div className={`text-center mb-8 border-b pb-6 ${theme === 'banana' ? 'border-yellow-200' : 'border-slate-200'}`}>
              <h2 className={`text-3xl font-black uppercase tracking-widest ${theme === 'banana' ? 'text-yellow-600' : 'text-slate-800'}`}>
                {theme === 'banana' ? '🍌 PHIẾU BÀI TẬP NaNo Banana 🍌' : 'PHIẾU BÀI TẬP'}
              </h2>
              <div className={`flex justify-between mt-6 text-sm font-bold ${theme === 'banana' ? 'text-green-700' : 'text-slate-600'}`}>
                <p className="border-b-2 border-dotted border-slate-300 pb-1 flex-1 mr-4 text-left">Họ và tên: ..............................................................</p>
                <p className="border-b-2 border-dotted border-slate-300 pb-1 w-32 text-left">Lớp: .........................</p>
              </div>
              <div className="mt-2 text-left">
                <p className={`text-xs font-bold ${theme === 'banana' ? 'text-yellow-600' : 'text-slate-400'}`}>
                  Môn: {subject} | {grade} | Ngày: {new Date().toLocaleDateString('vi-VN')}
                </p>
              </div>
            </div>

            <div 
              className={`flex-1 flex flex-col rounded-xl overflow-y-auto p-8 transition-all relative ${
                theme === 'banana' 
                  ? 'bg-white border-[12px] border-yellow-100' 
                  : 'bg-white border-2 border-dashed border-slate-200'
              }`}
            >
              {theme === 'banana' && (
                <>
                  <div className="absolute top-2 left-2 text-yellow-400 opacity-50"><Banana className="w-8 h-8 rotate-12" /></div>
                  <div className="absolute top-2 right-2 text-pink-400 opacity-50"><Sparkles className="w-8 h-8" /></div>
                  <div className="absolute bottom-2 left-2 text-blue-400 opacity-50"><ImagePlus className="w-8 h-8" /></div>
                  <div className="absolute bottom-2 right-2 text-emerald-400 opacity-50"><FileEdit className="w-8 h-8" /></div>
                </>
              )}

              {aiImageUrl ? (
                <div className="w-full h-full flex items-center justify-center bg-slate-100 rounded-lg overflow-hidden relative group">
                  <img 
                    src={aiImageUrl} 
                    alt="AI Generated Worksheet" 
                    className="max-w-full max-h-full object-contain shadow-2xl"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <button 
                      onClick={() => setAiImageUrl(null)}
                      className="px-4 py-2 bg-white text-slate-900 rounded-lg font-bold hover:bg-slate-100 transition"
                    >
                      Quay lại soạn thảo
                    </button>
                    <button 
                      onClick={handleDownloadAIImage}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" /> Tải ảnh về
                    </button>
                  </div>
                </div>
              ) : content ? (
                <div 
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => setContent(e.currentTarget.innerText)}
                  className={`w-full h-full outline-none bg-transparent font-times text-xl leading-relaxed whitespace-pre-wrap text-left z-10 ${
                    theme === 'banana' ? 'text-slate-800' : 'text-slate-800'
                  }`}
                >
                  {content}
                </div>
              ) : (
                <div className="text-center">
                  <FileEdit className={`w-16 h-16 mb-4 mx-auto ${theme === 'banana' ? 'text-yellow-400' : 'text-slate-300'}`} />
                  <p className="font-bold text-slate-500">Nội dung phiếu bài tập sẽ hiển thị tại đây</p>
                  <p className="text-sm text-slate-400 mt-2">Sử dụng Trợ lý AI hoặc tự soạn thảo nội dung</p>
                </div>
              )}
            </div>

            {theme === 'banana' && (
              <div className="mt-6 flex justify-between items-center text-[10px] font-bold text-yellow-600/50 uppercase tracking-widest">
                <span>EduPro - NaNo Banana 2.0</span>
                <span>Học mà chơi - Chơi mà học</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
