export interface GeoPoint {
  lat: number;
  lon: number;
}

export interface GeoPolygon {
  points: GeoPoint[];
}
