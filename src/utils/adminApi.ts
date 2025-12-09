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
