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
  
  // External APIs
  overpassApiUrl: import.meta.env.VITE_OVERPASS_API_URL || 'https://overpass-api.de/api/interpreter',
  wikidataSparqlUrl: import.meta.env.VITE_WIKIDATA_SPARQL_URL || 'https://query.wikidata.org/sparql',
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
  
  // External APIs
  overpass: () => API_CONFIG.overpassApiUrl,
  wikidata: () => API_CONFIG.wikidataSparqlUrl,
} as const;

export default API_CONFIG;
