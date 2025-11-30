/**
 * TypeScript declarations for leaflet.awesome-markers
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
