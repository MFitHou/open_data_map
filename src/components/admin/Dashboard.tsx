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
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { fetchDashboardStats, checkAdminHealth } from '../../utils/adminApi';
import type { DashboardStats } from '../../utils/adminApi';
import './Admin.css';

// Đăng ký các components Chart.js cần thiết
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

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

  // Chuẩn bị dữ liệu cho biểu đồ
  const getChartData = () => {
    if (!stats || !stats.breakdown) return null;

    // Sắp xếp theo số lượng giảm dần
    const sortedData = Object.entries(stats.breakdown)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10); // Lấy top 10

    const labels = sortedData.map(([type]) => 
      type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    );
    const data = sortedData.map(([, count]) => count);

    // Màu sắc cho biểu đồ
    const colors = [
      'rgba(59, 130, 246, 0.8)',   // Blue
      'rgba(16, 185, 129, 0.8)',   // Green
      'rgba(251, 146, 60, 0.8)',   // Orange
      'rgba(139, 92, 246, 0.8)',   // Purple
      'rgba(236, 72, 153, 0.8)',   // Pink
      'rgba(245, 158, 11, 0.8)',   // Amber
      'rgba(20, 184, 166, 0.8)',   // Teal
      'rgba(239, 68, 68, 0.8)',    // Red
      'rgba(168, 85, 247, 0.8)',   // Violet
      'rgba(14, 165, 233, 0.8)',   // Sky
    ];

    const borderColors = colors.map(color => color.replace('0.8', '1'));

    return {
      labels,
      data,
      colors,
      borderColors,
    };
  };

  const chartData = getChartData();

  // Cấu hình cho Bar Chart
  const barChartData = chartData ? {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Số lượng POIs',
        data: chartData.data,
        backgroundColor: chartData.colors,
        borderColor: chartData.borderColors,
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  } : null;

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Top 10 Loại POI',
        font: {
          size: 18,
          weight: 'bold' as const,
        },
        padding: 20,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
        },
        bodyFont: {
          size: 13,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            size: 12,
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        ticks: {
          font: {
            size: 11,
          },
          maxRotation: 45,
          minRotation: 45,
        },
        grid: {
          display: false,
        },
      },
    },
  };

  // Cấu hình cho Doughnut Chart
  const doughnutChartData = chartData ? {
    labels: chartData.labels.slice(0, 5), // Top 5 cho doughnut
    datasets: [
      {
        data: chartData.data.slice(0, 5),
        backgroundColor: chartData.colors.slice(0, 5),
        borderColor: chartData.borderColors.slice(0, 5),
        borderWidth: 2,
        hoverOffset: 10,
      },
    ],
  } : null;

  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 15,
          font: {
            size: 12,
          },
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      title: {
        display: true,
        text: 'Phân bố Top 5 Loại POI',
        font: {
          size: 18,
          weight: 'bold' as const,
        },
        padding: 20,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value.toLocaleString()} (${percentage}%)`;
          }
        },
      },
    },
  };

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
                  {stats?.graphCount.toLocaleString() || '0'}
                </h3>
                <p className="dashboard__stat-label">Loại POI</p>
              </div>
            </div>

            <div className="dashboard__stat-card">
              <FontAwesomeIcon icon={faFileAlt} className="dashboard__stat-icon" />
              <div className="dashboard__stat-info">
                <h3 className="dashboard__stat-value">
                  {stats?.topCategories?.length || '0'}
                </h3>
                <p className="dashboard__stat-label">Top Categories</p>
              </div>
            </div>
          </div>
        )}

        {stats && stats.topCategories && stats.topCategories.length > 0 && (
          <div className="dashboard__breakdown">
            <h3 className="dashboard__breakdown-title">Top 5 Loại POI</h3>
            <div className="dashboard__breakdown-grid">
              {stats.topCategories.map((category, index) => (
                <div key={category.type} className="dashboard__breakdown-item">
                  <span className="breakdown-label">
                    #{index + 1} {category.type.replace(/-/g, ' ').toUpperCase()}:
                  </span>
                  <span className="breakdown-value">{category.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Biểu đồ phân tích dữ liệu */}
        {stats && chartData && (
          <>
            {/* Charts Grid */}
            <div className="dashboard__charts-grid">
              {/* Bar Chart - Top 10 POIs */}
              <div className="dashboard__chart-card">
                <div className="chart-container" style={{ height: '400px', padding: '1rem' }}>
                  {barChartData && <Bar data={barChartData} options={barChartOptions} />}
                </div>
              </div>

              {/* Doughnut Chart - Top 5 POIs */}
              <div className="dashboard__chart-card">
                <div className="chart-container" style={{ height: '400px', padding: '1rem' }}>
                  {doughnutChartData && <Doughnut data={doughnutChartData} options={doughnutChartOptions} />}
                </div>
              </div>
            </div>

            {/* Chi tiết tất cả loại POI */}
            <div className="dashboard__breakdown" style={{ marginTop: '2rem' }}>
              <h3 className="dashboard__breakdown-title">
                Tất cả các loại POI ({Object.keys(stats.breakdown).length})
              </h3>
              <div 
                className="dashboard__breakdown-grid" 
                style={{ 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '1rem',
                  marginTop: '1rem',
                }}
              >
                {Object.entries(stats.breakdown)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => (
                    <div key={type} className="dashboard__breakdown-item">
                      <span className="breakdown-label">
                        {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                      </span>
                      <span className="breakdown-value">{count.toLocaleString()}</span>
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
