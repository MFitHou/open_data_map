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
import { useTranslation } from 'react-i18next';
import "../../styles/components/Info.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartBar, faSpinner, faSearch } from '@fortawesome/free-solid-svg-icons';

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
  const { t } = useTranslation();
  
  return (
    <div className="info-container">
      <div className="info-header">
        <h4><FontAwesomeIcon icon={faChartBar} /> {t('map.info.wardInfo')}</h4>
      </div>

      {isLoadingBoundary ? (
        <div className="info-loading">
          <div className="loading-spinner">
            <FontAwesomeIcon icon={faSpinner} spin />
          </div>
          <p>{t('map.info.loadingBoundary')}</p>
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
                <div className="stat-label">{t('map.info.area')}</div>
                <div className="stat-value">{stats.calculatedArea} km²</div>
              </div>
            </div>

            {stats.population && (
              <div className="stat-item">
                <div className="stat-icon">👥</div>
                <div className="stat-details">
                  <div className="stat-label">{t('map.info.population')}</div>
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
                  <div className="stat-label">{t('map.info.density')}</div>
                  <div className="stat-value">
                    {stats.density.toLocaleString()} {t('map.info.peoplePerKm')}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* POIs */}
          <div className="info-section">
            <div className="section-title">{t('map.info.publicServices')}</div>
            
            {isLoadingPOIs ? (
              <div className="poi-loading">
                <div className="loading-spinner">
                  <FontAwesomeIcon icon={faSpinner} spin />
                </div>
                <span>{t('map.info.loadingServices')}</span>
              </div>
            ) : (
              <div className="poi-grid">
                <div className="poi-item">
                  <span className="poi-icon">🏫</span>
                  <span className="poi-label">Schools</span>
                  <span className="poi-count">{pois.schools}</span>
                </div>

                <div className="poi-item">
                  <span className="poi-icon">🏥</span>
                  <span className="poi-label">Healthcare</span>
                  <span className="poi-count">{pois.hospitals}</span>
                </div>

                <div className="poi-item">
                  <span className="poi-icon">🍴</span>
                  <span className="poi-label">Restaurants</span>
                  <span className="poi-count">{pois.restaurants}</span>
                </div>

                <div className="poi-item">
                  <span className="poi-icon">🏦</span>
                  <span className="poi-label">Banks</span>
                  <span className="poi-count">{pois.banks}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="info-empty">
          <div className="empty-icon">
            <FontAwesomeIcon icon={faSearch} size="2x" />
          </div>
          <p>{t('map.info.emptyState')}</p>
        </div>
      )}
    </div>
  );
};