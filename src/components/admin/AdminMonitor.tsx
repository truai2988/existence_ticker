import React from "react";
import { Users, Activity, Droplets, Gift, Heart, Send, PlusCircle, Star, Sparkles, Wind } from "lucide-react";
import { DashboardStats } from "../../hooks/useStats";
import { useLanguage } from "../../contexts/LanguageContext";

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
  const { t } = useLanguage();

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
          title={t.ADMIN.MONITOR.TOTAL_USERS}
          value={totalPop.toLocaleString()}
          icon={Users}
          subtitle={t.ADMIN.MONITOR.TOTAL_USERS_DESC}
        />
        <MetricCard
          title={t.ADMIN.MONITOR.TOTAL_SUPPLY}
          value={`${Math.floor(metabolism.totalSupply).toLocaleString()} Lm`}
          icon={Droplets}
          subtitle={t.ADMIN.MONITOR.AVG_BALANCE.replace('%s', Math.floor(metabolism.avgBalance || 0).toLocaleString())}
        />
        <MetricCard
          title={t.ADMIN.MONITOR.VOLUME_10D}
          value={`${Math.floor(metabolism.volume10d).toLocaleString()} Lm`}
          icon={Activity}
          subtitle={t.ADMIN.MONITOR.VOLUME_10D_DESC}
        />
        <MetricCard
          title={t.ADMIN.MONITOR.OVERFLOW_10D}
          value={`${Math.floor(metabolism.overflowLoss || 0).toLocaleString()} Lm`}
          icon={Send}
          subtitle={t.ADMIN.MONITOR.OVERFLOW_10D_DESC}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title={t.ADMIN.MONITOR.GIFT_10D}
          value={`${Math.floor(metabolism.giftVolume).toLocaleString()} Lm`}
          icon={Gift}
          subtitle={t.ADMIN.MONITOR.GIFT_10D_DESC}
        />
        <MetricCard
          title={t.ADMIN.MONITOR.WISH_10D}
          value={`${Math.floor(metabolism.wishVolume).toLocaleString()} Lm`}
          icon={Heart}
          subtitle={t.ADMIN.MONITOR.WISH_10D_DESC}
        />
        <MetricCard
          title={t.ADMIN.MONITOR.REBIRTH_10D}
          value={`${cycle.rebornToday.toLocaleString()}${t.ADMIN.MONITOR.UNIT_TIMES}`}
          icon={PlusCircle}
          subtitle={t.ADMIN.MONITOR.REBIRTH_10D_DESC}
        />
      </div>

      <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500 mt-8 mb-4 border-b border-slate-800 pb-2">
        {t.ADMIN.MONITOR.ACTIVE_WISHES}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title={t.ADMIN.MONITOR.HEAVY_WISH}
          value={`${activeWishes.heavy.toLocaleString()}${t.ADMIN.MONITOR.UNIT_COUNT}`}
          icon={Star}
          subtitle={t.ADMIN.MONITOR.HEAVY_WISH_DESC}
        />
        <MetricCard
          title={t.ADMIN.MONITOR.MEDIUM_WISH}
          value={`${activeWishes.medium.toLocaleString()}${t.ADMIN.MONITOR.UNIT_COUNT}`}
          icon={Sparkles}
          subtitle={t.ADMIN.MONITOR.MEDIUM_WISH_DESC}
        />
        <MetricCard
          title={t.ADMIN.MONITOR.LIGHT_WISH}
          value={`${activeWishes.light.toLocaleString()}${t.ADMIN.MONITOR.UNIT_COUNT}`}
          icon={Wind}
          subtitle={t.ADMIN.MONITOR.LIGHT_WISH_DESC}
        />
      </div>

    </div>
  );
});
