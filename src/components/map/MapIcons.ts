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

import L from "leaflet";
import 'leaflet.awesome-markers';
import 'leaflet.awesome-markers/dist/leaflet.awesome-markers.css';

// Custom icons using leaflet.awesome-markers with FontAwesome
export const schoolIcon = L.AwesomeMarkers.icon({
  icon: 'graduation-cap',
  markerColor: 'green',
  prefix: 'fa',
  iconColor: 'white'
});

export const hospitalIcon = L.AwesomeMarkers.icon({
  icon: 'hospital',
  markerColor: 'red',
  prefix: 'fa',
  iconColor: 'white'
});

export const restaurantIcon = L.AwesomeMarkers.icon({
  icon: 'cutlery',
  markerColor: 'orange',
  prefix: 'fa',
  iconColor: 'white'
});

export const bankIcon = L.AwesomeMarkers.icon({
  icon: 'bank',
  markerColor: 'blue',
  prefix: 'fa',
  iconColor: 'white'
});

export const searchIcon = L.AwesomeMarkers.icon({
  icon: 'search',
  markerColor: 'purple',
  prefix: 'fa',
  iconColor: 'white'
});

export const currentLocationIcon = L.AwesomeMarkers.icon({
  icon: 'location-arrow',
  markerColor: 'cadetblue',
  prefix: 'fa',
  iconColor: 'white'
});

// Ward boundary style
export const wardStyle = {
  fillColor: '#00ff00',
  weight: 2,
  opacity: 1,
  color: 'blue',
  dashArray: '0',
  fillOpacity: 0.2
};

// Outline style (red, dashed)
export const outlineStyle = {
  color: '#ff0000',
  weight: 3,
  opacity: 0.8,
  dashArray: '10, 5',
  fillOpacity: 0
};
