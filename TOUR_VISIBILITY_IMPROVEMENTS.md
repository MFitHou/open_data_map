# 🌟 Đã cải thiện độ sáng và visibility của Tour Guide

## ✅ **Những thay đổi chính:**

### 1. 🌅 **Giảm độ tối của overlay**
- **Trước**: rgba(0, 0, 0, 0.75) - rất tối
- **Sau**: rgba(0, 0, 0, 0.4) - nhẹ nhàng hơn
- **Blur**: 3px → 1px (ít mờ hơn)
- **Stage background**: 0.1 → 0.95 (gần như trong suốt)

### 2. 🎯 **Tăng cường highlight cho input/button**
- **Background**: rgba(255, 255, 255, 0.98) - gần như trắng hoàn toàn
- **Border**: 4px solid #007bff - viền xanh dày
- **Multi-layer shadow**: Trắng + xanh + glow effect
- **Scale**: 1.05x để nổi bật hơn
- **Pulse animation**: Hiệu ứng nhấp nháy rõ ràng

### 3. 🔘 **Button trong tour cực kỳ rõ nét**
- **Font-weight**: 700 (extra bold)
- **Font-size**: 15px (to hơn)
- **Text-shadow**: Đổ bóng chữ để nổi bật
- **Border**: 2px solid cho depth
- **Next button**: #0056b3 (xanh đậm)
- **Prev button**: #495057 (xám đậm)
- **Close button**: 32px, font-weight 900

### 4. 📋 **Popover content rõ ràng hơn**
- **Title**: Font-weight 700, color #000000, text-shadow
- **Description**: Font-size 15px, color #212529, font-weight 500
- **Background**: rgba(255, 255, 255, 0.98) - gần như trắng
- **Border**: 2px solid với màu xanh

### 5. 🌙 **Dark mode tương thích**
- Overlay nhạt hơn (0.5 thay vì 0.75)
- Highlight vẫn sáng với background trắng
- Text shadow phù hợp cho dark theme

## 🧪 **Test ngay:**

1. **Truy cập**: http://localhost:5174/
2. **Click nút "?"** trên bất kỳ trang nào
3. **Kiểm tra**:
   - ✅ Background có nhạt hơn không?
   - ✅ Input search có nổi bật rõ ràng không?
   - ✅ Text trong button có đậm, dễ đọc không?
   - ✅ Highlight có viền xanh + glow effect không?
   - ✅ Có thể thoát tour dễ dàng không?

## 📊 **So sánh trước/sau:**

| Aspect | Trước | Sau |
|--------|-------|-----|
| Overlay opacity | 0.75 | 0.4 |
| Button text | Font-weight 600 | Font-weight 700 + text-shadow |
| Input highlight | Mờ, nhỏ | Rõ, to, multi-layer |
| Close button | 28px | 32px |
| Popover bg | Mờ | 98% opacity |

## 🔧 **Nếu cần điều chỉnh thêm:**

**Giảm overlay hơn nữa:**
```css
.driver-overlay {
  background: rgba(0, 0, 0, 0.3) !important;
}
```

**Tăng highlight hơn nữa:**
```css
transform: scale(1.1) !important;
```

**Button to hơn:**
```css
font-size: 16px !important;
```

---

**🎯 Hãy test và cho biết kết quả!**