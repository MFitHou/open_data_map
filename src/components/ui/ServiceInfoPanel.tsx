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
import { UpdateForm } from '../map/UpdateForm';
import { requireAuth } from '../../utils/authUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes, 
  faMapMarkerAlt, 
  faLink, 
  faBroadcastTower,
  faChevronDown,
  faChevronUp,
  faPencil
} from '@fortawesome/free-solid-svg-icons';
import type { NearbyPlace, TopologyRelation } from '../../utils/nearbyApi';
import { getPlaceName } from '../../utils/nearbyApi';
import { getPlaceIcon, getPoiIcon, getPredicateDisplayName } from '../../utils/poiIcons';
import '../../styles/components/ServiceInfoPanel.css';

interface ServiceInfoPanelProps {
  place: NearbyPlace;
  onClose: () => void;
  onTopologyHover?: (topology: TopologyRelation | null, place: NearbyPlace) => void;
  onTopologyClick?: (topology: TopologyRelation, place: NearbyPlace) => void;
  onClearExploredMarkers?: () => void; // Clear all markers added from topology exploration
  exploredMarkersCount?: number; // Number of markers added from topology exploration
}

// Group topology by predicate
const groupTopologyByPredicate = (topology: TopologyRelation[]): Record<string, TopologyRelation[]> => {
  return topology.reduce((acc, topo) => {
    const predicate = topo.predicate || 'other';
    if (!acc[predicate]) {
      acc[predicate] = [];
    }
    acc[predicate].push(topo);
    return acc;
  }, {} as Record<string, TopologyRelation[]>);
};

// AQI level classification
const getAQILevel = (aqi: number): { label: string; labelVi: string; color: string; bgColor: string } => {
  if (aqi <= 50) return { label: 'Good', labelVi: 'Tốt', color: '#155724', bgColor: '#d4edda' };
  if (aqi <= 100) return { label: 'Moderate', labelVi: 'TB', color: '#856404', bgColor: '#fff3cd' };
  if (aqi <= 150) return { label: 'Unhealthy (SG)', labelVi: 'Kém', color: '#ff6b35', bgColor: '#ffe5d9' };
  if (aqi <= 200) return { label: 'Unhealthy', labelVi: 'Xấu', color: '#721c24', bgColor: '#f8d7da' };
  if (aqi <= 300) return { label: 'Very Unhealthy', labelVi: 'Rất xấu', color: '#4a0072', bgColor: '#e8d4f0' };
  return { label: 'Hazardous', labelVi: 'Nguy hại', color: '#fff', bgColor: '#7b1f3a' };
};

// Temperature level classification
const getTempLevel = (temp: number): { label: string; labelVi: string; color: string; bgColor: string } => {
  if (temp <= 15) return { label: 'Cold', labelVi: 'Lạnh', color: '#0c5460', bgColor: '#d1ecf1' };
  if (temp <= 25) return { label: 'Cool', labelVi: 'Mát', color: '#155724', bgColor: '#d4edda' };
  if (temp <= 32) return { label: 'Warm', labelVi: 'Ấm', color: '#856404', bgColor: '#fff3cd' };
  if (temp <= 38) return { label: 'Hot', labelVi: 'Nóng', color: '#ff6b35', bgColor: '#ffe5d9' };
  return { label: 'Very Hot', labelVi: 'Rất nóng', color: '#721c24', bgColor: '#f8d7da' };
};

// Noise level classification  
const getNoiseLevel = (noise: number): { label: string; labelVi: string; color: string; bgColor: string } => {
  if (noise <= 40) return { label: 'Quiet', labelVi: 'Yên tĩnh', color: '#155724', bgColor: '#d4edda' };
  if (noise <= 55) return { label: 'Moderate', labelVi: 'TB', color: '#0c5460', bgColor: '#d1ecf1' };
  if (noise <= 70) return { label: 'Loud', labelVi: 'Ồn', color: '#856404', bgColor: '#fff3cd' };
  if (noise <= 85) return { label: 'Very Loud', labelVi: 'Rất ồn', color: '#ff6b35', bgColor: '#ffe5d9' };
  return { label: 'Dangerous', labelVi: 'Nguy hiểm', color: '#721c24', bgColor: '#f8d7da' };
};

