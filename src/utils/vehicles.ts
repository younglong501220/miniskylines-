import { TileData, Vehicle } from '../types/game';
import { GRID_SIZE } from './constants';

const VEHICLE_COLORS = ['#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#f43f5e', '#ffffff'];

export function updateVehicles(
  vehicles: Vehicle[],
  grid: TileData[][],
  maxVehicles: number = 18
): Vehicle[] {
  // 1. Gather all road tiles
  const roadTiles: { x: number; y: number }[] = [];
  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE; y++) {
      if (grid[x][y].type === 'road') {
        roadTiles.push({ x, y });
      }
    }
  }

  if (roadTiles.length < 2) return [];

  // Update existing vehicles
  const active: Vehicle[] = [];

  for (const v of vehicles) {
    v.progress += v.speed;
    if (v.progress >= 1) {
      // Vehicle reached target tile, pick next road neighbor
      v.x = v.targetX;
      v.y = v.targetY;
      v.progress = 0;

      // Find valid road neighbors from target tile
      const neighbors: { x: number; y: number }[] = [];
      const dirs = [
        [0, 1],
        [1, 0],
        [0, -1],
        [-1, 0]
      ];
      for (const [dx, dy] of dirs) {
        const nx = v.x + dx;
        const ny = v.y + dy;
        if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE && grid[nx][ny].type === 'road') {
          neighbors.push({ x: nx, y: ny });
        }
      }

      if (neighbors.length > 0) {
        // Pick random next neighbor
        const next = neighbors[Math.floor(Math.random() * neighbors.length)];
        v.targetX = next.x;
        v.targetY = next.y;
        active.push(v);
      }
      // If dead-end or no road, vehicle despawns
    } else {
      active.push(v);
    }
  }

  // Spawn new vehicles if below max
  if (active.length < Math.min(maxVehicles, roadTiles.length / 2)) {
    const start = roadTiles[Math.floor(Math.random() * roadTiles.length)];
    // Find adjacent road
    const dirs = [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0]
    ];
    const neighbors: { x: number; y: number }[] = [];
    for (const [dx, dy] of dirs) {
      const nx = start.x + dx;
      const ny = start.y + dy;
      if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE && grid[nx][ny].type === 'road') {
        neighbors.push({ x: nx, y: ny });
      }
    }

    if (neighbors.length > 0) {
      const target = neighbors[Math.floor(Math.random() * neighbors.length)];
      active.push({
        id: Math.random().toString(36).substring(2, 9),
        x: start.x,
        y: start.y,
        targetX: target.x,
        targetY: target.y,
        progress: 0,
        color: VEHICLE_COLORS[Math.floor(Math.random() * VEHICLE_COLORS.length)],
        speed: 0.025 + Math.random() * 0.02
      });
    }
  }

  return active;
}
