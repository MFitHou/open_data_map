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

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { LatLngBounds } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { SearchableSelect } from '../ui/SearchableSelect';
import type { IPoiBasic } from '../../utils/adminApi';
import { API_CONFIG } from '../../config/api';
import './ManagePois.css';

// Fix Leaflet default marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// POI Type Icon Configuration
const POI_ICON_CONFIG: Record<string, { color: string; icon: string }> = {
  school: { color: '#4CAF50', icon: '🎓' },
  hospital: { color: '#f44336', icon: '🏥' },
  clinic: { color: '#FF5722', icon: '⚕️' },
  atm: { color: '#2196F3', icon: '🏧' },
  bank: { color: '#1976D2', icon: '🏦' },
  pharmacy: { color: '#E91E63', icon: '💊' },
  restaurant: { color: '#FF9800', icon: '🍽️' },
  cafe: { color: '#795548', icon: '☕' },
  bus_stop: { color: '#9C27B0', icon: '🚌' },
  police: { color: '#3F51B5', icon: '👮' },
  fire_station: { color: '#F44336', icon: '🚒' },
  library: { color: '#607D8B', icon: '📚' },
  parking: { color: '#9E9E9E', icon: '🅿️' },
  fuel: { color: '#FFC107', icon: '⛽' },
  hotel: { color: '#00BCD4', icon: '🏨' },
  charging_station: { color: '#8BC34A', icon: '🔌' },
  toilets: { color: '#03A9F4', icon: '🚻' },
  drinking_water: { color: '#00BCD4', icon: '💧' },
  community_centre: { color: '#673AB7', icon: '🏘️' },
  playground: { color: '#FFEB3B', icon: '🎪' },
  default: { color: '#757575', icon: '📍' },
};

// Use IPoiBasic from adminApi
type POI = IPoiBasic;

interface CreatePOIFormData {
  name: string;
  type: string;
  lat: string;
  lon: string;
  address: string;
}

