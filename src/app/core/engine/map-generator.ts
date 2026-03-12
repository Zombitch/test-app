import { Vec2, vec2, randomInt, randomRange } from './math-utils';
import { SectorDef, SectorId } from '../models/sectors.model';

export const TILE_SIZE = 32;

export enum TileType {
  Void = -1,         // deep void outside the network
  Floor = 0,         // standard walkable data lane
  Wall = 1,          // solid architecture barrier
  Objective = 2,
  SideObjective = 3,
  Extraction = 4,
  Spawn = 5,
  Loot = 6,
  Event = 7,
  // Cyber decoration tiles (walkable, visual only)
  DataConduit = 10,   // glowing data-flow lane
  ServerRack = 11,    // decorative server node (wall)
  Terminal = 12,      // interactive-looking terminal (walkable)
  CableBundle = 13,   // cable runs along corridors (walkable)
  VentGrate = 14,     // coolant vent (walkable, visual)
  CorruptedFloor = 15, // glitched/corrupted tile (walkable)
  FirewallGate = 16,  // security barrier decoration (wall)
  MiningRig = 17,     // bitcoin mining hardware (wall)
}

/** Decoration metadata baked into the map */
export interface MapDecoration {
  x: number;
  y: number;
  type: 'server-rack' | 'terminal' | 'cable-h' | 'cable-v' | 'vent' | 'antenna'
    | 'data-pillar' | 'firewall-node' | 'mining-rig' | 'memory-bank' | 'hologram';
  variant: number; // 0-3 for visual variation
}

/** Data stream particle path embedded in map */
export interface DataStream {
  points: Vec2[];
  color: string;
  speed: number;
  width: number;
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
  decorations: MapDecoration[];
  dataStreams: DataStream[];
  networkEdges: [Vec2, Vec2][]; // visible "network links" between rooms
  roomCenters: Vec2[];          // for network topology rendering
}

// ─── Room types for themed generation ───────────────────────────

enum RoomType {
  ServerRoom,
  DataHub,
  Corridor,
  CoolantChamber,
  SecurityCheckpoint,
  MiningBay,
  ArchiveVault,
  ProcessingCore,
}

interface Room {
  x: number;
  y: number;
  w: number;
  h: number;
  type: RoomType;
}

// ─── Main generator ─────────────────────────────────────────────

export function generateMap(sector: SectorDef, mapWidth = 50, mapHeight = 50): GameMap {
  const tiles: TileType[][] = [];
  const decorations: MapDecoration[] = [];
  const dataStreams: DataStream[] = [];

  // Fill with void
  for (let y = 0; y < mapHeight; y++) {
    tiles[y] = [];
    for (let x = 0; x < mapWidth; x++) {
      tiles[y][x] = TileType.Void;
    }
  }

  // Generate rooms with sector-appropriate types
  const rooms = generateRooms(mapWidth, mapHeight, sector);

  // Carve rooms with themed interiors
  for (const room of rooms) {
    carveRoom(tiles, room, decorations, sector);
  }

  // Connect rooms with data corridors
  const networkEdges: [Vec2, Vec2][] = [];
  for (let i = 0; i < rooms.length - 1; i++) {
    const a = roomCenter(rooms[i]);
    const b = roomCenter(rooms[i + 1]);
    carveDataCorridor(tiles, a, b, mapWidth, mapHeight, decorations, sector);
    networkEdges.push([
      vec2(a.x * TILE_SIZE + TILE_SIZE / 2, a.y * TILE_SIZE + TILE_SIZE / 2),
      vec2(b.x * TILE_SIZE + TILE_SIZE / 2, b.y * TILE_SIZE + TILE_SIZE / 2),
    ]);
  }
  // Add a few cross-links for network topology feel
  for (let i = 0; i < rooms.length - 2; i += 3) {
    const j = Math.min(i + 2, rooms.length - 1);
    const a = roomCenter(rooms[i]);
    const b = roomCenter(rooms[j]);
    carveDataCorridor(tiles, a, b, mapWidth, mapHeight, decorations, sector);
    networkEdges.push([
      vec2(a.x * TILE_SIZE + TILE_SIZE / 2, a.y * TILE_SIZE + TILE_SIZE / 2),
      vec2(b.x * TILE_SIZE + TILE_SIZE / 2, b.y * TILE_SIZE + TILE_SIZE / 2),
    ]);
  }

  // Generate data streams along corridors
  for (const edge of networkEdges) {
    if (Math.random() > 0.4) {
      dataStreams.push({
        points: [edge[0], edge[1]],
        color: sectorStreamColor(sector),
        speed: randomRange(40, 120),
        width: randomRange(1, 3),
      });
    }
  }

  // Place key points
  const spawnRoom = rooms[0];
  const spawnPoint = roomCenter(spawnRoom);
  tiles[spawnPoint.y][spawnPoint.x] = TileType.Spawn;

  const objectiveRoom = rooms[rooms.length - 1];
  const objectivePoint = roomCenter(objectiveRoom);
  tiles[objectivePoint.y][objectivePoint.x] = TileType.Objective;

  const extractionIdx = Math.floor(rooms.length / 2);
  const extractionRoom = rooms[extractionIdx];
  const extractionPoint = roomCenter(extractionRoom);
  tiles[extractionPoint.y][extractionPoint.x] = TileType.Extraction;

  let sideObjectivePoint: Vec2 | null = null;
  if (rooms.length > 4) {
    const sideRoom = rooms[Math.floor(rooms.length * 0.75)];
    sideObjectivePoint = roomCenter(sideRoom);
    tiles[sideObjectivePoint.y][sideObjectivePoint.x] = TileType.SideObjective;
  }

  // Enemy spawn points
  const enemySpawnPoints: Vec2[] = [];
  for (let i = 1; i < rooms.length; i++) {
    if (i === extractionIdx) continue;
    const center = roomCenter(rooms[i]);
    enemySpawnPoints.push(center);
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
    if (tiles[eventPos.y]?.[eventPos.x] === TileType.Floor ||
        tiles[eventPos.y]?.[eventPos.x] === TileType.Terminal) {
      tiles[eventPos.y][eventPos.x] = TileType.Event;
      eventPoints.push(eventPos);
    }
  }

  const roomCenters = rooms.map(r => {
    const c = roomCenter(r);
    return vec2(c.x * TILE_SIZE + TILE_SIZE / 2, c.y * TILE_SIZE + TILE_SIZE / 2);
  });

  return {
    width: mapWidth,
    height: mapHeight,
    tiles,
    spawnPoint: toWorld(spawnPoint),
    objectivePoint: toWorld(objectivePoint),
    sideObjectivePoint: sideObjectivePoint ? toWorld(sideObjectivePoint) : null,
    extractionPoint: toWorld(extractionPoint),
    enemySpawnPoints: enemySpawnPoints.map(toWorld),
    eventPoints: eventPoints.map(toWorld),
    decorations,
    dataStreams,
    networkEdges,
    roomCenters,
  };
}

