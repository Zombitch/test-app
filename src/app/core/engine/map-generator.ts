import { Vec2, vec2, randomInt, randomRange } from './math-utils';
import { SectorDef } from '../models/sectors.model';

export const TILE_SIZE = 32;

export enum TileType {
  Floor = 0,
  Wall = 1,
  Objective = 2,
  SideObjective = 3,
  Extraction = 4,
  Spawn = 5,
  Loot = 6,
  Event = 7,
}

export interface GameMap {
  width: number;
  height: number;
  tiles: TileType[][];
  spawnPoint: Vec2;
  objectivePoint: Vec2;
  sideObjectivePoint: Vec2 | null;
  extractionPoint: Vec2;
  enemySpawnPoints: Vec2[];
  eventPoints: Vec2[];
}

/** Generate a procedural sector map */
export function generateMap(sector: SectorDef, mapWidth = 40, mapHeight = 40): GameMap {
  const tiles: TileType[][] = [];

  // Fill with walls
  for (let y = 0; y < mapHeight; y++) {
    tiles[y] = [];
    for (let x = 0; x < mapWidth; x++) {
      tiles[y][x] = TileType.Wall;
    }
  }

  // Carve rooms using BSP-like approach
  const rooms = generateRooms(mapWidth, mapHeight);

  for (const room of rooms) {
    for (let y = room.y; y < room.y + room.h; y++) {
      for (let x = room.x; x < room.x + room.w; x++) {
        if (y >= 0 && y < mapHeight && x >= 0 && x < mapWidth) {
          tiles[y][x] = TileType.Floor;
        }
      }
    }
  }

  // Connect rooms with corridors
  for (let i = 0; i < rooms.length - 1; i++) {
    const a = roomCenter(rooms[i]);
    const b = roomCenter(rooms[i + 1]);
    carveCorridor(tiles, a, b, mapWidth, mapHeight);
  }

  // Place key points
  const spawnRoom = rooms[0];
  const spawnPoint = roomCenter(spawnRoom);
  tiles[spawnPoint.y][spawnPoint.x] = TileType.Spawn;

  const objectiveRoom = rooms[rooms.length - 1];
  const objectivePoint = roomCenter(objectiveRoom);
  tiles[objectivePoint.y][objectivePoint.x] = TileType.Objective;

  const extractionRoom = rooms[Math.floor(rooms.length / 2)];
  const extractionPoint = roomCenter(extractionRoom);
  tiles[extractionPoint.y][extractionPoint.x] = TileType.Extraction;

  let sideObjectivePoint: Vec2 | null = null;
  if (rooms.length > 3) {
    const sideRoom = rooms[Math.floor(rooms.length * 0.75)];
    sideObjectivePoint = roomCenter(sideRoom);
    tiles[sideObjectivePoint.y][sideObjectivePoint.x] = TileType.SideObjective;
  }

  // Enemy spawn points in most rooms
  const enemySpawnPoints: Vec2[] = [];
  for (let i = 1; i < rooms.length; i++) {
    if (i === Math.floor(rooms.length / 2)) continue; // skip extraction room
    const center = roomCenter(rooms[i]);
    enemySpawnPoints.push(center);
    // Add offset spawns in larger rooms
    if (rooms[i].w > 5 && rooms[i].h > 5) {
      enemySpawnPoints.push(vec2(center.x + 2, center.y + 2));
      enemySpawnPoints.push(vec2(center.x - 2, center.y - 2));
    }
  }

  // Event points
  const eventPoints: Vec2[] = [];
  for (let i = 2; i < rooms.length - 1; i += 2) {
    const center = roomCenter(rooms[i]);
    const eventPos = vec2(center.x + 1, center.y);
    if (tiles[eventPos.y]?.[eventPos.x] === TileType.Floor) {
      tiles[eventPos.y][eventPos.x] = TileType.Event;
      eventPoints.push(eventPos);
    }
  }

  return {
    width: mapWidth,
    height: mapHeight,
    tiles,
    spawnPoint: vec2(spawnPoint.x * TILE_SIZE + TILE_SIZE / 2, spawnPoint.y * TILE_SIZE + TILE_SIZE / 2),
    objectivePoint: vec2(objectivePoint.x * TILE_SIZE + TILE_SIZE / 2, objectivePoint.y * TILE_SIZE + TILE_SIZE / 2),
    sideObjectivePoint: sideObjectivePoint
      ? vec2(sideObjectivePoint.x * TILE_SIZE + TILE_SIZE / 2, sideObjectivePoint.y * TILE_SIZE + TILE_SIZE / 2)
      : null,
    extractionPoint: vec2(extractionPoint.x * TILE_SIZE + TILE_SIZE / 2, extractionPoint.y * TILE_SIZE + TILE_SIZE / 2),
    enemySpawnPoints: enemySpawnPoints.map(p => vec2(p.x * TILE_SIZE + TILE_SIZE / 2, p.y * TILE_SIZE + TILE_SIZE / 2)),
    eventPoints: eventPoints.map(p => vec2(p.x * TILE_SIZE + TILE_SIZE / 2, p.y * TILE_SIZE + TILE_SIZE / 2)),
  };
}

interface Room {
  x: number;
  y: number;
  w: number;
  h: number;
}

function generateRooms(mapW: number, mapH: number): Room[] {
  const rooms: Room[] = [];
  const attempts = 30;

  for (let i = 0; i < attempts; i++) {
    const w = randomInt(4, 8);
    const h = randomInt(4, 8);
    const x = randomInt(1, mapW - w - 1);
    const y = randomInt(1, mapH - h - 1);
    const room: Room = { x, y, w, h };

    const overlaps = rooms.some(r =>
      room.x < r.x + r.w + 1 && room.x + room.w + 1 > r.x &&
      room.y < r.y + r.h + 1 && room.y + room.h + 1 > r.y
    );

    if (!overlaps) {
      rooms.push(room);
    }
  }

  // Sort by position for corridor generation
  rooms.sort((a, b) => a.x + a.y - b.x - b.y);

  return rooms.length >= 4 ? rooms : generateRooms(mapW, mapH);
}

function roomCenter(room: Room): Vec2 {
  return vec2(Math.floor(room.x + room.w / 2), Math.floor(room.y + room.h / 2));
}

function carveCorridor(tiles: TileType[][], a: Vec2, b: Vec2, mapW: number, mapH: number): void {
  let x = a.x;
  let y = a.y;

  while (x !== b.x) {
    if (y >= 0 && y < mapH && x >= 0 && x < mapW) {
      tiles[y][x] = TileType.Floor;
      // Make corridor 2 tiles wide
      if (y + 1 < mapH) tiles[y + 1][x] = TileType.Floor;
    }
    x += x < b.x ? 1 : -1;
  }

  while (y !== b.y) {
    if (y >= 0 && y < mapH && x >= 0 && x < mapW) {
      tiles[y][x] = TileType.Floor;
      if (x + 1 < mapW) tiles[y][x + 1] = TileType.Floor;
    }
    y += y < b.y ? 1 : -1;
  }
}

/** Check if a world position is walkable */
export function isWalkable(map: GameMap, worldX: number, worldY: number): boolean {
  const tileX = Math.floor(worldX / TILE_SIZE);
  const tileY = Math.floor(worldY / TILE_SIZE);
  if (tileX < 0 || tileX >= map.width || tileY < 0 || tileY >= map.height) return false;
  return map.tiles[tileY][tileX] !== TileType.Wall;
}
