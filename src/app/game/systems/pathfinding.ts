import { TilePos } from '../engine/types';
import { GameMap } from '../map/game-map';

interface AStarNode {
  tx: number;
  ty: number;
  g: number;
  h: number;
  f: number;
  parent: AStarNode | null;
}

export class Pathfinding {
  static findPath(map: GameMap, start: TilePos, end: TilePos, occupiedTiles?: Set<string>): TilePos[] {
    if (!map.inBounds(end.tx, end.ty) || !map.isWalkable(end.tx, end.ty)) {
      return [];
    }

    const open: AStarNode[] = [];
    const closed = new Set<string>();
    const key = (tx: number, ty: number) => `${tx},${ty}`;

    const startNode: AStarNode = {
      tx: start.tx,
      ty: start.ty,
      g: 0,
      h: this.heuristic(start, end),
      f: 0,
      parent: null
    };
    startNode.f = startNode.g + startNode.h;
    open.push(startNode);

    const directions = [
      { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
      { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
      { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
      { dx: -1, dy: 1 }, { dx: 1, dy: 1 },
    ];

    let iterations = 0;
    const maxIterations = 2000;

    while (open.length > 0 && iterations < maxIterations) {
      iterations++;

      // Find lowest f
      let lowestIdx = 0;
      for (let i = 1; i < open.length; i++) {
        if (open[i].f < open[lowestIdx].f) lowestIdx = i;
      }
      const current = open.splice(lowestIdx, 1)[0];
      const currentKey = key(current.tx, current.ty);

      if (current.tx === end.tx && current.ty === end.ty) {
        return this.reconstructPath(current);
      }

      closed.add(currentKey);

      for (const dir of directions) {
        const ntx = current.tx + dir.dx;
        const nty = current.ty + dir.dy;
        const nKey = key(ntx, nty);

        if (closed.has(nKey)) continue;
        if (!map.isWalkable(ntx, nty)) continue;
        if (occupiedTiles && occupiedTiles.has(nKey)) continue;

        // Diagonal movement check
        if (dir.dx !== 0 && dir.dy !== 0) {
          if (!map.isWalkable(current.tx + dir.dx, current.ty) ||
              !map.isWalkable(current.tx, current.ty + dir.dy)) {
            continue;
          }
        }

        const g = current.g + (dir.dx !== 0 && dir.dy !== 0 ? 1.414 : 1);
        const existingIdx = open.findIndex(n => n.tx === ntx && n.ty === nty);

        if (existingIdx >= 0) {
          if (g < open[existingIdx].g) {
            open[existingIdx].g = g;
            open[existingIdx].f = g + open[existingIdx].h;
            open[existingIdx].parent = current;
          }
        } else {
          const h = this.heuristic({ tx: ntx, ty: nty }, end);
          open.push({ tx: ntx, ty: nty, g, h, f: g + h, parent: current });
        }
      }
    }

    return [];
  }

  private static heuristic(a: TilePos, b: TilePos): number {
    return Math.abs(a.tx - b.tx) + Math.abs(a.ty - b.ty);
  }

  private static reconstructPath(node: AStarNode): TilePos[] {
    const path: TilePos[] = [];
    let current: AStarNode | null = node;
    while (current) {
      path.unshift({ tx: current.tx, ty: current.ty });
      current = current.parent;
    }
    return path;
  }

  static hasValidPath(map: GameMap, start: TilePos, end: TilePos, occupiedTiles?: Set<string>): boolean {
    return this.findPath(map, start, end, occupiedTiles).length > 0;
  }
}
