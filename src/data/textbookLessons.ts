export interface LessonEntry {
  id: string;
  title: string;
  subject: string;
  grade: string;
}

export const TEXTBOOK_LESSONS: LessonEntry[] = [
  // LỚP 1 - TIẾNG VIỆT
  { id: 'v1-1', title: 'Bài 1: A a', subject: 'Tiếng Việt', grade: 'Lớp 1' },
  { id: 'v1-2', title: 'Bài 2: B b', subject: 'Tiếng Việt', grade: 'Lớp 1' },
  { id: 'v1-3', title: 'Bài 3: C c', subject: 'Tiếng Việt', grade: 'Lớp 1' },
  { id: 'v1-4', title: 'Bài 4: O o', subject: 'Tiếng Việt', grade: 'Lớp 1' },
  { id: 'v1-5', title: 'Bài 5: Ô ô', subject: 'Tiếng Việt', grade: 'Lớp 1' },
  
  // LỚP 1 - TOÁN
  { id: 't1-1', title: 'Bài 1: Các số 0, 1, 2, 3, 4, 5', subject: 'Toán', grade: 'Lớp 1' },
  { id: 't1-2', title: 'Bài 2: Các số 6, 7, 8, 9, 10', subject: 'Toán', grade: 'Lớp 1' },

  // LỚP 2 - TIẾNG VIỆT
  { id: 'v2-1', title: 'Bài 1: Tôi là học sinh lớp 2', subject: 'Tiếng Việt', grade: 'Lớp 2' },
  { id: 'v2-2', title: 'Bài 2: Ngày hôm qua đâu rồi?', subject: 'Tiếng Việt', grade: 'Lớp 2' },
  { id: 'v2-3', title: 'Bài 3: Niềm vui của Bi và Bống', subject: 'Tiếng Việt', grade: 'Lớp 2' },
  
  // LỚP 4 - LỊCH SỬ VÀ ĐỊA LÍ
  { id: 'ls4-1', title: 'Bài 1: Làm quen với phương tiện học tập môn Lịch sử và Địa lí', subject: 'Lịch sử và Địa lí', grade: 'Lớp 4' },
  { id: 'ls4-2', title: 'Bài 2: Thiên nhiên vùng Trung du và miền núi Bắc Bộ', subject: 'Lịch sử và Địa lí', grade: 'Lớp 4' },
  { id: 'ls4-3', title: 'Bài 3: Người dân và hoạt động sản xuất ở vùng Trung du và miền núi Bắc Bộ', subject: 'Lịch sử và Địa lí', grade: 'Lớp 4' },

  // LỚP 5 - TIẾNG VIỆT (CẬP NHẬT MỚI 2024)
  { id: 'v5-1', title: 'Bài 1: Từ vựng và thế giới quanh em', subject: 'Tiếng Việt', grade: 'Lớp 5' },
  { id: 'v5-2', title: 'Bài 2: Những trải nghiệm thú vị', subject: 'Tiếng Việt', grade: 'Lớp 5' },
  { id: 'v5-3', title: 'Bài 3: Khám phá kỳ quan thiên nhiên', subject: 'Tiếng Việt', grade: 'Lớp 5' },
  
  // LỚP 5 - TOÁN (CẬP NHẬT MỚI 2024)
  { id: 't5-1', title: 'Bài 1: Ôn tập về phân số', subject: 'Toán', grade: 'Lớp 5' },
  { id: 't5-2', title: 'Bài 2: Ôn tập về các phép tính với phân số', subject: 'Toán', grade: 'Lớp 5' },
  { id: 't5-3', title: 'Bài 3: Hỗn số', subject: 'Toán', grade: 'Lớp 5' },
  { id: 't5-4', title: 'Bài 4: Số thập phân', subject: 'Toán', grade: 'Lớp 5' }
];

export const findLessons = (search: string, grade?: string, subject?: string) => {
  if (!search) return [];
  const query = search.toLowerCase();
  return TEXTBOOK_LESSONS.filter(l => {
    const matchesTitle = l.title.toLowerCase().includes(query);
    const matchesGrade = !grade || l.grade === grade;
    const matchesSubject = !subject || l.subject === subject;
    return matchesTitle && matchesGrade && matchesSubject;
  }).slice(0, 10); // Trả về tối đa 10 gợi ý
};
