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

import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { CircleMarker, Popup } from 'react-leaflet';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWind, faSpinner } from '@fortawesome/free-solid-svg-icons';
import '../../styles/components/AQILayer.css';

interface AQIStation {
  stationId: string;
  label?: string;
  lat: number;
  lon: number;
  aqi: number | null;
  pm25?: number | null;
  pm10?: number | null;
  timestamp?: string;
}

// AQI level color mapping
const getAQIColor = (aqi: number | null): string => {
  if (aqi === null) return '#999999';
  if (aqi <= 50) return '#00e400';     // Good - Green
  if (aqi <= 100) return '#ffff00';    // Moderate - Yellow
  if (aqi <= 150) return '#ff7e00';    // Unhealthy for Sensitive - Orange
  if (aqi <= 200) return '#ff0000';    // Unhealthy - Red
  if (aqi <= 300) return '#8f3f97';    // Very Unhealthy - Purple
  return '#7e0023';                     // Hazardous - Maroon
};

const getAQILabel = (aqi: number | null): string => {
  if (aqi === null) return 'N/A';
  if (aqi <= 50) return 'Tot';
  if (aqi <= 100) return 'Trung binh';
  if (aqi <= 150) return 'Kem';
  if (aqi <= 200) return 'Xau';
  if (aqi <= 300) return 'Rat xau';
  return 'Nguy hai';
};

interface AQILayerProps {
  stations: AQIStation[];
}

// AQI Markers component - renders inside MapContainer
export const AQIMarkers: React.FC<AQILayerProps> = ({ stations }) => {
  return (
    <>
      {stations.map((station) => (
        <CircleMarker
          key={station.stationId}
          center={[station.lat, station.lon]}
          radius={20}
          pathOptions={{
            fillColor: getAQIColor(station.aqi),
            fillOpacity: 0.7,
            color: '#fff',
            weight: 2,
          }}
        >
          <Popup>
            <div className="aqi-popup">
              <div className="aqi-popup-header">
                <FontAwesomeIcon icon={faWind} />
                <span>{station.label || station.stationId.split(':').pop()}</span>
              </div>
              <div
                className="aqi-popup-value"
                style={{
                  background: getAQIColor(station.aqi),
                  color: station.aqi && station.aqi > 150 ? '#fff' : '#000'
                }}
              >
                <span className="aqi-number">{station.aqi ?? 'N/A'}</span>
                <span className="aqi-label">{getAQILabel(station.aqi)}</span>
              </div>
              {station.pm25 !== null && station.pm25 !== undefined && (
                <div className="aqi-popup-detail">PM2.5: {station.pm25} ug/m3</div>
              )}
              {station.pm10 !== null && station.pm10 !== undefined && (
                <div className="aqi-popup-detail">PM10: {station.pm10} ug/m3</div>
              )}
              {station.timestamp && (
                <div className="aqi-popup-time">
                  {new Date(station.timestamp).toLocaleString('vi-VN')}
                </div>
              )}
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </>
  );
};

interface AQIToggleButtonProps {
  onToggle: (enabled: boolean) => void;
  isLoading: boolean;
  isEnabled: boolean;
  stationCount: number;
}

// Toggle button component - renders outside MapContainer
export const AQIToggleButton: React.FC<AQIToggleButtonProps> = ({
  onToggle,
  isLoading,
  isEnabled,
  stationCount
}) => {
  const { t } = useTranslation();

  return (
    <button
      className={`aqi-toggle-button ${isEnabled ? 'active' : ''}`}
      onClick={() => onToggle(!isEnabled)}
      disabled={isLoading}
      title={isEnabled ? 'Hide AQI Layer' : 'Show AQI Layer'}
    >
      {isLoading ? (
        <FontAwesomeIcon icon={faSpinner} spin />
      ) : (
        <FontAwesomeIcon icon={faWind} />
      )}
      <span className="aqi-button-text">AQI</span>
      {isEnabled && stationCount > 0 && (
        <span className="aqi-station-count">{stationCount}</span>
      )}
    </button>
  );
};

// Custom hook for AQI layer management
export const useAQILayer = () => {
  const [stations, setStations] = useState<AQIStation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAQIData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Fetch all IoT stations with coordinates from Fuseki (iot_infrastructure)
      // URI Pattern: urn:ngsi-ld:Device:Hanoi:station:{StationName}
      const stationsUrl = `${import.meta.env.VITE_API_BASE_URL}/fuseki/iot-stations`;
      const stationsResponse = await fetch(stationsUrl);
      
      if (!stationsResponse.ok) {
        throw new Error('Failed to fetch IoT stations');
      }
      
      const stationsData = await stationsResponse.json();
      // console.log('[AQI Layer] IoT stations:', stationsData);
      
      if (!stationsData.stations || stationsData.stations.length === 0) {
        // console.log('[AQI Layer] No IoT stations found');
        setStations([]);
        return;
      }
      
      // Build location map from stations
      const locationMap: Record<string, { lat: number; lon: number; label: string }> = {};
      stationsData.stations.forEach((s: any) => {
        locationMap[s.stationId] = { lat: s.lat, lon: s.lon, label: s.label };
      });
      
      // Step 2: Fetch AQI data from InfluxDB for all stations
      const stationIds = stationsData.stations.map((s: any) => s.stationId);
      // console.log('[AQI Layer] Station IDs:', stationIds);
      
      // Fetch all stations AQI data
      const influxUrl = `${import.meta.env.VITE_API_BASE_URL}/influxdb/stations?measurement=air_quality&fields=aqi,pm25,pm10`;
      const influxResponse = await fetch(influxUrl);
      
      let influxDataMap: Record<string, any> = {};
      
      if (influxResponse.ok) {
        const influxData = await influxResponse.json();
        // console.log('[AQI Layer] InfluxDB data:', influxData);
        
        if (influxData.data && influxData.data.length > 0) {
          influxData.data.forEach((s: any) => {
            influxDataMap[s.stationId] = {
              aqi: s.data?.aqi ?? null,
              pm25: s.data?.pm25 ?? null,
              pm10: s.data?.pm10 ?? null,
              timestamp: s.timestamp,
            };
          });
        }
      }
      
      // Step 3: Merge station locations with AQI data
      const mergedStations: AQIStation[] = stationsData.stations.map((s: any) => {
        const aqiData = influxDataMap[s.stationId] || {};
        return {
          stationId: s.stationId,
          label: s.label,
          lat: s.lat,
          lon: s.lon,
          aqi: aqiData.aqi ?? null,
          pm25: aqiData.pm25 ?? null,
          pm10: aqiData.pm10 ?? null,
          timestamp: aqiData.timestamp,
        };
      });
      
      // console.log('[AQI Layer] Merged stations:', mergedStations);
      setStations(mergedStations);
    } catch (err: any) {
      console.error('[AQI Layer] Error:', err);
      setError(err.message);
      setStations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleLayer = useCallback(async (enabled: boolean) => {
    setIsEnabled(enabled);
    if (enabled && stations.length === 0) {
      await fetchAQIData();
    }
  }, [fetchAQIData, stations.length]);

  const refreshData = useCallback(async () => {
    if (isEnabled) {
      await fetchAQIData();
    }
  }, [isEnabled, fetchAQIData]);

  return {
    stations,
    isLoading,
    isEnabled,
    error,
    toggleLayer,
    refreshData,
  };
};

export default AQIMarkers;
