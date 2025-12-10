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
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudSun, faSpinner, faTemperatureHalf, faDroplet, faWind, faCloud } from '@fortawesome/free-solid-svg-icons';
import '../../styles/components/WeatherLayer.css';

interface WeatherStation {
  stationId: string;
  label?: string;
  lat: number;
  lon: number;
  temperature: number | null;
  humidity: number | null;
  wind_speed: number | null;
  rain_1h: number | null;
  timestamp?: string;
}

interface ForecastItem {
  datetime: string;
  temperature: {
    current: number;
    feels_like: number;
    min: number;
    max: number;
  };
  weather: {
    main: string;
    description: string;
    icon: string;
    icon_url: string;
  };
  wind: {
    speed: number;
    deg: number;
  };
  humidity: number;
  pop: number;
  rain: number;
}

interface ForecastData {
  city: {
    name: string;
    country: string;
  };
  forecast: ForecastItem[];
}

// Weather icon based on conditions
const getWeatherIcon = (temp: number | null): string => {
  if (temp === null) return '🌡️';
  if (temp >= 35) return '🌡️';  // Very hot
  if (temp >= 30) return '☀️';   // Hot
  if (temp >= 25) return '🌤️';  // Warm
  if (temp >= 20) return '⛅';   // Mild
  if (temp >= 15) return '🌥️';  // Cool
  return '❄️';                   // Cold
};

// Create custom marker icon for weather
const createWeatherIcon = (temp: number | null) => {
  const emoji = getWeatherIcon(temp);
  const bgColor = temp === null ? '#999' : 
    temp >= 35 ? '#ff4444' :
    temp >= 30 ? '#ff8800' :
    temp >= 25 ? '#ffcc00' :
    temp >= 20 ? '#88cc00' :
    temp >= 15 ? '#00aaff' : '#0066ff';
  
  return L.divIcon({
    className: 'weather-marker-icon',
    html: `
      <div class="weather-marker" style="background: ${bgColor};">
        <span class="weather-emoji">${emoji}</span>
        <span class="weather-temp">${temp !== null ? Math.round(temp) + '°' : 'N/A'}</span>
      </div>
    `,
    iconSize: [50, 50],
    iconAnchor: [25, 25],
  });
};

interface WeatherLayerProps {
  stations: WeatherStation[];
}

