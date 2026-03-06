import { Planet } from '../../../core/models';
import { TerrainType } from '../../../core/models/country.model';

function irregular(center: { lat: number; lon: number }, size: number, vertices: number, seed: number) {
  const points = [];
  for (let i = 0; i < vertices; i++) {
    const angle = (i / vertices) * Math.PI * 2;
    const jitter = 0.6 + 0.8 * Math.abs(Math.sin(seed * (i + 1) * 3.7));
    const r = size * jitter;
    points.push({
      lat: center.lat + r * Math.sin(angle),
      lon: center.lon + r * Math.cos(angle) / Math.max(Math.cos((center.lat * Math.PI) / 180), 0.3),
    });
  }
  return { points };
}

function c(
  id: string,
  name: string,
  lat: number,
  lon: number,
  size: number,
  verts: number,
  seed: number,
  fill: string,
  border: string,
  selFill: string,
  hovFill: string,
  terrain: TerrainType,
) {
  return {
    id,
    name,
    polygons: [irregular({ lat, lon }, size, verts, seed)],
    style: { fillColor: fill, borderColor: border, selectedFillColor: selFill, hoverFillColor: hovFill },
    terrain,
  };
}

// =====================================================
// ZYRATH - Purple crystal planet with mystic forests
// =====================================================
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
    gridColor: 'rgba(123, 47, 242, 0.12)',
    clouds: { count: 18, color: 'rgba(180, 140, 255, 0.25)', speed: 0.08, opacity: 0.3 },
  },
  countries: [
    c('z-luminara',    'Luminara',       30,  -40, 20, 7,  1.2, '#6c2bd9','#a855f7','#c084fc','#8b5cf6', 'crystal'),
    c('z-voidmere',    'Voidmere',      -15,   50, 24, 8,  2.5, '#4c1d95','#7c3aed','#a78bfa','#6d28d9', 'swamp'),
    c('z-crysthaven',  'Crysthaven',     55,  100, 16, 6,  3.1, '#5b21b6','#8b5cf6','#c4b5fd','#7c3aed', 'crystal'),
    c('z-netherscar',  'Netherscar',    -50, -100, 22, 7,  4.7, '#3b0764','#9333ea','#d8b4fe','#7e22ce', 'mountain'),
    c('z-duskweld',    'Duskweld',       10,  160, 18, 6,  5.3, '#581c87','#a855f7','#e9d5ff','#9333ea', 'forest'),
    c('z-glimhollow',  'Glimhollow',     65,  -10, 14, 6,  6.0, '#7e22ce','#c084fc','#e9d5ff','#a855f7', 'forest'),
    c('z-shardpeak',   'Shardpeak',     -35,  150, 16, 7,  6.8, '#4c1d95','#7c3aed','#c4b5fd','#6d28d9', 'mountain'),
    c('z-twilight',    'Twilight Reach', 45,   50, 18, 8,  7.5, '#581c87','#a855f7','#d8b4fe','#9333ea', 'plains'),
    c('z-whisper',     'Whispervale',   -60,    0, 14, 5,  8.2, '#6c2bd9','#8b5cf6','#c084fc','#7c3aed', 'forest'),
    c('z-prism',       'Prismlands',      0, -130, 20, 7,  9.0, '#5b21b6','#9333ea','#c4b5fd','#7e22ce', 'crystal'),
    c('z-umbral',      'Umbral Deep',   -25,  -60, 12, 6, 10.3, '#3b0764','#7c3aed','#a78bfa','#6d28d9', 'ocean'),
    c('z-stellarch',   'Stellarch',      70, -120, 12, 5, 11.1, '#7e22ce','#c084fc','#e9d5ff','#a855f7', 'tundra'),
  ],
};

