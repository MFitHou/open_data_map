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

export interface ExternalLink {
  label: string;
  url: string;
  type: string;
}

export const resolveValueLink = (label: string, value: string): string | undefined => {
  // Raw URL
  if (/^https?:\/\//i.test(value)) return value;

  // Wikidata entity (Qxxx)
  if (/^Q\d+$/.test(value)) return `https://www.wikidata.org/wiki/${value}`;

  // Property id (Pxxx)
  if (/^P\d+$/.test(value)) return `https://www.wikidata.org/wiki/Property:${value}`;

  // VIAF
  if (/^\d{5,}$/.test(value) && /VIAF/i.test(label)) return `https://viaf.org/viaf/${value}`;

  // GND
  if (/GND/i.test(label)) return `https://d-nb.info/gnd/${value}`;

  // OSM IDs
  if (/OSM Relation ID/i.test(label)) return `https://www.openstreetmap.org/relation/${value}`;
  if (/OSM Node ID/i.test(label)) return `https://www.openstreetmap.org/node/${value}`;
  if (/OSM Way ID/i.test(label)) return `https://www.openstreetmap.org/way/${value}`;
  if (/Wikidata ID/i.test(label) && /^Q\d+$/.test(value)) return `https://www.wikidata.org/wiki/${value}`;

  // Phone / Email
  if (/@/.test(value) && !value.startsWith('mailto:')) return `mailto:${value}`;
  if (/^\+?\d[\d\s\-()]{5,}$/.test(value)) return `tel:${value}`;

  return undefined;
};

export const generateExternalLinks = (data: any): ExternalLink[] => {
  const links: ExternalLink[] = [];
  
  if (data.wikidataId) {
    links.push({ 
      label: 'Wikidata Entity', 
      url: `https://www.wikidata.org/wiki/${data.wikidataId}`, 
      type: 'wikidata' 
    });
  }
  
  if (data.coordinates) {
    links.push({
      label: 'Google Maps',
      url: `https://www.google.com/maps?q=${data.coordinates[1]},${data.coordinates[0]}`,
      type: 'map'
    });
    links.push({
      label: 'OpenStreetMap',
      url: `https://www.openstreetmap.org/?mlat=${data.coordinates[1]}&mlon=${data.coordinates[0]}&zoom=16`,
      type: 'map'
    });
  }
  
  if (data.osmId && data.osmType) {
    links.push({
      label: `OSM ${data.osmType} ${data.osmId}`,
      url: `https://www.openstreetmap.org/${data.osmType}/${data.osmId}`,
      type: 'osm'
    });
  }
  
  if (data.identifiers?.osmRelationId) {
    links.push({
      label: `OSM Relation ${data.identifiers.osmRelationId}`,
      url: `https://www.openstreetmap.org/relation/${data.identifiers.osmRelationId}`,
      type: 'osm'
    });
  }
  
  if (data.identifiers?.viafId) {
    links.push({
      label: `VIAF ${data.identifiers.viafId}`,
      url: `https://viaf.org/viaf/${data.identifiers.viafId}`,
      type: 'authority'
    });
  }
  
  if (data.identifiers?.gndId) {
    links.push({
      label: `GND ${data.identifiers.gndId}`,
      url: `https://d-nb.info/gnd/${data.identifiers.gndId}`,
      type: 'authority'
    });
  }
  
  if (data.statements?.website) {
    links.push({ label: 'Official Website', url: data.statements.website, type: 'website' });
  }
  
  if (data.statements?.phone) {
    links.push({ label: `Phone: ${data.statements.phone}`, url: `tel:${data.statements.phone}`, type: 'contact' });
  }
  
  if (data.statements?.email) {
    links.push({ label: `Email: ${data.statements.email}`, url: `mailto:${data.statements.email}`, type: 'contact' });
  }
  
  return links;
};