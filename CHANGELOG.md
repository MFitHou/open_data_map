# Changelog

Tất cả các thay đổi đáng chú ý trong dự án này sẽ được ghi lại trong file này.

Định dạng dựa trên [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
và dự án này tuân theo [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased] 🚧

---

## [0.1.1] - 2025-10-04 ✨

### Added
- **🔗 Quick Navigation Links**: Buttons điều hướng nhanh dưới search box
  - 📚 GitHub - Link đến repository chính thức
  - 🗺️ Bản đồ - Chuyển đến trang interactive map
  - 🔍 Truy vấn dữ liệu - Đi đến trang SPARQL query interface
- **📄 License Information Section**: Section thông tin giấy phép GNU GPL v3.0
  - ⚖️ Tổng quan về quyền và trách nhiệm
  - ✅ Visual permissions grid (sử dụng, nghiên cứu, phân phối, chỉnh sửa)
  - 📋 Requirements checklist (copyright, same license, source disclosure)
  - 🔗 Quick links đến documentation và toàn văn giấy phép
  - © Copyright attribution với OLP PMNM 2025

### Enhanced
- **🎨 UI/UX Improvements**:
  - Quick navigation buttons với prominent white background trên nền xanh
  - Smooth hover effects và transitions cho better user experience
  - Icon-based navigation để dễ nhận biết và sử dụng
  - Professional card-based layout với subtle shadows
- **📱 Responsive Design**:
  - Mobile-optimized layout cho quick links (stack vertical)
  - Responsive grid system cho license section
  - Touch-friendly button sizing trên mobile devices

### Technical
- **🏗️ Component Architecture**: Cải thiện Home.tsx structure
- **🎨 CSS Framework**: Comprehensive styling system với:
  - `.quick-links` và `.quick-link-button` classes
  - `.license-section` với responsive grid layout
  - Color-coded components (green for permissions, orange for requirements)
  - Consistent spacing và typography system

---

## [0.1.0] - 2025-10-03 🎉

### Added
- ✨ **Tính năng tìm kiếm địa điểm**: Tích hợp API Wikidata để tìm kiếm các địa điểm trong nước với SPARQL query
- 🗺️ **Bản đồ tương tác**: Sử dụng Leaflet và React-Leaflet để hiển thị bản đồ với khả năng zoom, pan
- 📍 **Highlight địa điểm**: Tự động highlight và center bản đồ khi chọn địa điểm từ kết quả tìm kiếm
- 📊 **Panel thông tin chi tiết**: Hiển thị metadata đầy đủ từ Wikidata bao gồm:
  - Thông tin cơ bản (tên, mô tả, loại đối tượng)
  - Identifiers (Wikidata ID, OSM ID, VIAF, GND)
  - Statements (năm thành lập, dân số, diện tích, website, điện thoại, email, địa chỉ)
  - Hình ảnh từ Wikimedia Commons
- 🔄 **Tìm kiếm địa điểm gần**: API động để tìm các dịch vụ lân cận theo loại:
  - 🚌 Trạm xe buýt (bus stops)
  - 🏧 ATM
  - 🚻 Nhà vệ sinh công cộng
  - 🏥 Bệnh viện
  - Và nhiều loại khác
- ⬇️ **Export dữ liệu**: Cho phép download thông tin địa điểm dưới dạng:
  - XML format với cấu trúc có tổ chức
  - RDF/XML format tuân theo chuẩn Linked Open Data
- 🏠 **Trang chủ (Landing Page)**: Giao diện thân thiện với:
  - Tìm kiếm nhanh từ trang chủ
  - Gợi ý địa điểm phổ biến
  - Giới thiệu dự án OpenDataFitHou
  - Hiển thị các tính năng và loại dữ liệu
- 🎯 **Router Navigation**: Điều hướng mượt mà giữa trang chủ và bản đồ
- 🔍 **Debounced Search**: Tối ưu performance với tìm kiếm delay 800ms

### Technical Features
- ⚡ **React 19** với TypeScript để type safety
- 🗺️ **Leaflet** maps với tile layer OpenStreetMap
- 🔗 **SPARQL Integration** với Wikidata Query Service
- 🌐 **RESTful API** cho nearby places với Fuseki endpoint
- 📱 **Responsive Design** tương thích mobile và desktop
- 🎨 **Custom CSS** với modern UI/UX patterns

### Developer Experience
- 🛠️ **Vite** build tool cho hot reload nhanh
- 📋 **ESLint** configuration cho code quality
- 📂 **Organized Structure**: Components theo feature-based architecture
- 🔧 **TypeScript** interfaces cho tất cả data models
- 📚 **Utility Functions**: Helpers cho data parsing, export, API calls

### Data Sources & Standards
- 🌍 **Wikidata**: Metadata và thông tin chi tiết địa điểm
- 🗺️ **OpenStreetMap**: Dữ liệu bản đồ và POI
- 📊 **RDF/Linked Data**: Chuẩn hóa dữ liệu theo semantic web
- 🔗 **URI References**: Liên kết với external identifiers

### Fixed
- 🐛 **Loại bỏ các hàm thừa**: Refactor code để tối ưu performance (commit 883824e)
- ✅ **Search Result Navigation**: Đảm bảo dữ liệu đầy đủ được truyền giữa components

### Changed
- 🎨 **Landing Page Updates**: Cải thiện UI/UX của trang chủ (commit 3720326)
- 📍 **Nearby Places Enhancement**: Cập nhật chức năng hiển thị địa điểm gần (commit 091bc68)

