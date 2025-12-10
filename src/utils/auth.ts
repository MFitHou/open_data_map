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

import { API_CONFIG } from '../config/api';

const USER_KEY = 'opendatafithou_user';

export interface User {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  role: 'admin' | 'moderator' | 'user';
  isActive: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  fullName?: string;
}

/**
 * Đăng nhập và lưu thông tin user
 */
export const login = async (credentials: LoginCredentials): Promise<User> => {
  const response = await fetch(`${API_CONFIG.baseUrl}/users/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Quan trọng: gửi và nhận cookies
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Đăng nhập thất bại');
  }

  const data = await response.json();
  const user = data.user;
  
  // Lưu thông tin user vào localStorage
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  
  return user;
};

/**
 * Đăng ký tài khoản mới
 */
export const register = async (userData: RegisterData): Promise<User> => {
  const response = await fetch(`${API_CONFIG.baseUrl}/users/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Đăng ký thất bại');
  }

  const data = await response.json();
  return data.user;
};

/**
 * Đăng xuất
 */
export const logout = async (): Promise<void> => {
  try {
    await fetch(`${API_CONFIG.baseUrl}/users/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    localStorage.removeItem(USER_KEY);
  }
};

/**
 * Lấy thông tin user hiện tại từ localStorage
 */
export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

/**
 * Kiểm tra user đã đăng nhập chưa
 */
export const isAuthenticated = (): boolean => {
  return getCurrentUser() !== null;
};

/**
 * Kiểm tra user có quyền admin không
 */
export const isAdmin = (): boolean => {
  const user = getCurrentUser();
  return user?.role === 'admin';
};

/**
 * Lấy thông tin profile từ server
 */
export const getProfile = async (): Promise<User> => {
  const response = await fetch(`${API_CONFIG.baseUrl}/users/profile`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Không thể lấy thông tin profile');
  }

  const data = await response.json();
  const user = data.user;
  
  // Cập nhật localStorage
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  
  return user;
};

