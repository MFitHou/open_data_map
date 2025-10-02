import { MapContainer, TileLayer, Marker, Popup, GeoJSON, ZoomControl, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState } from "react";
import { Search } from "./Search";
import { SearchResult } from "./SearchResult";
import { Info } from "./Info";

// Hàm tính diện tích polygon (đơn vị: km²)
const calculatePolygonArea = (coordinates: number[][]): number => {
  if (coordinates.length < 3) return 0;
  
  let area = 0;
  const earthRadius = 6371;
  
  for (let i = 0; i < coordinates.length; i++) {
    const j = (i + 1) % coordinates.length;
    const lat1 = coordinates[i][1] * Math.PI / 180;
    const lat2 = coordinates[j][1] * Math.PI / 180;
    const lon1 = coordinates[i][0] * Math.PI / 180;
    const lon2 = coordinates[j][0] * Math.PI / 180;
    
    area += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  
  area = Math.abs(area * earthRadius * earthRadius / 2);
  return area;
};

// Hàm lấy dân số từ Wikidata (thông qua OSM relation ID)
const fetchPopulationData = async (osmId: number) => {
  try {
    // Query Wikidata để tìm thông tin dân số
    const wikidataQuery = `
      SELECT ?population ?area WHERE {
        ?item wdt:P402 "${osmId}" .
        OPTIONAL { ?item wdt:P1082 ?population . }
        OPTIONAL { ?item wdt:P2046 ?area . }
      }
    `;
    
    const response = await fetch('https://query.wikidata.org/sparql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `query=${encodeURIComponent(wikidataQuery)}&format=json`
    });
    
    const data = await response.json();
    
    if (data.results?.bindings?.length > 0) {
      const binding = data.results.bindings[0];
      return {
        population: binding.population?.value ? parseInt(binding.population.value) : null,
        officialArea: binding.area?.value ? parseFloat(binding.area.value) : null
      };
    }
    
    return { population: null, officialArea: null };
  } catch (error) {
    console.error('Error fetching population data:', error);
    return { population: null, officialArea: null };
  }
};

// Custom icons cho các loại POI - THU NHỎ SIZE
const schoolIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  iconSize: [20, 33],      // Giảm từ [25, 41]
  iconAnchor: [10, 33],    // Giảm từ [12, 41]
  popupAnchor: [0, -33],   // Điều chỉnh vị trí popup
});

const hospitalIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  iconSize: [20, 33],
  iconAnchor: [10, 33],
  popupAnchor: [0, -33],
});

const restaurantIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png",
  iconSize: [20, 33],
  iconAnchor: [10, 33],
  popupAnchor: [0, -33],
});

const bankIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  iconSize: [20, 33],
  iconAnchor: [10, 33],
  popupAnchor: [0, -33],
});

const searchIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png",
  iconSize: [25, 41],      // Giữ nguyên cho search marker (nổi bật hơn)
  iconAnchor: [12, 41],
  popupAnchor: [0, -41],
});

// Component để fly to location
const FlyToLocation: React.FC<{ lat: number; lon: number; zoom?: number }> = ({ lat, lon, zoom = 15 }) => {
  const map = useMap();
  
  useEffect(() => {
    map.flyTo([lat, lon], zoom, {
      duration: 1.5
    });
  }, [lat, lon, zoom, map]);

  return null;
};

