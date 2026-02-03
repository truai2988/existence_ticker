import React, { useEffect, useState } from "react";
import { X, Activity, Sun, Zap } from "lucide-react";
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
      setTimeout(() => setVisible(true), 10);
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  if (!isOpen && !visible) return null;

  if (!stats) return null;

  const { metabolism, distribution } = stats;
  const avgBalance = metabolism.avgBalance ? Math.floor(metabolism.avgBalance) : 0;
  
  const totalPop = distribution.full + distribution.quarter + distribution.new;
  const richPercentage = totalPop > 0 ? ((distribution.full / totalPop) * 100).toFixed(1) : "0.0";
  // const needyPercentage = totalPop > 0 ? ((distribution.new / totalPop) * 100).toFixed(1) : "0.0";
  
  // Dynamic "Sage's Voice" Content
  const getSageContent = () => {
      // 0. Micro Scale Override
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
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center p-4 transition-all duration-300 ${
        visible ? "bg-black/60 backdrop-blur-sm opacity-100" : "bg-black/0 backdrop-blur-none opacity-0"
      }`}
      onClick={onClose}
    >
      {/* White Vessel Card */}
      <div
        className={`bg-white w-full max-w-lg rounded-sm shadow-2xl overflow-hidden transition-all duration-500 transform ${
          visible ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: Minimalist Serif */}
        <div className="border-b border-slate-100 p-8 pb-6 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 text-slate-400 mb-2 uppercase tracking-[0.2em] text-[11px] font-sans">
              <Activity size={14} />
              <span>管理者の診断 (Sage's Check)</span>
            </div>
            <h2 className="text-3xl font-serif text-slate-900 leading-tight">
               {diagnosis.shortDescription.split('】')[1] || diagnosis.shortDescription}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-slate-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body: Philosophical Analysis */}
        <div className="p-8 pt-6 space-y-8">
            
            {/* The Voice */}
            <div className="relative">
                <span className="absolute -top-2 -left-2 text-6xl text-slate-100 font-serif leading-none">“</span>
                <p className="relative z-10 text-slate-600 font-serif text-lg leading-relaxed pl-4 border-l-2 border-slate-200 italic">
                    {content.voice}
                </p>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-3 gap-4 border-t border-b border-slate-100 py-6">
                <div className="text-center">
                    <div className="text-[11px] text-slate-400 uppercase tracking-widest mb-1">循環率 (Flow)</div>
                    <div className={`font-mono text-xl ${metabolism.rate >= 10 ? 'text-green-600' : 'text-slate-700'}`}>
                        {metabolism.rate}%
                    </div>
                </div>
                <div className="text-center border-l border-slate-100">
                    <div className="text-[11px] text-slate-400 uppercase tracking-widest mb-1">平均残高 (Avg)</div>
                    <div className="font-mono text-xl text-slate-700">
                        {avgBalance.toLocaleString()}
                    </div>
                </div>
                <div className="text-center border-l border-slate-100">
                     <div className="text-[11px] text-slate-400 uppercase tracking-widest mb-1">崩壊係数 (Entropy)</div>
                     <div className="font-mono text-xl text-red-400">
                        -{metabolism.decay24h.toLocaleString()}
                     </div>
                </div>
            </div>

            {/* Prescription (Action) */}
            <div className="bg-slate-50 p-6 rounded-sm border border-slate-100">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Zap size={14} className="text-slate-400"/>
                    処方箋 (Prescription)
                </h3>
                <div className="flex justify-between items-start gap-4">
                    <div>
                        <div className="font-serif text-slate-900 text-lg mb-1">
                            {content.actionTitle}
                        </div>
                        <p className="text-sm text-slate-500 leading-relaxed mb-3">
                            {content.actionDesc}
                        </p>
                        <div className="inline-block px-2 py-1 bg-white border border-slate-200 text-[11px] font-mono text-slate-400 rounded">
                            {content.targetValue}
                        </div>
                    </div>
                    
                    {diagnosis.currentPhase !== 'HEALTHY' && (
                         <button 
                            onClick={() => {
                                onClose();
                                setTimeout(onScrollToSupply, 300);
                            }}
                            className="shrink-0 p-3 bg-slate-900 text-white rounded-full hover:bg-slate-700 transition-colors group"
                            title="Go to Supply Control"
                         >
                             <Sun size={20} className="group-hover:rotate-45 transition-transform duration-500"/>
                         </button>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center text-[11px] text-slate-400 uppercase tracking-widest">
                <span>存在通貨 (Existence Ticker)</span>
                <span>白い器の規約 (White Vessel Protocol)</span>
            </div>
        </div>
      </div>
    </div>
  );
};
