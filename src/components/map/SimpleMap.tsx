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
import { SmartSearch } from "./SmartSearch";
import { SearchResult as SearchResultComponent, InfoPanel, CurrentLocationButton, NearbySearchInfo } from '../ui';
import { ServiceInfoPanel } from '../ui/ServiceInfoPanel';
import MapChatbot from './MapChatbot';
import { FlyToLocation } from './FlyToLocation';
import { TopologyMarkers } from './TopologyMarkers';
import { MemberOutlines } from './MemberOutlines';
import LayerControl from './LayerControl';
import { AQIMarkers, AQIToggleButton, useAQILayer } from './AQILayer';
import { WeatherMarkers, WeatherToggleButton, ForecastPanel, useWeatherLayer } from './WeatherLayer';
import { LayerMenu } from './LayerMenu';
import '../../styles/components/LayerControl.css';

// Hooks
import { useCurrentLocation } from '../../hooks';

// Utils & Types
import { searchIcon, currentLocationIcon, wardStyle, outlineStyle } from './MapIcons';
import { connectWays, calculatePolygonArea, fetchPopulationData, makeRows } from './MapUtils';
import { fetchNearbyPlaces, fetchPOIByUri } from '../../utils/nearbyApi';
import type { SearchResult, LocationState, WardMembers, WardStats, SelectedInfo, MemberOutline, Location, SearchMarker } from './types';
import type { NearbyPlace, TopologyRelation } from '../../utils/nearbyApi';

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
  const [suggestionMarkers, setSuggestionMarkers] = useState<any[]>([]); // New: markers from search suggestions
  const [highlightBounds, setHighlightBounds] = useState<number[][] | null>(null);
  const [highlightName, setHighlightName] = useState<string>("");
  const [forceHideSuggestions, setForceHideSuggestions] = useState(false); // Control SmartSearch suggestions visibility
  
  // Nearby places
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [nearbySearchCenter, setNearbySearchCenter] = useState<{ lat: number; lon: number } | null>(null);
  const [nearbySearchRadius, setNearbySearchRadius] = useState<number | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<NearbyPlace | null>(null);
  
  // Service InfoPanel - for service markers (from TopologyMarkers)
  const [selectedServicePlace, setSelectedServicePlace] = useState<NearbyPlace | null>(null);
  const [hoveredTopology, setHoveredTopology] = useState<{ topology: TopologyRelation; sourcePlace: NearbyPlace } | null>(null);
  const [exploredMarkerPois, setExploredMarkerPois] = useState<Set<string>>(new Set()); // Track POIs added from topology exploration
  
  // Layer control
  const [layerPlaces, setLayerPlaces] = useState<NearbyPlace[]>([]);
  const [isLoadingLayers, setIsLoadingLayers] = useState(false);
  
  // AQI Layer
  const { 
    stations: aqiStations, 
    isLoading: isLoadingAQI, 
    isEnabled: isAQIEnabled, 
    toggleLayer: toggleAQILayer 
  } = useAQILayer();
  
  // Weather Layer
  const {
    stations: weatherStations,
    forecast,
    isLoading: isLoadingWeather,
    isLoadingForecast,
    isEnabled: isWeatherEnabled,
    showForecast,
    toggleLayer: toggleWeatherLayer,
    closeForecast,
  } = useWeatherLayer();
  
  // AI message from SmartSearch to Chatbot
  const [aiMessageForChatbot, setAiMessageForChatbot] = useState<string | null>(null);
  
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

  const handleNearbyPlacesChange = useCallback((places: NearbyPlace[], center?: { lat: number; lon: number }, radiusKm?: number) => {
    // console.log('[SimpleMap] handleNearbyPlacesChange called with', places.length, 'places');
    // console.log('[SimpleMap] Center:', center, 'Radius:', radiusKm);
    // console.log('[SimpleMap] Places:', places.map(p => ({ name: p.name, lon: p.lon, lat: p.lat })));
    setNearbyPlaces(places);
    setNearbySearchCenter(center || null);
    setNearbySearchRadius(radiusKm || null);
  }, []);

  // Clear all nearby search results
  const handleClearNearbySearch = useCallback(() => {
    // console.log('[SimpleMap] Clearing nearby search results');
    setNearbyPlaces([]);
    setNearbySearchCenter(null);
    setNearbySearchRadius(null);
    setSelectedServicePlace(null);
    setHoveredTopology(null);
    setExploredMarkerPois(new Set());
  }, []);

  // Fetch layer data from backend
  const fetchLayerData = useCallback(async (enabledLayers: Array<{ id: string; name: string; density: number }>) => {
    if (enabledLayers.length === 0) {
      // console.log('[SimpleMap] No layers to fetch');
      setLayerPlaces([]);
      return;
    }

    setIsLoadingLayers(true);
    // console.log('[SimpleMap] Fetching layer data for', enabledLayers.length, 'layers');

    try {
      const allPlaces: NearbyPlace[] = [];
      
      // Fetch data for each enabled layer using new API
      for (const layer of enabledLayers) {
        try {
          // console.log(`[SimpleMap] Fetching ${layer.name} (${layer.id}) with density ${layer.density}`);
          
          const url = `${import.meta.env.VITE_FUSEKI_BASE_URL}/pois-by-type?type=${layer.id}&limit=${layer.density}&language=vi`;
          const response = await fetch(url);

          if (!response.ok) {
            console.warn(`[SimpleMap] Failed to fetch ${layer.name}:`, response.statusText);
            continue;
          }

          const data = await response.json();
          // console.log(`[SimpleMap] Fetched ${data.results?.length || 0} places for ${layer.name}`);
          
          if (data.results && Array.isArray(data.results)) {
            allPlaces.push(...data.results);
          }
        } catch (error) {
          console.error(`[SimpleMap] Error fetching ${layer.name}:`, error);
        }
      }

      // console.log(`[SimpleMap] Total layer places fetched: ${allPlaces.length}`);
      setLayerPlaces(allPlaces);
    } catch (error) {
      console.error('[SimpleMap] Error fetching layer data:', error);
      setLayerPlaces([]);
    } finally {
      setIsLoadingLayers(false);
    }
  }, []);

  // Handle layer changes from LayerControl
  const handleLayerChange = useCallback((enabledLayers: Array<{ id: string; name: string; density: number }>) => {
    // console.log('[SimpleMap] Layer change:', enabledLayers);
    fetchLayerData(enabledLayers);
  }, [fetchLayerData]);

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
  }, []);

  const handleChatbotLocationSelect = useCallback((location: { 
    lat: number; 
    lon: number; 
    name: string;
    wikidataId?: string;
    description?: string;
    type?: string;
    image?: string;
  }) => {
    // console.log('Chatbot location select:', location);
    
    // Transform chatbot location data to SearchResult format
    const searchResult: SearchResult = {
      id: location.wikidataId || `chatbot-${Date.now()}`,
      name: location.name,
      type: location.type || 'location',
      lat: location.lat,
      lon: location.lon,
      displayName: location.name,
      description: location.description,
      wikidataId: location.wikidataId || '',
      source: 'wikidata',
      // Add empty identifiers and statements if not provided
      identifiers: {},
      statements: {}
    };
    
    // Use the same handler as search to get full functionality
    handleSelectLocation(searchResult);
  }, [handleSelectLocation]);

  // HANDLER: Suggestions from SmartSearch - display as markers
  const handleSuggestionsChange = useCallback((suggestions: any[]) => {
    // console.log('[SimpleMap] Received', suggestions.length, 'suggestions to display as markers');
    
    // Transform suggestions to markers
    const markers = suggestions.map(s => {
      let lat, lon;
      if (s.coordinates && Array.isArray(s.coordinates)) {
        [lon, lat] = s.coordinates;
      } else if (s.lat && s.lon) {
        lat = s.lat;
        lon = s.lon;
      }
      
      return {
        lat,
        lon,
        name: s.name || s.label || 'Location',
        description: s.description,
        wikidataId: s.wikidataId,
        image: s.image,
        type: s.type,
        source: s.source,
        data: s // Keep full suggestion data
      };
    }).filter(m => m.lat && m.lon);
    
    setSuggestionMarkers(markers);
    // console.log('[SimpleMap] Created', markers.length, 'suggestion markers');
  }, []);

  // HANDLER: Click on suggestion marker
  const handleSuggestionMarkerClick = useCallback((marker: any) => {
    // console.log('[SimpleMap] Suggestion marker clicked:', marker);
    
    // Hide suggestions dropdown when marker is clicked
    setForceHideSuggestions(true);
    
    // Transform to SearchResult format
    const searchResult: SearchResult = {
      id: marker.wikidataId || `marker-${Date.now()}`,
      name: marker.name,
      type: marker.type || 'location',
      lat: marker.lat,
      lon: marker.lon,
      displayName: marker.name,
      description: marker.description,
      wikidataId: marker.wikidataId || '',
      source: marker.source || 'search',
      identifiers: {},
      statements: {}
    };
    
    // Show info and fly to location
    handleSelectLocation(searchResult);
  }, [handleSelectLocation]);

  // HANDLER: Clear search - remove all markers, boundaries, and selections
  // BUT keep nearby places if they exist (from topology/nearby search)
  const handleClearSearch = useCallback(() => {
    // console.log('[SimpleMap] Clearing search - removing suggestion markers and boundaries');
    setSearchMarker(null);
    setSuggestionMarkers([]);
    setSelectedLocation(null);
    setSelectedInfo(null);
    setHighlightBounds(null);
    setHighlightName('');
    setWardData(null);
    setOutlineGeoJSON(null);
    setMemberOutline(null);
    setMemberNames({});
    // DON'T clear nearbyPlaces - they should persist until user searches again
    // setNearbyPlaces([]);
    // setNearbySearchCenter(null);
    // setNearbySearchRadius(null);
  }, []);

  // HANDLER: Member click
  const handleMemberClick = useCallback(async (member: { type: string; ref: number; role?: string }) => {
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
      // console.log('🏠 Received FULL DATA from Home:', state.searchResult);
      handleSelectLocation(state.searchResult);
      window.history.replaceState({}, document.title);
    }
  }, [map, location.state, handleSelectLocation]);

  // Auto-get current location on mount
  useEffect(() => {
    if (!currentLocation && !isGettingLocation) {
      // console.log('[SimpleMap] Auto-getting current location on mount');
      getLocation();
    }
  }, []); // Run once on mount

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%', overflow: 'hidden' }}>
      <SmartSearch 
        onLocationSelect={(latLng, name, data) => {
          const result: SearchResult = {
            id: data?.wikidataId || Date.now().toString(),
            name: name,
            type: data?.type || 'location',
            lat: latLng.lat,
            lon: latLng.lng,
            displayName: name,
            description: data?.description,
            image: data?.image,
            wikidataId: data?.wikidataId,
            identifiers: data?.identifiers,
            statements: data?.statements,
            source: data?.source || 'search'
          };
          handleSelectLocation(result);
        }}
        onNearbyPlacesChange={handleNearbyPlacesChange}
        onAIMessageReceived={(message) => setAiMessageForChatbot(message)}
        onSuggestionsChange={handleSuggestionsChange}
        onClearSearch={handleClearSearch}
        currentLocation={currentLocation ? { lat: currentLocation.lat, lng: currentLocation.lon } : null}
        forceHideSuggestions={forceHideSuggestions}
        onInputFocus={() => setForceHideSuggestions(false)}
      />

      <CurrentLocationButton 
        isGettingLocation={isGettingLocation}
        onClick={handleCurrentLocation}
      />

      <LayerControl
        onLayerChange={handleLayerChange}
      />

      {selectedInfo && (
        <InfoPanel
          data={selectedInfo}
          onClose={() => {
            setSelectedInfo(null);
            setOutlineGeoJSON(null);
            setMemberOutline(null);
            setMemberNames({});
            // DON'T clear nearbyPlaces when closing InfoPanel
            // They should persist on map until user clears search or searches again
            // setNearbyPlaces([]);
            // setNearbySearchCenter(null);
            // setNearbySearchRadius(null);
            setSelectedPlace(null);
          }}
          onMemberClick={handleMemberClick}
          memberNames={memberNames}
          onNearbyPlacesChange={handleNearbyPlacesChange}
          selectedPlace={selectedPlace}
          onRelatedPlaceClick={(place) => {
            // console.log('[SimpleMap] onRelatedPlaceClick called:', place.name);
            // console.log('[SimpleMap] THIS will fly to location');
            setSelectedPlace(place);
            if (place.lat && place.lon) {
              setSelectedLocation({ lat: place.lat, lon: place.lon });
            }
          }}
        />
      )}

      {/* Service InfoPanel for service markers (TopologyMarkers) */}
      {selectedServicePlace && (
        <ServiceInfoPanel
          place={selectedServicePlace}
          onClose={() => {
            setSelectedServicePlace(null);
            setHoveredTopology(null);
          }}
          onTopologyHover={(topology, sourcePlace) => {
            if (topology) {
              setHoveredTopology({ topology, sourcePlace });
            } else {
              setHoveredTopology(null);
            }
          }}
          onTopologyClick={async (topology, _sourcePlace) => {
            // When clicking topology, fetch full POI info and display
            const related = topology.related;
            if (typeof related === 'object' && related.poi) {
              // console.log('[SimpleMap] Fetching full POI info for:', related.poi);
              
              // Fetch full info from backend
              const fullPoi = await fetchPOIByUri(related.poi);
              
              if (fullPoi) {
                // console.log('[SimpleMap] Got full POI:', fullPoi);
                
                // Add POI to nearbyPlaces if not already there (so marker will be rendered)
                setNearbyPlaces(prev => {
                  const exists = prev.some(p => p.poi === fullPoi.poi);
                  if (!exists) {
                    // console.log('[SimpleMap] Adding new POI to nearbyPlaces:', fullPoi.name);
                    // Track this as an explored marker
                    setExploredMarkerPois(prevSet => new Set([...prevSet, fullPoi.poi]));
                    return [...prev, fullPoi];
                  }
                  return prev;
                });
                
                // Update ServiceInfoPanel with full POI data
                setSelectedServicePlace(fullPoi);
                setHoveredTopology(null);
                
                // Fly to the location if coordinates available
                if (fullPoi.lat && fullPoi.lon) {
                  setSelectedLocation({ lat: fullPoi.lat, lon: fullPoi.lon });
                }
              } else if (related.lat && related.lon) {
                // Fallback: create a minimal place from related data and add to list
                const minimalPlace: NearbyPlace = {
                  poi: related.poi,
                  name: related.name || 'Unknown',
                  amenity: related.amenity || undefined,
                  highway: related.highway || undefined,
                  leisure: related.leisure || undefined,
                  brand: related.brand || undefined,
                  lat: related.lat,
                  lon: related.lon,
                  distanceKm: 0,
                  wkt: related.wkt || `POINT(${related.lon} ${related.lat})`,
                };
                
                setNearbyPlaces(prev => {
                  const exists = prev.some(p => p.poi === minimalPlace.poi);
                  if (!exists) {
                    // Track this as an explored marker
                    setExploredMarkerPois(prevSet => new Set([...prevSet, minimalPlace.poi]));
                    return [...prev, minimalPlace];
                  }
                  return prev;
                });
                
                setSelectedServicePlace(minimalPlace);
                setHoveredTopology(null);
                setSelectedLocation({ lat: related.lat, lon: related.lon });
              }
            }
          }}
          onClearExploredMarkers={() => {
            // Remove explored markers from nearbyPlaces
            setNearbyPlaces(prev => prev.filter(p => !exploredMarkerPois.has(p.poi)));
            setExploredMarkerPois(new Set());
            // Close the panel if current selection was an explored marker
            if (selectedServicePlace && exploredMarkerPois.has(selectedServicePlace.poi)) {
              setSelectedServicePlace(null);
            }
          }}
          exploredMarkersCount={exploredMarkerPois.size}
        />
      )}

      <MapContainer
        center={[21.0285, 105.8542]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        ref={setMap}
        eventHandlers={{
          click: () => {
            // Clear selection when clicking map background
            setSelectedPlace(null);
          }
        }}
      >
        <ZoomControl position="topright" />
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

        {/* Suggestion markers from SmartSearch */}
        {suggestionMarkers.map((marker, idx) => (
          <Marker
            key={`suggestion-${idx}`}
            position={[marker.lat, marker.lon]}
            icon={searchIcon}
            eventHandlers={{
              click: () => handleSuggestionMarkerClick(marker)
            }}
          >
            <Popup>
              <div>
                <strong>{marker.name}</strong>
                {marker.description && <p>{marker.description}</p>}
                {marker.type && <p><em>{marker.type}</em></p>}
              </div>
            </Popup>
          </Marker>
        ))}

        {nearbyPlaces.length > 0 && (
          <TopologyMarkers 
            places={nearbyPlaces} 
            searchCenter={nearbySearchCenter || undefined}
            searchRadiusKm={nearbySearchRadius || undefined}
            onPlaceSelect={(place) => {
              // console.log('[SimpleMap] onPlaceSelect called:', place.name);
              // console.log('[SimpleMap] Opening ServiceInfoPanel for:', place.name);
              setSelectedServicePlace(place);
            }}
            selectedServicePlace={selectedServicePlace}
            hoveredTopology={hoveredTopology}
          />
        )}

        {/* Layer markers from LayerControl */}
        {layerPlaces.length > 0 && (
          <TopologyMarkers 
            places={layerPlaces}
            onPlaceSelect={(place) => {
              // console.log('[SimpleMap] Layer marker clicked:', place.name);
              setSelectedServicePlace(place);
            }}
            selectedServicePlace={selectedServicePlace}
            hoveredTopology={hoveredTopology}
          />
        )}

        {/* AQI Layer markers */}
        {isAQIEnabled && aqiStations.length > 0 && (
          <AQIMarkers stations={aqiStations} />
        )}

        {/* Weather Layer markers */}
        {isWeatherEnabled && weatherStations.length > 0 && (
          <WeatherMarkers stations={weatherStations} />
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
                <strong>📍 {t('map.yourLocation')}</strong>
                <br />
                <small>{currentLocation.lat.toFixed(6)}, {currentLocation.lon.toFixed(6)}</small>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* AQI Layer Toggle Button - Desktop only */}
      <AQIToggleButton
        onToggle={toggleAQILayer}
        isLoading={isLoadingAQI}
        isEnabled={isAQIEnabled}
        stationCount={aqiStations.length}
      />

      {/* Weather Layer Toggle Button - Desktop only */}
      <WeatherToggleButton
        onToggle={toggleWeatherLayer}
        isLoading={isLoadingWeather}
        isEnabled={isWeatherEnabled}
        stationCount={weatherStations.length}
      />

      {/* Layer Menu - Mobile only (hamburger menu) */}
      <LayerMenu
        isAQIEnabled={isAQIEnabled}
        isLoadingAQI={isLoadingAQI}
        aqiStationCount={aqiStations.length}
        onToggleAQI={toggleAQILayer}
        isWeatherEnabled={isWeatherEnabled}
        isLoadingWeather={isLoadingWeather}
        weatherStationCount={weatherStations.length}
        onToggleWeather={toggleWeatherLayer}
      />

      {/* Weather Forecast Panel */}
      {isWeatherEnabled && showForecast && (
        <ForecastPanel
          forecast={forecast}
          isLoading={isLoadingForecast}
          onClose={closeForecast}
        />
      )}

      {/* Nearby Search Info Bar with Clear button */}
      <NearbySearchInfo
        placesCount={nearbyPlaces.length}
        searchCenter={nearbySearchCenter}
        searchRadiusKm={nearbySearchRadius}
        onClear={handleClearNearbySearch}
      />

      <MapChatbot 
        onNearbyPlacesChange={handleNearbyPlacesChange}
        onLocationSelect={handleChatbotLocationSelect}
        externalMessage={aiMessageForChatbot}
        onExternalMessageShown={() => setAiMessageForChatbot(null)}
      />
    </div>
  );
};

export default SimpleMap;
