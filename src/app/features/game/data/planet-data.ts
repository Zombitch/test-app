import { Planet } from '../../../core/models';

function rect(latStart: number, lonStart: number, latSize: number, lonSize: number) {
  return {
    points: [
      { lat: latStart, lon: lonStart },
      { lat: latStart + latSize, lon: lonStart },
      { lat: latStart + latSize, lon: lonStart + lonSize },
      { lat: latStart, lon: lonStart + lonSize },
    ],
  };
}

function irregular(center: { lat: number; lon: number }, size: number, vertices: number, seed: number) {
  const points = [];
  for (let i = 0; i < vertices; i++) {
    const angle = (i / vertices) * Math.PI * 2;
    const jitter = 0.6 + 0.8 * Math.abs(Math.sin(seed * (i + 1) * 3.7));
    const r = size * jitter;
    points.push({
      lat: center.lat + r * Math.sin(angle),
      lon: center.lon + r * Math.cos(angle) / Math.cos((center.lat * Math.PI) / 180 || 1),
    });
  }
  return { points };
}

export const PLANET_ZYRATH: Planet = {
  id: 'zyrath',
  name: 'Zyrath',
  radius: 150,
  rotationX: 0,
  rotationY: 0,
  zoom: 1,
  connections: ['veloqor'],
  theme: {
    baseColor: '#1a0a3e',
    atmosphereColor: '#7b2ff2',
    shadowColor: '#0d0520',
    gridColor: 'rgba(123, 47, 242, 0.15)',
  },
  countries: [
    {
      id: 'z-luminara',
      name: 'Luminara',
      polygons: [irregular({ lat: 30, lon: -40 }, 22, 7, 1.2)],
      style: { fillColor: '#6c2bd9', borderColor: '#a855f7', selectedFillColor: '#c084fc', hoverFillColor: '#8b5cf6' },
    },
    {
      id: 'z-voidmere',
      name: 'Voidmere',
      polygons: [irregular({ lat: -15, lon: 50 }, 28, 8, 2.5)],
      style: { fillColor: '#4c1d95', borderColor: '#7c3aed', selectedFillColor: '#a78bfa', hoverFillColor: '#6d28d9' },
    },
    {
      id: 'z-crysthaven',
      name: 'Crysthaven',
      polygons: [irregular({ lat: 55, lon: 100 }, 18, 6, 3.1)],
      style: { fillColor: '#5b21b6', borderColor: '#8b5cf6', selectedFillColor: '#c4b5fd', hoverFillColor: '#7c3aed' },
    },
    {
      id: 'z-netherscar',
      name: 'Netherscar',
      polygons: [irregular({ lat: -50, lon: -100 }, 25, 7, 4.7)],
      style: { fillColor: '#3b0764', borderColor: '#9333ea', selectedFillColor: '#d8b4fe', hoverFillColor: '#7e22ce' },
    },
    {
      id: 'z-duskweld',
      name: 'Duskweld',
      polygons: [irregular({ lat: 10, lon: 160 }, 20, 6, 5.3)],
      style: { fillColor: '#581c87', borderColor: '#a855f7', selectedFillColor: '#e9d5ff', hoverFillColor: '#9333ea' },
    },
  ],
};

export const PLANET_VELOQOR: Planet = {
  id: 'veloqor',
  name: 'Veloqor',
  radius: 150,
  rotationX: 0,
  rotationY: 0,
  zoom: 1,
  connections: ['zyrath', 'fennox'],
  theme: {
    baseColor: '#0a2e1a',
    atmosphereColor: '#22c55e',
    shadowColor: '#051a0d',
    gridColor: 'rgba(34, 197, 94, 0.15)',
  },
  countries: [
    {
      id: 'v-thornveil',
      name: 'Thornveil',
      polygons: [irregular({ lat: 40, lon: -30 }, 24, 8, 6.1)],
      style: { fillColor: '#166534', borderColor: '#4ade80', selectedFillColor: '#86efac', hoverFillColor: '#22c55e' },
    },
    {
      id: 'v-sporevast',
      name: 'Sporevast',
      polygons: [irregular({ lat: -25, lon: 80 }, 26, 7, 7.4)],
      style: { fillColor: '#14532d', borderColor: '#22c55e', selectedFillColor: '#bbf7d0', hoverFillColor: '#16a34a' },
    },
    {
      id: 'v-mossdeep',
      name: 'Mossdeep',
      polygons: [irregular({ lat: 5, lon: -120 }, 20, 6, 8.8)],
      style: { fillColor: '#15803d', borderColor: '#4ade80', selectedFillColor: '#a7f3d0', hoverFillColor: '#22c55e' },
    },
    {
      id: 'v-rootholm',
      name: 'Rootholm',
      polygons: [irregular({ lat: -55, lon: 30 }, 22, 7, 9.2)],
      style: { fillColor: '#064e3b', borderColor: '#34d399', selectedFillColor: '#6ee7b7', hoverFillColor: '#10b981' },
    },
  ],
};

export const PLANET_FENNOX: Planet = {
  id: 'fennox',
  name: 'Fennox',
  radius: 150,
  rotationX: 0,
  rotationY: 0,
  zoom: 1,
  connections: ['veloqor'],
  theme: {
    baseColor: '#2e0a00',
    atmosphereColor: '#f97316',
    shadowColor: '#1a0500',
    gridColor: 'rgba(249, 115, 22, 0.15)',
  },
  countries: [
    {
      id: 'f-embercrest',
      name: 'Embercrest',
      polygons: [irregular({ lat: 35, lon: 20 }, 25, 7, 10.5)],
      style: { fillColor: '#9a3412', borderColor: '#fb923c', selectedFillColor: '#fdba74', hoverFillColor: '#f97316' },
    },
    {
      id: 'f-ashplain',
      name: 'Ashplain',
      polygons: [irregular({ lat: -30, lon: -60 }, 22, 6, 11.8)],
      style: { fillColor: '#7c2d12', borderColor: '#ea580c', selectedFillColor: '#fed7aa', hoverFillColor: '#f97316' },
    },
    {
      id: 'f-pyrelands',
      name: 'Pyrelands',
      polygons: [irregular({ lat: 0, lon: 130 }, 28, 8, 12.3)],
      style: { fillColor: '#c2410c', borderColor: '#fb923c', selectedFillColor: '#ffedd5', hoverFillColor: '#ea580c' },
    },
    {
      id: 'f-moltenreach',
      name: 'Moltenreach',
      polygons: [irregular({ lat: -60, lon: 100 }, 18, 6, 13.7)],
      style: { fillColor: '#9a3412', borderColor: '#f97316', selectedFillColor: '#fdba74', hoverFillColor: '#ea580c' },
    },
    {
      id: 'f-cinders',
      name: 'Cinders',
      polygons: [irregular({ lat: 50, lon: -130 }, 16, 5, 14.1)],
      style: { fillColor: '#7c2d12', borderColor: '#fb923c', selectedFillColor: '#fed7aa', hoverFillColor: '#f97316' },
    },
  ],
};

export const ALL_PLANETS: Planet[] = [PLANET_ZYRATH, PLANET_VELOQOR, PLANET_FENNOX];
