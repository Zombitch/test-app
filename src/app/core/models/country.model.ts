import { GeoPolygon } from './geo.model';

export interface CountryStyle {
  fillColor: string;
  borderColor: string;
  selectedFillColor: string;
  hoverFillColor: string;
}

export interface Country {
  id: string;
  name: string;
  polygons: GeoPolygon[];
  style?: CountryStyle;
  metadata?: Record<string, unknown>;
}
