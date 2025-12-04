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
  onAIMessageReceived?: (message: string) => void; 
  currentLocation?: { lat: number; lng: number } | null;
  onSuggestionsChange?: (suggestions: Suggestion[]) => void; 
  onClearSearch?: () => void;
  forceHideSuggestions?: boolean; // When true, hide suggestions dropdown (controlled by parent)
  onInputFocus?: () => void; // Callback when user focuses on input (to reset forceHideSuggestions)
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
  currentLocation,
  onSuggestionsChange,
  onClearSearch,
  forceHideSuggestions,
  onInputFocus
}) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [isAIMode, setIsAIMode] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [previousQuery, setPreviousQuery] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState(true); // Control visibility of suggestions
  const inputRef = useRef<HTMLInputElement>(null);

  // Hide suggestions when forceHideSuggestions is true
  React.useEffect(() => {
    if (forceHideSuggestions) {
      setShowSuggestions(false);
    }
  }, [forceHideSuggestions]);

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
      const endpoint = getApiEndpoint.smartSearch();
      
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
        // Send suggestions to map to display as markers
        if (onSuggestionsChange) {
          onSuggestionsChange(data.suggestions);
        }
      } else {
        setSuggestions([]);
        if (onSuggestionsChange) {
          onSuggestionsChange([]);
        }
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
    const { action, params, results } = data;

    switch (action) {
      case 'nearby_search':
        if (results && onNearbyPlacesChange) {
          console.log('[SmartSearch] Nearby search:', results.length, 'results');
          onNearbyPlacesChange(
            results,
            params?.center,
            params?.radiusKm
          );
          setSuggestions([]);
          if (onSuggestionsChange) {
            onSuggestionsChange([]);
          }
        }
        break;

      case 'location_search':
      case 'show_location':
        break;

      case 'text_response':
        setSuggestions([]);
        break;

      case 'search_results':
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
      // Hide suggestions dropdown when user selects a location
      setShowSuggestions(false);
    }
  };

  // Handle input focus - show suggestions again
  const handleInputFocus = () => {
    setShowSuggestions(true);
    onInputFocus?.(); // Notify parent to reset forceHideSuggestions
  };

  const toggleAIMode = () => {
    setIsAIMode(!isAIMode);
    setSuggestions([]);
    setPreviousQuery('');
  };

  const clearSearch = () => {
    setQuery('');
    setSuggestions([]);
    // Clear markers on map
    if (onSuggestionsChange) {
      onSuggestionsChange([]);
    }
    // Clear selected marker and boundary
    if (onClearSearch) {
      onClearSearch();
    }
  };

  return (
    <div className="smart-search">
      <div className="search-container">
        <div className="search-input-wrapper">
            <button
              className={`ai-toggle ${isAIMode ? 'active' : ''}`}
              onClick={toggleAIMode}
              title={
                isAIMode 
                  ? t('search.switchToNormal', 'Switch to normal search') 
                  : t('search.switchToAI', 'Switch to smart search')
              }
            >
            <FontAwesomeIcon icon={faWandMagicSparkles} />
          </button>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              const newValue = e.target.value;
              setQuery(newValue);
              // Show suggestions when user types
              setShowSuggestions(true);
              // Clear suggestions and markers when user clears input
              if (newValue.trim() === '') {
                setSuggestions([]);
                if (onSuggestionsChange) {
                  onSuggestionsChange([]);
                }
                // Clear selected marker and boundary
                if (onClearSearch) {
                  onClearSearch();
                }
              }
            }}
            onKeyPress={handleKeyPress}
            onFocus={handleInputFocus}
            placeholder={
              isAIMode 
                ? t('search.aiPlaceholder', 'Smart search with AI...') 
                : t('search.placeholder', 'Search for places, addresses, POIs...')
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
            className="search-btn"
            onClick={handleSearchClick}
            disabled={isLoading || query.trim().length < 2}
            title={t('search.search', 'Tìm kiếm')}
          >
            <FontAwesomeIcon icon={faMagnifyingGlass} />
          </button>
        </div>

        {isLoading && (
          <div className="search-status loading">
            <FontAwesomeIcon icon={faSpinner} spin />
            <span>{t('search.searching', 'Searching...')}</span>
          </div>
        )}

        {suggestions.length > 0 && !isLoading && showSuggestions && (
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
                    {/* Temporarily hidden source badges */}
                    {/* {suggestion.source && (
                      <span 
                        className="source-badge"
                        style={{ 
                          backgroundColor: `${getSourceColor(suggestion.source)}15`,
                          color: getSourceColor(suggestion.source)
                        }}
                      >
                        {suggestion.source}
                      </span>
                    )} */}
                    
                    {suggestion.type && (
                      <span className="type-badge">
                        {suggestion.type}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
