export const getTextbookUpdates = (grade: string, subject: string) => {
  const allUpdates: Record<string, Record<string, string>> = {
    "Lớp 1": {
      "Tiếng Việt": `
BỔ SUNG CẬP NHẬT TIẾNG VIỆT 1 (KẾT NỐI TRI THỨC)
- Trang 71: Thay thế hình ảnh minh họa cho âm "p" để học sinh dễ nhận diện hơn.
- Trang 95: Đính chính cách viết hoa một số danh từ riêng theo quy định mới của Bộ GD&ĐT.
- Trang 158: Điều chỉnh một số từ ngữ trong bài tập đọc để phù hợp với đặc điểm ngôn ngữ vùng miền.
`,
      "Toán": `
BỔ SUNG CẬP NHẬT TOÁN 1 (KẾT NỐI TRI THỨC)
- Trang 42: Chỉnh sửa lại đề bài phần luyện tập về các số trong phạm vi 20.
- Trang 88: Cập nhật hình ảnh đồng hồ thực tế để học sinh xem giờ dễ hơn.
`
    },
    "Lớp 2": {
      "Tiếng Việt": `
BỔ SUNG CẬP NHẬT TIẾNG VIỆT 2 (KẾT NỐI TRI THỨC)
- Trang 133: Cập nhật tên một số địa danh du lịch nổi tiếng (ví dụ: Vịnh Hạ Long, Hội An).
- Trang 145: "huyện đảo" -> "thành phố đảo Phú Quốc".
`,
      "Toán": `
BỔ SUNG CẬP NHẬT TOÁN 2 (KẾT NỐI TRI THỨC)
- Trang 10: Đính chính đơn vị đo lường trong bài toán về độ dài.
- Trang 65: Bổ sung thêm các ví dụ về hình khối trong thực tế.
`
    },
    "Lớp 3": {
      "Tự nhiên và Xã hội": `
BỔ SUNG CẬP NHẬT TỰ NHIÊN VÀ XÃ HỘI 3 (KẾT NỐI TRI THỨC)
- Chương 2: Cập nhật các thông tin về di tích lịch sử tại một số địa phương sau khi được xếp hạng lại.
- Trang 90: Điều chỉnh sơ đồ về các bộ phận của cơ thể người.
`,
      "Toán": `
BỔ SUNG CẬP NHẬT TOÁN 3 (KẾT NỐI TRI THỨC)
- Trang 25: Chỉnh sửa số liệu trong bài toán về dân số.
- Trang 112: Cập nhật tỷ giá (giả định) trong bài toán về tiền Việt Nam.
`
    },
    "Lớp 4": {
      "Lịch sử và Địa lí": `
BỔ SUNG CẬP NHẬT LỊCH SỬ VÀ ĐỊA LÍ 4 (KẾT NỐI TRI THỨC)
- Trang 18: Cập nhật ranh giới hành chính các tỉnh miền Bắc sau sáp nhập các đơn vị cấp huyện, xã.
- Trang 55: Điều chỉnh thông tin về các dân tộc thiểu số tại khu vực Trung du và miền núi Bắc Bộ.
`,
      "Khoa học": `
BỔ SUNG CẬP NHẬT KHOA HỌC 4 (KẾT NỐI TRI THỨC)
- Trang 45: Cập nhật phân loại các nhóm chất dinh dưỡng theo hướng dẫn mới của Bộ Y tế.
- Trang 120: Điều chỉnh sơ đồ vòng tuần hoàn của nước trong tự nhiên.
`
    },
    "Lớp 5": {
      "Tiếng Việt": `
BỔ SUNG CẬP NHẬT TIẾNG VIỆT 5 (KẾT NỐI TRI THỨC)
1. TẬP MỘT:
   - Trang 56: "Hang Sơn Đoòng (Quảng Bình)" -> "Hang Sơn Đoòng (Quảng Trị)".
   - Trang 66: Bỏ cụm từ ", câu ca dao". Thay khổ thơ "Công cha như núi..." bằng khổ thơ của Phạm Bảo Châu: "Cờ hoa rực rỡ biển người / Sao vàng tháng Tám sáng trời mùa thu."
   - Trang 79: Cập nhật địa danh: "Đồng Văn (Tuyên Quang)", "động Phong Nha (Quảng Trị)", "đảo Ngọc – Phú Quốc (An Giang)".
   - Trang 123: Sông Đà chảy qua Lai Châu, Điện Biên, Sơn La, Phú Thọ (bỏ Lào Cai).
   - Trang 133: "huyện Thuận Thành" -> "phường Thuận Thành".

2. TẬP HAI:
   - Trang 14: "Thừa Thiên Huế và Quảng Trị" -> "thành phố Huế và tỉnh Quảng Trị".
   - Trang 16: "xã Nghĩa Lâm, huyện Nghĩa Đàn" -> "xã Nghĩa Lâm".
   - Trang 49: "huyện tôi" -> "địa phương tôi"; Bổ sung chú thích về huyện Bắc Yên (Sơn La).
   - Trang 55: "Đà Lạt (Lâm Đồng)" -> "Thung lũng Tình yêu (Lâm Đồng)".
`,
      "Toán": `
BỔ SUNG CẬP NHẬT TOÁN 5 (KẾT NỐI TRI THỨC)
- Trang 38: "Cầu An Đông (Ninh Thuận)" -> "Cầu An Đông (Khánh Hoà)"; "Cầu Cần Thơ (Tây Nam Bộ)" -> "Cầu Cần Thơ (Cần Thơ)".
- Trang 55: "Tỉnh Thừa Thiên Huế" -> "Thành phố Huế"; "5 054 km2" -> "4 947 km2".
- Trang 124: Cập nhật số liệu diện tích cà phê: Quảng Ngãi (25,000 ha), Gia Lai (105,000 ha), Đắk Lắk (213,500 ha), Lâm Đồng (319,350 ha).
`,
      "Lịch sử và Địa lí": `
BỔ SUNG CẬP NHẬT LỊCH SỬ VÀ ĐỊA LÍ 5 (KẾT NỐI TRI THỨC)
- Trang 34: Cập nhật ranh giới hành chính sau sáp nhập các đơn vị tại Lạng Sơn.
- Trang 72: Điều chỉnh số liệu dân số và diện tích một số tỉnh thành dựa trên niên giám thống kê mới nhất (ví dụ: TP. Huế, tỉnh Quảng Trị).
- Trang 115: "Tây Nguyên" -> Điều chỉnh mô tả chi tiết về vùng kinh tế - xã hội.
`,
      "Tin học": `
BỔ SUNG CẬP NHẬT TIN HỌC 5 (KẾT NỐI TRI THỨC)
- Trang 15: "Trang web" -> "Website".
- Trang 45: Cập nhật giao diện mBlock phiên bản 5.x mới nhất.
- Trang 60: "Biểu tượng" -> "Icon" (số hóa thuật ngữ).
`,
      "Công nghệ": `
BỔ SUNG CẬP NHẬT CÔNG NGHỆ 5 (KẾT NỐI TRI THỨC)
- Trang 28: Chỉnh sửa hình ảnh minh họa quy trình lắp ráp sản phẩm công nghệ.
- Trang 33: "ghế xếp" -> "ghế đẩu" (đối tượng thực hành).
- Trang 52: Điều chỉnh ký hiệu các bước trong sơ đồ tư duy thiết kế.
`,
      "Đạo đức": `
BỔ SUNG CẬP NHẬT ĐẠO ĐỨC 5 (KẾT NỐI TRI THỨC)
- Trang 20: "(thành phố Lào Cai)" -> "(tỉnh Lào Cai)".
- Trang 49: "Bộ luật Hình sự 2015 sửa đổi, bổ sung năm 2017" -> "Bộ luật Hình sự 2015; sửa đổi, bổ sung năm 2017, 2025".
`,
      "Khoa học": `
BỔ SUNG CẬP NHẬT KHOA HỌC 5 (KẾT NỐI TRI THỨC)
- Trang 7: "Tây Nguyên" -> "phía tây vùng Nam Trung Bộ" (vị trí đất bazan).
- Trang 94: "TRƯỜNG TIỂU HỌC" -> "TRƯỜOWNG TIỂU HỌC HOA HỒNG".
`,
      "Âm nhạc": `
BỔ SUNG CẬP NHẬT ÂM NHẠC 5 (KẾT NỐI TRI THỨC)
- Trang 45: Nhạc sĩ Bùi Đình Thảo quê "Hà Nam" -> "Hà Nam (nay thuộc tỉnh Ninh Bình)".
`
    }
  };

  const gradeUpdates = allUpdates[grade];
  if (!gradeUpdates) return "";

  const subjectUpdate = Object.entries(gradeUpdates).find(([key]) => subject.toLowerCase().includes(key.toLowerCase()));
  
  if (subjectUpdate) {
    return `
THÔNG TIN CẬP NHẬT QUAN TRỌNG CHO ${grade.toUpperCase()} (${subject.toUpperCase()}):
${subjectUpdate[1]}

LƯU Ý: AI phải tuân thủ các đính chính này để đảm bảo nội dung dạy học chính xác theo thực tế hiện nay.
`;
  }
  return "";
};
