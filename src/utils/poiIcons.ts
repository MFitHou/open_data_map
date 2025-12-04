/**
 * Copyright (C) 2025 MFitHou
 * 
 * POI Type icons and classification utilities
 * Centralized definitions to avoid duplication across components
 */

// Icon mapping for amenity types
export const AMENITY_ICONS: Record<string, string> = {
  'hospital': '🏥',
  'school': '🏫',
  'restaurant': '🍴',
  'cafe': '☕',
  'bank': '🏦',
  'atm': '💳',
  'pharmacy': '💊',
  'fuel': '⛽',
  'parking': '🅿️',
  'police': '👮',
  'fire_station': '🚒',
  'bus_station': '🚌',
  'bus_stop': '🚏',
  'marketplace': '🛒',
  'place_of_worship': '⛪',
  'library': '📚',
  'cinema': '🎬',
  'theatre': '🎭',
  'museum': '🏛️',
  'gym': '🏋️',
  'swimming_pool': '🏊',
  'drinking_water': '💧',
  'toilets': '🚻',
  'toilet': '🚻',
  'post_office': '📮',
  'dentist': '🦷',
  'clinic': '🏥',
  'veterinary': '🐾',
  'university': '🎓',
  'kindergarten': '👶',
  'supermarket': '🛒',
  'convenience_store': '🏪',
  'charging_station': '🔌',
  'community_centre': '🏘️',
  'community_center': '🏘️',
  'warehouse': '🏭',
  'playground': '🎠',
  'park': '🌳',
  'waste_basket': '🗑️',
};

// Icon mapping for highway types
export const HIGHWAY_ICONS: Record<string, string> = {
  'bus_stop': '🚏',
  'default': '🛣️',
};

// Icon mapping for leisure types
export const LEISURE_ICONS: Record<string, string> = {
  'park': '🌳',
  'playground': '🎠',
  'default': '🎪',
};

// Default icon
export const DEFAULT_POI_ICON = '📍';

/**
 * Get icon for a POI based on its amenity, highway, or leisure type
 */
export function getPoiIcon(
  amenity?: string | null,
  highway?: string | null,
  leisure?: string | null
): string {
  if (amenity && AMENITY_ICONS[amenity]) {
    return AMENITY_ICONS[amenity];
  }
  
  if (highway) {
    return HIGHWAY_ICONS[highway] || HIGHWAY_ICONS['default'];
  }
  
  if (leisure) {
    return LEISURE_ICONS[leisure] || LEISURE_ICONS['default'];
  }
  
  return DEFAULT_POI_ICON;
}

/**
 * Get icon for a place object (NearbyPlace compatible)
 */
export function getPlaceIcon(place: {
  amenity?: string;
  highway?: string;
  leisure?: string;
}): string {
  return getPoiIcon(place.amenity, place.highway, place.leisure);
}

// Predicate display names in Vietnamese and English
export const PREDICATE_DISPLAY_NAMES: Record<string, { vi: string; en: string; icon: string }> = {
  // Schema.org predicates
  'isNextTo': { vi: 'Điểm lân cận', en: 'Next to', icon: '🤝' },
  'containedInPlace': { vi: 'Cùng phạm vi', en: 'Contained in', icon: '📍' },
  'containsPlace': { vi: 'Chứa', en: 'Contains', icon: '📦' },
  'amenityFeature': { vi: 'Tiện ích', en: 'Amenity', icon: '🏪' },
  'healthcareNetwork': { vi: 'Mạng lưới y tế', en: 'Healthcare Network', icon: '🏥' },
  'campusAmenity': { vi: 'Tiện ích khuôn viên', en: 'Campus Amenity', icon: '🏫' },
  'nearbyAttraction': { vi: 'Điểm tham quan gần', en: 'Nearby Attraction', icon: '🎯' },
  'publicAccess': { vi: 'Truy cập công cộng', en: 'Public Access', icon: '🚶' },
  
  // GeoSPARQL predicates
  'geo:sfWithin': { vi: 'Điểm lân cận', en: 'Within', icon: '📍' },
  'geo:sfContains': { vi: 'Chứa', en: 'Contains', icon: '📦' },
  'geo:sfTouches': { vi: 'Tiếp giáp', en: 'Touches', icon: '🤝' },
  'geo:sfIntersects': { vi: 'Giao cắt', en: 'Intersects', icon: '🔀' },
  'geo:sfNear': { vi: 'Gần', en: 'Near', icon: '📏' },
  'geo:sfOverlaps': { vi: 'Chồng lấp', en: 'Overlaps', icon: '🔲' },
  'geo:sfCrosses': { vi: 'Cắt qua', en: 'Crosses', icon: '✂️' },
  'geo:sfEquals': { vi: 'Trùng khớp', en: 'Equals', icon: '🟰' },
  
  // Default
  'other': { vi: 'Liên quan', en: 'Related', icon: '🔗' }
};

/**
 * Get display name for predicate based on language
 */
export function getPredicateDisplayName(predicate: string, language: string = 'en'): string {
  const displayInfo = PREDICATE_DISPLAY_NAMES[predicate] || PREDICATE_DISPLAY_NAMES['other'];
  const displayName = language === 'vi' ? displayInfo.vi : displayInfo.en;
  return `${displayInfo.icon} ${displayName}`;
}
