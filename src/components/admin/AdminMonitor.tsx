import React from "react";
import { Users, Activity, Droplets, Gift, Heart, Send, PlusCircle, Star, Sparkles, Wind } from "lucide-react";
import { DashboardStats } from "../../hooks/useStats";

interface AdminMonitorProps {
  stats: DashboardStats;
}

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  subtitle?: string;
}

export const AdminMonitor = React.memo<AdminMonitorProps>(({ stats }) => {
  const { metabolism, distribution, cycle, wishesActive } = stats;

  const totalPop = distribution.full + distribution.quarter + distribution.new;
  const activeWishes = wishesActive || { light: 0, medium: 0, heavy: 0 };

  const MetricCard = ({ title, value, icon: Icon, subtitle }: MetricCardProps) => (
    <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6 flex flex-col">
      <div className="flex justify-between items-start mb-4 text-slate-400">
        <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
          {title}
        </h3>
        <Icon className="w-4 h-4 text-slate-600" />
      </div>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-2xl font-bold font-mono text-slate-200">
          {value}
        </span>
      </div>
      {subtitle && (
        <p className="text-xs text-slate-500 font-sans mt-2">
          {subtitle}
        </p>
      )}
    </div>
  );

  return (
    <div className="animate-in fade-in duration-300 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="総住民数"
          value={totalPop.toLocaleString()}
          icon={Users}
          subtitle="現在生存しているアカウント数"
        />
        <MetricCard
          title="総流通量 (Total Supply)"
          value={`${Math.floor(metabolism.totalSupply).toLocaleString()} Lm`}
          icon={Droplets}
          subtitle={`平均残高: ${Math.floor(metabolism.avgBalance || 0).toLocaleString()} Lm`}
        />
        <MetricCard
          title="10日間 取引量 (Volume)"
          value={`${Math.floor(metabolism.volume10d).toLocaleString()} Lm`}
          icon={Activity}
          subtitle="過去10日間に動いたLmの総量"
        />
        <MetricCard
          title="10日間 溢出量 (Overflow)"
          value={`${Math.floor(metabolism.overflowLoss || 0).toLocaleString()} Lm`}
          icon={Send}
          subtitle="上限を超えて大気に還った量"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="10日間 想いの譲渡"
          value={`${Math.floor(metabolism.giftVolume).toLocaleString()} Lm`}
          icon={Gift}
          subtitle="相手を指定して贈られた量"
        />
        <MetricCard
          title="10日間 願いへの共鳴"
          value={`${Math.floor(metabolism.wishVolume).toLocaleString()} Lm`}
          icon={Heart}
          subtitle="願いに対して添えられた量"
        />
        <MetricCard
          title="10日間 再生 (Rebirth)"
          value={`${cycle.rebornToday.toLocaleString()} 回`}
          icon={PlusCircle}
          subtitle="過去10日でリセットを迎えた回数"
        />
      </div>

      <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500 mt-8 mb-4 border-b border-slate-800 pb-2">
        進行中の願い (Active Wishes)
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="大いなる願い (1000Lm)"
          value={`${activeWishes.heavy.toLocaleString()} 件`}
          icon={Star}
          subtitle="時間を要する大きな手助け等"
        />
        <MetricCard
          title="日常の願い (500Lm)"
          value={`${activeWishes.medium.toLocaleString()} 件`}
          icon={Sparkles}
          subtitle="日常のちょっとした手助け"
        />
        <MetricCard
          title="無償の願い (0Lm)"
          value={`${activeWishes.light.toLocaleString()} 件`}
          icon={Wind}
          subtitle="数字で測れない想いの交換"
        />
      </div>
    </div>
  );
});
