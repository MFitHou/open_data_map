/**
 * Copyright (C) 2025 MFitHou
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import API_CONFIG from '../config/api';

export interface TopologyRelatedEntity {
  poi: string;            // URI của entity liên quan
  name: string | null;    // Tên của entity liên quan
  lat: number | null;     // Vĩ độ
  lon: number | null;     // Kinh độ
  wkt: string | null;     // WKT format
  amenity: string | null;
  highway: string | null;
  leisure: string | null;
  brand: string | null;
  operator: string | null;
}

export interface TopologyRelation {
  predicate: string;      // isNextTo, containedInPlace, amenityFeature, healthcareNetwork, campusAmenity
  related: TopologyRelatedEntity; // Thông tin đầy đủ của entity liên quan
}

// Sensor data from InfluxDB
export interface SensorData {
  aqi: number | null;           // Air Quality Index
  temperature: number | null;   // Temperature in Celsius
  noise_level: number | null;   // Noise level in dB
  timestamp: string | null;     // ISO timestamp of last reading
}

export interface NearbyPlace {
  poi: string;
  amenity?: string;      
  highway?: string;      
  name: string | null;
  operator?: string | null;
  brand?: string;       
  wkt: string;
  lon: number;
  lat: number;
  distanceKm: number;
  access?: string;
  fee?: string;
  bottle?: string;       
  fountain?: string;     
  leisure?: string;      
  topology?: TopologyRelation[] | null;  
  iotStations?: string[] | null;         
  relatedEntities?: Partial<NearbyPlace>[];
  device?: string | null;         // IoT device URI covering this POI
  sensorData?: SensorData | null; // Sensor data from InfluxDB
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
 * Fetch nearby places with unified API
 * @param lon - Longitude
 * @param lat - Latitude  
 * @param radiusKm - Radius (km)
 * @param types - List of place types (atm, hospital, school, cafe, etc.) - if empty, query all
 * @param includeTopology - Include topology relationships (default: true)
 * @param includeIoT - Include IoT coverage (default: false)
 * @param language - Display language: 'vi', 'en', 'all' (default: 'en')
 */
export const fetchNearbyPlaces = async (
  lon: number,
  lat: number,
  radiusKm: number,
  types?: string[],
  includeTopology: boolean = true,
  includeIoT: boolean = false,
  language: string = 'en'
): Promise<NearbyResponse | null> => {
  try {
    const params = new URLSearchParams({
      lon: lon.toString(),
      lat: lat.toString(),
      radiusKm: radiusKm.toString(),
      includeTopology: includeTopology.toString(),
      includeIoT: includeIoT.toString(),
      language: language,
    });
    
    if (types && types.length > 0) {
      params.append('types', types.join(','));
    }
    
    const url = `${API_CONFIG.fusekiBaseUrl}/nearby?${params.toString()}`;
    
    console.log(`Fetching nearby places:`, { lon, lat, radiusKm, types, includeTopology, includeIoT, language });
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: NearbyResponse = await response.json();
    
    console.log(`Found ${data.count} places:`, data);
    
    return data;
  } catch (error) {
    console.error('Error fetching nearby places:', error);
    return null;
  }
};


export const fetchNearbyByAmenity = async (
  lon: number,
  lat: number,
  radiusKm: number,
  amenity: string
): Promise<NearbyResponse | null> => {
  return fetchNearbyPlaces(lon, lat, radiusKm, [amenity]);
};

import L from 'leaflet';
import 'leaflet.awesome-markers';


export const getAmenityIconEmoji = (place: NearbyPlace): string => {
  if (place.highway === 'bus_stop') return '🚌';
  if (place.amenity === 'toilets') return '🚻';
  if (place.amenity === 'atm') return '🏧';
  if (place.amenity === 'hospital') return '🏥';
  if (place.amenity === 'drinking_water') return '💧';
  if (place.amenity === 'charging_station') return '⚡';
  if (place.leisure === 'playground') return '🎮';
  if (place.leisure === 'park') return '🌳';
  return '📍';
};


