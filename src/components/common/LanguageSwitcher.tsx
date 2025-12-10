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
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe, faChevronDown, faCheck } from '@fortawesome/free-solid-svg-icons';
import '../../styles/LanguageSwitcher.css';

interface LanguageSwitcherProps {
  inline?: boolean;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ inline = false }) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('i18nextLng', lng);
    setIsOpen(false);
  };

  // Get current language (handle both 'en' and 'zh-TW' formats)
  const currentLang = i18n.language;

  const languages = [
    { code: 'vi', name: 'Tiếng Việt', shortName: 'VI' },
    { code: 'en', name: 'English', shortName: 'EN' },
    { code: 'zh-TW', name: '繁體中文', shortName: '繁中' }
  ];

  const currentLanguage = languages.find(lang => lang.code === currentLang) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={inline ? "language-switcher language-switcher--inline" : "language-switcher"} ref={dropdownRef}>
      <button 
        className="language-switcher__trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Change language"
      >
        <FontAwesomeIcon icon={faGlobe} className="language-switcher__icon" />
        <span className="language-switcher__current">{currentLanguage.shortName}</span>
        <FontAwesomeIcon icon={faChevronDown} className="language-switcher__arrow" />
      </button>

      {isOpen && (
        <div className="language-switcher__dropdown">
          {languages.map((lang) => (
            <button
              key={lang.code}
              className={`language-switcher__option ${currentLang === lang.code ? 'language-switcher__option--active' : ''}`}
              onClick={() => changeLanguage(lang.code)}
            >
              <span className="language-switcher__option-name">{lang.name}</span>
              {currentLang === lang.code && (
                <FontAwesomeIcon icon={faCheck} className="language-switcher__check" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};