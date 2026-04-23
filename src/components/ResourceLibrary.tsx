import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Upload, 
  BookOpen, 
  Play, 
  Presentation, 
  FileQuestion, 
  FlaskConical, 
  GraduationCap, 
  Download, 
  Share2, 
  MoreVertical,
  Plus,
  Users,
  ChevronRight,
  Globe,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { DigitalResource, ResourceType, UserProfile, Department } from '../types';

interface ResourceLibraryProps {
  userProfile: UserProfile;
}

const RESOURCE_TYPES: { type: ResourceType; label: string; icon: React.ReactNode; color: string }[] = [
  { type: 'lesson_plan', label: 'Giáo án', icon: <FileText className="w-4 h-4" />, color: 'text-blue-500' },
  { type: 'exam', label: 'Đề thi', icon: <GraduationCap className="w-4 h-4" />, color: 'text-red-500' },
  { type: 'question_bank', label: 'Ngân hàng câu hỏi', icon: <FileQuestion className="w-4 h-4" />, color: 'text-purple-500' },
  { type: 'powerpoint', label: 'Bài giảng PPT', icon: <Presentation className="w-4 h-4" />, color: 'text-orange-500' },
  { type: 'video', label: 'Video bài giảng', icon: <Play className="w-4 h-4" />, color: 'text-emerald-500' },
  { type: 'stem', label: 'Học liệu STEM', icon: <FlaskConical className="w-4 h-4" />, color: 'text-cyan-500' },
  { type: 'review_material', label: 'Tài liệu ôn tập', icon: <BookOpen className="w-4 h-4" />, color: 'text-pink-500' },
];

