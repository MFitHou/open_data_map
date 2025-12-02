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

import { getApiEndpoint } from '../config/api';
import API_CONFIG from '../config/api';

export interface TopologyRelation {
  predicate: string;      // isNextTo, containedInPlace, amenityFeature, healthcareNetwork, campusAmenity
  related: string;        // URI của entity liên quan
  relatedName: string;    // Tên của entity liên quan
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
 * ✅ Fetch nearby places với unified API
 * @param lon - Kinh độ
 * @param lat - Vĩ độ  
 * @param radiusKm - Bán kính (km)
 * @param types - Danh sách loại địa điểm (atm, hospital, school, cafe, etc.) - nếu empty thì query tất cả
 * @param includeTopology - Có lấy topology relationships không (mặc định: true)
 * @param includeIoT - Có lấy IoT coverage không (mặc định: false)
 * @param language - Ngôn ngữ hiển thị: 'vi', 'en', 'all' (mặc định: 'vi')
 */
export const fetchNearbyPlaces = async (
  lon: number,
  lat: number,
  radiusKm: number,
  types?: string[],
  includeTopology: boolean = true,
  includeIoT: boolean = false,
  language: string = 'vi'
): Promise<NearbyResponse | null> => {
  try {
    // ✅ Unified API: /fuseki/nearby
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
    const amenityConfig: Record<string, { icon: string; color: string }> = {
      toilets: { icon: 'female', color: 'lightblue' },
      atm: { icon: 'credit-card', color: 'green' },
      hospital: { icon: 'hospital', color: 'red' },
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
      fuel: { icon: 'gas-pump', color: 'orange' },
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

  // ✅ Kiểm tra leisure (playground, park, garden)
  if (place.leisure) {
    const leisureConfig: Record<string, { icon: string; color: string }> = {
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
    info.push(`${label}: ${rel.relatedName}`);
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