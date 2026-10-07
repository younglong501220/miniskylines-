import React from 'react';
import { Milestone } from '../types/game';
import { X, Award, CheckCircle2, Lock } from 'lucide-react';

interface MilestonesModalProps {
  milestones: Milestone[];
  currentPop: number;
  onClose: () => void;
}

export const MilestonesModal: React.FC<MilestonesModalProps> = ({
  milestones,
  currentPop,
  onClose
}) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 shadow-2xl rounded-3xl w-full max-w-lg text-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">城市晉升里程碑</h2>
              <span className="text-xs text-slate-400">目前常住人口：{currentPop.toLocaleString()} 人</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of Milestones */}
        <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
          {milestones.map((m) => {
            const isUnlocked = m.unlocked;
            const progress = Math.min(100, Math.round((currentPop / m.popRequired) * 100));

            return (
              <div
                key={m.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isUnlocked
                    ? 'bg-amber-950/20 border-amber-500/50'
                    : 'bg-slate-800/40 border-slate-700/50 opacity-90'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {isUnlocked ? (
                      <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
                    ) : (
                      <Lock className="w-5 h-5 text-slate-500 shrink-0" />
                    )}
                    <div>
                      <h4 className="text-sm font-bold flex items-center gap-2">
                        <span>{m.chineseName}</span>
                        <span className="text-xs font-normal text-slate-400 font-mono">
                          {m.name}
                        </span>
                      </h4>
                      <p className="text-xs text-slate-400">{m.description}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold font-mono text-emerald-400 block">
                      +${m.rewardCash.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      需 {m.popRequired} 人口
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                {!isUnlocked && (
                  <div className="mt-2 space-y-1">
                    <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>進度: {progress}%</span>
                      <span>還需 {Math.max(0, m.popRequired - currentPop)} 人</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/60 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
