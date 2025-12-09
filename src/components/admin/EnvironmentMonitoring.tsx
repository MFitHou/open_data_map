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
import AdminMap from './map/AdminMap';
import './Admin.css';

export const EnvironmentMonitoring: React.FC = () => {
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
    </div>
  );
};

export default EnvironmentMonitoring;
