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
  bottle?: string;       // ✅ Thêm field bottle (cho drinking_water)
  fountain?: string;     // ✅ Thêm field fountain (cho drinking_water)
  leisure?: string;      // ✅ Thêm field leisure (cho playground)
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
 * @param amenity - Loại địa điểm (toilets, hospitals, bus-stops, atms, drinking-water, playgrounds...)
 */
export const fetchNearbyPlaces = async (
  lon: number,
  lat: number,
  radiusKm: number,
  amenity: string
): Promise<NearbyResponse | null> => {
  try {
    // ✅ API động: /fuseki/{amenity}/nearby
    const url = `${getApiEndpoint.fusekiNearby(amenity)}?lon=${lon}&lat=${lat}&radiusKm=${radiusKm}`;
    
    console.log(`Fetching nearby ${amenity}:`, url);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: NearbyResponse = await response.json();
    
    console.log(`Found ${data.count} ${amenity}:`, data);
    
    return data;
  } catch (error) {
    console.error('Error fetching nearby places:', error);
    return null;
  }
};

import L from 'leaflet';
import 'leaflet.awesome-markers';

/**
 * ✅ Get emoji icon string for display in UI text
 */
export const getAmenityIconEmoji = (place: NearbyPlace): string => {
  if (place.highway === 'bus_stop') return '🚌';
  if (place.amenity === 'toilets') return '🚻';
  if (place.amenity === 'atm') return '🏧';
  if (place.amenity === 'hospital') return '🏥';
  if (place.amenity === 'drinking_water') return '💧';
  if (place.leisure === 'playground') return '🎮';
  return '📍';
};

/**
 * ✅ Cập nhật icons cho các amenity/highway types sử dụng leaflet.awesome-markers
 */
export const getAmenityIcon = (place: NearbyPlace): L.AwesomeMarkers.Icon => {
  // ✅ Ưu tiên highway trước (cho bus stops)
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
  
  // ✅ Fallback về amenity
  if (place.amenity) {
    const amenityConfig: Record<string, { icon: string; color: string }> = {
      toilets: { icon: 'female', color: 'lightblue' },
      atm: { icon: 'credit-card', color: 'green' },
      hospital: { icon: 'hospital', color: 'red' },
      drinking_water: { icon: 'tint', color: 'lightblue' },
    };
    
    const config = amenityConfig[place.amenity];
    if (config) {
      return L.AwesomeMarkers.icon({
        icon: config.icon,
        markerColor: config.color,
        prefix: 'fa',
        iconColor: 'white'
      });
    }
    
    return L.AwesomeMarkers.icon({
      icon: 'map-marker',
      markerColor: 'darkblue',
      prefix: 'fa',
      iconColor: 'white'
    });
  }

  // ✅ Kiểm tra leisure (playground)
  if (place.leisure) {
    if (place.leisure === 'playground') {
      return L.AwesomeMarkers.icon({
        icon: 'child',
        markerColor: 'orange',
        prefix: 'fa',
        iconColor: 'white'
      });
    }
    return L.AwesomeMarkers.icon({
      icon: 'tree',
      markerColor: 'green',
      prefix: 'fa',
      iconColor: 'white'
    });
  }
  
  return L.AwesomeMarkers.icon({
    icon: 'map-marker',
    markerColor: 'darkblue',
    prefix: 'fa',
    iconColor: 'white'
  });
};

/**
 * ✅ Helper: Lấy display name của place
 */
export const getPlaceName = (place: NearbyPlace, index: number): string => {
  if (place.name) return place.name;
  
  // ✅ Nếu có brand, hiển thị brand (cho ATMs)
  if (place.brand) return place.brand;
  
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
  
  // ✅ Fallback name cho playground
  if (place.leisure === 'playground') {
    return `Playground #${index + 1}`;
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