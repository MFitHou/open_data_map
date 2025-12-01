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

import * as L from 'leaflet';

declare module 'leaflet' {
  namespace AwesomeMarkers {
    interface IconOptions extends L.BaseIconOptions {
      icon?: string;
      prefix?: string;
      markerColor?: 'red' | 'darkred' | 'lightred' | 'orange' | 'beige' | 'green' | 'darkgreen' | 'lightgreen' | 'blue' | 'darkblue' | 'lightblue' | 'purple' | 'darkpurple' | 'pink' | 'cadetblue' | 'white' | 'gray' | 'lightgray' | 'black';
      iconColor?: string;
      spin?: boolean;
      extraClasses?: string;
    }

    class Icon extends L.Icon<IconOptions> {
      constructor(options?: IconOptions);
      options: IconOptions;
    }

    function icon(options: IconOptions): Icon;
  }
}

declare module 'leaflet.awesome-markers' {
  import * as L from 'leaflet';
  export = L;
}