export const getAmenityIcon = (place: NearbyPlace): L.AwesomeMarkers.Icon => {
  type MarkerColor = 'red' | 'darkred' | 'lightred' | 'orange' | 'beige' | 'green' | 'darkgreen' | 'lightgreen' | 'blue' | 'darkblue' | 'lightblue' | 'purple' | 'darkpurple' | 'pink' | 'cadetblue' | 'white' | 'gray' | 'lightgray' | 'black';

  if (place.highway) {
    if (place.highway === 'bus_stop') {
      return L.AwesomeMarkers.icon({
        icon: 'bus',
        markerColor: 'blue',
        prefix: 'fa',
        iconColor: 'white'
      });
    }
    return L.AwesomeMarkers.icon({
      icon: 'road',
      markerColor: 'gray',
      prefix: 'fa',
      iconColor: 'white'
    });
  }
  
  if (place.amenity) {
    const amenityConfig: Record<string, { icon: string; color: MarkerColor }> = {
      toilets: { icon: 'female', color: 'lightblue' },
      atm: { icon: 'credit-card', color: 'green' },
      hospital: { icon: 'hospital-o', color: 'red' },
      drinking_water: { icon: 'tint', color: 'lightblue' },
      charging_station: { icon: 'bolt', color: 'orange' },
      restaurant: { icon: 'cutlery', color: 'red' },
      cafe: { icon: 'coffee', color: 'cadetblue' },
      school: { icon: 'graduation-cap', color: 'purple' },
      pharmacy: { icon: 'plus-square', color: 'darkred' },
      police: { icon: 'shield', color: 'blue' },
      fire_station: { icon: 'fire-extinguisher', color: 'red' },
      bank: { icon: 'university', color: 'darkgreen' },
      parking: { icon: 'car', color: 'gray' },
      fuel: { icon: 'free-code-camp', color: 'orange' },
      fuel_station: { icon: 'free-code-camp', color: 'orange' },
      supermarket: { icon: 'shopping-cart', color: 'green' },
      library: { icon: 'book', color: 'purple' },
      convenience_store: { icon: 'shopping-bag', color: 'green' },
      park: { icon: 'tree', color: 'darkgreen' },
      playground: { icon: 'child', color: 'orange' },
      bus_stop: { icon: 'bus', color: 'blue' },
    };
    
    const config = amenityConfig[place.amenity];
    if (config) {
      console.log('[getAmenityIcon] Using amenity config:', place.amenity, config);
      return L.AwesomeMarkers.icon({
        icon: config.icon,
        markerColor: config.color,
        prefix: 'fa',
        iconColor: 'white'
      });
    }
    
    console.log('[getAmenityIcon] Unknown amenity, using default:', place.amenity);
    return L.AwesomeMarkers.icon({
      icon: 'map-marker',
      markerColor: 'darkblue',
      prefix: 'fa',
      iconColor: 'white'
    });
  }

  // Check leisure (playground, park, garden)
  if (place.leisure) {
    type MarkerColor = 'red' | 'darkred' | 'lightred' | 'orange' | 'beige' | 'green' | 'darkgreen' | 'lightgreen' | 'blue' | 'darkblue' | 'lightblue' | 'purple' | 'darkpurple' | 'pink' | 'cadetblue' | 'white' | 'gray' | 'lightgray' | 'black';
    const leisureConfig: Record<string, { icon: string; color: MarkerColor }> = {
      playground: { icon: 'child', color: 'orange' },
      park: { icon: 'tree', color: 'darkgreen' },
      garden: { icon: 'leaf', color: 'green' },
      sports_centre: { icon: 'soccer-ball-o', color: 'purple' },
      swimming_pool: { icon: 'swimmer', color: 'lightblue' },
    };
    
    const config = leisureConfig[place.leisure];
    if (config) {
      console.log('[getAmenityIcon] Using leisure config:', place.leisure, config);
      return L.AwesomeMarkers.icon({
        icon: config.icon,
        markerColor: config.color,
        prefix: 'fa',
        iconColor: 'white'
      });
    }
    
    console.log('[getAmenityIcon] Unknown leisure, using tree icon:', place.leisure);
    return L.AwesomeMarkers.icon({
      icon: 'tree',
      markerColor: 'green',
      prefix: 'fa',
      iconColor: 'white'
    });
  }
  
  // ✅ FALLBACK cuối cùng - luôn trả về icon hợp lệ
  console.warn('[getAmenityIcon] No type info found, using default marker:', place.name || place.poi);
  return L.AwesomeMarkers.icon({
    icon: 'map-marker',
    markerColor: 'cadetblue',
    prefix: 'fa',
    iconColor: 'white'
  });
};

/**
 * ✅ Helper: Lấy display name của place
 */
