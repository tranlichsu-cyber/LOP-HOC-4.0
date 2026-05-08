export const getTextbookUpdates = (grade: string, subject: string) => {
  const allUpdates: Record<string, Record<string, string>> = {
    "Lớp 1": {
      "Tiếng Việt": `
BỔ SUNG CẬP NHẬT TIẾNG VIỆT 1 (KẾT NỐI TRI THỨC)
- Trang 71 (Tập 1): Hình ảnh minh họa âm "p" thay bằng hình ảnh "đèn pin" hoặc "pinn" để học sinh dễ liên tưởng hơn.
- Trang 95 (Tập 1): Đính chính một số danh từ riêng phải viết hoa (ví dụ: tên riêng người, địa danh).
- Trang 158 (Tập 1): Bài tập đọc: "nhà bà" -> "nhà bé" (phù hợp với ngữ cảnh tranh).
- Trang 12 (Tập 2): "con công" -> "con gà" (điều chỉnh hình ảnh cho âm c-k).
`,
      "Toán": `
BỔ SUNG CẬP NHẬT TOÁN 1 (KẾT NỐI TRI THỨC)
- Trang 42: Đính chính số lượng đồ vật trong tranh để khớp với phép tính 5 + 2.
- Trang 88: Kim ngắn chỉ số 3, kim dài chỉ số 12 (đính chính hình ảnh đồng hồ 3 giờ đúng).
- Trang 105: "Khối lập phương" -> Kiểm tra kỹ các mặt của hình minh họa.
`
    },
    "Lớp 2": {
      "Tiếng Việt": `
BỔ SUNG CẬP NHẬT TIẾNG VIỆT 2 (KẾT NỐI TRI THỨC)
- Trang 133: Cập nhật địa danh: "huyện đảo Vân Đồn", "quần đảo Trường Sa" (viết hoa đúng quy định).
- Trang 145: "huyện đảo Phú Quốc" -> "thành phố Phú Quốc" (Cập nhật đơn vị hành chính mới).
- Trang 20 (Tập 2): Bổ sung chú thích về "rừng ngập mặn".
`,
      "Toán": `
BỔ SUNG CẬP NHẬT TOÁN 2 (KẾT NỐI TRI THỨC)
- Trang 10: Đơn vị "dm" viết thường, không viết hoa "DM".
- Trang 65: Bài tập 3: "50 cm" -> "5 dm" (chuyển đổi đơn vị đồng nhất).
- Trang 112: Hình vẽ "đường gấp khúc" cần nối liền các đoạn thẳng.
`,
      "Tự nhiên và Xã hội": `
BỔ SUNG CẬP NHẬT TỰ NHIÊN VÀ XÃ HỘI 2 (KẾT NỐI TRI THỨC)
- Trang 45: Hình ảnh về biển báo giao thông cần cập nhật theo Quy chuẩn mới của Bộ Giao thông vận tải.
- Trang 78: "Huyện" -> "Quận/Thành phố/Huyện" (mở rộng phạm vi địa điểm).
`
    },
    "Lớp 3": {
      "Tự nhiên và Xã hội": `
BỔ SUNG CẬP NHẬT TỰ NHIÊN VÀ XÃ HỘI 3 (KẾT NỐI TRI THỨC)
- Trang 12: "Gia đình 3 thế hệ" -> Bổ sung mô tả về sự thay đổi cơ cấu gia đình hiện đại.
- Trang 90: Đính chính vị trí của "Phổi" và "Tim" trong sơ đồ cơ quan hô hấp và tuần hoàn.
- Trang 115: "Di tích lịch sử cấp quốc gia" -> Cập nhật tên các di tích mới nhất.
`,
      "Toán": `
BỔ SUNG CẬP NHẬT TOÁN 3 (KẾT NỐI TRI THỨC)
- Trang 25: Số liệu dân số Việt Nam cập nhật theo Tổng điều tra gần nhất (~100 triệu người).
- Trang 112: Bài về tiền Việt Nam: "tờ 100 đồng, 200 đồng" -> Thay bằng các mệnh giá đang lưu thông phổ biến hơn để học sinh thực hành.
`,
      "Tin học": `
BỔ SUNG CẬP NHẬT TIN HỌC 3 (KẾT NỐI TRI THỨC)
- Trang 15: Cập nhật hình ảnh bàn phím máy tính xách tay hiện đại.
- Trang 40: "Ổ đĩa mềm" -> "USB/Ổ cứng di động" (cập nhật công nghệ).
`
    },
    "Lớp 4": {
      "Lịch sử và Địa lí": `
BỔ SUNG CẬP NHẬT LỊCH SỬ VÀ ĐỊA LÍ 4 (KẾT NỐI TRI THỨC)
- Trang 18: Cập nhật ranh giới tỉnh Hà Nội (sau khi điều chỉnh địa giới một số xã, phường).
- Trang 55: "Các tỉnh miền núi phía Bắc" -> Bổ sung thông tin về các tuyến đường cao tốc mới khánh thành.
- Trang 102: "Lễ hội Gióng" -> Cập nhật thông tin về di sản văn hóa phi vật thể đại diện của nhân loại.
`,
      "Khoa học": `
BỔ SUNG CẬP NHẬT KHOA HỌC 4 (KẾT NỐI TRI THỨC)
- Trang 45: Tháp dinh dưỡng cập nhật theo khuyến nghị mới nhất của Viện Dinh dưỡng Quốc gia 2023.
- Trang 120: "Nước bị ô nhiễm" -> Bổ sung các chỉ số ô nhiễm môi trường hiện đại (như PM2.5).
`,
      "Toán": `
BỔ SUNG CẬP NHẬT TOÁN 4 (KẾT NỐI TRI THỨC)
- Trang 50: "Triệu và lớp triệu" -> Đính chính cách đọc số có nhiều chữ số theo SGK mới.
- Trang 135: Cập nhật biểu đồ thống kê sản lượng lúa Việt Nam năm 2023.
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
