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

export interface SearchResult {
  id: string;
  name: string;
  type: string;
  lat: number;
  lon: number;
  displayName: string;
  source: 'wikidata';
  wikidataId: string;
  description?: string;
  image?: string;
  instanceOf?: string;
  identifiers?: {
    osmRelationId?: string;
    osmNodeId?: string;
    osmWayId?: string;
    viafId?: string;
    gndId?: string;
  };
  statements?: {
    inception?: string;
    population?: string;
    area?: string;
    website?: string;
    phone?: string;
    email?: string;
    address?: string;
    postalCode?: string;
  };
  osmId?: number;
  osmType?: string;
}

export interface LocationState {
  searchResult?: SearchResult;
}

export interface WardMembers {
  innerWays: any[];
  outerWays: any[];
  nodes: any[];
  subAreas: any[];
}

export interface WardStats {
  calculatedArea: number;
  population: number | null;
  officialArea: number | null;
  density: number | null;
}

export interface SelectedInfo {
  category: string;
  title: string;
  subtitle?: string;
  rows: { label: string; value: string }[];
  wikidataId?: string;
  coordinates?: [number, number];
  identifiers?: any;
  statements?: any;
  osmId?: string;
  osmType?: string;
  members?: any;
}

export interface MemberOutline {
  coordinates: number[][];
  name: string;
  type: string;
}

export interface Location {
  lat: number;
  lon: number;
}

export interface SearchMarker extends Location {
  name: string;
}
