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

import React, { useState } from 'react';
import { useTour } from '../hooks';
import type { TourType } from '../hooks';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faQuestion } from '@fortawesome/free-solid-svg-icons';

interface HelpButtonProps {
  tourType: TourType;
  className?: string;
  style?: React.CSSProperties;
}

export const HelpButton: React.FC<HelpButtonProps> = ({ 
  tourType, 
  className = '',
  style = {}
}) => {
  const { startTour } = useTour();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    
    // Force cleanup any existing tours và khôi phục pointer events
    const cleanupExistingTour = () => {
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
      });
      
      // Khôi phục pointer events cho toàn bộ trang
      document.body.style.pointerEvents = '';
      document.documentElement.style.pointerEvents = '';
    };

    try {
      cleanupExistingTour();
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for UX
      const cleanup = startTour(tourType);
      
      // Store cleanup function in case needed
      if (cleanup && typeof cleanup === 'function') {
        (window as any).__tourCleanup = cleanup;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getTourTitle = (type: TourType): string => {
    switch (type) {
      case 'home': return 'Hướng dẫn trang chủ';
      case 'query': return 'Hướng dẫn truy vấn SPARQL';
      default: return 'Hướng dẫn';
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`help-button ${className}`}
      title={getTourTitle(tourType)}
      style={{
        background: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        cursor: 'pointer',
        fontSize: '18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(0,123,255,0.3)',
        transition: 'all 0.2s ease',
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 1000,
        ...style
      }}
      onMouseEnter={(e) => {
        const target = e.target as HTMLButtonElement;
        target.style.transform = 'scale(1.1)';
        target.style.boxShadow = '0 4px 12px rgba(0,123,255,0.4)';
      }}
      onMouseLeave={(e) => {
        const target = e.target as HTMLButtonElement;
        target.style.transform = 'scale(1)';
        target.style.boxShadow = '0 2px 8px rgba(0,123,255,0.3)';
      }}
    >
      {isLoading ? (
        <FontAwesomeIcon icon={faSpinner} spin />
      ) : (
        <FontAwesomeIcon icon={faQuestion} />
      )}
    </button>
  );
};

export default HelpButton;