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
import './ManagePois.css';

interface POI {
  id: string;
  name: string;
  type: string;
  lat: number;
  lon: number;
  address?: string | null;
  amenity?: string | null;
  brand?: string | null;
  wkt?: string | null;
  
  // Contact & Info
  website?: string | null;
  phone?: string | null;
  operator?: string | null;
  opening_hours?: string | null;
  
  // Accessibility
  wheelchair?: string | null;
  fee?: string | null;
  
  // Infrastructure
  highway?: string | null;
  building?: string | null;
  surface?: string | null;
  lit?: string | null;
  
  // Bus Stop specific
  route_ref?: string | null;
  bench?: string | null;
  shelter?: string | null;
  
  // School specific
  education_level?: string | null;
  
  // Drinking Water specific
  drinking_water?: string | null;
}

// Cấu hình cột hiển thị cho từng loại POI
interface ColumnConfig {
  key: string;
  label: string;
  render?: (poi: POI) => React.ReactNode;
}

// Schema động cho từng loại POI
const POI_SCHEMAS: Record<string, ColumnConfig[]> = {
  toilet: [
    { key: 'name', label: 'admin.pois.table.name' },
    { key: 'coordinates', label: 'admin.pois.table.coordinates' },
    { key: 'address', label: 'admin.pois.table.address' },
    { key: 'operator', label: 'admin.pois.table.operator' },
    { key: 'opening_hours', label: 'admin.pois.table.openingHours' },
    { key: 'fee', label: 'admin.pois.table.fee' },
    { key: 'wheelchair', label: 'admin.pois.table.wheelchair' },
  ],
  school: [
    { key: 'name', label: 'admin.pois.table.name' },
    { key: 'coordinates', label: 'admin.pois.table.coordinates' },
    { key: 'address', label: 'admin.pois.table.address' },
    { key: 'website', label: 'Website' },
    { key: 'phone', label: 'admin.pois.table.phone' },
    { key: 'education_level', label: 'admin.pois.table.educationLevel' },
    { key: 'operator', label: 'admin.pois.table.operator' },
  ],
  'bus-stop': [
    { key: 'name', label: 'admin.pois.table.name' },
    { key: 'coordinates', label: 'admin.pois.table.coordinates' },
    { key: 'route_ref', label: 'admin.pois.table.routes' },
    { key: 'operator', label: 'admin.pois.table.operator' },
    { key: 'shelter', label: 'admin.pois.table.shelter' },
    { key: 'bench', label: 'admin.pois.table.bench' },
    { key: 'lit', label: 'admin.pois.table.lighting' },
  ],
  'play-ground': [
    { key: 'name', label: 'admin.pois.table.name' },
    { key: 'coordinates', label: 'admin.pois.table.coordinates' },
    { key: 'address', label: 'admin.pois.table.address' },
    { key: 'surface', label: 'admin.pois.table.surface' },
    { key: 'lit', label: 'admin.pois.table.lighting' },
    { key: 'operator', label: 'admin.pois.table.operator' },
  ],
  'drinking-water': [
    { key: 'name', label: 'admin.pois.table.name' },
    { key: 'coordinates', label: 'admin.pois.table.coordinates' },
    { key: 'address', label: 'admin.pois.table.address' },
    { key: 'drinking_water', label: 'admin.pois.table.drinkable' },
    { key: 'operator', label: 'admin.pois.table.operator' },
    { key: 'wheelchair', label: 'admin.pois.table.wheelchair' },
  ],
}

interface CreatePOIFormData {
  name: string;
  type: string;
  lat: string;
  lon: string;
  address: string;
}