export const ServiceInfoPanel: React.FC<ServiceInfoPanelProps> = ({
  place,
  onClose,
  onTopologyHover,
  onTopologyClick,
  onClearExploredMarkers,
  exploredMarkersCount = 0
}) => {
  const { t, i18n } = useTranslation();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  
  // Get current language, default to 'vi'
  const currentLanguage = i18n.language?.startsWith('vi') ? 'vi' : 'en';

  /**
   * Xử lý khi click nút cập nhật thông tin
   * Kiểm tra đăng nhập trước khi mở form
   */
  const handleUpdateClick = async () => {
    setIsCheckingAuth(true);
    
    await requireAuth(
      // onSuccess: đã đăng nhập
      (user) => {
        console.log('User authenticated:', user.username);
        setShowUpdateForm(true);
        setIsCheckingAuth(false);
      },
      // onError: chưa đăng nhập
      () => {
        setIsCheckingAuth(false);
        const confirmLogin = window.confirm(
          t('map.updateForm.requireLogin', 'Bạn cần đăng nhập để cập nhật thông tin. Chuyển đến trang đăng nhập?')
        );
        if (confirmLogin) {
          window.location.href = '/login';
        }
      }
    );
  };

  const toggleGroup = (predicate: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [predicate]: !prev[predicate]
    }));
  };

  const topologyGroups = place.topology ? groupTopologyByPredicate(place.topology) : {};
  const hasTopology = place.topology && place.topology.length > 0;
  const hasIoT = place.iotStations && place.iotStations.length > 0;
  const hasRelated = place.relatedEntities && place.relatedEntities.length > 0;
  const hasSensorData = place.sensorData && (
    place.sensorData.aqi !== null || 
    place.sensorData.temperature !== null || 
    place.sensorData.noise_level !== null
  );

  const getRelatedName = (topo: TopologyRelation): string => {
    if (typeof topo.related === 'object') {
      return topo.related.name || topo.related.brand || 'Unknown';
    }
    return (topo as any).relatedName || 'Unknown';
  };

  const getRelatedType = (topo: TopologyRelation): string | null => {
    if (typeof topo.related === 'object') {
      return topo.related.amenity || topo.related.highway || topo.related.leisure || null;
    }
    return null;
  };

  // Get icon for topology related entity based on its type
  const getTopologyIcon = (topo: TopologyRelation): string => {
    if (typeof topo.related === 'object') {
      return getPoiIcon(topo.related.amenity, topo.related.highway, topo.related.leisure);
    }
    return '📍';
  };

  // Render sensor badge with tooltip
  const renderSensorBadge = (
    value: number | null, 
    unit: string, 
    icon: string,
    getLevel: (v: number) => { label: string; labelVi: string; color: string; bgColor: string },
    tooltipVi: string,
    tooltipEn: string
  ) => {
    if (value === null) return null;
    const level = getLevel(value);
    const displayLabel = currentLanguage === 'vi' ? level.labelVi : level.label;
    const tooltip = currentLanguage === 'vi' ? tooltipVi : tooltipEn;
    
    return (
      <div 
        className="sensor-badge"
        style={{ 
          borderColor: level.color,
          backgroundColor: level.bgColor,
          color: level.color 
        }}
        title={`${tooltip}: ${value}${unit} (${displayLabel})`}
      >
        <span className="sensor-icon">{icon}</span>
        <div className="sensor-info">
          <span className="sensor-value">{Math.round(value)}{unit}</span>
          <span className="sensor-label">{displayLabel}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="service-info-panel">
      {/* Header */}
      <div className="service-panel-header">
        <div className="service-panel-icon">
          {getPlaceIcon(place)}
        </div>
        <div className="service-panel-title">
          <h3>{getPlaceName(place, 0)}</h3>
          <span className="service-panel-type">
            {place.amenity || place.highway || place.leisure || 'Location'}
          </span>
        </div>
        <button className="service-panel-close" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>

      {/* Sensor Data Badges - Top section */}
      {hasSensorData && (
        <div className="sensor-badges-container">
          {renderSensorBadge(place.sensorData!.aqi, '', '🌬️', getAQILevel, 'Chất lượng không khí', 'Air Quality')}
          {renderSensorBadge(place.sensorData!.temperature, '°C', '🌡️', getTempLevel, 'Nhiệt độ', 'Temperature')}
          {renderSensorBadge(place.sensorData!.noise_level, 'dB', '🔊', getNoiseLevel, 'Độ ồn', 'Noise Level')}
        </div>
      )}

      {/* Content */}
      <div className="service-panel-content">
        {/* Basic Info */}
        <div className="service-info-section">
          <h4><FontAwesomeIcon icon={faMapMarkerAlt} /> {t('map.info.basicInfo', 'Basic Info')}</h4>
          <div className="service-info-grid">
            {place.brand && (
              <div className="service-info-row">
                <span className="label">{t('map.nearby.brand', 'Brand')}:</span>
                <span className="value">{place.brand}</span>
              </div>
            )}
            {place.operator && (
              <div className="service-info-row">
                <span className="label">{t('map.nearby.operator', 'Operator')}:</span>
                <span className="value">{place.operator}</span>
              </div>
            )}
            <div className="service-info-row">
              <span className="label">{t('map.nearby.distance', 'Distance')}:</span>
              <span className="value">{(place.distanceKm * 1000).toFixed(0)}m</span>
            </div>
            <div className="service-info-row">
              <span className="label">{t('map.info.coordinates', 'Coordinates')}:</span>
              <span className="value">{place.lat.toFixed(6)}, {place.lon.toFixed(6)}</span>
            </div>
            {place.access && (
              <div className="service-info-row">
                <span className="label">Access:</span>
                <span className="value">{place.access}</span>
              </div>
            )}
            {place.fee && (
              <div className="service-info-row">
                <span className="label">Fee:</span>
                <span className="value">{place.fee}</span>
              </div>
            )}
          </div>
          
          {/* Update Button */}
          <button 
            className="update-info-btn" 
            onClick={handleUpdateClick}
            disabled={isCheckingAuth}
            style={{
              width: '100%',
              padding: '10px',
              marginTop: '12px',
              backgroundColor: isCheckingAuth ? '#9E9E9E' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isCheckingAuth ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              opacity: isCheckingAuth ? 0.7 : 1
            }}
            onMouseOver={(e) => {
              if (!isCheckingAuth) {
                e.currentTarget.style.backgroundColor = '#45a049';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
              }
            }}
            onMouseOut={(e) => {
              if (!isCheckingAuth) {
                e.currentTarget.style.backgroundColor = '#4CAF50';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            <FontAwesomeIcon icon={faPencil} spin={isCheckingAuth} />
            <span>
              {isCheckingAuth 
                ? t('map.updateForm.checkingAuth', 'Đang kiểm tra...') 
                : t('map.updateForm.updateButton')}
            </span>
          </button>
        </div>

        {/* Topology Section */}
        {hasTopology && (
          <div className="service-info-section topology-section">
            <div className="topology-header-row">
              <h4><FontAwesomeIcon icon={faLink} /> {currentLanguage === 'vi' ? 'Quan hệ không gian' : 'Topology'} ({place.topology!.length})</h4>
              {exploredMarkersCount > 0 && onClearExploredMarkers && (
                <button 
                  className="clear-explored-btn"
                  onClick={onClearExploredMarkers}
                  title={currentLanguage === 'vi' ? 'Xóa các marker đã khám phá' : 'Clear explored markers'}
                >
                  <FontAwesomeIcon icon={faTimes} />
                  <span>{exploredMarkersCount}</span>
                </button>
              )}
            </div>
            <div className="topology-groups">
              {Object.entries(topologyGroups).map(([predicate, topos]) => (
                <div key={predicate} className="topology-group">
                  <div 
                    className="topology-group-header"
                    onClick={() => toggleGroup(predicate)}
                  >
                    <span className="group-name">
                      {getPredicateDisplayName(predicate, currentLanguage)} ({topos.length})
                    </span>
                    <FontAwesomeIcon 
                      icon={expandedGroups[predicate] ? faChevronUp : faChevronDown} 
                      className="toggle-icon"
                    />
                  </div>
                  {(expandedGroups[predicate] !== false) && (
                    <ul className="topology-list">
                      {topos.map((topo, idx) => (
                        <li 
                          key={idx}
                          className="topology-item"
                          onMouseEnter={() => onTopologyHover?.(topo, place)}
                          onMouseLeave={() => onTopologyHover?.(null, place)}
                          onClick={() => onTopologyClick?.(topo, place)}
                        >
                          <span className="topo-icon">{getTopologyIcon(topo)}</span>
                          <span className="topo-name">{getRelatedName(topo)}</span>
                          {getRelatedType(topo) && (
                            <span className="topo-type">{getRelatedType(topo)}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related Entities Section */}
        {hasRelated && (
          <div className="service-info-section related-section">
            <h4><FontAwesomeIcon icon={faLink} /> Related Places ({place.relatedEntities!.length})</h4>
            <ul className="related-list">
              {place.relatedEntities!.map((related, idx) => (
                <li key={idx} className="related-item">
                  <span className="related-name">{related.name || 'Unknown'}</span>
                  {related.distanceKm && (
                    <span className="related-distance">{(related.distanceKm * 1000).toFixed(0)}m</span>
                  )}
                  {related.amenity && (
                    <span className="related-type">{related.amenity}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* IoT Section */}
        {hasIoT && (
          <div className="service-info-section iot-section">
            <h4><FontAwesomeIcon icon={faBroadcastTower} /> IoT Stations ({place.iotStations!.length})</h4>
            <ul className="iot-list">
              {place.iotStations!.map((station, idx) => (
                <li key={idx} className="iot-item">
                  <span className="iot-icon">📡</span>
                  <span className="iot-name">{station}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* UpdateForm Modal */}
      {showUpdateForm && (
        <UpdateForm
          placeData={{
            name: getPlaceName(place, 0),
            lat: place.lat,
            lon: place.lon,
            type: place.amenity || place.highway || place.leisure || 'poi',
            poiId: place.poi || `${place.amenity || 'poi'}_${Date.now()}`
          }}
          onClose={() => setShowUpdateForm(false)}
        />
      )}
    </div>
  );
};