// ─── Room carving with themed interiors ─────────────────────────

function carveRoom(
  tiles: TileType[][],
  room: Room,
  decorations: MapDecoration[],
  sector: SectorDef,
): void {
  const { x, y, w, h, type } = room;

  // Carve walls border then floor interior
  for (let ry = y; ry < y + h; ry++) {
    for (let rx = x; rx < x + w; rx++) {
      if (!inBounds(tiles, rx, ry)) continue;
      const isEdge = ry === y || ry === y + h - 1 || rx === x || rx === x + w - 1;
      tiles[ry][rx] = isEdge ? TileType.Wall : TileType.Floor;
    }
  }

  // Themed interior decorations
  switch (type) {
    case RoomType.ServerRoom:
      // Server racks along walls
      for (let ry = y + 2; ry < y + h - 2; ry += 2) {
        if (inBounds(tiles, x + 1, ry)) {
          tiles[ry][x + 1] = TileType.ServerRack;
          decorations.push({ x: x + 1, y: ry, type: 'server-rack', variant: randomInt(0, 3) });
        }
        if (inBounds(tiles, x + w - 2, ry)) {
          tiles[ry][x + w - 2] = TileType.ServerRack;
          decorations.push({ x: x + w - 2, y: ry, type: 'server-rack', variant: randomInt(0, 3) });
        }
      }
      // Central data conduit
      for (let rx = x + 2; rx < x + w - 2; rx++) {
        const cy = y + Math.floor(h / 2);
        if (inBounds(tiles, rx, cy)) tiles[cy][rx] = TileType.DataConduit;
      }
      break;

    case RoomType.DataHub:
      // Terminal cluster in center
      const cx = x + Math.floor(w / 2);
      const cy = y + Math.floor(h / 2);
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx === 0 && dy === 0) continue;
          if (inBounds(tiles, cx + dx, cy + dy) && tiles[cy + dy][cx + dx] === TileType.Floor) {
            tiles[cy + dy][cx + dx] = TileType.Terminal;
            decorations.push({ x: cx + dx, y: cy + dy, type: 'terminal', variant: randomInt(0, 3) });
          }
        }
      }
      // Central hologram
      decorations.push({ x: cx, y: cy, type: 'hologram', variant: 0 });
      break;

    case RoomType.CoolantChamber:
      // Vent grates in a grid
      for (let ry = y + 2; ry < y + h - 1; ry += 3) {
        for (let rx = x + 2; rx < x + w - 1; rx += 3) {
          if (inBounds(tiles, rx, ry) && tiles[ry][rx] === TileType.Floor) {
            tiles[ry][rx] = TileType.VentGrate;
            decorations.push({ x: rx, y: ry, type: 'vent', variant: randomInt(0, 2) });
          }
        }
      }
      break;

    case RoomType.SecurityCheckpoint:
      // Firewall gates at entries
      const midY = y + Math.floor(h / 2);
      if (inBounds(tiles, x + 1, midY)) {
        tiles[midY][x + 1] = TileType.FirewallGate;
        decorations.push({ x: x + 1, y: midY, type: 'firewall-node', variant: 0 });
      }
      if (inBounds(tiles, x + w - 2, midY)) {
        tiles[midY][x + w - 2] = TileType.FirewallGate;
        decorations.push({ x: x + w - 2, y: midY, type: 'firewall-node', variant: 1 });
      }
      break;

    case RoomType.MiningBay:
      // Mining rigs scattered
      for (let i = 0; i < 3; i++) {
        const rx = x + randomInt(2, w - 3);
        const ry = y + randomInt(2, h - 3);
        if (inBounds(tiles, rx, ry) && tiles[ry][rx] === TileType.Floor) {
          tiles[ry][rx] = TileType.MiningRig;
          decorations.push({ x: rx, y: ry, type: 'mining-rig', variant: randomInt(0, 2) });
        }
      }
      // Corrupted floor patches
      for (let ry = y + 1; ry < y + h - 1; ry++) {
        for (let rx = x + 1; rx < x + w - 1; rx++) {
          if (tiles[ry][rx] === TileType.Floor && Math.random() < 0.15) {
            tiles[ry][rx] = TileType.CorruptedFloor;
          }
        }
      }
      break;

    case RoomType.ArchiveVault:
      // Memory banks along walls
      for (let rx = x + 2; rx < x + w - 2; rx += 2) {
        if (inBounds(tiles, rx, y + 1)) {
          tiles[y + 1][rx] = TileType.ServerRack;
          decorations.push({ x: rx, y: y + 1, type: 'memory-bank', variant: randomInt(0, 3) });
        }
        if (inBounds(tiles, rx, y + h - 2)) {
          tiles[y + h - 2][rx] = TileType.ServerRack;
          decorations.push({ x: rx, y: y + h - 2, type: 'memory-bank', variant: randomInt(0, 3) });
        }
      }
      break;

    case RoomType.ProcessingCore:
      // Data conduits in cross pattern
      for (let rx = x + 2; rx < x + w - 2; rx++) {
        const midRow = y + Math.floor(h / 2);
        if (inBounds(tiles, rx, midRow)) tiles[midRow][rx] = TileType.DataConduit;
      }
      for (let ry = y + 2; ry < y + h - 2; ry++) {
        const midCol = x + Math.floor(w / 2);
        if (inBounds(tiles, midCol, ry)) tiles[ry][midCol] = TileType.DataConduit;
      }
      // Data pillars at corners
      const offsets = [[2, 2], [w - 3, 2], [2, h - 3], [w - 3, h - 3]];
      for (const [ox, oy] of offsets) {
        if (inBounds(tiles, x + ox, y + oy)) {
          decorations.push({ x: x + ox, y: y + oy, type: 'data-pillar', variant: randomInt(0, 3) });
        }
      }
      break;

    default:
      // Basic room — just add some cable decorations
      if (w > 4) {
        for (let rx = x + 1; rx < x + w - 1; rx++) {
          if (Math.random() < 0.1 && inBounds(tiles, rx, y + 1)) {
            tiles[y + 1][rx] = TileType.CableBundle;
            decorations.push({ x: rx, y: y + 1, type: 'cable-h', variant: 0 });
          }
        }
      }
      break;
  }
}