// =====================================================
// VELOQOR - Green bio-planet with dense forests & swamps
// =====================================================
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
    gridColor: 'rgba(34, 197, 94, 0.12)',
    clouds: { count: 22, color: 'rgba(200, 255, 220, 0.2)', speed: 0.06, opacity: 0.25 },
  },
  countries: [
    c('v-thornveil',   'Thornveil',       40,  -30, 22, 8,  6.1, '#166534','#4ade80','#86efac','#22c55e', 'forest'),
    c('v-sporevast',   'Sporevast',      -25,   80, 24, 7,  7.4, '#14532d','#22c55e','#bbf7d0','#16a34a', 'fungal'),
    c('v-mossdeep',    'Mossdeep',         5, -120, 18, 6,  8.8, '#15803d','#4ade80','#a7f3d0','#22c55e', 'forest'),
    c('v-rootholm',    'Rootholm',       -55,   30, 20, 7,  9.2, '#064e3b','#34d399','#6ee7b7','#10b981', 'forest'),
    c('v-fernwyld',    'Fernwyld',        60,   50, 16, 7, 10.0, '#166534','#22c55e','#86efac','#16a34a', 'forest'),
    c('v-bogshire',    'Bogshire',       -10,  160, 18, 6, 10.8, '#064e3b','#34d399','#a7f3d0','#10b981', 'swamp'),
    c('v-canopyx',     'Canopyx',         30,  120, 20, 8, 11.5, '#15803d','#4ade80','#bbf7d0','#22c55e', 'forest'),
    c('v-mycelium',    'Mycelium Flats', -40, -100, 16, 6, 12.3, '#14532d','#22c55e','#86efac','#16a34a', 'fungal'),
    c('v-verdantia',   'Verdantia',       55, -100, 14, 7, 13.1, '#166534','#34d399','#6ee7b7','#22c55e', 'forest'),
    c('v-gloomfen',    'Gloomfen',       -65,  -30, 14, 5, 13.8, '#064e3b','#10b981','#a7f3d0','#059669', 'swamp'),
    c('v-vinereach',   'Vinereach',       15,   30, 12, 6, 14.5, '#15803d','#4ade80','#bbf7d0','#22c55e', 'forest'),
    c('v-petalshore',  'Petalshore',      70,  170, 12, 5, 15.2, '#14532d','#34d399','#6ee7b7','#10b981', 'plains'),
  ],
};

// =====================================================
// FENNOX - Orange volcanic planet with lava & deserts
// =====================================================
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
    gridColor: 'rgba(249, 115, 22, 0.12)',
    clouds: { count: 12, color: 'rgba(255, 180, 100, 0.18)', speed: 0.12, opacity: 0.2 },
  },
  countries: [
    c('f-embercrest',  'Embercrest',       35,   20, 22, 7, 10.5, '#9a3412','#fb923c','#fdba74','#f97316', 'volcanic'),
    c('f-ashplain',    'Ashplain',        -30,  -60, 20, 6, 11.8, '#7c2d12','#ea580c','#fed7aa','#f97316', 'desert'),
    c('f-pyrelands',   'Pyrelands',         0,  130, 26, 8, 12.3, '#c2410c','#fb923c','#ffedd5','#ea580c', 'volcanic'),
    c('f-moltenreach', 'Moltenreach',     -60,  100, 16, 6, 13.7, '#9a3412','#f97316','#fdba74','#ea580c', 'volcanic'),
    c('f-cinders',     'Cinders',          50, -130, 14, 5, 14.1, '#7c2d12','#fb923c','#fed7aa','#f97316', 'desert'),
    c('f-scorchwall',  'Scorchwall',       65,   70, 16, 7, 14.9, '#9a3412','#ea580c','#fdba74','#c2410c', 'mountain'),
    c('f-driftash',    'Driftash',        -15,  -10, 18, 6, 15.6, '#7c2d12','#fb923c','#ffedd5','#f97316', 'desert'),
    c('f-infernia',    'Infernia',        -45,  -140, 14, 7, 16.3, '#c2410c','#f97316','#fdba74','#ea580c', 'volcanic'),
    c('f-dustveil',    'Dustveil',         20,  -90, 16, 6, 17.0, '#9a3412','#ea580c','#fed7aa','#c2410c', 'desert'),
    c('f-magmora',     'Magmora',          40,  170, 12, 5, 17.7, '#7c2d12','#fb923c','#ffedd5','#f97316', 'volcanic'),
    c('f-sandrift',    'Sandrift',        -70,    0, 12, 5, 18.4, '#9a3412','#f97316','#fdba74','#ea580c', 'tundra'),
  ],
};

export const ALL_PLANETS: Planet[] = [PLANET_ZYRATH, PLANET_VELOQOR, PLANET_FENNOX];
