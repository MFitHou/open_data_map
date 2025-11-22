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

import type { DriveStep } from 'driver.js';

// Tour cho trang chủ
export const homeTour: DriveStep[] = [
  {
    element: '#app-title',
    popover: {
      title: '🗺️ Chào mừng đến với Open Data Map',
      description: 'Ứng dụng khám phá dữ liệu địa lý mở. Bạn có thể tìm kiếm địa điểm, xem bản đồ tương tác và truy vấn dữ liệu.',
      side: 'bottom',
      align: 'center'
    }
  },
  {
    element: '#search-input',
    popover: {
      title: '🔍 Tìm kiếm địa điểm',
      description: 'Nhập tên địa điểm bạn muốn tìm. Hệ thống sẽ tìm kiếm từ Wikidata và hiển thị kết quả.',
      side: 'bottom',
      align: 'start'
    }
  },
  {
    element: '#map-navigation',
    popover: {
      title: '🗺️ Chuyển đến bản đồ',
      description: 'Click vào đây để xem bản đồ tương tác với các tính năng nâng cao.',
      side: 'left',
      align: 'center'
    }
  },
  {
    element: '#query-navigation',
    popover: {
      title: '📊 Truy vấn SPARQL',
      description: 'Dành cho người dùng nâng cao - tạo và thực thi các truy vấn SPARQL trực tiếp.',
      side: 'right',
      align: 'center'
    }
  }
];

// Map tour đã bị loại bỏ - không sử dụng hướng dẫn cho trang bản đồ

// Tour cho trang truy vấn SPARQL
export const queryTour: DriveStep[] = [
  {
    element: '#sparql-editor',
    popover: {
      title: '📝 Trình soạn thảo SPARQL',
      description: 'Viết các truy vấn SPARQL để lấy dữ liệu từ Wikidata. Hỗ trợ syntax highlighting.',
      side: 'top',
      align: 'start'
    }
  },
  {
    element: '#query-examples',
    popover: {
      title: '📋 Ví dụ truy vấn',
      description: 'Chọn từ các ví dụ có sẵn để bắt đầu nhanh chóng.',
      side: 'bottom',
      align: 'center'
    }
  },
  {
    element: '#execute-query',
    popover: {
      title: '▶️ Thực thi truy vấn',
      description: 'Click để chạy truy vấn SPARQL và xem kết quả.',
      side: 'left',
      align: 'center'
    }
  },
  {
    element: '#results-table',
    popover: {
      title: '📊 Kết quả truy vấn',
      description: 'Kết quả sẽ hiển thị dưới dạng bảng, có thể xuất ra các định dạng khác nhau.',
      side: 'top',
      align: 'center'
    }
  }
];

// Cấu hình chung cho Driver.js
export const driverConfig = {
  showProgress: true,
  progressText: '{{current}} của {{total}}',
  nextBtnText: 'Tiếp theo →',
  prevBtnText: '← Trước',
  doneBtnText: '✓ Hoàn thành',
  closeBtnText: '✕',
  popoverClass: 'custom-driver-popover',
  animate: true,
  smoothScroll: true,
  allowClose: true,
  overlayClickNext: false,
  stagePadding: 8,
  stageRadius: 10,
  // Fix bug không thể thoát tour và khôi phục pointer events
  onDestroyStarted: () => {
    console.log('Tour guide đã kết thúc');
    
    // Force cleanup tất cả driver elements
    const cleanup = () => {
      const overlay = document.querySelector('.driver-overlay');
      const popover = document.querySelector('.driver-popover');
      const stage = document.querySelector('.driver-stage');
      
      if (overlay) overlay.remove();
      if (popover) popover.remove();
      if (stage) stage.remove();
      
      // Reset highlighted elements và khôi phục pointer events
      document.querySelectorAll('.driver-highlighted-element').forEach(el => {
        el.classList.remove('driver-highlighted-element');
        const htmlEl = el as HTMLElement;
        htmlEl.style.pointerEvents = '';
        htmlEl.style.transform = '';
        htmlEl.style.boxShadow = '';
        htmlEl.style.border = '';
        htmlEl.style.zIndex = '';
      });
      
      // Khôi phục pointer events cho toàn bộ body
      document.body.style.pointerEvents = '';
      document.documentElement.style.pointerEvents = '';
      
      // Xóa tất cả style liên quan đến driver
      const allElements = document.querySelectorAll('*');
      allElements.forEach(el => {
        if (el.classList.contains('driver-fix-stacking')) {
          el.classList.remove('driver-fix-stacking');
        }
      });
    };
    
    cleanup();
    
    // Delay cleanup để đảm bảo
    setTimeout(cleanup, 100);
    setTimeout(cleanup, 500);
  },
  onHighlightStarted: (element: Element | undefined) => {
    console.log('Highlighting element:', element);
  },
  onHighlighted: (element: Element | undefined) => {
    // Ensure element is properly highlighted
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  }
};