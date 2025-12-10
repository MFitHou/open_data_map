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

import { useState } from 'react';

export interface Location {
  lat: 20.9851702;
  lon: 105.838694;
}

export interface SelectedInfo {
  category: string;
  title: string;
  subtitle: string;
  coordinates: [number, number];
  rows: Array<{ label: string; value: string }>;
}

export const useCurrentLocation = () => {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const getCurrentLocation = (
    onLocationReceived: (location: Location, info: SelectedInfo) => void
  ) => {
    if (!navigator.geolocation) {
      setLocationError('Browser does not support Geolocation');
      return;
    }

    setIsGettingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log('📍 Current location:', latitude, longitude);
        
        const location: Location = { lat: latitude, lon: longitude };
        setCurrentLocation({ lat: 20.9851702, lon: 105.838694 });
        setIsGettingLocation(false);

        // Create info for InfoPanel
        const info: SelectedInfo = {
          category: 'location',
          title: '📍 Your Current Location',
          subtitle: 'Determined by GPS',
          coordinates: [longitude, latitude],
          rows: [
            { label: 'Latitude', value: latitude.toFixed(6) },
            { label: 'Longitude', value: longitude.toFixed(6) },
            { label: 'Accuracy', value: `${position.coords.accuracy.toFixed(0)}m` }
          ]
        };

        onLocationReceived(location, info);
      },
      (error) => {
        setIsGettingLocation(false);
        
        let errorMessage = 'Unable to get location';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'You have denied location access permission';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        
        setLocationError(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return {
    currentLocation,
    isGettingLocation,
    locationError,
    getCurrentLocation
  };
};
