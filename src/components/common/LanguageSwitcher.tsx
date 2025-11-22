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
import { useTranslation } from 'react-i18next';
import '../../styles/LanguageSwitcher.css';

export const LanguageSwitcher: React.FC = () => {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="language-switcher">
      <button 
        className={`language-switcher__button ${i18n.language === 'vi' ? 'language-switcher__button--active' : ''}`}
        onClick={() => changeLanguage('vi')}
      >
        🇻🇳 {t('common.language.vi')}
      </button>
      <button 
        className={`language-switcher__button ${i18n.language === 'en' ? 'language-switcher__button--active' : ''}`}
        onClick={() => changeLanguage('en')}
      >
        🇬🇧 {t('common.language.en')}
      </button>
    </div>
  );
};