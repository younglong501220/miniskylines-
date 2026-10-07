import { DayNightCycle, TileData, Vehicle } from '../types/game';
import { GRID_SIZE, TILE_H, TILE_W, TOOL_DEFINITIONS } from './constants';

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export function rotateCoord(gx: number, gy: number, rotation: 0 | 1 | 2 | 3): { rx: number; ry: number } {
  const max = GRID_SIZE - 1;
  switch (rotation) {
    case 0:
      return { rx: gx, ry: gy };
    case 1:
      return { rx: gy, ry: max - gx };
    case 2:
      return { rx: max - gx, ry: max - gy };
    case 3:
      return { rx: max - gy, ry: gx };
  }
}

export function unrotateCoord(rx: number, ry: number, rotation: 0 | 1 | 2 | 3): { gx: number; gy: number } {
  const max = GRID_SIZE - 1;
  switch (rotation) {
    case 0:
      return { gx: rx, gy: ry };
    case 1:
      return { gx: max - ry, gy: rx };
    case 2:
      return { gx: max - rx, gy: max - ry };
    case 3:
      return { gx: ry, gy: max - rx };
  }
}

export function toScreen(
  gx: number,
  gy: number,
  camera: Camera,
  rotation: 0 | 1 | 2 | 3 = 0
): { x: number; y: number } {
  const { rx, ry } = rotateCoord(gx, gy, rotation);
  const isoX = (rx - ry) * (TILE_W / 2);
  const isoY = (rx + ry) * (TILE_H / 2);
  return {
    x: isoX * camera.zoom + camera.x,
    y: isoY * camera.zoom + camera.y
  };
}

export function toGrid(
  sx: number,
  sy: number,
  camera: Camera,
  rotation: 0 | 1 | 2 | 3 = 0
): { x: number; y: number } {
  const normX = (sx - camera.x) / camera.zoom;
  const normY = (sy - camera.y) / camera.zoom;
  const rx = Math.floor((normY / (TILE_H / 2) + normX / (TILE_W / 2)) / 2);
  const ry = Math.floor((normY / (TILE_H / 2) - normX / (TILE_W / 2)) / 2);
  const { gx, gy } = unrotateCoord(rx, ry, rotation);
  return { x: gx, y: gy };
}

// Check neighbor road connections relative to screen view
export function getRoadNeighbors(grid: TileData[][], rx: number, ry: number, rotation: 0 | 1 | 2 | 3) {
  const checkNeighbor = (drx: number, dry: number) => {
    const nrx = rx + drx;
    const nry = ry + dry;
    if (nrx < 0 || nrx >= GRID_SIZE || nry < 0 || nry >= GRID_SIZE) return false;
    const { gx, gy } = unrotateCoord(nrx, nry, rotation);
    return grid[gx]?.[gy]?.type === 'road';
  };

  return {
    n: checkNeighbor(0, -1),
    s: checkNeighbor(0, 1),
    w: checkNeighbor(-1, 0),
    e: checkNeighbor(1, 0)
  };
}