const SimpleMap: React.FC = () => {
  const [wardData, setWardData] = useState<any>(null);
  const [pois, setPois] = useState<{
    schools: any[];
    hospitals: any[];
    restaurants: any[];
    banks: any[];
  }>({
    schools: [],
    hospitals: [],
    restaurants: [],
    banks: []
  });
  const [wardId, setWardId] = useState<number | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lon: number} | null>(null);
  const [searchMarker, setSearchMarker] = useState<{lat: number, lon: number, name: string} | null>(null);
  const [highlightBounds, setHighlightBounds] = useState<number[][] | null>(null);
  const [highlightName, setHighlightName] = useState<string>("");
  const [isLoadingBoundary, setIsLoadingBoundary] = useState(false);
  const [isLoadingPOIs, setIsLoadingPOIs] = useState(false);
  const [wardStats, setWardStats] = useState<{
    calculatedArea: number;
    population: number | null;
    officialArea: number | null;
    density: number | null;
  }>({
    calculatedArea: 0,
    population: null,
    officialArea: null,
    density: null
  });

  // Hàm nối các way thành polygon hoàn chỉnh
  const connectWays = (ways: any[]) => {
    if (ways.length === 0) return [];
    
    const connectedCoords: number[][] = [];
    const usedWays = new Set<number>();
    
    // Bắt đầu với way đầu tiên
    let currentWay = ways[0];
    connectedCoords.push(...currentWay.map((node: any) => [node.lon, node.lat]));
    usedWays.add(0);
    
    // Nối các way còn lại
    while (usedWays.size < ways.length) {
      const lastPoint = connectedCoords[connectedCoords.length - 1];
      let foundConnection = false;
      
      for (let i = 0; i < ways.length; i++) {
        if (usedWays.has(i)) continue;
        
        const way = ways[i];
        const wayCoords = way.map((node: any) => [node.lon, node.lat]);
        const firstPoint = wayCoords[0];
        const lastPointOfWay = wayCoords[wayCoords.length - 1];
        
        // Kiểm tra nếu way này nối tiếp với điểm cuối
        if (Math.abs(lastPoint[0] - firstPoint[0]) < 0.0001 && 
            Math.abs(lastPoint[1] - firstPoint[1]) < 0.0001) {
          connectedCoords.push(...wayCoords.slice(1)); // Bỏ điểm đầu vì trùng
          usedWays.add(i);
          foundConnection = true;
          break;
        }
        // Kiểm tra ngược lại
        else if (Math.abs(lastPoint[0] - lastPointOfWay[0]) < 0.0001 && 
                 Math.abs(lastPoint[1] - lastPointOfWay[1]) < 0.0001) {
          connectedCoords.push(...wayCoords.reverse().slice(1)); // Đảo ngược và bỏ điểm đầu
          usedWays.add(i);
          foundConnection = true;
          break;
        }
      }
      
      if (!foundConnection) break; // Không tìm được way nối tiếp
    }
    
    return connectedCoords;
  };

  // Hàm lấy tọa độ từ element OSM
  const getCoordinates = (element: any) => {
    if (element.lat && element.lon) {
      return [element.lat, element.lon];
    } else if (element.center) {
      return [element.center.lat, element.center.lon];
    }
    return null;
  };

  const wardStyle = {
    fillColor: '#00ff00',
    weight: 2,
    opacity: 1,
    color: 'blue',
    dashArray: '0',
    fillOpacity: 0.2
  };

  // HANDLER KHI USER CLICK VÀO KẾT QUẢ TÌM KIẾM
  const handleSelectLocation = async (result: any) => {
    console.log("Selected location:", result);
    
    // 1. Reset highlight cũ
    setHighlightBounds(null);
    setHighlightName("");
    
    // 2. Fly to location ngay lập tức
    setSelectedLocation({ lat: result.lat, lon: result.lon });
    setSearchMarker({ lat: result.lat, lon: result.lon, name: result.name });

    // 3. Reset dữ liệu cũ
    setWardData(null);
    setPois({
      schools: [],
      hospitals: [],
      restaurants: [],
      banks: []
    });
    setWardStats({
      calculatedArea: 0,
      population: null,
      officialArea: null,
      density: null
    });

    // 4. Fetch boundary
    setIsLoadingBoundary(true);
    const locationQuery = `
      [out:json][timeout:25];
      (
        relation(${result.id});
      );
      out geom;
    `;

    try {
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: locationQuery
      });

      if (!response.ok) {
        console.error('Failed to fetch boundary:', response.status);
        setIsLoadingBoundary(false);
        return;
      }

      const data = await response.json();
      
      if (data.elements && data.elements.length > 0) {
        const element = data.elements[0];
        setWardId(element.id);

        if (element.members) {
          const outerWays = element.members
            .filter((member: any) => member.role === 'outer' && member.geometry);

          if (outerWays.length > 0) {
            const wayGeometries = outerWays.map((way: any) => way.geometry);
            const connectedCoords = connectWays(wayGeometries);

            if (connectedCoords.length > 0) {
              const firstPoint = connectedCoords[0];
              const lastPoint = connectedCoords[connectedCoords.length - 1];
              if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
                connectedCoords.push(firstPoint);
              }

              // Chuyển đổi từ [lon, lat] sang [lat, lon] cho Leaflet
              const leafletCoords = connectedCoords.map(coord => [coord[1], coord[0]]);

              // SET HIGHLIGHT BOUNDS
              setHighlightBounds(leafletCoords);
              setHighlightName(result.name);

              // Tính diện tích
              const calculatedArea = calculatePolygonArea(connectedCoords);
              
              // Fetch dân số
              const { population, officialArea } = await fetchPopulationData(element.id);
              
              const density = population && calculatedArea > 0 
                ? Math.round(population / calculatedArea) 
                : null;

              setWardStats({
                calculatedArea: Math.round(calculatedArea * 100) / 100,
                population,
                officialArea,
                density
              });

              // Tạo GeoJSON cho boundary
              const geoJson = {
                type: "Feature",
                properties: { 
                  name: result.name,
                  area: `${Math.round(calculatedArea * 100) / 100} km²`,
                  population: population || 'Không có dữ liệu',
                  density: density ? `${density.toLocaleString()} người/km²` : 'Không có dữ liệu'
                },
                geometry: {
                  type: "Polygon",
                  coordinates: [connectedCoords]
                }
              };

              setWardData(geoJson);
              console.log('Boundary loaded successfully');

              // 5. Fetch POIs sau khi có boundary
              fetchPOIsForWard(element.id);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching boundary:', error);
    } finally {
      setIsLoadingBoundary(false);
    }
  };

  // HÀM FETCH POIs (GỌI SAU KHI CÓ BOUNDARY)
  const fetchPOIsForWard = async (wardIdToFetch: number) => {
    setIsLoadingPOIs(true);
    const wardAreaQuery = `(area:${3600000000 + wardIdToFetch})`;

    const combinedQuery = `
      [out:json][timeout:30];
      (
        node["amenity"="school"]${wardAreaQuery};
        way["amenity"="school"]${wardAreaQuery};
        node["amenity"~"hospital|clinic|pharmacy"]${wardAreaQuery};
        way["amenity"~"hospital|clinic|pharmacy"]${wardAreaQuery};
        node["amenity"~"restaurant|cafe|fast_food"]${wardAreaQuery};
        way["amenity"~"restaurant|cafe|fast_food"]${wardAreaQuery};
        node["amenity"~"bank|atm"]${wardAreaQuery};
        way["amenity"~"bank|atm"]${wardAreaQuery};
      );
      out center;
    `;

    try {
      console.log(`Fetching POIs for ward ID: ${wardIdToFetch}`);

      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: combinedQuery
      });

      if (response.status === 429) {
        console.error('Rate limited. Please wait before retrying.');
        setIsLoadingPOIs(false);
        return;
      }

      if (!response.ok) {
        console.error('Failed to fetch POIs:', response.status);
        setIsLoadingPOIs(false);
        return;
      }

      const data = await response.json();

      if (data.elements) {
        // Phân loại POIs
        const schools = data.elements.filter((el: any) => el.tags?.amenity === "school");
        const hospitals = data.elements.filter((el: any) => 
          ["hospital", "clinic", "pharmacy"].includes(el.tags?.amenity)
        );
        const restaurants = data.elements.filter((el: any) => 
          ["restaurant", "cafe", "fast_food"].includes(el.tags?.amenity)
        ).slice(0, 20);
        const banks = data.elements.filter((el: any) => 
          ["bank", "atm"].includes(el.tags?.amenity)
        );

        setPois({
          schools,
          hospitals,
          restaurants,
          banks
        });

        console.log('Found POIs:', {
          schools: schools.length,
          hospitals: hospitals.length,
          restaurants: restaurants.length,
          banks: banks.length
        });
      }
    } catch (error) {
      console.error('Error fetching POIs:', error);
    } finally {
      setIsLoadingPOIs(false);
    }
  };

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      {/* Search Component */}
      <Search onSelectLocation={handleSelectLocation} />

      {/* Info Panel - Thay thế Stats Panel cũ */}
      <Info
        wardName={searchMarker?.name}
        stats={{
          calculatedArea: wardStats.calculatedArea,
          population: wardStats.population,
          density: wardStats.density,
        }}
        pois={{
          schools: pois.schools.length,
          hospitals: pois.hospitals.length,
          restaurants: pois.restaurants.length,
          banks: pois.banks.length,
        }}
        isLoadingBoundary={isLoadingBoundary}
        isLoadingPOIs={isLoadingPOIs}
      />

      <MapContainer
        center={[21.0285, 105.8542]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        attributionControl={false}
        zoomControl={false}
      >
        <ZoomControl position="bottomright" />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* Search Result Highlight */}
        {highlightBounds && highlightBounds.length > 0 && (
          <SearchResult 
            bounds={highlightBounds} 
            name={highlightName}
            color="#ff6b6b"
          />
        )}

        {/* Search marker */}
        {searchMarker && (
          <Marker position={[searchMarker.lat, searchMarker.lon]} icon={searchIcon}>
            <Popup>
              <div>
                <h4>📍 {searchMarker.name}</h4>
                <p>Vị trí được chọn</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Ward boundary (subtle background) */}
        {wardData && (
          <GeoJSON 
            key={wardId}
            data={wardData} 
            style={wardStyle}
            onEachFeature={(feature, layer) => {
              layer.bindPopup(`
                <div>
                  <h3>${feature.properties.name}</h3>
                  <p><strong>Diện tích:</strong> ${feature.properties.area}</p>
                  <p><strong>Dân số:</strong> ${feature.properties.population}</p>
                  <p><strong>Mật độ:</strong> ${feature.properties.density}</p>
                  <hr />
                  <p>Trường học: ${pois.schools.length}</p>
                  <p>Y tế: ${pois.hospitals.length}</p>
                  <p>Ăn uống: ${pois.restaurants.length}</p>
                  <p>Ngân hàng: ${pois.banks.length}</p>
                </div>
              `);
            }}
          />
        )}

        {/* POI Markers */}
        {!isLoadingPOIs && (
          <>
            {pois.schools.map((school, index) => {
              const coords = getCoordinates(school);
              if (!coords) return null;
              
              return (
                <Marker key={`school-${index}`} position={coords} icon={schoolIcon}>
                  <Popup>
                    <div>
                      <h4>🏫 Trường học</h4>
                      <p><strong>{school.tags?.name || 'Không rõ tên'}</strong></p>
                      {school.tags?.phone && <p>📞 {school.tags.phone}</p>}
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {pois.hospitals.map((hospital, index) => {
              const coords = getCoordinates(hospital);
              if (!coords) return null;
              
              return (
                <Marker key={`hospital-${index}`} position={coords} icon={hospitalIcon}>
                  <Popup>
                    <div>
                      <h4>🏥 Y tế</h4>
                      <p><strong>{hospital.tags?.name || 'Không rõ tên'}</strong></p>
                      <p>Loại: {hospital.tags?.amenity}</p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {pois.restaurants.map((restaurant, index) => {
              const coords = getCoordinates(restaurant);
              if (!coords) return null;
              
              return (
                <Marker key={`restaurant-${index}`} position={coords} icon={restaurantIcon}>
                  <Popup>
                    <div>
                      <h4>🍴 Ăn uống</h4>
                      <p><strong>{restaurant.tags?.name || 'Không rõ tên'}</strong></p>
                      {restaurant.tags?.cuisine && <p>Món: {restaurant.tags.cuisine}</p>}
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {pois.banks.map((bank, index) => {
              const coords = getCoordinates(bank);
              if (!coords) return null;
              
              return (
                <Marker key={`bank-${index}`} position={coords} icon={bankIcon}>
                  <Popup>
                    <div>
                      <h4>🏦 Ngân hàng</h4>
                      <p><strong>{bank.tags?.name || 'Không rõ tên'}</strong></p>
                      {bank.tags?.operator && <p>Ngân hàng: {bank.tags.operator}</p>}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </>
        )}
      </MapContainer>
    </div>
  );
};

export default SimpleMap;