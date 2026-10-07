import React from 'react';
import { ToolType } from '../types/game';
import { TOOL_DEFINITIONS, ToolDef } from '../utils/constants';

interface BottomDockProps {
  selectedTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  money: number;
}

export const BottomDock: React.FC<BottomDockProps> = ({
  selectedTool,
  onSelectTool,
  money
}) => {
  const toolsList: ToolDef[] = Object.values(TOOL_DEFINITIONS);

  return (
    <footer className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-slate-900/95 backdrop-blur-md border border-slate-700/70 shadow-2xl rounded-2xl p-2 z-20 max-w-full overflow-x-auto">
      {toolsList.map((tool) => {
        const isActive = selectedTool === tool.id;
        const canAfford = tool.cost === 0 || money >= tool.cost;
        const isDemolish = tool.id === 'demolish';
        const isEmergency = tool.id === 'emergency';

        return (
          <button
            key={tool.id}
            onClick={() => onSelectTool(tool.id)}
            title={`${tool.nameZh} (${tool.name}) - [快速鍵 ${tool.shortcut}]\n${tool.descriptionZh}`}
            className={`flex flex-col items-center justify-center min-w-[62px] px-2.5 py-1.5 rounded-xl transition-all duration-150 relative group ${
              isActive
                ? isDemolish
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 ring-2 ring-rose-400'
                  : isEmergency
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30 ring-2 ring-amber-400'
                  : 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400'
                : isEmergency
                ? 'bg-amber-950/40 border border-amber-500/50 text-amber-200 hover:bg-amber-900/60'
                : canAfford
                ? 'bg-slate-800/60 text-slate-300 hover:bg-slate-700/80 hover:text-white'
                : 'bg-slate-800/30 text-slate-500 opacity-60 cursor-not-allowed'
            }`}
          >
            <span className="text-xl leading-tight mb-0.5">{tool.icon}</span>
            <span className="text-[11px] font-bold tracking-tight whitespace-nowrap">
              {tool.nameZh}
            </span>
            <span
              className={`text-[10px] font-mono leading-tight ${
                isActive ? 'text-blue-100 font-semibold' : 'text-slate-400'
              }`}
            >
              {tool.cost > 0 ? `$${tool.cost}` : tool.cost < 0 ? `-$${Math.abs(tool.cost)}` : '免費'}
            </span>

            {/* Shortcut badge */}
            <span className="absolute top-1 right-1 text-[9px] font-mono text-slate-400 bg-slate-900/80 px-1 rounded opacity-70 group-hover:opacity-100">
              {tool.shortcut}
            </span>
          </button>
        );
      })}
    </footer>
  );
};
