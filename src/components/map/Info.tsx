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

import React from "react";
import "../../styles/Info.css";

interface InfoProps {
  wardName?: string;
  stats: {
    calculatedArea: number;
    population: number | null;
    density: number | null;
  };
  pois: {
    schools: number;
    hospitals: number;
    restaurants: number;
    banks: number;
  };
  isLoadingBoundary: boolean;
  isLoadingPOIs: boolean;
}

export const Info: React.FC<InfoProps> = ({
  wardName,
  stats,
  pois,
  isLoadingBoundary,
  isLoadingPOIs,
}) => {
  return (
    <div className="info-container">
      <div className="info-header">
        <h4>📊 Thông tin phường</h4>
      </div>

      {isLoadingBoundary ? (
        <div className="info-loading">
          <div className="loading-spinner">⏳</div>
          <p>Đang tải ranh giới...</p>
        </div>
      ) : wardName ? (
        <div className="info-content">
          {/* Ward Name */}
          <div className="info-section ward-name">
            <span className="icon">📍</span>
            <span className="name">{wardName}</span>
          </div>

          {/* Stats */}
          <div className="info-section stats-grid">
            <div className="stat-item">
              <div className="stat-icon">📏</div>
              <div className="stat-details">
                <div className="stat-label">Diện tích</div>
                <div className="stat-value">{stats.calculatedArea} km²</div>
              </div>
            </div>

            {stats.population && (
              <div className="stat-item">
                <div className="stat-icon">👥</div>
                <div className="stat-details">
                  <div className="stat-label">Dân số</div>
                  <div className="stat-value">
                    {stats.population.toLocaleString()}
                  </div>
                </div>
              </div>
            )}

            {stats.density && (
              <div className="stat-item">
                <div className="stat-icon">🏘️</div>
                <div className="stat-details">
                  <div className="stat-label">Mật độ</div>
                  <div className="stat-value">
                    {stats.density.toLocaleString()} người/km²
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* POIs */}
          <div className="info-section">
            <div className="section-title">Dịch vụ công cộng</div>
            
            {isLoadingPOIs ? (
              <div className="poi-loading">
                <div className="loading-spinner">⏳</div>
                <span>Đang tải dịch vụ...</span>
              </div>
            ) : (
              <div className="poi-grid">
                <div className="poi-item">
                  <span className="poi-icon">🏫</span>
                  <span className="poi-label">Trường học</span>
                  <span className="poi-count">{pois.schools}</span>
                </div>

                <div className="poi-item">
                  <span className="poi-icon">🏥</span>
                  <span className="poi-label">Y tế</span>
                  <span className="poi-count">{pois.hospitals}</span>
                </div>

                <div className="poi-item">
                  <span className="poi-icon">🍴</span>
                  <span className="poi-label">Ăn uống</span>
                  <span className="poi-count">{pois.restaurants}</span>
                </div>

                <div className="poi-item">
                  <span className="poi-icon">🏦</span>
                  <span className="poi-label">Ngân hàng</span>
                  <span className="poi-count">{pois.banks}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="info-empty">
          <div className="empty-icon">🔍</div>
          <p>Tìm kiếm và chọn một phường để xem thông tin chi tiết</p>
        </div>
      )}
    </div>
  );
};