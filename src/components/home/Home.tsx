import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/Home.css';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // ✅ Copy EXACT từ Search.tsx - searchWikidata function
  const searchWikidata = async (searchTerm: string): Promise<SearchResult[]> => {
    try {
      console.log('🔍 Searching Wikidata for:', searchTerm);

      // SPARQL query GIỐNG HỆT Search.tsx
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
            bd:serviceParam mwapi:language "vi" .
            ?place wikibase:apiOutputItem mwapi:item .
            bd:serviceParam mwapi:limit "20" .
          }
          
          # Lọc địa điểm ở Việt Nam (country = Vietnam)
          ?place wdt:P17 wd:Q881 .
          
          # Lấy tọa độ (bắt buộc)
          ?place wdt:P625 ?coord .
          
          # Lấy instance of (loại đối tượng)
          OPTIONAL { ?place wdt:P31 ?instanceOf . }
          
          # Lấy ảnh (optional)
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
            bd:serviceParam wikibase:language "vi,en" . 
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
        throw new Error(`Wikidata API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 Wikidata results:', data.results.bindings.length);

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

      console.log(`✅ Found ${validResults.length} valid results with metadata`);
      return validResults;

    } catch (error) {
      console.error('❌ Wikidata search error:', error);
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
        setError("Không tìm thấy kết quả trên Wikidata. Thử từ khóa khác.");
      }
    } catch (error) {
      console.error("Error searching:", error);
      setError("Có lỗi khi kết nối Wikidata. Vui lòng thử lại sau.");
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

  // ✅ Navigate với FULL DATA giống Search.tsx
  const handleResultClick = (result: SearchResult) => {
    console.log('🎯 Selected:', result);
    console.log('📍 Identifiers:', result.identifiers);
    console.log('📊 Statements:', result.statements);
    
    // Navigate với SearchResult đầy đủ
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
    "Hồ Gươm",
    "Văn Miếu Quốc Tử Giám",
    "Lăng Chủ tịch Hồ Chí Minh",
    "Chùa Một Cột",
    "Nhà hát Lớn Hà Nội",
    "Hoàng Thành Thăng Long",
    "Vietcombank",
    "BIDV",
    "Trường Đại học Bách Khoa Hà Nội",
    "Bệnh viện Bạch Mai"
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
      <div className="home-hero">
        <div className="home-content">
          <h1 className="home-title">
            🗺️ Open Data FITHOU
          </h1>
          <p className="home-subtitle">
            Khám phá dữ liệu địa lý Việt Nam với công nghệ Semantic Web
          </p>

          <div className="home-search-wrapper" ref={resultsRef}>
            <div className="home-search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => setShowResults(true)}
                placeholder="Tìm địa điểm trên Wikidata... (VD: Hồ Gươm, Văn Miếu, BIDV)"
                className="home-search-input"
              />
              {isLoading && <span className="search-loading">📚</span>}
            </div>

            <div className="home-search-info">
              <span className="info-badge">📚 Dữ liệu từ Wikidata</span>
            </div>

            {showResults && (
              <div className="home-search-results">
                {error ? (
                  <div className="search-error">⚠️ {error}</div>
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
                          {result.description || result.instanceOf || 'Địa điểm'}
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
                    <div className="search-suggestions-header">💡 Gợi ý tìm kiếm phổ biến:</div>
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
                    🔍 Không tìm thấy "{searchTerm}" trên Wikidata
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="home-actions">
            <button 
              className="action-btn primary"
              onClick={() => navigate('/map')}
            >
              🗺️ Mở bản đồ
            </button>
            <button 
              className="action-btn secondary"
              onClick={() => alert('Tính năng đang phát triển')}
            >
              📊 Xem thống kê
            </button>
          </div>
        </div>

        <div className="home-features">
          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3>Tìm kiếm đầy đủ</h3>
            <p>Query SPARQL với metadata, identifiers và statements</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🌐</div>
            <h3>Semantic Web</h3>
            <p>Dữ liệu liên kết với Wikidata và OpenStreetMap</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📍</div>
            <h3>Chi tiết ngay lập tức</h3>
            <p>Không cần fetch thêm khi vào map</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⬇️</div>
            <h3>Export dữ liệu</h3>
            <p>Tải xuống dữ liệu dạng XML, RDF/XML</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;