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

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartLine,
  faLeaf,
  faMapMarkerAlt,
  faFileAlt,
} from '@fortawesome/free-solid-svg-icons';
import './Admin.css';

export const AdminSidebar: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();

  const menuItems = [
    {
      path: '/admin',
      label: t('admin.sidebar.dashboard'),
      icon: faChartLine,
    },
    {
      path: '/admin/environment',
      label: t('admin.sidebar.environment'),
      icon: faLeaf,
    },
    {
      path: '/admin/pois',
      label: t('admin.sidebar.pois'),
      icon: faMapMarkerAlt,
    },
    {
      path: '/admin/reports',
      label: t('admin.sidebar.reports'),
      icon: faFileAlt,
    },
  ];

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar__header">
        <h2 className="admin-sidebar__title">{t('admin.sidebar.title')}</h2>
      </div>
      <nav className="admin-sidebar__nav">
        <ul className="admin-sidebar__menu">
          {menuItems.map((item) => (
            <li key={item.path} className="admin-sidebar__menu-item">
              <Link
                to={item.path}
                className={`admin-sidebar__link ${
                  location.pathname === item.path ? 'admin-sidebar__link--active' : ''
                }`}
              >
                <FontAwesomeIcon icon={item.icon} className="admin-sidebar__icon" />
                <span className="admin-sidebar__label">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};
