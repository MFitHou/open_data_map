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

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

interface FlyToLocationProps {
  lat: number;
  lon: number;
  zoom?: number;
}

export const FlyToLocation: React.FC<FlyToLocationProps> = ({ lat, lon, zoom = 15 }) => {
  const map = useMap();
  
  useEffect(() => {
    console.log('[FlyToLocation] Flying to:', { lat, lon, zoom });
    console.trace('[FlyToLocation] Call stack:');
    map.flyTo([lat, lon], zoom, {
      duration: 1.5
    });
  }, [lat, lon, zoom, map]);

  return null;
};
