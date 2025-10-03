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

interface ExportData {
  title: string;
  subtitle?: string;
  category: string;
  coordinates?: [number, number];
  wikidataId?: string;
  osmId?: string;
  osmType?: string;
  identifiers?: Record<string, string | undefined>;
  statements?: Record<string, string | undefined>;
  rows: Array<{ label: string; value: string }>;
  members?: {
    total: number;
    outerWays: number;
    innerWays: number;
    nodes: number;
    subAreas: number;
    details: Array<{
      type: string;
      ref: number;
      role?: string;
      tags?: Record<string, string>;
    }>;
  };
  memberNames?: Record<number, string>;
  wikidataProperties?: Record<string, string>;
  rowPropLabels?: Record<string, string>;
}

// Helper function để escape XML
export const escapeXml = (unsafe: string): string => {
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

// Generate XML
export const generateXML = (data: ExportData): string => {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += `<entity>\n`;
  xml += `  <title>${escapeXml(data.title)}</title>\n`;
  
  if (data.subtitle) {
    xml += `  <subtitle>${escapeXml(data.subtitle)}</subtitle>\n`;
  }
  
  xml += `  <category>${escapeXml(data.category)}</category>\n`;
  
  // Coordinates
  if (data.coordinates) {
    xml += `  <coordinates>\n`;
    xml += `    <latitude>${data.coordinates[1]}</latitude>\n`;
    xml += `    <longitude>${data.coordinates[0]}</longitude>\n`;
    xml += `  </coordinates>\n`;
  }
  
  // Identifiers
  if (data.wikidataId || data.osmId || data.identifiers) {
    xml += `  <identifiers>\n`;
    if (data.wikidataId) xml += `    <wikidataId>${escapeXml(data.wikidataId)}</wikidataId>\n`;
    if (data.osmId) xml += `    <osmId>${escapeXml(data.osmId)}</osmId>\n`;
    if (data.osmType) xml += `    <osmType>${escapeXml(data.osmType)}</osmType>\n`;
    
    if (data.identifiers) {
      Object.entries(data.identifiers).forEach(([key, value]) => {
        if (value) xml += `    <${key}>${escapeXml(value)}</${key}>\n`;
      });
    }
    xml += `  </identifiers>\n`;
  }
  
  // Basic properties
  if (data.rows.length > 0) {
    xml += `  <properties>\n`;
    data.rows.forEach(row => {
      const label = data.rowPropLabels?.[row.label] || row.label;
      xml += `    <property>\n`;
      xml += `      <label>${escapeXml(label)}</label>\n`;
      xml += `      <value>${escapeXml(row.value)}</value>\n`;
      xml += `    </property>\n`;
    });
    xml += `  </properties>\n`;
  }
  
  // Statements
  if (data.statements || data.wikidataProperties) {
    xml += `  <statements>\n`;
    
    if (data.statements) {
      Object.entries(data.statements).forEach(([key, value]) => {
        if (value) xml += `    <${key}>${escapeXml(value)}</${key}>\n`;
      });
    }
    
    if (data.wikidataProperties) {
      Object.entries(data.wikidataProperties).forEach(([key, value]) => {
        const safeKey = key.replace(/[^a-zA-Z0-9]/g, '_');
        xml += `    <${safeKey}>${escapeXml(value)}</${safeKey}>\n`;
      });
    }
    
    xml += `  </statements>\n`;
  }
  
  // Members
  if (data.members) {
    xml += `  <members>\n`;
    xml += `    <total>${data.members.total}</total>\n`;
    xml += `    <outerWays>${data.members.outerWays}</outerWays>\n`;
    xml += `    <innerWays>${data.members.innerWays}</innerWays>\n`;
    xml += `    <nodes>${data.members.nodes}</nodes>\n`;
    xml += `    <subAreas>${data.members.subAreas}</subAreas>\n`;
    
    if (data.members.details.length > 0) {
      xml += `    <details>\n`;
      data.members.details.forEach(member => {
        xml += `      <member>\n`;
        xml += `        <type>${escapeXml(member.type)}</type>\n`;
        xml += `        <ref>${member.ref}</ref>\n`;
        if (member.role) xml += `        <role>${escapeXml(member.role)}</role>\n`;
        if (data.memberNames?.[member.ref]) {
          xml += `        <name>${escapeXml(data.memberNames[member.ref])}</name>\n`;
        }
        if (member.tags) {
          xml += `        <tags>\n`;
          Object.entries(member.tags).forEach(([k, v]) => {
            const safeKey = k.replace(/[^a-zA-Z0-9]/g, '_');
            xml += `          <${safeKey}>${escapeXml(v)}</${safeKey}>\n`;
          });
          xml += `        </tags>\n`;
        }
        xml += `      </member>\n`;
      });
      xml += `    </details>\n`;
    }
    
    xml += `  </members>\n`;
  }
  
  xml += `</entity>`;
  return xml;
};

// Generate RDF/XML
export const generateRDF = (data: ExportData): string => {
  const baseUri = 'http://opendatafithou.org/entity/';
  const entityId = data.wikidataId || `entity_${Date.now()}`;
  const entityUri = `${baseUri}${entityId}`;
  
  let rdf = '<?xml version="1.0" encoding="UTF-8"?>\n';
  rdf += '<rdf:RDF\n';
  rdf += '  xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"\n';
  rdf += '  xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#"\n';
  rdf += '  xmlns:owl="http://www.w3.org/2002/07/owl#"\n';
  rdf += '  xmlns:ex="http://opendatafithou.org/ontology#"\n';
  rdf += '  xmlns:geo="http://www.w3.org/2003/01/geo/wgs84_pos#"\n';
  rdf += '  xmlns:dcterms="http://purl.org/dc/terms/"\n';
  rdf += '  xmlns:foaf="http://xmlns.com/foaf/0.1/">\n\n';
  
  rdf += `  <rdf:Description rdf:about="${entityUri}">\n`;
  rdf += `    <rdf:type rdf:resource="http://opendatafithou.org/ontology#Entity"/>\n`;
  rdf += `    <rdfs:label xml:lang="vi">${escapeXml(data.title)}</rdfs:label>\n`;
  
  if (data.subtitle) {
    rdf += `    <dcterms:description xml:lang="vi">${escapeXml(data.subtitle)}</dcterms:description>\n`;
  }
  
  rdf += `    <ex:category>${escapeXml(data.category)}</ex:category>\n`;
  
  // Coordinates
  if (data.coordinates) {
    rdf += `    <geo:lat rdf:datatype="http://www.w3.org/2001/XMLSchema#decimal">${data.coordinates[1]}</geo:lat>\n`;
    rdf += `    <geo:long rdf:datatype="http://www.w3.org/2001/XMLSchema#decimal">${data.coordinates[0]}</geo:long>\n`;
  }
  
  // Identifiers
  if (data.wikidataId) {
    rdf += `    <ex:wikidataId>${escapeXml(data.wikidataId)}</ex:wikidataId>\n`;
    rdf += `    <owl:sameAs rdf:resource="http://www.wikidata.org/entity/${escapeXml(data.wikidataId)}"/>\n`;
  }
  
  if (data.osmId && data.osmType) {
    rdf += `    <ex:osmId>${escapeXml(data.osmId)}</ex:osmId>\n`;
    rdf += `    <ex:osmType>${escapeXml(data.osmType)}</ex:osmType>\n`;
    rdf += `    <owl:sameAs rdf:resource="https://www.openstreetmap.org/${escapeXml(data.osmType)}/${escapeXml(data.osmId)}"/>\n`;
  }
  
  if (data.identifiers) {
    Object.entries(data.identifiers).forEach(([key, value]) => {
      if (value) {
        rdf += `    <ex:${key}>${escapeXml(value)}</ex:${key}>\n`;
      }
    });
  }
  
  // Properties from rows
  data.rows.forEach(row => {
    const label = (data.rowPropLabels?.[row.label] || row.label).replace(/[^a-zA-Z0-9]/g, '_');
    rdf += `    <ex:${label}>${escapeXml(row.value)}</ex:${label}>\n`;
  });
  
  // Statements
  if (data.statements) {
    Object.entries(data.statements).forEach(([key, value]) => {
      if (value) {
        rdf += `    <ex:${key}>${escapeXml(value)}</ex:${key}>\n`;
      }
    });
  }
  
  if (data.wikidataProperties) {
    Object.entries(data.wikidataProperties).forEach(([key, value]) => {
      const safeKey = key.replace(/[^a-zA-Z0-9]/g, '_');
      rdf += `    <ex:${safeKey}>${escapeXml(value)}</ex:${safeKey}>\n`;
    });
  }
  
  // Members
  if (data.members) {
    rdf += `    <ex:totalMembers rdf:datatype="http://www.w3.org/2001/XMLSchema#integer">${data.members.total}</ex:totalMembers>\n`;
    rdf += `    <ex:outerWays rdf:datatype="http://www.w3.org/2001/XMLSchema#integer">${data.members.outerWays}</ex:outerWays>\n`;
    rdf += `    <ex:innerWays rdf:datatype="http://www.w3.org/2001/XMLSchema#integer">${data.members.innerWays}</ex:innerWays>\n`;
    rdf += `    <ex:nodes rdf:datatype="http://www.w3.org/2001/XMLSchema#integer">${data.members.nodes}</ex:nodes>\n`;
    rdf += `    <ex:subAreas rdf:datatype="http://www.w3.org/2001/XMLSchema#integer">${data.members.subAreas}</ex:subAreas>\n`;
    
    data.members.details.forEach((member) => {
      const memberId = `${entityUri}/member/${member.type}/${member.ref}`;
      rdf += `    <ex:hasMember rdf:resource="${memberId}"/>\n`;
    });
  }
  
  rdf += `  </rdf:Description>\n\n`;
  
  // Member details as separate resources
  if (data.members?.details) {
    data.members.details.forEach(member => {
      const memberId = `${entityUri}/member/${member.type}/${member.ref}`;
      rdf += `  <rdf:Description rdf:about="${memberId}">\n`;
      rdf += `    <rdf:type rdf:resource="http://opendatafithou.org/ontology#OSMMember"/>\n`;
      rdf += `    <ex:memberType>${escapeXml(member.type)}</ex:memberType>\n`;
      rdf += `    <ex:memberRef rdf:datatype="http://www.w3.org/2001/XMLSchema#integer">${member.ref}</ex:memberRef>\n`;
      
      if (member.role) {
        rdf += `    <ex:memberRole>${escapeXml(member.role)}</ex:memberRole>\n`;
      }
      
      if (data.memberNames?.[member.ref]) {
        rdf += `    <rdfs:label xml:lang="vi">${escapeXml(data.memberNames[member.ref])}</rdfs:label>\n`;
      }
      
      if (member.tags) {
        Object.entries(member.tags).forEach(([k, v]) => {
          const safeKey = k.replace(/[^a-zA-Z0-9]/g, '_');
          rdf += `    <ex:tag_${safeKey}>${escapeXml(v)}</ex:tag_${safeKey}>\n`;
        });
      }
      
      rdf += `    <owl:sameAs rdf:resource="https://www.openstreetmap.org/${member.type}/${member.ref}"/>\n`;
      rdf += `  </rdf:Description>\n\n`;
    });
  }
  
  rdf += '</rdf:RDF>';
  return rdf;
};

// Download helper
export const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};