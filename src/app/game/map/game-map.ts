import { TileType, TilePos, Position } from '../engine/types';
import { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE } from '../engine/constants';

export class GameMap {
  tiles: TileType[][];
  width = MAP_WIDTH;
  height = MAP_HEIGHT;

  survivorSpawns: TilePos[] = [];
  vampireSpawns: TilePos[] = [];
  goldSpots: TilePos[] = [];
  woodSpots: TilePos[] = [];

  constructor() {
    this.tiles = [];
    for (let y = 0; y < this.height; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < this.width; x++) {
        this.tiles[y][x] = TileType.GRASS;
      }
    }
    this.generateMap();
  }

  private generateMap(): void {
    // Border walls
    for (let x = 0; x < this.width; x++) {
      this.tiles[0][x] = TileType.BLOCKED;
      this.tiles[this.height - 1][x] = TileType.BLOCKED;
    }
    for (let y = 0; y < this.height; y++) {
      this.tiles[y][0] = TileType.BLOCKED;
      this.tiles[y][this.width - 1] = TileType.BLOCKED;
    }

    // Survivor spawn points (distributed around center)
    const cx = Math.floor(this.width / 2);
    const cy = Math.floor(this.height / 2);
    const spawnOffsets = [
      { tx: cx - 5, ty: cy - 5 },
      { tx: cx + 5, ty: cy - 5 },
      { tx: cx - 5, ty: cy + 5 },
      { tx: cx + 5, ty: cy + 5 },
      { tx: cx, ty: cy - 7 },
      { tx: cx, ty: cy + 7 },
      { tx: cx - 7, ty: cy },
      { tx: cx + 7, ty: cy },
    ];
    for (const sp of spawnOffsets) {
      this.tiles[sp.ty][sp.tx] = TileType.SPAWN_SURVIVOR;
      this.survivorSpawns.push(sp);
    }

    // Vampire spawn points (at map edges)
    const vampSpawns = [
      { tx: 3, ty: 3 },
      { tx: this.width - 4, ty: 3 },
      { tx: 3, ty: this.height - 4 },
      { tx: this.width - 4, ty: this.height - 4 },
    ];
    for (const vp of vampSpawns) {
      this.tiles[vp.ty][vp.tx] = TileType.SPAWN_VAMPIRE;
      this.vampireSpawns.push(vp);
    }

    // Gold resource spots
    const goldPositions = [
      { tx: cx - 10, ty: cy - 10 },
      { tx: cx + 10, ty: cy - 10 },
      { tx: cx - 10, ty: cy + 10 },
      { tx: cx + 10, ty: cy + 10 },
      { tx: cx, ty: cy - 12 },
      { tx: cx, ty: cy + 12 },
      { tx: cx - 12, ty: cy },
      { tx: cx + 12, ty: cy },
    ];
    for (const gp of goldPositions) {
      if (this.inBounds(gp.tx, gp.ty)) {
        this.tiles[gp.ty][gp.tx] = TileType.RESOURCE_GOLD;
        this.goldSpots.push(gp);
      }
    }

    // Wood resource spots
    const woodPositions = [
      { tx: cx - 8, ty: cy },
      { tx: cx + 8, ty: cy },
      { tx: cx, ty: cy - 8 },
      { tx: cx, ty: cy + 8 },
      { tx: cx - 6, ty: cy - 8 },
      { tx: cx + 6, ty: cy + 8 },
    ];
    for (const wp of woodPositions) {
      if (this.inBounds(wp.tx, wp.ty)) {
        this.tiles[wp.ty][wp.tx] = TileType.RESOURCE_WOOD;
        this.woodSpots.push(wp);
      }
    }

    // Scatter some terrain obstacles
    const rng = this.seededRandom(42);
    for (let i = 0; i < 60; i++) {
      const rx = Math.floor(rng() * (this.width - 4)) + 2;
      const ry = Math.floor(rng() * (this.height - 4)) + 2;
      if (this.tiles[ry][rx] === TileType.GRASS) {
        // Small rock clusters
        this.tiles[ry][rx] = TileType.BLOCKED;
        if (rng() > 0.5 && this.inBounds(rx + 1, ry) && this.tiles[ry][rx + 1] === TileType.GRASS) {
          this.tiles[ry][rx + 1] = TileType.BLOCKED;
        }
      }
    }
  }

  private seededRandom(seed: number): () => number {
    let s = seed;
    return () => {
      s = (s * 16807 + 0) % 2147483647;
      return s / 2147483647;
    };
  }

  inBounds(tx: number, ty: number): boolean {
    return tx >= 0 && tx < this.width && ty >= 0 && ty < this.height;
  }

  isWalkable(tx: number, ty: number): boolean {
    if (!this.inBounds(tx, ty)) return false;
    return this.tiles[ty][tx] !== TileType.BLOCKED;
  }

  isBuildable(tx: number, ty: number): boolean {
    if (!this.inBounds(tx, ty)) return false;
    return this.tiles[ty][tx] === TileType.GRASS;
  }

  worldToTile(x: number, y: number): TilePos {
    return {
      tx: Math.floor(x / TILE_SIZE),
      ty: Math.floor(y / TILE_SIZE)
    };
  }

  tileToWorld(tx: number, ty: number): Position {
    return {
      x: tx * TILE_SIZE + TILE_SIZE / 2,
      y: ty * TILE_SIZE + TILE_SIZE / 2
    };
  }
}
