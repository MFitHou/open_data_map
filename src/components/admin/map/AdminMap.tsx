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
import { MapContainer, TileLayer, CircleMarker, Popup, LayersControl, LayerGroup } from 'react-leaflet';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../../../config/api';
import './AdminMap.css';

// Types cho IoT data
interface TrafficData {
  id: string;
  name: string;
  lat: number;
  lon: number;
  intensity: number;
  avgSpeed: number;
  noiseLevel: number;
  congested: boolean;
}

interface FloodData {
  id: string;
  name: string;
  lat: number;
  lon: number;
  waterLevel: number;
  rain1h: number;
  alertLevel: string;
}

interface AirQualityData {
  id: string;
  name: string;
  lat: number;
  lon: number;
  aqi: number;
  pm25: number;
  pm10: number;
  alertLevel: string;
}

// IoT Stations với tọa độ thực tế tại Hà Nội
// Note: IDs match the last part of URI from InfluxDB (e.g., urn:ngsi-ld:Device:Hanoi:station:CauGiay)
const IOT_STATIONS = [
  { id: 'Lang', name: 'Trạm Láng', lat: 21.0285, lon: 105.8542 },
  { id: 'CauGiay', name: 'Trạm Cầu Giấy', lat: 21.0333, lon: 105.7944 },
  { id: 'HoGuom', name: 'Trạm Hồ Gươm', lat: 21.0285, lon: 105.8542 },
  { id: 'MyDinh', name: 'Trạm Mỹ Đình', lat: 21.0285, lon: 105.7744 },
  { id: 'HoangMai', name: 'Trạm Hoàng Mai', lat: 20.9815, lon: 105.8516 },
  { id: 'HaDong', name: 'Trạm Hà Đông', lat: 20.9720, lon: 105.7740 },
  { id: 'LongBien', name: 'Trạm Long Biên', lat: 21.0450, lon: 105.8975 },
  { id: 'TayHo', name: 'Trạm Tây Hồ', lat: 21.0638, lon: 105.8192 },
  { id: 'RoyalCity', name: 'Trạm Royal City', lat: 21.0033, lon: 105.7975 },
  { id: 'TimeCity', name: 'Trạm Time City', lat: 20.9953, lon: 105.8686 },
];

