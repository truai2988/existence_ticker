import React from "react";
import { Sprout, RefreshCw, Plus, Trash2 } from "lucide-react";
import { SeedPlaceholder } from "../../types";

interface AdminSeedsProps {
  seeds: SeedPlaceholder[];
  onFetchSeeds: () => void;
  onSeedLibrary: () => void;
  onAddSeed: (tier: 1000 | 500 | 0, content: string) => void;
  onDeleteSeed: (id: string) => void;
  isLoading: boolean;
  isAdding: boolean;
}

export const AdminSeeds = React.memo<AdminSeedsProps>(({
  seeds,
  onFetchSeeds,
  onSeedLibrary,
  onAddSeed,
  onDeleteSeed,
  isLoading,
  isAdding
}) => {
  const [newSeedTier, setNewSeedTier] = React.useState<1000 | 500 | 0>(1000);
  const [newSeedContent, setNewSeedContent] = React.useState("");

  const handleAdd = () => {
    if (!newSeedContent.trim()) return;
    onAddSeed(newSeedTier, newSeedContent.trim());
    setNewSeedContent("");
  };

  return (
    <div className="animate-in fade-in duration-300 space-y-6">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            <Sprout className="text-emerald-400" />
            種子の書庫
          </h3>
          <p className="text-xs text-slate-500 font-serif italic mt-1">
            この世界に蒔かれる「願いの種」を管理します
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSeedLibrary}
            className="text-[10px] text-emerald-500/70 border border-emerald-500/30 hover:bg-emerald-500/10 px-2 py-1 rounded transition-colors"
          >
            初期の種を蒔く
          </button>
          <button
            type="button"
            onClick={onFetchSeeds}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="種子を更新"
          >
            <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Add Seed Form */}
      <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6 space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
          <Plus size={14} /> 新しい種を蒔く
        </h4>
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            {[1000, 500, 0].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setNewSeedTier(t as 1000 | 500 | 0)}
                className={`flex-1 py-3 rounded-xl border text-sm font-bold tracking-tight transition-all active:scale-[0.98] ${
                  newSeedTier === t
                    ? t === 1000 ? "bg-amber-500/10 border-amber-500 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.1)]" :
                      t === 500 ? "bg-orange-500/10 border-orange-500 text-orange-500" :
                      "bg-pink-500/10 border-pink-500 text-pink-500"
                    : "bg-slate-800/50 border-slate-700 text-slate-500 hover:border-slate-500"
                }`}
              >
                {t === 1000 ? "人生の節目" : t === 500 ? "日常の手助け" : "魂の共鳴"}
                <span className="block text-[10px] opacity-70 font-mono mt-0.5">{t} Lm</span>
              </button>
            ))}
          </div>
          <div className="relative">
            <textarea
              value={newSeedContent}
              onChange={(e) => setNewSeedContent(e.target.value)}
              placeholder="「例えば：...」静かな願いの種を綴ってください"
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-4 text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500/50 transition-all min-h-[100px] font-serif"
            />
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={isAdding || !newSeedContent.trim()}
            className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold tracking-widest text-sm transition-all shadow-lg shadow-emerald-600/20 active:scale-[0.98] disabled:opacity-30 disabled:grayscale"
          >
            {isAdding ? "種を蒔いています..." : "生命のインフラに種を蒔く"}
          </button>
        </div>
      </div>

      {/* Seeds List */}
      <div className="space-y-4">
        {[1000, 500, 0].map((t) => {
          const tierSeeds = seeds.filter((s) => s.tier === t);
          if (tierSeeds.length === 0) return null;
          return (
            <div key={t} className="space-y-3">
              <div className="flex items-center gap-4">
                <div className={`h-[1px] flex-1 ${t === 1000 ? "bg-amber-500/30" : t === 500 ? "bg-orange-500/30" : "bg-pink-500/30"}`} />
                <h5 className={`text-[10px] font-bold uppercase tracking-widest ${t === 1000 ? "text-amber-500" : t === 500 ? "text-orange-500" : "text-pink-500"}`}>
                  {t === 1000 ? "人生の節目" : t === 500 ? "日常の手助け" : "魂の共鳴"}
                </h5>
                <div className={`h-[1px] flex-1 ${t === 1000 ? "bg-amber-500/30" : t === 500 ? "bg-orange-500/30" : "bg-pink-500/30"}`} />
              </div>
              <div className="flex flex-col gap-2">
                {tierSeeds.map((seed) => (
                  <div
                    key={seed.id}
                    className="group bg-slate-900/30 border border-slate-800 hover:border-slate-700 p-4 rounded-xl flex justify-between items-start gap-4 transition-all"
                  >
                    <div className="flex-1">
                      <p className="text-slate-400 font-serif leading-relaxed text-sm">
                        {seed.content}
                      </p>
                      <div className="mt-2 text-[9px] text-slate-600 font-mono uppercase tracking-tighter">
                        蒔かれた日時: {
                          seed.createdAt?.toDate 
                            ? seed.createdAt.toDate().toLocaleString() 
                            : seed.createdAt 
                              ? new Date(seed.createdAt.seconds * 1000).toLocaleString() 
                              : "悠久の刻"
                        }
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteSeed(seed.id)}
                      className="p-2 text-slate-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all active:scale-90"
                      title="種子を削除"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {seeds.length === 0 && !isLoading && (
        <div className="p-12 text-center text-slate-600 border border-dashed border-slate-800 rounded-2xl">
          <Sprout size={24} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">まだ「種」がありません。最初の種を蒔いてください。</p>
        </div>
      )}
    </div>
  );
});
