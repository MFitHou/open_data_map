# 🌍 OpenDataFitHou

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![React](https://img.shields.io/badge/React-19.1.1-61dafb.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178c6.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.1.7-646cff.svg)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933.svg)](https://nodejs.org/)

> **Open Data for Digital Transformation** 🚀

OpenDataFitHou là dự án mã nguồn mở thu thập, chuẩn hóa và trực quan hóa dữ liệu mở từ **Wikidata**, **OpenStreetMap** và nhiều nguồn khác. Dự án cung cấp giao diện web tương tác để tìm kiếm, khám phá và xuất dữ liệu địa điểm theo chuẩn **Linked Open Data (RDF)**.

## ✨ Tính năng chính

### 🔍 Tìm kiếm thông minh
- **SPARQL Integration**: Tích hợp API Wikidata với SPARQL queries
- **Real-time Search**: Tìm kiếm với debounce và gợi ý tự động
- **Rich Metadata**: Hiển thị thông tin chi tiết từ nhiều nguồn dữ liệu

### 🗺️ Bản đồ tương tác  
- **Interactive Map**: Sử dụng Leaflet với OpenStreetMap tiles
- **Auto Highlighting**: Tự động highlight và focus địa điểm được chọn

### 📍 Dịch vụ lân cận
- 🚌 **Trạm xe buýt** - Tìm các trạm gần nhất
- 🏧 **ATM** - Ngân hàng và cây ATM 
- 🚻 **Nhà vệ sinh công cộng** - Tiện ích công cộng
- 🏥 **Bệnh viện** - Cơ sở y tế gần đó

### ⬇️ Xuất dữ liệu
- **XML Format**: Cấu trúc dữ liệu có tổ chức
- **RDF/XML**: Tuân theo chuẩn Semantic Web và Linked Open Data

## �️ Yêu cầu hệ thống

Trước khi cài đặt, đảm bảo máy tính của bạn đã có:

- **Node.js** version 21.0.0 trở lên
- **npm** version 8.0.0 trở lên (hoặc **yarn** 1.22.0+)
- **Git** để clone repository

### Kiểm tra version hiện tại:
```bash
node --version    # Cần >= 18.0.0
npm --version     # Cần >= 8.0.0
git --version     # Cần có Git
```

## 📦 Hướng dẫn cài đặt chi tiết

### Bước 1: Clone Repository

```bash
# Clone dự án từ GitHub
git clone https://github.com/MFitHou/open_data_map.git

# Di chuyển vào thư mục dự án
cd open_data_map

# Kiểm tra cấu trúc thư mục
ls -la  # Linux/macOS
dir     # Windows
```

### Bước 2: Cài đặt môi trường Node.js

#### Windows:
1. Tải Node.js từ [nodejs.org](https://nodejs.org/)
2. Chạy file `.msi` và làm theo hướng dẫn
3. Mở Command Prompt/PowerShell mới và kiểm tra:
```cmd
node --version
npm --version
```

#### macOS:
```bash
# Sử dụng Homebrew (khuyến nghị)
brew install node

# Hoặc tải từ nodejs.org
```

#### Linux (Ubuntu/Debian):
```bash
# Cài đặt Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Kiểm tra version
node --version
npm --version
```

### Bước 3: Cài đặt Dependencies

```bash
# Cài đặt tất cả packages cần thiết
npm install

# Hoặc sử dụng yarn (nếu có)
yarn install
```

Quá trình này sẽ cài đặt:
- React 19.1.1
- TypeScript 5.8.3  
- Vite 7.1.7
- Leaflet & React-Leaflet
- React Router DOM
- ESLint & TypeScript configs

### Bước 4: Chạy Frontend Development Server

```bash
# Khởi chạy development server
npm run dev

# Server sẽ chạy tại: http://localhost:5173
```

## 🚀 Scripts và Commands

### Development Commands
```bash
npm run dev      # Chạy development server với hot reload
npm run build    # Build production (output: dist/)  
npm run preview  # Preview production build locally
npm run lint     # Kiểm tra code style với ESLint
```

### Production Deployment
```bash
# Build cho production
npm run build

# Deploy thư mục dist/ lên server
# Ví dụ với Netlify:
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

## 📊 Nguồn dữ liệu

| Nguồn | Mục đích | API/Endpoint |
|-------|----------|--------------|
| 🌍 **Wikidata** | Metadata địa điểm, identifiers | SPARQL Query Service |
| 🗺️ **OpenStreetMap** | Dữ liệu bản đồ, POI | Tile layers, Overpass API |
| 🔗 **Linked Data** | Semantic relationships | RDF triples, URI references |

## 🛠️ Tech Stack

### Frontend
- ⚛️ **React 19.1.1** - UI framework hiện đại
- 📘 **TypeScript 5.8.3** - Type safety và developer experience  
- ⚡ **Vite 7.1.7** - Build tool nhanh với HMR
- 🗺️ **Leaflet** - Thư viện bản đồ mạnh mẽ
- 🎨 **CSS3** - Custom styling responsive

### APIs & Data Sources
- 🔍 **SPARQL** - Query Wikidata knowledge graph
- 🌐 **REST APIs** - Fuseki endpoints cho nearby search  
- 📊 **RDF/XML** - Semantic data export
- 🔗 **URI Resolution** - External identifier linking

### Development Tools
- 📋 **ESLint** - Code linting và quality assurance
- 🔧 **TypeScript Config** - Strict type checking
- 📁 **Component Architecture** - Organized feature-based structure


## 🐛 Troubleshooting

### Lỗi thường gặp:

#### 1. Node.js version không tương thích
```bash
Error: The engine "node" is incompatible with this module
```
**Giải pháp**: Cập nhật Node.js lên version 18+

#### 2. Port 5173 đã được sử dụng
```bash
Error: Port 5173 is already in use
```
**Giải pháp**: 
```bash
# Chỉ định port khác
npm run dev -- --port 3000
```

#### 3. Lỗi npm install
```bash
npm ERR! network request failed
```
**Giải pháp**:
```bash
# Clear npm cache
npm cache clean --force

# Sử dụng registry khác
npm install --registry https://registry.npmjs.org/
```

#### 4. Lỗi TypeScript
```bash
TypeScript error: Cannot find module
```
**Giải pháp**:
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## 📁 Cấu trúc dự án

```
src/
├── components/           # React components
│   ├── home/            # Landing page
│   │   └── Home.tsx     # Trang chủ với search
│   └── map/             # Map-related components  
│       ├── SimpleMap.tsx      # Main map component
│       ├── Search.tsx         # Search functionality
│       ├── SearchResult.tsx   # Result display
│       ├── Info.tsx           # Info panel
│       ├── InfoPanel.tsx      # Detailed info
│       └── DownloadButton.tsx # Data export
├── utils/               # Utility functions
│   ├── nearbyApi.ts     # Nearby places API
│   ├── overpass.ts      # OSM Overpass queries  
│   ├── wikidataUtils.ts # Wikidata helpers
│   ├── rdfParser.ts     # RDF data parsing
│   ├── linkResolver.ts  # URI resolution
│   └── dataExport.ts    # XML/RDF export
├── styles/              # CSS stylesheets
└── App.tsx             # Main app with routing
```
