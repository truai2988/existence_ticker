import React from "react";
import { Activity, Moon, Sun, AlertTriangle } from "lucide-react";
import { MetabolismStatus, DashboardStats } from "../../hooks/useStats";

interface AdminMonitorProps {
  stats: DashboardStats;
  onOpenDiagnostics: () => void;
}

export const AdminMonitor = React.memo<AdminMonitorProps>(({ stats, onOpenDiagnostics }) => {
  const { metabolism, distribution } = stats;

  const getMetaColor = (s: MetabolismStatus) => {
    if (s === "Active") return "text-green-400";
    if (s === "Stable") return "text-yellow-400";
    return "text-red-500";
  };

  const totalPop = distribution.full + distribution.quarter + distribution.new;
  const distRatio = {
    full: distribution.full / (totalPop || 1),
    quarter: distribution.quarter / (totalPop || 1),
    new: distribution.new / (totalPop || 1),
  };

  return (
    <div className="animate-in fade-in duration-300 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Metabolism Card */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              代謝状態 (Metabolism)
            </h3>
            <Activity className={`w-4 h-4 ${getMetaColor(metabolism.status)}`} />
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className={`text-3xl font-bold font-mono ${getMetaColor(metabolism.status)}`}>
              {metabolism.status}
            </span>
            <span className="text-slate-500 text-sm font-mono">
              / {metabolism.rate.toFixed(1)}%
            </span>
          </div>
          <p className="text-xs text-slate-500 font-serif italic">
            全住民のLm減衰と自律分配のバランス指標
          </p>
        </div>

        {/* Population Card */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-4">
            存在の分布 (Distribution)
          </h3>
          <div className="flex h-3 rounded-full overflow-hidden bg-slate-800 mb-4">
            <div
              className="bg-yellow-400"
              style={{ width: `${distRatio.full * 100}%` }}
              title={`満月: ${distribution.full}`}
            />
            <div
              className="bg-slate-400"
              style={{ width: `${distRatio.quarter * 100}%` }}
              title={`半月: ${distribution.quarter}`}
            />
            <div
              className="bg-slate-600"
              style={{ width: `${distRatio.new * 100}%` }}
              title={`新月: ${distribution.new}`}
            />
          </div>
          <div className="flex justify-between text-xs font-mono text-slate-500">
            <span className="flex items-center gap-1">
              <Sun size={10} className="text-yellow-400" />
              {distribution.full}
            </span>
            <span className="flex items-center gap-1">
              <Moon size={10} className="text-slate-500" />
              {distribution.quarter}
            </span>
            <span className="flex items-center gap-1 opacity-60">
              <Moon size={10} className="text-slate-500" />
              {distribution.new}
            </span>
          </div>
        </div>
      </div>

      {/* Diagnostics Trigger Card */}
      <div
        onClick={onOpenDiagnostics}
        className="group bg-slate-900/50 rounded-2xl border border-slate-800 p-6 flex items-center justify-between cursor-pointer hover:bg-slate-800/50 transition-all active:scale-[0.99]"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-yellow-500/10 rounded-xl group-hover:bg-yellow-500/20 transition-colors">
            <AlertTriangle className="text-yellow-500" size={20} />
          </div>
          <div>
            <h3 className="text-slate-200 font-bold">システム診断 (Diagnostics)</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              数理的な整合性とプロトコルの健全性を確認
            </p>
          </div>
        </div>
        <div className="text-slate-600 group-hover:text-slate-400 transition-colors">
          →
        </div>
      </div>
    </div>
  );
});
