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

import { getApiEndpoint } from '../config/api';

// Build & fetch Overpass data and convert to GeoJSON outline
export interface OverpassGeoJSON {
  type: string;
  features: any[];
}

export interface OutlineResult {
  geojson: OverpassGeoJSON | null;
  source: string;
  relationId?: number;
}

export async function fetchOverpassRaw(qid: string): Promise<any | null> {
  try {
    const url = getApiEndpoint.overpassRaw(qid);
    const res = await fetch(url);
    
    if (!res.ok) {
      console.error('Error fetching Overpass raw data:', res.statusText);
      return null;
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error fetching Overpass raw data:', error);
    return null;
  }
}

export async function fetchOverpassOutline(qid: string): Promise<OverpassGeoJSON | null> {
  if (!/^Q\d+$/.test(qid)) return null;
  
  try {
    const url = getApiEndpoint.overpassOutline(qid);
    const res = await fetch(url);
    
    if (!res.ok) {
      console.error('Error fetching Overpass outline:', res.statusText);
      return null;
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error fetching Overpass outline:', error);
    return null;
  }
}

export async function fetchOutlineByOSMRelationId(osmRelationId: number): Promise<OutlineResult> {
  if (!osmRelationId) return { geojson: null, source: 'invalid-id' };

  try {
    const url = getApiEndpoint.overpassRelation(osmRelationId);
    const res = await fetch(url);
    
    if (!res.ok) {
      console.error('Error fetching outline by OSM relation ID:', res.statusText);
      return { geojson: null, source: 'http-error' };
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error fetching outline by OSM relation ID:', error);
    return { geojson: null, source: 'exception' };
  }
}

// Legacy function for backward compatibility - converts raw to GeoJSON on client side
export function overpassToGeoJSON(raw: any, qid: string): OverpassGeoJSON | null {
  console.warn('overpassToGeoJSON is deprecated. Use fetchOverpassOutline instead.');
  
  if (!raw?.elements?.length) return null;

  // Helper function to build polygons from members
  const buildPolygonsFromMembers = (members: any[]): number[][][] => {
    const rings: number[][][] = [];
    members.forEach(m => {
      if (!m.geometry) return;
      const coords = m.geometry.map((pt: any) => [pt.lon, pt.lat]);
      if (coords.length > 3) {
        const first = coords[0];
        const last = coords[coords.length - 1];
        if (first[0] === last[0] && first[1] === last[1]) {
          rings.push(coords);
        }
      }
    });
    return rings;
  };

  const waysToMultiLine = (elements: any[]): number[][][] => {
    return elements
      .filter(e => e.type === 'way' && e.geometry)
      .map(w => w.geometry.map((pt: any) => [pt.lon, pt.lat]));
  };

  // Prefer relation boundary
  const rel = raw.elements.find((e: any) => e.type === 'relation');
  if (rel && rel.members) {
    const memberWays = rel.members
      .map((m: any) => {
        if (m.geometry) return m;
        return raw.elements.find((e: any) => e.type === m.type && e.id === m.ref && e.geometry) || m;
      })
      .filter((m: any) => m.geometry);

    const rings = buildPolygonsFromMembers(memberWays);
    if (rings.length) {
      return {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { source: 'overpass', qid, kind: 'relation-boundary', id: rel.id },
            geometry: rings.length === 1
              ? { type: 'Polygon', coordinates: rings }
              : { type: 'MultiPolygon', coordinates: rings.map(r => [r]) }
          }
        ]
      };
    }

    const lines = waysToMultiLine(memberWays);
    if (lines.length) {
      return {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { source: 'overpass', qid, kind: 'relation-lines', id: rel.id },
            geometry: { type: 'MultiLineString', coordinates: lines }
          }
        ]
      };
    }
  }

  const wayLines = waysToMultiLine(raw.elements);
  if (wayLines.length) {
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { source: 'overpass', qid, kind: 'way-lines' },
          geometry: wayLines.length === 1
            ? { type: 'LineString', coordinates: wayLines[0] }
            : { type: 'MultiLineString', coordinates: wayLines }
        }
      ]
    };
  }

  return null;
}