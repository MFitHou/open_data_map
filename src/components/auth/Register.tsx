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

import React, { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLock, faEye, faEyeSlash, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { register } from '../../utils/auth';
import imglogin1 from '../../assets/imglogin1.jpg';
import imglogin2 from '../../assets/imglogin2.jpg';
import '../../styles/pages/Login.css';

export const Register: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.username || !formData.email || !formData.password) {
      setError(t('register.error.required'));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t('register.error.passwordMismatch'));
      return;
    }

    if (formData.password.length < 6) {
      setError(t('register.error.passwordTooShort'));
      return;
    }

    setIsLoading(true);

    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName || undefined,
      });

      alert(t('register.success.message'));
      navigate('/login');
    } catch (err: any) {
      console.error('Register error:', err);
      setError(err.message || t('register.error.registerFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Left Column - Branding */}
      <div className="login-left" style={{ backgroundImage: `url(${imglogin1})` }}>
        <div className="login-overlay">
          <div className="login-branding">
            <img src="/logo-hou-249x300.png" alt="Logo" className="login-logo" />
            <h1 className="login-title">{t('login.system.title')} <br /> {t('login.system.subtitle')}</h1>
          </div>
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="login-right" style={{ backgroundImage: `url(${imglogin2})` }}>
        <div className="login-form-container">
          <h2 className="login-form-title">{t('register.form.title')}</h2>
          <p className="login-form-subtitle">{t('register.form.subtitle')}</p>

          <form onSubmit={handleSubmit} className="login-form">
            {error && <div className="login-error">{error}</div>}

            {/* Username Field */}
            <div className="login-input-group">
              <FontAwesomeIcon icon={faUser} className="login-input-icon" />
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleChange('username', e.target.value)}
                placeholder={t('register.form.username')}
                className="login-input"
                required
                disabled={isLoading}
                minLength={3}
                maxLength={50}
              />
            </div>

            {/* Email Field */}
            <div className="login-input-group">
              <FontAwesomeIcon icon={faEnvelope} className="login-input-icon" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder={t('register.form.email')}
                className="login-input"
                required
                disabled={isLoading}
              />
            </div>

            {/* Full Name Field */}
            <div className="login-input-group">
              <FontAwesomeIcon icon={faUser} className="login-input-icon" />
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                placeholder={t('register.form.fullName')}
                className="login-input"
                disabled={isLoading}
                maxLength={100}
              />
            </div>

            {/* Password Field */}
            <div className="login-input-group">
              <FontAwesomeIcon icon={faLock} className="login-input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder={t('register.form.password')}
                className="login-input"
                required
                disabled={isLoading}
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="login-password-toggle"
                aria-label={showPassword ? t('common.accessibility.hidePassword') : t('common.accessibility.showPassword')}
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </button>
            </div>

            {/* Confirm Password Field */}
            <div className="login-input-group">
              <FontAwesomeIcon icon={faLock} className="login-input-icon" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                placeholder={t('register.form.confirmPassword')}
                className="login-input"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="login-password-toggle"
                aria-label={showConfirmPassword ? t('common.accessibility.hidePassword') : t('common.accessibility.showPassword')}
              >
                <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="login-submit-button"
              disabled={isLoading}
            >
              {isLoading ? t('register.form.submitting') : t('register.form.submit')}
            </button>

            {/* Login Link */}
            <div className="login-footer" style={{ marginTop: '1rem', textAlign: 'center' }}>
              {t('register.form.hasAccount')} <Link to="/login" style={{ color: '#1976d2', textDecoration: 'none' }}>{t('register.form.loginNow')}</Link>
            </div>

            {/* Back to Home Link */}
            <div className="login-footer" style={{ marginTop: '0.5rem', textAlign: 'center' }}>
              <Link to="/" style={{ color: '#666', textDecoration: 'none', fontSize: '0.9rem' }}>← {t('register.form.backToHome')}</Link>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};
