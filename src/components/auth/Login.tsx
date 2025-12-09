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
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLock, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { login } from '../../utils/auth';
import imglogin1 from '../../assets/imglogin1.jpg';
import imglogin2 from '../../assets/imglogin2.jpg';
import '../../styles/pages/Login.css';

export const Login: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simple authentication check
    if (username === 'admin' && password === '123456') {
      login();
      navigate('/admin');
    } else {
      setError(t('login.error.invalid'));
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
            <h1 className="login-title">{t('login.system.title')} <br></br> {t('login.system.subtitle')}</h1>
            <p className="login-subtitle"></p>
          </div>
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="login-right" style={{ backgroundImage: `url(${imglogin2})` }}>
        <div className="login-form-container">
          <h2 className="login-form-title">{t('login.form.title')}</h2>
          <p className="login-form-subtitle">{t('login.form.subtitle')}</p>

          <form onSubmit={handleSubmit} className="login-form">
            {/* Username Field */}
            <div className="login-input-group">
              <FontAwesomeIcon icon={faUser} className="login-input-icon" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t('login.form.username')}
                className="login-input"
                required
                autoComplete="username"
              />
            </div>

            {/* Password Field */}
            <div className="login-input-group">
              <FontAwesomeIcon icon={faLock} className="login-input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('login.form.password')}
                className="login-input"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="login-password-toggle"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </button>
            </div>

            {/* Error Message */}
            {error && <div className="login-error">{error}</div>}

            {/* Submit Button */}
            <button
              type="submit"
              className="login-submit-button"
              disabled={isLoading}
            >
              {isLoading ? t('login.form.submitting') : t('login.form.submit')}
            </button>

            {/* Forgot Password Link */}
            {/* <div className="login-footer">
              <a href="#" className="login-forgot-link">
                {t('login.form.forgotPassword')}
              </a>
            </div> */}
          </form>

          {/* Demo Credentials Info */}
          {/* <div className="login-demo-info">
            <p className="login-demo-title">{t('login.demo.title')}</p>
            <p className="login-demo-text">
              <strong>{t('login.demo.username')}:</strong> admin
            </p>
            <p className="login-demo-text">
              <strong>{t('login.demo.password')}:</strong> 123456
            </p>
          </div> */}

        </div>
      </div>
    </div>
  );
};
