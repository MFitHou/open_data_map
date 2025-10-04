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
        setError("Không tìm thấy kết quả. Thử từ khóa khác.");
      }
    } catch (error) {
      console.error("Error searching:", error);
      setError("Có lỗi khi kết nối. Vui lòng thử lại sau.");
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
      {/* Section 1: Hero với OpenDataFitHou + Slogan */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="main-title">
            <span className="title-icon">🌍</span>
            OpenDataFitHou
          </h1>
          <p className="main-slogan">Open Data for Digital Transformation</p>
          
          

          {/* Giữ lại phần tìm kiếm hiện tại */}
          <div className="search-section">
    
            <div className="home-search-wrapper" ref={resultsRef}>
              <div className="home-search-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => setShowResults(true)}
                  placeholder="Tìm địa điểm trong nước... (VD: Hồ Gươm, Văn Miếu, BIDV)"
                  className="home-search-input"
                />
                {isLoading && <span className="search-loading">📚</span>}
              </div>

              {/* Quick Links */}
              <div className="quick-links">
                <a href="https://github.com/MFitHou" target="_blank" rel="noopener noreferrer" className="quick-link-button">
                  📚 GitHub
                </a>
                <a href="/map" className="quick-link-button">
                  🗺️ Bản đồ
                </a>
                <a href="/query" className="quick-link-button">
                  🔍 Truy vấn dữ liệu
                </a>
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
          </div>
          <div className="description">
            <p>
              OpenDataFitHou là dự án mã nguồn mở thu thập và liên kết dữ liệu mở từ Wikidata, 
              OpenStreetMap và nhiều nguồn khác. Chúng tôi chuẩn hóa dữ liệu thành định dạng 
              Linked Open Data (RDF) và trực quan hóa trên bản đồ, giúp việc tra cứu – phân tích – 
              phát triển ứng dụng trở nên dễ dàng hơn.
            </p>
            <p>
              Dự án góp phần thúc đẩy chuyển đổi số và mở ra cơ hội khai thác dữ liệu mở 
              cho nghiên cứu, giáo dục và cộng đồng. 🌍✨
            </p>
          </div>
        </div>
      </section>

      {/* Section 2: Giới thiệu dự án */}
      <section className="intro-section">
        <div className="container">
          <h2 className="section-title">📋 Giới thiệu dự án</h2>
          <div className="intro-grid">
            <div className="intro-card">
              <div className="intro-icon">🎯</div>
              <h3>Mục tiêu</h3>
              <p>Thu thập, chuẩn hóa, và cung cấp dữ liệu mở dạng Linked Open Data</p>
            </div>
            <div className="intro-card">
              <div className="intro-icon">🌟</div>
              <h3>Bối cảnh</h3>
              <p>Thuộc OLP PMNM 2025, phục vụ nghiên cứu & chuyển đổi số</p>
            </div>
            <div className="intro-card">
              <div className="intro-icon">🔮</div>
              <h3>Tầm nhìn</h3>
              <p>Minh bạch dữ liệu, hỗ trợ cộng đồng, dễ tái sử dụng</p>
            </div>
          </div>
        </div>
      </section>

      

      {/* Section 4: Dữ liệu & tính năng */}
      <section className="features-section">
        <div className="container">
          <div className="data-types">
            <h3>📊 Các loại dữ liệu:</h3>
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
            <h3>⭐ Tính năng chính:</h3>
            <div className="features-grid">
              <div className="feature-item">
                <span className="feature-icon">🔍</span>
                <span>Tìm kiếm địa điểm trong nước</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📍</span>
                <span>Hiển thị và highlight địa điểm trên bản đồ</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📋</span>
                <span>Hiển thị chi tiết dữ liệu của địa điểm</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🔄</span>
                <span>Tra cứu các dịch vụ ở gần địa điểm đó như ATM, Điểm bus</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">⬇️</span>
                <span>Download dữ liệu về địa điểm theo dạng XML hoặc RDF</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🌍</span>
                <span>Query dữ liệu với SPARQL</span>
              </div>
            </div>
          </div>
        </div>
      </section>

    

      {/* Section 6: License Information */}
      <section className="license-section">
        <div className="container">
          <h2 className="section-title">📄 Thông tin giấy phép</h2>
          
          <div className="license-content">
            <div className="license-main">
              <div className="license-header">
                <span className="license-icon">⚖️</span>
                <div className="license-info">
                  <h3>GNU General Public License v3.0</h3>
                  <p className="license-subtitle">Giấy phép mã nguồn mở</p>
                </div>
              </div>
              
              <div className="license-description">
                <p>
                  OpenDataFitHou được phát hành dưới giấy phép <strong>GNU GPL v3.0</strong>, 
                  đảm bảo tính mở và tự do cho cộng đồng. Bạn có thể:
                </p>
                
                <div className="license-permissions">
                  <div className="permission-item">
                    <span className="permission-icon">✅</span>
                    <span><strong>Sử dụng</strong> - Chạy chương trình cho mọi mục đích</span>
                  </div>
                  <div className="permission-item">
                    <span className="permission-icon">✅</span>
                    <span><strong>Nghiên cứu</strong> - Xem và học hỏi từ mã nguồn</span>
                  </div>
                  <div className="permission-item">
                    <span className="permission-icon">✅</span>
                    <span><strong>Phân phối</strong> - Chia sẻ với người khác</span>
                  </div>
                  <div className="permission-item">
                    <span className="permission-icon">✅</span>
                    <span><strong>Chỉnh sửa</strong> - Thay đổi và cải thiện</span>
                  </div>
                </div>
              </div>
              
              <div className="license-requirements">
                <h4>📋 Điều kiện khi sử dụng:</h4>
                <div className="requirement-list">
                  <div className="requirement-item">
                    <span className="requirement-icon">📝</span>
                    <span>Giữ nguyên thông báo bản quyền và giấy phép</span>
                  </div>
                  <div className="requirement-item">
                    <span className="requirement-icon">🔄</span>
                    <span>Các bản phân phối phải dùng cùng giấy phép GPL v3.0</span>
                  </div>
                  <div className="requirement-item">
                    <span className="requirement-icon">📖</span>
                    <span>Công khai mã nguồn nếu phân phối phần mềm</span>
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
                  📖 Đọc toàn văn giấy phép
                </a>
                <a href="https://github.com/MFitHou/open_data_map/blob/main/LICENSE" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="license-link">
                  📄 Xem LICENSE file
                </a>
                <a href="https://choosealicense.com/licenses/gpl-3.0/" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="license-link">
                  ❓ Tìm hiểu thêm về GPL v3.0
                </a>
              </div>
              
              <div className="copyright-info">
                <h5>© 2025 OpenDataFitHou</h5>
                <p>Tất cả contributors</p>
                <p className="copyright-note">
                  Dự án thuộc chương trình <strong>OLP PMNM 2025</strong>
                </p>
              </div>
            </div>
          </div>
          
          <div className="license-footer">
            <p className="disclaimer">
              <strong>Lưu ý:</strong> Đây chỉ là tóm tắt thông tin giấy phép. 
              Vui lòng đọc toàn văn <a href="https://www.gnu.org/licenses/gpl-3.0.html" target="_blank" rel="noopener noreferrer">GNU GPL v3.0</a> 
              để hiểu đầy đủ quyền và nghĩa vụ của bạn.
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
              <a href="/map">Bản đồ</a>
              <a href="/query">Truy vấn dữ liệu</a>
            </div>
            <div className="footer-copyright">
              <p>© 2025 OpenDataFitHou. Licensed under GNU General Public License.</p>
              <p>Open Data for Digital Transformation 🌍✨</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;