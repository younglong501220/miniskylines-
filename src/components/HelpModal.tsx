import React from 'react';
import { X, BookOpen, Compass, Zap, Building2, Trees, DollarSign } from 'lucide-react';

interface HelpModalProps {
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 shadow-2xl rounded-3xl w-full max-w-xl text-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">《天際微城》市長執政指引</h2>
              <span className="text-xs text-slate-400">掌握都市規劃四大支柱，打造繁榮天際線</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[72vh] overflow-y-auto text-xs text-slate-300">
          {/* Section 1 */}
          <div className="p-3.5 bg-slate-800/40 rounded-2xl border border-slate-700/50 space-y-1.5">
            <h3 className="font-bold text-white flex items-center gap-2 text-sm">
              <Compass className="w-4 h-4 text-amber-400" /> 1. 道路優先原則
            </h3>
            <p className="leading-relaxed">
              城市運作的起點！所有分區（住宅、商業、工業）以及公共設施，都必須<strong className="text-amber-300">與道路相鄰</strong>。若缺乏道路連接，地塊上方會出現 🚫 警告且無法建造升級。
            </p>
          </div>

          {/* Section 2 */}
          <div className="p-3.5 bg-slate-800/40 rounded-2xl border border-slate-700/50 space-y-1.5">
            <h3 className="font-bold text-white flex items-center gap-2 text-sm">
              <Zap className="w-4 h-4 text-sky-400" /> 2. 市政基礎：電力與水資源
            </h3>
            <p className="leading-relaxed">
              建造 <strong className="text-amber-300">⚡ 發電廠 (180 MW)</strong> 與 <strong className="text-sky-300">💧 水庫泵站 (140 m³)</strong>。任何缺電或缺水的建築將停擺並隨時間荒廢降級。注意頂部資源儀表板，隨時擴充產能！
            </p>
          </div>

          {/* Section 3 */}
          <div className="p-3.5 bg-slate-800/40 rounded-2xl border border-slate-700/50 space-y-1.5">
            <h3 className="font-bold text-white flex items-center gap-2 text-sm">
              <Building2 className="w-4 h-4 text-emerald-400" /> 3. RCI 需求與建築升級 (摩天樓機制)
            </h3>
            <p className="leading-relaxed">
              <strong>🟩 住宅區 (R)</strong> 提供勞動力與人口；<strong>🟦 商業區 (C)</strong> 提供就業與購物消費；<strong>🟧 工業區 (I)</strong> 提供貨物製造但會產生周圍污染。
              當水電齊全、地價優質且具備教育/醫療服務時，建築將從低矮平房自動升級為<strong className="text-emerald-300">壯觀的 3 級玻璃摩天大樓</strong>！
            </p>
          </div>

          {/* Section 4 */}
          <div className="p-3.5 bg-slate-800/40 rounded-2xl border border-slate-700/50 space-y-1.5">
            <h3 className="font-bold text-white flex items-center gap-2 text-sm">
              <Trees className="w-4 h-4 text-green-400" /> 4. 地價、公園與公共服務
            </h3>
            <p className="leading-relaxed">
              建造 <strong>🌳 公園</strong> 可顯著推升周圍 3 格地價與市民滿意度；興建 <strong>🏫 小學</strong>、<strong>🏥 診所</strong> 與 <strong>🚒 消防局</strong> 能降低火警風險、消除污染危害，促進高科技摩天樓群的誕生。
            </p>
          </div>

          {/* Section 5 */}
          <div className="p-3.5 bg-slate-800/40 rounded-2xl border border-slate-700/50 space-y-1.5">
            <h3 className="font-bold text-white flex items-center gap-2 text-sm">
              <DollarSign className="w-4 h-4 text-emerald-400" /> 5. 智慧自動稅率平衡系統
            </h3>
            <p className="leading-relaxed">
              系統支援<strong className="text-emerald-400">自動動態調稅</strong>：在市庫收支告急時會溫和升稅保障不破產，而在盈餘充裕時自動調降稅率以激勵市民遷入與商業繁榮；市長亦可進入財政面板隨時改為手動固定稅率。
            </p>
          </div>

          {/* Section 6 - Disasters */}
          <div className="p-3.5 bg-rose-950/40 rounded-2xl border border-rose-700/50 space-y-1.5">
            <h3 className="font-bold text-rose-300 flex items-center gap-2 text-sm">
              <span>🚨</span> 6. 突發災難（火災與地震）與應變救援
            </h3>
            <p className="leading-relaxed text-rose-200/90">
              城市偶爾會遭受<strong>大火 🔥</strong>或<strong>地震 🌋</strong>襲擊！發生火警時火勢會向相鄰建物蔓延；請切換至<strong>【🧯 緊急應變】(E)</strong> 工具點擊搶險撲滅或搶修受損建物。在各分區廣設<strong>🚒 消防局</strong>可自動壓制火勢擴散！
            </p>
          </div>

          {/* Controls list */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1 text-[11px] font-mono">
            <span className="text-slate-400 block font-bold mb-1">🎮 操作快捷鍵一覽：</span>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-300">
              <div>• 1: 道路 ($25)</div>
              <div>• 2: 住宅分區 ($50)</div>
              <div>• 3: 商業分區 ($75)</div>
              <div>• 4: 工業分區 ($100)</div>
              <div>• 5: 發電廠 ($1,200)</div>
              <div>• 6: 供水站 ($800)</div>
              <div>• 7: 市民公園 ($180)</div>
              <div>• 8/9/0: 學校 / 醫院 / 消防</div>
              <div>• E: 🧯 緊急應變搶險 ($35)</div>
              <div>• X: 🚜 推土機 ($10)</div>
              <div>• Q: 🔍 勘查詳細地塊</div>
              <div>• R / Shift+R: 旋轉地圖角度 (90°)</div>
              <div>• H / Home: 回歸原始視角 (0°)</div>
              <div>• 空白鍵: 暫停 / 繼續</div>
              <div>• 滑鼠拖曳 / WASD: 移動視角</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/60 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors"
          >
            我明白了，開始建設！
          </button>
        </div>
      </div>
    </div>
  );
};