const AdminMap: React.FC = () => {
  const { t } = useTranslation();
  const [trafficData, setTrafficData] = useState<TrafficData[]>([]);
  const [floodData, setFloodData] = useState<FloodData[]>([]);
  const [airQualityData, setAirQualityData] = useState<AirQualityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hà Nội center coordinates
  const hanoiCenter: [number, number] = [21.028, 105.854];

  // Extract station ID from URI (e.g., urn:ngsi-ld:Device:Hanoi:station:CauGiay -> CauGiay)
  const extractStationId = (uri: string): string => {
    return uri.split(':').pop() || uri;
  };

  // Fetch real-time IoT data from InfluxDB
  const fetchIotData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all stations data at once (more efficient than individual calls)
      const [trafficResponse, floodResponse, airQualityResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/influxdb/stations?measurement=traffic`),
        fetch(`${API_BASE_URL}/influxdb/stations?measurement=flood`),
        fetch(`${API_BASE_URL}/influxdb/stations?measurement=air_quality`),
      ]);

      // Parse traffic data
      const trafficMap = new Map<string, any>();
      if (trafficResponse.ok) {
        const trafficResult = await trafficResponse.json();
        // console.log('Traffic data from /stations:', trafficResult);
        if (trafficResult.success && trafficResult.data) {
          trafficResult.data.forEach((item: any) => {
            const stationId = extractStationId(item.stationId);
            // console.log('Traffic station:', item.stationId, '->', stationId, item.data);
            trafficMap.set(stationId, item.data);
          });
        }
      }

      // Parse flood data
      const floodMap = new Map<string, any>();
      if (floodResponse.ok) {
        const floodResult = await floodResponse.json();
        // console.log('Flood data from /stations:', floodResult);
        if (floodResult.success && floodResult.data) {
          floodResult.data.forEach((item: any) => {
            const stationId = extractStationId(item.stationId);
            // console.log('Flood station:', item.stationId, '->', stationId, item.data);
            floodMap.set(stationId, item.data);
          });
        }
      }

      // Parse air quality data
      const airQualityMap = new Map<string, any>();
      if (airQualityResponse.ok) {
        const airQualityResult = await airQualityResponse.json();
        // console.log('Air quality data from /stations:', airQualityResult);
        if (airQualityResult.success && airQualityResult.data) {
          airQualityResult.data.forEach((item: any) => {
            const stationId = extractStationId(item.stationId);
            // console.log('Air quality station:', item.stationId, '->', stationId, item.data);
            airQualityMap.set(stationId, item.data);
          });
        }
      }

      console.log('All station IDs in data:', {
        traffic: Array.from(trafficMap.keys()),
        flood: Array.from(floodMap.keys()),
        airQuality: Array.from(airQualityMap.keys())
      });
      // console.log('Expected station IDs:', IOT_STATIONS.map(s => s.id));

      // Merge with station definitions
      const trafficResults: TrafficData[] = IOT_STATIONS.map((station) => {
        const data = trafficMap.get(station.id) || {};
        return {
          id: station.id,
          name: station.name,
          lat: station.lat,
          lon: station.lon,
          intensity: data.intensity || 0,
          avgSpeed: data.avg_speed || 0,
          noiseLevel: data.noise_level || 0,
          congested: (data.avg_speed || 50) < 20,
        };
      }).filter(d => d.intensity > 0 || d.avgSpeed > 0); // Only show stations with data

      const floodResults: FloodData[] = IOT_STATIONS.map((station) => {
        const data = floodMap.get(station.id) || {};
        const waterLevel = data.water_level || 0;
        return {
          id: station.id,
          name: station.name,
          lat: station.lat,
          lon: station.lon,
          waterLevel: waterLevel,
          rain1h: data.rain_1h || 0,
          alertLevel: waterLevel > 30 ? 'critical' : waterLevel > 20 ? 'warning' : 'normal',
        };
      }).filter(d => d.waterLevel > 0 || d.rain1h > 0);

      const airQualityResults: AirQualityData[] = IOT_STATIONS.map((station) => {
        const data = airQualityMap.get(station.id) || {};
        const aqi = data.aqi || 0;
        return {
          id: station.id,
          name: station.name,
          lat: station.lat,
          lon: station.lon,
          aqi: aqi,
          pm25: data.pm25 || 0,
          pm10: data.pm10 || 0,
          alertLevel: aqi > 100 ? 'critical' : aqi > 50 ? 'warning' : 'good',
        };
      }).filter(d => d.aqi > 0 || d.pm25 > 0);

      console.log('Final merged data:', {
        traffic: trafficResults.length,
        flood: floodResults.length,
        airQuality: airQualityResults.length
      });

      setTrafficData(trafficResults);
      setFloodData(floodResults);
      setAirQualityData(airQualityResults);
      setLoading(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t('common.status.unknownError');
      setError(`${t('admin.map.errorLoadingIotData')}: ${errorMessage}`);
      setLoading(false);
    }
  };

  // Initial fetch and auto-refresh every 30 seconds
  useEffect(() => {
    fetchIotData();
    const interval = setInterval(fetchIotData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="admin-map-container">
      {loading && (
        <div className="admin-map-loading">
          {t('admin.map.loadingIotData')}
        </div>
      )}

      {error && (
        <div className="admin-map-error">
          {error}
        </div>
      )}

      <MapContainer
        center={hanoiCenter}
        zoom={12}
        className="admin-map"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <LayersControl position="topright">
          <LayersControl.Overlay checked name="Giao thông">
            <LayerGroup>
              {trafficData.map((traffic) => (
                <CircleMarker
                  key={`traffic-${traffic.id}`}
                  center={[traffic.lat, traffic.lon]}
                  radius={10}
                  pathOptions={{
                    color: traffic.congested ? '#ff4444' : '#00cc66',
                    fillColor: traffic.congested ? '#ff4444' : '#00cc66',
                    fillOpacity: 0.6,
                    weight: 2,
                  }}
                >
                  <Popup>
                    <div className="admin-popup">
                      <h3>{traffic.name}</h3>
                      <p>
                        <strong>Cường độ:</strong> {traffic.intensity.toFixed(1)} xe/phút
                      </p>
                      <p>
                        <strong>Tốc độ TB:</strong> {traffic.avgSpeed.toFixed(1)} km/h
                      </p>
                      <p>
                        <strong>Độ ồn:</strong> {traffic.noiseLevel.toFixed(1)} dB
                      </p>
                      <p>
                        <strong>Trạng thái:</strong>{' '}
                        <span
                          className={
                            traffic.congested ? 'status-congested' : 'status-normal'
                          }
                        >
                          {traffic.congested ? 'Tắc nghẽn' : 'Lưu thông tốt'}
                        </span>
                      </p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </LayerGroup>
          </LayersControl.Overlay>

          <LayersControl.Overlay checked name="Ngập úng">
            <LayerGroup>
              {floodData.map((flood) => {
                const isWarning = flood.waterLevel > 20;
                
                return (
                  <CircleMarker
                    key={`flood-${flood.id}`}
                    center={[flood.lat, flood.lon]}
                    radius={isWarning ? 15 : 10}
                    pathOptions={{
                      color: '#3388ff',
                      fillColor: '#3388ff',
                      fillOpacity: isWarning ? 0.8 : 0.5,
                      weight: 2,
                    }}
                    className={isWarning ? 'pulse-marker' : ''}
                  >
                    <Popup>
                      <div className="admin-popup">
                        <h3>{flood.name}</h3>
                        <p>
                          <strong>Mực nước:</strong> {flood.waterLevel.toFixed(1)} cm
                        </p>
                        <p>
                          <strong>Mưa 1h:</strong> {flood.rain1h.toFixed(1)} mm
                        </p>
                        <p>
                          <strong>Cảnh báo:</strong>{' '}
                          <span className={`alert-${flood.alertLevel}`}>
                            {flood.alertLevel === 'critical'
                              ? 'Nguy hiểm'
                              : flood.alertLevel === 'warning'
                              ? 'Cảnh báo'
                              : 'Bình thường'}
                          </span>
                        </p>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </LayerGroup>
          </LayersControl.Overlay>

          <LayersControl.Overlay checked name="Chất lượng không khí">
            <LayerGroup>
              {airQualityData.map((air) => {
                const getColor = () => {
                  if (air.aqi > 100) return '#9b59b6';
                  if (air.aqi > 50) return '#f39c12';
                  return '#27ae60';
                };
                
                return (
                  <CircleMarker
                    key={`air-${air.id}`}
                    center={[air.lat, air.lon]}
                    radius={12}
                    pathOptions={{
                      color: getColor(),
                      fillColor: getColor(),
                      fillOpacity: 0.6,
                      weight: 2,
                    }}
                  >
                    <Popup>
                      <div className="admin-popup">
                        <h3>{air.name}</h3>
                        <p>
                          <strong>AQI:</strong> {air.aqi.toFixed(0)}
                        </p>
                        <p>
                          <strong>PM2.5:</strong> {air.pm25.toFixed(1)} μg/m³
                        </p>
                        <p>
                          <strong>PM10:</strong> {air.pm10.toFixed(1)} μg/m³
                        </p>
                        <p>
                          <strong>Chất lượng:</strong>{' '}
                          <span className={`alert-${air.alertLevel}`}>
                            {air.alertLevel === 'critical'
                              ? 'Xấu'
                              : air.alertLevel === 'warning'
                              ? 'Trung bình'
                              : 'Tốt'}
                          </span>
                        </p>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </LayerGroup>
          </LayersControl.Overlay>
        </LayersControl>

        <div className="admin-map-info">
          <div className="info-item">
            <span className="color-box" style={{ backgroundColor: '#00cc66' }}></span>
            <span>Lưu thông tốt</span>
          </div>
          <div className="info-item">
            <span className="color-box" style={{ backgroundColor: '#ff4444' }}></span>
            <span>Tắc nghẽn</span>
          </div>
          <div className="info-item">
            <span className="color-box" style={{ backgroundColor: '#3388ff' }}></span>
            <span>Ngập úng</span>
          </div>
          <div className="info-item">
            <span className="color-box" style={{ backgroundColor: '#27ae60' }}></span>
            <span>Không khí tốt</span>
          </div>
          <div className="info-item">
            <span className="color-box" style={{ backgroundColor: '#f39c12' }}></span>
            <span>Không khí trung bình</span>
          </div>
          <div className="info-item">
            <span className="color-box" style={{ backgroundColor: '#9b59b6' }}></span>
            <span>Không khí xấu</span>
          </div>
        </div>
      </MapContainer>
    </div>
  );
};

export default AdminMap;
