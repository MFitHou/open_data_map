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

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faSignOutAlt, faChevronDown, faUserShield } from '@fortawesome/free-solid-svg-icons';
import { getCurrentUser, logout, isAdmin } from '../../utils/auth';
import '../../styles/components/UserMenu.css';

export const UserMenu: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const user = getCurrentUser();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    if (confirm(t('auth.confirmLogout') || 'Bạn có chắc muốn đăng xuất?')) {
      await logout();
      setIsOpen(false);
      navigate('/login');
    }
  };

  const handleAdminPanel = () => {
    setIsOpen(false);
    navigate('/admin');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  if (!user) {
    return (
      <button className="user-menu__login-button" onClick={handleLogin}>
        <FontAwesomeIcon icon={faUser} />
        <span>{t('auth.login') || 'Đăng nhập'}</span>
      </button>
    );
  }

  return (
    <div className="user-menu" ref={dropdownRef}>
      <button 
        className="user-menu__trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User menu"
      >
        <FontAwesomeIcon icon={faUser} className="user-menu__icon" />
        <span className="user-menu__username">{user.username}</span>
        <FontAwesomeIcon icon={faChevronDown} className="user-menu__arrow" />
      </button>

      {isOpen && (
        <div className="user-menu__dropdown">
          <div className="user-menu__header">
            <div className="user-menu__user-info">
              <div className="user-menu__name">{user.fullName || user.username}</div>
              <div className="user-menu__email">{user.email}</div>
              <div className="user-menu__role">
                {user.role === 'admin' && '👑 Admin'}
                {user.role === 'moderator' && '⭐ Moderator'}
                {user.role === 'user' && '👤 User'}
              </div>
            </div>
          </div>

          <div className="user-menu__divider" />

          <div className="user-menu__actions">
            {isAdmin() && (
              <button
                className="user-menu__action"
                onClick={handleAdminPanel}
              >
                <FontAwesomeIcon icon={faUserShield} className="user-menu__action-icon" />
                <span>{t('auth.adminPanel') || 'Quản trị'}</span>
              </button>
            )}
            
            <button
              className="user-menu__action user-menu__action--logout"
              onClick={handleLogout}
            >
              <FontAwesomeIcon icon={faSignOutAlt} className="user-menu__action-icon" />
              <span>{t('auth.logout') || 'Đăng xuất'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
