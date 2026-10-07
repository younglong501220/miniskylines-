import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CityBudget,
  CityState,
  Milestone,
  TaxRates,
  TileData,
  ToolType,
  Vehicle
} from './types/game';
import {
  GRID_SIZE,
  INITIAL_MILESTONES,
  TOOL_DEFINITIONS
} from './utils/constants';
import { sound } from './utils/audio';
import {
  Camera,
  CityRenderer,
  toGrid,
  toScreen
} from './utils/renderer';
import { updateVehicles } from './utils/vehicles';
import {
  createStarterCity,
  runSimulationTick
} from './utils/simulation';
import { TopHUD } from './components/TopHUD';
import { BottomDock } from './components/BottomDock';
import { InspectPanel } from './components/InspectPanel';
import { BudgetModal } from './components/BudgetModal';
import { MilestonesModal } from './components/MilestonesModal';
import { HelpModal } from './components/HelpModal';
import { Minimap } from './components/Minimap';
import { NotificationToast } from './components/NotificationToast';

const STORAGE_KEY = 'mini_skylines_save_v1';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<CityRenderer | null>(null);

  // Core Game State
  const [grid, setGrid] = useState<TileData[][]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.grid && Array.isArray(parsed.grid)) return parsed.grid;
      } catch {
        // Fall back to starter
      }
    }
    return createStarterCity().grid;
  });

  const [milestones, setMilestones] = useState<Milestone[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.milestones) return parsed.milestones;
      } catch {
        // fallback
      }
    }
    return INITIAL_MILESTONES;
  });

  const [cityState, setCityState] = useState<CityState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.cityState) {
          return {
            ...parsed.cityState,
            autoTaxEnabled: parsed.cityState.autoTaxEnabled ?? true,
            rotation: parsed.cityState.rotation ?? 0,
            activeDisaster: parsed.cityState.activeDisaster ?? null
          };
        }
      } catch {
        // fallback
      }
    }
    const initialBudget: CityBudget = {
      incomeRes: 110,
      incomeCom: 30,
      incomeInd: 0,
      totalIncome: 140,
      expensePower: 80,
      expenseWater: 50,
      expenseRoads: 18,
      expenseParks: 10,
      expenseServices: 0,
      totalExpense: 158,
      netCashflow: -18
    };

    return {
      cityName: '天際微城',
      money: 20000,
      pop: 22,
      jobs: 8,
      happiness: 95,
      day: 1,
      month: 1,
      year: 1,
      speed: 1,
      powerCapacity: 180,
      powerDemand: 16,
      waterCapacity: 140,
      waterDemand: 11,
      rDemand: 75,
      cDemand: 45,
      iDemand: 35,
      taxRates: { res: 9, com: 9, ind: 9 },
      autoTaxEnabled: true,
      budget: initialBudget,
      selectedTool: 'road',
      timeOfDay: 'day',
      soundEnabled: true,
      gridVisible: true,
      rotation: 0,
      activeDisaster: null
    };
  });

  // Camera & Interaction State
  const [camera, setCamera] = useState<Camera>({
    x: window.innerWidth / 2,
    y: window.innerHeight / 5,
    zoom: 1.0
  });

  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number }>({ x: -1, y: -1 });
  const [selectedTile, setSelectedTile] = useState<{ x: number; y: number } | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [activeModal, setActiveModal] = useState<'budget' | 'milestones' | 'help' | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'error' | 'success' } | null>(null);

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, camX: 0, camY: 0 });
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to show toasts
  const showToast = useCallback((message: string, type: 'info' | 'error' | 'success' = 'info') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 2800);
  }, []);

  // Save state to localStorage periodically
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          grid,
          cityState,
          milestones
        })
      );
    } catch {
      // ignore
    }
  }, [grid, cityState, milestones]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize Canvas Renderer
  useEffect(() => {
    if (canvasRef.current && !rendererRef.current) {
      rendererRef.current = new CityRenderer(canvasRef.current);
    }
  }, []);

  // Center camera helper
  const centerCamera = useCallback(() => {
    setCamera({
      x: window.innerWidth / 2,
      y: window.innerHeight / 5,
      zoom: 1.0
    });
  }, []);

  // Jump camera to tile with rotation
  const jumpToTile = useCallback((gx: number, gy: number) => {
    const screenPos = toScreen(gx, gy, { x: 0, y: 0, zoom: camera.zoom }, cityState.rotation);
    setCamera((prev) => ({
      ...prev,
      x: window.innerWidth / 2 - screenPos.x,
      y: window.innerHeight / 2 - screenPos.y
    }));
  }, [camera.zoom, cityState.rotation]);

  // Adjust zoom
  const handleZoom = useCallback((delta: number) => {
    setCamera((prev) => {
      const newZoom = Math.min(1.8, Math.max(0.6, prev.zoom + delta));
      return { ...prev, zoom: Number(newZoom.toFixed(2)) };
    });
  }, []);

  // Rotate Map Controls
  const handleRotateLeft = useCallback(() => {
    setCityState((prev) => {
      const nextRot = ((prev.rotation + 3) % 4) as 0 | 1 | 2 | 3;
      return { ...prev, rotation: nextRot };
    });
    sound.playChime();
  }, []);

  const handleRotateRight = useCallback(() => {
    setCityState((prev) => {
      const nextRot = ((prev.rotation + 1) % 4) as 0 | 1 | 2 | 3;
      return { ...prev, rotation: nextRot };
    });
    sound.playChime();
  }, []);

  const handleResetRotation = useCallback(() => {
    setCityState((prev) => ({ ...prev, rotation: 0 }));
    sound.playChime();
    showToast('已回歸原來視角角度 (0° 北)', 'info');
  }, [showToast]);

  // Tool Selection
  const handleSelectTool = (tool: ToolType) => {
    setCityState((prev) => ({ ...prev, selectedTool: tool }));
    if (tool !== 'inspect') {
      setSelectedTile(null);
    }
  };

  // Demolish a Tile
  const handleDemolish = useCallback((gx: number, gy: number) => {
    const tile = grid[gx]?.[gy];
    if (!tile || tile.type === 'empty') return;

    if (cityState.money < 10) {
      sound.playError();
      showToast('市庫資金不足以支付拆除工程款 ($10)！', 'error');
      return;
    }

    sound.playDemolish();
    setGrid((prev) => {
      const next = prev.map((row) => [...row]);
      next[gx][gy] = {
        ...next[gx][gy],
        type: 'empty',
        level: 0,
        pop: 0,
        abandonedTicks: 0,
        pollution: 0,
        disasterState: 'none',
        fireIntensity: 0
      };
      return next;
    });

    setCityState((prev) => ({
      ...prev,
      money: prev.money - 10
    }));

    if (selectedTile?.x === gx && selectedTile?.y === gy) {
      setSelectedTile(null);
    }
    showToast('地塊設施已拆除清空', 'info');
  }, [cityState.money, grid, selectedTile, showToast]);

  // Emergency Disaster Mitigation
  const handleEmergencyAction = useCallback((gx: number, gy: number) => {
    const tile = grid[gx]?.[gy];
    if (!tile) return;

    if (tile.disasterState === 'fire') {
      if (cityState.money < 35) {
        sound.playError();
        showToast('市庫資金不足以派遣緊急滅火隊 ($35)！', 'error');
        return;
      }
      sound.playExtinguish();
      setGrid((prev) => {
        const next = prev.map((row) => [...row]);
        next[gx][gy] = {
          ...next[gx][gy],
          disasterState: 'none',
          fireIntensity: 0
        };
        return next;
      });
      setCityState((prev) => ({
        ...prev,
        money: prev.money - 35
      }));
      showToast(`🧯 成功撲滅位於 [${gx}, ${gy}] 的猛烈火勢！`, 'success');
    } else if (tile.disasterState === 'damaged') {
      if (cityState.money < 35) {
        sound.playError();
        showToast('市庫資金不足以派遣結構搶修隊 ($35)！', 'error');
        return;
      }
      sound.playPlop();
      setGrid((prev) => {
        const next = prev.map((row) => [...row]);
        next[gx][gy] = {
          ...next[gx][gy],
          disasterState: 'none',
          pop: Math.max(4, Math.floor(next[gx][gy].pop * 0.8))
        };
        return next;
      });
      setCityState((prev) => ({
        ...prev,
        money: prev.money - 35
      }));
      showToast(`🛠️ 已修復位於 [${gx}, ${gy}] 的震損建物結構！`, 'success');
    } else {
      showToast('該地塊目前無災情，無需執行緊急應變', 'info');
    }
  }, [cityState.money, grid, showToast]);

  // Place Building / Zoning / Emergency
  const handleTileClick = useCallback((gx: number, gy: number) => {
    if (gx < 0 || gx >= GRID_SIZE || gy < 0 || gy >= GRID_SIZE) return;

    const tool = cityState.selectedTool;
    const tile = grid[gx][gy];

    // Inspect Tool
    if (tool === 'inspect') {
      setSelectedTile({ x: gx, y: gy });
      return;
    }

    // Demolish Tool
    if (tool === 'demolish') {
      handleDemolish(gx, gy);
      return;
    }

    // Emergency Tool
    if (tool === 'emergency') {
      handleEmergencyAction(gx, gy);
      return;
    }

    // Construction Tool
    const def = TOOL_DEFINITIONS[tool];
    if (!def) return;

    // Check if tile already occupied
    if (tile.type !== 'empty') {
      sound.playError();
      showToast('該地塊已存在建築！請先使用推土機 (X) 拆除。', 'error');
      return;
    }

    // Check money
    if (cityState.money < def.cost) {
      sound.playError();
      showToast(`市庫資金不足！建造 ${def.nameZh} 需要 $${def.cost}`, 'error');
      return;
    }

    // Successful Placement
    sound.playPlop();
    setGrid((prev) => {
      const next = prev.map((row) => [...row]);
      next[gx][gy] = {
        ...next[gx][gy],
        type: tool,
        level: ['res', 'com', 'ind'].includes(tool) ? 0 : 1, // zones start as 0
        pop: 0,
        constructionTime: cityState.day,
        abandonedTicks: 0,
        disasterState: 'none',
        fireIntensity: 0
      };
      return next;
    });

    setCityState((prev) => ({
      ...prev,
      money: prev.money - def.cost
    }));

    // Auto inspect placed tile
    setSelectedTile({ x: gx, y: gy });
  }, [cityState.day, cityState.money, cityState.selectedTool, grid, handleDemolish, handleEmergencyAction, showToast]);

  // Mouse / Touch handlers for Canvas
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 0) {
      // Left click
      isDraggingRef.current = false;
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        camX: camera.x,
        camY: camera.y
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();

    // Check if dragging
    if (e.buttons === 1) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        isDraggingRef.current = true;
        setCamera((prev) => ({
          ...prev,
          x: dragStartRef.current.camX + dx,
          y: dragStartRef.current.camY + dy
        }));
      }
    }

    // Update hovered tile with rotation
    const pos = toGrid(e.clientX - rect.left, e.clientY - rect.top, camera, cityState.rotation);
    if (pos.x >= 0 && pos.x < GRID_SIZE && pos.y >= 0 && pos.y < GRID_SIZE) {
      setHoveredTile(pos);
    } else {
      setHoveredTile({ x: -1, y: -1 });
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current && e.button === 0) {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const pos = toGrid(e.clientX - rect.left, e.clientY - rect.top, camera, cityState.rotation);
      if (pos.x >= 0 && pos.x < GRID_SIZE && pos.y >= 0 && pos.y < GRID_SIZE) {
        handleTileClick(pos.x, pos.y);
      }
    }
    isDraggingRef.current = false;
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.08 : -0.08;
    handleZoom(zoomDelta);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      switch (e.key) {
        case '1':
          handleSelectTool('road');
          break;
        case '2':
          handleSelectTool('res');
          break;
        case '3':
          handleSelectTool('com');
          break;
        case '4':
          handleSelectTool('ind');
          break;
        case '5':
          handleSelectTool('power');
          break;
        case '6':
          handleSelectTool('water');
          break;
        case '7':
          handleSelectTool('park');
          break;
        case '8':
          handleSelectTool('school');
          break;
        case '9':
          handleSelectTool('hospital');
          break;
        case '0':
          handleSelectTool('fire_station');
          break;
        case 'x':
        case 'X':
          handleSelectTool('demolish');
          break;
        case 'e':
        case 'E':
          handleSelectTool('emergency');
          break;
        case 'q':
        case 'Q':
          handleSelectTool('inspect');
          break;
        case 'r':
        case 'R':
          if (e.shiftKey) {
            handleRotateLeft();
          } else {
            handleRotateRight();
          }
          break;
        case 'h':
        case 'H':
        case 'Home':
          handleResetRotation();
          break;
        case ' ':
          // Toggle Pause / Resume
          setCityState((prev) => ({
            ...prev,
            speed: prev.speed === 0 ? 1 : 0
          }));
          break;
        case 'Escape':
          setSelectedTile(null);
          setActiveModal(null);
          break;
        case '+':
        case '=':
          handleZoom(0.12);
          break;
        case '-':
        case '_':
          handleZoom(-0.12);
          break;
        case 'c':
        case 'C':
          centerCamera();
          break;
        // Pan camera with WASD / Arrow keys
        case 'w':
        case 'ArrowUp':
          setCamera((prev) => ({ ...prev, y: prev.y + 40 }));
          break;
        case 's':
        case 'ArrowDown':
          setCamera((prev) => ({ ...prev, y: prev.y - 40 }));
          break;
        case 'a':
        case 'ArrowLeft':
          setCamera((prev) => ({ ...prev, x: prev.x + 40 }));
          break;
        case 'd':
        case 'ArrowRight':
          setCamera((prev) => ({ ...prev, x: prev.x - 40 }));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [centerCamera, handleResetRotation, handleRotateLeft, handleRotateRight, handleZoom]);

  // Simulation Tick Loop
  useEffect(() => {
    if (cityState.speed === 0) return;

    const intervalTime = cityState.speed === 1 ? 1800 : cityState.speed === 2 ? 900 : 450;
    const interval = setInterval(() => {
      setGrid((currentGrid) => {
        setCityState((currentCityState) => {
          setMilestones((currentMilestones) => {
            const { nextState, newMilestonesUnlocked, events } = runSimulationTick(
              currentGrid,
              currentCityState,
              currentMilestones
            );

            events.forEach((msg) => showToast(msg, 'success'));
            return currentMilestones.map((m) => {
              const newly = newMilestonesUnlocked.find((u) => u.id === m.id);
              return newly ? { ...m, unlocked: true } : m;
            });
          });
          return currentCityState;
        });
        return currentGrid;
      });

      // Update vehicle positions
      setVehicles((prev) => updateVehicles(prev, grid));
    }, intervalTime);

    return () => clearInterval(interval);
  }, [cityState.speed, grid, showToast]);

  // Render Loop (60 FPS)
  useEffect(() => {
    let animId: number;
    const isEarthquake = cityState.activeDisaster?.type === 'earthquake';
    const renderLoop = () => {
      if (rendererRef.current) {
        rendererRef.current.render(
          grid,
          camera,
          hoveredTile,
          selectedTile,
          cityState.timeOfDay,
          vehicles,
          cityState.gridVisible,
          cityState.selectedTool,
          cityState.rotation,
          isEarthquake
        );
      }
      animId = requestAnimationFrame(renderLoop);
    };
    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [
    grid,
    camera,
    hoveredTile,
    selectedTile,
    cityState.timeOfDay,
    vehicles,
    cityState.gridVisible,
    cityState.selectedTool,
    cityState.rotation,
    cityState.activeDisaster
  ]);

  // Reset City to Fresh Canvas
  const handleResetCity = () => {
    if (window.confirm('確定要清空當前城市並重置開闢新土地嗎？所有進度將重置。')) {
      const fresh = createStarterCity();
      setGrid(fresh.grid);
      setMilestones(INITIAL_MILESTONES);
      setSelectedTile(null);
      setCityState((prev) => ({
        ...prev,
        money: 20000,
        pop: 22,
        jobs: 8,
        happiness: 95,
        day: 1,
        month: 1,
        year: 1,
        speed: 1,
        powerCapacity: 180,
        powerDemand: 16,
        waterCapacity: 140,
        waterDemand: 11,
        rDemand: 75,
        cDemand: 45,
        iDemand: 35,
        rotation: 0,
        activeDisaster: null,
        autoTaxEnabled: true
      }));
      centerCamera();
      showToast('已重置並載入全新開墾城鎮！', 'info');
    }
  };

  // Toggle Time of Day
  const handleToggleTimeOfDay = () => {
    setCityState((prev) => {
      const nextTime =
        prev.timeOfDay === 'day' ? 'sunset' : prev.timeOfDay === 'sunset' ? 'night' : 'day';
      return { ...prev, timeOfDay: nextTime };
    });
  };

  // Toggle Sound
  const handleToggleSound = () => {
    const next = sound.toggleSound();
    setCityState((prev) => ({ ...prev, soundEnabled: next }));
  };

  // Toggle Grid
  const handleToggleGrid = () => {
    setCityState((prev) => ({ ...prev, gridVisible: !prev.gridVisible }));
  };

  // Update Tax Rate
  const handleUpdateTaxRate = (sector: keyof TaxRates, rate: number) => {
    setCityState((prev) => ({
      ...prev,
      autoTaxEnabled: false, // user manually adjusted, switch off auto tax
      taxRates: {
        ...prev.taxRates,
        [sector]: rate
      }
    }));
  };

  const inspectedTileData = selectedTile ? grid[selectedTile.x]?.[selectedTile.y] ?? null : null;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* Top HUD */}
      <TopHUD
        state={cityState}
        onSetSpeed={(speed) => setCityState((prev) => ({ ...prev, speed }))}
        onToggleSound={handleToggleSound}
        onToggleTimeOfDay={handleToggleTimeOfDay}
        onToggleGrid={handleToggleGrid}
        onOpenBudget={() => setActiveModal('budget')}
        onOpenMilestones={() => setActiveModal('milestones')}
        onResetCity={handleResetCity}
        onRotateLeft={handleRotateLeft}
        onRotateRight={handleRotateRight}
        onResetRotation={handleResetRotation}
        onSelectEmergency={() => handleSelectTool('emergency')}
      />

      {/* Floating Toast Notification */}
      <NotificationToast message={toast?.message ?? null} type={toast?.type} />

      {/* Main Isometric 2.5D Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* Inspected Tile Panel */}
      {inspectedTileData && (
        <InspectPanel
          tile={inspectedTileData}
          onClose={() => setSelectedTile(null)}
          onDemolish={handleDemolish}
          onEmergencyRepair={handleEmergencyAction}
        />
      )}

      {/* Bottom Tool Dock */}
      <BottomDock
        selectedTool={cityState.selectedTool}
        onSelectTool={handleSelectTool}
        money={cityState.money}
      />

      {/* Minimap radar & camera controls */}
      <Minimap
        grid={grid}
        camera={camera}
        rotation={cityState.rotation}
        onJumpTo={jumpToTile}
        onZoom={handleZoom}
        onCenter={centerCamera}
      />

      {/* Quick Help Trigger button */}
      <button
        onClick={() => setActiveModal('help')}
        title="市長指引與建築玩法說明"
        className="absolute top-20 right-4 z-20 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl border border-slate-700/60 shadow-lg text-xs font-semibold flex items-center gap-1.5 backdrop-blur-md transition-colors"
      >
        <span>📖</span>
        <span>市長指引</span>
      </button>

      {/* Budget Modal */}
      {activeModal === 'budget' && (
        <BudgetModal
          budget={cityState.budget}
          taxRates={cityState.taxRates}
          autoTaxEnabled={cityState.autoTaxEnabled}
          onToggleAutoTax={() => setCityState((prev) => ({ ...prev, autoTaxEnabled: !prev.autoTaxEnabled }))}
          onUpdateTaxRate={handleUpdateTaxRate}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* Milestones Modal */}
      {activeModal === 'milestones' && (
        <MilestonesModal
          milestones={milestones}
          currentPop={cityState.pop}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* Help Modal */}
      {activeModal === 'help' && (
        <HelpModal onClose={() => setActiveModal(null)} />
      )}
    </div>
  );
}
