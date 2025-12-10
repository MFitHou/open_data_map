# Data Explorer

Trang **Data Explorer** cho phép người dùng khám phá và truy vấn dữ liệu IOT và dữ liệu bản đồ một cách trực quan.

## Tính năng

### 1. Chọn Loại Dữ Liệu
- **Dữ liệu IOT**: Dữ liệu từ các cảm biến IoT (InfluxDB)
  - Chất lượng không khí (Air Quality)
  - Thời tiết (Weather)
  - Giao thông (Traffic)
  - Lũ lụt (Flood)

- **Dữ liệu Bản Đồ**: Dữ liệu POI từ Fuseki (SPARQL)
  - Máy ATM
  - Bệnh viện
  - Trường học
  - Nhà hàng

### 2. Hiển Thị Dữ Liệu
- Hiển thị dữ liệu dạng bảng với đầy đủ thông tin
- Hỗ trợ cuộn ngang/dọc cho bảng lớn
- Highlight khi hover trên từng dòng
- Tự động format các URL thành link có thể click

### 3. Xem Script Truy Vấn
- Khi nhấn nút "Xem Script", hiển thị đoạn mã truy vấn dữ liệu:
  - **IOT Data**: Hiển thị Flux query cho InfluxDB
  - **Map Data**: Hiển thị SPARQL query cho Fuseki
- Script được hiển thị trong code block với syntax highlighting

### 4. Tải Xuống Dữ Liệu
- Tải xuống kết quả truy vấn dưới dạng JSON
- File được đặt tên theo format: `{type}-{measurement/mapType}-{timestamp}.json`

## Cách Sử Dụng

1. **Chọn loại dữ liệu**: IOT hoặc Bản đồ
2. **Chọn phép đo/loại**: 
   - Nếu chọn IOT: Chọn measurement (air_quality, weather, traffic, flood)
   - Nếu chọn Bản đồ: Chọn loại POI (atm, hospital, school, restaurant)
3. **Thực thi truy vấn**: Nhấn nút "Thực Thi Truy Vấn"
4. **Xem kết quả**: Dữ liệu hiển thị dạng bảng
5. **Xem script** (tùy chọn): Nhấn "Xem Script" để xem query đã sử dụng
6. **Tải xuống** (tùy chọn): Nhấn "Tải Xuống" để tải kết quả dạng JSON

## API Endpoints

### IOT Data
```
GET /influxdb/stations?measurement={measurement}
```
- Parameters:
  - `measurement`: air_quality | weather | traffic | flood

### Map Data
```
POST /fuseki/query
Body: { "query": "<SPARQL query>" }
```

## Ví Dụ Queries

### IOT - Air Quality
```flux
from(bucket: "iot_data")
  |> range(start: -1h)
  |> filter(fn: (r) => r["_measurement"] == "air_quality")
  |> filter(fn: (r) => r["_field"] == "aqi" or r["_field"] == "pm25" or r["_field"] == "pm10")
  |> aggregateWindow(every: 5m, fn: mean, createEmpty: false)
  |> yield(name: "mean")
```

### Map Data - ATM
```sparql
PREFIX ex: <http://opendatafithou.org/poi/>
PREFIX geo1: <http://www.opendatafithou.net/ont/geosparql#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?poi ?name ?amenity ?brand ?operator ?wkt
WHERE {
  ?poi ex:amenity "atm" .
  OPTIONAL { ?poi rdfs:label ?name . }
  OPTIONAL { ?poi ex:brand ?brand . }
  OPTIONAL { ?poi ex:operator ?operator . }
  OPTIONAL {
    ?poi geo1:hasGeometry ?g .
    ?g geo1:asWKT ?wkt .
  }
}
LIMIT 100
```

## Đa Ngôn Ngữ

Trang hỗ trợ 3 ngôn ngữ:
- Tiếng Việt (vi)
- English (en)
- 繁體中文 (zh-TW)

## Routes

- URL: `/data-explorer`
- Component: `DataExplorer`
- Location: `src/components/data-explorer/DataExplorer.tsx`

## Styling

CSS được định nghĩa trong: `src/styles/pages/DataExplorer.css`

Các tính năng CSS:
- Responsive design
- Grid layout cho desktop, stack layout cho mobile
- Custom scrollbar styling
- Smooth transitions và hover effects
- Color scheme phù hợp với thiết kế tổng thể

## License

Copyright (C) 2025 MFitHou  
Licensed under GNU General Public License v3.0
