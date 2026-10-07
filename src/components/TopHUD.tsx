import React from 'react';
import { CityState } from '../types/game';
import {
  Pause,
  Play,
  FastForward,
  Volume2,
  VolumeX,
  Sun,
  Sunset,
  Moon,
  Grid,
  Coins,
  Award,
  RotateCcw,
  RotateCw,
  RefreshCw,
  Flame,
  Activity
} from 'lucide-react';

interface TopHUDProps {
  state: CityState;
  onSetSpeed: (speed: 0 | 1 | 2 | 3) => void;
  onToggleSound: () => void;
  onToggleTimeOfDay: () => void;
  onToggleGrid: () => void;
  onOpenBudget: () => void;
  onOpenMilestones: () => void;
  onResetCity: () => void;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onResetRotation: () => void;
  onSelectEmergency: () => void;
}

export const TopHUD: React.FC<TopHUDProps> = ({
  state,
  onSetSpeed,
  onToggleSound,
  onToggleTimeOfDay,
  onToggleGrid,
  onOpenBudget,
  onOpenMilestones,
  onResetCity,
  onRotateLeft,
  onRotateRight,
  onResetRotation,
  onSelectEmergency
}) => {
  const isPowerDeficit = state.powerDemand > state.powerCapacity;
  const isWaterDeficit = state.waterDemand > state.waterCapacity;
  const rotationDeg = state.rotation * 90;
  const rotationLabel = ['0° 北', '90° 東', '180° 南', '270° 西'][state.rotation];

  return (
    <div className="absolute top-3 left-3 right-3 flex flex-col gap-2 pointer-events-none z-20">
      {/* Active Disaster Warning Banner */}
      {state.activeDisaster && (
        <div className="self-center pointer-events-auto animate-bounce">
          <button
            onClick={onSelectEmergency}
            className="flex items-center gap-2 px-4 py-1.5 bg-rose-600/95 hover:bg-rose-500 text-white rounded-full shadow-2xl border border-rose-400 text-xs font-bold transition-transform active:scale-95"
          >
            {state.activeDisaster.type === 'fire' ? (
              <Flame className="w-4 h-4 text-amber-300 animate-pulse" />
            ) : (
              <Activity className="w-4 h-4 text-amber-300 animate-pulse" />
            )}
            <span>【災難警報】{state.activeDisaster.message}</span>
            <span className="bg-rose-800 px-2 py-0.5 rounded-full text-[10px] uppercase font-mono">
              點擊立即啟用搶險 (E)
            </span>
          </button>
        </div>
      )}

      {/* Main Top Bar */}
      <header className="flex items-center justify-between gap-3 w-full">
        {/* Brand & Date Panel */}
        <div className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-md border border-slate-700/60 shadow-xl rounded-2xl px-4 py-2 pointer-events-auto">
          <div className="flex flex-col">
            <span className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
              <span className="text-emerald-400">🏙️</span> 天際微城
              <span className="text-xs font-normal text-slate-400">Mini Skylines</span>
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              第 {state.year} 年 {state.month} 月 {state.day} 日
            </span>
          </div>

          {/* Speed Controls */}
          <div className="flex items-center gap-0.5 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/50 ml-1">
            <button
              onClick={() => onSetSpeed(0)}
              title="暫停 (Space)"
              className={`p-1.5 rounded transition-colors ${
                state.speed === 0 ? 'bg-amber-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Pause className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onSetSpeed(1)}
              title="正常速度 1x"
              className={`p-1.5 rounded transition-colors ${
                state.speed === 1 ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onSetSpeed(2)}
              title="加速 2x"
              className={`p-1.5 rounded transition-colors ${
                state.speed === 2 ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FastForward className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Center Vital Metrics Bar */}
        <div className="flex items-center gap-4 bg-slate-900/90 backdrop-blur-md border border-slate-700/60 shadow-xl rounded-2xl px-4 py-2 pointer-events-auto max-w-3xl">
          {/* Treasury Money */}
          <button
            onClick={onOpenBudget}
            title="點擊開啟市庫財政預算"
            className="flex flex-col items-start hover:opacity-80 transition-opacity text-left"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">市庫資金</span>
              {state.autoTaxEnabled && (
                <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-800/60 px-1 rounded font-mono">
                  自動調稅
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-base font-bold font-mono ${state.money < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                ${state.money.toLocaleString()}
              </span>
              <span
                className={`text-[10px] font-mono ${
                  state.budget.netCashflow >= 0 ? 'text-emerald-400/80' : 'text-rose-400/80'
                }`}
              >
                {state.budget.netCashflow >= 0 ? `+` : ``}${state.budget.netCashflow}/天
              </span>
            </div>
          </button>

          <div className="h-7 w-[1px] bg-slate-700/60" />

          {/* Population */}
          <div className="flex flex-col items-start">
            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">城市人口</span>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-bold font-mono text-sky-300">{state.pop.toLocaleString()}</span>
              <span className="text-[10px] text-slate-400">人</span>
            </div>
          </div>

          <div className="h-7 w-[1px] bg-slate-700/60" />

          {/* Happiness */}
          <div className="flex flex-col items-start">
            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">市民滿意度</span>
            <div className="flex items-center gap-1 font-mono">
              <span className="text-base font-bold text-amber-300">{state.happiness}%</span>
              <span className="text-xs">
                {state.happiness >= 80 ? '😊' : state.happiness >= 50 ? '😐' : '😟'}
              </span>
            </div>
          </div>

          <div className="h-7 w-[1px] bg-slate-700/60" />

          {/* RCI Demand Bars */}
          <div className="flex flex-col items-start">
            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">RCI 需求</span>
            <div className="flex items-end gap-1 h-5 pt-0.5" title="住宅 (綠) / 商業 (藍) / 工業 (橘) 需求">
              <div className="w-2.5 h-full bg-slate-800 rounded-sm overflow-hidden flex flex-col-reverse" title={`住宅需求: ${state.rDemand}%`}>
                <div
                  className="w-full bg-emerald-500 transition-all duration-300"
                  style={{ height: `${state.rDemand}%` }}
                />
              </div>
              <div className="w-2.5 h-full bg-slate-800 rounded-sm overflow-hidden flex flex-col-reverse" title={`商業需求: ${state.cDemand}%`}>
                <div
                  className="w-full bg-sky-500 transition-all duration-300"
                  style={{ height: `${state.cDemand}%` }}
                />
              </div>
              <div className="w-2.5 h-full bg-slate-800 rounded-sm overflow-hidden flex flex-col-reverse" title={`工業需求: ${state.iDemand}%`}>
                <div
                  className="w-full bg-amber-500 transition-all duration-300"
                  style={{ height: `${state.iDemand}%` }}
                />
              </div>
            </div>
          </div>

          <div className="h-7 w-[1px] bg-slate-700/60" />

          {/* Utilities: Power & Water */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-start" title="電力供應情況">
              <span className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1">
                <span>⚡ 電力</span>
                {isPowerDeficit && <span className="text-rose-400 animate-pulse text-[9px]">缺電!</span>}
              </span>
              <span className={`text-xs font-mono font-semibold ${isPowerDeficit ? 'text-rose-400' : 'text-amber-300'}`}>
                {state.powerDemand}/{state.powerCapacity} <span className="text-[9px] font-normal text-slate-400">MW</span>
              </span>
            </div>

            <div className="flex flex-col items-start" title="水資源供應情況">
              <span className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1">
                <span>💧 水力</span>
                {isWaterDeficit && <span className="text-rose-400 animate-pulse text-[9px]">缺水!</span>}
              </span>
              <span className={`text-xs font-mono font-semibold ${isWaterDeficit ? 'text-rose-400' : 'text-sky-300'}`}>
                {state.waterDemand}/{state.waterCapacity} <span className="text-[9px] font-normal text-slate-400">m³</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Controls: Rotation, Finance, Audio, Settings */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/60 shadow-xl rounded-2xl px-3 py-2 pointer-events-auto">
          {/* Map Rotation Controls */}
          <div className="flex items-center bg-slate-800/80 p-0.5 rounded-xl border border-slate-700/50">
            <button
              onClick={onRotateLeft}
              title="逆時針旋轉地圖 90° (Q / 快捷鍵)"
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700/80 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onResetRotation}
              title={`回歸原角度 (目前: ${rotationLabel})\n點擊重置為 0°`}
              className={`px-1.5 py-1 text-[10px] font-mono font-bold rounded transition-colors ${
                state.rotation === 0
                  ? 'text-slate-400 hover:text-white'
                  : 'text-sky-400 bg-sky-950/60 hover:bg-sky-900/80'
              }`}
            >
              {rotationLabel}
            </button>
            <button
              onClick={onRotateRight}
              title="順時針旋轉地圖 90° (E / 快捷鍵)"
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700/80 rounded-lg transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-5 w-[1px] bg-slate-700/60 mx-0.5" />

          {/* Budget */}
          <button
            onClick={onOpenBudget}
            title="市庫預算報表"
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1 text-xs font-medium"
          >
            <Coins className="w-4 h-4 text-emerald-400" />
            <span className="hidden xl:inline">財政</span>
          </button>

          {/* Milestones */}
          <button
            onClick={onOpenMilestones}
            title="城市里程碑進度"
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1 text-xs font-medium"
          >
            <Award className="w-4 h-4 text-amber-400" />
            <span className="hidden xl:inline">里程碑</span>
          </button>

          {/* Time of day */}
          <button
            onClick={onToggleTimeOfDay}
            title={`光照模式: ${state.timeOfDay}`}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            {state.timeOfDay === 'day' && <Sun className="w-4 h-4 text-amber-300" />}
            {state.timeOfDay === 'sunset' && <Sunset className="w-4 h-4 text-orange-400" />}
            {state.timeOfDay === 'night' && <Moon className="w-4 h-4 text-sky-300" />}
          </button>

          {/* Sound */}
          <button
            onClick={onToggleSound}
            title={state.soundEnabled ? '關閉音效' : '開啟音效'}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            {state.soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {/* Grid */}
          <button
            onClick={onToggleGrid}
            title={state.gridVisible ? '隱藏網格' : '顯示網格'}
            className={`p-2 rounded-xl transition-colors ${
              state.gridVisible ? 'text-sky-400 bg-slate-800' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Grid className="w-4 h-4" />
          </button>

          {/* Reset */}
          <button
            onClick={onResetCity}
            title="重置建立新城市"
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>
    </div>
  );
};