// Auto-fit bounds component
const AutoFitBounds: React.FC<{ pois: POI[] }> = ({ pois }) => {
  const map = useMap();

  useEffect(() => {
    if (pois.length > 0) {
      const bounds = new LatLngBounds(pois.map((poi) => [poi.lat, poi.lon]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [pois, map]);

  return null;
};

// Get marker color based on POI type
const getMarkerColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    school: '#4285F4', // Blue
    hospital: '#EA4335', // Red
    clinic: '#FF6B6B', // Light Red
    pharmacy: '#00C853', // Green
    atm: '#FBC02D', // Yellow
    bank: '#FFD700', // Gold
    bus_stop: '#9C27B0', // Purple
    cafe: '#8D6E63', // Brown
    restaurant: '#FF9800', // Orange
    supermarket: '#4CAF50', // Green
    convenience_store: '#8BC34A', // Light Green
    marketplace: '#FF5722', // Deep Orange
    park: '#66BB6A', // Green
    playground: '#AB47BC', // Purple
    public_toilet: '#00BCD4', // Cyan
    drinking_water: '#03A9F4', // Light Blue
    parking: '#607D8B', // Blue Grey
    fuel_station: '#F44336', // Red
    charging_station: '#FFEB3B', // Yellow
    police: '#1976D2', // Blue
    fire_station: '#D32F2F', // Red
    post_office: '#FFA726', // Orange
    library: '#5C6BC0', // Indigo
  };
  return colorMap[type] || '#757575'; // Grey default
};

// Create colored marker icon
const createColoredIcon = (type: string) => {
  const color = getMarkerColor(type);
  const svgIcon = `
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 0C5.596 0 0 5.596 0 12.5c0 9.375 12.5 28.5 12.5 28.5S25 21.875 25 12.5C25 5.596 19.404 0 12.5 0z" 
            fill="${color}" stroke="#fff" stroke-width="2"/>
      <circle cx="12.5" cy="12.5" r="6" fill="#fff"/>
    </svg>
  `;
  
  return L.icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(svgIcon),
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
};

export const ManagePois: React.FC = () => {
  const { t } = useTranslation();
  const [pois, setPois] = useState<POI[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('school');

  // Available POI types - Đầy đủ 28 loại POI
  const poiTypes = [
    { value: 'atm', label: 'ATM' },
    { value: 'bank', label: 'Ngân hàng' },
    { value: 'bus_stop', label: 'Trạm xe buýt' },
    { value: 'cafe', label: 'Quán cà phê' },
    { value: 'charging_station', label: 'Trạm sạc xe' },
    { value: 'clinic', label: 'Phòng khám' },
    { value: 'community_centre', label: 'Trung tâm cộng đồng' },
    { value: 'convenience_store', label: 'Cửa hàng tiện lợi' },
    { value: 'drinking_water', label: 'Nước uống' },
    { value: 'fire_station', label: 'Trạm cứu hỏa' },
    { value: 'fuel_station', label: 'Trạm xăng' },
    { value: 'hospital', label: 'Bệnh viện' },
    { value: 'kindergarten', label: 'Mẫu giáo' },
    { value: 'library', label: 'Thư viện' },
    { value: 'marketplace', label: 'Chợ' },
    { value: 'park', label: 'Công viên' },
    { value: 'parking', label: 'Bãi đỗ xe' },
    { value: 'pharmacy', label: 'Nhà thuốc' },
    { value: 'playground', label: 'Sân chơi' },
    { value: 'police', label: 'Công an' },
    { value: 'post_office', label: 'Bưu điện' },
    { value: 'public_toilet', label: 'Nhà vệ sinh' },
    { value: 'restaurant', label: 'Nhà hàng' },
    { value: 'school', label: 'Trường học' },
    { value: 'supermarket', label: 'Siêu thị' },
    { value: 'university', label: 'Đại học' },
    { value: 'warehouse', label: 'Kho' },
    { value: 'waste_basket', label: 'Thùng rác' },
  ];

  // Form state
  const [formData, setFormData] = useState<CreatePOIFormData>({
    name: '',
    type: '',
    lat: '',
    lon: '',
    address: '',
  });

  const [formErrors, setFormErrors] = useState<Partial<CreatePOIFormData>>({});

  // Fetch POIs when type changes
  useEffect(() => {
    fetchPois();
  }, [selectedType]);

  const fetchPois = async () => {
    setLoading(true);
    setError(null);

    try {
      // Sử dụng lightweight=true để lấy TẤT CẢ POIs không giới hạn (cho map clustering)
      const response = await fetch(`${API_CONFIG.baseUrl}/admin/pois?type=${selectedType}&lightweight=true`, {
        credentials: 'include', // Gửi session cookies
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setPois(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch POIs');
      }
    } catch (err) {
      console.error('Error fetching POIs:', err);
      setError(t('admin.pois.error.fetchFailed'));
    } finally {
      setLoading(false);
    }
  };



  // Form validation
  const validateForm = (): boolean => {
    const errors: Partial<CreatePOIFormData> = {};

    if (!formData.name.trim()) {
      errors.name = t('admin.pois.error.nameRequired');
    }

    if (!formData.type) {
      errors.type = t('admin.pois.error.typeRequired');
    }

    const lat = parseFloat(formData.lat);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      errors.lat = t('admin.pois.error.invalidLat');
    }

    const lon = parseFloat(formData.lon);
    if (isNaN(lon) || lon < -180 || lon > 180) {
      errors.lon = t('admin.pois.error.invalidLon');
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        name: formData.name.trim(),
        type: formData.type,
        lat: parseFloat(formData.lat),
        lon: parseFloat(formData.lon),
        address: formData.address.trim() || undefined,
      };

      const response = await fetch(`${API_CONFIG.baseUrl}/admin/pois`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Gửi session cookies
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || t('admin.pois.error.createFailed'));
      }

      // Reset form và đóng modal
      setFormData({
        name: '',
        type: 'atm',
        lat: '',
        lon: '',
        address: '',
      });
      setFormErrors({});
      setShowModal(false);

      // Refresh danh sách POIs
      await fetchPois();

      alert(t('admin.pois.success.created'));
    } catch (err) {
      console.error('Error creating POI:', err);
      setError(err instanceof Error ? err.message : t('admin.pois.error.createFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error khi user typing
    if (formErrors[name as keyof CreatePOIFormData]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  return (
    <div className="manage-pois">
      {/* Header */}
      <div className="manage-pois__header">
        <div>
          <h1 className="manage-pois__title">{t('admin.pois.title')}</h1>
          <p className="manage-pois__subtitle">{t('admin.pois.subtitle')}</p>
        </div>
        <button
          className="manage-pois__add-btn"
          onClick={() => setShowModal(true)}
          disabled={loading}
        >
          + {t('admin.pois.addNew')}
        </button>
      </div>

      {/* Controls Bar */}
      <div className="manage-pois__controls">
        <div className="manage-pois__filter-group">
          <label className="manage-pois__filter-label" htmlFor="type-filter">
            {t('admin.pois.filter.type')}:
          </label>
          <div className="manage-pois__searchable-select-wrapper">
            <SearchableSelect
              options={poiTypes}
              value={selectedType}
              onChange={setSelectedType}
              placeholder={t('admin.pois.filter.selectType')}
              disabled={loading}
            />
          </div>
        </div>
        
        <span className="manage-pois__count">
          {pois.length} POIs
        </span>
      </div>

      {/* Error Message */}
      {error && <div className="manage-pois__error">{error}</div>}

      {/* Loading State */}
      {loading && (
        <div className="manage-pois__loading">
          {t('admin.pois.loading')}
        </div>
      )}

      {/* Map View */}
      {!loading && pois.length > 0 && (
        <div className="manage-pois__map-wrapper">
          <MapContainer
            center={[21.0285, 105.8542]}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <AutoFitBounds pois={pois} />
            
            {/* MarkerClusterGroup để nhóm các markers lại khi zoom out */}
            <MarkerClusterGroup
              chunkedLoading
              maxClusterRadius={60}
              spiderfyOnMaxZoom={true}
              showCoverageOnHover={false}
              zoomToBoundsOnClick={true}
            >
              {pois.map((poi) => (
                <Marker
                  key={poi.id}
                  position={[poi.lat, poi.lon]}
                  icon={createColoredIcon(poi.type)}
                >
                  <Popup>
                    <div className="poi-popup">
                      <h3 className="poi-popup__title">{poi.name}</h3>
                      <div className="poi-popup__info">
                        <p><strong>Loại:</strong> {poi.type}</p>
                        <p><strong>Tọa độ:</strong> {poi.lat.toFixed(5)}, {poi.lon.toFixed(5)}</p>
                        {(poi as any).osm_id && <p><strong>OSM ID:</strong> {(poi as any).osm_id}</p>}
                        {(poi as any).operator && <p><strong>Vận hành:</strong> {(poi as any).operator}</p>}
                        {(poi as any).addr_district && <p><strong>Quận:</strong> {(poi as any).addr_district}</p>}
                        {(poi as any).website && (
                          <p>
                            <strong>Website:</strong>{' '}
                            <a href={(poi as any).website} target="_blank" rel="noopener noreferrer">
                              {(poi as any).website.substring(0, 30)}...
                            </a>
                          </p>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MarkerClusterGroup>
          </MapContainer>
        </div>
      )}
      
      {!loading && pois.length === 0 && (
        <div className="manage-pois__no-data">
          <p>{t('admin.pois.noData')}</p>
        </div>
      )}

      {/* Add POI Modal */}
      {showModal && (
        <div className="poi-modal" onClick={() => setShowModal(false)}>
          <div className="poi-modal__content" onClick={(e) => e.stopPropagation()}>
            <div className="poi-modal__header">
              <h2 className="poi-modal__title">{t('admin.pois.modal.title')}</h2>
              <button
                className="poi-modal__close"
                onClick={() => setShowModal(false)}
                disabled={isSubmitting}
              >
                ×
              </button>
            </div>

            <form className="poi-form" onSubmit={handleSubmit}>
              {/* Name */}
              <div className="poi-form__field">
                <label className="poi-form__label" htmlFor="name">
                  {t('admin.pois.form.name')} <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className={`poi-form__input ${formErrors.name ? 'poi-form__input--error' : ''}`}
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  placeholder={t('admin.pois.form.namePlaceholder')}
                />
                {formErrors.name && <span className="poi-form__error">{formErrors.name}</span>}
              </div>

              {/* Type */}
              <div className="poi-form__field">
                <label className="poi-form__label" htmlFor="type">
                  {t('admin.pois.form.type')} <span className="required">*</span>
                </label>
                <select
                  id="type"
                  name="type"
                  className={`poi-form__select ${formErrors.type ? 'poi-form__input--error' : ''}`}
                  value={formData.type}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                >
                  {poiTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {formErrors.type && <span className="poi-form__error">{formErrors.type}</span>}
              </div>

              {/* Latitude & Longitude */}
              <div className="poi-form__row">
                <div className="poi-form__field">
                  <label className="poi-form__label" htmlFor="lat">
                    {t('admin.pois.form.latitude')} <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="lat"
                    name="lat"
                    className={`poi-form__input ${formErrors.lat ? 'poi-form__input--error' : ''}`}
                    value={formData.lat}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    placeholder="21.0285"
                  />
                  {formErrors.lat && <span className="poi-form__error">{formErrors.lat}</span>}
                </div>

                <div className="poi-form__field">
                  <label className="poi-form__label" htmlFor="lon">
                    {t('admin.pois.form.longitude')} <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="lon"
                    name="lon"
                    className={`poi-form__input ${formErrors.lon ? 'poi-form__input--error' : ''}`}
                    value={formData.lon}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    placeholder="105.8542"
                  />
                  {formErrors.lon && <span className="poi-form__error">{formErrors.lon}</span>}
                </div>
              </div>

              {/* Address */}
              <div className="poi-form__field">
                <label className="poi-form__label" htmlFor="address">
                  {t('admin.pois.form.address')}
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  className="poi-form__input"
                  value={formData.address}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  placeholder={t('admin.pois.form.addressPlaceholder')}
                />
              </div>

              {/* Submit buttons */}
              <div className="poi-form__actions">
                <button
                  type="button"
                  className="poi-form__btn poi-form__btn--cancel"
                  onClick={() => setShowModal(false)}
                  disabled={isSubmitting}
                >
                  {t('admin.pois.form.cancel')}
                </button>
                <button
                  type="submit"
                  className="poi-form__btn poi-form__btn--submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? t('admin.pois.form.submitting') : t('admin.pois.form.submit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
