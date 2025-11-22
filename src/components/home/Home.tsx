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


import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/pages/Home.css';
import { useTranslation } from 'react-i18next';
import { HelpButton } from '../../tours';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faMapLocationDot, 
  faBook,
  faCircleXmark,
  faSpinner,
  faRobot
} from '@fortawesome/free-solid-svg-icons';

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
}

const Home: React.FC = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // ✅ Copy EXACT từ Search.tsx - searchWikidata function
  const searchWikidata = async (searchTerm: string): Promise<SearchResult[]> => {
    try {
      console.log('Searching for:', searchTerm);

      // SPARQL query
      const sparqlQuery = `
        SELECT DISTINCT 
          ?place ?placeLabel ?placeDescription ?coord ?image ?instanceOfLabel
          ?inception ?population ?area ?website ?phone ?email ?address ?postalCode
          ?osmRelation ?osmNode ?osmWay ?viaf ?gnd
        WHERE {
          SERVICE wikibase:mwapi {
            bd:serviceParam wikibase:api "EntitySearch" .
            bd:serviceParam wikibase:endpoint "www.wikidata.org" .
            bd:serviceParam mwapi:search "${searchTerm}" .
            bd:serviceParam mwapi:language "en" .
            ?place wikibase:apiOutputItem mwapi:item .
            bd:serviceParam mwapi:limit "20" .
          }
          
          # Filter places in Vietnam (country = Vietnam)
          ?place wdt:P17 wd:Q881 .
          
          # Get coordinates (required)
          ?place wdt:P625 ?coord .
          
          # Get instance of (object type)
          OPTIONAL { ?place wdt:P31 ?instanceOf . }
          
          # Get image (optional)
          OPTIONAL { ?place wdt:P18 ?image . }
          
          # Statements / Claims
          OPTIONAL { ?place wdt:P571 ?inception . }
          OPTIONAL { ?place wdt:P1082 ?population . }
          OPTIONAL { ?place wdt:P2046 ?area . }
          OPTIONAL { ?place wdt:P856 ?website . }
          OPTIONAL { ?place wdt:P1329 ?phone . }
          OPTIONAL { ?place wdt:P968 ?email . }
          OPTIONAL { ?place wdt:P6375 ?address . }
          OPTIONAL { ?place wdt:P281 ?postalCode . }
          
          # Identifiers
          OPTIONAL { ?place wdt:P402 ?osmRelation . }
          OPTIONAL { ?place wdt:P11693 ?osmNode . }
          OPTIONAL { ?place wdt:P10689 ?osmWay . }
          OPTIONAL { ?place wdt:P214 ?viaf . }
          OPTIONAL { ?place wdt:P227 ?gnd . }
          
          SERVICE wikibase:label { 
            bd:serviceParam wikibase:language "en,vi" . 
          }
        }
        ORDER BY DESC(?image)
        LIMIT 15
      `;

      const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparqlQuery)}&format=json`;
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/sparql-results+json',
          'User-Agent': 'HanoiMapApp/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Results:', data.results.bindings.length);

      const wikidataResults: SearchResult[] = data.results.bindings.map((binding: any) => {
        // Parse coordinate string "Point(lon lat)"
        const coordMatch = binding.coord.value.match(/Point\(([-\d.]+)\s+([-\d.]+)\)/);
        const lon = coordMatch ? parseFloat(coordMatch[1]) : 0;
        const lat = coordMatch ? parseFloat(coordMatch[2]) : 0;

        // Extract Wikidata QID
        const qid = binding.place.value.split('/').pop();

        // Get image URL if available
        let imageUrl = undefined;
        if (binding.image) {
          const imageName = binding.image.value.split('/').pop();
          imageUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(imageName)}?width=100`;
        }

        // Determine type based on instanceOf
        let type = 'place';
        const instanceOfLabel = binding.instanceOfLabel?.value.toLowerCase() || '';
        
        if (instanceOfLabel.includes('bank') || instanceOfLabel.includes('ngân hàng')) {
          type = 'bank';
        } else if (instanceOfLabel.includes('school') || instanceOfLabel.includes('trường')) {
          type = 'school';
        } else if (instanceOfLabel.includes('hospital') || instanceOfLabel.includes('bệnh viện')) {
          type = 'hospital';
        } else if (instanceOfLabel.includes('restaurant') || instanceOfLabel.includes('nhà hàng')) {
          type = 'restaurant';
        } else if (instanceOfLabel.includes('building') || instanceOfLabel.includes('tòa nhà')) {
          type = 'building';
        } else if (instanceOfLabel.includes('street') || instanceOfLabel.includes('đường')) {
          type = 'street';
        }

        const name = binding.placeLabel.value;
        const description = binding.placeDescription?.value;

        // Extract identifiers
        const identifiers: SearchResult['identifiers'] = {};
        if (binding.osmRelation) identifiers.osmRelationId = binding.osmRelation.value;
        if (binding.osmNode) identifiers.osmNodeId = binding.osmNode.value;
        if (binding.osmWay) identifiers.osmWayId = binding.osmWay.value;
        if (binding.viaf) identifiers.viafId = binding.viaf.value;
        if (binding.gnd) identifiers.gndId = binding.gnd.value;

        // Extract statements
        const statements: SearchResult['statements'] = {};
        if (binding.inception) {
          const date = binding.inception.value;
          statements.inception = date.includes('T') ? date.split('T')[0] : date;
        }
        if (binding.population) statements.population = binding.population.value;
        if (binding.area) statements.area = binding.area.value;
        if (binding.website) statements.website = binding.website.value;
        if (binding.phone) statements.phone = binding.phone.value;
        if (binding.email) statements.email = binding.email.value;
        if (binding.address) statements.address = binding.address.value;
        if (binding.postalCode) statements.postalCode = binding.postalCode.value;

        return {
          id: `wd-${qid}`,
          name,
          type,
          lat,
          lon,
          displayName: name + (description ? ` - ${description}` : ''),
          source: 'wikidata' as const,
          wikidataId: qid,
          description,
          image: imageUrl,
          instanceOf: binding.instanceOfLabel?.value,
          identifiers: Object.keys(identifiers).length > 0 ? identifiers : undefined,
          statements: Object.keys(statements).length > 0 ? statements : undefined
        };
      });

      // Filter out invalid coordinates
      const validResults = wikidataResults.filter(r => r.lat !== 0 && r.lon !== 0);

      console.log(`Found ${validResults.length} valid results with metadata`);
      return validResults;

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

      // Sort: exact match first, then images
      const sortedResults = wikidataResults.sort((a, b) => {
        const aExact = a.name.toLowerCase() === value.toLowerCase();
        const bExact = b.name.toLowerCase() === value.toLowerCase();
        
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        // Prioritize with images
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
      setError("Connection error. Please try again later.");
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

  // ✅ Navigate with FULL DATA
  const handleResultClick = (result: SearchResult) => {
    console.log('Selected:', result);
    console.log('Identifiers:', result.identifiers);
    console.log('Statements:', result.statements);
    
    // Navigate with full SearchResult
    navigate('/map', {
      state: {
        searchResult: result
      }
    });
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

  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion);
    performSearch(suggestion);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node)) {
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

  return (
    <div className="home-container">
      {/* Section 1: Hero with OpenDataFitHou + Slogan */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-header">
            <img className='logo_hou_home' src="/logo-hou-249x300.png" alt="" />
            <div>
              <h1 id="app-title" className="main-title">
              {/* <span className="title-icon">🌍</span> */}
              OpenDataFitHou
              </h1>
              <LanguageSwitcher />
              <p className="main-slogan">{t('home.slogan')}</p>
            </div>
          </div>
          
          {/* Keep current search section */}
          <div className="search-section">
    
            <div className="home-search-wrapper" ref={resultsRef}>
              <div className="home-search-box">
                <FontAwesomeIcon icon={faSearch} className="search-icon" />
                <input
                  id="search-input"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => setShowResults(true)}
                  placeholder={t('home.searchPlaceholder')}
                  className="home-search-input"
                />
                {isLoading && <FontAwesomeIcon icon={faSpinner} spin className="search-loading" />}
              </div>

              {/* Quick Links */}
              <div className="quick-links">
                <a href="https://github.com/MFitHou" target="_blank" rel="noopener noreferrer" className="quick-link-button">
                  <FontAwesomeIcon icon={faBook} /> GitHub
                </a>
                <a href="/map" className="quick-link-button">
                  <FontAwesomeIcon icon={faMapLocationDot} /> {t('nav.map')}
                </a>
                <a href="/query" className="quick-link-button">
                  <FontAwesomeIcon icon={faSearch} /> {t('nav.query')}
                </a>
                <a href="/chatbot" className="quick-link-button">
                  <FontAwesomeIcon icon={faRobot} /> AI Chatbot
                </a>
              </div>

              {showResults && (
                <div className="home-search-results">
                  {error ? (
                    <div className="search-error"><FontAwesomeIcon icon={faCircleXmark} /> {t('common.status.error')}</div>
                  ) : results.length > 0 ? (
                    results.map((result) => (
                      <div
                        key={result.id}
                        className="home-search-result-item"
                        onClick={() => handleResultClick(result)}
                      >
                        {result.image && (
                          <img 
                            src={result.image} 
                            alt={result.name} 
                            className="result-image"
                          />
                        )}
                        <span className="result-icon">
                          {getTypeIcon(result.type)}
                        </span>
                        <div className="result-info">
                          <div className="result-name">
                            {result.name}
                            <span className="wikidata-badge">{result.wikidataId}</span>
                          </div>
                          <div className="result-type">
                            {result.description || result.instanceOf || 'Place'}
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
                        <span className="result-arrow">→</span>
                      </div>
                    ))
                  ) : searchTerm.length === 0 ? (
                    <>
                      <div className="search-suggestions-header">💡 Popular search suggestions:</div>
                      {suggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="home-search-result-item"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          <div className="result-icon">📚</div>
                          <div className="result-info">
                            <div className="result-name">{suggestion}</div>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="no-results">
                      <FontAwesomeIcon icon={faSearch} /> No results found for "{searchTerm}"
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="description">
            <p>
              OpenDataFitHou is an open-source project that collects and links open data from Wikidata, 
              OpenStreetMap, and many other sources. We standardize data into 
              Linked Open Data (RDF) format and visualize it on maps, making 
              queries, analysis, and application development easier.
            </p>
            <p>
              The project contributes to digital transformation and opens up opportunities 
              to exploit open data for research, education, and the community. 🌍✨
            </p>
          </div>
        </div>
      </section>

      {/* Section 2: Project Introduction */}
      <section className="intro-section">
        <div className="container">
          <h2 className="section-title">📋 Project Introduction</h2>
          <div className="intro-grid">
            <div className="intro-card">
              <div className="intro-icon">🎯</div>
              <h3>Objective</h3>
              <p>Collect, standardize, and provide open data in Linked Open Data format</p>
            </div>
            <div className="intro-card">
              <div className="intro-icon">🌟</div>
              <h3>Context</h3>
              <p>Part of OLP PMNM 2025, serving research & digital transformation</p>
            </div>
            <div className="intro-card">
              <div className="intro-icon">🔮</div>
              <h3>Vision</h3>
              <p>Data transparency, community support, easy reuse</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Data & Features */}
      <section className="features-section">
        <div className="container">
          <div className="data-types">
            <h3>📊 Data Types</h3>
            <div className="data-tags">
              <span className="data-tag">🚌 Bus Stop</span>
              <span className="data-tag">🏧 ATM</span>
              <span className="data-tag">🏥 Hospital</span>
              <span className="data-tag">🏫 School</span>
              <span className="data-tag">🛝 Playground</span>
              <span className="data-tag">🚻 Toilets</span>
              <span className="data-tag">🚰 Drinking Water</span>
            </div>
          </div>

          <div className="features-list">
            <h3>⭐ Key Features</h3>
            <div className="features-grid">
              <div className="feature-item">
                <span className="feature-icon">🔍</span>
                <span>Search places in Vietnam</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📍</span>
                <span>Display and highlight places on map</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📋</span>
                <span>Display detailed place information</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🔄</span>
                <span>Find nearby services like ATMs, Bus stops</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">⬇️</span>
                <span>Download place data in XML or RDF format</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🌍</span>
                <span>Query data with SPARQL</span>
              </div>
            </div>
          </div>
        </div>

        {/* Introduction Video Section */}
        <div className='container intro_video'>
          <h3>Introduction Video</h3>
          <div className="video-wrapper">
            <div className="video-container">
              <iframe
                src="https://www.youtube.com/embed/N6JpxWiIIIc?si=lHN1Kfgf-4Zt6YH2"
                title="Project Introduction Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: License Information */}
      <section className="license-section">
        <div className="container">
          <h2 className="section-title">📄 License Information</h2>
          
          <div className="license-content">
            <div className="license-main">
              <div className="license-header">
                <span className="license-icon">⚖️</span>
                <div className="license-info">
                  <h3>GNU General Public License v3.0</h3>
                  <p className="license-subtitle">Open Source License</p>
                </div>
              </div>
              
              <div className="license-description">
                <p>
                  OpenDataFitHou is released under the <strong>GNU GPL v3.0</strong> license, 
                  ensuring openness and freedom for the community. You can:
                </p>
                
                <div className="license-permissions">
                  <div className="permission-item">
                    <span className="permission-icon">✅</span>
                    <span><strong>Use</strong> - Run the program for any purpose</span>
                  </div>
                  <div className="permission-item">
                    <span className="permission-icon">✅</span>
                    <span><strong>Study</strong> - View and learn from the source code</span>
                  </div>
                  <div className="permission-item">
                    <span className="permission-icon">✅</span>
                    <span><strong>Distribute</strong> - Share with others</span>
                  </div>
                  <div className="permission-item">
                    <span className="permission-icon">✅</span>
                    <span><strong>Modify</strong> - Change and improve</span>
                  </div>
                </div>
              </div>
              
              <div className="license-requirements">
                <h4>📋 Usage Requirements:</h4>
                <div className="requirement-list">
                  <div className="requirement-item">
                    <span className="requirement-icon">📝</span>
                    <span>Preserve copyright and license notices</span>
                  </div>
                  <div className="requirement-item">
                    <span className="requirement-icon">🔄</span>
                    <span>Distributions must use the same GPL v3.0 license</span>
                  </div>
                  <div className="requirement-item">
                    <span className="requirement-icon">📖</span>
                    <span>Disclose source code when distributing software</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="license-sidebar">
              <div className="license-badge">
                <img src="https://img.shields.io/badge/License-GPLv3-blue.svg" alt="GPL v3 License" />
              </div>
              
              <div className="license-links">
                <a href="https://www.gnu.org/licenses/gpl-3.0.html" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="license-link">
                  📖 Read full license text
                </a>
                <a href="https://github.com/MFitHou/open_data_map/blob/main/LICENSE" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="license-link">
                  📄 View LICENSE file
                </a>
                <a href="https://choosealicense.com/licenses/gpl-3.0/" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="license-link">
                  ❓ Learn more about GPL v3.0
                </a>
              </div>
              
              <div className="copyright-info">
                <h5>© 2025 OpenDataFitHou</h5>
                <p>All contributors</p>
                <p className="copyright-note">
                  Project under <strong>OLP PMNM 2025</strong> program
                </p>
              </div>
            </div>
          </div>
          
          <div className="license-footer">
            <p className="disclaimer">
              <strong>Note:</strong> This is only a summary of the license information. 
              Please read the full <a href="https://www.gnu.org/licenses/gpl-3.0.html" target="_blank" rel="noopener noreferrer">GNU GPL v3.0</a> 
              to fully understand your rights and obligations.
            </p>
          </div>
        </div>
      </section>

      {/* Section 7: Footer */}
      <footer className="footer-section">
        <div className="container">
          <div className="footer-content">
            <div className="footer-logo">
              <span className="title-icon">🌍</span>
              <span>OpenDataFitHou</span>
            </div>
            <div className="footer-links">
              <a href="https://github.com/MFitHou" target="_blank" rel="noopener noreferrer">GitHub</a>
              <a id="map-navigation" href="/map">Map</a>
              <a id="query-navigation" href="/query">Query Data</a>
            </div>
            <div className="footer-copyright">
              <p>© 2025 OpenDataFitHou. Licensed under GNU General Public License.</p>
              <p>Open Data for Digital Transformation 🌍✨</p>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Help Button */}
      <HelpButton tourType="home" />
    </div>
  );
};

export default Home;