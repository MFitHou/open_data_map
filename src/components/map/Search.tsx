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

import { useState, useEffect, useRef } from "react";
import { useTranslation } from 'react-i18next';
import "../../styles/components/Search.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faSpinner,
  faCircleXmark,
  faLightbulb
} from '@fortawesome/free-solid-svg-icons';
import { getApiEndpoint } from '../../config/api';

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
  // Thêm metadata chi tiết
  identifiers?: {
    osmRelationId?: string;
    osmNodeId?: string;
    osmWayId?: string;
    viafId?: string;
    gndId?: string;
  };
  statements?: {
    inception?: string; // P571 - Ngày thành lập
    population?: string; // P1082 - Dân số
    area?: string; // P2046 - Diện tích
    website?: string; // P856 - Website chính thức
    phone?: string; // P1329 - Số điện thoại
    email?: string; // P968 - Email
    address?: string; // P6375 - Địa chỉ
    postalCode?: string; // P281 - Mã bưu điện
  };
}

interface SearchProps {
  onSelectLocation: (result: SearchResult) => void;
}

export const Search: React.FC<SearchProps> = ({ onSelectLocation }) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Handle click outside to close results
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // Tìm kiếm với SPARQL mở rộng
  const searchWikidata = async (searchTerm: string): Promise<SearchResult[]> => {
    try {
      console.log('🔍 Searching Wikidata for:', searchTerm);
      
      // Call backend search endpoint
      const url = getApiEndpoint.wikidataSearch(searchTerm, 15);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const results: SearchResult[] = await response.json();
      console.log(`Found ${results.length} results with metadata`);
      return results;

    } catch (error) {
      console.error('search error:', error);
      throw error;
    }
  };

  const performSearch = async (value: string) => {
    if (value.length < 2) {
      setResults([]);
      setShowResults(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const wikidataResults = await searchWikidata(value);

      // Sắp xếp: có ảnh trước, exact match trước
      const sortedResults = wikidataResults.sort((a, b) => {
        const aExact = a.name.toLowerCase() === value.toLowerCase();
        const bExact = b.name.toLowerCase() === value.toLowerCase();
        
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        // Ưu tiên có ảnh
        if (a.image && !b.image) return -1;
        if (!a.image && b.image) return 1;
        
        return 0;
      });

      setResults(sortedResults);
      setShowResults(true);

      if (sortedResults.length === 0) {
        setError("No results found. Try different keywords.");
      }
    } catch (error) {
      console.error("Error searching:", error);
      setError("Error connecting to Wikidata. Please try again later.");
      setResults([]);
      setShowResults(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      performSearch(value);
    }, 800);
  };

  const handleSelectResult = (result: SearchResult) => {
    console.log('Selected:', result);
    console.log('Identifiers:', result.identifiers);
    console.log('Statements:', result.statements);
    setSearchTerm(result.name);
    setShowResults(false);
    setError(null);
    onSelectLocation(result);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion);
    performSearch(suggestion);
  };

  const getTypeIcon = (type: string): string => {
    const icons: Record<string, string> = {
      bank: '🏦',
      school: '🏫',
      hospital: '🏥',
      restaurant: '🍴',
      building: '🏢',
      street: '🛣️',
      place: '📍'
    };
    return icons[type] || '📚';
  };

  const suggestions = [
    "Hoan Kiem Lake",
    "Temple of Literature",
    "Ho Chi Minh Mausoleum",
    "One Pillar Pagoda",
    "Hanoi Opera House",
    "Imperial Citadel of Thang Long",
    "Vietcombank",
    "BIDV",
    "Hanoi University of Science and Technology",
    "Bach Mai Hospital"
  ];

  return (
    <div className="search-container" ref={containerRef}>
      <div className="search-input-wrapper">
        <input
          type="text"
          className="search-input"
          placeholder={t('map.search.placeholder')}
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setShowResults(true)}
        />
        {isLoading && <div className="search-loading"><FontAwesomeIcon icon={faSpinner} spin /></div>}
      </div>


      {showResults && (
        <div className="search-results">
          {error ? (
            <div className="search-error"><FontAwesomeIcon icon={faCircleXmark} /> {t('common.status.error')}</div>
          ) : results.length > 0 ? (
            results.map((result) => (
              <div
                key={result.id}
                className="search-result-item"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelectResult(result);
                }}
              >
                {result.image && (
                  <img 
                    src={result.image} 
                    alt={result.name} 
                    className="result-image"
                  />
                )}
                <div className="result-icon">
                  {getTypeIcon(result.type)}
                </div>
                <div className="result-info">
                  <div className="result-name">
                    {result.name}
                    <span className="wikidata-badge">{result.wikidataId}</span>
                  </div>
                  <div className="result-type">
                    {result.description || result.instanceOf || 'Location'}
                  </div>
                  <div className="result-metadata">
                    {result.instanceOf && (
                      <span className="metadata-item">🏷️ {result.instanceOf}</span>
                    )}
                    {result.identifiers?.osmRelationId && (
                      <span className="metadata-item">🗺️ OSM: {result.identifiers.osmRelationId}</span>
                    )}
                    {result.statements?.population && (
                      <span className="metadata-item">👥 {parseInt(result.statements.population).toLocaleString()}</span>
                    )}
                    {result.statements?.inception && (
                      <span className="metadata-item">📅 {new Date(result.statements.inception).getFullYear()}</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : searchTerm.length === 0 ? (
            <>
              <div className="search-suggestions-header"><FontAwesomeIcon icon={faLightbulb} /> {t('home.suggestionsTitle')}</div>
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="search-result-item"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSuggestionClick(suggestion);
                  }}
                >
                  <div className="result-icon"><FontAwesomeIcon icon={faSearch} /></div>
                  <div className="result-info">
                    <div className="result-name">{suggestion}</div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="search-no-results">
              <FontAwesomeIcon icon={faSearch} /> {t('home.noResultsFor')} "{searchTerm}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};