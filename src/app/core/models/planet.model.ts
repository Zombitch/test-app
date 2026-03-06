import { Country } from './country.model';

export interface PlanetTheme {
  baseColor: string;
  atmosphereColor: string;
  shadowColor: string;
  gridColor: string;
}

export interface Planet {
  id: string;
  name: string;
  radius: number;
  rotationX: number;
  rotationY: number;
  zoom: number;
  countries: Country[];
  connections: string[];
  theme?: PlanetTheme;
}
