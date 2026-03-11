import React, { useEffect, useState } from "react";
import { X, Activity, Sun, Zap, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DiagnosticsResult } from "../hooks/useDiagnostics";
import { DashboardStats } from "../hooks/useStats";
import { MESSAGES } from "../constants/messages";

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
      const getBaseContent = () => {
          switch (diagnosis.currentPhase) {
              case 'STARVATION':
                  return {
                      voice: MESSAGES.DIAGNOSTICS.STARVATION_VOICE.replace('%s', avgBalance.toLocaleString()),
                      actionTitle: MESSAGES.DIAGNOSTICS.STARVATION_TITLE,
                      actionDesc: MESSAGES.DIAGNOSTICS.STARVATION_DESC,
                      targetValue: MESSAGES.DIAGNOSTICS.STARVATION_TARGET
                  };
              case 'SATURATION':
                  return {
                      voice: MESSAGES.DIAGNOSTICS.SATURATION_VOICE.replace('%s', richPercentage),
                      actionTitle: MESSAGES.DIAGNOSTICS.SATURATION_TITLE,
                      actionDesc: MESSAGES.DIAGNOSTICS.SATURATION_DESC,
                      targetValue: MESSAGES.DIAGNOSTICS.SATURATION_TARGET
                  };
              case 'STAGNATION':
                  return {
                      voice: MESSAGES.DIAGNOSTICS.STAGNATION_VOICE,
                      actionTitle: MESSAGES.DIAGNOSTICS.STAGNATION_TITLE,
                      actionDesc: MESSAGES.DIAGNOSTICS.STAGNATION_DESC,
                      targetValue: MESSAGES.DIAGNOSTICS.STAGNATION_TARGET
                  };
              case 'HEALTHY':
              default:
                  return {
                      voice: MESSAGES.DIAGNOSTICS.HEALTHY_VOICE,
                      actionTitle: MESSAGES.DIAGNOSTICS.HEALTHY_TITLE,
                      actionDesc: MESSAGES.DIAGNOSTICS.HEALTHY_DESC,
                      targetValue: MESSAGES.DIAGNOSTICS.HEALTHY_TARGET
                  };
          }
      };

      const base = getBaseContent();

      if (diagnosis.isMicro) {
          return {
              ...base,
              voice: MESSAGES.DIAGNOSTICS.MICRO_VOICE.replace('%s', base.voice),
              actionDesc: MESSAGES.DIAGNOSTICS.MICRO_DESC.replace('%s', base.actionDesc)
          };
      }

      return base;
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
          className="bg-slate-900 border border-slate-800 w-full max-w-xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[100dvh] sm:max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`p-4 sm:p-6 pb-3 flex justify-between items-start border-b border-slate-800/50 ${diagnosis.bg.replace('/30', '/10')}`}>
            <div>
              <div className="flex items-center gap-2 text-slate-400 mb-0.5 uppercase tracking-[0.2em] text-[10px] font-sans">
                <Activity size={10} />
                <span>{MESSAGES.DIAGNOSTICS.SAGE_TITLE}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-serif text-white leading-tight">
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
          <div className="p-4 sm:p-6 pt-4 overflow-y-auto custom-scrollbar space-y-4">
              
              {/* Sage's Voice quote section */}
              <div className="relative group">
                  <div className="absolute -top-3 -left-1 text-4xl text-slate-800 font-serif leading-none select-none">“</div>
                  <div className="relative z-10 pl-5 border-l border-slate-700">
                    <p className="text-slate-400 font-serif text-sm sm:text-lg leading-relaxed italic whitespace-pre-wrap">
                        {content.voice}
                    </p>
                  </div>
              </div>

              {/* Responsive Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-0.5 bg-slate-800/50 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="bg-slate-900 p-3 text-center">
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">{MESSAGES.DIAGNOSTICS.LBL_SPEED}</div>
                      <div className={`font-mono text-lg sm:text-xl ${metabolism.rate >= 10 ? 'text-cyan-400' : 'text-slate-400'}`}>
                          {metabolism.rate}%
                      </div>
                  </div>
                  <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50">
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">{MESSAGES.DIAGNOSTICS.LBL_SAVINGS}</div>
                        <div className="font-mono text-lg sm:text-xl text-slate-400">
                          {avgBalance.toLocaleString()}
                      </div>
                  </div>
                  <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50">
                       <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">{MESSAGES.DIAGNOSTICS.LBL_DECAY}</div>
                       <div className="font-mono text-lg sm:text-xl text-red-500/80">
                          -{metabolism.decay24h.toLocaleString()}
                       </div>
                  </div>
              </div>

              {/* Prescription Action Card */}
              <div className={`p-4 sm:p-5 rounded-xl border transition-colors ${diagnosis.bg}`}>
                  <h3 className="text-[10px] font-bold text-white uppercase tracking-widest mb-3 flex items-center gap-2 opacity-80">
                      <Zap size={12} className="text-yellow-400 animate-pulse"/>
                      {MESSAGES.DIAGNOSTICS.LBL_PRESCRIPTION}
                  </h3>
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                          <div className="font-serif text-white text-base sm:text-lg mb-1.5 tracking-wide truncate">
                              {content.actionTitle}
                          </div>
                          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed mb-3 font-sans">
                              {content.actionDesc}
                          </p>
                          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-black/40 border border-white/10 text-[10px] font-mono text-slate-500 rounded-full">
                              <Info size={10} />
                              {content.targetValue}
                          </div>
                      </div>
                      
                      <button 
                         onClick={() => {
                             onClose();
                             setTimeout(onScrollToSupply, 300);
                         }}
                         className="w-full sm:w-auto shrink-0 px-5 py-3 bg-white text-slate-900 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-cyan-50 transition-all active:scale-95 shadow-lg shadow-white/5 active:shadow-none"
                      >
                          <Sun size={16} />
                          {diagnosis.currentPhase === 'HEALTHY' ? MESSAGES.DIAGNOSTICS.BTN_ADJUST : MESSAGES.DIAGNOSTICS.BTN_EXECUTE}
                      </button>
                  </div>
              </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
