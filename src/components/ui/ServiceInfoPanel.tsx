/**
 * Copyright (C) 2025 MFitHou
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes, 
  faMapMarkerAlt, 
  faLink, 
  faBroadcastTower,
  faChevronDown,
  faChevronUp,
  faExternalLinkAlt
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
  
  // Get current language, default to 'vi'
  const currentLanguage = i18n.language?.startsWith('vi') ? 'vi' : 'en';

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
    </div>
  );
};