export const ManagePois: React.FC = () => {
  const { t } = useTranslation();
  const [pois, setPois] = useState<POI[]>([]);
  const [filteredPois, setFilteredPois] = useState<POI[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('toilet');
  
  const itemsPerPage = 10;

  // Available POI types
  const poiTypes = [
    { value: 'toilet', label: t('admin.pois.type.toilet') },
    { value: 'drinking-water', label: t('admin.pois.type.drinkingWater') },
    { value: 'school', label: t('admin.pois.type.school') },
    { value: 'bus-stop', label: t('admin.pois.type.busStop') },
    { value: 'play-ground', label: t('admin.pois.type.playGround') },
  ];

  // Form state
  const [formData, setFormData] = useState<CreatePOIFormData>({
    name: '',
    type: 'toilet',
    lat: '',
    lon: '',
    address: '',
  });

  const [formErrors, setFormErrors] = useState<Partial<CreatePOIFormData>>({});
  const [dynamicSchema, setDynamicSchema] = useState<ColumnConfig[]>([]);
  const [schemaLoading, setSchemaLoading] = useState(false);

  // Fetch schema khi selectedType thay đổi
  useEffect(() => {
    fetchSchema();
  }, [selectedType]);

  // Fetch POIs sau khi có schema
  useEffect(() => {
    if (dynamicSchema.length > 0) {
      fetchPois();
    }
  }, [dynamicSchema]);

  // Filter POIs khi search query thay đổi
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredPois(pois);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = pois.filter(
        (poi) =>
          poi.name?.toLowerCase().includes(query) ||
          poi.type?.toLowerCase().includes(query) ||
          poi.amenity?.toLowerCase().includes(query)
      );
      setFilteredPois(filtered);
    }
    setCurrentPage(1); // Reset về trang 1 khi search
  }, [searchQuery, pois]);

  const fetchPois = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch từ API endpoint với filter type động
      const response = await fetch(`http://localhost:3000/api/admin/pois?type=${selectedType}&limit=1000`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        const allPois: POI[] = result.data.map((item: any) => {
          // Extract short ID từ URI (lấy phần cuối của geometry URL)
          const idParts = item.id ? item.id.split('/') : [];
          const geometryPart = idParts[idParts.length - 2] || 'unknown'; // Lấy số trước /geometry
          const shortId = geometryPart.substring(0, 10);
          
          // Nếu name chứa "Unnamed POI" hoặc "geometry", dùng ID thay thế
          let displayName = item.name;
          if (!displayName || displayName.includes('Unnamed POI') || displayName.includes('geometry')) {
            displayName = `POI #${shortId}`;
          }
          
          // Map tất cả thuộc tính từ backend
          return {
            id: item.id || `${item.type}-${Math.random()}`,
            name: displayName,
            type: item.type || 'unknown',
            lat: item.lat || 0,
            lon: item.lon || 0,
            address: item.address || null,
            amenity: item.amenity || null,
            wkt: item.wkt || null,
            
            // Contact & Info
            website: item.website || null,
            phone: item.phone || null,
            operator: item.operator || null,
            opening_hours: item.opening_hours || null,
            
            // Accessibility
            wheelchair: item.wheelchair || null,
            fee: item.fee || null,
            
            // Infrastructure
            highway: item.highway || null,
            building: item.building || null,
            surface: item.surface || null,
            lit: item.lit || null,
            
            // Bus Stop specific
            route_ref: item.route_ref || null,
            bench: item.bench || null,
            shelter: item.shelter || null,
            
            // School specific
            education_level: item.education_level || null,
            
            // Drinking Water specific
            drinking_water: item.drinking_water || null,
          };
        });

        setPois(allPois);
        setFilteredPois(allPois);
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

  // Fetch schema động từ backend
  const fetchSchema = async () => {
    setSchemaLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/api/admin/pois/schema?type=${selectedType}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.fields) {
        // Transform backend schema thành column config
        const columns: ColumnConfig[] = result.fields
          .filter((field: any) => {
            // Chỉ hiển thị các field quan trọng, bỏ qua các field hệ thống
            const excludedFields = ['wkt', 'geometry', 'hasGeometry', 'type'];
            return !excludedFields.includes(field.key);
          })
          .slice(0, 8) // Giới hạn 8 cột để tránh quá rộng
          .map((field: any) => ({
            key: field.key,
            label: field.label || field.key,
          }));

        setDynamicSchema(columns);
      } else {
        // Fallback về static schema nếu lỗi
        setDynamicSchema(POI_SCHEMAS[selectedType] || POI_SCHEMAS['toilet']);
      }
    } catch (err) {
      console.error('Error fetching schema:', err);
      // Fallback
      setDynamicSchema(POI_SCHEMAS[selectedType] || POI_SCHEMAS['toilet']);
    } finally {
      setSchemaLoading(false);
    }
  };

  // Lấy column config dựa trên selectedType (dynamic hoặc static)
  const currentColumns = dynamicSchema.length > 0 ? dynamicSchema : (POI_SCHEMAS[selectedType] || POI_SCHEMAS['toilet']);
  
  // Helper function để render cell value
  const renderCellValue = (poi: POI, columnKey: string): React.ReactNode => {
    switch (columnKey) {
      case 'name':
        return (
          <div>
            <strong>{poi.name}</strong>
            {poi.amenity && poi.amenity !== poi.type && (
              <div style={{ fontSize: '0.85em', color: '#666', marginTop: '4px' }}>
                {poi.amenity}
              </div>
            )}
          </div>
        );
      
      case 'coordinates':
        return `${poi.lat.toFixed(4)}, ${poi.lon.toFixed(4)}`;
      
      case 'website':
        return poi.website ? (
          <a href={poi.website} target="_blank" rel="noopener noreferrer" style={{ color: '#007bff', textDecoration: 'none' }}>
            {poi.website.length > 25 ? poi.website.substring(0, 25) + '...' : poi.website}
          </a>
        ) : <span style={{ color: '#999' }}>—</span>;
      
      case 'wheelchair':
      case 'fee':
      case 'lit':
      case 'bench':
      case 'shelter':
      case 'drinking_water':
        const value = poi[columnKey as keyof POI];
        if (!value) return <span style={{ color: '#999' }}>—</span>;
        // Hiển thị Yes/No hoặc giá trị boolean
        if (value === 'yes' || value === 'true') return <span style={{ color: '#28a745' }}>✓</span>;
        if (value === 'no' || value === 'false') return <span style={{ color: '#dc3545' }}>✗</span>;
        return value;
      
      case 'route_ref':
        return poi.route_ref ? (
          <span style={{ background: '#007bff', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.85em' }}>
            {poi.route_ref}
          </span>
        ) : <span style={{ color: '#999' }}>—</span>;
      
      default:
        const fieldValue = poi[columnKey as keyof POI];
        return fieldValue || <span style={{ color: '#999' }}>—</span>;
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredPois.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPois = filteredPois.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
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

      const response = await fetch('http://localhost:3000/api/admin/pois', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

  // Handle delete POI
  const handleDelete = async (id: string) => {
    if (!confirm(t('admin.pois.confirm.delete'))) {
      return;
    }

    try {
      const encodedId = encodeURIComponent(id);
      const response = await fetch(`http://localhost:3000/api/admin/pois/${encodedId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || t('admin.pois.error.deleteFailed'));
      }

      // Refresh danh sách POIs
      await fetchPois();

      alert(t('admin.pois.success.deleted'));
    } catch (err) {
      console.error('Error deleting POI:', err);
      alert(err instanceof Error ? err.message : t('admin.pois.error.deleteFailed'));
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

      {/* Filter and Search bar */}
      <div className="manage-pois__filters">
        <div className="manage-pois__filter-group">
          <label className="manage-pois__filter-label" htmlFor="type-filter">
            {t('admin.pois.filter.type')}:
          </label>
          <select
            id="type-filter"
            className="manage-pois__type-select"
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setSearchQuery(''); // Clear search khi đổi type
              setCurrentPage(1); // Reset về trang 1
            }}
            disabled={loading}
          >
            {poiTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        
        <input
          type="text"
          className="manage-pois__search-input"
          placeholder={t('admin.pois.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={loading}
        />
      </div>

      {/* Error message */}
      {error && <div className="manage-pois__error">{error}</div>}

      {/* Loading state */}
      {(loading || schemaLoading) && (
        <div className="manage-pois__loading">
          {schemaLoading ? 'Đang tải cấu trúc dữ liệu...' : t('admin.pois.loading')}
        </div>
      )}

      {/* POI Table */}
      {!loading && (
        <>
          <div className="manage-pois__table-wrapper">
            <table className="poi-table">
              <thead className="poi-table__head">
                <tr>
                  {/* Render columns động dựa trên selectedType */}
                  {currentColumns.map((col) => (
                    <th key={col.key} className="poi-table__th">
                      {t(col.label)}
                    </th>
                  ))}
                  <th className="poi-table__th">{t('admin.pois.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="poi-table__body">
                {currentPois.length === 0 ? (
                  <tr>
                    <td colSpan={currentColumns.length + 1} className="poi-table__empty">
                      {searchQuery ? t('admin.pois.noResults') : t('admin.pois.noData')}
                    </td>
                  </tr>
                ) : (
                  currentPois.map((poi) => (
                    <tr key={poi.id} className="poi-table__row">
                      {/* Render cells động */}
                      {currentColumns.map((col) => (
                        <td 
                          key={col.key} 
                          className={`poi-table__td ${col.key === 'name' ? 'poi-table__td--name' : ''} ${col.key === 'address' ? 'poi-table__td--address' : ''}`}
                        >
                          {col.render ? col.render(poi) : renderCellValue(poi, col.key)}
                        </td>
                      ))}
                      <td className="poi-table__td poi-table__td--actions">
                        <button
                          className="poi-action-btn poi-action-btn--delete"
                          onClick={() => handleDelete(poi.id)}
                          title={t('admin.pois.actions.delete')}
                        >
                          {t('admin.pois.actions.delete')}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="manage-pois__pagination">
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                {t('admin.pois.pagination.previous')}
              </button>
              <span className="pagination-info">
                {t('admin.pois.pagination.page')} {currentPage} / {totalPages}
              </span>
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                {t('admin.pois.pagination.next')}
              </button>
            </div>
          )}
        </>
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
                  <option value="toilet">{t('admin.pois.type.toilet')}</option>
                  <option value="school">{t('admin.pois.type.school')}</option>
                  <option value="bus-stop">{t('admin.pois.type.busStop')}</option>
                  <option value="play-ground">{t('admin.pois.type.playGround')}</option>
                  <option value="drinking-water">{t('admin.pois.type.drinkingWater')}</option>
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
