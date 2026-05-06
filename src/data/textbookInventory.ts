export interface TextbookInfo {
  grade: number;
  subject: string;
  series: string;
  description: string;
}

export const getFullTextbookInventory = (): TextbookInfo[] => {
  return [
    // Lớp 1
    { grade: 1, subject: "Tiếng Việt", series: "Kết nối tri thức với cuộc sống", description: "Làm quen với âm, vần và các kỹ năng đọc viết cơ bản." },
    { grade: 1, subject: "Toán", series: "Kết nối tri thức với cuộc sống", description: "Các số trong phạm vi 100, phép cộng trừ không nhớ, hình học cơ bản." },
    { grade: 1, subject: "Tự nhiên và Xã hội", series: "Kết nối tri thức với cuộc sống", description: "Khám phá bản thân, gia đình và môi trường xung quanh." },
    { grade: 1, subject: "Đạo đức", series: "Kết nối tri thức với cuộc sống", description: "Hình thành các thói quen tốt và kỹ năng sống cơ bản." },
    { grade: 1, subject: "Âm nhạc", series: "Kết nối tri thức với cuộc sống", description: "Làm quen với nhịp điệu và các bài hát thiếu nhi." },
    { grade: 1, subject: "Mĩ thuật", series: "Kết nối tri thức với cuộc sống", description: "Sử dụng màu sắc và hình khối đơn giản." },
    { grade: 1, subject: "Hoạt động trải nghiệm", series: "Kết nối tri thức với cuộc sống", description: "Tham gia các hoạt động tập thể và phát triển cá nhân." },
    { grade: 1, subject: "Giáo dục thể chất", series: "Kết nối tri thức với cuộc sống", description: "Rèn luyện thể lực và tư thế cơ bản." },

    // Lớp 2
    { grade: 2, subject: "Tiếng Việt", series: "Kết nối tri thức với cuộc sống", description: "Phát triển kỹ năng đọc hiểu và viết đoạn văn ngắn." },
    { grade: 2, subject: "Toán", series: "Kết nối tri thức với cuộc sống", description: "Phép cộng trừ có nhớ trong phạm vi 100, nhân chia cơ bản (bảng 2, 5)." },
    { grade: 2, subject: "Tự nhiên và Xã hội", series: "Kết nối tri thức với cuộc sống", description: "Tìm hiểu về cộng đồng, thực vật và động vật." },
    { grade: 2, subject: "Đạo đức", series: "Kết nối tri thức với cuộc sống", description: "Bồi dưỡng lòng nhân ái và trách nhiệm." },
    { grade: 2, subject: "Âm nhạc", series: "Kết nối tri thức với cuộc sống", description: "Hát và nghe nhạc theo chủ đề." },
    { grade: 2, subject: "Mĩ thuật", series: "Kết nối tri thức với cuộc sống", description: "Tạo hình và trang trí cơ bản." },
    { grade: 2, subject: "Hoạt động trải nghiệm", series: "Kết nối tri thức với cuộc sống", description: "Trải nghiệm thực tế về gia đình và nhà trường." },
    { grade: 2, subject: "Giáo dục thể chất", series: "Kết nối tri thức với cuộc sống", description: "Các bài tập phối hợp và trò chơi vận động." },

    // Lớp 3
    { grade: 3, subject: "Tiếng Việt", series: "Kết nối tri thức với cuộc sống", description: "Mở rộng vốn từ và kỹ năng viết văn miêu tả, kể chuyện." },
    { grade: 3, subject: "Toán", series: "Kết nối tri thức với cuộc sống", description: "Các bảng nhân chia còn lại, làm quen với số có 5 chữ số." },
    { grade: 3, subject: "Tự nhiên và Xã hội", series: "Kết nối tri thức với cuộc sống", description: "Chủ đề về cơ thể người, di tích lịch sử và văn hóa." },
    { grade: 3, subject: "Tin học", series: "Kết nối tri thức với cuộc sống", description: "Làm quen với máy tính và sử dụng internet an toàn." },
    { grade: 3, subject: "Công nghệ", series: "Kết nối tri thức với cuộc sống", description: "Tìm hiểu về các sản phẩm công nghệ trong gia đình." },
    { grade: 3, subject: "Đạo đức", series: "Kết nối tri thức với cuộc sống", description: "Xây dựng các mối quan hệ bạn bè và cộng đồng." },
    { grade: 3, subject: "Âm nhạc", series: "Kết nối tri thức với cuộc sống", description: "Học hát và chơi một số nhạc cụ gõ." },
    { grade: 3, subject: "Mĩ thuật", series: "Kết nối tri thức với cuộc sống", description: "Khám phá các chất liệu nghệ thuật khác nhau." },
    { grade: 3, subject: "Hoạt động trải nghiệm", series: "Kết nối tri thức với cuộc sống", description: "Phát triển năng lực thích ứng với cuộc sống." },

    // Lớp 4
    { grade: 4, subject: "Tiếng Việt", series: "Kết nối tri thức với cuộc sống", description: "Phân tích văn bản và viết các loại bài văn phức tạp hơn." },
    { grade: 4, subject: "Toán", series: "Kết nối tri thức với cuộc sống", description: "Số tự nhiên lớn, phân số, các phép tính với phân số." },
    { grade: 4, subject: "Khoa học", series: "Kết nối tri thức với cuộc sống", description: "Nghiên cứu về chất, năng lượng, thực vật và động vật." },
    { grade: 4, subject: "Lịch sử và Địa lí", series: "Kết nối tri thức với cuộc sống", description: "Lịch sử dựng nước và giữ nước, địa lý các vùng miền Việt Nam." },
    { grade: 4, subject: "Tin học", series: "Kết nối tri thức với cuộc sống", description: "Lập trình kéo thả cơ bản, xử lý văn bản." },
    { grade: 4, subject: "Công nghệ", series: "Kết nối tri thức với cuộc sống", description: "Thiết kế kỹ thuật đơn giản và lắp ráp mô hình." },
    { grade: 4, subject: "Đạo đức", series: "Kết nối tri thức với cuộc sống", description: "Ý thức pháp luật và lòng yêu nước." },
    { grade: 4, subject: "Âm nhạc", series: "Kết nối tri thức với cuộc sống", description: "Cảm thụ âm nhạc và hợp xướng đơn giản." },
    { grade: 4, subject: "Mĩ thuật", series: "Kết nối tri thức với cuộc sống", description: "Ứng dụng mĩ thuật vào đời sống." },
    { grade: 4, subject: "Hoạt động trải nghiệm", series: "Kết nối tri thức với cuộc sống", description: "Hoạt động xã hội và phục vụ cộng đồng." },

    // Lớp 5
    { grade: 5, subject: "Tiếng Việt", series: "Kết nối tri thức với cuộc sống", description: "Hoàn thiện kỹ năng ngôn ngữ tiểu học, chuẩn bị lên cấp 2." },
    { grade: 5, subject: "Toán", series: "Kết nối tri thức với cuộc sống", description: "Số thập phân, hình học phẳng và khối, giải toán chuyển động." },
    { grade: 5, subject: "Khoa học", series: "Kết nối tri thức với cuộc sống", description: "Sự biến đổi của chất, năng lượng tái tạo, bảo vệ môi trường." },
    { grade: 5, subject: "Lịch sử và Địa lí", series: "Kết nối tri thức với cuộc sống", description: "Lịch sử hiện đại, địa lý thế giới và biển đảo Việt Nam." },
    { grade: 5, subject: "Tin học", series: "Kết nối tri thức với cuộc sống", description: "Lập trình trò chơi, tìm kiếm và chọn lọc thông tin." },
    { grade: 5, subject: "Công nghệ", series: "Kết nối tri thức với cuộc sống", description: "Công nghệ số, thiết kế và chế tạo sản phẩm sáng tạo." },
    { grade: 5, subject: "Đạo đức", series: "Kết nối tri thức với cuộc sống", description: "Giá trị bản thân và công dân toàn cầu." },
    { grade: 5, subject: "Âm nhạc", series: "Kết nối tri thức với cuộc sống", description: "Biểu diễn và sáng tạo âm nhạc theo nhóm." },
    { grade: 5, subject: "Mĩ thuật", series: "Kết nối tri thức với cuộc sống", description: "Sáng tạo nghệ thuật dựa trên di sản văn hóa." },
    { grade: 5, subject: "Hoạt động trải nghiệm", series: "Kết nối tri thức với cuộc sống", description: "Hướng nghiệp sớm và rèn luyện bản lĩnh." }
  ];
};
