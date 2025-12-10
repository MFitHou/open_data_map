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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartLine,
  faSpinner,
  faExclamationTriangle,
  faSync,
} from '@fortawesome/free-solid-svg-icons';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import AdminMap from './map/AdminMap';
import './Admin.css';
import { API_BASE_URL } from '../../config/api';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Time range options
const TIME_RANGES = [
  { value: '1m', label: '1 Phút', influxValue: '-1m' },
  { value: '5m', label: '5 Phút', influxValue: '-5m' },
  { value: '1h', label: '1 Giờ', influxValue: '-1h' },
  { value: '3h', label: '3 Giờ', influxValue: '-3h' },
  { value: '6h', label: '6 Giờ', influxValue: '-6h' },
  { value: '12h', label: '12 Giờ', influxValue: '-12h' },
  { value: '1d', label: '1 Ngày', influxValue: '-1d' },
  { value: '2d', label: '2 Ngày', influxValue: '-2d' },
  { value: '7d', label: '7 Ngày', influxValue: '-7d' },
  { value: '30d', label: '30 Ngày', influxValue: '-30d' },
];

// Measurement types
const MEASUREMENTS = {
  air_quality: { label: 'Chất Lượng Không Khí', fields: ['aqi', 'pm25', 'pm10'] },
  weather: { label: 'Thời Tiết', fields: ['temperature', 'humidity', 'wind_speed'] },
  traffic: { label: 'Giao Thông', fields: ['avg_speed', 'intensity', 'noise_level'] },
  flood: { label: 'Ngập Lụt', fields: ['rain_1h', 'water_level'] },
};

// IoT Stations
const IOT_STATIONS = [
  { id: 'Lang', name: 'Trạm Láng' },
  { id: 'CauGiay', name: 'Trạm Cầu Giấy' },
  { id: 'HoGuom', name: 'Trạm Hồ Gươm' },
  { id: 'MyDinh', name: 'Trạm Mỹ Đình' },
  { id: 'HoangMai', name: 'Trạm Hoàng Mai' },
  { id: 'HaDong', name: 'Trạm Hà Đông' },
  { id: 'LongBien', name: 'Trạm Long Biên' },
  { id: 'TayHo', name: 'Trạm Tây Hồ' },
  { id: 'RoyalCity', name: 'Trạm Royal City' },
  { id: 'TimeCity', name: 'Trạm Time City' },
];

interface HistoricalDataPoint {
  time: string;
  [key: string]: number | string | null;
}

interface StationLatestData {
  stationId: string;
  measurement: string;
  data: Record<string, number | null>;
  timestamp: string;
}