// Weather Markers component - renders inside MapContainer
export const WeatherMarkers: React.FC<WeatherLayerProps> = ({ stations }) => {
  return (
    <>
      {stations.map((station) => (
        <Marker
          key={station.stationId}
          position={[station.lat, station.lon]}
          icon={createWeatherIcon(station.temperature)}
        >
          <Popup>
            <div className="weather-popup">
              <div className="weather-popup-header">
                <FontAwesomeIcon icon={faCloudSun} />
                <span>{station.label || station.stationId.split(':').pop()}</span>
              </div>
              
              <div className="weather-popup-main">
                <span className="weather-temp-large">
                  {station.temperature !== null ? `${Math.round(station.temperature)}°C` : 'N/A'}
                </span>
              </div>
              
              <div className="weather-popup-details">
                {station.humidity !== null && (
                  <div className="weather-detail-item">
                    <FontAwesomeIcon icon={faDroplet} />
                    <span>{station.humidity}%</span>
                  </div>
                )}
                {station.wind_speed !== null && (
                  <div className="weather-detail-item">
                    <FontAwesomeIcon icon={faWind} />
                    <span>{station.wind_speed} m/s</span>
                  </div>
                )}
                {station.rain_1h !== null && station.rain_1h > 0 && (
                  <div className="weather-detail-item">
                    <FontAwesomeIcon icon={faCloud} />
                    <span>{station.rain_1h} mm</span>
                  </div>
                )}
              </div>
              
              {station.timestamp && (
                <div className="weather-popup-time">
                  {new Date(station.timestamp).toLocaleString('vi-VN')}
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
};

interface WeatherToggleButtonProps {
  onToggle: (enabled: boolean) => void;
  isLoading: boolean;
  isEnabled: boolean;
  stationCount: number;
  onShowForecast?: () => void;
}

// Toggle button component - renders outside MapContainer
export const WeatherToggleButton: React.FC<WeatherToggleButtonProps> = ({
  onToggle,
  isLoading,
  isEnabled,
  stationCount,
  onShowForecast
}) => {
  const { t } = useTranslation();

  return (
    <div className="weather-button-group">
      <button
        className={`weather-toggle-button ${isEnabled ? 'active' : ''}`}
        onClick={() => onToggle(!isEnabled)}
        disabled={isLoading}
        title={isEnabled ? 'Hide Weather Layer' : 'Show Weather Layer'}
      >
        {isLoading ? (
          <FontAwesomeIcon icon={faSpinner} spin />
        ) : (
          <FontAwesomeIcon icon={faCloudSun} />
        )}
        <span className="weather-button-text">Weather</span>
        {isEnabled && stationCount > 0 && (
          <span className="weather-station-count">{stationCount}</span>
        )}
      </button>
    </div>
  );
};

// Forecast Panel Component
interface ForecastPanelProps {
  forecast: ForecastData | null;
  isLoading: boolean;
  onClose: () => void;
}

export const ForecastPanel: React.FC<ForecastPanelProps> = ({ forecast, isLoading, onClose }) => {
  const { t, i18n } = useTranslation();
  const currentLocale = i18n.language === 'vi' ? 'vi-VN' : i18n.language === 'zh-TW' ? 'zh-TW' : 'en-US';
  
  // Group forecast by day
  const groupedForecast = forecast?.forecast?.reduce((acc, item) => {
    const date = new Date(item.datetime).toLocaleDateString(currentLocale, { weekday: 'short', day: 'numeric', month: 'numeric' });
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {} as Record<string, ForecastItem[]>) || {};

  return (
    <div className="forecast-panel">
      <div className="forecast-panel-header">
        <h3>
          <FontAwesomeIcon icon={faCloudSun} />
          <span>{t('weather.forecast.title')} - {forecast?.city?.name || 'Ha Noi'}</span>
        </h3>
        <button className="forecast-close-btn" onClick={onClose}>&times;</button>
      </div>
      
      {isLoading || !forecast ? (
        <div className="forecast-loading">
          <FontAwesomeIcon icon={faSpinner} spin size="2x" />
          <p>{t('weather.forecast.loading')}</p>
        </div>
      ) : (
        <div className="forecast-content">
          {Object.entries(groupedForecast).slice(0, 5).map(([date, items]) => (
            <div key={date} className="forecast-day">
              <div className="forecast-day-header">{date}</div>
              <div className="forecast-day-items">
                {items.slice(0, 4).map((item, idx) => (
                  <div key={idx} className="forecast-item">
                    <span className="forecast-time">
                      {new Date(item.datetime).toLocaleTimeString(currentLocale, { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <img src={item.weather.icon_url} alt={item.weather.description} className="forecast-icon" />
                    <span className="forecast-temp">{Math.round(item.temperature.current)}°</span>
                    <span className="forecast-pop">{Math.round(item.pop * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Custom hook for Weather layer management
export const useWeatherLayer = () => {
  const [stations, setStations] = useState<WeatherStation[]>([]);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingForecast, setIsLoadingForecast] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [showForecast, setShowForecast] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeatherData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Fetch all IoT stations with coordinates from Fuseki
      const stationsUrl = `${import.meta.env.VITE_API_BASE_URL}/fuseki/iot-stations`;
      const stationsResponse = await fetch(stationsUrl);
      
      if (!stationsResponse.ok) {
        throw new Error('Failed to fetch IoT stations');
      }
      
      const stationsData = await stationsResponse.json();
      // console.log('[Weather Layer] IoT stations:', stationsData);
      
      if (!stationsData.stations || stationsData.stations.length === 0) {
        // console.log('[Weather Layer] No IoT stations found');
        setStations([]);
        return;
      }
      
      // Step 2: Fetch Weather data from InfluxDB
      const influxUrl = `${import.meta.env.VITE_API_BASE_URL}/influxdb/stations?measurement=weather&fields=temperature,humidity,wind_speed,rain_1h`;
      const influxResponse = await fetch(influxUrl);
      
      let influxDataMap: Record<string, any> = {};
      
      if (influxResponse.ok) {
        const influxData = await influxResponse.json();
        // console.log('[Weather Layer] InfluxDB data:', influxData);
        
        if (influxData.data && influxData.data.length > 0) {
          influxData.data.forEach((s: any) => {
            influxDataMap[s.stationId] = {
              temperature: s.data?.temperature ?? null,
              humidity: s.data?.humidity ?? null,
              wind_speed: s.data?.wind_speed ?? null,
              rain_1h: s.data?.rain_1h ?? null,
              timestamp: s.timestamp,
            };
          });
        }
      }
      
      // Step 3: Merge station locations with weather data
      const mergedStations: WeatherStation[] = stationsData.stations.map((s: any) => {
        const weatherData = influxDataMap[s.stationId] || {};
        return {
          stationId: s.stationId,
          label: s.label,
          lat: s.lat,
          lon: s.lon,
          temperature: weatherData.temperature ?? null,
          humidity: weatherData.humidity ?? null,
          wind_speed: weatherData.wind_speed ?? null,
          rain_1h: weatherData.rain_1h ?? null,
          timestamp: weatherData.timestamp,
        };
      });
      
      // console.log('[Weather Layer] Merged stations:', mergedStations);
      setStations(mergedStations);
      
      // Also fetch forecast for Hanoi
      fetchForecast();
    } catch (err: any) {
      console.error('[Weather Layer] Error:', err);
      setError(err.message);
      setStations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchForecast = useCallback(async () => {
    setIsLoadingForecast(true);
    try {
      const forecastUrl = `${import.meta.env.VITE_API_BASE_URL}/influxdb/weather/forecast?lat=21.0285&lon=105.8542`;
      const response = await fetch(forecastUrl);
      
      if (response.ok) {
        const result = await response.json();
        // console.log('[Weather Layer] Forecast data:', result);
        setForecast(result.data || result);
      }
    } catch (err: any) {
      console.error('[Weather Layer] Forecast error:', err);
    } finally {
      setIsLoadingForecast(false);
    }
  }, []);

  const toggleLayer = useCallback(async (enabled: boolean) => {
    setIsEnabled(enabled);
    if (enabled) {
      setShowForecast(true); // Auto show forecast panel when enabling
      if (stations.length === 0) {
        await fetchWeatherData();
      }
    } else {
      setShowForecast(false);
    }
  }, [fetchWeatherData, stations.length]);

  const toggleForecast = useCallback(() => {
    setShowForecast(prev => !prev);
    if (!forecast && !isLoadingForecast) {
      fetchForecast();
    }
  }, [forecast, isLoadingForecast, fetchForecast]);

  const refreshData = useCallback(async () => {
    if (isEnabled) {
      await fetchWeatherData();
    }
  }, [isEnabled, fetchWeatherData]);

  return {
    stations,
    forecast,
    isLoading,
    isLoadingForecast,
    isEnabled,
    showForecast,
    error,
    toggleLayer,
    toggleForecast,
    refreshData,
    closeForecast: () => setShowForecast(false),
  };
};

export default WeatherMarkers;
