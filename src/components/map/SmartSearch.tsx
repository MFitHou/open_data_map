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

import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { LatLng } from 'leaflet';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faMagnifyingGlass, 
  faWandMagicSparkles, 
  faXmark, 
  faSpinner,
  faLocationDot,
  faMapMarkerAlt
} from '@fortawesome/free-solid-svg-icons';
import { getApiEndpoint } from '../../config/api';
import type { NearbyPlace } from '../../utils/nearbyApi';
import '../../styles/components/SmartSearch.css';

interface SmartSearchProps {
  onLocationSelect: (location: LatLng, name: string, data?: any) => void;
  onNearbyPlacesChange?: (
    places: NearbyPlace[],
    center?: { lat: number; lon: number },
    radiusKm?: number
  ) => void;
  onAIMessageReceived?: (message: string) => void; // New: callback to send AI message to chatbot
  currentLocation?: { lat: number; lng: number } | null;
}

interface Suggestion {
  name?: string;
  label?: string;
  description?: string;
  coordinates?: [number, number];
  lat?: number;
  lon?: number;
  source?: string;
  type?: string;
  score?: number;
  wikidataId?: string;
  image?: string;
}

export const SmartSearch: React.FC<SmartSearchProps> = ({
  onLocationSelect,
  onNearbyPlacesChange,
  onAIMessageReceived,
  currentLocation
}) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [isAIMode, setIsAIMode] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [previousQuery, setPreviousQuery] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim().length >= 2) {
      handleSearch(query.trim());
    }
  };

  // Handle search button click
  const handleSearchClick = () => {
    if (query.trim().length >= 2) {
      handleSearch(query.trim());
    }
  };

  const handleSearch = async (searchQuery: string) => {
    setIsLoading(true);

    try {
      const endpoint = getApiEndpoint.chat() + '/smart-search';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          mode: isAIMode ? 'ai' : 'traditional',
          context: {
            currentLocation: currentLocation 
              ? { lat: currentLocation.lat, lon: currentLocation.lng }
              : undefined,
            previousQuery: previousQuery || undefined
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();
      
      console.log('[SmartSearch] Response:', data);

      // Handle different action types
      handleSearchAction(data);

      // Update suggestions
      if (data.suggestions && Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions);
      } else {
        setSuggestions([]);
      }

      // Send AI message to chatbot instead of showing in search
      if (data.message && isAIMode && onAIMessageReceived) {
        onAIMessageReceived(data.message);
      }

      // Update history
      setPreviousQuery(searchQuery);

    } catch (error) {
      console.error('Search error:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchAction = (data: any) => {
    const { action, params, results, location } = data;

    switch (action) {
      case 'nearby_search':
        // Show nearby results on map
        if (results && onNearbyPlacesChange) {
          console.log('[SmartSearch] Nearby search:', results.length, 'results');
          onNearbyPlacesChange(
            results,
            params?.center,
            params?.radiusKm
          );
        }
        break;

      case 'location_search':
      case 'show_location':
        // Fly to first result if available
        if (data.suggestions && data.suggestions.length > 0) {
          const first = data.suggestions[0];
          selectLocation(first);
        } else if (location) {
          onLocationSelect(
            new LatLng(location.lat, location.lng || location.lon),
            'Vị trí tìm được',
            location
          );
        }
        break;

      case 'text_response':
        // Just show message, no map action
        break;

      case 'search_results':
        // Traditional search results, already shown in suggestions
        break;
    }
  };

  const selectLocation = (suggestion: Suggestion) => {
    let lat: number | undefined;
    let lon: number | undefined;
    
    // Extract coordinates from various formats
    if (suggestion.coordinates && Array.isArray(suggestion.coordinates)) {
      [lon, lat] = suggestion.coordinates;
    } else if (suggestion.lat && suggestion.lon) {
      lat = suggestion.lat;
      lon = suggestion.lon;
    }

    if (lat && lon) {
      const name = suggestion.name || suggestion.label || 'Location';
      onLocationSelect(new LatLng(lat, lon), name, suggestion);
      
      // Clear search
      setQuery('');
      setSuggestions([]);
      setAiMessage('');
    }
  };

  const toggleAIMode = () => {
    setIsAIMode(!isAIMode);
    setSuggestions([]);
    setPreviousQuery('');
  };

  const clearSearch = () => {
    setQuery('');
    setSuggestions([]);
  };

  const getSourceColor = (source?: string) => {
    switch (source) {
      case 'wikidata': return '#1976d2';
      case 'overpass': return '#388e3c';
      case 'fuseki': return '#f57c00';
      case 'geocode': return '#7b1fa2';
      default: return '#757575';
    }
  };

  return (
    <div className="smart-search">
      <div className="search-container">
        <div className="search-input-wrapper">
          <button
            className="search-btn"
            onClick={handleSearchClick}
            disabled={isLoading || query.trim().length < 2}
            title={t('search.search', 'Tìm kiếm')}
          >
            <FontAwesomeIcon icon={faMagnifyingGlass} />
          </button>
          
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              isAIMode 
                ? t('search.aiPlaceholder', 'Hỏi gì cũng được...') 
                : t('search.placeholder', 'Tìm kiếm địa điểm...')
            }
            className="search-input"
          />

          {query && (
            <button 
              className="clear-btn" 
              onClick={clearSearch}
              title={t('search.clear', 'Xóa')}
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          )}

          <button
            className={`ai-toggle ${isAIMode ? 'active' : ''}`}
            onClick={toggleAIMode}
            title={
              isAIMode 
                ? t('search.switchToNormal', 'Tìm kiếm thường') 
                : t('search.switchToAI', 'Tìm kiếm thông minh')
            }
          >
            <FontAwesomeIcon icon={faWandMagicSparkles} />
          </button>
        </div>

        {isLoading && (
          <div className="search-status loading">
            <FontAwesomeIcon icon={faSpinner} spin />
            <span>{t('search.searching', 'Đang tìm kiếm...')}</span>
          </div>
        )}

        {suggestions.length > 0 && !isLoading && (
          <div className="suggestions-dropdown">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="suggestion-item"
                onClick={() => selectLocation(suggestion)}
              >
                <div className="suggestion-icon">
                  <FontAwesomeIcon 
                    icon={suggestion.source === 'overpass' ? faMapMarkerAlt : faLocationDot} 
                  />
                </div>
                
                <div className="suggestion-content">
                  <div className="suggestion-title">
                    {suggestion.name || suggestion.label}
                  </div>
                  
                  {suggestion.description && (
                    <div className="suggestion-description">
                      {suggestion.description}
                    </div>
                  )}
                  
                  <div className="suggestion-meta">
                    {suggestion.source && (
                      <span 
                        className="source-badge"
                        style={{ 
                          backgroundColor: `${getSourceColor(suggestion.source)}15`,
                          color: getSourceColor(suggestion.source)
                        }}
                      >
                        {suggestion.source}
                      </span>
                    )}
                    
                    {suggestion.type && (
                      <span className="type-badge">
                        {suggestion.type}
                      </span>
                    )}
                  </div>
                </div>

                {suggestion.score !== undefined && isAIMode && (
                  <div className="suggestion-score">
                    {Math.round(suggestion.score)}%
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
