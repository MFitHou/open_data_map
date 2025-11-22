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

import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, GeoJSON, ZoomControl, Popup } from "react-leaflet";
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Components
import { Search } from "./Search";
import { SearchResult as SearchResultComponent, InfoPanel, CurrentLocationButton } from '../ui';
import MapChatbot from './MapChatbot';
import { FlyToLocation } from './FlyToLocation';
import { NearbyMarkers } from './NearbyMarkers';
import { MemberOutlines } from './MemberOutlines';

// Hooks
import { useCurrentLocation } from '../../hooks';

// Utils & Types
import { searchIcon, currentLocationIcon, wardStyle, outlineStyle } from './MapIcons';
import { connectWays, calculatePolygonArea, fetchPopulationData, makeRows } from './MapUtils';
import type { SearchResult, LocationState, WardMembers, WardStats, SelectedInfo, MemberOutline, Location, SearchMarker } from './types';
import type { NearbyPlace } from '../../utils/nearbyApi';

const SimpleMap: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [map, setMap] = useState<L.Map | null>(null);
  
  // Ward related state
  const [wardData, setWardData] = useState<any>(null);
  const [wardId, setWardId] = useState<number | null>(null);
  const [, setWardMembers] = useState<WardMembers>({
    innerWays: [],
    outerWays: [],
    nodes: [],
    subAreas: []
  });
  const [, setWardStats] = useState<WardStats>({
    calculatedArea: 0,
    population: null,
    officialArea: null,
    density: null
  });

  // Location & marker state
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [searchMarker, setSearchMarker] = useState<SearchMarker | null>(null);
  const [highlightBounds, setHighlightBounds] = useState<number[][] | null>(null);
  const [highlightName, setHighlightName] = useState<string>("");
  
  // Nearby places
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  
  // Info panel
  const [selectedInfo, setSelectedInfo] = useState<SelectedInfo | null>(null);
  
  // Outline related
  const [outlineGeoJSON, setOutlineGeoJSON] = useState<any>(null);
  const [memberOutline, setMemberOutline] = useState<MemberOutline | null>(null);
  const [memberNames, setMemberNames] = useState<Record<number, string>>({});
  
  // Loading states
  const [, setIsLoadingBoundary] = useState(false);

  // Use custom hook for current location
  const { 
    currentLocation, 
    isGettingLocation, 
    getCurrentLocation: getLocation 
  } = useCurrentLocation();

  const handleCurrentLocation = useCallback(() => {
    getLocation((loc, info) => {
      setSelectedLocation(loc);
      setSelectedInfo(info);
    });
  }, [getLocation]);

  const handleNearbyPlacesChange = useCallback((places: NearbyPlace[]) => {
    console.log('📍 Nearby places updated:', places.length);
    setNearbyPlaces(places);
  }, []);

  // HANDLER: Select location from search
  const handleSelectLocation = useCallback(async (result: SearchResult) => {
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
              console.log('Boundary loaded successfully');
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching boundary:', error);
    } finally {
      setIsLoadingBoundary(false);
    }
  }, []);

  // HANDLER: Member click
  const handleMemberClick = useCallback(async (member: { type: string; ref: number; role?: string }) => {
    console.log('Fetching member:', member);
    
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
          if (element.geometry) {
            const coords = element.geometry.map((g: any) => [g.lon, g.lat]);
            setMemberOutline({
              coordinates: coords,
              name: element.tags?.name || `Way ${member.ref}`,
              type: 'way'
            });
            
            if (coords.length > 0) {
              const centerLat = coords.reduce((sum: number, c: number[]) => sum + c[1], 0) / coords.length;
              const centerLon = coords.reduce((sum: number, c: number[]) => sum + c[0], 0) / coords.length;
              setSelectedLocation({ lat: centerLat, lon: centerLon });
            }
          }
        } else if (member.type === 'relation') {
          if (element.members) {
            const outerWays = element.members
              .filter((m: any) => m.role === 'outer' && m.geometry);

            if (outerWays.length > 0) {
              const wayGeometries = outerWays.map((way: any) => way.geometry);
              const connectedCoords = connectWays(wayGeometries);

              if (connectedCoords.length > 0) {
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
  }, []);

  // Handle search result from Home page
  useEffect(() => {
    const state = location.state as LocationState;
    if (state?.searchResult && map) {
      console.log('🏠 Received FULL DATA from Home:', state.searchResult);
      handleSelectLocation(state.searchResult);
      window.history.replaceState({}, document.title);
    }
  }, [map, location.state, handleSelectLocation]);

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <Search onSelectLocation={handleSelectLocation} />

      <CurrentLocationButton 
        isGettingLocation={isGettingLocation}
        onClick={handleCurrentLocation}
      />

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

        <MemberOutlines memberOutline={memberOutline} />

        {searchMarker && (
          <Marker
            position={[searchMarker.lat, searchMarker.lon]}
            icon={searchIcon}
          >
            <Popup>{searchMarker.name}</Popup>
          </Marker>
        )}

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
