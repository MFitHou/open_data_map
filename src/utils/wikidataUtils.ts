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
  const url = getApiEndpoint.wikidataLabels(allIds);
  
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error('Error fetching labels:', res.statusText);
      return {};
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching labels:', error);
    return {};
  }
};

export const fetchWikidataInfo = async (qid: string): Promise<{
  wikidataInfo: WikidataInfo | null;
  references: ReferenceInfo[];
}> => {
  try {
    const url = getApiEndpoint.wikidataInfo(qid);
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('Error fetching Wikidata info:', response.statusText);
      return { wikidataInfo: null, references: [] };
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching Wikidata info:', error);
    return { wikidataInfo: null, references: [] };
  }
};