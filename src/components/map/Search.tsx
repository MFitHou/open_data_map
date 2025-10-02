import { useState, useEffect, useRef } from "react";
import "../../styles/Search.css";

interface SearchResult {
  id: number;
  name: string;
  type: string;
  lat: number;
  lon: number;
  displayName: string;
}

interface SearchProps {
  onSelectLocation: (result: SearchResult) => void;
}

export const Search: React.FC<SearchProps> = ({ onSelectLocation }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

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
      // Chuẩn hóa input: loại bỏ dấu và viết thường
      const normalizedValue = value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      
      // Tìm kiếm theo ID hoặc tên chính xác
      // Không dùng regex để tránh lỗi parsing
      const query = `
        [out:json][timeout:25];
        (
          relation["name"="${value}"]["boundary"="administrative"]["admin_level"~"6|7|8"](21.0,105.8,21.1,105.9);
          relation["name"~"${value}"]["boundary"="administrative"]["admin_level"~"6|7|8"](21.0,105.8,21.1,105.9);
          relation["name:vi"="${value}"]["boundary"="administrative"]["admin_level"~"6|7|8"](21.0,105.8,21.1,105.9);
          node["name"="${value}"]["place"~"district|ward|suburb"](21.0,105.8,21.1,105.9);
        );
        out center 15;
      `;

      console.log('Searching with query:', query);

      const response = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: query,
      });

      console.log('Response status:', response.status);

      if (response.status === 429) {
        setError("Quá nhiều yêu cầu. Vui lòng chờ một chút...");
        setResults([]);
        setShowResults(true);
        return;
      }

      if (response.status === 504) {
        setError("Kết nối timeout. Vui lòng thử lại sau.");
        setResults([]);
        setShowResults(true);
        return;
      }

      if (response.status === 400) {
        setError("Truy vấn không hợp lệ. Vui lòng thử từ khóa khác.");
        setResults([]);
        setShowResults(true);
        return;
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text();
        console.error("Received non-JSON response:", textResponse);
        setError("Lỗi kết nối đến máy chủ. Vui lòng thử lại sau.");
        setResults([]);
        setShowResults(true);
        return;
      }

      const data = await response.json();
      console.log('Search results:', data);

      if (data.elements && data.elements.length > 0) {
        const searchResults: SearchResult[] = data.elements
          .map((element: any) => {
            const lat = element.lat || element.center?.lat;
            const lon = element.lon || element.center?.lon;
            
            if (!lat || !lon) return null;

            let type = "location";
            if (element.tags?.admin_level === "6") {
              type = "district";
            } else if (element.tags?.admin_level === "7" || element.tags?.admin_level === "8") {
              type = "ward";
            } else if (element.tags?.place) {
              type = element.tags.place;
            }

            // Lấy tên hiển thị
            const name = element.tags?.name || element.tags?.["name:vi"] || "Không rõ tên";
            const parentName = element.tags?.["is_in:district"] || 
                              element.tags?.["addr:district"] ||
                              element.tags?.["is_in:province"] ||
                              "Hà Nội";

            return {
              id: element.id,
              name: name,
              type: type,
              lat: lat,
              lon: lon,
              displayName: `${name}${parentName !== name ? ` - ${parentName}` : ""}`,
            };
          })
          .filter((r): r is SearchResult => r !== null);

        // Sắp xếp kết quả: exact match trước
        const sortedResults = searchResults.sort((a, b) => {
          const aExact = a.name.toLowerCase() === value.toLowerCase();
          const bExact = b.name.toLowerCase() === value.toLowerCase();
          if (aExact && !bExact) return -1;
          if (!aExact && bExact) return 1;
          return 0;
        });

        setResults(sortedResults);
        setShowResults(true);
      } else {
        setResults([]);
        setShowResults(true);
      }
    } catch (error) {
      console.error("Error searching location:", error);
      setError("Có lỗi xảy ra khi tìm kiếm. Vui lòng thử lại.");
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
    }, 1000);
  };

  const handleSelectResult = (result: SearchResult) => {
    setSearchTerm(result.name);
    setShowResults(false);
    setError(null);
    onSelectLocation(result);
  };

  const handleInputFocus = () => {
    if (results.length > 0 || error) {
      setShowResults(true);
    }
  };

  const handleInputBlur = () => {
    setTimeout(() => {
      setShowResults(false);
    }, 200);
  };

  // Danh sách gợi ý phường/quận phổ biến
  const suggestions = [
    "Ba Đình",
    "Hoàn Kiếm", 
    "Hai Bà Trưng",
    "Đống Đa",
    "Cầu Giấy",
    "Thanh Xuân",
    "Điện Biên",
    "Ngọc Hà",
    "Kim Mã",
    "Láng Hạ"
  ];

  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion);
    performSearch(suggestion);
  };

  return (
    <div className="search-container">
      <div className="search-input-wrapper">
        <input
          type="text"
          className="search-input"
          placeholder="Nhập tên phường, quận (VD: Ba Đình, Điện Biên)"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
        />
        {isLoading && <div className="search-loading">🔍</div>}
      </div>

      {/* Hiển thị suggestions khi chưa có kết quả */}
      {showResults && searchTerm.length === 0 && (
        <div className="search-results">
          <div className="search-suggestions-header">
            💡 Gợi ý tìm kiếm:
          </div>
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="search-result-item"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="result-icon">🔍</div>
              <div className="result-info">
                <div className="result-name">{suggestion}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showResults && searchTerm.length > 0 && (
        <div className="search-results">
          {error ? (
            <div className="search-error">
              ⚠️ {error}
            </div>
          ) : results.length > 0 ? (
            results.map((result) => (
              <div
                key={result.id}
                className="search-result-item"
                onClick={() => handleSelectResult(result)}
              >
                <div className="result-icon">
                  {result.type === "district" ? "🏙️" : 
                   result.type === "ward" ? "📍" : "🗺️"}
                </div>
                <div className="result-info">
                  <div className="result-name">{result.name}</div>
                  <div className="result-type">{result.displayName}</div>
                </div>
              </div>
            ))
          ) : searchTerm.length >= 2 ? (
            <div className="search-no-results">
              Không tìm thấy "{searchTerm}". Thử tìm: {suggestions.slice(0, 3).join(", ")}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};