import { GeoPolygon } from './geo.model';

export type TerrainType = 'forest' | 'desert' | 'ocean' | 'mountain' | 'tundra' | 'swamp' | 'volcanic' | 'crystal' | 'fungal' | 'plains';

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
  terrain?: TerrainType;
  metadata?: Record<string, unknown>;
}
