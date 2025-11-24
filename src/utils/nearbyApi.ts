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
      atm: '🏧',
      hospital: '🏥',
      drinking_water: '💧',   // ✅ Thêm icon cho drinking water
    };
    return amenityIcons[place.amenity] || '📍';
  }

  // ✅ Kiểm tra leisure (playground)
  if (place.leisure) {
    const leisureIcons: Record<string, string> = {
      playground: '🎮',
    };
    return leisureIcons[place.leisure] || '🎯';
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