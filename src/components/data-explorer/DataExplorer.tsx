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
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faDatabase,
  faPlay,
  faCode,
  faTable,
  faDownload,
  faSpinner,
  faCircleXmark,
  faCircleCheck,
  faArrowLeft,
  faChartLine,
  faMapMarkedAlt
} from '@fortawesome/free-solid-svg-icons';
import { API_CONFIG } from '../../config/api';
import '../../styles/pages/DataExplorer.css';

type DataType = 'iot' | 'map';
type IotMeasurement = 'air_quality' | 'weather' | 'traffic' | 'flood';

interface QueryResult {
  success: boolean;
  count: number;
  data: any[];
}

// Định nghĩa các trường cho mỗi measurement (từ backend)
const IOT_FIELDS = {
  air_quality: ['aqi', 'pm25', 'pm10'],
  weather: ['noise_level', 'humidity', 'rain_1h', 'temperature', 'wind_speed'],
  traffic: ['avg_speed', 'intensity', 'noise_level'],
  flood: ['rain_1h', 'water_level']
};

const MAP_FIELDS = {
  // ATM & Banking
  atm: ['name', 'brand', 'operator', 'address'],
  bank: ['name', 'brand', 'operator', 'address'],
  
  // Transport
  bus_stop: ['name', 'network', 'operator'],
  
  // Food & Drink
  cafe: ['name', 'brand', 'cuisine', 'operator'],
  restaurant: ['name', 'cuisine', 'brand', 'operator'],
  
  // Retail
  convenience_store: ['name', 'brand', 'operator'],
  supermarket: ['name', 'brand', 'operator'],
  marketplace: ['name', 'operator'],
  warehouse: ['name', 'operator'],
  
  // Healthcare
  hospital: ['name', 'operator', 'emergency', 'beds'],
  clinic: ['name', 'operator', 'healthcare'],
  pharmacy: ['name', 'brand', 'operator'],
  
  // Education
  school: ['name', 'operator', 'grade'],
  university: ['name', 'operator'],
  kindergarten: ['name', 'operator'],
  
  // Recreation
  playground: ['name', 'operator', 'access'],
  park: ['name', 'operator', 'leisure'],
  
  // Infrastructure
  charging_station: ['name', 'operator', 'capacity'],
  fuel_station: ['name', 'brand', 'operator', 'fuel'],
  parking: ['name', 'operator', 'capacity', 'fee'],
  
  // Public Services
  post_office: ['name', 'operator'],
  library: ['name', 'operator'],
  community_centre: ['name', 'operator'],
  
  // Emergency Services
  police: ['name', 'operator'],
  fire_station: ['name', 'operator'],
  
  // Utilities
  drinking_water: ['name', 'access'],
  public_toilet: ['name', 'access', 'fee'],
  waste_basket: ['name', 'operator']
};

