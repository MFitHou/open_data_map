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

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Polyline, Popup, Polygon } from 'react-leaflet';
import type { MemberOutline } from './types';

interface MemberOutlinesProps {
  memberOutline: MemberOutline | null;
}

export const MemberOutlines: React.FC<MemberOutlinesProps> = ({ memberOutline }) => {
  const { t } = useTranslation();
  
  if (!memberOutline) return null;

  if (memberOutline.type === 'way') {
    return (
      <Polyline
        positions={memberOutline.coordinates.map(c => [c[1], c[0]])}
        color="#2196F3"
        weight={4}
        opacity={0.9}
      >
        <Popup>
          <strong>{memberOutline.name}</strong>
          <br />
          {t('map.memberType')}: {t('map.memberWay')}
        </Popup>
      </Polyline>
    );
  }

  if (memberOutline.type === 'relation') {
    return (
      <Polygon
        positions={memberOutline.coordinates.map(c => [c[1], c[0]])}
        pathOptions={{
          color: '#FFA000',
          fillColor: '#FFC107',
          weight: 3,
          opacity: 0.9,
          fillOpacity: 0.4
        }}
      >
        <Popup>
          <strong>{memberOutline.name}</strong>
          <br />
          {t('map.memberType')}: {t('map.memberRelation')}
        </Popup>
      </Polygon>
    );
  }

  return null;
};
