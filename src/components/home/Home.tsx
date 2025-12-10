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
import { useNavigate, useLocation } from 'react-router-dom';
import '../../styles/pages/Home.css';
import { useTranslation } from 'react-i18next';
import { HelpButton } from '../../tours';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { UserMenu } from '../common/UserMenu';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faMapLocationDot, 
  faBook,
  faCircleXmark,
  faCircleCheck,
  faSpinner,
  faRobot,
  faLock
} from '@fortawesome/free-solid-svg-icons';
import { faProjectDiagram } from '@fortawesome/free-solid-svg-icons/faProjectDiagram';

// Import demo images
import mapDemo1 from '../../assets/1.png';
import mapDemo2 from '../../assets/2.png';
import mapDemo3 from '../../assets/3.png';
import chatbotDemo1 from '../../assets/4.png';
import chatbotDemo2 from '../../assets/5.png';
import queryDemo1 from '../../assets/6.png';
import queryDemo2 from '../../assets/8.png';
import adminDemo1 from '../../assets/10.png';
import adminDemo2 from '../../assets/11.png';
import adminDemo3 from '../../assets/12.png';

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
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLoginSuccess, setShowLoginSuccess] = useState(false);
  const [activeFeatureTab, setActiveFeatureTab] = useState<'map' | 'chatbot' | 'query' | 'admin'>('map');
  
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Hiển thị thông báo đăng nhập thành công
  useEffect(() => {
    const state = location.state as { loginSuccess?: boolean; username?: string };
    console.log('Home - location.state:', state);
    if (state?.loginSuccess) {
      console.log('Showing login success notification');
      setShowLoginSuccess(true);
      // Tự động ẩn sau 5 giây
      const timer = setTimeout(() => {
        setShowLoginSuccess(false);
      }, 5000);
      // Xóa state để không hiển thị lại khi refresh
      window.history.replaceState({}, document.title);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

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
        setError(t('common.status.noResultsFound'));
      }
    } catch (error) {
      console.error("Error searching:", error);
      setError(t('common.status.connectionError'));
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
      {/* Login Success Notification */}
      {showLoginSuccess && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          zIndex: 1002,
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white',
          padding: '1rem 1.5rem',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(25, 118, 210, 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          animation: 'slideInRight 0.3s ease',
          maxWidth: '300px'
        }}>
          <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: '1.5rem' }} />
          <div>
            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Đăng nhập thành công!</div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Chào mừng bạn trở lại</div>
          </div>
          <button
            onClick={() => setShowLoginSuccess(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '0.25rem',
              marginLeft: 'auto'
            }}
          >
            <FontAwesomeIcon icon={faCircleXmark} />
          </button>
        </div>
      )}

      {/* User Menu & Language Switcher - Fixed position top right */}
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1001, display: 'flex', gap: '10px', alignItems: 'center' }}>
        <LanguageSwitcher inline={true} />
        <UserMenu />
      </div>

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
                <a href="/data-explorer" className="quick-link-button">
                  <FontAwesomeIcon icon={faProjectDiagram} /> Query Builder
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
            <p>{t('home.description')}</p>
            <p>{t('home.descriptionExtra')}</p>
          </div>
        </div>
      </section>

      {/* Video Intro Section */}
      <section className="video-intro-section">
        <div className="container">
          <h2 className="section-title">{t('home.video.introTitle')}</h2>
          <div className="video-wrapper">
            <div className="video-container">
              <iframe
                src="https://www.youtube.com/embed/N6JpxWiIIIc?si=PBN6YOVzw0HHt7NA"
                title="OpenDataFitHou Introduction Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      {/* Problem & Solution Section */}
      <section className="problem-solution-section">
        <div className="container">
          <div className="problem-solution-grid">
            <div className="ps-card problem-card">
              <div className="ps-icon">❌</div>
              <h3>{t('home.problemSolution.problemTitle')}</h3>
              <p>{t('home.problemSolution.problem')}</p>
            </div>
            <div className="ps-card solution-card">
              <div className="ps-icon">✅</div>
              <h3>{t('home.problemSolution.solutionTitle')}</h3>
              <p>{t('home.problemSolution.solution')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Project Introduction */}
      <section className="intro-section">
        <div className="container">
          <h2 className="section-title">{t('home.intro.title')}</h2>
          <div className="intro-grid">
            <div className="intro-card">
              <div className="intro-icon">🎯</div>
              <h3>{t('home.intro.objectiveTitle')}</h3>
              <p>{t('home.intro.objective')}</p>
            </div>
            <div className="intro-card">
              <div className="intro-icon">🌟</div>
              <h3>{t('home.intro.contextTitle')}</h3>
              <p>{t('home.intro.context')}</p>
            </div>
            <div className="intro-card">
              <div className="intro-icon">🔮</div>
              <h3>{t('home.intro.visionTitle')}</h3>
              <p>{t('home.intro.vision')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Tabs Section */}
      <section className="features-tabs-section">
        <div className="container">
          <h2 className="section-title">{t('home.featuresTabs.title')}</h2>
          
          <div className="tab-buttons">
            <button 
              className={`tab-btn ${activeFeatureTab === 'map' ? 'active' : ''}`}
              onClick={() => setActiveFeatureTab('map')}
            >
              <FontAwesomeIcon icon={faMapLocationDot} /> {t('home.featuresTabs.map.title')}
            </button>
            <button 
              className={`tab-btn ${activeFeatureTab === 'chatbot' ? 'active' : ''}`}
              onClick={() => setActiveFeatureTab('chatbot')}
            >
              <FontAwesomeIcon icon={faRobot} /> {t('home.featuresTabs.chatbot.title')}
            </button>
            <button 
              className={`tab-btn ${activeFeatureTab === 'query' ? 'active' : ''}`}
              onClick={() => setActiveFeatureTab('query')}
            >
              <FontAwesomeIcon icon={faSearch} /> {t('home.featuresTabs.query.title')}
            </button>
            <button 
              className={`tab-btn ${activeFeatureTab === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveFeatureTab('admin')}
            >
              <FontAwesomeIcon icon={faProjectDiagram} /> {t('home.featuresTabs.admin.title')}
            </button>
          </div>

          <div className="tab-content">
            {activeFeatureTab === 'map' && (
              <div className="tab-panel">
                <h3>{t('home.featuresTabs.map.description')}</h3>
                <div className="demo-images">
                  <img src={mapDemo1} alt="Map Demo 1" className="demo-image" />
                  <img src={mapDemo2} alt="Map Demo 2" className="demo-image" />
                  <img src={mapDemo3} alt="Map Demo 3" className="demo-image" />
                </div>
              </div>
            )}
            {activeFeatureTab === 'chatbot' && (
              <div className="tab-panel">
                <h3>{t('home.featuresTabs.chatbot.description')}</h3>
                <div className="demo-images two-cols">
                  <img src={chatbotDemo1} alt="Chatbot Demo 1" className="demo-image" />
                  <img src={chatbotDemo2} alt="Chatbot Demo 2" className="demo-image" />
                </div>
              </div>
            )}
            {activeFeatureTab === 'query' && (
              <div className="tab-panel">
                <h3>{t('home.featuresTabs.query.description')}</h3>
                <div className="demo-images two-cols">
                  <img src={queryDemo1} alt="Query Demo 1" className="demo-image" />
                  <img src={queryDemo2} alt="Query Demo 2" className="demo-image" />
                </div>
              </div>
            )}
            {activeFeatureTab === 'admin' && (
              <div className="tab-panel">
                <h3>{t('home.featuresTabs.admin.description')}</h3>
                <div className="demo-images">
                  <img src={adminDemo1} alt="Admin Demo 1" className="demo-image" />
                  <img src={adminDemo2} alt="Admin Demo 2" className="demo-image" />
                  <img src={adminDemo3} alt="Admin Demo 3" className="demo-image" />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Section 6: License Information */}
      <section className="license-section">
        <div className="container">
          <h2 className="section-title">{t('home.license.title')}</h2>
          
          <div className="license-content">
            <div className="license-main">
              <div className="license-header">
                <span className="license-icon">⚖️</span>
                <div className="license-info">
                  <h3>{t('home.license.name')}</h3>
                  <p className="license-subtitle">{t('home.license.subtitle')}</p>
                </div>
              </div>
              
              <div className="license-description">
                <p dangerouslySetInnerHTML={{ __html: t('home.license.description') }} />
                
                <div className="license-permissions">
                  <div className="permission-item">
                    <span className="permission-icon">✅</span>
                    <span dangerouslySetInnerHTML={{ __html: t('home.license.permissions.use') }} />
                  </div>
                  <div className="permission-item">
                    <span className="permission-icon">✅</span>
                    <span dangerouslySetInnerHTML={{ __html: t('home.license.permissions.study') }} />
                  </div>
                  <div className="permission-item">
                    <span className="permission-icon">✅</span>
                    <span dangerouslySetInnerHTML={{ __html: t('home.license.permissions.distribute') }} />
                  </div>
                  <div className="permission-item">
                    <span className="permission-icon">✅</span>
                    <span dangerouslySetInnerHTML={{ __html: t('home.license.permissions.modify') }} />
                  </div>
                </div>
              </div>
              
              <div className="license-requirements">
                <h4>{t('home.license.requirementsTitle')}</h4>
                <div className="requirement-list">
                  <div className="requirement-item">
                    <span className="requirement-icon">📝</span>
                    <span>{t('home.license.requirements.preserve')}</span>
                  </div>
                  <div className="requirement-item">
                    <span className="requirement-icon">🔄</span>
                    <span>{t('home.license.requirements.sameLicense')}</span>
                  </div>
                  <div className="requirement-item">
                    <span className="requirement-icon">📖</span>
                    <span>{t('home.license.requirements.disclose')}</span>
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
                  {t('home.license.links.readFull')}
                </a>
                <a href="https://github.com/MFitHou/open_data_map/blob/main/LICENSE" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="license-link">
                  {t('home.license.links.viewFile')}
                </a>
                <a href="https://choosealicense.com/licenses/gpl-3.0/" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="license-link">
                  {t('home.license.links.learnMore')}
                </a>
              </div>
              
              <div className="copyright-info">
                <h5>{t('home.license.copyright')}</h5>
                <p>{t('home.license.contributors')}</p>
                <p className="copyright-note" dangerouslySetInnerHTML={{ __html: t('home.license.program') }} />
              </div>
            </div>
          </div>
          
          <div className="license-footer">
            <p className="disclaimer" dangerouslySetInnerHTML={{ __html: t('home.license.disclaimer') }} />
          </div>
        </div>
      </section>

      {/* Section 7: Footer */}
      <footer className="footer-section">
        <div className="footer-main">
          <div className="container">
            <div className="footer-grid">
              {/* Column 1: About */}
              <div className="footer-column">
                <div className="footer-logo">
                  <span>OpenDataFitHou</span>
                </div>
                <p className="footer-description">
                  {t('home.description')}
                </p>
              </div>

              {/* Column 2: Services */}
              <div className="footer-column">
                <h3 className="footer-column-title">{t('home.footer.services')}</h3>
                <ul className="footer-list">
                  <li><a href="/map">{t('nav.map')}</a></li>
                  <li><a href="/query">{t('home.footer.queryData')}</a></li>
                  <li><a href="/chatbot">AI Chatbot</a></li>
                </ul>
              </div>

              {/* Column 3: Resources */}
              <div className="footer-column">
                <h3 className="footer-column-title">{t('home.footer.resources')}</h3>
                <ul className="footer-list">
                  <li>
                    <div className="footer-social">
                      <a href="https://github.com/MFitHou" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                        <FontAwesomeIcon icon={faBook} />
                        {t('home.footer.githubRepo')}
                      </a>
                    </div>
                  </li>
                  <li>
                    <a href="https://github.com/MFitHou/open_data_map/blob/main/LICENSE" target="_blank" rel="noopener noreferrer">
                      {t('home.license.name')}
                    </a>
                  </li>
                </ul>
              </div>

              {/* Column 4: Contact & Admin */}
              <div className="footer-column">
                <h3 className="footer-column-title">{t('home.footer.contact')}</h3>
                <ul className="footer-list footer-contact">
                  <li>
                    <span className="contact-label">{t('home.footer.organization')}:</span>
                    <span>MFitHou</span>
                  </li>
                  <li>
                    <span className="contact-label">Email Support:</span>
                    <a href="mailto:mfithou@gmail.com">mfithou@gmail.com</a>
                  </li>
                  <li className="admin-access">
                    <a href="/admin" className="footer-admin-button">
                      <FontAwesomeIcon icon={faLock} />
                      <span>{t('nav.admin')}</span>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div className="container">
            <div className="footer-bottom-content">
              <p>{t('home.footer.copyright')}</p>
              <p className="footer-tagline">{t('home.footer.tagline')}</p>
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