export const getPlaceName = (place: NearbyPlace, index: number): string => {
  // ✅ Ưu tiên name từ API (đã được deduplicate theo ngôn ngữ)
  if (place.name && place.name.trim()) return place.name;
  
  // ✅ Nếu có brand, hiển thị brand (cho ATMs)
  if (place.brand && place.brand.trim()) return place.brand;
  
  // ✅ Nếu có operator, hiển thị operator
  if (place.operator && place.operator.trim()) return place.operator;
  
  // ✅ Fallback name cho drinking water với thông tin chi tiết
  if (place.amenity === 'drinking_water') {
    const details: string[] = [];
    if (place.fountain) details.push(place.fountain);
    if (place.bottle === 'yes') details.push('bottle refill');
    if (place.fee === 'no') details.push('free');
    
    if (details.length > 0) {
      return `Drinking Water (${details.join(', ')})`;
    }
    return `Drinking Water #${index + 1}`;
  }
  
  // ✅ Fallback name cho leisure types
  if (place.leisure) {
    const leisureNames: Record<string, string> = {
      playground: 'Playground',
      park: 'Park',
      garden: 'Garden',
      sports_centre: 'Sports Centre',
      swimming_pool: 'Swimming Pool',
    };
    
    const name = leisureNames[place.leisure] || place.leisure;
    return `${name} #${index + 1}`;
  }
  
  // ✅ Fallback name
  if (place.highway) return `${place.highway} #${index + 1}`;
  if (place.amenity) return `${place.amenity} #${index + 1}`;
  
  return `Place #${index + 1}`;
};

/**
 * ✅ Helper: Lấy thông tin chi tiết của drinking water
 */
export const getDrinkingWaterDetails = (place: NearbyPlace): string[] => {
  const details: string[] = [];
  
  if (place.fountain) {
    const fountainTypes: Record<string, string> = {
      bubbler: '🚰 Bubbler fountain',
      drinking: '⛲ Drinking fountain',
    };
    details.push(fountainTypes[place.fountain] || `Fountain: ${place.fountain}`);
  }
  
  if (place.bottle === 'yes') {
    details.push('🍶 Bottle refill available');
  }
  
  if (place.fee === 'no') {
    details.push('💰 Free');
  } else if (place.fee === 'yes') {
    details.push('💵 Fee required');
  }
  
  if (place.access) {
    details.push(`🚪 Access: ${place.access}`);
  }
  
  return details;
};

/**
 * ✅ Helper: Kiểm tra xem place có phải là drinking water không
 */
export const isDrinkingWater = (place: NearbyPlace): boolean => {
  return place.amenity === 'drinking_water';
};

/**
 * ✅ Helper: Kiểm tra xem place có phải là playground không
 */
export const isPlayground = (place: NearbyPlace): boolean => {
  return place.leisure === 'playground';
};

/**
 * ✅ Helper: Lấy thông tin topology relationships
 */
export const getTopologyInfo = (place: NearbyPlace): string[] => {
  if (!place.topology || place.topology.length === 0) {
    return [];
  }
  
  const info: string[] = [];
  const predicateLabels: Record<string, string> = {
    isNextTo: '🔗 Bên cạnh',
    containedInPlace: '📍 Trong khu vực',
    amenityFeature: '🏢 Tiện ích',
    healthcareNetwork: '🏥 Mạng lưới y tế',
    campusAmenity: '🎓 Tiện ích khuôn viên',
  };
  
  for (const rel of place.topology) {
    const label = predicateLabels[rel.predicate] || rel.predicate;
    // Support both old (relatedName) and new (related.name) structure
    const relatedName = typeof rel.related === 'object' 
      ? (rel.related.name || rel.related.brand || 'Unknown')
      : ((rel as any).relatedName || 'Unknown');
    info.push(`${label}: ${relatedName}`);
  }
  
  return info;
};

/**
 * ✅ Helper: Lấy thông tin IoT stations
 */
export const getIoTInfo = (place: NearbyPlace): string[] => {
  if (!place.iotStations || place.iotStations.length === 0) {
    return [];
  }
  
  return place.iotStations.map(station => `📡 IoT: ${station}`);
};

/**
 * ✅ Helper: Kiểm tra xem place có topology relationships không
 */
export const hasTopology = (place: NearbyPlace): boolean => {
  return !!(place.topology && place.topology.length > 0);
};

/**
 * ✅ Helper: Kiểm tra xem place có IoT coverage không
 */
export const hasIoT = (place: NearbyPlace): boolean => {
  return !!(place.iotStations && place.iotStations.length > 0);
};

/**
 * Fetch full POI information by URI
 * Used when clicking on a topology related entity to get full details
 */
export const fetchPOIByUri = async (
  uri: string,
  language: string = 'en'
): Promise<NearbyPlace | null> => {
  try {
    const params = new URLSearchParams({
      uri: uri,
      language: language,
    });
    
    const url = `${API_CONFIG.fusekiBaseUrl}/poi?${params.toString()}`;
    
    console.log(`[fetchPOIByUri] Fetching POI:`, { uri, language });
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.found || !data.poi) {
      console.warn(`[fetchPOIByUri] POI not found:`, uri);
      return null;
    }
    
    console.log(`[fetchPOIByUri] Found POI:`, data.poi);
    
    return data.poi as NearbyPlace;
  } catch (error) {
    console.error('[fetchPOIByUri] Error:', error);
    return null;
  }
};