export const DataExplorer: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // State quản lý
  const [dataType, setDataType] = useState<DataType>('iot');
  const [selectedMeasurement, setSelectedMeasurement] = useState<IotMeasurement>('air_quality');
  const [selectedMapType, setSelectedMapType] = useState<string>('atm');
  const [selectedRelatedType, setSelectedRelatedType] = useState<string>('charging_station');
  const [selectedRelationship, setSelectedRelationship] = useState<string>('isNextTo');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState<string>('-1h'); // Default: 1 giờ trước
  const [selectedStation, setSelectedStation] = useState<string>('all'); // 'all' hoặc station_id
  const [availableStations, setAvailableStations] = useState<string[]>([]);
  const [results, setResults] = useState<QueryResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScript, setShowScript] = useState(false);
  const [customScript, setCustomScript] = useState<string>('');
  const [isEditingScript, setIsEditingScript] = useState(false);
  const [showRawData, setShowRawData] = useState(false);

  // Danh sách các loại dữ liệu IOT
  const iotMeasurements = [
    { value: 'air_quality', label: t('dataExplorer.iot.airQuality'), icon: faChartLine },
    { value: 'weather', label: t('dataExplorer.iot.weather'), icon: faChartLine },
    { value: 'traffic', label: t('dataExplorer.iot.traffic'), icon: faChartLine },
    { value: 'flood', label: t('dataExplorer.iot.flood'), icon: faChartLine }
  ];

  // Time ranges cho IOT data
  const timeRanges = [
    { value: '-15m', label: '15 phút' },
    { value: '-30m', label: '30 phút' },
    { value: '-1h', label: '1 giờ' },
    { value: '-3h', label: '3 giờ' },
    { value: '-6h', label: '6 giờ' },
    { value: '-12h', label: '12 giờ' },
    { value: '-24h', label: '24 giờ' },
    { value: '-7d', label: '7 ngày' }
  ];

  // Danh sách các loại mối quan hệ topology
  const relationshipTypes = [
    { value: 'isNextTo', label: 'Next To (Ở gần)', description: 'Tìm các điểm ở gần nhau' },
    { value: 'containedInPlace', label: 'Contained In (Ở trong)', description: 'Tìm các điểm nằm trong khu vực' },
    { value: 'amenityFeature', label: 'Has Amenity (Có tiện ích)', description: 'Tìm các điểm có tiện ích kèm theo' },
    { value: 'all', label: 'All Relationships (Tất cả)', description: 'Tìm tất cả các loại mối quan hệ' }
  ];

  // Load danh sách stations khi thay đổi measurement
  React.useEffect(() => {
    if (dataType === 'iot') {
      loadStations();
    }
  }, [selectedMeasurement, dataType]);

  // Load danh sách stations
  const loadStations = async () => {
    try {
      const response = await fetch(
        `${API_CONFIG.baseUrl}/influxdb/stations?measurement=${selectedMeasurement}`,
        { method: 'GET', headers: { 'Content-Type': 'application/json' } }
      );
      const data = await response.json();
      if (data.success && data.data) {
        const stations = [...new Set(data.data.map((item: any) => item.stationId))] as string[];
        setAvailableStations(stations);
        if (stations.length > 0 && !stations.includes(selectedStation)) {
          setSelectedStation('all');
        }
      }
    } catch (err) {
      console.error('Failed to load stations:', err);
    }
  };

  // Danh sách các loại dữ liệu bản đồ (từ backend admin.service.ts)
  const mapTypes = [
    // ATM & Banking
    { value: 'atm', label: 'ATM', icon: faMapMarkedAlt },
    { value: 'bank', label: 'Bank', icon: faMapMarkedAlt },
    // Transport
    { value: 'bus_stop', label: 'Bus Stop', icon: faMapMarkedAlt },
    // Food & Drink
    { value: 'cafe', label: 'Cafe', icon: faMapMarkedAlt },
    { value: 'restaurant', label: 'Restaurant', icon: faMapMarkedAlt },
    // Retail
    { value: 'convenience_store', label: 'Convenience Store', icon: faMapMarkedAlt },
    { value: 'supermarket', label: 'Supermarket', icon: faMapMarkedAlt },
    { value: 'marketplace', label: 'Marketplace', icon: faMapMarkedAlt },
    { value: 'warehouse', label: 'Warehouse', icon: faMapMarkedAlt },
    // Healthcare
    { value: 'hospital', label: 'Hospital', icon: faMapMarkedAlt },
    { value: 'clinic', label: 'Clinic', icon: faMapMarkedAlt },
    { value: 'pharmacy', label: 'Pharmacy', icon: faMapMarkedAlt },
    // Education
    { value: 'school', label: 'School', icon: faMapMarkedAlt },
    { value: 'university', label: 'University', icon: faMapMarkedAlt },
    { value: 'kindergarten', label: 'Kindergarten', icon: faMapMarkedAlt },
    // Recreation
    { value: 'playground', label: 'Playground', icon: faMapMarkedAlt },
    { value: 'park', label: 'Park', icon: faMapMarkedAlt },
    // Infrastructure
    { value: 'charging_station', label: 'Charging Station', icon: faMapMarkedAlt },
    { value: 'fuel_station', label: 'Fuel Station', icon: faMapMarkedAlt },
    { value: 'parking', label: 'Parking', icon: faMapMarkedAlt },
    // Public Services
    { value: 'post_office', label: 'Post Office', icon: faMapMarkedAlt },
    { value: 'library', label: 'Library', icon: faMapMarkedAlt },
    { value: 'community_centre', label: 'Community Centre', icon: faMapMarkedAlt },
    // Emergency Services
    { value: 'police', label: 'Police', icon: faMapMarkedAlt },
    { value: 'fire_station', label: 'Fire Station', icon: faMapMarkedAlt },
    // Utilities
    { value: 'drinking_water', label: 'Drinking Water', icon: faMapMarkedAlt },
    { value: 'public_toilet', label: 'Public Toilet', icon: faMapMarkedAlt },
    { value: 'waste_basket', label: 'Waste Basket', icon: faMapMarkedAlt }
  ];

  // Tạo script query cho IOT - Flux Query Builder
  const generateIotScript = (measurement: IotMeasurement, fields: string[]): string => {
    const selectedFieldsStr = fields.length > 0 ? fields : IOT_FIELDS[measurement];
    const fieldFilter = selectedFieldsStr.map(f => `r["_field"] == "${f}"`).join(' or ');
    
    const stationFilter = selectedStation !== 'all' 
      ? `  |> filter(fn: (r) => r["station_id"] == "${selectedStation}")\n`
      : '';

    return `// InfluxDB Flux Query
// Bucket: smartcity
// Measurement: ${measurement}
// Time Range: ${timeRange}
// Station: ${selectedStation === 'all' ? 'All Stations' : selectedStation}
// Fields: ${selectedFieldsStr.join(', ')}

from(bucket: "smartcity")
  |> range(start: ${timeRange})
  |> filter(fn: (r) => r["_measurement"] == "${measurement}")
${stationFilter}  |> filter(fn: (r) => ${fieldFilter})
  |> sort(columns: ["_time"], desc: true)
  |> limit(n: 1000)

// You can customize this query:
// - Change time range: range(start: -24h, stop: now())
// - Add aggregations: |> aggregateWindow(every: 1h, fn: mean)
// - Filter by value: |> filter(fn: (r) => r["_value"] > 50)
// - Group data: |> group(columns: ["station_id"])`;
  };

  // Tạo script query cho bản đồ - Topology Query Builder
  const generateMapScript = (targetType: string, relatedType: string, relationship: string): string => {
    const topologyGraphUri = 'http://localhost:3030/graph/topology';

    // Build relationship predicate
    let relationshipPredicate = '';
    if (relationship === 'isNextTo') {
      relationshipPredicate = `schema:isNextTo`;
    } else if (relationship === 'containedInPlace') {
      relationshipPredicate = `schema:containedInPlace`;
    } else if (relationship === 'amenityFeature') {
      relationshipPredicate = `schema:amenityFeature`;
    } else {
      // For 'all', we'll use a UNION in the query below
      relationshipPredicate = 'ALL';
    }

    let whereClause = '';
    if (relationshipPredicate === 'ALL') {
      whereClause = `
    {
      ?s schema:isNextTo ?o .
      BIND("isNextTo" AS ?relationship)
    } UNION {
      ?s schema:containedInPlace ?o .
      BIND("containedInPlace" AS ?relationship)
    } UNION {
      ?s schema:amenityFeature ?o .
      BIND("amenityFeature" AS ?relationship)
    }`;
    } else {
      whereClause = `
    ?s ${relationshipPredicate} ?o .
    BIND("${relationship}" AS ?relationship)`;
    }

    return `# SPARQL Topology Query
# Target Type: ${targetType}
# Related Type: ${relatedType}  
# Relationship: ${relationship}
# Note: This queries the topology graph directly to find all relationships

PREFIX schema: <http://schema.org/>

SELECT DISTINCT ?s ?o ?relationship
WHERE {
  GRAPH <${topologyGraphUri}> {${whereClause}
  }
}
LIMIT 500

# This returns all topology relationships in the graph.
# The result needs to be filtered by POI types on the client side.
# To see specific types, you would need to:
# 1. Query this to get all relationships
# 2. Query each POI's source graph to determine its type
# 3. Filter results by target/related types`;
  };

  // Toggle field selection
  const toggleField = (field: string) => {
    setSelectedFields(prev => 
      prev.includes(field) 
        ? prev.filter(f => f !== field)
        : [...prev, field]
    );
    setIsEditingScript(false);
  };

  // Select all fields
  const selectAllFields = () => {
    const allFields = dataType === 'iot' 
      ? IOT_FIELDS[selectedMeasurement]
      : MAP_FIELDS[selectedMapType as keyof typeof MAP_FIELDS] || [];
    setSelectedFields([...allFields]);
    setIsEditingScript(false);
  };

  // Clear all fields
  const clearAllFields = () => {
    setSelectedFields([]);
    setIsEditingScript(false);
  };

  // Get current script
  const getCurrentScript = (): string => {
    if (isEditingScript && customScript) {
      return customScript;
    }
    return dataType === 'iot'
      ? generateIotScript(selectedMeasurement, selectedFields)
      : generateMapScript(selectedMapType, selectedRelatedType, selectedRelationship);
  };

  // Thực thi query IOT - gửi Flux query
  const executeIotQuery = async () => {
    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      // Lấy query từ customScript (nếu có) hoặc tạo mới từ builder
      const query = customScript 
        ? customScript 
        : generateIotScript(selectedMeasurement, selectedFields.length > 0 ? selectedFields : IOT_FIELDS[selectedMeasurement]);
      
      console.log('🔍 Flux Query:', query);
      
      // Gửi Flux query qua POST endpoint
      const response = await fetch(`${API_CONFIG.baseUrl}/influxdb/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });

      const data = await response.json();
      console.log('📦 InfluxDB Response:', data);

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Query failed');
      }

      const resultData = data.data || [];
      console.log('📊 Got', resultData.length, 'results');

      setResults({
        success: true,
        count: resultData.length,
        data: resultData
      });
      
      // Cập nhật script nếu chưa có custom script
      if (!customScript) {
        setCustomScript(query);
      }
    } catch (err: any) {
      console.error('❌ IOT Query Error:', err);
      setError(err.message || t('dataExplorer.errors.unknown'));
    } finally {
      setIsLoading(false);
    }
  };

  // Thực thi query bản đồ - Query POIs first, then topology (like backend)
  const executeMapQuery = async () => {
    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      console.log('🔍 Step 1: Fetching target POIs of type:', selectedMapType);
      
      // Step 1: Get target POIs using REST API (simpler)
      const targetResponse = await fetch(
        `${API_CONFIG.baseUrl}/fuseki/pois-by-type?type=${selectedMapType}&limit=10000&language=vi`,
        { method: 'GET', headers: { 'Content-Type': 'application/json' } }
      );
      
      const targetData = await targetResponse.json();
      console.log('📦 Target POIs response:', targetData);
      
      if (!targetResponse.ok) {
        throw new Error(targetData.message || 'Failed to fetch target POIs');
      }
      
      const targetPOIs = targetData.results || [];
      if (targetPOIs.length === 0) {
        setError(`No ${selectedMapType} POIs found in database.`);
        setResults({ success: true, count: 0, data: [] });
        return;
      }
      
      console.log(`✅ Found ${targetPOIs.length} ${selectedMapType} POIs`);
      
      // Step 2: Get related POIs to filter topology results
      console.log(`🔍 Step 2: Fetching related POIs of type: ${selectedRelatedType}`);
      
      const relatedResponse = await fetch(
        `${API_CONFIG.baseUrl}/fuseki/pois-by-type?type=${selectedRelatedType}&limit=10000&language=vi`,
        { method: 'GET', headers: { 'Content-Type': 'application/json' } }
      );
      
      const relatedData = await relatedResponse.json();
      console.log('📦 Related POIs response:', relatedData);
      
      if (!relatedResponse.ok) {
        throw new Error(relatedData.message || 'Failed to fetch related POIs');
      }
      
      const relatedPOIs = relatedData.results || [];
      if (relatedPOIs.length === 0) {
        setError(`No ${selectedRelatedType} POIs found in database.`);
        setResults({ success: true, count: 0, data: [] });
        return;
      }
      
      console.log(`✅ Found ${relatedPOIs.length} ${selectedRelatedType} POIs`);
      
      // Step 3: Query topology for these specific POIs
      const poiUris = targetPOIs.map((poi: any) => `<${poi.poi}>`).join(' ');
      const relatedUris = relatedPOIs.map((poi: any) => `<${poi.poi}>`).join(' ');
      
      // Use correct graph URI from backend .env
      const topologyGraphUri = 'http://160.250.5.179:3030/hanoi-data/topology';
      
      // Build relationship clause (bidirectional like backend)
      let relationshipClause = '';
      if (selectedRelationship === 'isNextTo') {
        relationshipClause = `
          {
            ?poi schema:isNextTo ?related .
            BIND("isNextTo" AS ?predicate)
          } UNION {
            ?related schema:isNextTo ?poi .
            BIND("isNextTo" AS ?predicate)
          }`;
      } else if (selectedRelationship === 'containedInPlace') {
        relationshipClause = `
          {
            ?poi schema:containedInPlace ?related .
            BIND("containedInPlace" AS ?predicate)
          } UNION {
            ?related schema:containedInPlace ?poi .
            BIND("containedInPlace" AS ?predicate)
          }`;
      } else if (selectedRelationship === 'amenityFeature') {
        relationshipClause = `
          {
            ?poi schema:amenityFeature ?related .
            BIND("amenityFeature" AS ?predicate)
          } UNION {
            ?related schema:amenityFeature ?poi .
            BIND("amenityFeature" AS ?predicate)
          }`;
      } else {
        // all relationships
        relationshipClause = `
          {
            ?poi schema:isNextTo ?related .
            BIND("isNextTo" AS ?predicate)
          } UNION {
            ?related schema:isNextTo ?poi .
            BIND("isNextTo" AS ?predicate)
          } UNION {
            ?poi schema:containedInPlace ?related .
            BIND("containedInPlace" AS ?predicate)
          } UNION {
            ?related schema:containedInPlace ?poi .
            BIND("containedInPlace" AS ?predicate)
          } UNION {
            ?poi schema:amenityFeature ?related .
            BIND("amenityFeature" AS ?predicate)
          } UNION {
            ?related schema:amenityFeature ?poi .
            BIND("amenityFeature" AS ?predicate)
          }`;
      }
      
      const topologyQuery = `
PREFIX schema: <http://schema.org/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX geo: <http://www.opengis.net/ont/geosparql#>

SELECT ?poi ?predicate ?related ?relatedName
WHERE {
  GRAPH <${topologyGraphUri}> {
    VALUES ?poi { ${poiUris} }
    VALUES ?related { ${relatedUris} }
    ${relationshipClause}
  }
  
  # Get name of related POI from any graph
  OPTIONAL {
    GRAPH ?g {
      ?related schema:name ?relatedName .
    }
  }
}`;

      console.log('🔍 Step 3: Querying topology relationships...');
      console.log('Target POIs count:', targetPOIs.length);
      console.log('Related POIs count:', relatedPOIs.length);
      
      const topologyResponse = await fetch(`${API_CONFIG.baseUrl}/fuseki/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: topologyQuery })
      });
      
      const topologyResult = await topologyResponse.json();
      console.log('📦 Topology response:', topologyResult);
      
      if (!topologyResponse.ok) {
        throw new Error(topologyResult.message || 'Topology query failed');
      }
      
      const topologyData = topologyResult.data || [];
      console.log(`📊 Found ${topologyData.length} topology relationships`);
      
      if (topologyData.length === 0) {
        setError(`No ${selectedRelationship} relationships found for ${selectedMapType} POIs.`);
        setResults({ success: true, count: 0, data: [] });
        
        // Show query for reference
        setCustomScript(topologyQuery);
        return;
      }
      
      // Step 3: Group by target POI and build result
      const poiMap = new Map<string, any>();
      const relatedPoiMap = new Map(relatedPOIs.map((poi: any) => [poi.poi, poi]));
      
      // First, create entries for all target POIs
      targetPOIs.forEach((poi: any) => {
        if (!poiMap.has(poi.poi)) {
          poiMap.set(poi.poi, {
            poi: poi.poi,
            name: poi.name || 'Unknown',
            type: selectedMapType,
            lat: poi.lat,
            lon: poi.lon,
            relationships: []
          });
        }
      });
      
      // Then add topology relationships with related POI details
      topologyData.forEach((binding: any) => {
        const targetPoi = binding.poi;
        const relatedPoiUri = binding.related;
        
        if (poiMap.has(targetPoi)) {
          const relatedPoiInfo = relatedPoiMap.get(relatedPoiUri) as any;
          
          poiMap.get(targetPoi)!.relationships.push({
            predicate: binding.predicate || selectedRelationship,
            relatedPoi: relatedPoiUri,
            relatedName: binding.relatedName || relatedPoiInfo?.name || 'Unknown',
            relatedType: selectedRelatedType,
            relatedLat: relatedPoiInfo?.lat,
            relatedLon: relatedPoiInfo?.lon
          });
        }
      });
      
      // Filter to only POIs that have relationships
      const transformedData = Array.from(poiMap.values())
        .filter(item => item.relationships.length > 0)
        .map((item, idx) => ({
          id: idx + 1,
          ...item
        }));
      
      console.log('✅ Final data:', transformedData.slice(0, 3));
      console.log(`📊 ${transformedData.length} ${selectedMapType} POIs with relationships`);
      
      setResults({
        success: true,
        count: transformedData.length,
        data: transformedData
      });
      
      setCustomScript(topologyQuery);
      
    } catch (err: any) {
      console.error('❌ Map Query Error:', err);
      setError(err.message || t('dataExplorer.errors.unknown'));
    } finally {
      setIsLoading(false);
    }
  };

  // Thực thi query
  const executeQuery = () => {
    if (dataType === 'iot') {
      executeIotQuery();
    } else {
      executeMapQuery();
    }
  };

  // Download JSON
  const downloadJSON = () => {
    if (!results) return;
    
    const dataStr = JSON.stringify(results.data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${dataType}-${dataType === 'iot' ? selectedMeasurement : selectedMapType}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Render bảng kết quả
  const renderTable = () => {
    if (!results || results.count === 0) {
      return (
        <div className="no-results">
          <FontAwesomeIcon icon={faCircleXmark} />
          <span>{t('dataExplorer.noResults')}</span>
        </div>
      );
    }

    // Lấy columns từ row đầu tiên nếu có data
    const columns = results.data.length > 0 ? Object.keys(results.data[0]) : [];

    return (
      <div className="data-explorer-table-wrapper">
        <div className="results-header">
          <div className="results-info">
            <FontAwesomeIcon icon={faCircleCheck} />
            <span dangerouslySetInnerHTML={{ 
              __html: t('dataExplorer.foundResults', { count: results.count }) 
            }} />
          </div>
          <div className="results-actions">
            <button 
              className="btn-view-mode"
              onClick={() => setShowRawData(!showRawData)}
              title={showRawData ? 'View Table' : 'View Raw Data'}
            >
              <FontAwesomeIcon icon={showRawData ? faTable : faCode} />
              {showRawData ? 'View Table' : 'View Raw Data'}
            </button>
            <button 
              className="btn-script"
              onClick={() => setShowScript(!showScript)}
              title={t('dataExplorer.viewScript')}
            >
              <FontAwesomeIcon icon={faCode} />
              {showScript ? t('dataExplorer.hideScript') : t('dataExplorer.viewScript')}
            </button>
            <button 
              className="btn-download"
              onClick={downloadJSON}
              title={t('dataExplorer.downloadJSON')}
            >
              <FontAwesomeIcon icon={faDownload} />
              {t('dataExplorer.download')}
            </button>
          </div>
        </div>

        {showScript && (
          <div className="script-viewer">
            <div className="script-header">
              <FontAwesomeIcon icon={faCode} />
              <span>{t('dataExplorer.queryScript')}</span>
              <button 
                className="btn-edit-script"
                onClick={() => {
                  setIsEditingScript(!isEditingScript);
                  if (!isEditingScript) {
                    setCustomScript(getCurrentScript());
                  }
                }}
              >
                {isEditingScript ? t('dataExplorer.save') : t('dataExplorer.edit')}
              </button>
            </div>
            {isEditingScript ? (
              <textarea
                className="script-editor"
                value={customScript}
                onChange={(e) => setCustomScript(e.target.value)}
                rows={15}
              />
            ) : (
              <pre className="script-content">{customScript || getCurrentScript()}</pre>
            )}
          </div>
        )}

        {showRawData ? (
          <div className="raw-data-container">
            <pre className="raw-data-content">
              {JSON.stringify(results.data, null, 2)}
            </pre>
          </div>
        ) : (
          <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                {columns.map(col => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.data.map((row, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  {columns.map(col => (
                    <td key={col}>
                      {typeof row[col] === 'string' && row[col].startsWith('http') ? (
                        <a href={row[col]} target="_blank" rel="noopener noreferrer">
                          {row[col]}
                        </a>
                      ) : typeof row[col] === 'object' ? (
                        JSON.stringify(row[col])
                      ) : (
                        String(row[col] ?? 'N/A')
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>
    );
  };

  return (
    <div className="data-explorer-container">
      <div className="data-explorer-header">
        <button className="btn-back" onClick={() => navigate('/home')}>
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <h1>
          <FontAwesomeIcon icon={faDatabase} />
          {t('dataExplorer.title')}
        </h1>
      </div>

      <div className="data-explorer-content">
        {/* Panel chọn loại dữ liệu */}
        <div className="selection-panel">
          {/* Chọn Data Type */}
          <div className="data-type-selector">
            <div className="data-type-buttons">
              <button
                className={`type-btn-compact ${dataType === 'iot' ? 'active' : ''}`}
                onClick={() => {
                  setDataType('iot');
                  setSelectedFields([]); // Reset fields khi chuyển tab
                  setResults(null);
                  setError(null);
                  setShowScript(false);
                }}
              >
                <FontAwesomeIcon icon={faChartLine} />
                <span>IOT</span>
              </button>
              <button
                className={`type-btn-compact ${dataType === 'map' ? 'active' : ''}`}
                onClick={() => {
                  setDataType('map');
                  setSelectedFields([]); // Reset fields khi chuyển tab
                  setResults(null);
                  setError(null);
                  setShowScript(false);
                }}
              >
                <FontAwesomeIcon icon={faMapMarkedAlt} />
                <span>Map</span>
              </button>
            </div>
          </div>

          {/* Chọn measurement/type */}
          <div className="measurement-selector">
            <label className="selector-label">
              {dataType === 'iot' ? t('dataExplorer.measurement') : t('dataExplorer.type')}
            </label>
            <select 
              className="selector-dropdown"
              value={dataType === 'iot' ? selectedMeasurement : selectedMapType}
              onChange={(e) => {
                if (dataType === 'iot') {
                  setSelectedMeasurement(e.target.value as IotMeasurement);
                } else {
                  setSelectedMapType(e.target.value);
                }
                setSelectedFields([]);
                setIsEditingScript(false);
                setCustomScript(''); // Reset script khi thay đổi type
              }}
            >
              {dataType === 'iot' ? (
                iotMeasurements.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))
              ) : (
                mapTypes.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))
              )}
            </select>
          </div>

          {/* Time Range cho IOT */}
          {dataType === 'iot' && (
            <div className="time-range-selector">
              <label className="selector-label">{t('dataExplorer.timeRange')}</label>
              <select 
                className="selector-dropdown"
                value={timeRange}
                onChange={(e) => {
                  setTimeRange(e.target.value);
                  setCustomScript(''); // Reset script khi thay đổi time range
                }}
              >
                {timeRanges.map(tr => (
                  <option key={tr.value} value={tr.value}>{tr.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Station Selector cho IOT */}
          {dataType === 'iot' && (
            <div className="station-selector">
              <label className="selector-label">{t('dataExplorer.station')}</label>
              <select 
                className="selector-dropdown"
                value={selectedStation}
                onChange={(e) => {
                  setSelectedStation(e.target.value);
                  setCustomScript(''); // Reset script khi thay đổi station
                }}
              >
                <option value="all">{t('dataExplorer.allStations')}</option>
                {availableStations.map(stationId => (
                  <option key={stationId} value={stationId}>{stationId}</option>
                ))}
              </select>
            </div>
          )}

          {/* Related Type Selector cho Map - Topology Query Builder */}
          {dataType === 'map' && (
            <>
              <div className="related-type-selector">
                <label className="selector-label">{t('dataExplorer.relatedType')}</label>
                <select 
                  className="selector-dropdown"
                  value={selectedRelatedType}
                  onChange={(e) => {
                    setSelectedRelatedType(e.target.value);
                    setCustomScript(''); // Reset script khi thay đổi related type
                  }}
                >
                  {mapTypes.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div className="relationship-selector">
                <label className="selector-label">{t('dataExplorer.relationship')}</label>
                <select 
                  className="selector-dropdown"
                  value={selectedRelationship}
                  onChange={(e) => {
                    setSelectedRelationship(e.target.value);
                    setCustomScript(''); // Reset script khi thay đổi relationship
                  }}
                >
                  {relationshipTypes.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
                <div className="relationship-description">
                  {relationshipTypes.find(r => r.value === selectedRelationship)?.description}
                </div>
              </div>
            </>
          )}

          {/* Chọn fields - CHỈ cho IOT */}
          {dataType === 'iot' && (
            <div className="fields-selector">
              <div className="fields-header">
                <h3>{t('dataExplorer.selectFields')}</h3>
                <div className="fields-actions">
                  <button className="btn-text" onClick={selectAllFields}>
                    {t('dataExplorer.selectAll')}
                  </button>
                  <button className="btn-text" onClick={clearAllFields}>
                    {t('dataExplorer.clearAll')}
                  </button>
                </div>
              </div>
              <div className="fields-checkboxes">
                {IOT_FIELDS[selectedMeasurement].map(field => (
                  <label key={field} className="field-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedFields.includes(field)}
                      onChange={() => toggleField(field)}
                    />
                    <span>{field}</span>
                  </label>
                ))}
              </div>
              {selectedFields.length > 0 && (
                <div className="selected-fields-info">
                  {t('dataExplorer.selectedCount', { count: selectedFields.length })}
                </div>
              )}
            </div>
          )}

          {/* Button thực thi */}
          <button 
            className="btn-execute"
            onClick={executeQuery}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin />
                {t('dataExplorer.loading')}
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faPlay} />
                {t('dataExplorer.execute')}
              </>
            )}
          </button>
        </div>

        {/* Panel hiển thị kết quả */}
        <div className="results-panel">
          {error && (
            <div className="error-message">
              <FontAwesomeIcon icon={faCircleXmark} />
              <span>{error}</span>
            </div>
          )}

          {results && (
            <div className="results-container">
              <div className="results-tabs">
                <button className="tab-btn active">
                  <FontAwesomeIcon icon={faTable} />
                  {t('dataExplorer.tableView')}
                </button>
              </div>
              {renderTable()}
            </div>
          )}

          {!results && !error && !isLoading && (
            <div className="empty-state">
              <FontAwesomeIcon icon={faDatabase} size="3x" />
              <p>{t('dataExplorer.emptyState')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataExplorer;