export const EnvironmentMonitoring: React.FC = () => {
  const [selectedStation, setSelectedStation] = useState<string>('Lang');
  const [selectedMeasurement, setSelectedMeasurement] = useState<string>('air_quality');
  const [timeRange, setTimeRange] = useState<string>('1h');
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
  const [latestData, setLatestData] = useState<StationLatestData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch historical data
  const fetchHistoricalData = async () => {
    setLoading(true);
    setError(null);

    try {
      const timeRangeObj = TIME_RANGES.find((r) => r.value === timeRange);
      const aggregateWindow = ['1d', '2d', '7d', '30d'].includes(timeRange) ? '1h' : '5m';

      // Convert station ID to full URI format
      const stationUri = `urn:ngsi-ld:Device:Hanoi:station:${selectedStation}`;
      
      const response = await fetch(
        `${API_BASE_URL}/influxdb/history?stationId=${encodeURIComponent(stationUri)}&measurement=${selectedMeasurement}&start=${timeRangeObj?.influxValue || '-1h'}&aggregateWindow=${aggregateWindow}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      // console.log('Historical data response:', result);
      
      // Transform data from array of {time, field, value} to grouped by time
      if (result.data && result.data.length > 0) {
        const groupedByTime = new Map<string, Record<string, number>>();
        
        result.data.forEach((item: any) => {
          const time = item.time;
          if (!groupedByTime.has(time)) {
            groupedByTime.set(time, {});
          }
          groupedByTime.get(time)![item.field] = item.value;
        });
        
        // Convert to array format expected by chart
        const transformedData = Array.from(groupedByTime.entries()).map(([time, fields]) => ({
          time,
          ...fields
        }));
        
        // console.log('Transformed historical data:', transformedData);
        setHistoricalData(transformedData);
      } else {
        setHistoricalData([]);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Không thể tải dữ liệu: ${errorMessage}`);
      console.error('Error fetching historical data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch latest data
  const fetchLatestData = async () => {
    try {
      // Use /stations endpoint to get all stations data, then filter by selected station
      const response = await fetch(
        `${API_BASE_URL}/influxdb/stations?measurement=${selectedMeasurement}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      // console.log('Latest data response from /stations:', result);
      
      if (result.success && result.data) {
        // Extract station ID from URI and find matching station
        const stationData = result.data.find((item: any) => {
          // Extract last part of URI (e.g., urn:ngsi-ld:Device:Hanoi:station:Lang -> Lang)
          const stationId = item.stationId.split(':').pop();
          return stationId === selectedStation;
        });
        // console.log('Filtered station data:', stationData); 
        
        if (stationData) {
          setLatestData(stationData);
        } else {
          console.warn(`No data found for station ${selectedStation}`);
          setLatestData(null);
        }
      } else {
        setLatestData(null);
      }
    } catch (err: unknown) {
      console.error('Error fetching latest data:', err);
      setLatestData(null);
    }
  };

  // Fetch data when parameters change
  useEffect(() => {
    fetchHistoricalData();
    fetchLatestData();
  }, [selectedStation, selectedMeasurement, timeRange]);

  // Prepare chart data
  const getChartData = () => {
    if (!historicalData || historicalData.length === 0) {
      return null;
    }

    const measurement = MEASUREMENTS[selectedMeasurement as keyof typeof MEASUREMENTS];
    const labels = historicalData.map((d) => {
      const date = new Date(d.time);
      return date.toLocaleString('vi-VN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    });

    const datasets = measurement.fields.map((field, index) => {
      const colors = [
        'rgb(255, 99, 132)',
        'rgb(54, 162, 235)',
        'rgb(255, 206, 86)',
        'rgb(75, 192, 192)',
        'rgb(153, 102, 255)',
      ];

      return {
        label: field.toUpperCase(),
        data: historicalData.map((d) => d[field] as number | null),
        borderColor: colors[index % colors.length],
        backgroundColor: colors[index % colors.length].replace('rgb', 'rgba').replace(')', ', 0.1)'),
        tension: 0.4,
        fill: true,
      };
    });

    return {
      labels,
      datasets,
    };
  };

  const chartData = getChartData();

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `${MEASUREMENTS[selectedMeasurement as keyof typeof MEASUREMENTS]?.label} - ${IOT_STATIONS.find((s) => s.id === selectedStation)?.name}`,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  return (
    <div className="admin-page">
      {/* Header Section */}
      <div className="admin-page__header">
        <h1 className="admin-page__title">Environment & Traffic Monitoring</h1>
        <p className="admin-page__subtitle">
          Real-time monitoring dữ liệu giao thông và ngập úng tại Hà Nội
        </p>
      </div>

      {/* Legend/Summary Bar */}
      <div className="admin-page__legend">
        <div className="legend-item">
          <span className="legend-icon legend-icon--red">🔴</span>
          <span className="legend-label">Tắc nghẽn (Congested)</span>
        </div>
        <div className="legend-item">
          <span className="legend-icon legend-icon--green">🟢</span>
          <span className="legend-label">Lưu thông tốt (Normal)</span>
        </div>
        <div className="legend-item">
          <span className="legend-icon legend-icon--blue">🔵</span>
          <span className="legend-label">Cảm biến ngập úng (Flood Sensors)</span>
        </div>
        <div className="legend-info">
          <span className="legend-refresh">🔄 Tự động cập nhật mỗi 30 giây</span>
        </div>
      </div>

      {/* Map Container */}
      <div className="admin-page__map-container">
        <AdminMap />
      </div>

      {/* Charts Section */}
      <div style={{ marginTop: '2rem' }}>
          {/* Controls Section */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem',
            background: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            marginBottom: '1.5rem',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 600, color: '#2c3e50', fontSize: '0.9rem' }}>
                Trạm IoT:
              </label>
              <select
                value={selectedStation}
                onChange={(e) => setSelectedStation(e.target.value)}
                style={{
                  padding: '0.6rem',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '1rem',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                }}
              >
                {IOT_STATIONS.map((station) => (
                  <option key={station.id} value={station.id}>
                    {station.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 600, color: '#2c3e50', fontSize: '0.9rem' }}>
                Loại Đo:
              </label>
              <select
                value={selectedMeasurement}
                onChange={(e) => setSelectedMeasurement(e.target.value)}
                style={{
                  padding: '0.6rem',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '1rem',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                }}
              >
                {Object.entries(MEASUREMENTS).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 600, color: '#2c3e50', fontSize: '0.9rem' }}>
                Khoảng Thời Gian:
              </label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                style={{
                  padding: '0.6rem',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '1rem',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                }}
              >
                {TIME_RANGES.map((range) => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                onClick={() => {
                  fetchHistoricalData();
                  fetchLatestData();
                }}
                disabled={loading}
                style={{
                  padding: '0.6rem 1.2rem',
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  width: '100%',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                <FontAwesomeIcon icon={faSync} spin={loading} /> Làm Mới
              </button>
            </div>
          </div>

          {/* Latest Data Section */}
          {latestData && (
            <div style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              marginBottom: '1.5rem',
            }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', color: '#2c3e50' }}>
                Giá Trị Mới Nhất
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '1rem',
                marginBottom: '1rem',
              }}>
                {Object.entries(latestData.data).map(([field, value]) => (
                  <div
                    key={field}
                    style={{
                      padding: '1rem',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '8px',
                      color: 'white',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '0.8rem', opacity: 0.9, marginBottom: '0.5rem', fontWeight: 600 }}>
                      {field.toUpperCase()}
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
                      {value !== null ? value.toFixed(2) : 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: 'right', color: '#7f8c8d', fontSize: '0.85rem', fontStyle: 'italic' }}>
                Cập nhật lần cuối: {new Date(latestData.timestamp).toLocaleString('vi-VN')}
              </div>
            </div>
          )}

          {/* Chart Section */}
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            minHeight: '400px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.5rem',
          }}>
            {loading && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', color: '#7f8c8d' }}>
                <FontAwesomeIcon icon={faSpinner} spin size="3x" />
                <p>Đang tải dữ liệu...</p>
              </div>
            )}

            {error && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', color: '#e74c3c' }}>
                <FontAwesomeIcon icon={faExclamationTriangle} size="2x" />
                <p>{error}</p>
              </div>
            )}

            {!loading && !error && chartData && (
              <div style={{ width: '100%', height: '450px' }}>
                <Line data={chartData} options={chartOptions} />
              </div>
            )}

            {!loading && !error && !chartData && (
              <div style={{ color: '#7f8c8d' }}>
                <p>Không có dữ liệu cho các tham số đã chọn</p>
              </div>
            )}
          </div>

          {/* Data Table Section */}
          {!loading && historicalData && historicalData.length > 0 && (
            <div style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', color: '#2c3e50' }}>
                Bảng Dữ Liệu Lịch Sử
              </h3>
              <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead style={{ position: 'sticky', top: 0, background: '#34495e', color: 'white', zIndex: 10 }}>
                    <tr>
                      <th style={{ padding: '0.8rem', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #2c3e50' }}>
                        Thời Gian
                      </th>
                      {MEASUREMENTS[selectedMeasurement as keyof typeof MEASUREMENTS]?.fields.map((field) => (
                        <th
                          key={field}
                          style={{ padding: '0.8rem', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #2c3e50' }}
                        >
                          {field.toUpperCase()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {historicalData.slice().reverse().map((row, index) => (
                      <tr
                        key={index}
                        style={{
                          backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white',
                        }}
                      >
                        <td style={{ padding: '0.8rem', borderBottom: '1px solid #ecf0f1' }}>
                          {new Date(row.time).toLocaleString('vi-VN')}
                        </td>
                        {MEASUREMENTS[selectedMeasurement as keyof typeof MEASUREMENTS]?.fields.map((field) => (
                          <td key={field} style={{ padding: '0.8rem', borderBottom: '1px solid #ecf0f1' }}>
                            {row[field] !== null && row[field] !== undefined
                              ? typeof row[field] === 'number'
                                ? (row[field] as number).toFixed(2)
                                : row[field]
                              : 'N/A'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
    </div>
  );
};

export default EnvironmentMonitoring;
