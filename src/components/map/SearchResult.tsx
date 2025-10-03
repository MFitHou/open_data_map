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

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

interface SearchResultProps {
  bounds: number[][];
  name: string;
  color?: string;
}

export const SearchResult: React.FC<SearchResultProps> = ({ 
  bounds, 
  name,
  color = "#ff6b6b" 
}) => {
  const map = useMap();

  useEffect(() => {
    if (!bounds || bounds.length === 0) return;

    // Tạo polygon highlight
    const polygon = L.polygon(bounds as [number, number][], {
      color: color,
      weight: 3,
      opacity: 0.8,
      fillColor: color,
      fillOpacity: 0.15,
      dashArray: "10, 5",
      className: "search-result-highlight"
    }).addTo(map);

    // Tạo popup hiển thị tên
    const center = polygon.getBounds().getCenter();
    const popup = L.popup({
      closeButton: false,
      className: "search-result-popup"
    })
      .setLatLng(center)
      .setContent(`
        <div style="
          padding: 8px 12px;
          font-weight: 600;
          font-size: 14px;
          color: ${color};
          text-align: center;
          white-space: nowrap;
        ">
          📍 ${name}
        </div>
      `)
      .addTo(map);

    // Fly to bounds với animation
    map.flyToBounds(polygon.getBounds(), {
      padding: [50, 50],
      duration: 1.5,
      maxZoom: 15
    });

    // Cleanup khi component unmount hoặc bounds thay đổi
    return () => {
      map.removeLayer(polygon);
      map.removeLayer(popup);
    };
  }, [bounds, map, name, color]);

  return null;
};