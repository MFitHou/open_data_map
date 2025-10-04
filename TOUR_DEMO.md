# 🎯 Demo và Test Hệ thống Tour Driver.js

## 🚀 Hướng dẫn test

1. **Khởi động dev server**:
   ```bash
   npm run dev
   ```

2. **Truy cập**: http://localhost:5173

3. **Test các tour**:

### 🏠 Trang chủ (`/`)
- Nhấn nút **?** ở góc phải dưới
- Tour sẽ hướng dẫn:
  - Tiêu đề ứng dụng
  - Ô tìm kiếm
  - Navigation đến Map và Query

### 🗺️ Trang bản đồ (`/map`)
- Nhấn nút **?** 
- Tour sẽ hướng dẫn:
  - Bản đồ tương tác
  - Panel tìm kiếm
  - Panel thông tin (khi có)
  - Nút dịch vụ lân cận
  - Nút tải dữ liệu

### 📊 Trang truy vấn (`/query`)
- Nhấn nút **?**
- Tour sẽ hướng dẫn:
  - SPARQL Editor
  - Ví dụ truy vấn
  - Nút thực thi
  - Khu vực hiển thị kết quả

## 🐛 Troubleshooting

### Nếu tour không hiển thị:
1. Kiểm tra console có lỗi không
2. Verify các ID elements tồn tại:
   ```javascript
   // Trong browser console
   document.querySelector('#app-title')
   document.querySelector('#search-input')
   document.querySelector('#map-container')
   ```

### Nếu HelpButton không hiện:
- Kiểm tra CSS z-index
- Verify import đúng component

### Nếu style không đúng:
- Kiểm tra `driverStyles.css` đã được import
- Clear browser cache

## ✅ Checklist Test

- [ ] Home tour hoạt động
- [ ] Map tour hoạt động  
- [ ] Query tour hoạt động
- [ ] HelpButton hiển thị đúng vị trí
- [ ] Responsive trên mobile
- [ ] Animation mượt mà
- [ ] Nút Next/Previous hoạt động
- [ ] Có thể đóng tour bất kỳ lúc nào

## 🎨 Customization Test

Thử thay đổi:
- Màu HelpButton
- Vị trí HelpButton
- Nội dung tour steps
- Thêm bước tour mới

## 📱 Test Responsive

- Desktop (>1200px)
- Tablet (768px - 1200px) 
- Mobile (<768px)

## 🔧 Dev Tools

Mở DevTools và check:
- Network tab: Driver.js assets loaded
- Console: Không có lỗi
- Elements: Các ID elements tồn tại
- Performance: Tour không gây lag