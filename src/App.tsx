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

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Home from './components/home/Home';
import SimpleMap from './components/map/SimpleMap';
import { Query } from './components/query/Query';
import Chatbot from './components/chatbot/Chatbot';
import { AdminLayout } from './components/admin/AdminLayout';
import { Dashboard } from './components/admin/Dashboard';
import { EnvironmentMonitoring } from './components/admin/EnvironmentMonitoring';
import { ManagePois } from './components/admin/ManagePois';
import { Login } from './components/auth/Login';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import './i18n/config';

function App() {
  return (
    <BrowserRouter>
      <div style={{ height: "100%", width: "100%" }}>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/map" element={<SimpleMap />} />
          <Route path="/query" element={<Query />} />
          <Route path="/chatbot" element={<Chatbot />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="environment" element={<EnvironmentMonitoring />} />
            <Route path="pois" element={<ManagePois />} />
          </Route>
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
