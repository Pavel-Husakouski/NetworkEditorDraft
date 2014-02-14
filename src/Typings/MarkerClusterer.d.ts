/// <reference path="../typings/google.maps.d.ts" />

declare class Cluster {
  getMarkers(): google.maps.Marker[];
  getCenter(): google.maps.LatLng;
  getSize(): Number;
}

declare class MarkerClusterer extends google.maps.OverlayView {
  constructor (map: google.maps.Map, markers: google.maps.Marker[], opt_options: any);
  clearMarkers();
  getClusters(): Cluster[];
}