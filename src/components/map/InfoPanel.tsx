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
import '../../styles/InfoPanel.css';
import { DownloadButton } from './DownloadButton';
import { fetchWikidataInfo, fetchLabels } from '../../utils/wikidataUtils';
import type { WikidataInfo, ReferenceInfo } from '../../utils/wikidataUtils';
import { resolveValueLink, generateExternalLinks } from '../../utils/linkResolver';
import type { ExternalLink } from '../../utils/linkResolver';
import { fetchNearbyPlaces, getAmenityIcon, getPlaceName } from '../../utils/nearbyApi';
import type { NearbyPlace } from '../../utils/nearbyApi';


interface InfoPanelProps {
  data: {
    category: string;
    title: string;
    subtitle?: string;
    rows: { label: string; value: string }[];
    wikidataId?: string;
    coordinates?: [number, number];
    osmId?: string;
    osmType?: string;
    identifiers?: {
      osmRelationId?: string;
      osmNodeId?: string;
      osmWayId?: string;
      viafId?: string;
      gndId?: string;
    };
    statements?: {
      inception?: string;
      population?: string;
      area?: string;
      website?: string;
      phone?: string;
      email?: string;
      address?: string;
      postalCode?: string;
    };
    members?: {
      innerWays: number;
      outerWays: number;
      nodes: number;
      subAreas: number;
      total: number;
      details: Array<{
        type: string;
        ref: number;
        role?: string;
        tags?: Record<string, string>;
      }>;
    };
  };
  onClose: () => void;
  onMemberClick?: (member: { type: string; ref: number; role?: string }) => void;
  memberNames?: Record<number, string>;
  // ✅ Thêm callbacks cho nearby markers
  onNearbyPlacesChange?: (places: NearbyPlace[]) => void;
}