export class CityRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animTick: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  public render(
    grid: TileData[][],
    camera: Camera,
    hoveredTile: { x: number; y: number },
    selectedTile: { x: number; y: number } | null,
    timeOfDay: DayNightCycle,
    vehicles: Vehicle[],
    gridVisible: boolean,
    activeTool: string,
    rotation: 0 | 1 | 2 | 3 = 0,
    isEarthquakeActive: boolean = false
  ) {
    this.animTick++;
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Camera screen shake during earthquake
    let shakeX = 0;
    let shakeY = 0;
    if (isEarthquakeActive) {
      shakeX = (Math.random() - 0.5) * 5;
      shakeY = (Math.random() - 0.5) * 5;
    }

    ctx.save();
    ctx.translate(shakeX, shakeY);

    // Background gradient depending on time of day
    let bgGradient: CanvasGradient;
    if (timeOfDay === 'night') {
      bgGradient = ctx.createLinearGradient(0, 0, 0, height);
      bgGradient.addColorStop(0, '#090d16');
      bgGradient.addColorStop(1, '#0e1626');
    } else if (timeOfDay === 'sunset') {
      bgGradient = ctx.createLinearGradient(0, 0, 0, height);
      bgGradient.addColorStop(0, '#2c1e2f');
      bgGradient.addColorStop(1, '#1b2234');
    } else {
      bgGradient = ctx.createLinearGradient(0, 0, 0, height);
      bgGradient.addColorStop(0, '#151d28');
      bgGradient.addColorStop(1, '#1e293b');
    }
    ctx.fillStyle = bgGradient;
    ctx.fillRect(-10, -10, width + 20, height + 20);

    const zoom = camera.zoom;
    const halfW = (TILE_W / 2) * zoom;
    const halfH = (TILE_H / 2) * zoom;

    // Render loop ordered by depth rx + ry so isometric occlusion is always 100% correct in all rotations
    for (let depth = 0; depth <= (GRID_SIZE - 1) * 2; depth++) {
      for (let rx = 0; rx < GRID_SIZE; rx++) {
        const ry = depth - rx;
        if (ry < 0 || ry >= GRID_SIZE) continue;

        const { gx, gy } = unrotateCoord(rx, ry, rotation);
        const tile = grid[gx]?.[gy];
        if (!tile) continue;

        // Screen pos
        const isoX = (rx - ry) * (TILE_W / 2);
        const isoY = (rx + ry) * (TILE_H / 2);
        const x = isoX * zoom + camera.x;
        const y = isoY * zoom + camera.y;

        // View frustum culling
        if (x < -160 || x > width + 160 || y < -220 || y > height + 220) {
          continue;
        }

        const isHovered = hoveredTile.x === gx && hoveredTile.y === gy;
        const isSelected = selectedTile?.x === gx && selectedTile?.y === gy;

        this.drawGroundTile(gx, gy, x, y, halfW, halfH, isHovered, isSelected, gridVisible, timeOfDay);

        // Render object / structure
        if (tile.type === 'road') {
          const neighbors = getRoadNeighbors(grid, rx, ry, rotation);
          this.drawRoad(x, y, halfW, halfH, neighbors, zoom, timeOfDay);
        } else if (tile.type !== 'empty') {
          this.drawStructure(tile, x, y, halfW, halfH, zoom, timeOfDay);
        }

        // Render Disasters (Flames or Earthquake Rubble)
        if (tile.disasterState === 'fire') {
          this.drawFlames(x, y + halfH, halfW, halfH, zoom, tile.fireIntensity || 3);
        } else if (tile.disasterState === 'damaged') {
          this.drawDamageRubble(x, y + halfH, halfW, halfH, zoom);
        }

        // Draw preview silhouette if hovered
        if (isHovered && activeTool !== 'inspect' && activeTool !== 'demolish' && activeTool !== 'emergency' && tile.type === 'empty') {
          this.drawPlacementGhost(activeTool, x, y, halfW, halfH, zoom);
        } else if (isHovered && activeTool === 'emergency') {
          this.drawEmergencyTarget(x, y, halfW, halfH, zoom);
        }
      }
    }

    // Render vehicles moving along road network
    this.drawVehicles(vehicles, camera, halfW, halfH, zoom, rotation);

    // Render atmospheric overlay
    this.drawAtmosphere(width, height, timeOfDay);

    ctx.restore();
  }

  // Draw ground isometric diamond
  private drawGroundTile(
    gx: number,
    gy: number,
    x: number,
    y: number,
    halfW: number,
    halfH: number,
    isHovered: boolean,
    isSelected: boolean,
    gridVisible: boolean,
    timeOfDay: DayNightCycle
  ) {
    const ctx = this.ctx;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + halfW, y + halfH);
    ctx.lineTo(x, y + halfH * 2);
    ctx.lineTo(x - halfW, y + halfH);
    ctx.closePath();

    const checker = (gx + gy) % 2 === 0;
    let baseGrass = checker ? '#284631' : '#2d4e36';

    if (timeOfDay === 'night') {
      baseGrass = checker ? '#14251b' : '#182b1f';
    } else if (timeOfDay === 'sunset') {
      baseGrass = checker ? '#2d3e2b' : '#33442f';
    }

    if (isHovered) {
      baseGrass = '#3e6b45';
    } else if (isSelected) {
      baseGrass = '#386374';
    }

    ctx.fillStyle = baseGrass;
    ctx.fill();

    if (gridVisible || isHovered || isSelected) {
      ctx.strokeStyle = isSelected
        ? '#38bdf8'
        : isHovered
        ? '#4ade80'
        : 'rgba(0, 0, 0, 0.25)';
      ctx.lineWidth = isSelected || isHovered ? 2 : 1;
      ctx.stroke();
    }
  }

  // Draw Connected Roads
  private drawRoad(
    x: number,
    y: number,
    halfW: number,
    halfH: number,
    n: { n: boolean; s: boolean; w: boolean; e: boolean },
    zoom: number,
    timeOfDay: DayNightCycle
  ) {
    const ctx = this.ctx;
    const roadColor = timeOfDay === 'night' ? '#22252a' : '#373c44';

    ctx.beginPath();
    ctx.moveTo(x, y + 2 * zoom);
    ctx.lineTo(x + halfW - 3 * zoom, y + halfH);
    ctx.lineTo(x, y + halfH * 2 - 2 * zoom);
    ctx.lineTo(x - halfW + 3 * zoom, y + halfH);
    ctx.closePath();
    ctx.fillStyle = roadColor;
    ctx.fill();

    ctx.strokeStyle = timeOfDay === 'night' ? '#181a1d' : '#2b2f36';
    ctx.lineWidth = 2 * zoom;
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    const cy = y + halfH;
    const dashSize = 2.5 * zoom;

    ctx.fillRect(x - dashSize / 2, cy - dashSize / 2, dashSize, dashSize);

    if (n.n) ctx.fillRect(x + halfW * 0.4 - dashSize / 2, cy - halfH * 0.4 - dashSize / 2, dashSize, dashSize);
    if (n.s) ctx.fillRect(x - halfW * 0.4 - dashSize / 2, cy + halfH * 0.4 - dashSize / 2, dashSize, dashSize);
    if (n.w) ctx.fillRect(x - halfW * 0.4 - dashSize / 2, cy - halfH * 0.4 - dashSize / 2, dashSize, dashSize);
    if (n.e) ctx.fillRect(x + halfW * 0.4 - dashSize / 2, cy + halfH * 0.4 - dashSize / 2, dashSize, dashSize);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1 * zoom;
    ctx.stroke();
  }

  // Draw Animated Fire Flames & Smoke
  private drawFlames(x: number, cy: number, halfW: number, halfH: number, zoom: number, intensity: number) {
    const ctx = this.ctx;
    const flameCount = Math.min(7, 3 + intensity);

    // Glowing fiery base
    ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
    ctx.beginPath();
    ctx.arc(x, cy, halfW * 0.7, 0, Math.PI * 2);
    ctx.fill();

    // Rising smoke clouds
    for (let s = 0; s < 4; s++) {
      const smokeProgress = ((this.animTick * 0.4 + s * 9) % 36) / 36;
      const smokeY = cy - 16 * zoom - smokeProgress * 40 * zoom;
      const smokeX = x + Math.sin(this.animTick * 0.08 + s * 1.5) * 8 * zoom;
      const smokeR = (5 + smokeProgress * 12) * zoom;
      ctx.fillStyle = `rgba(30, 41, 59, ${0.55 - smokeProgress * 0.5})`;
      ctx.beginPath();
      ctx.arc(smokeX, smokeY, smokeR, 0, Math.PI * 2);
      ctx.fill();
    }

    // Flickering tongue of flames
    for (let i = 0; i < flameCount; i++) {
      const offsetSeed = (this.animTick * 0.35 + i * 1.4) % Math.PI;
      const flameH = (16 + Math.sin(offsetSeed) * 14 + intensity * 4) * zoom;
      const flameX = x + (i - flameCount / 2) * 5 * zoom + Math.sin(this.animTick * 0.2 + i) * 3 * zoom;
      const flameW = (5.5 + Math.cos(offsetSeed) * 2) * zoom;

      // Outer crimson/orange flame
      ctx.fillStyle = i % 2 === 0 ? '#ef4444' : '#f97316';
      ctx.beginPath();
      ctx.moveTo(flameX - flameW, cy);
      ctx.quadraticCurveTo(flameX - flameW * 0.5, cy - flameH * 0.6, flameX, cy - flameH);
      ctx.quadraticCurveTo(flameX + flameW * 0.5, cy - flameH * 0.6, flameX + flameW, cy);
      ctx.closePath();
      ctx.fill();

      // Inner bright golden yellow core
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.moveTo(flameX - flameW * 0.5, cy);
      ctx.quadraticCurveTo(flameX - flameW * 0.2, cy - flameH * 0.4, flameX, cy - flameH * 0.7);
      ctx.quadraticCurveTo(flameX + flameW * 0.2, cy - flameH * 0.4, flameX + flameW * 0.5, cy);
      ctx.closePath();
      ctx.fill();
    }

    // Pulsing floating fire disaster badge
    const badgeBob = Math.sin(this.animTick * 0.15) * 3 * zoom;
    const badgeY = cy - 40 * zoom + badgeBob;
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(x, badgeY, 9 * zoom, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fca5a5';
    ctx.lineWidth = 1.5 * zoom;
    ctx.stroke();

    ctx.font = `bold ${10 * zoom}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔥', x, badgeY);
  }

  // Draw Earthquake Rubble & Debris
  private drawDamageRubble(x: number, cy: number, halfW: number, halfH: number, zoom: number) {
    const ctx = this.ctx;

    // Ground earthquake fracture cracks
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.5 * zoom;
    ctx.beginPath();
    ctx.moveTo(x - halfW * 0.6, cy - halfH * 0.3);
    ctx.lineTo(x - halfW * 0.2, cy);
    ctx.lineTo(x + halfW * 0.1, cy - halfH * 0.2);
    ctx.lineTo(x + halfW * 0.7, cy + halfH * 0.35);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x, cy);
    ctx.lineTo(x - halfW * 0.3, cy + halfH * 0.4);
    ctx.stroke();

    // Rising dust puffs
    for (let d = 0; d < 3; d++) {
      const dustProgress = ((this.animTick * 0.3 + d * 12) % 30) / 30;
      const dustY = cy - 8 * zoom - dustProgress * 22 * zoom;
      const dustX = x + (d - 1) * 8 * zoom + Math.sin(this.animTick * 0.1 + d) * 4 * zoom;
      ctx.fillStyle = `rgba(148, 163, 184, ${0.4 - dustProgress * 0.35})`;
      ctx.beginPath();
      ctx.arc(dustX, dustY, (4 + dustProgress * 8) * zoom, 0, Math.PI * 2);
      ctx.fill();
    }

    // Broken concrete slabs & cracked walls
    ctx.fillStyle = '#475569';
    ctx.fillRect(x - 11 * zoom, cy - 8 * zoom, 12 * zoom, 8 * zoom);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(x - 2 * zoom, cy - 13 * zoom, 11 * zoom, 7 * zoom);
    ctx.fillStyle = '#334155';
    ctx.fillRect(x + 4 * zoom, cy - 6 * zoom, 8 * zoom, 6 * zoom);

    // Twisted rebar / structural wire
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1 * zoom;
    ctx.beginPath();
    ctx.moveTo(x - 6 * zoom, cy - 8 * zoom);
    ctx.lineTo(x - 8 * zoom, cy - 16 * zoom);
    ctx.lineTo(x - 4 * zoom, cy - 20 * zoom);
    ctx.stroke();

    // Pulsing Hazard repair badge
    const badgeBob = Math.sin(this.animTick * 0.15) * 3 * zoom;
    const badgeY = cy - 30 * zoom + badgeBob;
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.arc(x, badgeY, 9 * zoom, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 1.5 * zoom;
    ctx.stroke();

    ctx.font = `bold ${10 * zoom}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚠️', x, badgeY);
  }

  // Draw 2.5D Isometric Structures
  private drawStructure(
    tile: TileData,
    x: number,
    y: number,
    halfW: number,
    halfH: number,
    zoom: number,
    timeOfDay: DayNightCycle
  ) {
    const isNight = timeOfDay === 'night';
    const cy = y + halfH;

    if (tile.disasterState === 'damaged') {
      return; // Rubble is drawn on top
    }

    if (['res', 'com', 'ind'].includes(tile.type) && tile.level === 0) {
      this.drawZonedLot(tile.type, x, cy, halfW, halfH, zoom);
      return;
    }

    switch (tile.type) {
      case 'res':
        this.drawResidential(tile, x, cy, halfW, halfH, zoom, isNight);
        break;
      case 'com':
        this.drawCommercial(tile, x, cy, halfW, halfH, zoom, isNight);
        break;
      case 'ind':
        this.drawIndustrial(tile, x, cy, halfW, halfH, zoom, isNight);
        break;
      case 'power':
        this.drawPowerPlant(x, cy, halfW, halfH, zoom, isNight);
        break;
      case 'water':
        this.drawWaterStation(x, cy, halfW, halfH, zoom, isNight);
        break;
      case 'park':
        this.drawPark(tile, x, cy, halfW, halfH, zoom, isNight);
        break;
      case 'school':
        this.drawSchool(x, cy, halfW, halfH, zoom, isNight);
        break;
      case 'hospital':
        this.drawHospital(x, cy, halfW, halfH, zoom, isNight);
        break;
      case 'fire_station':
        this.drawFireStation(x, cy, halfW, halfH, zoom, isNight);
        break;
    }

    if (tile.disasterState !== 'fire') {
      this.drawStatusIcons(tile, x, cy, halfH, zoom);
    }
  }

  private drawZonedLot(type: string, x: number, cy: number, halfW: number, halfH: number, zoom: number) {
    const ctx = this.ctx;
    const w = halfW * 0.75;
    const h = halfH * 0.75;

    let fill = 'rgba(46, 204, 113, 0.35)';
    let border = '#22c55e';
    if (type === 'com') {
      fill = 'rgba(56, 189, 248, 0.35)';
      border = '#38bdf8';
    } else if (type === 'ind') {
      fill = 'rgba(249, 115, 22, 0.35)';
      border = '#f97316';
    }

    ctx.beginPath();
    ctx.moveTo(x, cy - h);
    ctx.lineTo(x + w, cy);
    ctx.lineTo(x, cy + h);
    ctx.lineTo(x - w, cy);
    ctx.closePath();

    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = border;
    ctx.lineWidth = 1.5 * zoom;
    ctx.setLineDash([4 * zoom, 3 * zoom]);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#facc15';
    ctx.fillRect(x - 2 * zoom, cy - 6 * zoom, 4 * zoom, 6 * zoom);
  }

  private drawBox(
    x: number,
    baseY: number,
    w: number,
    h: number,
    height: number,
    topColor: string,
    leftColor: string,
    rightColor: string
  ) {
    const ctx = this.ctx;

    ctx.fillStyle = leftColor;
    ctx.beginPath();
    ctx.moveTo(x - w, baseY);
    ctx.lineTo(x, baseY + h);
    ctx.lineTo(x, baseY + h - height);
    ctx.lineTo(x - w, baseY - height);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = rightColor;
    ctx.beginPath();
    ctx.moveTo(x, baseY + h);
    ctx.lineTo(x + w, baseY);
    ctx.lineTo(x + w, baseY - height);
    ctx.lineTo(x, baseY + h - height);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = topColor;
    ctx.beginPath();
    ctx.moveTo(x, baseY - h - height);
    ctx.lineTo(x + w, baseY - height);
    ctx.lineTo(x, baseY + h - height);
    ctx.lineTo(x - w, baseY - height);
    ctx.closePath();
    ctx.fill();
  }

  private drawResidential(
    tile: TileData,
    x: number,
    cy: number,
    halfW: number,
    halfH: number,
    zoom: number,
    isNight: boolean
  ) {
    const ctx = this.ctx;
    const w = halfW * 0.7;
    const h = halfH * 0.7;

    if (tile.level === 1) {
      const height = 18 * zoom;
      const top = isNight ? '#164e28' : '#34d399';
      const left = isNight ? '#063016' : '#059669';
      const right = isNight ? '#0b3d1e' : '#10b981';

      this.drawBox(x, cy, w, h, height, top, left, right);

      ctx.fillStyle = isNight ? '#682a18' : '#e11d48';
      ctx.beginPath();
      ctx.moveTo(x, cy - h - height - 10 * zoom);
      ctx.lineTo(x + w * 0.9, cy - height);
      ctx.lineTo(x, cy + h * 0.9 - height);
      ctx.lineTo(x - w * 0.9, cy - height);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = isNight ? '#444' : '#b45309';
      ctx.fillRect(x + 5 * zoom, cy - height - 16 * zoom, 4 * zoom, 9 * zoom);

      if (isNight) {
        ctx.fillStyle = '#fde047';
        ctx.fillRect(x - 6 * zoom, cy - height + 4 * zoom, 4 * zoom, 4 * zoom);
      }
    } else if (tile.level === 2) {
      const height = 34 * zoom;
      const top = isNight ? '#1f3c2a' : '#10b981';
      const left = isNight ? '#12261b' : '#047857';
      const right = isNight ? '#173123' : '#059669';

      this.drawBox(x, cy, w, h, height, top, left, right);

      const winColor = isNight ? '#fde047' : '#e0f2fe';
      ctx.fillStyle = winColor;
      for (let floor = 1; floor <= 3; floor++) {
        const winY = cy - floor * 9 * zoom;
        ctx.fillRect(x + 3 * zoom, winY, 4 * zoom, 4 * zoom);
        ctx.fillRect(x - 7 * zoom, winY, 4 * zoom, 4 * zoom);
      }
    } else {
      const height = 62 * zoom;
      const top = isNight ? '#1e3a5f' : '#38bdf8';
      const left = isNight ? '#0f243e' : '#0284c7';
      const right = isNight ? '#152c4a' : '#0369a1';

      this.drawBox(x, cy, w, h, height, top, left, right);
      this.drawBox(x, cy - height, w * 0.5, h * 0.5, 12 * zoom, '#bae6fd', '#0284c7', '#0369a1');

      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5 * zoom;
      ctx.beginPath();
      ctx.moveTo(x, cy - height - 12 * zoom);
      ctx.lineTo(x, cy - height - 28 * zoom);
      ctx.stroke();

      if (isNight && Math.floor(this.animTick / 30) % 2 === 0) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(x, cy - height - 28 * zoom, 3 * zoom, 0, Math.PI * 2);
        ctx.fill();
      }

      const winColor = isNight ? '#fef08a' : '#e0f2fe';
      ctx.fillStyle = winColor;
      for (let floor = 1; floor <= 6; floor++) {
        const winY = cy - floor * 9 * zoom;
        ctx.fillRect(x + 4 * zoom, winY, 4 * zoom, 4 * zoom);
        ctx.fillRect(x - 8 * zoom, winY, 4 * zoom, 4 * zoom);
      }
    }
  }

  private drawCommercial(
    tile: TileData,
    x: number,
    cy: number,
    halfW: number,
    halfH: number,
    zoom: number,
    isNight: boolean
  ) {
    const ctx = this.ctx;
    const w = halfW * 0.72;
    const h = halfH * 0.72;

    if (tile.level === 1) {
      const height = 22 * zoom;
      const top = isNight ? '#1e293b' : '#38bdf8';
      const left = isNight ? '#0f172a' : '#0284c7';
      const right = isNight ? '#162235' : '#0369a1';

      this.drawBox(x, cy, w, h, height, top, left, right);

      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.moveTo(x - w * 0.8, cy + 2 * zoom);
      ctx.lineTo(x, cy + h * 0.8 + 2 * zoom);
      ctx.lineTo(x, cy + h * 0.8 - 4 * zoom);
      ctx.lineTo(x - w * 0.8, cy - 4 * zoom);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = isNight ? '#fde047' : '#fff';
      ctx.fillRect(x - 5 * zoom, cy - height + 4 * zoom, 10 * zoom, 4 * zoom);
    } else if (tile.level === 2) {
      const height = 44 * zoom;
      const top = isNight ? '#1e324a' : '#0ea5e9';
      const left = isNight ? '#0e1d2c' : '#0369a1';
      const right = isNight ? '#132537' : '#0284c7';

      this.drawBox(x, cy, w, h, height, top, left, right);

      ctx.fillStyle = '#64748b';
      ctx.fillRect(x - 4 * zoom, cy - height - 5 * zoom, 8 * zoom, 5 * zoom);

      const winColor = isNight ? '#38bdf8' : '#e0f2fe';
      ctx.fillStyle = winColor;
      for (let floor = 1; floor <= 4; floor++) {
        const winY = cy - floor * 9 * zoom;
        ctx.fillRect(x + 2 * zoom, winY, 8 * zoom, 3 * zoom);
        ctx.fillRect(x - 10 * zoom, winY, 8 * zoom, 3 * zoom);
      }
    } else {
      const height = 75 * zoom;
      const top = isNight ? '#132840' : '#67e8f9';
      const left = isNight ? '#0b1928' : '#0891b2';
      const right = isNight ? '#0e2033' : '#06b6d4';

      this.drawBox(x, cy, w, h, height, top, left, right);

      ctx.fillStyle = isNight ? '#38bdf8' : '#a5f3fc';
      ctx.beginPath();
      ctx.moveTo(x, cy - height - 16 * zoom);
      ctx.lineTo(x + w * 0.5, cy - height);
      ctx.lineTo(x, cy + h * 0.5 - height);
      ctx.lineTo(x - w * 0.5, cy - height);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#f87171';
      ctx.fillRect(x - 3 * zoom, cy - height - 18 * zoom, 6 * zoom, 3 * zoom);

      const winColor = isNight ? '#fef08a' : '#cffafe';
      ctx.fillStyle = winColor;
      for (let floor = 1; floor <= 7; floor++) {
        const winY = cy - floor * 9 * zoom;
        ctx.fillRect(x + 3 * zoom, winY, 6 * zoom, 3 * zoom);
        ctx.fillRect(x - 9 * zoom, winY, 6 * zoom, 3 * zoom);
      }
    }
  }

  private drawIndustrial(
    tile: TileData,
    x: number,
    cy: number,
    halfW: number,
    halfH: number,
    zoom: number,
    isNight: boolean
  ) {
    const ctx = this.ctx;
    const w = halfW * 0.75;
    const h = halfH * 0.75;

    if (tile.level === 1) {
      const height = 20 * zoom;
      const top = isNight ? '#3d2516' : '#ea580c';
      const left = isNight ? '#25150a' : '#c2410c';
      const right = isNight ? '#2e190e' : '#d97706';

      this.drawBox(x, cy, w, h, height, top, left, right);

      ctx.fillStyle = '#475569';
      ctx.fillRect(x - 6 * zoom, cy - 2 * zoom, 6 * zoom, 8 * zoom);
    } else if (tile.level === 2) {
      const height = 30 * zoom;
      const top = isNight ? '#422006' : '#f97316';
      const left = isNight ? '#291404' : '#c2410c';
      const right = isNight ? '#331905' : '#ea580c';

      this.drawBox(x, cy, w, h, height, top, left, right);

      ctx.fillStyle = '#78350f';
      ctx.fillRect(x - 6 * zoom, cy - height - 14 * zoom, 4 * zoom, 14 * zoom);
      ctx.fillRect(x + 2 * zoom, cy - height - 12 * zoom, 4 * zoom, 12 * zoom);

      const smokeOffset = (this.animTick * 0.4) % 15;
      ctx.fillStyle = 'rgba(203, 213, 225, 0.45)';
      ctx.beginPath();
      ctx.arc(x - 4 * zoom, cy - height - 15 * zoom - smokeOffset * zoom, (4 + smokeOffset * 0.3) * zoom, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const height = 42 * zoom;
      const top = isNight ? '#451a03' : '#fb923c';
      const left = isNight ? '#2e1002' : '#9a3412';
      const right = isNight ? '#3b1503' : '#c2410c';

      this.drawBox(x, cy, w, h, height, top, left, right);

      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(x + 7 * zoom, cy - height - 4 * zoom, 7 * zoom, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(x - 8 * zoom, cy - height - 2 * zoom, 7 * zoom, 5 * zoom);
    }
  }

  private drawPowerPlant(x: number, cy: number, halfW: number, halfH: number, zoom: number, isNight: boolean) {
    const ctx = this.ctx;
    const w = halfW * 0.75;
    const h = halfH * 0.75;
    const height = 35 * zoom;

    this.drawBox(
      x,
      cy,
      w,
      h,
      height,
      isNight ? '#3b2506' : '#eab308',
      isNight ? '#231603' : '#ca8a04',
      isNight ? '#2e1c04' : '#d97706'
    );

    const towerX = x - 5 * zoom;
    const towerY = cy - height - 4 * zoom;
    ctx.fillStyle = isNight ? '#475569' : '#94a3b8';

    ctx.beginPath();
    ctx.moveTo(towerX - 8 * zoom, towerY + 4 * zoom);
    ctx.lineTo(towerX - 5 * zoom, towerY - 18 * zoom);
    ctx.lineTo(towerX + 5 * zoom, towerY - 18 * zoom);
    ctx.lineTo(towerX + 8 * zoom, towerY + 4 * zoom);
    ctx.closePath();
    ctx.fill();

    const steamOffset = (this.animTick * 0.3) % 18;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(towerX, towerY - 20 * zoom - steamOffset * zoom, (5 + steamOffset * 0.35) * zoom, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fef08a';
    ctx.font = `bold ${10 * zoom}px sans-serif`;
    ctx.fillText('⚡', x + 3 * zoom, cy - height + 8 * zoom);
  }

  private drawWaterStation(x: number, cy: number, halfW: number, halfH: number, zoom: number, isNight: boolean) {
    const ctx = this.ctx;
    const w = halfW * 0.72;
    const h = halfH * 0.72;
    const height = 28 * zoom;

    this.drawBox(
      x,
      cy,
      w,
      h,
      height,
      isNight ? '#0c3d40' : '#06b6d4',
      isNight ? '#052528' : '#0891b2',
      isNight ? '#083034' : '#0e7490'
    );

    ctx.fillStyle = isNight ? '#155e75' : '#38bdf8';
    ctx.beginPath();
    ctx.arc(x - 5 * zoom, cy - height - 6 * zoom, 8 * zoom, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#e0f2fe';
    ctx.font = `bold ${10 * zoom}px sans-serif`;
    ctx.fillText('💧', x + 2 * zoom, cy - height + 6 * zoom);
  }

  private drawPark(tile: TileData, x: number, cy: number, halfW: number, halfH: number, zoom: number, isNight: boolean) {
    const ctx = this.ctx;

    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(x, cy, 8 * zoom, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = isNight ? '#0284c7' : '#38bdf8';
    ctx.beginPath();
    ctx.arc(x, cy, 6 * zoom, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, cy - 2 * zoom, 2 * zoom, 0, Math.PI * 2);
    ctx.fill();

    const treePositions = [
      { dx: -halfW * 0.45, dy: -halfH * 0.35, r: 7 },
      { dx: halfW * 0.45, dy: halfH * 0.35, r: 6.5 },
      { dx: halfW * 0.45, dy: -halfH * 0.35, r: 6 }
    ];

    treePositions.forEach((tp) => {
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x + tp.dx - 1.5 * zoom, cy + tp.dy - 6 * zoom, 3 * zoom, 6 * zoom);

      ctx.fillStyle = isNight ? '#14532d' : '#22c55e';
      ctx.beginPath();
      ctx.arc(x + tp.dx, cy + tp.dy - 10 * zoom, tp.r * zoom, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  private drawSchool(x: number, cy: number, halfW: number, halfH: number, zoom: number, isNight: boolean) {
    const ctx = this.ctx;
    const w = halfW * 0.75;
    const h = halfH * 0.75;
    const height = 30 * zoom;

    this.drawBox(
      x,
      cy,
      w,
      h,
      height,
      isNight ? '#4a1515' : '#b91c1c',
      isNight ? '#2e0a0a' : '#991b1b',
      isNight ? '#3b0e0e' : '#7f1d1d'
    );

    this.drawBox(x, cy - height, w * 0.35, h * 0.35, 12 * zoom, '#fef08a', '#ca8a04', '#eab308');

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${9 * zoom}px sans-serif`;
    ctx.fillText('🏫', x - 4 * zoom, cy - height + 6 * zoom);
  }

  private drawHospital(x: number, cy: number, halfW: number, halfH: number, zoom: number, isNight: boolean) {
    const ctx = this.ctx;
    const w = halfW * 0.75;
    const h = halfH * 0.75;
    const height = 35 * zoom;

    this.drawBox(
      x,
      cy,
      w,
      h,
      height,
      isNight ? '#334155' : '#f1f5f9',
      isNight ? '#1e293b' : '#cbd5e1',
      isNight ? '#293548' : '#e2e8f0'
    );

    ctx.fillStyle = '#ef4444';
    ctx.fillRect(x - 5 * zoom, cy - height * 0.6, 10 * zoom, 3 * zoom);
    ctx.fillRect(x - 1.5 * zoom, cy - height * 0.6 - 3.5 * zoom, 3 * zoom, 10 * zoom);
  }

  private drawFireStation(x: number, cy: number, halfW: number, halfH: number, zoom: number, isNight: boolean) {
    const ctx = this.ctx;
    const w = halfW * 0.75;
    const h = halfH * 0.75;
    const height = 30 * zoom;

    this.drawBox(
      x,
      cy,
      w,
      h,
      height,
      isNight ? '#581c1c' : '#dc2626',
      isNight ? '#380c0c' : '#b91c1c',
      isNight ? '#451212' : '#991b1b'
    );

    ctx.fillStyle = '#450a0a';
    ctx.fillRect(x - 8 * zoom, cy - 3 * zoom, 6 * zoom, 8 * zoom);
    ctx.fillRect(x + 2 * zoom, cy - 3 * zoom, 6 * zoom, 8 * zoom);
  }

  private drawStatusIcons(tile: TileData, x: number, cy: number, halfH: number, zoom: number) {
    const ctx = this.ctx;
    const alerts: string[] = [];

    if (!tile.hasRoad && ['res', 'com', 'ind', 'school', 'hospital', 'fire_station'].includes(tile.type)) {
      alerts.push('🚫');
    }
    if (!tile.powered && tile.type !== 'empty' && tile.type !== 'road') {
      alerts.push('⚡');
    }
    if (!tile.watered && tile.type !== 'empty' && tile.type !== 'road') {
      alerts.push('💧');
    }

    if (alerts.length > 0) {
      const bob = Math.sin(this.animTick * 0.1) * 3 * zoom;
      const alertY = cy - 40 * zoom + bob;

      alerts.forEach((icon, idx) => {
        const iconX = x - (alerts.length - 1) * 7 * zoom + idx * 14 * zoom;

        ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
        ctx.beginPath();
        ctx.arc(iconX, alertY, 7 * zoom, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = `${8 * zoom}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(icon, iconX, alertY);
      });
    }
  }

  private drawPlacementGhost(activeTool: string, x: number, y: number, halfW: number, halfH: number, zoom: number) {
    const ctx = this.ctx;
    const def = TOOL_DEFINITIONS[activeTool as keyof typeof TOOL_DEFINITIONS];
    if (!def) return;

    ctx.save();
    ctx.strokeStyle = '#22c55e';
    ctx.fillStyle = 'rgba(34, 197, 94, 0.25)';
    ctx.lineWidth = 2 * zoom;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + halfW, y + halfH);
    ctx.lineTo(x, y + halfH * 2);
    ctx.lineTo(x - halfW, y + halfH);
    ctx.closePath();

    ctx.fill();
    ctx.stroke();

    ctx.font = `bold ${14 * zoom}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(def.icon, x, y + halfH - 12 * zoom);

    ctx.font = `bold ${9 * zoom}px sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`$${def.cost}`, x, y + halfH + 4 * zoom);

    ctx.restore();
  }

  private drawEmergencyTarget(x: number, y: number, halfW: number, halfH: number, zoom: number) {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = '#f43f5e';
    ctx.fillStyle = 'rgba(244, 63, 94, 0.25)';
    ctx.lineWidth = 2 * zoom;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + halfW, y + halfH);
    ctx.lineTo(x, y + halfH * 2);
    ctx.lineTo(x - halfW, y + halfH);
    ctx.closePath();

    ctx.fill();
    ctx.stroke();

    ctx.font = `bold ${14 * zoom}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🧯', x, y + halfH - 10 * zoom);
    ctx.restore();
  }

  private drawVehicles(
    vehicles: Vehicle[],
    camera: Camera,
    halfW: number,
    halfH: number,
    zoom: number,
    rotation: 0 | 1 | 2 | 3
  ) {
    const ctx = this.ctx;
    vehicles.forEach((veh) => {
      const curGx = veh.x + (veh.targetX - veh.x) * veh.progress;
      const curGy = veh.y + (veh.targetY - veh.y) * veh.progress;
      const { x, y } = toScreen(curGx, curGy, camera, rotation);
      const cy = y + halfH;

      ctx.fillStyle = veh.color;
      ctx.beginPath();
      ctx.ellipse(x, cy, 3 * zoom, 2 * zoom, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fef08a';
      ctx.fillRect(x + 1 * zoom, cy - 1 * zoom, 1.5 * zoom, 1.5 * zoom);
    });
  }

  private drawAtmosphere(width: number, height: number, timeOfDay: DayNightCycle) {
    const ctx = this.ctx;

    if (timeOfDay === 'sunset') {
      ctx.fillStyle = 'rgba(249, 115, 22, 0.12)';
      ctx.fillRect(0, 0, width, height);
    } else if (timeOfDay === 'night') {
      ctx.fillStyle = 'rgba(10, 15, 30, 0.35)';
      ctx.fillRect(0, 0, width, height);
    }
  }
}
