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

// Định nghĩa kiểu dữ liệu ATM
export interface ATMData {
  id: string;
  brand: string;
  operator: string;
  wikidataId: string;
  geometry: {
    type: string;
    coordinates: [number, number]; // [lon, lat]
  };
}

// Hàm chính: lấy trực tiếp triples từ API và chuyển thành danh sách ATM
export const loadATMsFromAPI = async (
  apiEndpoint: string = getApiEndpoint.fusekiAtms()
): Promise<ATMData[]> => {
  try {
    // console.log('🔍 Fetching ATM triples from API (no SPARQL)...');

    const res = await fetch(apiEndpoint, { method: 'GET' });
    if (!res.ok) {
      throw new Error(`API error ${res.status} ${res.statusText}`);
    }

    const payload = await res.json();
    // Kỳ vọng format: { count: number, data: [ { s,p,o }, ... ] }
    if (!payload?.data || !Array.isArray(payload.data)) {
      console.warn('⚠️ API payload không đúng định dạng mong đợi');
      return [];
    }

    const atms = convertTriplesToATMs(payload.data);
    // console.log(`✅ Parsed ${atms.length} ATMs từ ${payload.count} triples`);

    if (atms.length) {
      console.table(
        atms.slice(0, 5).map(a => ({
          ID: a.id,
          Brand: a.brand,
          Operator: a.operator,
          Lat: a.geometry.coordinates[1].toFixed(6),
          Lon: a.geometry.coordinates[0].toFixed(6),
        }))
      );
    }

    return atms;
  } catch (e) {
    console.error('❌ loadATMsFromAPI failed:', e);
    return [];
  }
};

// Chuyển list triples thành map theo subject rồi suy ra ATM
const convertTriplesToATMs = (triples: Array<{ s: string; p: string; o: string }>): ATMData[] => {
  const subjectMap = new Map<
    string,
    Record<string, string>
  >();

  // Gom properties theo subject
  for (const t of triples) {
    if (!subjectMap.has(t.s)) subjectMap.set(t.s, {});
    const obj = subjectMap.get(t.s)!;
    const predKey = extractPredicateKey(t.p);
    obj[predKey] = t.o;
  }

  const atms: ATMData[] = [];

  for (const [subject, props] of subjectMap.entries()) {
    // Chỉ chọn node có amenity=atm và không phải node geometry
    if (props.amenity === 'atm' && !subject.includes('/geometry')) {
      const geomUri = props.hasGeometry || props.hasgeometry || props.geo1_hasGeometry;
      if (!geomUri) continue;

      const geomProps = subjectMap.get(geomUri);
      if (!geomProps) continue;

      const wkt =
        geomProps.asWKT ||
        geomProps.aswkt ||
        geomProps['geo1:asWKT'] ||
        findFirstWKT(geomProps);

      if (!wkt) continue;

      const coords = parseWKT(wkt);
      if (coords[0] === 0 && coords[1] === 0) continue;

      atms.push({
        id: subject.split('/').pop() || subject,
        brand: props.brand || 'Unknown',
        operator: props.operator || props.brand || 'Unknown',
        wikidataId:
          props['brand:wikidata'] ||
          props['operator:wikidata'] ||
          props.wikidata ||
          '',
        geometry: {
          type: 'Point',
            // WKT POINT(lon lat)
          coordinates: coords,
        },
      });
    }
  }

  return atms;
};

// Tạo thống kê theo brand từ danh sách ATM
export const buildATMStatistics = (atms: ATMData[]): Record<string, number> => {
  const stats: Record<string, number> = {};
  atms.forEach(a => {
    const key = a.brand || 'Unknown';
    stats[key] = (stats[key] || 0) + 1;
  });
  return stats;
};

// Hỗ trợ: trích key predicate gọn
const extractPredicateKey = (p: string): string => {
  if (!p) return p;
  const hashSplit = p.split('#');
  const lastHash = hashSplit.length > 1 ? hashSplit.pop()! : p;
  const slashSplit = lastHash.split('/');
  return slashSplit.pop()!;
};

// Parse WKT điểm
const parseWKT = (wktRaw: string): [number, number] => {
  if (!wktRaw) return [0, 0];
  const wkt = wktRaw.split('^^')[0].replace(/"/g, '');
  const m = wkt.match(/POINT\s*\(\s*([+-]?\d+(\.\d+)?)\s+([+-]?\d+(\.\d+)?)\s*\)/i);
  if (!m) {
    console.warn('⚠️ Cannot parse WKT:', wktRaw);
    return [0, 0];
  }
  const lon = parseFloat(m[1]);
  const lat = parseFloat(m[3]);
  return [lon, lat];
};

// Tìm WKT property bất kỳ
const findFirstWKT = (geomProps: Record<string, string>): string | undefined => {
  const entry = Object.entries(geomProps).find(
    ([k]) => k.toLowerCase().includes('wkt')
  );
  return entry?.[1];
};

// Hàm tổng hợp: lấy luôn ATMs + stats
export const loadATMsWithStats = async (endpoint?: string) => {
  const atms = await loadATMsFromAPI(endpoint);
  const stats = buildATMStatistics(atms);
  return { atms, stats };
};