export default function ResourceLibrary({ userProfile }: ResourceLibraryProps) {
  const [resources, setResources] = useState<DigitalResource[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [activeType, setActiveType] = useState<ResourceType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newResource, setNewResource] = useState<Partial<DigitalResource>>({
    type: 'lesson_plan',
    isPublic: true,
    subject: 'Tiếng Việt',
    grade: 'Lớp 3'
  });

  useEffect(() => {
    fetchResources();
    fetchDepartments();
  }, [userProfile.schoolId, activeType, selectedGrade, selectedSubject]);

  const fetchResources = async () => {
    if (!userProfile.schoolId) return;
    setIsLoading(true);
    try {
      let q = query(
        collection(db, 'schools', userProfile.schoolId, 'resources')
      );
      
      const querySnapshot = await getDocs(q);
      const fetchedResources = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DigitalResource[];
      
      // Client-side filtering for simplicity in this demo environment
      let filtered = fetchedResources;
      if (activeType !== 'all') filtered = filtered.filter(r => r.type === activeType);
      if (selectedGrade !== 'all') filtered = filtered.filter(r => r.grade === selectedGrade);
      if (selectedSubject !== 'all') filtered = filtered.filter(r => r.subject === selectedSubject);
      if (searchQuery) {
        filtered = filtered.filter(r => 
          r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.authorName.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      setResources(filtered);
    } catch (error) {
      console.error("Error fetching resources:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDepartments = async () => {
    if (!userProfile.schoolId) return;
    try {
      const q = query(collection(db, 'schools', userProfile.schoolId, 'departments'));
      const querySnapshot = await getDocs(q);
      setDepartments(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Department[]);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const handleUpload = async () => {
    if (!newResource.title || !userProfile.schoolId) return;
    
    try {
      const resourceData = {
        ...newResource,
        authorId: userProfile.uid,
        authorName: userProfile.displayName || 'Giáo viên',
        schoolId: userProfile.schoolId,
        createdAt: new Date().toISOString(),
        downloads: 0
      };
      
      await addDoc(collection(db, 'schools', userProfile.schoolId, 'resources'), resourceData);
      setShowUploadModal(false);
      fetchResources();
    } catch (error) {
      console.error("Error uploading resource:", error);
    }
  };

  const filteredResources = resources; // Already filtered in fetchResources effect for this demo

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <BookOpen className="text-indigo-600 w-7 h-7" /> Kho Học Liệu Số
          </h2>
          <p className="text-slate-500 text-sm mt-1">Lưu trữ và chia sẻ học liệu toàn trường chuẩn CTGDPT 2018</p>
        </div>
        <button 
          onClick={() => setShowUploadModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
        >
          <Upload className="w-5 h-5" /> Tải lên học liệu
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Tìm kiếm giáo án, tài liệu, bài giảng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-400 dark:text-white transition-colors"
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select 
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-sm dark:text-white outline-none"
          >
            <option value="all">Tất cả Khối</option>
            <option value="Lớp 1">Lớp 1</option>
            <option value="Lớp 2">Lớp 2</option>
            <option value="Lớp 3">Lớp 3</option>
            <option value="Lớp 4">Lớp 4</option>
            <option value="Lớp 5">Lớp 5</option>
          </select>

          <select 
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-sm dark:text-white outline-none"
          >
            <option value="all">Tất cả Môn</option>
            <option value="Tiếng Việt">Tiếng Việt</option>
            <option value="Toán">Toán</option>
            <option value="Tiếng Anh">Tiếng Anh</option>
            <option value="Tự nhiên & Xã hội">TN & XH</option>
          </select>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden">
        {/* Left Sidebar: Types & Departments */}
        <div className="w-full lg:w-64 space-y-6 shrink-0">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Loại học liệu</h3>
            <div className="space-y-1">
              <button 
                onClick={() => setActiveType('all')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition ${activeType === 'all' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'}`}
              >
                <span className="flex items-center gap-2"><Globe className="w-4 h-4" /> Tất cả</span>
                <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-full">{resources.length}</span>
              </button>
              {RESOURCE_TYPES.map(item => (
                <button 
                  key={item.type}
                  onClick={() => setActiveType(item.type)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition ${activeType === item.type ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'}`}
                >
                  <span className="flex items-center gap-2">{item.icon} {item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Tổ chuyên môn</h3>
            <div className="space-y-2">
              {departments.length === 0 ? (
                <p className="text-[10px] text-slate-400 text-center py-2 italic font-medium">Chưa có tổ chuyên môn</p>
              ) : (
                departments.map(dept => (
                  <button 
                    key={dept.id}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 group"
                  >
                    <Users className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
                    <span className="truncate">{dept.name}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Resources Grid */}
        <div className="flex-1 overflow-y-auto pr-2">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white dark:bg-slate-800 h-48 rounded-2xl border border-slate-200 dark:border-slate-700 animate-pulse" />
              ))}
            </div>
          ) : resources.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 mt-10">
              <BookOpen className="w-12 h-12 mb-4 opacity-20" />
              <p className="font-medium">Không tìm thấy tài liệu nào</p>
              <button 
                onClick={() => setShowUploadModal(true)}
                className="mt-4 text-indigo-600 text-sm font-bold flex items-center gap-1 hover:underline"
              >
                <Plus className="w-4 h-4" /> Bắt đầu xây dựng tài liệu đầu tiên
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-10">
              {resources.map(resource => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={resource.id}
                  className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm hover:shadow-md transition group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2 rounded-xl bg-slate-50 dark:bg-slate-900 ${RESOURCE_TYPES.find(t => t.type === resource.type)?.color || 'text-slate-500'}`}>
                      {RESOURCE_TYPES.find(t => t.type === resource.type)?.icon || <FileText className="w-5 h-5" />}
                    </div>
                    <button className="text-slate-400 hover:text-slate-600 p-1">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <h4 className="font-bold text-slate-800 dark:text-white line-clamp-2 mb-2 group-hover:text-indigo-600 transition-colors">
                    {resource.title}
                  </h4>
                  
                  <div className="flex items-center gap-2 text-[10px] mb-4">
                    <span className="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full font-bold">{resource.subject}</span>
                    <span className="bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full font-bold">{resource.grade}</span>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                        {resource.authorName.charAt(0)}
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">{resource.authorName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition">
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition">
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUploadModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative z-10"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Upload className="text-indigo-600" /> Tải lên tài liệu mới
                </h3>
                <button onClick={() => setShowUploadModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tên tài liệu / Tiêu đề</label>
                  <input 
                    type="text"
                    value={newResource.title || ''}
                    onChange={(e) => setNewResource({...newResource, title: e.target.value})}
                    placeholder="VD: Giáo án Tiếng Việt Lớp 3 Tuần 24..."
                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Loại tài liệu</label>
                    <select 
                      value={newResource.type}
                      onChange={(e) => setNewResource({...newResource, type: e.target.value as ResourceType})}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none dark:text-white"
                    >
                      {RESOURCE_TYPES.map(t => <option key={t.type} value={t.type}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Khối lớp</label>
                    <select 
                      value={newResource.grade}
                      onChange={(e) => setNewResource({...newResource, grade: e.target.value})}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none dark:text-white"
                    >
                      <option>Lớp 1</option>
                      <option>Lớp 2</option>
                      <option>Lớp 3</option>
                      <option>Lớp 4</option>
                      <option>Lớp 5</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Môn học</label>
                  <select 
                    value={newResource.subject}
                    onChange={(e) => setNewResource({...newResource, subject: e.target.value})}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none dark:text-white"
                  >
                    <option>Tiếng Việt</option>
                    <option>Toán</option>
                    <option>Tiếng Anh</option>
                    <option>Tự nhiên & Xã hội</option>
                    <option>Lịch sử & Địa lí</option>
                    <option>Tin học</option>
                  </select>
                </div>

                <div className="flex items-center gap-4 py-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={newResource.isPublic}
                      onChange={(e) => setNewResource({...newResource, isPublic: e.target.checked})}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Chia sẻ toàn trường</span>
                  </label>
                </div>

                <button 
                  onClick={handleUpload}
                  disabled={!newResource.title}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition shadow-lg shadow-indigo-100 dark:shadow-none"
                >
                  Xác nhận tải lên
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
