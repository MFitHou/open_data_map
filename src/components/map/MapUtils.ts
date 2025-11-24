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
 * Calculate polygon area in km²
 */
export const calculatePolygonArea = (coordinates: number[][]): number => {
  if (coordinates.length < 3) return 0;
  
  let area = 0;
  const earthRadius = 6371;
  
  for (let i = 0; i < coordinates.length; i++) {
    const j = (i + 1) % coordinates.length;
    const lat1 = coordinates[i][1] * Math.PI / 180;
    const lat2 = coordinates[j][1] * Math.PI / 180;
    const lon1 = coordinates[i][0] * Math.PI / 180;
    const lon2 = coordinates[j][0] * Math.PI / 180;
    
    area += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  
  area = Math.abs(area * earthRadius * earthRadius / 2);
  return area;
};

/**
 * Fetch population data from Wikidata
 */
export const fetchPopulationData = async (osmId: number) => {
  try {
    const wikidataQuery = `
      SELECT ?population ?area WHERE {
        ?item wdt:P402 "${osmId}" .
        OPTIONAL { ?item wdt:P1082 ?population . }
        OPTIONAL { ?item wdt:P2046 ?area . }
      }
    `;
    
    const response = await fetch('https://query.wikidata.org/sparql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `query=${encodeURIComponent(wikidataQuery)}&format=json`
    });
    
    const data = await response.json();
    
    if (data.results?.bindings?.length > 0) {
      const binding = data.results.bindings[0];
      return {
        population: binding.population?.value ? parseInt(binding.population.value) : null,
        officialArea: binding.area?.value ? parseFloat(binding.area.value) : null
      };
    }
    
    return { population: null, officialArea: null };
  } catch (error) {
    console.error('Error fetching population data:', error);
    return { population: null, officialArea: null };
  }
};

/**
 * Connect ways into a complete polygon
 */
export const connectWays = (ways: any[]) => {
  if (ways.length === 0) return [];
  
  const connectedCoords: number[][] = [];
  const usedWays = new Set<number>();
  
  // Start with the first way
  let currentWay = ways[0];
  connectedCoords.push(...currentWay.map((node: any) => [node.lon, node.lat]));
  usedWays.add(0);
  
  // Connect remaining ways
  while (usedWays.size < ways.length) {
    const lastPoint = connectedCoords[connectedCoords.length - 1];
    let foundConnection = false;
    
    for (let i = 0; i < ways.length; i++) {
      if (usedWays.has(i)) continue;
      
      const way = ways[i];
      const wayCoords = way.map((node: any) => [node.lon, node.lat]);
      const firstPoint = wayCoords[0];
      const lastPointOfWay = wayCoords[wayCoords.length - 1];
      
      // Check if this way connects with the end point
      if (Math.abs(lastPoint[0] - firstPoint[0]) < 0.0001 && 
          Math.abs(lastPoint[1] - firstPoint[1]) < 0.0001) {
        connectedCoords.push(...wayCoords.slice(1));
        usedWays.add(i);
        foundConnection = true;
        break;
      }
      // Check reverse
      else if (Math.abs(lastPoint[0] - lastPointOfWay[0]) < 0.0001 && 
               Math.abs(lastPoint[1] - lastPointOfWay[1]) < 0.0001) {
        connectedCoords.push(...wayCoords.reverse().slice(1));
        usedWays.add(i);
        foundConnection = true;
        break;
      }
    }
    
    if (!foundConnection) break;
  }
  
  return connectedCoords;
};

/**
 * Get coordinates from OSM element
 */
export const getCoordinates = (element: any) => {
  if (element.lat && element.lon) {
    return [element.lat, element.lon];
  } else if (element.center) {
    return [element.center.lat, element.center.lon];
  }
  return null;
};

/**
 * Create rows for InfoPanel
 */
export const makeRows = (obj: Record<string, any>): { label: string; value: string }[] =>
  Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => ({ label: k, value: String(v) }));
