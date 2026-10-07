import React from 'react';
import { CityBudget, TaxRates } from '../types/game';
import { X, TrendingUp, TrendingDown, DollarSign, Sliders } from 'lucide-react';

interface BudgetModalProps {
  budget: CityBudget;
  taxRates: TaxRates;
  autoTaxEnabled: boolean;
  onToggleAutoTax: () => void;
  onUpdateTaxRate: (sector: keyof TaxRates, rate: number) => void;
  onClose: () => void;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  budget,
  taxRates,
  autoTaxEnabled,
  onToggleAutoTax,
  onUpdateTaxRate,
  onClose
}) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 shadow-2xl rounded-3xl w-full max-w-xl text-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">市政財政預算與稅率調整</h2>
              <span className="text-xs text-slate-400">管理城市收入與公共支出，維持可持續發展</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Net Cashflow Summary Box */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between ${
            budget.netCashflow >= 0
              ? 'bg-emerald-950/40 border-emerald-800/60'
              : 'bg-rose-950/40 border-rose-800/60'
          }`}>
            <div className="flex items-center gap-3">
              {budget.netCashflow >= 0 ? (
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              ) : (
                <TrendingDown className="w-6 h-6 text-rose-400" />
              )}
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  每日淨收支結餘
                </span>
                <h3 className={`text-xl font-mono font-bold ${
                  budget.netCashflow >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {budget.netCashflow >= 0 ? '+' : ''}${budget.netCashflow.toLocaleString()} / 天
                </h3>
              </div>
            </div>
            <div className="text-right text-xs text-slate-400 space-y-0.5">
              <div>總收入: <span className="font-mono text-emerald-300 font-semibold">+${budget.totalIncome.toLocaleString()}</span></div>
              <div>總支出: <span className="font-mono text-rose-300 font-semibold">-${budget.totalExpense.toLocaleString()}</span></div>
            </div>
          </div>

          {/* Tax Rates Sliders */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-sky-400" /> 分區稅率調整 (基準稅率 9%)
              </h4>

              {/* Auto-Tax Toggle */}
              <button
                onClick={onToggleAutoTax}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  autoTaxEnabled
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400'
                    : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                }`}
              >
                <span>{autoTaxEnabled ? '● 自動平衡已啟動' : '○ 手動固定稅率'}</span>
              </button>
            </div>

            {autoTaxEnabled && (
              <p className="text-[11px] text-emerald-300/90 bg-emerald-950/40 border border-emerald-800/50 p-2.5 rounded-xl leading-relaxed">
                🤖 <strong>智慧自動平衡中</strong>：系統每週期將依據市庫赤字/盈餘與人口/就業需求，動態微調住、商、工三區稅率，確保市庫不陷入破產，同時在財政充裕時自動減稅以吸引市民移入！
              </p>
            )}

            {/* Residential Tax */}
            <div className="bg-slate-800/50 border border-slate-700/50 p-3.5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span>🟩</span> 住宅分區人頭稅
                </span>
                <span className="font-mono text-emerald-300 font-bold">{taxRates.res}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="15"
                value={taxRates.res}
                onChange={(e) => onUpdateTaxRate('res', Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-700 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>5% (人口快速遷入)</span>
                <span>預估稅收: +${budget.incomeRes}/天</span>
                <span>15% (民怨增加)</span>
              </div>
            </div>

            {/* Commercial Tax */}
            <div className="bg-slate-800/50 border border-slate-700/50 p-3.5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-sky-400">
                  <span>🟦</span> 商業分區營業稅
                </span>
                <span className="font-mono text-sky-300 font-bold">{taxRates.com}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="15"
                value={taxRates.com}
                onChange={(e) => onUpdateTaxRate('com', Number(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer h-2 bg-slate-700 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>5% (商業繁榮)</span>
                <span>預估稅收: +${budget.incomeCom}/天</span>
                <span>15% (商鋪空置)</span>
              </div>
            </div>

            {/* Industrial Tax */}
            <div className="bg-slate-800/50 border border-slate-700/50 p-3.5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-amber-400">
                  <span>🟧</span> 工業分區營運稅
                </span>
                <span className="font-mono text-amber-300 font-bold">{taxRates.ind}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="15"
                value={taxRates.ind}
                onChange={(e) => onUpdateTaxRate('ind', Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-700 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>5% (製造業興盛)</span>
                <span>預估稅收: +${budget.incomeInd}/天</span>
                <span>15% (工廠外移)</span>
              </div>
            </div>
          </div>

          {/* Detailed Itemized Ledger */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              各項收支明細
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {/* Income column */}
              <div className="bg-slate-800/40 border border-slate-700/40 p-3 rounded-2xl space-y-2">
                <span className="font-bold text-emerald-400 text-[11px] block border-b border-slate-700 pb-1">
                  市政收入明細
                </span>
                <div className="flex justify-between text-slate-300">
                  <span>住宅所得稅</span>
                  <span className="font-mono text-emerald-400">+${budget.incomeRes}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>商業營業稅</span>
                  <span className="font-mono text-emerald-400">+${budget.incomeCom}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>工業產值稅</span>
                  <span className="font-mono text-emerald-400">+${budget.incomeInd}</span>
                </div>
              </div>

              {/* Expense column */}
              <div className="bg-slate-800/40 border border-slate-700/40 p-3 rounded-2xl space-y-2">
                <span className="font-bold text-rose-400 text-[11px] block border-b border-slate-700 pb-1">
                  基礎營運維護支出
                </span>
                <div className="flex justify-between text-slate-300">
                  <span>發電廠日常維護</span>
                  <span className="font-mono text-rose-400">-${budget.expensePower}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>供水站水管運轉</span>
                  <span className="font-mono text-rose-400">-${budget.expenseWater}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>道路養護修繕</span>
                  <span className="font-mono text-rose-400">-${budget.expenseRoads}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>公園綠地景觀</span>
                  <span className="font-mono text-rose-400">-${budget.expenseParks}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>學校/醫療/消防設施</span>
                  <span className="font-mono text-rose-400">-${budget.expenseServices}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/60 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors shadow-lg shadow-blue-600/30"
          >
            確認並套用
          </button>
        </div>
      </div>
    </div>
  );
};
