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

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faWind, faCloudSun, faTimes, faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import '../../styles/components/LayerMenu.css';

interface LayerMenuProps {
  // AQI Layer
  isAQIEnabled: boolean;
  isLoadingAQI: boolean;
  aqiStationCount: number;
  onToggleAQI: (enabled: boolean) => void;
  
  // Weather Layer
  isWeatherEnabled: boolean;
  isLoadingWeather: boolean;
  weatherStationCount: number;
  onToggleWeather: (enabled: boolean) => void;
}

export const LayerMenu: React.FC<LayerMenuProps> = ({
  isAQIEnabled,
  isLoadingAQI,
  aqiStationCount,
  onToggleAQI,
  isWeatherEnabled,
  isLoadingWeather,
  weatherStationCount,
  onToggleWeather,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleAQIToggle = () => {
    onToggleAQI(!isAQIEnabled);
  };

  const handleWeatherToggle = () => {
    onToggleWeather(!isWeatherEnabled);
  };

  const activeCount = (isAQIEnabled ? 1 : 0) + (isWeatherEnabled ? 1 : 0);

  return (
    <div className="layer-menu-container">
      {/* Hamburger Button */}
      <button 
        className={`layer-menu-toggle ${isOpen ? 'open' : ''} ${activeCount > 0 ? 'has-active' : ''}`}
        onClick={toggleMenu}
        aria-label="Layer Menu"
      >
        <FontAwesomeIcon icon={isOpen ? faTimes : faLayerGroup} />
        {activeCount > 0 && !isOpen && (
          <span className="active-count">{activeCount}</span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div className="layer-menu-backdrop" onClick={() => setIsOpen(false)} />
          <div className="layer-menu-dropdown">
          <div className="layer-menu-header">
            <FontAwesomeIcon icon={faLayerGroup} />
            <span>{t('map.layers')}</span>
          </div>            {/* AQI Layer Option */}
            <button 
              className={`layer-menu-item ${isAQIEnabled ? 'active' : ''}`}
              onClick={handleAQIToggle}
              disabled={isLoadingAQI}
            >
              <div className="layer-item-icon aqi">
                <FontAwesomeIcon icon={faWind} />
              </div>
              <div className="layer-item-content">
                <span className="layer-item-name">AQI</span>
                <span className="layer-item-desc">{t('aqi.title', 'Air Quality Index')}</span>
              </div>
              {isAQIEnabled && aqiStationCount > 0 && (
                <span className="layer-item-count">{aqiStationCount}</span>
              )}
              <div className={`layer-item-toggle ${isAQIEnabled ? 'on' : ''}`}>
                <div className="toggle-slider" />
              </div>
            </button>

            {/* Weather Layer Option */}
            <button 
              className={`layer-menu-item ${isWeatherEnabled ? 'active' : ''}`}
              onClick={handleWeatherToggle}
              disabled={isLoadingWeather}
            >
              <div className="layer-item-icon weather">
                <FontAwesomeIcon icon={faCloudSun} />
              </div>
              <div className="layer-item-content">
                <span className="layer-item-name">Weather</span>
                <span className="layer-item-desc">{t('weather.title', 'Weather Data')}</span>
              </div>
              {isWeatherEnabled && weatherStationCount > 0 && (
                <span className="layer-item-count">{weatherStationCount}</span>
              )}
              <div className={`layer-item-toggle ${isWeatherEnabled ? 'on' : ''}`}>
                <div className="toggle-slider" />
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default LayerMenu;
