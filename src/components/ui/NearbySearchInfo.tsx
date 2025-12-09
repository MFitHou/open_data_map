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
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faMapMarkerAlt, faCircle } from '@fortawesome/free-solid-svg-icons';
import '../../styles/components/NearbySearchInfo.css';

interface NearbySearchInfoProps {
  placesCount: number;
  searchCenter?: { lat: number; lon: number } | null;
  searchRadiusKm?: number | null;
  onClear: () => void;
}

export const NearbySearchInfo: React.FC<NearbySearchInfoProps> = ({
  placesCount,
  searchCenter,
  searchRadiusKm,
  onClear
}) => {
  const { t } = useTranslation();

  if (placesCount === 0) return null;

  return (
    <div className="nearby-search-info">
      <div className="nearby-search-info-content">
        <div className="nearby-search-info-icon">
          <FontAwesomeIcon icon={faMapMarkerAlt} />
        </div>
        <div className="nearby-search-info-text">
          <span className="nearby-search-info-count">
            {placesCount} {t('map.nearby.results', 'địa điểm')}
          </span>
          {searchRadiusKm && (
            <span className="nearby-search-info-radius">
              <FontAwesomeIcon icon={faCircle} className="radius-icon" />
              {searchRadiusKm >= 1 
                ? `${searchRadiusKm.toFixed(1)} km` 
                : `${(searchRadiusKm * 1000).toFixed(0)} m`
              }
            </span>
          )}
        </div>
      </div>
      <button 
        className="nearby-search-info-clear"
        onClick={onClear}
        title={t('map.nearby.clearResults', 'Xóa kết quả tìm kiếm')}
      >
        <FontAwesomeIcon icon={faTimes} />
        <span>{t('map.nearby.clear', 'Xóa')}</span>
      </button>
    </div>
  );
};

export default NearbySearchInfo;