export const InfoPanel: React.FC<InfoPanelProps> = ({ 
  data, 
  onClose, 
  onMemberClick,
  memberNames = {},
  onNearbyPlacesChange
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'basic' | 'identifiers' | 'statements' | 'references' | 'members' | 'tasks'>('basic');
  const [wikidataInfo, setWikidataInfo] = useState<WikidataInfo | null>(null);
  const [references, setReferences] = useState<ReferenceInfo[]>([]);
  const [externalLinks, setExternalLinks] = useState<ExternalLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [rowPropLabels, setRowPropLabels] = useState<Record<string, string>>({});
  const [selectedMemberRef, setSelectedMemberRef] = useState<number | null>(null);
  
  // ✅ Tasks sub-tab state
  const [activeTaskTab, setActiveTaskTab] = useState<'nearby' | 'route' | 'statistics'>('nearby');
  
  // ✅ Nearby state (không auto-fetch)
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [nearbyRadius, setNearbyRadius] = useState(1);
  const [nearbyAmenity, setNearbyAmenity] = useState('toilets');
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);
  const [hasSearchedNearby, setHasSearchedNearby] = useState(false);

  useEffect(() => {
    if (data.wikidataId && (activeTab === 'statements' || activeTab === 'references')) {
      setIsLoading(true);
      fetchWikidataInfo(data.wikidataId).then(({ wikidataInfo, references }) => {
        setWikidataInfo(wikidataInfo);
        setReferences(references);
        setIsLoading(false);
      });
    }
  }, [data.wikidataId, activeTab]);

  useEffect(() => {
    const links = generateExternalLinks(data);
    setExternalLinks(links);
  }, [data]);

  useEffect(() => {
    const ids = new Set<string>();
    data.rows.forEach(r => {
      if (/^P\d+$/.test(r.label)) ids.add(r.label);
    });
    if (ids.size > 0) {
      fetchLabels(ids).then(map => setRowPropLabels(map));
    } else {
      setRowPropLabels({});
    }
  }, [data.rows]);

  // ✅ Hàm fetch manual
  const handleSearchNearby = async () => {
    if (!data.coordinates) return;

    setIsLoadingNearby(true);
    setNearbyPlaces([]);
    setHasSearchedNearby(true);
    
    // ✅ Clear markers trên map
    if (onNearbyPlacesChange) {
      onNearbyPlacesChange([]);
    }

    try {
      const response = await fetchNearbyPlaces(
        data.coordinates[0],
        data.coordinates[1],
        nearbyRadius,
        nearbyAmenity
      );
      
      if (response) {
        setNearbyPlaces(response.items);
        
        // ✅ Gửi markers lên parent component (Map)
        if (onNearbyPlacesChange) {
          onNearbyPlacesChange(response.items);
        }
      }
    } catch (error) {
      console.error('Error fetching nearby places:', error);
    } finally {
      setIsLoadingNearby(false);
    }
  };

  // ✅ Clear markers khi đổi amenity
  const handleAmenityChange = (newAmenity: string) => {
    setNearbyAmenity(newAmenity);
    setNearbyPlaces([]);
    setHasSearchedNearby(false);
    
    if (onNearbyPlacesChange) {
      onNearbyPlacesChange([]);
    }
  };

  // ✅ Clear markers khi rời tab
  useEffect(() => {
    if (activeTab !== 'tasks' || activeTaskTab !== 'nearby') {
      setNearbyPlaces([]);
      if (onNearbyPlacesChange) {
        onNearbyPlacesChange([]);
      }
    }
  }, [activeTab, activeTaskTab, onNearbyPlacesChange]);

  const handleMemberClick = (member: { type: string; ref: number; role?: string }) => {
    setSelectedMemberRef(member.ref);
    if (onMemberClick) {
      onMemberClick(member);
    }
  };

  // ✅ Render Nearby content với nút Search
  const renderNearbyContent = () => {
    if (!data.coordinates) {
      return <div className="no-data">❌ Không có tọa độ để tìm kiếm địa điểm gần</div>;
    }

    return (
      <>
        {/* Filters */}
        <div className="nearby-filters">
          <div className="filter-group">
            <label htmlFor="amenity-select">{t('map.nearby.selectType')}</label>
            <select 
              id="amenity-select"
              value={nearbyAmenity} 
              onChange={(e) => handleAmenityChange(e.target.value)}
              className="nearby-select"
            >
              <option value="toilets">{t('map.nearby.toilets')}</option>
              <option value="atms">{t('map.nearby.atms')}</option>
              <option value="hospitals">{t('map.nearby.hospitals')}</option>
              <option value="bus-stops">{t('map.nearby.busStops')}</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="radius-select">{t('map.nearby.selectRadius')}</label>
            <select 
              id="radius-select"
              value={nearbyRadius} 
              onChange={(e) => setNearbyRadius(Number(e.target.value))}
              className="nearby-select"
            >
              <option value="0.5">0.5 km</option>
              <option value="1">1 km</option>
              <option value="2">2 km</option>
              <option value="5">5 km</option>
              <option value="10">10 km</option>
            </select>
          </div>

          {/* ✅ Nút Search */}
          <button 
            className="search-button"
            onClick={handleSearchNearby}
            disabled={isLoadingNearby}
          >
            {isLoadingNearby ? `⏳ ${t('common.status.searching')}` : `🔍 ${t('common.button.search')}`}
          </button>
        </div>

        {/* Results */}
        {isLoadingNearby ? (
          <div className="loading">{t('map.nearby.searching')}</div>
        ) : nearbyPlaces.length === 0 ? (
          <div className="no-data">
            {!hasSearchedNearby
              ? t('map.nearby.selectAndSearch')
              : `${t('map.nearby.noPlacesFound')} ${nearbyAmenity} ${t('map.nearby.inRadius')} ${nearbyRadius} ${t('map.nearby.km')}`
            }
          </div>
        ) : (
          <div className="reference-group">
            <div className="reference-title">
              {t('map.nearby.found')} {nearbyPlaces.length} {nearbyAmenity} {t('map.nearby.inRadius')} {nearbyRadius} {t('map.nearby.km')}
            </div>
            
            {nearbyPlaces.map((place, idx) => (
              <div key={idx} className="nearby-item">
                <div className="nearby-header">
                  <span className="nearby-icon">{getAmenityIcon(place)}</span>
                  <span className="nearby-name">
                    {getPlaceName(place, idx)}
                  </span>
                  <span className="nearby-distance">
                    📍 {(place.distanceKm * 1000).toFixed(0)}m
                  </span>
                </div>

                <div className="nearby-details">
                  {/* Type */}
                  <div className="nearby-detail">
                    <span className="detail-label">{t('map.nearby.type')}:</span>
                    <span className="detail-value">
                      {place.highway || place.amenity || 'N/A'}
                    </span>
                  </div>

                  {/* Brand */}
                  {place.brand && (
                    <div className="nearby-detail">
                      <span className="detail-label">{t('map.nearby.brand')}:</span>
                      <span className="detail-value">{place.brand}</span>
                    </div>
                  )}

                  {/* Operator */}
                  {place.operator && (
                    <div className="nearby-detail">
                      <span className="detail-label">{t('map.nearby.operator')}:</span>
                      <span className="detail-value">{place.operator}</span>
                    </div>
                  )}

                  {/* Access */}
                  {place.access && (
                    <div className="nearby-detail">
                      <span className="detail-label">Truy cập:</span>
                      <span className="detail-value">{place.access}</span>
                    </div>
                  )}

                  {/* Fee */}
                  {place.fee && (
                    <div className="nearby-detail">
                      <span className="detail-label">Phí:</span>
                      <span className="detail-value">
                        {place.fee === 'yes' ? 'Có phí' : 'Miễn phí'}
                      </span>
                    </div>
                  )}
                  
                  {/* Coordinates */}
                  <div className="nearby-detail">
                    <span className="detail-label">{t('map.info.coordinates')}:</span>
                    <a 
                      href={`https://www.google.com/maps?q=${place.lat},${place.lon}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="detail-link"
                    >
                      {place.lat.toFixed(6)}, {place.lon.toFixed(6)} ↗
                    </a>
                  </div>
                  
                  {/* POI URI */}
                  <div className="nearby-detail">
                    <span className="detail-label">POI URI:</span>
                    <a 
                      href={place.poi}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="detail-link"
                      style={{ fontSize: '11px', wordBreak: 'break-all' }}
                    >
                      {place.poi} ↗
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </>
    );
  };

  // ✅ Render Route content (placeholder)
  const renderRouteContent = () => {
    return (
      <div className="no-data">
        🚧 Chức năng tính đường đi đang được phát triển...
      </div>
    );
  };

  // ✅ Render Statistics content (placeholder)
  const renderStatisticsContent = () => {
    return (
      <div className="no-data">
        📊 Chức năng thống kê đang được phát triển...
      </div>
    );
  };

  // ✅ Render Tasks Tab với sub-tabs
  const renderTasksTab = () => {
    return (
      <div className="tab-content">
        {/* Sub-tabs */}
        <div className="sub-tabs">
          <button 
            className={`sub-tab-btn ${activeTaskTab === 'nearby' ? 'active' : ''}`}
            onClick={() => setActiveTaskTab('nearby')}
          >
            📍 Địa điểm gần
          </button>
          <button 
            className={`sub-tab-btn ${activeTaskTab === 'route' ? 'active' : ''}`}
            onClick={() => setActiveTaskTab('route')}
            disabled
          >
            🗺️ Tính đường đi
          </button>
          <button 
            className={`sub-tab-btn ${activeTaskTab === 'statistics' ? 'active' : ''}`}
            onClick={() => setActiveTaskTab('statistics')}
            disabled
          >
            📊 Thống kê
          </button>
        </div>

        {/* Sub-tab content */}
        <div className="sub-tab-content">
          {activeTaskTab === 'nearby' && renderNearbyContent()}
          {activeTaskTab === 'route' && renderRouteContent()}
          {activeTaskTab === 'statistics' && renderStatisticsContent()}
        </div>
      </div>
    );
  };

  const renderBasicTab = () => {
    const rows = data.rows.map(r => {
      const label = rowPropLabels[r.label] || r.label;
      const link = resolveValueLink(label, r.value);
      return { label, value: r.value, link };
    });

    if (data.coordinates) {
      const lat = data.coordinates[1].toFixed(6);
      const lon = data.coordinates[0].toFixed(6);
      rows.push({
        label: 'Coordinates',
        value: `${lat}, ${lon}`,
        link: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}&zoom=16`
      });
    }

    return (
      <div className="tab-content">
        {rows.map((row, i) => (
          <div key={i} className="data-row">
            <span className="data-label">{row.label}</span>
            <span className="data-value">
              {row.link ? (
                <a href={row.link} target="_blank" rel="noopener noreferrer">{row.value}</a>
              ) : row.value.startsWith('http') ? (
                <a href={row.value} target="_blank" rel="noopener noreferrer">{row.value}</a>
              ) : (
                row.value
              )}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const renderIdentifiersTab = () => {
    const identifiers: { label: string; value: string }[] = [];
    if (data.wikidataId) identifiers.push({ label: 'Wikidata ID', value: data.wikidataId });
    if (data.osmId) identifiers.push({ label: 'OSM ID', value: data.osmId });
    if (data.osmType) identifiers.push({ label: 'OSM Type', value: data.osmType });

    if (data.identifiers) {
      if (data.identifiers.osmRelationId) identifiers.push({ label: 'OSM Relation ID', value: data.identifiers.osmRelationId });
      if (data.identifiers.osmNodeId) identifiers.push({ label: 'OSM Node ID', value: data.identifiers.osmNodeId });
      if (data.identifiers.osmWayId) identifiers.push({ label: 'OSM Way ID', value: data.identifiers.osmWayId });
      if (data.identifiers.viafId) identifiers.push({ label: 'VIAF ID', value: data.identifiers.viafId });
      if (data.identifiers.gndId) identifiers.push({ label: 'GND ID', value: data.identifiers.gndId });
    }

    if (identifiers.length === 0) return <div className="no-data">No identifiers available</div>;

    return (
      <div className="tab-content">
        {identifiers.map((item, i) => {
          const link = resolveValueLink(item.label, item.value);
          return (
            <div key={i} className="data-row">
              <span className="data-label">{item.label}</span>
              <span className="data-value">
                {link ? (
                  <a href={link} target="_blank" rel="noopener noreferrer">{item.value}</a>
                ) : (
                  item.value
                )}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderStatementsTab = () => {
    if (isLoading) return <div className="loading">Loading...</div>;

    const statements: { label: string; value: string; link?: string }[] = [];

    if (data.statements) {
      if (data.statements.inception) {
        statements.push({
          label: 'Inception',
          value: new Date(data.statements.inception).toLocaleDateString('vi-VN')
        });
      }
      if (data.statements.population) {
        statements.push({
          label: 'Population',
          value: parseInt(data.statements.population).toLocaleString('vi-VN')
        });
      }
      if (data.statements.area) {
        statements.push({
          label: 'Area (km²)',
          value: parseFloat(data.statements.area).toLocaleString('vi-VN')
        });
      }
      if (data.statements.address) statements.push({ label: 'Address', value: data.statements.address });
      if (data.statements.postalCode) statements.push({ label: 'Postal Code', value: data.statements.postalCode });
    }

    if (wikidataInfo?.allProperties) {
      Object.entries(wikidataInfo.allProperties).forEach(([k, v]) => {
        if (!statements.find(s => s.label.toLowerCase() === k.toLowerCase())) {
          const directUrl = wikidataInfo.propertyUrls?.[k];
          const entityQid = wikidataInfo.propertyEntityIds?.[k];
          const link = directUrl
            ? directUrl
            : entityQid
              ? `https://www.wikidata.org/wiki/${entityQid}`
              : resolveValueLink(k, v);
          statements.push({ label: k, value: v, link });
        }
      });
    }

    if (statements.length === 0) return <div className="no-data">No statements available</div>;

    return (
      <div className="tab-content">
        {wikidataInfo?.image && <img src={wikidataInfo.image} alt="Entity" className="entity-image" />}
        {statements.map((item, i) => (
          <div key={i} className="data-row">
            <span className="data-label">{item.label}</span>
            <span className="data-value">
              {item.link ? (
                <a href={item.link} target="_blank" rel="noopener noreferrer">{item.value}</a>
              ) : item.value.startsWith('http') ? (
                <a href={item.value} target="_blank" rel="noopener noreferrer">{item.value}</a>
              ) : (
                item.value
              )}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const renderReferencesTab = () => {
    if (isLoading) return <div className="loading">Loading...</div>;
    const hasReferences = references.length > 0;
    const hasLinks = externalLinks.length > 0;
    if (!hasReferences && !hasLinks) return <div className="no-data">No references or external links available</div>;

    return (
      <div className="tab-content">
        {hasLinks && (
          <div className="reference-group">
            <div className="reference-title">External Links</div>
            {externalLinks.map((link, idx) => (
              <div key={idx} className="reference-item">
                <div className="reference-detail">
                  <span className="ref-prop">{link.label}</span>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="ref-link">
                    {link.url}
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
        {hasReferences && (
          <>
            {references.map((refInfo, idx) => (
              <div key={idx} className="reference-group">
                <div className="reference-title">{refInfo.propertyLabel} - References</div>
                {refInfo.references.map((ref, refIdx) => (
                  <div key={refIdx} className="reference-block">
                    <div className="reference-index">Reference {refIdx + 1}</div>
                    {Object.entries(ref).map(([key, value], i) => {
                      const link = resolveValueLink(key, value) || (value.startsWith('http') ? value : undefined);
                      return (
                        <div key={i} className="reference-detail">
                          <span className="ref-prop">{key}</span>
                          {link ? (
                            <a href={link} target="_blank" rel="noopener noreferrer" className="ref-link">
                              {value}
                            </a>
                          ) : (
                            <span className="ref-value">{value}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            ))}
          </>
        )}
      </div>
    );
  };

  const renderMembersTab = () => {
    if (!data.members) return <div className="no-data">No members data available</div>;

    const { innerWays, outerWays, nodes, subAreas, total, details } = data.members;

    const groupedMembers = {
      'Outer Ways': details.filter(m => m.type === 'way' && m.role === 'outer'),
      'Inner Ways': details.filter(m => m.type === 'way' && m.role === 'inner'),
      'Nodes': details.filter(m => m.type === 'node'),
      'Sub-areas (Relations)': details.filter(m => m.type === 'relation')
    };

    return (
      <div className="tab-content">
        {/* Thống kê tổng quan */}
        <div className="reference-group">
          <div className="reference-title">📊 Tổng quan Members</div>
          <div className="data-row">
            <span className="data-label">Tổng số</span>
            <span className="data-value">{total} members</span>
          </div>
          <div className="data-row">
            <span className="data-label">🔵 Outer Ways</span>
            <span className="data-value">{outerWays}</span>
          </div>
          <div className="data-row">
            <span className="data-label">🔴 Inner Ways</span>
            <span className="data-value">{innerWays}</span>
          </div>
          <div className="data-row">
            <span className="data-label">🟠 Nodes</span>
            <span className="data-value">{nodes}</span>
          </div>
          <div className="data-row">
            <span className="data-label">🟡 Sub-areas</span>
            <span className="data-value">{subAreas}</span>
          </div>
        </div>

        {/* Chi tiết từng nhóm */}
        {Object.entries(groupedMembers).map(([groupName, members]) => {
          if (members.length === 0) return null;
          
          const groupIcon = 
            groupName.includes('Outer') ? '🔵' :
            groupName.includes('Inner') ? '🔴' :
            groupName.includes('Node') ? '🟠' : '🟡';
          
          return (
            <div key={groupName} className="reference-group">
              <div className="reference-title">{groupIcon} {groupName} ({members.length})</div>
              {members.slice(0, 20).map((member, idx) => {
                // ✅ Hiển thị tên nếu có
                const memberName = memberNames?.[member.ref];
                
                return (
                  <div 
                    key={idx} 
                    className={`reference-block member-clickable ${selectedMemberRef === member.ref ? 'member-selected' : ''}`}
                    data-type={member.type}
                    onClick={() => handleMemberClick(member)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="reference-index">
                      {/* ✅ Hiển thị tên hoặc ID */}
                      {memberName ? (
                        <>
                          <strong style={{ fontSize: '13px' }}>{memberName}</strong>
                          <span style={{ fontSize: '11px', color: '#888', marginLeft: '6px' }}>
                            ({member.type} #{member.ref})
                          </span>
                        </>
                      ) : (
                        <>{member.type.toUpperCase()} #{member.ref}</>
                      )}
                      {member.role && (
                        <span className={`member-role-badge ${member.role}`}>
                          {member.role}
                        </span>
                      )}
                    </div>
                    <div className="reference-detail">
                      <span className="ref-prop">Type:</span>
                      <span className="ref-value">{member.type}</span>
                    </div>
                    <div className="reference-detail">
                      <span className="ref-prop">ID:</span>
                      <a 
                        href={`https://www.openstreetmap.org/${member.type}/${member.ref}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ref-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {member.ref}
                      </a>
                    </div>
                    {member.tags && Object.keys(member.tags).length > 0 && (
                      <div className="reference-detail">
                        <span className="ref-prop">Tags:</span>
                        <span className="ref-value">
                          {Object.entries(member.tags)
                            .slice(0, 3)
                            .map(([k, v]) => `${k}=${v}`)
                            .join(', ')}
                          {Object.keys(member.tags).length > 3 && '...'}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
              {members.length > 20 && (
                <div className="no-data" style={{ padding: '10px', fontSize: '12px' }}>
                  Hiển thị 20/{members.length} items
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const isAdminArea = React.useMemo(() => {
    const title = (data.title || '').toLowerCase();
    const vnKeywords = ['quận','phường','xã','tỉnh','huyện','thành phố','thị trấn'];
    return vnKeywords.some(k => title.includes(k));
  }, [data.title]);

  return (
    <div className={`info-panel ${isAdminArea ? 'admin-area' : ''}`}>
      <div className="panel-header">
        <div className="panel-title">
          <div className="category-badge">{getCategoryIcon(data.category)}</div>
          <div>
            <h2>{data.title}</h2>
            {data.subtitle && <p className="subtitle">{data.subtitle}</p>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <DownloadButton 
            data={data} 
            memberNames={memberNames}
            wikidataProperties={wikidataInfo?.allProperties}
            rowPropLabels={rowPropLabels}
          />
          <button className="close-btn" onClick={onClose}><span>✕</span></button>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="panel-tabs">
        <button 
          className={`tab-btn ${activeTab === 'basic' ? 'active' : ''}`}
          onClick={() => setActiveTab('basic')}
        >
          {t('map.info.basicTab')}
        </button>
        <button 
          className={`tab-btn ${activeTab === 'identifiers' ? 'active' : ''}`}
          onClick={() => setActiveTab('identifiers')}
        >
          {t('map.info.identifiersTab')}
        </button>
        {data.wikidataId && (
          <>
            <button 
              className={`tab-btn ${activeTab === 'statements' ? 'active' : ''}`}
              onClick={() => setActiveTab('statements')}
            >
              {t('map.info.statementsTab')}
            </button>
            <button 
              className={`tab-btn ${activeTab === 'references' ? 'active' : ''}`}
              onClick={() => setActiveTab('references')}
            >
              {t('map.info.referencesTab')}
            </button>
          </>
        )}
        {data.members && (
          <button 
            className={`tab-btn ${activeTab === 'members' ? 'active' : ''}`}
            onClick={() => setActiveTab('members')}
          >
            {t('map.info.membersTab')}
          </button>
        )}
        {/* ✅ Tasks Tab */}
        <button 
          className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          {t('map.info.tasksTab')}
        </button>
      </div>

      {/* Tab Content */}
      <div className="panel-content">
        {activeTab === 'basic' && renderBasicTab()}
        {activeTab === 'identifiers' && renderIdentifiersTab()}
        {activeTab === 'statements' && renderStatementsTab()}
        {activeTab === 'references' && renderReferencesTab()}
        {activeTab === 'members' && renderMembersTab()}
        {activeTab === 'tasks' && renderTasksTab()}
      </div>
    </div>
  );
};

const getCategoryIcon = (category: string): string => {
  const icons: Record<string, string> = {
    atm: '🏧',
    bank: '🏦',
    school: '🏫',
    hospital: '🏥',
    restaurant: '🍴',
    ward: '🗺️',
    search: '📍'
  };
  return icons[category] || '📌';
};