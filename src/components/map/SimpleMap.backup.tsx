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

import { MapContainer, TileLayer, Marker, GeoJSON, ZoomControl, useMap, Polyline, Popup, Polygon } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import React, { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Search } from "./Search";
import { SearchResult as SearchResultComponent } from "./SearchResult";
import { InfoPanel } from './InfoPanel';
import { loadATMsWithStats } from "../../utils/rdfParser";
import { fetchOutlineByOSMRelationId } from '../../utils/overpass';
import { getAmenityIcon, getPlaceName } from '../../utils/nearbyApi'; 
import type { NearbyPlace } from '../../utils/nearbyApi'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLocationCrosshairs, faSpinner } from '@fortawesome/free-solid-svg-icons';
import MapChatbot from './MapChatbot';


const calculatePolygonArea = (coordinates: number[][]): number => {
  if (coordinates.length < 3) return 0;
  
  let area = 0;
  const earthRadius = 6371;
  
  for (let i = 0; i < coordinates.length; i++) {
    const j = (i + 1) % coordinates.length;
    const lat1 = coordinates[i][1] * Math.PI / 180;
    const lat2 = coordinates[j][1] * Math.PI / 180;
    const lon1 = coordinates[i][0] * Math.PI / 180;
    const lon2 = coordinates[j][0] * Math.PI / 180;
    
    area += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  
  area = Math.abs(area * earthRadius * earthRadius / 2);
  return area;
};

// Hàm lấy dân số từ Wikidata (thông qua OSM relation ID)
const fetchPopulationData = async (osmId: number) => {
  try {
    // Query Wikidata để tìm thông tin dân số
    const wikidataQuery = `
      SELECT ?population ?area WHERE {
        ?item wdt:P402 "${osmId}" .
        OPTIONAL { ?item wdt:P1082 ?population . }
        OPTIONAL { ?item wdt:P2046 ?area . }
      }
    `;
    
    const response = await fetch('https://query.wikidata.org/sparql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `query=${encodeURIComponent(wikidataQuery)}&format=json`
    });
    
    const data = await response.json();
    
    if (data.results?.bindings?.length > 0) {
      const binding = data.results.bindings[0];
      return {
        population: binding.population?.value ? parseInt(binding.population.value) : null,
        officialArea: binding.area?.value ? parseFloat(binding.area.value) : null
      };
    }
    
    return { population: null, officialArea: null };
  } catch (error) {
    console.error('Error fetching population data:', error);
    return { population: null, officialArea: null };
  }
};

// Custom icons cho các loại POI - THU NHỎ SIZE
const schoolIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  iconSize: [20, 33],      // Giảm từ [25, 41]
  iconAnchor: [10, 33],    // Giảm từ [12, 41]
  popupAnchor: [0, -33],   // Điều chỉnh vị trí popup
});

const hospitalIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  iconSize: [20, 33],
  iconAnchor: [10, 33],
  popupAnchor: [0, -33],
});

const restaurantIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png",
  iconSize: [20, 33],
  iconAnchor: [10, 33],
  popupAnchor: [0, -33],
});

const bankIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  iconSize: [20, 33],
  iconAnchor: [10, 33],
  popupAnchor: [0, -33],
});

const searchIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png",
  iconSize: [25, 41],      // Keep original size for search marker (more prominent)
  iconAnchor: [12, 41],
  popupAnchor: [0, -41],
});

// Component to fly to location
const FlyToLocation: React.FC<{ lat: number; lon: number; zoom?: number }> = ({ lat, lon, zoom = 15 }) => {
  const map = useMap();
  
  useEffect(() => {
    map.flyTo([lat, lon], zoom, {
      duration: 1.5
    });
  }, [lat, lon, zoom, map]);

  return null;
};

interface SearchResult {
  id: string;
  name: string;
  type: string;
  lat: number;
  lon: number;
  displayName: string;
  source: 'wikidata';
  wikidataId: string;
  description?: string;
  image?: string;
  instanceOf?: string;
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
  osmId?: number;
  osmType?: string;
}

interface LocationState {
  searchResult?: SearchResult; // ✅ Receive full SearchResult from Home
}


