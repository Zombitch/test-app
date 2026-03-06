import { GeoPoint } from '../models';

export interface ScreenPoint {
  x: number;
  y: number;
  visible: boolean;
}

const DEG_TO_RAD = Math.PI / 180;

/**
 * Project a lat/lon point onto a sphere viewed from the front.
 * rotationX controls horizontal rotation (longitude offset).
 * rotationY controls vertical tilt.
 * Returns screen-space x, y relative to globe center, plus visibility.
 */
export function projectGeoPoint(
  point: GeoPoint,
  rotationX: number,
  rotationY: number,
  radius: number,
): ScreenPoint {
  const lat = point.lat * DEG_TO_RAD;
  const lon = point.lon * DEG_TO_RAD + rotationX;

  // Spherical to cartesian
  const cosLat = Math.cos(lat);
  const x3d = cosLat * Math.sin(lon);
  const y3d = Math.sin(lat);
  const z3d = cosLat * Math.cos(lon);

  // Apply vertical tilt (rotation around X axis)
  const cosT = Math.cos(rotationY);
  const sinT = Math.sin(rotationY);
  const y3dR = y3d * cosT - z3d * sinT;
  const z3dR = y3d * sinT + z3d * cosT;

  return {
    x: x3d * radius,
    y: -y3dR * radius,
    visible: z3dR > 0,
  };
}

/**
 * Check if a screen point is inside a polygon using ray casting.
 */
export function pointInPolygon(px: number, py: number, polygon: { x: number; y: number }[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;

    const intersect = ((yi > py) !== (yj > py)) &&
      (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Convert screen coordinates to lat/lon on the sphere surface.
 */
export function screenToGeo(
  sx: number,
  sy: number,
  centerX: number,
  centerY: number,
  radius: number,
  rotationX: number,
  rotationY: number,
): GeoPoint | null {
  const dx = (sx - centerX) / radius;
  const dy = (sy - centerY) / radius;
  const r2 = dx * dx + dy * dy;
  if (r2 > 1) return null;

  const z = Math.sqrt(1 - r2);

  // Reverse vertical tilt
  const cosT = Math.cos(-rotationY);
  const sinT = Math.sin(-rotationY);
  const y3d = -dy * cosT - z * sinT;
  const z3d = -dy * sinT + z * cosT;

  const lat = Math.asin(y3d) / DEG_TO_RAD;
  const lon = (Math.atan2(dx, z3d) - rotationX) / DEG_TO_RAD;

  return { lat, lon };
}
