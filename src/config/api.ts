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

/**
 * API Configuration
 * Centralized configuration for all API endpoints
 */

export const API_CONFIG = {
  // Base URLs
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'https://opendatamap.hou.edu.vn/api',
  
  // Chat API
  chatApiUrl: import.meta.env.VITE_CHAT_API_URL || 'https://opendatamap.hou.edu.vn/api/chat/main',
  
  // Fuseki SPARQL endpoints
  fusekiBaseUrl: import.meta.env.VITE_FUSEKI_BASE_URL || 'https://opendatamap.hou.edu.vn/api/fuseki',
  
  // Wikidata API
  wikidataBaseUrl: import.meta.env.VITE_WIKIDATA_BASE_URL || 'https://opendatamap.hou.edu.vn/api/wikidata',
  
  // Overpass API 
  overpassBaseUrl: import.meta.env.VITE_OVERPASS_BASE_URL || 'https://opendatamap.hou.edu.vn/api/overpass',
  
  // Admin API
  adminBaseUrl: import.meta.env.VITE_ADMIN_BASE_URL || 'http://localhost:3000/api/admin',
} as const;

/**
 * Helper functions to build specific endpoints
 */
export const getApiEndpoint = {
  // Chat endpoints
  chat: () => API_CONFIG.chatApiUrl,
  
  // Fuseki endpoints
  fusekiQuery: () => `${API_CONFIG.fusekiBaseUrl}/query`,
  fusekiAtms: () => `${API_CONFIG.fusekiBaseUrl}/atms`,
  fusekiNearby: (amenity: string) => `${API_CONFIG.fusekiBaseUrl}/${amenity}/nearby`,
  
  // Wikidata endpoints
  wikidataInfo: (qid: string) => `${API_CONFIG.wikidataBaseUrl}/info/${qid}`,
  wikidataLabels: (ids: string[]) => `${API_CONFIG.wikidataBaseUrl}/labels?ids=${ids.join(',')}`,
  wikidataSearch: (query: string, limit?: number) => {
    const params = new URLSearchParams({ query });
    if (limit) params.append('limit', limit.toString());
    return `${API_CONFIG.wikidataBaseUrl}/search?${params.toString()}`;
  },
  
  // Overpass endpoints 
  overpassRaw: (qid: string) => `${API_CONFIG.overpassBaseUrl}/raw/${qid}`,
  overpassOutline: (qid: string) => `${API_CONFIG.overpassBaseUrl}/outline/${qid}`,
  overpassRelation: (relationId: number) => `${API_CONFIG.overpassBaseUrl}/relation/${relationId}`,
  
  // Admin endpoints
  adminStats: () => `${API_CONFIG.adminBaseUrl}/stats`,
  adminPoi: () => `${API_CONFIG.adminBaseUrl}/poi`,
  adminHealth: () => `${API_CONFIG.adminBaseUrl}/health`,
} as const;

export default API_CONFIG;
