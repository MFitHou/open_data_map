import { MapContainer, TileLayer, Marker, GeoJSON, ZoomControl, useMap, Polyline, Popup, Polygon } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState, useCallback } from "react";
import { Search } from "./Search";
import { SearchResult } from "./SearchResult";
import { InfoPanel } from './InfoPanel';
import { loadATMsWithStats } from "../../utils/rdfParser";
import { fetchOutlineByOSMRelationId } from '../../utils/overpass';

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

// ✅ Thêm interface cho ATMData
interface ATMData {
  name: string;
  lat: number;
  lon: number;
  bank?: string;
}

const SimpleMap: React.FC = () => {
  const [wardData, setWardData] = useState<any>(null);
  // ✅ Loại bỏ state POIs
  // const [pois, setPois] = useState<{...}>({...});
  
  // ✅ Thêm state cho members
  const [wardMembers, setWardMembers] = useState<{
    innerWays: any[];
    outerWays: any[];
    nodes: any[];
    subAreas: any[];
  }>({
    innerWays: [],
    outerWays: [],
    nodes: [],
    subAreas: []
  });
  
  const [wardId, setWardId] = useState<number | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lon: number} | null>(null);
  const [searchMarker, setSearchMarker] = useState<{lat: number, lon: number, name: string} | null>(null);
  const [highlightBounds, setHighlightBounds] = useState<number[][] | null>(null);
  const [highlightName, setHighlightName] = useState<string>("");
  const [isLoadingBoundary, setIsLoadingBoundary] = useState(false);
  // ✅ Loại bỏ isLoadingPOIs
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
  const [atmData, setAtmData] = useState<ATMData[]>([]);
  const [atmStats, setAtmStats] = useState<Record<string, number>>({});
  const [isLoadingATM, setIsLoadingATM] = useState(false);
  const [selectedInfo, setSelectedInfo] = useState<{
    category: string;
    title: string;
    subtitle?: string;
    rows: { label: string; value: string }[];
    wikidataId?: string;
    coordinates?: [number, number];
    identifiers?: any;
    statements?: any;
    osmId?: string;
    osmType?: string;
    members?: any; // ✅ Thêm members vào selectedInfo
  } | null>(null);

  const [outlineGeoJSON, setOutlineGeoJSON] = useState<any>(null);
  const [memberOutline, setMemberOutline] = useState<{
    coordinates: number[][];
    name: string;
    type: string;
  } | null>(null);
  const [memberNames, setMemberNames] = useState<Record<number, string>>({}); // ✅ Thêm state

  const handleOutlineLoaded = useCallback((geo: any) => {
    setOutlineGeoJSON(geo);
  }, []);

  // Load ATM data từ Fuseki
  useEffect(() => {
    (async () => {
      setIsLoadingATM(true);
      const { atms, stats } = await loadATMsWithStats('http://localhost:3000/fuseki/atms');
      setAtmData(atms);
      setAtmStats(stats);
      setIsLoadingATM(false);
    })();
  }, []);

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

  // Thay load outline: ưu tiên dùng 1 API (relation id)
  const loadOutlineByResult = async (result: any) => {
    try {
      let relId: number | null = null;

      // Lấy từ identifiers.osmRelationId hoặc osmId nếu osmType=relation
      if (result.identifiers?.osmRelationId) {
        relId = Number(result.identifiers.osmRelationId);
      } else if (result.osmType === 'relation' && result.osmId) {
        relId = Number(result.osmId);
      }

      if (!relId) {
        console.warn('Không có OSM Relation ID để vẽ outline');
        setOutlineGeoJSON(null);
        return;
      }

      const outline = await fetchOutlineByOSMRelationId(relId);
      if (outline.geojson) {
        setOutlineGeoJSON(outline.geojson);
        setWardId(relId);
      } else {
        console.warn('Outline rỗng:', outline.source);
        setOutlineGeoJSON(null);
      }
    } catch (e) {
      console.error('Lỗi fetch outline:', e);
      setOutlineGeoJSON(null);
    }
  };

  // HANDLER KHI USER CLICK VÀO KẾT QUẢ TÌM KIẾM
  const handleSelectLocation = async (result: any) => {
    setOutlineGeoJSON(null);
    setMemberNames({}); // ✅ Reset

    setSelectedInfo({
      category: result.type || 'search',
      title: result.name,
      subtitle: result.description,
      wikidataId: result.wikidataId,
      coordinates: [result.lon, result.lat],
      identifiers: result.identifiers,
      statements: result.statements,
      osmId: result.osmId,
      osmType: result.osmType,
      rows: makeRows({
        'Loại': result.instanceOf,
        'Nguồn': 'Wikidata SPARQL'
      })
    });
    
    setHighlightBounds(null);
    setHighlightName("");
    setSelectedLocation({ lat: result.lat, lon: result.lon });
    setSearchMarker({ lat: result.lat, lon: result.lon, name: result.name });
    setWardData(null);
    setWardMembers({ innerWays: [], outerWays: [], nodes: [], subAreas: [] });
    setWardStats({ calculatedArea: 0, population: null, officialArea: null, density: null });

    let osmRelationId: number | null = null;
    
    if (result.identifiers?.osmRelationId) {
      osmRelationId = Number(result.identifiers.osmRelationId);
    } else if (result.osmType === 'relation' && result.osmId) {
      osmRelationId = Number(result.osmId);
    }

    if (!osmRelationId) {
      console.warn('Không có OSM Relation ID để fetch boundary');
      setIsLoadingBoundary(false);
      return;
    }

    setIsLoadingBoundary(true);

    const locationQuery = `
[out:json][timeout:25];
relation(${osmRelationId});
out geom;
`.trim();

    try {
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `data=${encodeURIComponent(locationQuery)}`
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
          const innerWays = element.members.filter((m: any) => m.role === 'inner' && m.type === 'way');
          const outerWays = element.members.filter((m: any) => m.role === 'outer' && m.type === 'way');
          const nodes = element.members.filter((m: any) => m.type === 'node');
          const subAreas = element.members.filter((m: any) => m.type === 'relation');

          setWardMembers({ innerWays, outerWays, nodes, subAreas });

          // ✅ Fetch tên cho sub-areas ngay lập tức
          if (subAreas.length > 0) {
            const relationIds = subAreas.map((m: any) => m.ref).join(',');
            const nameQuery = `
[out:json][timeout:25];
relation(id:${relationIds});
out tags;
`.trim();

            fetch('https://overpass-api.de/api/interpreter', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: `data=${encodeURIComponent(nameQuery)}`
            })
            .then(res => res.json())
            .then(nameData => {
              const names: Record<number, string> = {};
              nameData.elements?.forEach((el: any) => {
                const name = el.tags?.name || 
                            el.tags?.['name:vi'] || 
                            el.tags?.['name:en'] || 
                            el.tags?.official_name;
                if (name) {
                  names[el.id] = name;
                }
              });
              setMemberNames(names);
            })
            .catch(err => console.error('Error fetching relation names:', err));
          }

          setSelectedInfo(prev => prev ? {
            ...prev,
            members: {
              innerWays: innerWays.length,
              outerWays: outerWays.length,
              nodes: nodes.length,
              subAreas: subAreas.length,
              total: element.members.length,
              details: element.members.map((m: any) => ({
                type: m.type,
                ref: m.ref,
                role: m.role,
                tags: m.tags
              }))
            }
          } : null);

          const outerGeometry = element.members
            .filter((member: any) => member.role === 'outer' && member.geometry);

          if (outerGeometry.length > 0) {
            const wayGeometries = outerGeometry.map((way: any) => way.geometry);
            const connectedCoords = connectWays(wayGeometries);

            if (connectedCoords.length > 0) {
              const firstPoint = connectedCoords[0];
              const lastPoint = connectedCoords[connectedCoords.length - 1];
              if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
                connectedCoords.push(firstPoint);
              }

              const leafletCoords = connectedCoords.map(coord => [coord[1], coord[0]]);
              setHighlightBounds(leafletCoords);
              setHighlightName(result.name);

              const calculatedArea = calculatePolygonArea(connectedCoords);
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

  // HANDLER KHI USER CLICK VÀO MEMBER TRONG INFO PANEL
  const handleMemberClick = async (member: { type: string; ref: number; role?: string }) => {
    console.log('Fetching member:', member);
    
    const query = `
[out:json][timeout:25];
${member.type}(${member.ref});
out geom;
`.trim();

    try {
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `data=${encodeURIComponent(query)}`
      });

      if (!response.ok) {
        console.error('Failed to fetch member:', response.status);
        return;
      }

      const data = await response.json();
      
      if (data.elements && data.elements.length > 0) {
        const element = data.elements[0];
        
        if (member.type === 'node') {
          // Hiển thị marker cho node
          if (element.lat && element.lon) {
            setSelectedLocation({ lat: element.lat, lon: element.lon });
            setSearchMarker({
              lat: element.lat,
              lon: element.lon,
              name: element.tags?.name || `Node ${member.ref}`
            });
            setMemberOutline(null);
          }
        } else if (member.type === 'way') {
          // Vẽ outline cho way - màu xanh da trời
          if (element.geometry) {
            const coords = element.geometry.map((g: any) => [g.lon, g.lat]);
            setMemberOutline({
              coordinates: coords,
              name: element.tags?.name || `Way ${member.ref}`,
              type: 'way'
            });
            
            // Center map
            if (coords.length > 0) {
              const centerLat = coords.reduce((sum: number, c: number[]) => sum + c[1], 0) / coords.length;
              const centerLon = coords.reduce((sum: number, c: number[]) => sum + c[0], 0) / coords.length;
              setSelectedLocation({ lat: centerLat, lon: centerLon });
            }
          }
        } else if (member.type === 'relation') {
          // Vẽ outline cho relation - màu vàng
          if (element.members) {
            const outerWays = element.members
              .filter((m: any) => m.role === 'outer' && m.geometry);

            if (outerWays.length > 0) {
              const wayGeometries = outerWays.map((way: any) => way.geometry);
              const connectedCoords = connectWays(wayGeometries);

              if (connectedCoords.length > 0) {
                // Đóng polygon
                const firstPoint = connectedCoords[0];
                const lastPoint = connectedCoords[connectedCoords.length - 1];
                if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
                  connectedCoords.push(firstPoint);
                }

                setMemberOutline({
                  coordinates: connectedCoords,
                  name: element.tags?.name || `Relation ${member.ref}`,
                  type: 'relation'
                });

                // Center map
                const centerLat = connectedCoords.reduce((sum, c) => sum + c[1], 0) / connectedCoords.length;
                const centerLon = connectedCoords.reduce((sum, c) => sum + c[0], 0) / connectedCoords.length;
                setSelectedLocation({ lat: centerLat, lon: centerLon });
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching member:', error);
    }
  };

  const makeRows = (obj: Record<string, any>): { label: string; value: string }[] =>
    Object.entries(obj)
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .map(([k, v]) => ({ label: k, value: String(v) }));

  // ✅ STYLE CHO OUTLINE (ĐỎ, NÉT ĐỨT)
  const outlineStyle = {
    color: '#ff0000',
    weight: 3,
    opacity: 0.8,
    dashArray: '10, 5',
    fillOpacity: 0
  };

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <Search onSelectLocation={handleSelectLocation} />

      {selectedInfo && (
        <InfoPanel
          data={selectedInfo}
          onClose={() => {
            setSelectedInfo(null);
            setOutlineGeoJSON(null);
            setMemberOutline(null);
            setMemberNames({}); // ✅ Clear
          }}
          onMemberClick={handleMemberClick}
          memberNames={memberNames} // ✅ Pass xuống
        />
      )}

      <MapContainer
        center={[21.0285, 105.8542]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        attributionControl={false}
        zoomControl={false}
      >
        <ZoomControl position="bottomright" />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {highlightBounds && highlightBounds.length > 0 && (
          <SearchResult
            bounds={highlightBounds}
            name={highlightName}
            color="#ff6b6b"
          />
        )}

        {/* ✅ Hiển thị member outline với màu theo type */}
        {memberOutline && memberOutline.type === 'way' && (
          <Polyline
            positions={memberOutline.coordinates.map(c => [c[1], c[0]])}
            color="#2196F3"
            weight={4}
            opacity={0.9}
          >
            <Popup>
              <strong>{memberOutline.name}</strong>
              <br />
              Type: Way
            </Popup>
          </Polyline>
        )}

        {memberOutline && memberOutline.type === 'relation' && (
          <Polygon
            positions={memberOutline.coordinates.map(c => [c[1], c[0]])}
            pathOptions={{
              color: '#FFA000',
              fillColor: '#FFC107',
              weight: 3,
              opacity: 0.9,
              fillOpacity: 0.4
            }}
          >
            <Popup>
              <strong>{memberOutline.name}</strong>
              <br />
              Type: Relation
            </Popup>
          </Polygon>
        )}

        {searchMarker && (
          <Marker
            position={[searchMarker.lat, searchMarker.lon]}
            icon={searchIcon}
          >
            <Popup>{searchMarker.name}</Popup>
          </Marker>
        )}

        {selectedLocation && (
          <FlyToLocation 
            lat={selectedLocation.lat} 
            lon={selectedLocation.lon}
            zoom={15}
          />
        )}

        {wardData && (
          <GeoJSON
            key={wardId}
            data={wardData}
            style={wardStyle}
            onEachFeature={(feature, layer) => {
              layer.on('click', () => {
                setSelectedInfo({
                  category: 'ward',
                  title: `Đơn vị hành chính`,
                  subtitle: feature.properties.name,
                  rows: makeRows({
                    'Diện tích tính': feature.properties.area,
                    'Dân số': feature.properties.population,
                    'Mật độ': feature.properties.density,
                    'Trường học': pois.schools.length,
                    'Y tế': pois.hospitals.length,
                    'Ăn uống': pois.restaurants.length,
                    'Ngân hàng': pois.banks.length
                  })
                });
              });
            }}
          />
        )}

        {/* ✅ VẼ OUTLINE TỪ OVERPASS (ĐỎ, NÉT ĐỨT) */}
        {outlineGeoJSON && (
          <GeoJSON
            key={JSON.stringify(outlineGeoJSON)}
            data={outlineGeoJSON}
            style={outlineStyle}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default SimpleMap;