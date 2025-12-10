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

export interface DashboardStats {
  totalPois: number;
  graphCount: number;
  breakdown: Record<string, number>;
  topCategories: Array<{
    type: string;
    count: number;
  }>;
}

export interface CreatePoiData {
  name: string;
  type: string;
  lat: number;
  lon: number;
  address?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Fetch dashboard statistics
 */
export const fetchDashboardStats = async (): Promise<DashboardStats | null> => {
  try {
    const response = await fetch(getApiEndpoint.adminStats(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse<DashboardStats> = await response.json();
    
    if (result.success && result.data) {
      return result.data;
    }

    throw new Error(result.error || 'Failed to fetch stats');
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return null;
  }
};

/**
 * Create new POI
 */
export const createPoi = async (data: CreatePoiData): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch(getApiEndpoint.adminPois(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse<any> = await response.json();
    return result;
  } catch (error) {
    console.error('Error creating POI:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create POI',
    };
  }
};

/**
 * Delete POI by ID
 */
export const deletePoi = async (id: string): Promise<ApiResponse<any>> => {
  try {
    const encodedId = encodeURIComponent(id);
    const response = await fetch(getApiEndpoint.adminPoi(encodedId), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse<any> = await response.json();
    return result;
  } catch (error) {
    console.error('Error deleting POI:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete POI',
    };
  }
};

/**
 * Check admin API health
 */
export const checkAdminHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(getApiEndpoint.adminHealth(), {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      return false;
    }

    const result: ApiResponse<any> = await response.json();
    return result.success || false;
  } catch (error) {
    console.error('Error checking admin health:', error);
    return false;
  }
};

// ===== POI helpers & dynamic attributes =====

// Basic POI info for lightweight map display
export interface IPoiBasic {
  id: string;
  name: string;
  type: string;
  lat: number;
  lon: number;
  wkt?: string;
}

export interface PoiListResponse {
  success: boolean;
  data: IPoiBasic[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Fetch list of POIs with optional filters
 */
export const getPois = async (
  type: string = 'all',
  page: number = 1,
  limit: number = 10,
  lightweight: boolean = false,
): Promise<PoiListResponse | null> => {
  try {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    params.append('page', String(page));
    params.append('limit', String(limit));
    params.append('lightweight', lightweight ? 'true' : 'false');

    const url = `${getApiEndpoint.adminPois()}?${params.toString()}`;
    const response = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' }, credentials: 'include' });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result: PoiListResponse = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching POIs:', error);
    return null;
  }
};

/**
 * Fetch full details of a single POI by ID
 */
export const getPoiDetail = async (id: string): Promise<IPoiBasic | null> => {
  try {
    const encodedId = encodeURIComponent(id);
    const url = `${getApiEndpoint.adminPoi(encodedId)}`;
    const response = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' }, credentials: 'include' });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result: ApiResponse<IPoiBasic> = await response.json();

    if (result.success && result.data) return result.data;
    throw new Error(result.error || 'Failed to fetch POI detail');
  } catch (error) {
    console.error('Error fetching POI detail:', error);
    return null;
  }
};

/**
 * Fetch dynamic attributes for a POI
 */
export const getPoiAttributes = async (id: string) => {
  try {
    const encodedId = encodeURIComponent(id);
    const url = `${getApiEndpoint.adminPoi(encodedId)}/attributes`;
    const response = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' }, credentials: 'include' });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result: ApiResponse<{ id: string; count: number }> = await response.json();

    if (result.success && result.data) return result.data.count || 0;
    throw new Error(result.error || 'Failed to fetch POI attributes');
  } catch (error) {
    console.error('Error fetching POI attributes:', error);
    return null;
  }
};

