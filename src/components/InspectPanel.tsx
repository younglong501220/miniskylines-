import React from 'react';
import { TileData } from '../types/game';
import { TOOL_DEFINITIONS } from '../utils/constants';
import { X, Trash2, Zap, Droplets, Compass } from 'lucide-react';

interface InspectPanelProps {
  tile: TileData | null;
  onClose: () => void;
  onDemolish: (gx: number, gy: number) => void;
  onEmergencyRepair?: (gx: number, gy: number) => void;
}

export const InspectPanel: React.FC<InspectPanelProps> = ({
  tile,
  onClose,
  onDemolish,
  onEmergencyRepair
}) => {
  if (!tile) return null;

  const def = TOOL_DEFINITIONS[tile.type as keyof typeof TOOL_DEFINITIONS] || {
    nameZh: '空置荒地',
    icon: '🌱',
    descriptionZh: '尚未劃定或建造任何設施的綠地荒野'
  };

  const getLevelLabel = () => {
    if (tile.type === 'empty') return '未開發';
    if (tile.type === 'road') return '標準雙向道路';
    if (['power', 'water', 'park', 'school', 'hospital', 'fire_station'].includes(tile.type)) {
      return '市政公共設施';
    }
    if (tile.level === 0) return '規劃動工中 (0級)';
    if (tile.level === 1) return '初級建築 (1級)';
    if (tile.level === 2) return '中型建築 (2級)';
    return '高級摩天大樓 (3級)';
  };

  return (
    <div className="absolute top-20 left-4 w-72 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 shadow-2xl rounded-2xl p-4 z-20 text-white animate-in fade-in slide-in-from-left-4 duration-150">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{def.icon}</span>
          <div>
            <h3 className="text-sm font-bold leading-tight">{def.nameZh}</h3>
            <span className="text-[10px] text-slate-400 font-mono">
              座標 [{tile.x}, {tile.y}] · {getLevelLabel()}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Metrics List */}
      <div className="space-y-2 text-xs">
        {/* Population / Jobs */}
        {['res', 'com', 'ind'].includes(tile.type) && (
          <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400">
              {tile.type === 'res' ? '居住人口' : '就業人數'}
            </span>
            <span className="font-mono font-bold text-sky-400">
              {tile.pop} {tile.type === 'res' ? '人' : '職位'}
            </span>
          </div>
        )}

        {/* Road Connection */}
        <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
          <span className="text-slate-400 flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-slate-500" /> 臨路連接
          </span>
          <span className={tile.hasRoad ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
            {tile.hasRoad ? '已連接道路' : '無道路接入'}
          </span>
        </div>

        {/* Power Status */}
        <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
          <span className="text-slate-400 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> 電力狀態
          </span>
          <span className={tile.powered ? 'text-amber-300 font-medium' : 'text-rose-400 font-medium'}>
            {tile.powered ? '供電正常' : '缺乏電力'}
          </span>
        </div>

        {/* Water Status */}
        <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
          <span className="text-slate-400 flex items-center gap-1">
            <Droplets className="w-3.5 h-3.5 text-sky-400" /> 水資源
          </span>
          <span className={tile.watered ? 'text-sky-300 font-medium' : 'text-rose-400 font-medium'}>
            {tile.watered ? '供水充沛' : '缺水警告'}
          </span>
        </div>

        {/* Land Value */}
        <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
          <span className="text-slate-400">地價指數</span>
          <div className="flex items-center gap-1.5">
            <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${tile.landValue}%` }}
              />
            </div>
            <span className="font-mono text-slate-300">{tile.landValue}</span>
          </div>
        </div>

        {/* Pollution */}
        {tile.pollution > 0 && (
          <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400">環境污染</span>
            <span className="font-mono text-amber-400">{tile.pollution}%</span>
          </div>
        )}

        {/* Civic Services Coverage */}
        <div className="pt-1">
          <span className="text-[10px] text-slate-400 block mb-1">市政公共服務覆蓋</span>
          <div className="grid grid-cols-3 gap-1 text-[10px] text-center">
            <span
              className={`py-0.5 rounded ${
                tile.serviceCoverage.education
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              教育 {tile.serviceCoverage.education ? '✓' : '✗'}
            </span>
            <span
              className={`py-0.5 rounded ${
                tile.serviceCoverage.healthcare
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              醫療 {tile.serviceCoverage.healthcare ? '✓' : '✗'}
            </span>
            <span
              className={`py-0.5 rounded ${
                tile.serviceCoverage.fireProtection
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              消防 {tile.serviceCoverage.fireProtection ? '✓' : '✗'}
            </span>
          </div>
        </div>

        {/* Disaster Hazard Alert */}
        {tile.disasterState && tile.disasterState !== 'none' && (
          <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-500/80 text-rose-200 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-xs text-rose-300">
              <span>{tile.disasterState === 'fire' ? '🔥 發生猛烈大火！' : '⚠️ 地震結構毀損！'}</span>
            </div>
            <p className="text-[10px] text-rose-300/80 leading-tight">
              {tile.disasterState === 'fire'
                ? '建築正遭受烈火燃燒，若未撲滅將導致全面坍塌並可能蔓延相鄰建築！'
                : '受地震衝擊建築已斷裂瓦礫，需派遣搶修隊修繕。'}
            </p>
            {onEmergencyRepair && (
              <button
                onClick={() => onEmergencyRepair(tile.x, tile.y)}
                className="w-full mt-1.5 py-1 px-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs shadow-md transition-colors"
              >
                🧯 派遣應變隊滅火 / 搶修 ($35)
              </button>
            )}
          </div>
        )}
      </div>

      {/* Demolish Action */}
      {tile.type !== 'empty' && (
        <button
          onClick={() => onDemolish(tile.x, tile.y)}
          className="mt-3 w-full py-1.5 px-3 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" /> 拆除此地塊設施 ($10)
        </button>
      )}
    </div>
  );
};
