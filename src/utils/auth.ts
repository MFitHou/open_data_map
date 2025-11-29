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

const AUTH_TOKEN_KEY = 'admin-auth-token';
const AUTH_TOKEN_VALUE = 'admin-authenticated';

/**
 * Xác thực người dùng và lưu token vào localStorage
 */
export const login = (): void => {
  localStorage.setItem(AUTH_TOKEN_KEY, AUTH_TOKEN_VALUE);
};

/**
 * Đăng xuất người dùng và xóa token khỏi localStorage
 */
export const logout = (): void => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
};

/**
 * Kiểm tra trạng thái xác thực của người dùng
 * @returns true nếu người dùng đã đăng nhập, false nếu chưa
 */
export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  return token === AUTH_TOKEN_VALUE;
};

/**
 * Lấy token từ localStorage
 * @returns Token nếu tồn tại, null nếu không
 */
export const getToken = (): string | null => {
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

/**
 * Lưu token vào localStorage
 * @param token - Token cần lưu
 */
export const setToken = (token: string): void => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
};
