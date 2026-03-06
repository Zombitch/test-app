import { Country } from './country.model';

export interface CloudConfig {
  count: number;
  color: string;
  speed: number;
  opacity: number;
}

export interface PlanetTheme {
  baseColor: string;
  atmosphereColor: string;
  shadowColor: string;
  gridColor: string;
  clouds?: CloudConfig;
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