// ─── Data corridor carving ──────────────────────────────────────

function carveDataCorridor(
  tiles: TileType[][],
  a: Vec2, b: Vec2,
  mapW: number, mapH: number,
  decorations: MapDecoration[],
  sector: SectorDef,
): void {
  let x = a.x;
  let y = a.y;

  // Horizontal first
  while (x !== b.x) {
    for (let dy = -1; dy <= 1; dy++) {
      if (inBounds(tiles, x, y + dy)) {
        if (dy === 0) {
          // Center: data conduit lane
          if (tiles[y][x] === TileType.Void) {
            tiles[y][x] = TileType.DataConduit;
          }
        } else {
          // Sides: wall or floor
          if (tiles[y + dy][x] === TileType.Void) {
            tiles[y + dy][x] = TileType.Floor;
          }
        }
      }
    }
    // Cable decorations along corridor
    if (Math.random() < 0.06) {
      decorations.push({ x, y: y - 1, type: 'cable-h', variant: randomInt(0, 2) });
    }
    x += x < b.x ? 1 : -1;
  }

  // Vertical
  while (y !== b.y) {
    for (let dx = -1; dx <= 1; dx++) {
      if (inBounds(tiles, x + dx, y)) {
        if (dx === 0) {
          if (tiles[y][x] === TileType.Void) {
            tiles[y][x] = TileType.DataConduit;
          }
        } else {
          if (tiles[y][x + dx] === TileType.Void) {
            tiles[y][x + dx] = TileType.Floor;
          }
        }
      }
    }
    if (Math.random() < 0.06) {
      decorations.push({ x: x - 1, y, type: 'cable-v', variant: randomInt(0, 2) });
    }
    y += y < b.y ? 1 : -1;
  }
}

