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
import { useTranslation } from 'react-i18next';
import './UpdateForm.css';

interface UpdateFormProps {
  placeData: {
    name: string;
    lat: number;
    lon: number;
    type: string;
    poiId: string; // URI của POI (ex: school_001)
  };
  onClose: () => void;
}

interface UpdateData {
  telephone?: string;
  email?: string;
  website?: string;
  openingHours?: string;
  hasWifi?: boolean;
  wheelchairAccessible?: boolean;
  parking?: boolean;
  airConditioning?: boolean;
  petsAllowed?: boolean;
  reservationRequired?: boolean;
  priceLevel?: 'free' | 'low' | 'medium' | 'high' | '';
  paymentMethods?: string;
  description?: string;
  notes?: string;
}

export const UpdateForm: React.FC<UpdateFormProps> = ({ placeData, onClose }) => {
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState<UpdateData>({
    telephone: '',
    email: '',
    website: '',
    openingHours: '',
    hasWifi: false,
    wheelchairAccessible: false,
    parking: false,
    priceLevel: '',
    paymentMethods: '',
    airConditioning: false,
    petsAllowed: false,
    reservationRequired: false,
    description: '',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | 'info' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleInputChange = (field: keyof UpdateData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    // Lọc bỏ các field trống
    const cleanedData: Record<string, any> = {};
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== '' && value !== undefined && value !== null) {
        cleanedData[key] = value;
      }
    });

    // Nếu không có data nào được nhập
    if (Object.keys(cleanedData).length === 0) {
      setSubmitStatus({
        type: 'error',
        message: t('map.updateForm.noDataError'),
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/crowdsource/submit', {
        method: 'POST',
        credentials: 'include', // Important: Send session cookie
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          poiId: placeData.poiId,
          data: cleanedData,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        let message = '';
        
        if (result.status === 'auto-merged') {
          message = t('map.updateForm.autoMergedSuccess', {
            votes: result.currentVotes,
          });
        } else if (result.status === 'voted') {
          message = t('map.updateForm.votedSuccess', {
            current: result.currentVotes,
            required: result.requiredVotes,
          });
        } else {
          message = t('map.updateForm.submitSuccess', {
            required: result.requiredVotes,
          });
        }

        setSubmitStatus({
          type: 'success',
          message,
        });

        // Reset form sau 2 giây
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setSubmitStatus({
          type: 'error',
          message: result.message || t('map.updateForm.submitError'),
        });
      }
    } catch (error) {
      console.error('Error submitting update:', error);
      setSubmitStatus({
        type: 'error',
        message: t('map.updateForm.networkError'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="update-form-overlay">
      <div className="update-form-container">
        <div className="update-form-header">
          <h2>{t('map.updateForm.title')}</h2>
          <button className="close-button" onClick={onClose} aria-label={t('common.button.close')}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="update-form">
          {/* Thông báo status */}
          {submitStatus.type && (
            <div className={`status-message status-${submitStatus.type}`}>
              {submitStatus.message}
            </div>
          )}

          {/* Thông tin cơ bản (read-only) */}
          <div className="form-section">
            <h3>{t('map.updateForm.basicInfo')}</h3>
            
            <div className="form-group">
              <label>{t('map.updateForm.name')}</label>
              <input type="text" value={placeData.name} readOnly className="readonly-input" />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{t('map.updateForm.latitude')}</label>
                <input type="text" value={placeData.lat.toFixed(6)} readOnly className="readonly-input" />
              </div>
              <div className="form-group">
                <label>{t('map.updateForm.longitude')}</label>
                <input type="text" value={placeData.lon.toFixed(6)} readOnly className="readonly-input" />
              </div>
            </div>

            <div className="form-group">
              <label>{t('map.updateForm.type')}</label>
              <input type="text" value={placeData.type} readOnly className="readonly-input" />
            </div>
          </div>

          {/* Thông tin cập nhật */}
          <div className="form-section">
            <h3>{t('map.updateForm.additionalInfo')}</h3>

            <div className="form-group">
              <label htmlFor="telephone">{t('map.updateForm.telephone')}</label>
              <input
                id="telephone"
                type="tel"
                placeholder={t('map.updateForm.telephonePlaceholder')}
                value={formData.telephone}
                onChange={(e) => handleInputChange('telephone', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">{t('map.updateForm.email')}</label>
              <input
                id="email"
                type="email"
                placeholder={t('map.updateForm.emailPlaceholder')}
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="website">{t('map.updateForm.website')}</label>
              <input
                id="website"
                type="url"
                placeholder={t('map.updateForm.websitePlaceholder')}
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="openingHours">{t('map.updateForm.openingHours')}</label>
              <input
                id="openingHours"
                type="text"
                placeholder={t('map.updateForm.openingHoursPlaceholder')}
                value={formData.openingHours}
                onChange={(e) => handleInputChange('openingHours', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="priceLevel">{t('map.updateForm.priceLevel')}</label>
              <select
                id="priceLevel"
                value={formData.priceLevel}
                onChange={(e) => handleInputChange('priceLevel', e.target.value)}
              >
                <option value="">{t('map.updateForm.selectOption')}</option>
                <option value="free">{t('map.updateForm.priceFree')}</option>
                <option value="low">{t('map.updateForm.priceLow')}</option>
                <option value="medium">{t('map.updateForm.priceMedium')}</option>
                <option value="high">{t('map.updateForm.priceHigh')}</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="paymentMethods">{t('map.updateForm.paymentMethods')}</label>
              <input
                id="paymentMethods"
                type="text"
                placeholder={t('map.updateForm.paymentMethodsPlaceholder')}
                value={formData.paymentMethods}
                onChange={(e) => handleInputChange('paymentMethods', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">{t('map.updateForm.description')}</label>
              <textarea
                id="description"
                rows={3}
                placeholder={t('map.updateForm.descriptionPlaceholder')}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="notes">{t('map.updateForm.notes')}</label>
              <textarea
                id="notes"
                rows={2}
                placeholder={t('map.updateForm.notesPlaceholder')}
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
              />
            </div>

            {/* Checkboxes */}
            <div className="form-group-checkboxes">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.hasWifi}
                  onChange={(e) => handleInputChange('hasWifi', e.target.checked)}
                />
                <span>{t('map.updateForm.hasWifi')}</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.wheelchairAccessible}
                  onChange={(e) => handleInputChange('wheelchairAccessible', e.target.checked)}
                />
                <span>{t('map.updateForm.wheelchairAccessible')}</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.parking}
                  onChange={(e) => handleInputChange('parking', e.target.checked)}
                />
                <span>{t('map.updateForm.parking')}</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.airConditioning}
                  onChange={(e) => handleInputChange('airConditioning', e.target.checked)}
                />
                <span>{t('map.updateForm.airConditioning')}</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.petsAllowed}
                  onChange={(e) => handleInputChange('petsAllowed', e.target.checked)}
                />
                <span>{t('map.updateForm.petsAllowed')}</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.reservationRequired}
                  onChange={(e) => handleInputChange('reservationRequired', e.target.checked)}
                />
                <span>{t('map.updateForm.reservationRequired')}</span>
              </label>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="button-secondary" disabled={isSubmitting}>
              {t('common.button.cancel')}
            </button>
            <button type="submit" className="button-primary" disabled={isSubmitting}>
              {isSubmitting ? t('common.status.submitting') : t('common.button.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
