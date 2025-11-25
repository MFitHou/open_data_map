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
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { getAmenityIcon, getPlaceName } from '../../utils/nearbyApi';
import type { NearbyPlace } from '../../utils/nearbyApi';

interface NearbyMarkersProps {
  places: NearbyPlace[];
}

export const NearbyMarkers: React.FC<NearbyMarkersProps> = ({ places }) => {
  const { t } = useTranslation();
  
  return (
    <>
      {places.map((place, idx) => {
        // Create custom icon with emoji
        const icon = L.divIcon({
          html: `<div class="nearby-marker">${getAmenityIcon(place)}</div>`,
          className: 'nearby-marker-wrapper',
          iconSize: [30, 30],
          iconAnchor: [15, 30],
          popupAnchor: [0, -30]
        });

        return (
          <Marker
            key={idx}
            position={[place.lat, place.lon]}
            icon={icon}
          >
            <Popup>
              <div className="nearby-popup">
                <div className="nearby-popup-title">
                  {getAmenityIcon(place)} {getPlaceName(place, idx)}
                </div>
                <div className="nearby-popup-content">
                  <div><strong>{t('map.nearby.type')}:</strong> {place.highway || place.amenity || 'N/A'}</div>
                  {place.brand && <div><strong>{t('map.nearby.brand')}:</strong> {place.brand}</div>}
                  {place.operator && <div><strong>{t('map.nearby.operator')}:</strong> {place.operator}</div>}
                  <div><strong>{t('map.nearby.distance')}:</strong> {(place.distanceKm * 1000).toFixed(0)}m</div>
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
