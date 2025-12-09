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
  faLayerGroup, 
  faChevronDown, 
  faChevronUp,
  faDollarSign,
  faUtensils,
  faCoffee,
  faHospital,
  faGraduationCap,
  faBus,
  faTree,
  faChargingStation,
  faShoppingCart,
  faPrescriptionBottle,
  faShieldAlt,
  faFireExtinguisher,
  faParking,
  faGasPump,
  faBook,
  faBuilding
} from '@fortawesome/free-solid-svg-icons';
import '../../styles/components/LayerControl.css';

interface LayerConfig {
  id: string;
  nameKey: string;
  icon: any;
  color: string;
  enabled: boolean;
  density: number;
}

interface LayerControlProps {
  onLayerChange: (enabledLayers: Array<{ id: string; name: string; density: number }>) => void;
}

const defaultLayers: LayerConfig[] = [
  { id: 'atm', nameKey: 'layerControl.layers.atm', icon: faDollarSign, color: '#4caf50', enabled: false, density: 100 },
  { id: 'bank', nameKey: 'layerControl.layers.bank', icon: faBuilding, color: '#2196f3', enabled: false, density: 100 },
  { id: 'restaurant', nameKey: 'layerControl.layers.restaurant', icon: faUtensils, color: '#ff9800', enabled: false, density: 100 },
  { id: 'cafe', nameKey: 'layerControl.layers.cafe', icon: faCoffee, color: '#795548', enabled: false, density: 100 },
  { id: 'hospital', nameKey: 'layerControl.layers.hospital', icon: faHospital, color: '#f44336', enabled: false, density: 100 },
  { id: 'school', nameKey: 'layerControl.layers.school', icon: faGraduationCap, color: '#3f51b5', enabled: false, density: 100 },
  { id: 'bus_stop', nameKey: 'layerControl.layers.bus_stop', icon: faBus, color: '#00bcd4', enabled: false, density: 100 },
  { id: 'park', nameKey: 'layerControl.layers.park', icon: faTree, color: '#4caf50', enabled: false, density: 100 },
  { id: 'charging_station', nameKey: 'layerControl.layers.charging_station', icon: faChargingStation, color: '#ffeb3b', enabled: false, density: 100 },
  { id: 'pharmacy', nameKey: 'layerControl.layers.pharmacy', icon: faPrescriptionBottle, color: '#e91e63', enabled: false, density: 100 },
  { id: 'police', nameKey: 'layerControl.layers.police', icon: faShieldAlt, color: '#3f51b5', enabled: false, density: 100 },
  { id: 'fire_station', nameKey: 'layerControl.layers.fire_station', icon: faFireExtinguisher, color: '#f44336', enabled: false, density: 100 },
  { id: 'parking', nameKey: 'layerControl.layers.parking', icon: faParking, color: '#607d8b', enabled: false, density: 100 },
  { id: 'fuel_station', nameKey: 'layerControl.layers.fuel_station', icon: faGasPump, color: '#ff5722', enabled: false, density: 100 },
  { id: 'supermarket', nameKey: 'layerControl.layers.supermarket', icon: faShoppingCart, color: '#009688', enabled: false, density: 100 },
  { id: 'library', nameKey: 'layerControl.layers.library', icon: faBook, color: '#9c27b0', enabled: false, density: 100 },
  { id: 'convenience_store', nameKey: 'layerControl.layers.convenience_store', icon: faShoppingCart, color: '#8bc34a', enabled: false, density: 100 },
];

export const LayerControl: React.FC<LayerControlProps> = ({ onLayerChange }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [layers, setLayers] = useState<LayerConfig[]>(() => {
    const saved = localStorage.getItem('mapLayers');
    if (saved) {
      try {
        const parsedLayers = JSON.parse(saved);
        // Migrate old format with 'name' to new format with 'nameKey'
        return parsedLayers.map((layer: any) => {
          const defaultLayer = defaultLayers.find(dl => dl.id === layer.id);
          return {
            ...layer,
            nameKey: defaultLayer?.nameKey || layer.nameKey || `layerControl.layers.${layer.id}`
          };
        });
      } catch (e) {
        console.error('Error parsing saved layers:', e);
        return defaultLayers;
      }
    }
    return defaultLayers;
  });
  const [activeLayer, setActiveLayer] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('mapLayers', JSON.stringify(layers));
    const enabledLayers = layers
      .filter(l => l.enabled)
      .map(l => ({ id: l.id, name: t(l.nameKey), density: l.density }));
    onLayerChange(enabledLayers);
  }, [layers, onLayerChange, t]);

  const toggleLayer = (layerId: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId 
        ? { ...layer, enabled: !layer.enabled }
        : layer
    ));
    setActiveLayer(layerId);
  };

  const updateDensity = (layerId: string, density: number) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId 
        ? { ...layer, density }
        : layer
    ));
  };

  const toggleAll = (enabled: boolean) => {
    setLayers(prev => prev.map(layer => ({ ...layer, enabled })));
  };

  const getEnabledCount = () => layers.filter(l => l.enabled).length;

  return (
    <>
      {/* Toggle Button */}
      <button 
        className="layer-control-button"
        onClick={() => setIsOpen(!isOpen)}
        title="Layers"
      >
        <FontAwesomeIcon icon={faLayerGroup} />
        {getEnabledCount() > 0 && (
          <span className="layer-badge">{getEnabledCount()}</span>
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="layer-control-panel">
          <div className="layer-control-header">
            <div className="header-left">
              <FontAwesomeIcon icon={faLayerGroup} />
              <span className="header-title">{t('layerControl.title')}</span>
            </div>
            <button 
              className="close-btn"
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>
          </div>

          <div className="layer-control-body">
            <div className="layer-control-actions">
              <button 
                className="action-btn"
                onClick={() => toggleAll(true)}
              >
                {t('layerControl.enableAll')}
              </button>
              <button 
                className="action-btn"
                onClick={() => toggleAll(false)}
              >
                {t('layerControl.disableAll')}
              </button>
            </div>

            <div className="layer-list">
              {layers.map(layer => (
                <div key={layer.id} className="layer-item">
                  <div className="layer-header">
                    <label className="layer-checkbox">
                      <input
                        type="checkbox"
                        checked={layer.enabled}
                        onChange={() => toggleLayer(layer.id)}
                      />
                      <span className="checkbox-custom"></span>
                    </label>
                    
                    <div 
                      className="layer-info"
                      onClick={() => setActiveLayer(activeLayer === layer.id ? null : layer.id)}
                    >
                      <FontAwesomeIcon 
                        icon={layer.icon} 
                        style={{ color: layer.color }}
                        className="layer-icon"
                      />
                      <span className="layer-name">{t(layer.nameKey)}</span>
                      <span className="layer-count">({layer.density})</span>
                    </div>
                  </div>

                  {layer.enabled && activeLayer === layer.id && (
                    <div className="density-slider">
                      <label className="slider-label">
                        {t('layerControl.density')}: <strong>{layer.density}</strong> {t('layerControl.points')}
                      </label>
                      <div className="slider-container">
                        <span className="slider-min">10</span>
                        <input
                          type="range"
                          min="10"
                          max="200"
                          step="10"
                          value={layer.density}
                          onChange={(e) => updateDensity(layer.id, parseInt(e.target.value))}
                          className="density-range"
                          style={{
                            background: `linear-gradient(to right, ${layer.color} 0%, ${layer.color} ${(layer.density - 10) / 190 * 100}%, #ddd ${(layer.density - 10) / 190 * 100}%, #ddd 100%)`
                          }}
                        />
                        <span className="slider-max">200</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LayerControl;
