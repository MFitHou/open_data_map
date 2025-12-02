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

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Marker, Popup, Circle } from 'react-leaflet';
import { getAmenityIcon, getPlaceName, getTopologyInfo, getIoTInfo, hasTopology, hasIoT } from '../../utils/nearbyApi';
import type { NearbyPlace } from '../../utils/nearbyApi';

interface NearbyMarkersProps {
  places: NearbyPlace[];
  searchCenter?: { lat: number; lon: number };
  searchRadiusKm?: number;
}

export const NearbyMarkers: React.FC<NearbyMarkersProps> = ({ places, searchCenter, searchRadiusKm }) => {
  const { t } = useTranslation();
  
  return (
    <>
      {/* Vòng tròn bán kính tìm kiếm */}
      {searchCenter && searchRadiusKm && (
        <Circle
          center={[searchCenter.lat, searchCenter.lon]}
          radius={searchRadiusKm * 1000} // Convert km to meters
          pathOptions={{
            color: '#3388ff',
            fillColor: '#3388ff',
            fillOpacity: 0.1,
            weight: 2,
            dashArray: '5, 5'
          }}
        />
      )}
      
      {places.map((place, idx) => {
        // Get awesome marker icon for this place type
        const icon = getAmenityIcon(place);

        return (
          <Marker
            key={idx}
            position={[place.lat, place.lon]}
            icon={icon}
          >
            <Popup>
              <div className="nearby-popup">
                <div className="nearby-popup-title">
                  {getPlaceName(place, idx)}
                </div>
                <div className="nearby-popup-content">
                  <div><strong>{t('map.nearby.type')}:</strong> {place.highway || place.amenity || place.leisure || 'N/A'}</div>
                  {place.brand && <div><strong>{t('map.nearby.brand')}:</strong> {place.brand}</div>}
                  {place.operator && <div><strong>{t('map.nearby.operator')}:</strong> {place.operator}</div>}
                  <div><strong>{t('map.nearby.distance')}:</strong> {(place.distanceKm * 1000).toFixed(0)}m</div>
                  
                  {/* Topology Relationships */}
                  {hasTopology(place) && (
                    <div className="nearby-popup-topology">
                      <strong>Relationships:</strong>
                      <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                        {getTopologyInfo(place).map((info, i) => (
                          <li key={i} style={{ fontSize: '12px' }}>{info}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* IoT Coverage */}
                  {hasIoT(place) && (
                    <div className="nearby-popup-iot">
                      <strong>IoT Coverage:</strong>
                      <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                        {getIoTInfo(place).map((info, i) => (
                          <li key={i} style={{ fontSize: '12px' }}>{info}</li>
                        ))}
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
        );
      })}
    </>
  );
};