// ─── Room generation ────────────────────────────────────────────

function generateRooms(mapW: number, mapH: number, sector: SectorDef): Room[] {
  const rooms: Room[] = [];
  const attempts = 40;
  const roomTypes = sectorRoomTypes(sector);

  for (let i = 0; i < attempts; i++) {
    const w = randomInt(5, 10);
    const h = randomInt(5, 10);
    const x = randomInt(2, mapW - w - 2);
    const y = randomInt(2, mapH - h - 2);
    const type = roomTypes[i % roomTypes.length];
    const room: Room = { x, y, w, h, type };

    const overlaps = rooms.some(r =>
      room.x < r.x + r.w + 2 && room.x + room.w + 2 > r.x &&
      room.y < r.y + r.h + 2 && room.y + room.h + 2 > r.y
    );

    if (!overlaps) rooms.push(room);
  }

  rooms.sort((a, b) => (a.x + a.y) - (b.x + b.y));

  return rooms.length >= 5 ? rooms : generateRooms(mapW, mapH, sector);
}

function sectorRoomTypes(sector: SectorDef): RoomType[] {
  switch (sector.id) {
    case SectorId.CacheWastes:
      return [RoomType.ServerRoom, RoomType.ArchiveVault, RoomType.Corridor, RoomType.DataHub];
    case SectorId.CoolantCathedrals:
      return [RoomType.CoolantChamber, RoomType.ProcessingCore, RoomType.ServerRoom, RoomType.Corridor];
    case SectorId.KernelBastion:
      return [RoomType.SecurityCheckpoint, RoomType.ProcessingCore, RoomType.DataHub, RoomType.ArchiveVault];
    case SectorId.HashForge:
      return [RoomType.MiningBay, RoomType.Corridor, RoomType.DataHub, RoomType.MiningBay];
    case SectorId.ArcheDock:
      return [RoomType.ProcessingCore, RoomType.ArchiveVault, RoomType.DataHub, RoomType.SecurityCheckpoint];
    default:
      return [RoomType.ServerRoom, RoomType.DataHub, RoomType.Corridor];
  }
}

function sectorStreamColor(sector: SectorDef): string {
  switch (sector.id) {
    case SectorId.CacheWastes: return 'rgba(136, 192, 208, 0.4)';
    case SectorId.CoolantCathedrals: return 'rgba(143, 188, 187, 0.5)';
    case SectorId.KernelBastion: return 'rgba(94, 129, 172, 0.5)';
    case SectorId.HashForge: return 'rgba(208, 135, 112, 0.4)';
    case SectorId.ArcheDock: return 'rgba(235, 203, 139, 0.3)';
    default: return 'rgba(136, 192, 208, 0.3)';
  }
}

// ─── Helpers ────────────────────────────────────────────────────

function roomCenter(room: Room): Vec2 {
  return vec2(Math.floor(room.x + room.w / 2), Math.floor(room.y + room.h / 2));
}

function toWorld(tilePos: Vec2): Vec2 {
  return vec2(tilePos.x * TILE_SIZE + TILE_SIZE / 2, tilePos.y * TILE_SIZE + TILE_SIZE / 2);
}

function inBounds(tiles: TileType[][], x: number, y: number): boolean {
  return y >= 0 && y < tiles.length && x >= 0 && x < tiles[0].length;
}

/** Check if a world position is walkable */
export function isWalkable(map: GameMap, worldX: number, worldY: number): boolean {
  const tileX = Math.floor(worldX / TILE_SIZE);
  const tileY = Math.floor(worldY / TILE_SIZE);
  if (tileX < 0 || tileX >= map.width || tileY < 0 || tileY >= map.height) return false;
  const tile = map.tiles[tileY][tileX];
  // Non-walkable tiles
  return tile !== TileType.Void &&
         tile !== TileType.Wall &&
         tile !== TileType.ServerRack &&
         tile !== TileType.FirewallGate &&
         tile !== TileType.MiningRig;
}
