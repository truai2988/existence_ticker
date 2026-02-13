import React, { useEffect, useState } from "react";
import { X, Activity, Sun, Zap, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DiagnosticsResult } from "../hooks/useDiagnostics";
import { DashboardStats } from "../hooks/useStats";

interface DiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  diagnosis: DiagnosticsResult;
  stats: DashboardStats | null;
  onScrollToSupply: () => void;
}

export const DiagnosticModal: React.FC<DiagnosticModalProps> = ({
  isOpen,
  onClose,
  diagnosis,
  stats,
  onScrollToSupply,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => setVisible(true), 10);
    } else {
      document.body.style.overflow = "auto";
      setVisible(false);
    }
  }, [isOpen]);

  if (!isOpen && !visible) return null;
  if (!stats) return null;

  const { metabolism, distribution } = stats;
  const avgBalance = metabolism.avgBalance ? Math.floor(metabolism.avgBalance) : 0;
  
  const totalPop = distribution.full + distribution.quarter + distribution.new;
  const richPercentage = totalPop > 0 ? ((distribution.full / totalPop) * 100).toFixed(1) : "0.0";
  
  // Dynamic "Sage's Voice" Content
  const getSageContent = () => {
      if (diagnosis.isMicro) {
          return {
              voice: "世界はまだ生まれたばかりです。僅かな魂たちが寄り添うこの揺籃期（ようらんき）において、あなたの指先ひとつが嵐にも恵みにもなります。大胆な実験こそが、創世記の特権です。",
              actionTitle: "創世の実験 (Genesis Experiment)",
              actionDesc: "パラメータを極端に振幅させ、個々の魂の反応を観察してください。小規模なコミュニティでは、バタフライエフェクトを肉眼で観測できます。",
              targetValue: "Action: Tune & Watch"
          };
      }

      switch (diagnosis.currentPhase) {
          case 'STARVATION':
              return {
                  voice: `世界は渇きに喘いでいます。平均残高は ${avgBalance.toLocaleString()} Lm まで落ち込み、魂たちは明日への恐怖に震えています。今すぐ世界の回転を早め、乾いた大地に慈悲の雨を降らせてください。`,
                  actionTitle: "春化 (Spring Shift)",
                  actionDesc: "サイクル期間を短縮（5～7日）し、給付の頻度を高めてください。恐怖を取り除くことが最優先です。",
                  targetValue: "Target: 5 Days (Fast)"
              };
          case 'SATURATION':
              return {
                  voice: `世界は贅沢な微睡みに沈んでいます。${richPercentage}% の魂が満たされ、欲求（Wish）が枯れています。Lmの重みを思い出させるために、少し長い冬が必要です。`,
                  actionTitle: "冬化 (Winter Shift)",
                  actionDesc: "サイクル期間を延長（15～20日）し、次の給付までの期間を延ばしてください。枯渇への健全な危機感が、富の放出（循環）を促します。",
                  targetValue: "Target: 20 Days (Slow)"
              };
          case 'STAGNATION':
              return {
                  voice: "深刻な機能不全です。動脈硬化のように、流れが完全に止まっています。これは数値の問題ではなく、信頼（Trust）の欠如です。神が動かなければ、人も動きません。",
                  actionTitle: "神の一手 (First Move)",
                  actionDesc: "システムの外から、あなた自身が「最初の依頼」あるいは「最初の贈与」を行い、心臓マッサージを施してください。",
                  targetValue: "Action: Manual Transact"
              };
          case 'HEALTHY':
          default:
              return {
                  voice: "世界は穏やかな呼吸を繰り返しています。循環と蓄積のバランスは黄金比に近く、理想的な状態です。この美しい均衡を見守ることこそ、最も難しい神の仕事です。",
                  actionTitle: "静観 (Observation)",
                  actionDesc: "今は何もする必要はありません。不必要な介入は波紋を広げるだけです。",
                  targetValue: "Action: Maintain"
              };
      }
  };

  const content = getSageContent();

  return (
    <AnimatePresence>
      <div
        className={`fixed inset-0 z-[200] flex items-center justify-center p-0 sm:p-4 transition-all duration-300 ${
          visible ? "bg-black/80 backdrop-blur-md opacity-100" : "bg-black/0 backdrop-blur-none opacity-0"
        }`}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-slate-900 border border-slate-800 w-full max-w-lg sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[100dvh] sm:max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`p-6 sm:p-8 pb-4 flex justify-between items-start border-b border-slate-800/50 ${diagnosis.bg.replace('/30', '/10')}`}>
            <div>
              <div className="flex items-center gap-2 text-slate-500 mb-1 uppercase tracking-[0.2em] text-[10px] font-sans">
                <Activity size={12} />
                <span>管理者の診断 (Sage's Check)</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif text-white leading-tight">
                 {diagnosis.shortDescription.split('】')[1] || diagnosis.shortDescription}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-slate-500 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="p-6 sm:p-8 pt-6 overflow-y-auto custom-scrollbar space-y-8">
              
              {/* Sage's Voice quote section */}
              <div className="relative group">
                  <div className="absolute -top-4 -left-2 text-6xl text-slate-800 font-serif leading-none select-none">“</div>
                  <div className="relative z-10 pl-6 border-l border-slate-700">
                    <p className="text-slate-300 font-serif text-lg sm:text-xl leading-relaxed italic">
                        {content.voice}
                    </p>
                  </div>
              </div>

              {/* Responsive Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-0.5 bg-slate-800/50 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="bg-slate-900 p-4 text-center">
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">流通速度 (Flow)</div>
                      <div className={`font-mono text-xl sm:text-2xl ${metabolism.rate >= 10 ? 'text-cyan-400' : 'text-slate-300'}`}>
                          {metabolism.rate}%
                      </div>
                  </div>
                  <div className="bg-slate-900 p-4 text-center border-l border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">平均残高 (Avg)</div>
                      <div className="font-mono text-xl sm:text-2xl text-slate-300">
                          {avgBalance.toLocaleString()}
                      </div>
                  </div>
                  <div className="bg-slate-900 p-4 text-center border-t sm:border-t-0 sm:border-l border-slate-800 col-span-2 sm:col-span-1">
                       <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">崩壊係数 (Entropy)</div>
                       <div className="font-mono text-xl sm:text-2xl text-red-500/80">
                          -{metabolism.decay24h.toLocaleString()}
                       </div>
                  </div>
              </div>

              {/* Prescription Action Card */}
              <div className={`p-5 sm:p-6 rounded-xl border transition-colors ${diagnosis.bg}`}>
                  <h3 className="text-[10px] font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2 opacity-80">
                      <Zap size={14} className="text-yellow-400 animate-pulse"/>
                      処方箋 (Prescription)
                  </h3>
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                      <div className="flex-1">
                          <div className="font-serif text-white text-lg sm:text-xl mb-2 tracking-wide">
                              {content.actionTitle}
                          </div>
                          <p className="text-sm text-slate-300/90 leading-relaxed mb-4 font-sans">
                              {content.actionDesc}
                          </p>
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-black/40 border border-white/10 text-[10px] font-mono text-slate-400 rounded-full">
                              <Info size={10} />
                              {content.targetValue}
                          </div>
                      </div>
                      
                      {diagnosis.currentPhase !== 'HEALTHY' && (
                           <button 
                              onClick={() => {
                                  onClose();
                                  setTimeout(onScrollToSupply, 300);
                              }}
                              className="w-full sm:w-auto shrink-0 px-6 py-4 bg-white text-slate-900 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-cyan-50 transition-all active:scale-95 shadow-lg shadow-white/5 active:shadow-none translate-y-0 hover:-translate-y-1"
                           >
                               <Sun size={18} />
                               調整を実行
                           </button>
                      )}
                  </div>
              </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-800/50 bg-slate-900/50 flex flex-col sm:flex-row justify-between items-center gap-2 text-[10px] text-slate-500 uppercase tracking-widest text-center">
              <span>存在通貨 (Existence Ticker)</span>
              <div className="hidden sm:block w-1 h-1 bg-slate-800 rounded-full" />
              <span>白い器の規約 (White Vessel Protocol)</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
