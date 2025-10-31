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

import { useCallback } from 'react';
import { driver } from 'driver.js';
import type { Driver } from 'driver.js';
import { homeTour, queryTour, driverConfig } from '../tours/tourConfig';
import 'driver.js/dist/driver.css';

export type TourType = 'home' | 'query';

// Global cleanup function
const globalTourCleanup = () => {
  const overlay = document.querySelector('.driver-overlay');
  const popover = document.querySelector('.driver-popover');
  const stage = document.querySelector('.driver-stage');
  
  if (overlay) overlay.remove();
  if (popover) popover.remove();
  if (stage) stage.remove();
  
  document.querySelectorAll('.driver-highlighted-element').forEach(el => {
    el.classList.remove('driver-highlighted-element');
    const htmlEl = el as HTMLElement;
    htmlEl.style.pointerEvents = '';
    htmlEl.style.transform = '';
    htmlEl.style.boxShadow = '';
    htmlEl.style.border = '';
    htmlEl.style.zIndex = '';
  });
  
  // Khôi phục pointer events
  document.body.style.pointerEvents = '';
  document.documentElement.style.pointerEvents = '';
  
  // Xóa tất cả driver classes
  document.querySelectorAll('[class*="driver-"]').forEach(el => {
    const classList = Array.from(el.classList);
    classList.forEach(cls => {
      if (cls.startsWith('driver-')) {
        el.classList.remove(cls);
      }
    });
  });
  
  console.log('🧹 Tour cleanup completed');
};

// Expose global cleanup function
(window as any).__globalTourCleanup = globalTourCleanup;

export const useTour = () => {
  const startTour = useCallback((tourType: TourType) => {
    let tourSteps;
    
    switch (tourType) {
      case 'home':
        tourSteps = homeTour;
        break;
      case 'query':
        tourSteps = queryTour;
        break;
      default:
        console.error('Invalid tour type:', tourType);
        return;
    }

    // Cleanup previous tour nếu có và khôi phục pointer events
    const cleanupPreviousTour = () => {
      const overlay = document.querySelector('.driver-overlay');
      const popover = document.querySelector('.driver-popover');
      const stage = document.querySelector('.driver-stage');
      
      if (overlay) overlay.remove();
      if (popover) popover.remove();
      if (stage) stage.remove();
      
      document.querySelectorAll('.driver-highlighted-element').forEach(el => {
        el.classList.remove('driver-highlighted-element');
        const htmlEl = el as HTMLElement;
        htmlEl.style.pointerEvents = '';
        htmlEl.style.transform = '';
        htmlEl.style.boxShadow = '';
        htmlEl.style.border = '';
        htmlEl.style.zIndex = '';
      });
      
      // Khôi phục pointer events
      document.body.style.pointerEvents = '';
      document.documentElement.style.pointerEvents = '';
      
      // Xóa các class driver còn sót
      document.querySelectorAll('[class*="driver-"]').forEach(el => {
        const classList = Array.from(el.classList);
        classList.forEach(cls => {
          if (cls.startsWith('driver-')) {
            el.classList.remove(cls);
          }
        });
      });
    };

    cleanupPreviousTour();

    const driverInstance: Driver = driver({
      ...driverConfig,
      steps: tourSteps,
      onDestroyStarted: () => {
        console.log(`Tour guide ${tourType} đã kết thúc`);
        // Force cleanup
        setTimeout(() => {
          cleanupPreviousTour();
        }, 100);
      }
    });

    driverInstance.drive();

    // Return cleanup function
    return () => {
      driverInstance.destroy();
      cleanupPreviousTour();
    };
  }, []);

  const startWelcomeTour = useCallback(() => {
    // Tour chào mừng cho người dùng lần đầu
    const welcomeDriver = driver({
      ...driverConfig,
      steps: [
        {
          popover: {
            title: '🎉 Chào mừng đến với Open Data Map!',
            description: `
              <div>
                <p>Đây là ứng dụng khám phá dữ liệu địa lý mở.</p>
                <p><strong>Bạn có thể:</strong></p>
                <ul>
                  <li>🔍 Tìm kiếm địa điểm từ Wikidata</li>
                  <li>🗺️ Xem bản đồ tương tác</li>
                  <li>📊 Tạo truy vấn SPARQL</li>
                  <li>📍 Khám phá dịch vụ lân cận</li>
                  <li>⬇️ Xuất dữ liệu</li>
                </ul>
                <p>Bạn có muốn tham gia tour hướng dẫn không?</p>
              </div>
            `,
            side: 'over',
            align: 'center'
          }
        }
      ]
    });

    welcomeDriver.drive();
  }, []);

  return {
    startTour,
    startWelcomeTour
  };
};
