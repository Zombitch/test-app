/** 2D Vector */
export interface Vec2 {
  x: number;
  y: number;
}

export function vec2(x: number, y: number): Vec2 {
  return { x, y };
}

export function vec2Add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function vec2Sub(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function vec2Scale(v: Vec2, s: number): Vec2 {
  return { x: v.x * s, y: v.y * s };
}

export function vec2Length(v: Vec2): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

export function vec2Normalize(v: Vec2): Vec2 {
  const len = vec2Length(v);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

export function vec2Dist(a: Vec2, b: Vec2): number {
  return vec2Length(vec2Sub(a, b));
}

export function vec2Angle(from: Vec2, to: Vec2): number {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

export function vec2FromAngle(angle: number, magnitude = 1): Vec2 {
  return { x: Math.cos(angle) * magnitude, y: Math.sin(angle) * magnitude };
}

export function vec2Lerp(a: Vec2, b: Vec2, t: number): Vec2 {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/** Axis-Aligned Bounding Box */
export interface AABB {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function aabbOverlap(a: AABB, b: AABB): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/** Circle collision */
export function circleOverlap(
  posA: Vec2, radiusA: number,
  posB: Vec2, radiusB: number,
): boolean {
  return vec2Dist(posA, posB) < radiusA + radiusB;
}

/** Clamp a number */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Random float in range */
export function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** Random integer in range [min, max] */
export function randomInt(min: number, max: number): number {
  return Math.floor(randomRange(min, max + 1));
}

/** Degrees to radians */
export function degToRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
