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

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import vi from './locales/vi.json';
import en from './locales/en.json';
import zhTW from './locales/zh-TW.json';

i18n
    .use(LanguageDetector) // Tự động detect ngôn ngữ
    .use(initReactI18next) // Khởi tạo React bindings
    .init({
        resources: {
            vi: { translation: vi },
            en: { translation: en },
            'zh-TW': { translation: zhTW }
        },
        fallbackLng: 'vi', // Fallback nếu không tìm thấy translation
        interpolation: {
            escapeValue: false // React đã escape XSS
        },
        detection: {
            order: ['localStorage', 'navigator'], // Ưu tiên localStorage > browser setting
            caches: ['localStorage'],
            lookupLocalStorage: 'i18nextLng' // Key trong localStorage
        }
    });
export default i18n;