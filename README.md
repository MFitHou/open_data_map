# 🌍 OpenDataFitHou

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![React](https://img.shields.io/badge/React-21.1.1-61dafb.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178c6.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.1.7-646cff.svg)](https://vitejs.dev/)

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

## 🚀 Demo trực tiếp

```bash
# Clone repository
git clone https://github.com/MFitHou/open_data_map.git
cd open_data_map

# Cài đặt dependencies
npm install

# Chạy development server
npm run dev
```

## 📊 Nguồn dữ liệu

| Nguồn | Mục đích | API/Endpoint |
|-------|----------|--------------|
| 🌍 **Wikidata** | Metadata địa điểm, identifiers | SPARQL Query Service |
| 🗺️ **OpenStreetMap** | Dữ liệu bản đồ, POI | Tile layers, Overpass API |
| 🔗 **Linked Data** | Semantic relationships | RDF triples, URI references |

## 🛠️ Tech Stack

### Frontend
- ⚛️ **React 21** - UI framework hiện đại
- 📘 **TypeScript** - Type safety và developer experience  
- ⚡ **Vite** - Build tool nhanh với HMR
- 🗺️ **Leaflet** - Thư viện bản đồ mạnh mẽ


### APIs & Data
- 🔍 **SPARQL** - Query Wikidata knowledge graph
- 🌐 **REST APIs** - Fuseki endpoints cho nearby search
- 📊 **RDF/XML** - Semantic data export
- 🔗 **URI Resolution** - External identifier linking

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
