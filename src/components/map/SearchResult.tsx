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