const NearbyMarkers: React.FC<{ places: NearbyPlace[] }> = ({ places }) => {
  return (
    <>
      {places.map((place, idx) => {
        // ✅ Create custom icon with emoji
        const icon = L.divIcon({
          html: `<div class="nearby-marker">${getAmenityIcon(place)}</div>`,
          className: 'nearby-marker-wrapper',
          iconSize: [30, 30],
          iconAnchor: [15, 30],
          popupAnchor: [0, -30]
        });

        return (
          <Marker
            key={idx}
            position={[place.lat, place.lon]}
            icon={icon}
          >
            <Popup>
              <div className="nearby-popup">
                <div className="nearby-popup-title">
                  {getAmenityIcon(place)} {getPlaceName(place, idx)}
                </div>
                <div className="nearby-popup-content">
                  <div><strong>Type:</strong> {place.highway || place.amenity || 'N/A'}</div>
                  {place.brand && <div><strong>Brand:</strong> {place.brand}</div>}
                  {place.operator && <div><strong>Operator:</strong> {place.operator}</div>}
                  <div><strong>Distance:</strong> {(place.distanceKm * 1000).toFixed(0)}m</div>
                  <div className="nearby-popup-coords">
                    <a 
                      href={`https://www.google.com/maps?q=${place.lat},${place.lon}`} 
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {place.lat.toFixed(6)}, {place.lon.toFixed(6)} ↗
                    </a>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};

const SimpleMap: React.FC = () => {
  const location = useLocation();
  const [map, setMap] = useState<L.Map | null>(null);
  const [wardData, setWardData] = useState<any>(null);
  
  // ✅ State for nearby places
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  
  const [wardMembers, setWardMembers] = useState<{
    innerWays: any[];
    outerWays: any[];
    nodes: any[];
    subAreas: any[];
  }>({
    innerWays: [],
    outerWays: [],
    nodes: [],
    subAreas: []
  });


  const [currentLocation, setCurrentLocation] = useState<{lat: number, lon: number} | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [wardId, setWardId] = useState<number | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lon: number} | null>(null);
  const [searchMarker, setSearchMarker] = useState<{lat: number, lon: number, name: string} | null>(null);
  const [highlightBounds, setHighlightBounds] = useState<number[][] | null>(null);
  const [highlightName, setHighlightName] = useState<string>("");
  const [isLoadingBoundary, setIsLoadingBoundary] = useState(false);
  const [wardStats, setWardStats] = useState<{
    calculatedArea: number;
    population: number | null;
    officialArea: number | null;
    density: number | null;
  }>({
    calculatedArea: 0,
    population: null,
    officialArea: null,
    density: null
  });
  const [atmStats, setAtmStats] = useState<Record<string, number>>({});
  const [isLoadingATM, setIsLoadingATM] = useState(false);
  const [selectedInfo, setSelectedInfo] = useState<{
    category: string;
    title: string;
    subtitle?: string;
    rows: { label: string; value: string }[];
    wikidataId?: string;
    coordinates?: [number, number];
    identifiers?: any;
    statements?: any;
    osmId?: string;
    osmType?: string;
    members?: any;
  } | null>(null);

  const [outlineGeoJSON, setOutlineGeoJSON] = useState<any>(null);
  const [memberOutline, setMemberOutline] = useState<{
    coordinates: number[][];
    name: string;
    type: string;
  } | null>(null);
  const [memberNames, setMemberNames] = useState<Record<number, string>>({});

  const currentLocationIcon = L.divIcon({
  html: `
    <div style="
      width: 20px;
      height: 20px;
      background: #4285F4;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      position: relative;
    ">
      <div style="
        position: absolute;
        width: 40px;
        height: 40px;
        background: rgba(66, 133, 244, 0.2);
        border-radius: 50%;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        animation: pulse 2s infinite;
      "></div>
    </div>
  `,
  className: 'current-location-marker',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  });

// ✅ Function to get current location
const getCurrentLocation = () => {
  if (!navigator.geolocation) {
    setLocationError('Browser does not support Geolocation');
    return;
  }

  setIsGettingLocation(true);
  setLocationError(null);

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      console.log('📍 Current location:', latitude, longitude);
      
      setCurrentLocation({ lat: latitude, lon: longitude });
      setSelectedLocation({ lat: latitude, lon: longitude });
      setIsGettingLocation(false);

      // Display information in InfoPanel
      setSelectedInfo({
        category: 'location',
        title: '📍 Your Current Location',
        subtitle: 'Determined by GPS',
        coordinates: [longitude, latitude],
        rows: [
          { label: 'Latitude', value: latitude.toFixed(6) },
          { label: 'Longitude', value: longitude.toFixed(6) },
          { label: 'Accuracy', value: `${position.coords.accuracy.toFixed(0)}m` }
        ]
      });
    },
    (error) => {
      setIsGettingLocation(false);
      
      let errorMessage = 'Unable to get location';
      switch(error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'You have denied location access permission';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Location information is unavailable';
          break;
        case error.TIMEOUT:
          errorMessage = 'Location request timed out';
          break;
      }
      
      setLocationError(errorMessage);
      alert(errorMessage);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
  };

  // ✅ DEFINE handleNearbyPlacesChange RIGHT AFTER STATES
  const handleNearbyPlacesChange = useCallback((places: NearbyPlace[]) => {
    // console.log('📍 Nearby places updated:', places.length);
    setNearbyPlaces(places);
  }, []);

  const handleOutlineLoaded = useCallback((geo: any) => {
    setOutlineGeoJSON(geo);
  }, []);


  // Function to connect ways into a complete polygon
  const connectWays = (ways: any[]) => {
    if (ways.length === 0) return [];
    
    const connectedCoords: number[][] = [];
    const usedWays = new Set<number>();
    
    // Start with the first way
    let currentWay = ways[0];
    connectedCoords.push(...currentWay.map((node: any) => [node.lon, node.lat]));
    usedWays.add(0);
    
    // Connect remaining ways
    while (usedWays.size < ways.length) {
      const lastPoint = connectedCoords[connectedCoords.length - 1];
      let foundConnection = false;
      
      for (let i = 0; i < ways.length; i++) {
        if (usedWays.has(i)) continue;
        
        const way = ways[i];
        const wayCoords = way.map((node: any) => [node.lon, node.lat]);
        const firstPoint = wayCoords[0];
        const lastPointOfWay = wayCoords[wayCoords.length - 1];
        
        // Check if this way connects with the end point
        if (Math.abs(lastPoint[0] - firstPoint[0]) < 0.0001 && 
            Math.abs(lastPoint[1] - firstPoint[1]) < 0.0001) {
          connectedCoords.push(...wayCoords.slice(1)); // Skip first point as it's duplicate
          usedWays.add(i);
          foundConnection = true;
          break;
        }
        // Check reverse
        else if (Math.abs(lastPoint[0] - lastPointOfWay[0]) < 0.0001 && 
                 Math.abs(lastPoint[1] - lastPointOfWay[1]) < 0.0001) {
          connectedCoords.push(...wayCoords.reverse().slice(1)); // Reverse and skip first point
          usedWays.add(i);
          foundConnection = true;
          break;
        }
      }
      
      if (!foundConnection) break; // No connecting way found
    }
    
    return connectedCoords;
  };

  // Function to get coordinates from OSM element
  const getCoordinates = (element: any) => {
    if (element.lat && element.lon) {
      return [element.lat, element.lon];
    } else if (element.center) {
      return [element.center.lat, element.center.lon];
    }
    return null;
  };

  const wardStyle = {
    fillColor: '#00ff00',
    weight: 2,
    opacity: 1,
    color: 'blue',
    dashArray: '0',
    fillOpacity: 0.2
  };

  // Load outline: prioritize using 1 API (relation id)
  const loadOutlineByResult = async (result: any) => {
    try {
      let relId: number | null = null;

      // Get from identifiers.osmRelationId or osmId if osmType=relation
      if (result.identifiers?.osmRelationId) {
        relId = Number(result.identifiers.osmRelationId);
      } else if (result.osmType === 'relation' && result.osmId) {
        relId = Number(result.osmId);
      }

      if (!relId) {
        console.warn('No OSM Relation ID to draw outline');
        setOutlineGeoJSON(null);
        return;
      }

      const outline = await fetchOutlineByOSMRelationId(relId);
      if (outline.geojson) {
        setOutlineGeoJSON(outline.geojson);
        setWardId(relId);
      } else {
        console.warn('Empty outline:', outline.source);
        setOutlineGeoJSON(null);
      }
    } catch (e) {
      console.error('Error fetching outline:', e);
      setOutlineGeoJSON(null);
    }
  };

  // HANDLER WHEN USER CLICKS ON SEARCH RESULT
  const handleSelectLocation = async (result: SearchResult) => {
    setOutlineGeoJSON(null);
    setMemberNames({});

    setSelectedInfo({
      category: result.type || 'search',
      title: result.name,
      subtitle: result.description,
      wikidataId: result.wikidataId || undefined,
      coordinates: [result.lon, result.lat],
      identifiers: result.identifiers,
      statements: result.statements,
      osmId: result.osmId?.toString() || result.identifiers?.osmRelationId || result.identifiers?.osmNodeId || result.identifiers?.osmWayId,
      osmType: result.osmType || (result.identifiers?.osmRelationId ? 'relation' : result.identifiers?.osmNodeId ? 'node' : result.identifiers?.osmWayId ? 'way' : undefined),
      rows: makeRows({
        'Type': result.instanceOf,
        'Source': 'Wikidata SPARQL'
      })
    });
    
    setHighlightBounds(null);
    setHighlightName("");
    setSelectedLocation({ lat: result.lat, lon: result.lon });
    setSearchMarker({ lat: result.lat, lon: result.lon, name: result.name });
    setWardData(null);
    setWardMembers({ innerWays: [], outerWays: [], nodes: [], subAreas: [] });
    setWardStats({ calculatedArea: 0, population: null, officialArea: null, density: null });

    let osmRelationId: number | null = null;
    
    if (result.identifiers?.osmRelationId) {
      osmRelationId = Number(result.identifiers.osmRelationId);
    } else if (result.osmType === 'relation' && result.osmId) {
      osmRelationId = Number(result.osmId);
    }

    if (!osmRelationId) {
      console.warn('No OSM Relation ID to fetch boundary');
      setIsLoadingBoundary(false);
      return;
    }

    setIsLoadingBoundary(true);

    const locationQuery = `
[out:json][timeout:25];
relation(${osmRelationId});
out geom;
`.trim();

    try {
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `data=${encodeURIComponent(locationQuery)}`
      });

      if (!response.ok) {
        console.error('Failed to fetch boundary:', response.status);
        setIsLoadingBoundary(false);
        return;
      }

      const data = await response.json();
      
      if (data.elements && data.elements.length > 0) {
        const element = data.elements[0];
        setWardId(element.id);

        if (element.members) {
          const innerWays = element.members.filter((m: any) => m.role === 'inner' && m.type === 'way');
          const outerWays = element.members.filter((m: any) => m.role === 'outer' && m.type === 'way');
          const nodes = element.members.filter((m: any) => m.type === 'node');
          const subAreas = element.members.filter((m: any) => m.type === 'relation');

          setWardMembers({ innerWays, outerWays, nodes, subAreas });

          // Fetch names for sub-areas
          if (subAreas.length > 0) {
            const relationIds = subAreas.map((m: any) => m.ref).join(',');
            const nameQuery = `
[out:json][timeout:25];
relation(id:${relationIds});
out tags;
`.trim();

            fetch('https://overpass-api.de/api/interpreter', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: `data=${encodeURIComponent(nameQuery)}`
            })
            .then(res => res.json())
            .then(nameData => {
              const names: Record<number, string> = {};
              nameData.elements?.forEach((el: any) => {
                const name = el.tags?.name || 
                            el.tags?.['name:vi'] || 
                            el.tags?.['name:en'] || 
                            el.tags?.official_name;
                if (name) {
                  names[el.id] = name;
                }
              });
              setMemberNames(names);
            })
            .catch(err => console.error('Error fetching relation names:', err));
          }

          setSelectedInfo(prev => prev ? {
            ...prev,
            members: {
              innerWays: innerWays.length,
              outerWays: outerWays.length,
              nodes: nodes.length,
              subAreas: subAreas.length,
              total: element.members.length,
              details: element.members.map((m: any) => ({
                type: m.type,
                ref: m.ref,
                role: m.role,
                tags: m.tags
              }))
            }
          } : null);

          const outerGeometry = element.members
            .filter((member: any) => member.role === 'outer' && member.geometry);

          if (outerGeometry.length > 0) {
            const wayGeometries = outerGeometry.map((way: any) => way.geometry);
            const connectedCoords = connectWays(wayGeometries);

            if (connectedCoords.length > 0) {
              const firstPoint = connectedCoords[0];
              const lastPoint = connectedCoords[connectedCoords.length - 1];
              if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
                connectedCoords.push(firstPoint);
              }

              const leafletCoords = connectedCoords.map(coord => [coord[1], coord[0]]);
              setHighlightBounds(leafletCoords);
              setHighlightName(result.name);

              const calculatedArea = calculatePolygonArea(connectedCoords);
              const { population, officialArea } = await fetchPopulationData(element.id);
              const density = population && calculatedArea > 0 
                ? Math.round(population / calculatedArea) 
                : null;

              setWardStats({
                calculatedArea: Math.round(calculatedArea * 100) / 100,
                population,
                officialArea,
                density
              });

              const geoJson = {
                type: "Feature",
                properties: { 
                  name: result.name,
                  area: `${Math.round(calculatedArea * 100) / 100} km²`,
                  population: population || 'No data',
                  density: density ? `${density.toLocaleString()} people/km²` : 'No data'
                },
                geometry: {
                  type: "Polygon",
                  coordinates: [connectedCoords]
                }
              };

              setWardData(geoJson);
              // console.log('Boundary loaded successfully');
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching boundary:', error);
    } finally {
      setIsLoadingBoundary(false);
    }
  };

  // HANDLER WHEN USER CLICKS ON MEMBER IN INFO PANEL
  const handleMemberClick = async (member: { type: string; ref: number; role?: string }) => {
    // console.log('Fetching member:', member);
    
    const query = `
[out:json][timeout:25];
${member.type}(${member.ref});
out geom;
`.trim();

    try {
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `data=${encodeURIComponent(query)}`
      });

      if (!response.ok) {
        console.error('Failed to fetch member:', response.status);
        return;
      }

      const data = await response.json();
      
      if (data.elements && data.elements.length > 0) {
        const element = data.elements[0];
        
        if (member.type === 'node') {
          // Display marker for node
          if (element.lat && element.lon) {
            setSelectedLocation({ lat: element.lat, lon: element.lon });
            setSearchMarker({
              lat: element.lat,
              lon: element.lon,
              name: element.tags?.name || `Node ${member.ref}`
            });
            setMemberOutline(null);
          }
        } else if (member.type === 'way') {
          // Draw outline for way - sky blue color
          if (element.geometry) {
            const coords = element.geometry.map((g: any) => [g.lon, g.lat]);
            setMemberOutline({
              coordinates: coords,
              name: element.tags?.name || `Way ${member.ref}`,
              type: 'way'
            });
            
            // Center map
            if (coords.length > 0) {
              const centerLat = coords.reduce((sum: number, c: number[]) => sum + c[1], 0) / coords.length;
              const centerLon = coords.reduce((sum: number, c: number[]) => sum + c[0], 0) / coords.length;
              setSelectedLocation({ lat: centerLat, lon: centerLon });
            }
          }
        } else if (member.type === 'relation') {
          // Draw outline for relation - yellow color
          if (element.members) {
            const outerWays = element.members
              .filter((m: any) => m.role === 'outer' && m.geometry);

            if (outerWays.length > 0) {
              const wayGeometries = outerWays.map((way: any) => way.geometry);
              const connectedCoords = connectWays(wayGeometries);

              if (connectedCoords.length > 0) {
                // Close polygon
                const firstPoint = connectedCoords[0];
                const lastPoint = connectedCoords[connectedCoords.length - 1];
                if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
                  connectedCoords.push(firstPoint);
                }

                setMemberOutline({
                  coordinates: connectedCoords,
                  name: element.tags?.name || `Relation ${member.ref}`,
                  type: 'relation'
                });

                // Center map
                const centerLat = connectedCoords.reduce((sum, c) => sum + c[1], 0) / connectedCoords.length;
                const centerLon = connectedCoords.reduce((sum, c) => sum + c[0], 0) / connectedCoords.length;
                setSelectedLocation({ lat: centerLat, lon: centerLon });
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching member:', error);
    }
  };

  const makeRows = (obj: Record<string, any>): { label: string; value: string }[] =>
    Object.entries(obj)
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .map(([k, v]) => ({ label: k, value: String(v) }));

  // ✅ STYLE FOR OUTLINE (RED, DASHED)
  const outlineStyle = {
    color: '#ff0000',
    weight: 3,
    opacity: 0.8,
    dashArray: '10, 5',
    fillOpacity: 0
  };

  // ✅ Handle search result from Home page
  useEffect(() => {
    const state = location.state as LocationState;
    if (state?.searchResult && map) {
      // console.log('🏠 Received FULL DATA from Home:', state.searchResult);
      // console.log('📍 Identifiers:', state.searchResult.identifiers);
      // console.log('📊 Statements:', state.searchResult.statements);
      
      // ✅ Call directly with full data
      handleSelectLocation(state.searchResult);
      
      // Clear state
      window.history.replaceState({}, document.title);
    }
  }, [map, location.state]);

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <Search onSelectLocation={handleSelectLocation} />

      {/* ✅ Button to get current location */}
      <button
        onClick={getCurrentLocation}
        disabled={isGettingLocation}
        style={{
          position: 'absolute',
          bottom: '100px',
          right: '10px',
          zIndex: 1000,
          width: '40px',
          height: '40px',
          borderRadius: '4px',
          border: '2px solid rgba(0,0,0,0.2)',
          background: 'white',
          cursor: isGettingLocation ? 'wait' : 'pointer',
          boxShadow: '0 1px 5px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          if (!isGettingLocation) {
            e.currentTarget.style.background = '#f5f5f5';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'white';
        }}
        title="Current Location"
      >
        {isGettingLocation ? (
          <FontAwesomeIcon icon={faSpinner} spin />
        ) : (
          <FontAwesomeIcon icon={faLocationCrosshairs} />
        )}
      </button>

      {selectedInfo && (
        <InfoPanel
          data={selectedInfo}
          onClose={() => {
            setSelectedInfo(null);
            setOutlineGeoJSON(null);
            setMemberOutline(null);
            setMemberNames({});
            setNearbyPlaces([]);
          }}
          onMemberClick={handleMemberClick}
          memberNames={memberNames}
          onNearbyPlacesChange={handleNearbyPlacesChange}
        />
      )}

      <MapContainer
        center={[21.0285, 105.8542]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        ref={setMap}
      >
        <ZoomControl position="bottomright" />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {highlightBounds && highlightBounds.length > 0 && (
          <SearchResultComponent
            bounds={highlightBounds}
            name={highlightName}
            color="#ff6b6b"
          />
        )}

        {/* Member outline với màu theo type */}
        {memberOutline && memberOutline.type === 'way' && (
          <Polyline
            positions={memberOutline.coordinates.map(c => [c[1], c[0]])}
            color="#2196F3"
            weight={4}
            opacity={0.9}
          >
            <Popup>
              <strong>{memberOutline.name}</strong>
              <br />
              Type: Way
            </Popup>
          </Polyline>
        )}

        {memberOutline && memberOutline.type === 'relation' && (
          <Polygon
            positions={memberOutline.coordinates.map(c => [c[1], c[0]])}
            pathOptions={{
              color: '#FFA000',
              fillColor: '#FFC107',
              weight: 3,
              opacity: 0.9,
              fillOpacity: 0.4
            }}
          >
            <Popup>
              <strong>{memberOutline.name}</strong>
              <br />
              Type: Relation
            </Popup>
          </Polygon>
        )}

        {searchMarker && (
          <Marker
            position={[searchMarker.lat, searchMarker.lon]}
            icon={searchIcon}
          >
            <Popup>{searchMarker.name}</Popup>
          </Marker>
        )}

        {/* ✅ Display Nearby Markers */}
        {nearbyPlaces.length > 0 && (
          <NearbyMarkers places={nearbyPlaces} />
        )}

        {selectedLocation && (
          <FlyToLocation 
            lat={selectedLocation.lat} 
            lon={selectedLocation.lon}
            zoom={15}
          />
        )}

        {wardData && (
          <GeoJSON
            key={wardId}
            data={wardData}
            style={wardStyle}
          />
        )}

        {outlineGeoJSON && (
          <GeoJSON
            key={JSON.stringify(outlineGeoJSON)}
            data={outlineGeoJSON}
            style={outlineStyle}
          />
        )}

        {/* ✅ Current location marker */}
        {currentLocation && (
          <Marker
            position={[currentLocation.lat, currentLocation.lon]}
            icon={currentLocationIcon}
          >
            <Popup>
              <div style={{ textAlign: 'center' }}>
                <strong>📍 Your Location</strong>
                <br />
                <small>{currentLocation.lat.toFixed(6)}, {currentLocation.lon.toFixed(6)}</small>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      <MapChatbot />
    </div>
  );
};

export default SimpleMap;