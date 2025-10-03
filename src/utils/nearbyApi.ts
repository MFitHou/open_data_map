export interface NearbyPlace {
  poi: string;
  amenity?: string;      // ✅ Optional vì bus_stop dùng highway
  highway?: string;      // ✅ Thêm field highway
  name: string | null;
  operator?: string | null;
  brand?: string;        // ✅ Thêm field brand (cho ATMs)
  wkt: string;
  lon: number;
  lat: number;
  distanceKm: number;
  access?: string;
  fee?: string;
}

export interface NearbyResponse {
  center: {
    lon: number;
    lat: number;
  };
  radiusKm: number;
  count: number;
  items: NearbyPlace[];
}

/**
 * ✅ Fetch nearby places với API động theo amenity
 * @param lon - Kinh độ
 * @param lat - Vĩ độ  
 * @param radiusKm - Bán kính (km)
 * @param amenity - Loại địa điểm (toilets, hospitals, bus-stops, atms...)
 */
export const fetchNearbyPlaces = async (
  lon: number,
  lat: number,
  radiusKm: number,
  amenity: string
): Promise<NearbyResponse | null> => {
  try {
    // ✅ API động: /fuseki/{amenity}/nearby
    const url = `http://localhost:3000/fuseki/${amenity}/nearby?lon=${lon}&lat=${lat}&radiusKm=${radiusKm}`;
    
    console.log(`🔍 Fetching nearby ${amenity}:`, url);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: NearbyResponse = await response.json();
    
    console.log(`✅ Found ${data.count} ${amenity}:`, data);
    
    return data;
  } catch (error) {
    console.error('❌ Error fetching nearby places:', error);
    return null;
  }
};

/**
 * ✅ Cập nhật icons cho các amenity/highway types
 */
export const getAmenityIcon = (place: NearbyPlace): string => {
  // ✅ Ưu tiên highway trước (cho bus stops)
  if (place.highway) {
    const highwayIcons: Record<string, string> = {
      bus_stop: '🚌',
    };
    return highwayIcons[place.highway] || '🚏';
  }
  
  // ✅ Fallback về amenity
  if (place.amenity) {
    const amenityIcons: Record<string, string> = {
      toilets: '🚻',
      atm: '🏧',        // ✅ Sửa từ 'atms' thành 'atm' (singular)
      hospital: '🏥',   // ✅ Sửa từ 'hospitals' thành 'hospital' (singular)
    };
    return amenityIcons[place.amenity] || '📍';
  }
  
  return '📍';
};

/**
 * ✅ Helper: Lấy display name của place
 */
export const getPlaceName = (place: NearbyPlace, index: number): string => {
  if (place.name) return place.name;
  
  // ✅ Nếu có brand, hiển thị brand (cho ATMs)
  if (place.brand) return place.brand;
  
  // ✅ Fallback name
  if (place.highway) return `${place.highway} #${index + 1}`;
  if (place.amenity) return `${place.amenity} #${index + 1}`;
  
  return `Place #${index + 1}`;
};