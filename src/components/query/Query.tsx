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
import '../../styles/Query.css';
import { HelpButton } from '../../tours';

interface QueryResult {
  count: number;
  data: any[];
}

interface QueryError {
  message: string;
  error: string;
}

export const Query: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<QueryResult | null>(null);
  const [error, setError] = useState<QueryError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'table' | 'json'>('table');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ✅ Query mẫu
  const sampleQueries = [
    {
      name: '🏧 Lấy 10 ATM đầu tiên',
      query: `PREFIX ex: <http://opendatafithou.org/poi/>
PREFIX geo1: <http://www.opendatafithou.net/ont/geosparql#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?poi ?amenity ?brand ?operator ?wkt
WHERE {
?poi ex:amenity "atm" .
OPTIONAL { ?poi ex:brand ?brand . }
OPTIONAL { ?poi ex:operator ?operator . }
OPTIONAL {
    ?poi geo1:hasGeometry ?g .
    ?g geo1:asWKT ?wkt .
}
}
LIMIT 20`
    },
  ];

  // ✅ Thực thi query
  const executeQuery = async () => {
    if (!query.trim()) {
      setError({ message: 'Query trống', error: 'Vui lòng nhập SPARQL query' });
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('http://localhost:3000/fuseki/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Query failed');
      }

      setResults(data);
      setActiveTab('table');
    } catch (err: any) {
      setError({
        message: 'Lỗi thực thi query',
        error: err.message || 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Load query mẫu
  const loadSampleQuery = (sampleQuery: string) => {
    setQuery(sampleQuery);
    setResults(null);
    setError(null);
  };

  // ✅ Clear tất cả
  const clearAll = () => {
    setQuery('');
    setResults(null);
    setError(null);
  };

  // ✅ Format query (thêm indent)
  const formatQuery = () => {
    const formatted = query
      .split('\n')
      .map(line => line.trim())
      .join('\n');
    setQuery(formatted);
  };

  // ✅ Download JSON
  const downloadJSON = () => {
    if (!results) return;
    
    const dataStr = JSON.stringify(results.data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `query-results-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ✅ Render bảng kết quả
  const renderTable = () => {
    if (!results || results.count === 0) {
      return <div className="no-results">❌ Không có kết quả</div>;
    }

    const columns = Object.keys(results.data[0]);

    return (
      <div className="results-table-wrapper">
        <div className="results-header">
          ✅ Tìm thấy <strong>{results.count}</strong> kết quả
        </div>
        <table className="results-table">
          <thead>
            <tr>
              <th>#</th>
              {columns.map(col => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.data.map((row, idx) => (
              <tr key={idx}>
                <td>{idx + 1}</td>
                {columns.map(col => (
                  <td key={col}>
                    {typeof row[col] === 'string' && row[col].startsWith('http') ? (
                      <a href={row[col]} target="_blank" rel="noopener noreferrer">
                        {row[col]}
                      </a>
                    ) : (
                      String(row[col] || 'N/A')
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // ✅ Render JSON
  const renderJSON = () => {
    if (!results) {
      return <div className="no-results">❌ Không có kết quả</div>;
    }

    return (
      <>
        <pre className="json-results">
          {JSON.stringify(results.data, null, 2)}
        </pre>
        <div className="json-footer">
          <button className="download-json-btn" onClick={downloadJSON}>
            💾 Download JSON
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="query-container">
      <div className="query-header">
        <h1>🔍 SPARQL Query </h1>
        <p>Truy vấn dữ liệu MFithou</p>
      </div>

      {/* Sample Queries */}
      <div id="query-examples" className="sample-queries">
        <div className="sample-header">📋 Query mẫu:</div>
        <div className="sample-buttons">
          {sampleQueries.map((sample, idx) => (
            <button
              key={idx}
              className="sample-btn"
              onClick={() => loadSampleQuery(sample.query)}
            >
              {sample.name}
            </button>
          ))}
        </div>
      </div>

      {/* ✅ Layout song song: Editor bên trái, Results bên phải */}
      <div className="query-layout">
        {/* Query Editor - Left Side */}
        <div className="query-editor">
          <div className="editor-header">
            <span>✏️ SPARQL Query Editor</span>
            <div className="editor-actions">
              <button className="action-btn" onClick={clearAll} title="Clear all">
                🗑️ Clear
              </button>
            </div>
          </div>
          <textarea
            id="sparql-editor"
            ref={textareaRef}
            className="query-textarea"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nhập SPARQL query tại đây..."
            spellCheck={false}
          />
          <div className="editor-footer">
            <button
              id="execute-query"
              className="execute-btn"
              onClick={executeQuery}
              disabled={isLoading || !query.trim()}
            >
              {isLoading ? '⏳ Đang thực thi...' : '▶️ Thực thi Query'}
            </button>
            <span className="query-length">
              {query.length} ký tự
            </span>
          </div>
        </div>

        {/* Results Display - Right Side */}
        <div className="results-panel">
          {/* Error Display */}
          {error && (
            <div className="error-display">
              <div className="error-title">❌ {error.message}</div>
              <div className="error-detail">{error.error}</div>
            </div>
          )}

          {/* Results Display */}
          {results && (
            <div id="results-table" className="results-container">
              <div className="results-tabs">
                <button
                  className={`tab-btn ${activeTab === 'table' ? 'active' : ''}`}
                  onClick={() => setActiveTab('table')}
                >
                  📊 Bảng
                </button>
                <button
                  className={`tab-btn ${activeTab === 'json' ? 'active' : ''}`}
                  onClick={() => setActiveTab('json')}
                >
                  📄 JSON
                </button>
              </div>

              <div className="results-content">
                {activeTab === 'table' ? renderTable() : renderJSON()}
              </div>
            </div>
          )}

          {/* Placeholder khi chưa có kết quả */}
          {!results && !error && (
            <div className="results-placeholder">
              <div className="placeholder-icon">📊</div>
              <div className="placeholder-text">
                Nhập query và nhấn "Thực thi" để xem kết quả
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Help Button */}
      <HelpButton tourType="query" />
    </div>
  );
};