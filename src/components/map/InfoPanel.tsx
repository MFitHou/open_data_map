import React, { useState, useEffect } from 'react';
import '../../styles/InfoPanel.css';

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
  memberNames?: Record<number, string>; // ✅ Thêm prop mới
}

interface WikidataInfo {
  label?: string;
  description?: string;
  image?: string;
  claims?: Record<string, any>;
  allProperties?: { [key: string]: string };
  propertyUrls?: { [key: string]: string };
  propertyEntityIds?: { [key: string]: string }; // property label -> Qid (để link)
}

interface ReferenceInfo {
  property: string;
  propertyLabel: string;
  references: Array<{ [key: string]: string }>;
}

interface ExternalLink {
  label: string;
  url: string;
  type: string;
}

export const InfoPanel: React.FC<InfoPanelProps> = ({ 
  data, 
  onClose, 
  onMemberClick,
  memberNames = {} // ✅ Default empty object
}) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'identifiers' | 'statements' | 'references' | 'members'>('basic');
  const [wikidataInfo, setWikidataInfo] = useState<WikidataInfo | null>(null);
  const [references, setReferences] = useState<ReferenceInfo[]>([]);
  const [externalLinks, setExternalLinks] = useState<ExternalLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [rowPropLabels, setRowPropLabels] = useState<Record<string, string>>({});
  const [selectedMemberRef, setSelectedMemberRef] = useState<number | null>(null); // ✅ Track member được chọn

  useEffect(() => {
    if (data.wikidataId && (activeTab === 'statements' || activeTab === 'references')) {
      fetchWikidataInfo(data.wikidataId);
    }
  }, [data.wikidataId, activeTab]);

  useEffect(() => {
    generateExternalLinks();
  }, [data]);

  // Lấy label cho các hàng có dạng Pxxx
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

  const generateExternalLinks = () => {
    const links: ExternalLink[] = [];
    if (data.wikidataId) {
      links.push({ label: 'Wikidata Entity', url: `https://www.wikidata.org/wiki/${data.wikidataId}`, type: 'wikidata' });
    }
    if (data.coordinates) {
      links.push({
        label: 'Google Maps',
        url: `https://www.google.com/maps?q=${data.coordinates[1]},${data.coordinates[0]}`,
        type: 'map'
      });
      links.push({
        label: 'OpenStreetMap',
        url: `https://www.openstreetmap.org/?mlat=${data.coordinates[1]}&mlon=${data.coordinates[0]}&zoom=16`,
        type: 'map'
      });
    }
    if (data.osmId && data.osmType) {
      links.push({
        label: `OSM ${data.osmType} ${data.osmId}`,
        url: `https://www.openstreetmap.org/${data.osmType}/${data.osmId}`,
        type: 'osm'
      });
    }
    if (data.identifiers?.osmRelationId) {
      links.push({
        label: `OSM Relation ${data.identifiers.osmRelationId}`,
        url: `https://www.openstreetmap.org/relation/${data.identifiers.osmRelationId}`,
        type: 'osm'
      });
    }
    if (data.identifiers?.osmNodeId) {
      links.push({
        label: `OSM Node ${data.identifiers.osmNodeId}`,
        url: `https://www.openstreetmap.org/node/${data.identifiers.osmNodeId}`,
        type: 'osm'
      });
    }
    if (data.identifiers?.osmWayId) {
      links.push({
        label: `OSM Way ${data.identifiers.osmWayId}`,
        url: `https://www.openstreetmap.org/way/${data.identifiers.osmWayId}`,
        type: 'osm'
      });
    }
    if (data.identifiers?.viafId) {
      links.push({
        label: `VIAF ${data.identifiers.viafId}`,
        url: `https://viaf.org/viaf/${data.identifiers.viafId}`,
        type: 'authority'
      });
    }
    if (data.identifiers?.gndId) {
      links.push({
        label: `GND ${data.identifiers.gndId}`,
        url: `https://d-nb.info/gnd/${data.identifiers.gndId}`,
        type: 'authority'
      });
    }
    if (data.statements?.website) {
      links.push({ label: 'Official Website', url: data.statements.website, type: 'website' });
    }
    if (data.statements?.phone) {
      links.push({ label: `Phone: ${data.statements.phone}`, url: `tel:${data.statements.phone}`, type: 'contact' });
    }
    if (data.statements?.email) {
      links.push({ label: `Email: ${data.statements.email}`, url: `mailto:${data.statements.email}`, type: 'contact' });
    }
    setExternalLinks(links);
  };

  const fetchLabels = async (ids: Set<string>): Promise<Record<string, string>> => {
    if (ids.size === 0) return {};
    const allIds = Array.from(ids).slice(0, 450);
    const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&props=labels&ids=${allIds.join('|')}&languages=vi|en&format=json&origin=*`;
    const res = await fetch(url);
    const json = await res.json();
    const out: Record<string, string> = {};
    if (json.entities) {
      Object.entries(json.entities).forEach(([id, entity]: any) => {
        out[id] = entity.labels?.vi?.value || entity.labels?.en?.value || id;
      });
    }
    return out;
  };

  const fetchWikidataInfo = async (qid: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`);
      const json = await response.json();
      const entity = json.entities[qid];
      if (!entity) {
        setWikidataInfo(null);
        return;
      }

      const propertyIds = new Set<string>();
      const entityIds = new Set<string>();

      Object.entries(entity.claims || {}).forEach(([propId, claims]: [string, any]) => {
        propertyIds.add(propId);
        claims.forEach((c: any) => {
          const dv = c.mainsnak?.datavalue;
            if (dv?.type === 'wikibase-entityid') entityIds.add(dv.value.id);
            c.references?.forEach((r: any) => {
              Object.entries(r.snaks || {}).forEach(([refPropId, refSnaks]: [string, any]) => {
                propertyIds.add(refPropId);
                const refSnak = refSnaks[0];
                const rdv = refSnak?.datavalue;
                if (rdv?.type === 'wikibase-entityid') entityIds.add(rdv.value.id);
              });
            });
        });
      });

      const labels = await fetchLabels(new Set<string>([...propertyIds, ...entityIds, qid]));

      const info: WikidataInfo = {
        label: labels[qid] || qid,
        description: entity.descriptions?.vi?.value || entity.descriptions?.en?.value,
        claims: entity.claims,
        allProperties: {},
        propertyUrls: {},
        propertyEntityIds: {}
      };

      if (entity.claims?.P18) {
        const imageFile = entity.claims.P18[0].mainsnak.datavalue.value;
        info.image = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(imageFile)}?width=300`;
      }

      Object.entries(entity.claims || {}).forEach(([propId, claims]: [string, any]) => {
        const claim = claims[0];
        const dv = claim.mainsnak?.datavalue;
        if (!dv) return;
        let value = '';
        let isUrl = false;
        switch (dv.type) {
          case 'string':
            if (typeof dv.value === 'string') {
              if (dv.value.startsWith('http')) {
                isUrl = true;
                value = dv.value; // giữ nguyên giá trị thật
              } else {
                value = dv.value;
              }
            }
            break;
          case 'time':
            value = dv.value.time.substring(1, 11);
            break;
          case 'quantity':
            value = dv.value.amount;
            break;
          case 'wikibase-entityid':
            value = labels[dv.value.id] || dv.value.id;
            info.propertyEntityIds![labels[propId] || propId] = dv.value.id;
            break;
          case 'globecoordinate':
            value = `${dv.value.latitude.toFixed(6)}, ${dv.value.longitude.toFixed(6)}`;
            break;
        }
        if (propId !== 'P18' && value) {
          const propLabel = labels[propId] || propId;
          if (!info.allProperties![propLabel]) {
            info.allProperties![propLabel] = value;
            if (isUrl) info.propertyUrls![propLabel] = dv.value;
          }
        }
      });

      // References + additional links (giữ nguyên)
      const refs: ReferenceInfo[] = [];
      const additionalLinks: ExternalLink[] = [];
      Object.entries(entity.claims || {}).forEach(([propId, claims]: [string, any]) => {
        const claim = claims[0];
        const dv = claim.mainsnak?.datavalue;
        if (dv?.type === 'string') {
          const v: string = dv.value;
          if (v.startsWith('http')) {
            additionalLinks.push({ label: (labels[propId] || propId), url: v, type: 'wikidata-claim' });
          } else if (propId === 'P1329') {
            additionalLinks.push({ label: (labels[propId] || 'Phone') + ': ' + v, url: `tel:${v}`, type: 'wikidata-claim' });
          } else if (propId === 'P968') {
            additionalLinks.push({ label: (labels[propId] || 'Email') + ': ' + v, url: `mailto:${v}`, type: 'wikidata-claim' });
          }
        }
        if (claim.references && claim.references.length > 0) {
          const refData: Array<{ [key: string]: string }> = [];
          claim.references.forEach((ref: any) => {
            const refObj: { [key: string]: string } = {};
            Object.entries(ref.snaks || {}).forEach(([refPropId, refSnaks]: [string, any]) => {
              const refSnak = refSnaks[0];
              const rdv = refSnak?.datavalue;
              if (!rdv) return;
              let refValue = '';
              if (rdv.type === 'string') refValue = rdv.value;
              else if (rdv.type === 'time') refValue = rdv.value.time.substring(1, 11);
              else if (rdv.type === 'wikibase-entityid') refValue = labels[rdv.value.id] || rdv.value.id;
              if (refValue) {
                const refLabel = labels[refPropId] || refPropId;
                refObj[refLabel] = refValue;
              }
            });
            if (Object.keys(refObj).length > 0) refData.push(refObj);
          });
          if (refData.length > 0) {
            refs.push({
              property: propId,
              propertyLabel: labels[propId] || propId,
              references: refData
            });
          }
        }
      });

      setReferences(refs);
      setExternalLinks(prev => {
        const existing = new Set(prev.map(l => l.url));
        const merged = [...prev];
        additionalLinks.forEach(l => { if (!existing.has(l.url)) merged.push(l); });
        return merged;
      });
      setWikidataInfo(info);
    } catch (e) {
      console.error('Error fetching Wikidata:', e);
      setWikidataInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper: sinh URL cho value nếu nhận dạng được
  const resolveValueLink = (label: string, value: string): string | undefined => {
    // Raw URL
    if (/^https?:\/\//i.test(value)) return value;

    // Wikidata entity (Qxxx)
    if (/^Q\d+$/.test(value)) return `https://www.wikidata.org/wiki/${value}`;

    // Property id (Pxxx) -> trang property
    if (/^P\d+$/.test(value)) return `https://www.wikidata.org/wiki/Property:${value}`;

    // VIAF
    if (/^\d{5,}$/.test(value) && /VIAF/i.test(label)) return `https://viaf.org/viaf/${value}`;

    // GND (thường có chữ + số hoặc 9 chữ số)
    if (/GND/i.test(label)) return `https://d-nb.info/gnd/${value}`;

    // OSM IDs
    if (/OSM Relation ID/i.test(label)) return `https://www.openstreetmap.org/relation/${value}`;
    if (/OSM Node ID/i.test(label)) return `https://www.openstreetmap.org/node/${value}`;
    if (/OSM Way ID/i.test(label)) return `https://www.openstreetmap.org/way/${value}`;
    if (/Wikidata ID/i.test(label) && /^Q\d+$/.test(value)) return `https://www.wikidata.org/wiki/${value}`;

    // Phone / Email (nếu lộ ra)
    if (/@/.test(value) && !value.startsWith('mailto:')) return `mailto:${value}`;
    if (/^\+?\d[\d\s\-()]{5,}$/.test(value)) return `tel:${value}`;

    return undefined;
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

  const handleMemberClick = (member: { type: string; ref: number; role?: string }) => {
    setSelectedMemberRef(member.ref);
    if (onMemberClick) {
      onMemberClick(member);
    }
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

  // THAY isAdminArea cũ bằng phiên bản mới chỉ kiểm tra từ khóa tiếng Việt
  const isAdminArea = React.useMemo(() => {
    const title = (data.title || '').toLowerCase();
    const vnKeywords = [
      'quận','phường','xã','tỉnh','huyện','thành phố','thị trấn'
    ];
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
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'basic' ? 'active' : ''}`} 
          onClick={() => setActiveTab('basic')} 
          title="Basic Information"
        >
          📋
        </button>
        <button 
          className={`tab ${activeTab === 'identifiers' ? 'active' : ''}`} 
          onClick={() => setActiveTab('identifiers')} 
          title="Identifiers"
        >
          🔗
        </button>
        {data.wikidataId && (
          <button 
            className={`tab ${activeTab === 'statements' ? 'active' : ''}`} 
            onClick={() => setActiveTab('statements')} 
            title="Statements"
          >
            📊
          </button>
        )}
        <button 
          className={`tab ${activeTab === 'references' ? 'active' : ''}`} 
          onClick={() => setActiveTab('references')} 
          title="References & Links"
        >
          📎
        </button>
        {data.members && (
          <button 
            className={`tab ${activeTab === 'members' ? 'active' : ''}`} 
            onClick={() => setActiveTab('members')} 
            title="OSM Members"
          >
            🗺️
          </button>
        )}
      </div>

      <div className="panel-content">
        {activeTab === 'basic' && renderBasicTab()}
        {activeTab === 'identifiers' && renderIdentifiersTab()}
        {activeTab === 'statements' && renderStatementsTab()}
        {activeTab === 'references' && renderReferencesTab()}
        {activeTab === 'members' && renderMembersTab()}
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