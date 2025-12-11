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

import { API_BASE_URL } from '../config/api';

export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string | null;
  role: 'admin' | 'user';
  isActive: boolean;
  createdAt: string;
}

/**
 * Kiểm tra xem user đã đăng nhập chưa
 * @returns Promise<User | null> - User info nếu đã đăng nhập, null nếu chưa
 */
export const checkAuth = async (): Promise<User | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      method: 'GET',
      credentials: 'include', // Important: Gửi cookie session
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.user;
    }

    return null;
  } catch (error) {
    console.error('Error checking auth:', error);
    return null;
  }
};

/**
 * Kiểm tra auth và redirect đến trang login nếu chưa đăng nhập
 * @param onSuccess - Callback khi đã đăng nhập
 * @param onError - Callback khi chưa đăng nhập (optional)
 */
export const requireAuth = async (
  onSuccess: (user: User) => void,
  onError?: () => void
): Promise<void> => {
  const user = await checkAuth();
  
  if (user) {
    onSuccess(user);
  } else {
    if (onError) {
      onError();
    } else {
      // Default: redirect to login page
      window.location.href = '/login';
    }
  }
};

/**
 * Logout user
 */
export const logout = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Error logging out:', error);
    return false;
  }
};
