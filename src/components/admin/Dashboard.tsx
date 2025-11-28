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
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMapMarkerAlt,
  faLeaf,
  faFileAlt,
  faSpinner,
  faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';
import { fetchDashboardStats, checkAdminHealth } from '../../utils/adminApi';
import type { DashboardStats } from '../../utils/adminApi';
import './Admin.css';

export const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApiHealthy, setIsApiHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      const healthy = await checkAdminHealth();
      setIsApiHealthy(healthy);
    };

    const loadStats = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchDashboardStats();
        
        if (data) {
          setStats(data);
        } else {
          setError('Không thể tải thống kê. Vui lòng kiểm tra kết nối backend.');
        }
      } catch (err) {
        console.error('Error loading stats:', err);
        setError('Có lỗi xảy ra khi tải dữ liệu. Backend có thể chưa khởi động.');
      } finally {
        setIsLoading(false);
      }
    };

    checkHealth();
    loadStats();
  }, []);

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div>
          <h1 className="dashboard__title">{t('admin.dashboard.title')}</h1>
          <p className="dashboard__subtitle">{t('admin.dashboard.subtitle')}</p>
        </div>
        {isApiHealthy !== null && (
          <div className={`dashboard__api-status ${isApiHealthy ? 'healthy' : 'unhealthy'}`}>
            <span className="status-dot"></span>
            <span className="status-text">
              API: {isApiHealthy ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        )}
      </header>
      
      <div className="dashboard__content">
        <div className="dashboard__card">
          <h2 className="dashboard__card-title">{t('admin.dashboard.welcome')}</h2>
          <p className="dashboard__card-text">{t('admin.dashboard.description')}</p>
        </div>

        {isLoading ? (
          <div className="dashboard__loading">
            <FontAwesomeIcon icon={faSpinner} spin size="2x" />
            <p>Đang tải thống kê...</p>
          </div>
        ) : error ? (
          <div className="dashboard__error">
            <FontAwesomeIcon icon={faExclamationTriangle} size="2x" />
            <p>{error}</p>
          </div>
        ) : (
          <div className="dashboard__stats">
            <div className="dashboard__stat-card">
              <FontAwesomeIcon icon={faMapMarkerAlt} className="dashboard__stat-icon" />
              <div className="dashboard__stat-info">
                <h3 className="dashboard__stat-value">
                  {stats?.totalPois.toLocaleString() || '0'}
                </h3>
                <p className="dashboard__stat-label">{t('admin.dashboard.totalPois')}</p>
              </div>
            </div>

            <div className="dashboard__stat-card">
              <FontAwesomeIcon icon={faLeaf} className="dashboard__stat-icon" />
              <div className="dashboard__stat-info">
                <h3 className="dashboard__stat-value">
                  {stats?.monitoringPoints.toLocaleString() || '0'}
                </h3>
                <p className="dashboard__stat-label">{t('admin.dashboard.monitoringPoints')}</p>
              </div>
            </div>

            <div className="dashboard__stat-card">
              <FontAwesomeIcon icon={faFileAlt} className="dashboard__stat-icon" />
              <div className="dashboard__stat-info">
                <h3 className="dashboard__stat-value">
                  {stats?.totalReports.toLocaleString() || '0'}
                </h3>
                <p className="dashboard__stat-label">{t('admin.dashboard.totalReports')}</p>
              </div>
            </div>
          </div>
        )}

        {stats && stats.breakdown && (
          <div className="dashboard__breakdown">
            <h3 className="dashboard__breakdown-title">Chi tiết phân loại POI</h3>
            <div className="dashboard__breakdown-grid">
              <div className="dashboard__breakdown-item">
                <span className="breakdown-label">ATMs:</span>
                <span className="breakdown-value">{stats.breakdown.atms.toLocaleString()}</span>
              </div>
              <div className="dashboard__breakdown-item">
                <span className="breakdown-label">Hospitals:</span>
                <span className="breakdown-value">{stats.breakdown.hospitals.toLocaleString()}</span>
              </div>
              <div className="dashboard__breakdown-item">
                <span className="breakdown-label">Toilets:</span>
                <span className="breakdown-value">{stats.breakdown.toilets.toLocaleString()}</span>
              </div>
              <div className="dashboard__breakdown-item">
                <span className="breakdown-label">Bus Stops:</span>
                <span className="breakdown-value">{stats.breakdown.busStops.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
