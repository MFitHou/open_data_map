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
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, LayersControl } from 'react-leaflet';
import { Icon } from 'leaflet';
import { getApiEndpoint } from '../../../config/api';
import './AdminMap.css';

// Types cho IoT data
interface TrafficData {
  id: string;
  name: string;
  lat: number;
  lon: number;
  intensity: number;
  congested: boolean;
}

interface FloodData {
  id: string;
  name: string;
  lat: number;
  lon: number;
  waterLevel: number;
  alertLevel: string;
}

// Icon cho flood markers
const floodIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const AdminMap: React.FC = () => {
  const [trafficData, setTrafficData] = useState<TrafficData[]>([]);
  const [floodData, setFloodData] = useState<FloodData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hà Nội center coordinates
  const hanoiCenter: [number, number] = [21.028, 105.854];

  // Fetch IoT data
  const fetchIotData = async () => {
    try {
      const [trafficRes, floodRes] = await Promise.all([
        fetch(getApiEndpoint.adminIotTraffic()),
        fetch(getApiEndpoint.adminIotFlood()),
      ]);

      if (trafficRes.ok) {
        const trafficJson = await trafficRes.json();
        setTrafficData(trafficJson.data || []);
      }

      if (floodRes.ok) {
        const floodJson = await floodRes.json();
        setFloodData(floodJson.data || []);
      }

      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('Error fetching IoT data:', err);
      setError('Không thể tải dữ liệu IoT');
      setLoading(false);
    }
  };

  // Initial fetch và auto-refresh mỗi 30 giây
  useEffect(() => {
    fetchIotData();

    const interval = setInterval(() => {
      fetchIotData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="admin-map-container">
      {loading && (
        <div className="admin-map-loading">
          Đang tải dữ liệu IoT...
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
          {/* Traffic Layer */}
          <LayersControl.Overlay checked name="Giao thông (Traffic)">
            <>
              {trafficData.map((traffic) => (
                <CircleMarker
                  key={traffic.id}
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
                        <strong>Cường độ:</strong> {traffic.intensity} xe/phút
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
            </>
          </LayersControl.Overlay>

          {/* Flood Layer */}
          <LayersControl.Overlay checked name="Ngập úng (Flood)">
            <>
              {floodData.map((flood) => {
                // Larger radius nếu waterLevel > 20
                const isWarning = flood.waterLevel > 20;
                
                return (
                  <CircleMarker
                    key={flood.id}
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
                          <strong>Mực nước:</strong> {flood.waterLevel} cm
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
            </>
          </LayersControl.Overlay>
        </LayersControl>

        {/* Info panel */}
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
        </div>
      </MapContainer>
    </div>
  );
};

export default AdminMap;
