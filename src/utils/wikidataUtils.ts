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

export interface WikidataInfo {
  label?: string;
  description?: string;
  image?: string;
  claims?: Record<string, any>;
  allProperties?: { [key: string]: string };
  propertyUrls?: { [key: string]: string };
  propertyEntityIds?: { [key: string]: string };
}

export interface ReferenceInfo {
  property: string;
  propertyLabel: string;
  references: Array<{ [key: string]: string }>;
}

export const fetchLabels = async (ids: Set<string>): Promise<Record<string, string>> => {
  if (ids.size === 0) return {};
  const allIds = Array.from(ids).slice(0, 450);
  const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&props=labels&ids=${allIds.join('|')}&languages=en|vi&format=json&origin=*`;
  const res = await fetch(url);
  const json = await res.json();
  const out: Record<string, string> = {};
  if (json.entities) {
    Object.entries(json.entities).forEach(([id, entity]: any) => {
      out[id] = entity.labels?.en?.value || entity.labels?.vi?.value || id;
    });
  }
  return out;
};

export const fetchWikidataInfo = async (qid: string): Promise<{
  wikidataInfo: WikidataInfo | null;
  references: ReferenceInfo[];
}> => {
  try {
    const response = await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`);
    const json = await response.json();
    const entity = json.entities[qid];
    
    if (!entity) {
      return { wikidataInfo: null, references: [] };
    }

    const propertyIds = new Set<string>();
    const entityIds = new Set<string>();

    Object.entries(entity.claims || {}).forEach(([propId, claims]: [string, any]) => {
      propertyIds.add(propId);
      claims.forEach((c: any) => {
        const dv = c.mainsnak?.datavalue;
        if (dv?.type === 'wikibase-entityid') entityIds.add(dv.value.id);
        c.references?.forEach((r: any) => {
          Object.entries(r.snaks || {}).forEach(([refPropId, refSnaks]: [string, any]) => {
            propertyIds.add(refPropId);
            const refSnak = refSnaks[0];
            const rdv = refSnak?.datavalue;
            if (rdv?.type === 'wikibase-entityid') entityIds.add(rdv.value.id);
          });
        });
      });
    });

    const labels = await fetchLabels(new Set<string>([...propertyIds, ...entityIds, qid]));

    const info: WikidataInfo = {
      label: labels[qid] || qid,
      description: entity.descriptions?.en?.value || entity.descriptions?.vi?.value,
      claims: entity.claims,
      allProperties: {},
      propertyUrls: {},
      propertyEntityIds: {}
    };

    if (entity.claims?.P18) {
      const imageFile = entity.claims.P18[0].mainsnak.datavalue.value;
      info.image = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(imageFile)}?width=300`;
    }

    Object.entries(entity.claims || {}).forEach(([propId, claims]: [string, any]) => {
      const claim = claims[0];
      const dv = claim.mainsnak?.datavalue;
      if (!dv) return;
      
      let value = '';
      let isUrl = false;
      
      switch (dv.type) {
        case 'string':
          if (typeof dv.value === 'string') {
            if (dv.value.startsWith('http')) {
              isUrl = true;
              value = dv.value;
            } else {
              value = dv.value;
            }
          }
          break;
        case 'time':
          value = dv.value.time.substring(1, 11);
          break;
        case 'quantity':
          value = dv.value.amount;
          break;
        case 'wikibase-entityid':
          value = labels[dv.value.id] || dv.value.id;
          info.propertyEntityIds![labels[propId] || propId] = dv.value.id;
          break;
        case 'globecoordinate':
          value = `${dv.value.latitude.toFixed(6)}, ${dv.value.longitude.toFixed(6)}`;
          break;
      }
      
      if (propId !== 'P18' && value) {
        const propLabel = labels[propId] || propId;
        if (!info.allProperties![propLabel]) {
          info.allProperties![propLabel] = value;
          if (isUrl) info.propertyUrls![propLabel] = dv.value;
        }
      }
    });

    // References
    const refs: ReferenceInfo[] = [];
    Object.entries(entity.claims || {}).forEach(([propId, claims]: [string, any]) => {
      const claim = claims[0];
      if (claim.references && claim.references.length > 0) {
        const refData: Array<{ [key: string]: string }> = [];
        claim.references.forEach((ref: any) => {
          const refObj: { [key: string]: string } = {};
          Object.entries(ref.snaks || {}).forEach(([refPropId, refSnaks]: [string, any]) => {
            const refSnak = refSnaks[0];
            const rdv = refSnak?.datavalue;
            if (!rdv) return;
            
            let refValue = '';
            if (rdv.type === 'string') refValue = rdv.value;
            else if (rdv.type === 'time') refValue = rdv.value.time.substring(1, 11);
            else if (rdv.type === 'wikibase-entityid') refValue = labels[rdv.value.id] || rdv.value.id;
            
            if (refValue) {
              const refLabel = labels[refPropId] || refPropId;
              refObj[refLabel] = refValue;
            }
          });
          if (Object.keys(refObj).length > 0) refData.push(refObj);
        });
        
        if (refData.length > 0) {
          refs.push({
            property: propId,
            propertyLabel: labels[propId] || propId,
            references: refData
          });
        }
      }
    });

    return { wikidataInfo: info, references: refs };
  } catch (e) {
    console.error('Error fetching Wikidata:', e);
    return { wikidataInfo: null, references: [] };
  }
};