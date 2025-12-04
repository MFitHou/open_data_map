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

import React, { useState, useEffect } from 'react';
import { Marker, Circle, Polyline, CircleMarker } from 'react-leaflet';
import { getAmenityIcon } from '../../utils/nearbyApi';
import type { NearbyPlace, TopologyRelation } from '../../utils/nearbyApi';

interface TopologyMarkersProps {
  places: NearbyPlace[];
  searchCenter?: { lat: number; lon: number };
  searchRadiusKm?: number;
  onPlaceSelect?: (place: NearbyPlace) => void;
  selectedServicePlace?: NearbyPlace | null; // Place selected in ServiceInfoPanel
  hoveredTopology?: { topology: TopologyRelation; sourcePlace: NearbyPlace } | null; // Hovered topology from ServiceInfoPanel
}

export const TopologyMarkers: React.FC<TopologyMarkersProps> = ({ 
  places, 
  searchCenter, 
  searchRadiusKm,
  onPlaceSelect,
  selectedServicePlace,
  hoveredTopology
}) => {
  const [selectedPlace, setSelectedPlace] = useState<NearbyPlace | null>(null);
  const [hoveredPlace, setHoveredPlace] = useState<string | null>(null);

  const handleMarkerClick = (place: NearbyPlace) => {
    console.log('[TopologyMarkers] Marker clicked:', place.name, '- Opening ServiceInfoPanel');
    setSelectedPlace(place);
    if (onPlaceSelect) {
      onPlaceSelect(place);
    }
  };

  // Lấy tất cả related entities của place đang được chọn
  const getRelatedPois = (place: NearbyPlace): string[] => {
    if (!place.relatedEntities || place.relatedEntities.length === 0) {
      return [];
    }
    return place.relatedEntities.map(r => r.poi).filter((poi): poi is string => poi !== undefined);
  };

  // Kiểm tra xem POI có phải là related entity của place đang chọn không
  const isRelatedToSelected = (poi: string): boolean => {
    if (!selectedPlace) return false;
    return getRelatedPois(selectedPlace).includes(poi);
  };

  // Tìm place theo POI URI
  const findPlaceByPoi = (poi: string): NearbyPlace | undefined => {
    return places.find(p => p.poi === poi);
  };

  // Tạo các related entities với thông tin đầy đủ
  const getRelatedPlaces = (place: NearbyPlace): NearbyPlace[] => {
    if (!place.relatedEntities) return [];
    
    return place.relatedEntities
      .map(related => {
        // Nếu related entity có đầy đủ thông tin từ backend (POI data)
        if (related.lon !== null && related.lon !== undefined && 
            related.lat !== null && related.lat !== undefined) {
          // Related entity từ backend đã có đầy đủ thông tin
          return {
            ...related,
            name: related.name || 'Unknown',
            distanceKm: related.distanceKm || 0
          } as NearbyPlace;
        }
        // Nếu không, tìm trong danh sách places hiện có
        return related.poi ? findPlaceByPoi(related.poi) : undefined;
      })
      .filter((p): p is NearbyPlace => {
        return p !== undefined && 
               p.lon !== null && p.lon !== undefined && 
               p.lat !== null && p.lat !== undefined;
      });
  };

  // Debug: Log whenever places prop changes
  useEffect(() => {
    console.log('[TopologyMarkers] Received', places.length, 'places to render');
    console.log('[TopologyMarkers] Places:', places.map(p => ({ 
      name: p.name, 
      lon: p.lon, 
      lat: p.lat,
      amenity: p.amenity,
      highway: p.highway,
      leisure: p.leisure,
      hasRelated: !!(p.relatedEntities && p.relatedEntities.length > 0)
    })));
  }, [places]);

  return (
    <>
      {/* Vòng tròn bán kính tìm kiếm */}
      {searchCenter && searchRadiusKm && (
        <Circle
          center={[searchCenter.lat, searchCenter.lon]}
          radius={searchRadiusKm * 1000}
          pathOptions={{
            color: '#3388ff',
            fillColor: '#3388ff',
            fillOpacity: 0.1,
            weight: 2,
            dashArray: '5, 5'
          }}
        />
      )}

      {/* Vẽ đường kết nối khi hover topology từ ServiceInfoPanel */}
      {hoveredTopology && hoveredTopology.topology.related && (() => {
        const related = hoveredTopology.topology.related;
        const sourceLat = hoveredTopology.sourcePlace.lat;
        const sourceLon = hoveredTopology.sourcePlace.lon;
        
        // Get target coordinates from related object
        let targetLat: number | null = null;
        let targetLon: number | null = null;
        
        if (typeof related === 'object') {
          targetLat = related.lat;
          targetLon = related.lon;
        }
        
        // If no coordinates in related, try to find in places
        if (targetLat === null || targetLon === null) {
          const relatedPoi = typeof related === 'object' ? related.poi : related;
          const foundPlace = places.find(p => p.poi === relatedPoi);
          if (foundPlace) {
            targetLat = foundPlace.lat;
            targetLon = foundPlace.lon;
          }
        }
        
        if (targetLat !== null && targetLon !== null && 
            typeof targetLat === 'number' && !isNaN(targetLat) &&
            typeof targetLon === 'number' && !isNaN(targetLon) &&
            typeof sourceLat === 'number' && !isNaN(sourceLat) &&
            typeof sourceLon === 'number' && !isNaN(sourceLon)) {
          return (
            <React.Fragment>
              {/* Animated connection line */}
              <Polyline
                positions={[
                  [sourceLat, sourceLon],
                  [targetLat, targetLon]
                ]}
                pathOptions={{
                  color: '#ff6b6b',
                  weight: 3,
                  dashArray: '10, 10',
                  opacity: 1
                }}
              />
              
              {/* Highlight source place */}
              <CircleMarker
                center={[sourceLat, sourceLon]}
                radius={18}
                pathOptions={{
                  color: '#4CAF50',
                  fillColor: '#4CAF50',
                  fillOpacity: 0.3,
                  weight: 3
                }}
              />
              
              {/* Highlight target place */}
              <CircleMarker
                center={[targetLat, targetLon]}
                radius={18}
                pathOptions={{
                  color: '#ff6b6b',
                  fillColor: '#ff6b6b',
                  fillOpacity: 0.3,
                  weight: 3
                }}
              />
            </React.Fragment>
          );
        }
        return null;
      })()}

      {/* Vẽ đường nét đứt từ place đang chọn đến các related places */}
      {selectedPlace && getRelatedPlaces(selectedPlace)
        .filter(relatedPlace => 
          typeof relatedPlace.lat === 'number' && !isNaN(relatedPlace.lat) &&
          typeof relatedPlace.lon === 'number' && !isNaN(relatedPlace.lon) &&
          typeof selectedPlace.lat === 'number' && !isNaN(selectedPlace.lat) &&
          typeof selectedPlace.lon === 'number' && !isNaN(selectedPlace.lon)
        )
        .map((relatedPlace, idx) => (
        <React.Fragment key={`line-${idx}`}>
          {/* Đường nét đứt */}
          <Polyline
            positions={[
              [selectedPlace.lat, selectedPlace.lon],
              [relatedPlace.lat, relatedPlace.lon]
            ]}
            pathOptions={{
              color: '#ff6b6b',
              weight: 2,
              dashArray: '10, 10',
              opacity: 0.8
            }}
          />
          
          {/* Highlight related place với circle */}
          <CircleMarker
            center={[relatedPlace.lat, relatedPlace.lon]}
            radius={15}
            pathOptions={{
              color: '#ff6b6b',
              fillColor: '#ff6b6b',
              fillOpacity: 0.2,
              weight: 2
            }}
          />
        </React.Fragment>
      ))}

      {/* Main markers */}
      {places
        .filter(place => 
          typeof place.lat === 'number' && !isNaN(place.lat) &&
          typeof place.lon === 'number' && !isNaN(place.lon)
        )
        .map((place, idx) => {
        const icon = getAmenityIcon(place);
        const isRelated = isRelatedToSelected(place.poi);
        const isSelected = selectedPlace?.poi === place.poi;
        const isServiceSelected = selectedServicePlace?.poi === place.poi; // Selected in ServiceInfoPanel
        const isHovered = hoveredPlace === place.poi;

        return (
          <React.Fragment key={idx}>
            {/* Highlight cho service selected place (from ServiceInfoPanel) */}
            {isServiceSelected && (
              <CircleMarker
                center={[place.lat, place.lon]}
                radius={22}
                pathOptions={{
                  color: '#667eea',
                  fillColor: '#667eea',
                  fillOpacity: 0.3,
                  weight: 3
                }}
              />
            )}
            
            {/* Highlight cho selected place */}
            {isSelected && !isServiceSelected && (
              <CircleMarker
                center={[place.lat, place.lon]}
                radius={20}
                pathOptions={{
                  color: '#4CAF50',
                  fillColor: '#4CAF50',
                  fillOpacity: 0.3,
                  weight: 3
                }}
              />
            )}

            {/* Highlight cho hovered place */}
            {isHovered && !isSelected && (
              <CircleMarker
                center={[place.lat, place.lon]}
                radius={15}
                pathOptions={{
                  color: '#2196F3',
                  fillColor: '#2196F3',
                  fillOpacity: 0.2,
                  weight: 2
                }}
              />
            )}

            <Marker
              position={[place.lat, place.lon]}
              icon={icon}
              eventHandlers={{
                click: () => handleMarkerClick(place),
                mouseover: () => setHoveredPlace(place.poi),
                mouseout: () => setHoveredPlace(null),
              }}
              opacity={isSelected || isRelated ? 1 : (selectedPlace ? 0.5 : 1)}
            />
          </React.Fragment>
        );
      })}
    </>
  );
};
