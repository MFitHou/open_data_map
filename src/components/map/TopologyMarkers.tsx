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
import { useTranslation } from 'react-i18next';
import { Marker, Popup, Circle, Polyline, CircleMarker } from 'react-leaflet';
import { getAmenityIcon, getPlaceName } from '../../utils/nearbyApi';
import type { NearbyPlace } from '../../utils/nearbyApi';

interface TopologyMarkersProps {
  places: NearbyPlace[];
  searchCenter?: { lat: number; lon: number };
  searchRadiusKm?: number;
  onPlaceSelect?: (place: NearbyPlace) => void;
}

export const TopologyMarkers: React.FC<TopologyMarkersProps> = ({ 
  places, 
  searchCenter, 
  searchRadiusKm,
  onPlaceSelect 
}) => {
  const { t } = useTranslation();
  const [selectedPlace, setSelectedPlace] = useState<NearbyPlace | null>(null);
  const [hoveredPlace, setHoveredPlace] = useState<string | null>(null);

  const handleMarkerClick = (place: NearbyPlace) => {
    console.log('[TopologyMarkers] Marker clicked:', place.name, '- NOT flying to location');
    setSelectedPlace(place);
    if (onPlaceSelect) {
      onPlaceSelect(place);
    }
  };

  const handleMarkerClose = () => {
    setSelectedPlace(null);
  };

  // Lấy tất cả related entities của place đang được chọn
  const getRelatedPois = (place: NearbyPlace): string[] => {
    if (!place.relatedEntities || place.relatedEntities.length === 0) {
      return [];
    }
    return place.relatedEntities.map(r => r.poi);
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
        return findPlaceByPoi(related.poi);
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

      {/* Vẽ đường nét đứt từ place đang chọn đến các related places */}
      {selectedPlace && getRelatedPlaces(selectedPlace).map((relatedPlace, idx) => (
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
      {places.map((place, idx) => {
        const icon = getAmenityIcon(place);
        const isRelated = isRelatedToSelected(place.poi);
        const isSelected = selectedPlace?.poi === place.poi;
        const isHovered = hoveredPlace === place.poi;

        return (
          <React.Fragment key={idx}>
            {/* Highlight cho selected place */}
            {isSelected && (
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
            >
              <Popup onClose={handleMarkerClose}>
                <div className="nearby-popup">
                  <div className="nearby-popup-title">
                    {getPlaceName(place, idx)}
                  </div>
                  <div className="nearby-popup-content">
                    <div><strong>{t('map.nearby.type')}:</strong> {place.highway || place.amenity || place.leisure || 'N/A'}</div>
                    {place.brand && <div><strong>{t('map.nearby.brand')}:</strong> {place.brand}</div>}
                    {place.operator && <div><strong>{t('map.nearby.operator')}:</strong> {place.operator}</div>}
                    <div><strong>{t('map.nearby.distance')}:</strong> {(place.distanceKm * 1000).toFixed(0)}m</div>
                    
                    {/* Related Entities */}
                    {place.relatedEntities && place.relatedEntities.length > 0 && (
                      <div className="nearby-popup-related">
                        <strong>🔗 Related Places ({place.relatedEntities.length}):</strong>
                        <ul style={{ margin: '4px 0', paddingLeft: '20px', maxHeight: '150px', overflowY: 'auto' }}>
                          {place.relatedEntities.map((related, i) => (
                            <li key={i} style={{ fontSize: '12px', marginBottom: '4px' }}>
                              <strong>{related.name || 'Unknown'}</strong>
                              {related.distanceKm && ` - ${(related.distanceKm * 1000).toFixed(0)}m`}
                              {related.amenity && (
                                <span style={{ color: '#666', fontSize: '11px' }}>
                                  {' '}({related.amenity})
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Topology Relationships */}
                    {place.topology && place.topology.length > 0 && (
                      <div className="nearby-popup-topology">
                        <strong>📍 Topology:</strong>
                        <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                          {place.topology.map((topo, i) => (
                            <li key={i} style={{ fontSize: '12px' }}>
                              {topo.predicate}: {topo.relatedName || 'Unknown'}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* IoT Coverage */}
                    {place.iotStations && place.iotStations.length > 0 && (
                      <div className="nearby-popup-iot">
                        <strong>📡 IoT Stations ({place.iotStations.length}):</strong>
                        <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                          {place.iotStations.slice(0, 3).map((station, i) => (
                            <li key={i} style={{ fontSize: '12px' }}>{station}</li>
                          ))}
                          {place.iotStations.length > 3 && (
                            <li style={{ fontSize: '11px', color: '#666' }}>
                              +{place.iotStations.length - 3} more...
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                    
                    <div className="nearby-popup-coords">
                      <a 
                        href={`https://www.google.com/maps?q=${place.lat},${place.lon}`} 
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {place.lat.toFixed(6)}, {place.lon.toFixed(6)} ↗
                      </a>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          </React.Fragment>
        );
      })}
    </>
  );
};
