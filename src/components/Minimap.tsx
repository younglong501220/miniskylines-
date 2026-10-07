import React, { useRef, useEffect } from 'react';
import { TileData } from '../types/game';
import { GRID_SIZE, TILE_H, TILE_W } from '../utils/constants';
import { Camera } from '../utils/renderer';
import { ZoomIn, ZoomOut, Focus } from 'lucide-react';

interface MinimapProps {
  grid: TileData[][];
  camera: Camera;
  rotation?: 0 | 1 | 2 | 3;
  onJumpTo: (gx: number, gy: number) => void;
  onZoom: (delta: number) => void;
  onCenter: () => void;
}

export const Minimap: React.FC<MinimapProps> = ({
  grid,
  camera,
  rotation = 0,
  onJumpTo,
  onZoom,
  onCenter
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 110;
    const cellSize = size / GRID_SIZE;

    ctx.clearRect(0, 0, size, size);

    // Background terrain
    ctx.fillStyle = '#1c3022';
    ctx.fillRect(0, 0, size, size);

    // Draw tiles
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        const t = grid[x][y];
        if (t.type === 'empty') continue;

        let color = '#334155';
        if (t.type === 'road') color = '#94a3b8';
        else if (t.type === 'res') color = '#22c55e';
        else if (t.type === 'com') color = '#38bdf8';
        else if (t.type === 'ind') color = '#f97316';
        else if (t.type === 'power') color = '#eab308';
        else if (t.type === 'water') color = '#06b6d4';
        else if (t.type === 'park') color = '#15803d';
        else if (t.type === 'school') color = '#b91c1c';
        else if (t.type === 'hospital') color = '#ef4444';
        else if (t.type === 'fire_station') color = '#dc2626';

        ctx.fillStyle = color;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize + 0.5, cellSize + 0.5);
      }
    }

    // Viewport box approximation
    const midX = (window.innerWidth / 2 - camera.x) / camera.zoom;
    const midY = (window.innerHeight / 2 - camera.y) / camera.zoom;
    const centerGx = Math.floor((midY / (TILE_H / 2) + midX / (TILE_W / 2)) / 2);
    const centerGy = Math.floor((midY / (TILE_H / 2) - midX / (TILE_W / 2)) / 2);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    const boxRadius = (4 / camera.zoom) * cellSize;
    ctx.strokeRect(
      Math.max(0, Math.min(size - boxRadius * 2, centerGx * cellSize - boxRadius)),
      Math.max(0, Math.min(size - boxRadius * 2, centerGy * cellSize - boxRadius)),
      boxRadius * 2,
      boxRadius * 2
    );
  }, [grid, camera]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const gx = Math.floor((clickX / 110) * GRID_SIZE);
    const gy = Math.floor((clickY / 110) * GRID_SIZE);
    onJumpTo(Math.max(0, Math.min(GRID_SIZE - 1, gx)), Math.max(0, Math.min(GRID_SIZE - 1, gy)));
  };

  return (
    <div className="absolute bottom-20 right-4 bg-slate-900/90 backdrop-blur-md border border-slate-700/70 shadow-2xl rounded-2xl p-2 z-20 flex flex-col items-center gap-1.5">
      <div className="relative rounded-lg overflow-hidden border border-slate-700/60 cursor-crosshair">
        <canvas
          ref={canvasRef}
          width={110}
          height={110}
          onClick={handleClick}
          title="點擊雷達圖快速移動鏡頭"
        />
        {/* Compass indicator */}
        <div className="absolute top-1 left-1 bg-slate-900/80 px-1 py-0.5 rounded text-[9px] font-mono font-bold text-sky-400 border border-slate-700/50">
          {['北 0°', '東 90°', '南 180°', '西 270°'][rotation]}
        </div>
      </div>

      {/* Camera Controls */}
      <div className="flex items-center gap-1 w-full justify-between">
        <button
          onClick={() => onZoom(0.15)}
          title="放大鏡頭 (+)"
          className="p-1.5 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg text-xs"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onCenter}
          title="重置居中視角 (C)"
          className="p-1.5 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg text-xs"
        >
          <Focus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onZoom(-0.15)}
          title="縮小鏡頭 (-)"
          className="p-1.5 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg text-xs"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
