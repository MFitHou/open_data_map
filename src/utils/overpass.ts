// Build & fetch Overpass data and convert to GeoJSON outline
export interface OverpassGeoJSON {
  type: string;
  features: any[];
}

const ADMIN_REL_QUERY = (qid: string) => `[out:json][timeout:25];
relation
  ["wikidata"="${qid}"]
  ["type"="boundary"]
  ["boundary"="administrative"];
out geom;`;

const GENERIC_REL_QUERY = (qid: string) => `[out:json][timeout:25];
relation["wikidata"="${qid}"];
out geom;`;

const WAY_FALLBACK_QUERY = (qid: string) => `[out:json][timeout:25];
way["wikidata"="${qid}"];
out geom;`;

export async function fetchOverpassRaw(qid: string): Promise<any | null> {
  const queries = [
    ADMIN_REL_QUERY(qid),
    GENERIC_REL_QUERY(qid),
    WAY_FALLBACK_QUERY(qid)
  ];
  for (const q of queries) {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: q
    });
    if (!res.ok) continue;
    const json = await res.json();
    if (json?.elements?.length) return json;
  }
  return null;
}

// Attempt to stitch closed ways into Polygon rings
function buildPolygonsFromMembers(members: any[]): number[][][] {
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
}

function waysToMultiLine(elements: any[]): number[][][] {
  return elements
    .filter(e => e.type === 'way' && e.geometry)
    .map(w => w.geometry.map((pt: any) => [pt.lon, pt.lat]));
}

export function overpassToGeoJSON(raw: any, qid: string): OverpassGeoJSON | null {
  if (!raw?.elements?.length) return null;

  // Prefer relation boundary
  const rel = raw.elements.find((e: any) => e.type === 'relation');
  if (rel && rel.members) {
    // Attach geometry of member ways (if Overpass already expanded)
    const memberWays = rel.members
      .map((m: any) => {
        if (m.geometry) return m;
        // Sometimes geometry is stored in top-level elements; map by id
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

    // Fallback: MultiLineString outline
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

  // No relation or no rings -> try ways directly
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

export async function fetchOverpassOutline(qid: string): Promise<OverpassGeoJSON | null> {
  if (!/^Q\d+$/.test(qid)) return null;
  const raw = await fetchOverpassRaw(qid);
  if (!raw) return null;
  return overpassToGeoJSON(raw, qid);
}

export async function fetchOutlineByOSMRelationId(osmRelationId: number): Promise<OutlineResult> {
  if (!osmRelationId) return { geojson: null, source: 'invalid-id' };

  // ONE QUERY ONLY:
  const query = `[out:json][timeout:50];
relation(${osmRelationId});
out body;
>;
out geom qt;`;

  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query
    });
    if (!res.ok) return { geojson: null, source: 'http-error' };
    const raw = await res.json();
    if (!raw?.elements?.length) return { geojson: null, source: 'empty-elements' };

    // Reuse rawToOutline to parse
    const outline = rawToOutline(raw);
    if (outline.geojson) {
      outline.relationId = osmRelationId;
      outline.source = 'single-query';
      return outline;
    }
    return { geojson: null, source: 'no-geometry' };
  } catch {
    return { geojson: null, source: 'exception' };
  }
}