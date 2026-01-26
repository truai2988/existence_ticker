import React, { useState } from "react";
import { X, Activity, Moon, Sun, AlertTriangle, Book } from "lucide-react";
import { useStats, MetabolismStatus } from "../hooks/useStats";
import { useDiagnostics } from "../hooks/useDiagnostics";
import { DiagnosticModal } from "./DiagnosticModal";

interface AdminDashboardProps {
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const { stats, error, updateCapacity } = useStats();
  const [sliderValue, setSliderValue] = useState(2400);
  const [showManual, setShowManual] = useState(false);
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);
  
  const supplySectionRef = React.useRef<HTMLDivElement>(null);

  const scrollToSupply = () => {
      supplySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };


  // Sync slider with stats when loaded
  React.useEffect(() => {
    if (stats) setSliderValue(stats.sunCapacity);
  }, [stats]);

  const diagnostics = useDiagnostics(stats);

  // Lock body scroll when dashboard is open
  React.useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  if (!stats) return <div className="p-10 text-white">Loading God Mode...</div>;

  const { cycle, metabolism, distribution } = stats;

  // Helper Styles
  // getSeasonColor removed as it is no longer used in the new UI layout

  const getMetaColor = (s: MetabolismStatus) => {
    if (s === "Active") return "text-green-400";
    if (s === "Stable") return "text-yellow-400";
    return "text-red-500";
  };

  const totalPop = distribution.full + distribution.quarter + distribution.new;

  // Pre-calculate ratios for diagnosis
  const distRatio = {
    full: distribution.full / (totalPop || 1), // Avoid DBZ
    quarter: distribution.quarter / (totalPop || 1),
    new: distribution.new / (totalPop || 1),
  };

  return (
    <div className={`fixed inset-0 z-[100] bg-black/95 backdrop-blur-md ${showManual ? 'overflow-hidden' : 'overflow-y-auto'}`}>
      <div className="min-h-full p-4 pb-40 max-w-3xl mx-auto relative">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl -mx-4 px-4 py-4 mb-6 border-b border-slate-800/50 flex justify-between items-center transition-all">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-800 rounded-lg">
              <Activity className="w-5 h-5 text-slate-200" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-200 tracking-wider">
                ADMIN DASHBOARD
              </h1>
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em]">
                Ecosystem Monitor
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowManual(true)}
              className="p-2 hover:bg-slate-800 rounded-full transition-colors text-yellow-500 hover:text-yellow-400"
              title="God's Manual"
            >
              <Book size={24} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 border border-red-500/30 bg-red-900/10 rounded text-red-400 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Diagnosis Banner */}
        <div 
            onClick={() => setShowDiagnosisModal(true)}
            className={`p-4 mb-4 rounded-lg border ${diagnostics.bg} ${diagnostics.text} flex justify-between items-center transition-all duration-500 cursor-pointer hover:bg-opacity-40 group`}
        >
             <span className="font-bold tracking-wide group-hover:underline underline-offset-4 decoration-current/50 decoration-1 flex items-center gap-2">
                 {diagnostics.shortDescription}
                 <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity font-normal no-underline ml-2 bg-black/20 px-2 py-0.5 rounded">
                    Click for Analysis
                 </span>
             </span>
        </div>

        {/* Content Stack */}
        <div className="flex flex-col gap-6">
          {/* SECTION A: ACTIVE CYCLES */}
          <div
            className={`p-6 rounded-2xl border border-slate-700 bg-slate-900/20 relative overflow-hidden group`}
          >
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Moon size={100} />
            </div>
            <h2 className="text-xs font-mono uppercase tracking-widest opacity-70 mb-4">
              Active Cycles
            </h2>

            <div className="flex flex-col gap-4">
              <div>
                <span className="text-3xl font-bold text-slate-200">
                  Day {cycle.day}
                </span>
                <span className="text-xs text-slate-400 ml-2">
                  現在のサイクル日数
                </span>
                <span className="text-xs text-slate-500 ml-2">
                  ({cycle.season} Phase)
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-mono text-cyan-300">
                    {cycle.rebornToday}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm text-slate-400">
                      Souls Reborn Today
                    </span>
                    <span className="text-[10px] text-slate-500">
                      本日の魂の再生数
                    </span>
                  </div>
                </div>

                {(() => {
                  const rate = (cycle.rebornToday / (totalPop || 1)) * 100;
                  const barWidth = Math.min(100, (rate / 20) * 100);
                  const isWarning = rate >= 20;
                  return (
                    <div className="mt-1">
                      <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-1000 ${isWarning ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-cyan-500/50"} animate-pulse`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1 px-0.5">
                        <span className="text-[9px] text-slate-600 font-mono">
                          0%
                        </span>
                        <span className="text-[9px] text-cyan-500 font-bold font-mono">
                          10% IDEAL
                        </span>
                        <span className="text-[9px] text-slate-600 font-mono">
                          20%+
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 leading-tight border-t border-slate-800/50 pt-1">
                        日次代謝率:
                        10%が理想状態。中央より右なら過剰、左なら停滞を意味します。
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* SECTION B: METABOLISM */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/20 relative">
            <h2 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">
              Metabolism
            </h2>

            <div className="flex justify-between items-end mb-6">
              <div>
                <div className="text-sm text-slate-400 mb-1">
                  24h Vol
                  <span className="text-[10px] text-slate-600 ml-2">
                    24時間の総循環量
                  </span>
                </div>
                <div className="text-3xl font-mono text-slate-200">
                  {metabolism.volume24h.toLocaleString()}{" "}
                  <span className="text-sm font-sans">Lm</span>
                </div>
              </div>
              <div className={`text-right ${getMetaColor(metabolism.status)}`}>
                <div className="text-3xl font-bold">{metabolism.rate}%</div>
                <div className="text-xs uppercase tracking-wider">
                  {metabolism.status}
                </div>
                <div className="text-[10px] opacity-70">循環効率</div>
              </div>
            </div>

            {/* Visual Meter */}
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full ${metabolism.status === "Stagnant" ? "bg-red-500" : metabolism.status === "Active" ? "bg-green-500" : "bg-yellow-500"}`}
                style={{
                  width: `${Math.min(100, metabolism.rate * 10)}%`,
                }} // Scale approx for visual
              />
            </div>

            {/* Metabolic Composition (Tri-State) */}
            {(() => {
                const m = metabolism;
                const total = m.totalSupply;
                
                // 1. Circulation (Flow)
                const circulation = m.volume24h;
                
                // 2. Gravity (Decay Loss) - approximated naturally lost
                const decay = m.decay24h;

                // 3. Static (Retention) - Remaining pool
                // const staticPool = Math.max(0, total - circulation);


                // Ratios against (Total Supply + Decay + Overflow)
                // Decay & Overflow are "Gone", but we want to show ratio of "Loss" vs "Circulation".
                // Let's base everything on Total Current Supply for readability, but show Loss as separate metric.
                
                const flowRatio = Math.min(100, (circulation / total) * 100);
                const decayRatio = Math.min(100, (decay / total) * 100);
                const overflowLoss = m.overflowLoss || 0;
                const overflowRatio = Math.min(100, (overflowLoss / total) * 100);
                
                const totalEntropyLoss = decay + overflowLoss;
                const entropyRatio = decayRatio + overflowRatio;

                const staticRatio = Math.max(0, 100 - flowRatio);

                return (
                    <div className="mt-6 border-t border-slate-800/50 pt-4">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-slate-400 font-mono">Metabolic Composition</span>
                            <span className="text-[10px] text-slate-600">対総資産比率</span>
                        </div>
                        
                        {/* 1. Main Bar: Flow vs Static */}
                        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex relative">
                            {/* Flow */}
                            <div 
                                className="h-full bg-gradient-to-r from-green-500 to-emerald-400 shadow-[0_0_10px_rgba(34,197,94,0.4)]"
                                style={{ width: `${flowRatio}%` }}
                            />
                            {/* Static */}
                            <div 
                                className="h-full bg-slate-700"
                                style={{ width: `${staticRatio}%` }}
                            />
                        </div>

                        <div className="flex justify-between text-[10px] mt-2 font-mono">
                            <div className="text-green-400">
                                <span>⚡ CIRCULATION</span>
                                <span className="ml-2 opacity-70">{flowRatio.toFixed(1)}%</span>
                            </div>
                            <div className="text-slate-500">
                                <span>❄️ STAGNATION</span>
                                <span className="ml-2 opacity-70">{staticRatio.toFixed(1)}%</span>
                            </div>
                        </div>

                        {/* Entropy Loss Indicator (Decay + Overflow) */}
                        <div className="mt-4 flex flex-col gap-1">
                             <div className="flex justify-between text-[10px] items-center">
                                 <span className="text-red-400 font-mono">🔥 ENTROPY LOSS (24h)</span>
                                 <span className="text-red-300 font-mono">-{totalEntropyLoss.toLocaleString()} Lm <span className="opacity-50">({entropyRatio.toFixed(1)}%)</span></span>
                             </div>
                             <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
                                 {/* Decay (Natural) */}
                                 <div className="h-full bg-red-900/50" style={{ width: `${(decay / (totalEntropyLoss || 1)) * 100}%` }} />
                                 {/* Overflow (Waste) */}
                                 <div className="h-full bg-red-500" style={{ width: `${(overflowLoss / (totalEntropyLoss || 1)) * 100}%` }} />
                             </div>
                             <div className="flex justify-between text-[9px] text-slate-600 px-0.5">
                                 <span>Gravity: {decay.toLocaleString()}</span>
                                 <span>Overflow: {overflowLoss.toLocaleString()}</span>
                             </div>
                        </div>
                        
                         <p className="text-[10px] text-slate-500 mt-2 leading-tight">
                            ※ 赤色の損失（Overflow含む）が緑色の循環を上回る場合、経済圏は縮小（死滅）に向かいます。<br/>
                            現在のバランス: {flowRatio > entropyRatio ? <span className="text-green-400 font-bold">EXPANDING (成長)</span> : <span className="text-red-400 font-bold">CONTRACTING (縮小)</span>}
                        </p>
                    </div>
                );
            })()}
          </div>

          {/* SECTION C: MOON DISTRIBUTION */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/20 md:col-span-2 lg:col-span-1">
            <h2 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-6">
              資産分布 (ASSET DISTRIBUTION)
            </h2>

            <div className="space-y-4">
              {/* Full */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-yellow-200">
                    🌕 潤沢 (Rich) (&gt;1500){" "}
                    <span className="text-[10px] text-slate-500 ml-1">
                      飽和状態の魂
                    </span>
                  </span>
                  <span className="font-mono text-slate-300">
                    {distribution.full}{" "}
                    <span className="text-[10px] opacity-70">
                      ({(distRatio.full * 100).toFixed(1)}%)
                    </span>
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.4)]"
                    style={{ width: `${distRatio.full * 100}%` }}
                  />
                </div>
              </div>
              {/* Quarter */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">
                    🌓 安定 (Stable){" "}
                    <span className="text-[10px] text-slate-500 ml-1">
                      安定した魂
                    </span>
                  </span>
                  <span className="font-mono text-slate-300">
                    {distribution.quarter}{" "}
                    <span className="text-[10px] opacity-70">
                      ({(distRatio.quarter * 100).toFixed(1)}%)
                    </span>
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-400 shadow-[0_0_8px_rgba(148,163,184,0.3)]"
                    style={{ width: `${distRatio.quarter * 100}%` }}
                  />
                </div>
              </div>
              {/* New */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">
                    🌑 枯渇 (Scarce) (&lt;500){" "}
                    <span className="text-[10px] text-slate-500 ml-1">
                      新生した魂
                    </span>
                  </span>
                  <span className="font-mono text-slate-300">
                    {distribution.new}{" "}
                    <span className="text-[10px] opacity-70">
                      ({(distRatio.new * 100).toFixed(1)}%)
                    </span>
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-600 shadow-[0_0_8px_rgba(8,145,178,0.3)]"
                    style={{ width: `${distRatio.new * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Alert Logic */}
            {cycle.season === "Winter" &&
              distribution.full > totalPop * 0.3 && (
                <div className="mt-6 p-3 border border-red-500/30 bg-red-900/10 rounded flex items-center gap-3 text-red-400 text-xs">
                  <AlertTriangle size={16} />
                  <span>WARNING: High Hoarding detected during Winter.</span>
                </div>
              )}
          </div>

          {/* SECTION D: SUN CONTROL */}
          <div ref={supplySectionRef} className="p-6 rounded-2xl border border-yellow-900/30 bg-yellow-900/5 md:col-span-2 lg:col-span-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-yellow-500">
              <Sun size={80} />
            </div>
            <h2 className="text-xs font-mono text-yellow-600 uppercase tracking-widest mb-4">
              供給設定 (SUPPLY CONTROL)
            </h2>

            <div className="mb-8 text-center">
              <div className="text-xs text-yellow-600/70 mb-2">
                次回給付額 (Next Supply)
                <div className="text-[10px]">次回のサイクル供給量</div>
              </div>
              <div className="text-5xl font-bold text-yellow-500 font-mono tracking-tighter">
                {sliderValue.toLocaleString()}{" "}
                <span className="text-lg">Lm</span>
              </div>
            </div>

            <input
              type="range"
              min="1000"
              max="4000"
              step="100"
              value={sliderValue}
              onChange={(e) => setSliderValue(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-yellow-500 mb-6"
            />

            <button
              onClick={async () => {
                if (
                  window.confirm(
                    `PUBLISH NEW LAW: Solar Capacity = ${sliderValue.toLocaleString()} Lm.\n\nThis will take effect for each soul upon their next rebirth.\nAre you sure?`,
                  )
                ) {
                  try {
                    // Dynamic import
                    const { db } = await import("../lib/firebase");
                    const { doc, setDoc, serverTimestamp } =
                      await import("firebase/firestore");

                    if (!db) throw new Error("Database not initialized");

                    // Just update the Law (Configuration)
                    const settingsRef = doc(db, "system_settings", "global");
                    await setDoc(
                      settingsRef,
                      {
                        capacity: sliderValue,
                        updated_at: serverTimestamp(),
                      },
                      { merge: true },
                    );

                    alert(
                      `Success: Solar Capacity updated to ${sliderValue} Lm.\nThe world will gradually adjust to this new constant.`,
                    );
                    updateCapacity(sliderValue);
                  } catch (e: unknown) {
                    console.error(e);
                    alert(`Failed to Publish Law: ${e}`);
                  }
                }
              }}
              className="w-full py-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-yellow-500/50 text-yellow-500 font-bold uppercase tracking-widest text-xs transition-colors"
            >
              PUBLISH NEW LAW (Update Config)
            </button>
            <p className="text-center text-[10px] text-slate-500 mt-2">
              New capacity will apply to souls upon their next rebirth.
            </p>
          </div>
        </div>
      </div>

      {/* === GOD'S MANUAL OVERLAY === */}
      {showManual && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl p-6 overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="max-w-2xl mx-auto pb-20">
            <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4 sticky top-0 bg-black/50 backdrop-blur-sm z-10 pt-2">
              <div className="flex items-center gap-2 text-yellow-500">
                <Book size={20} />
                <h2 className="font-bold tracking-wider">互助経済圏 運用マニュアル (System Logic & Operations)</h2>
              </div>
              <button
                onClick={() => setShowManual(false)}
                className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-10 text-slate-300 text-sm leading-relaxed">
              <p className="italic text-slate-500 border-l-2 border-slate-700 pl-4">
                このダッシュボードは、地域通貨の「流動性」と「滞留」を監視するコックピットです。<br/>
                管理者の役割は、個別の取引に介入することではなく、<span className="text-yellow-200 font-bold">「基礎給付額 (Base Supply)」</span>という物理定数を調整し、コミュニティ全体の代謝をコントロールすることです。
              </p>

              <section>
                <h3 className="text-lg text-white font-bold mb-4 border-b border-slate-800 pb-2 flex items-center gap-2">
                  <span className="text-blue-400">📊</span> 1. 診断指標の読み方 (Diagnostics)
                </h3>

                <div className="space-y-6">
                  {/* Metabolism */}
                  <div>
                    <h4 className="font-bold text-slate-200 mb-2">A. 経済循環率 (Metabolism / Circulation)</h4>
                    <ul className="list-disc list-inside space-y-1 text-slate-400">
                      <li><span className="text-slate-500 w-24 inline-block">定義:</span>「過去24時間の取引総額」÷「市場の総通貨量」。</li>
                      <li>
                        <span className="text-slate-500 w-24 inline-block">判断基準:</span>
                        <ul className="pl-6 mt-1 space-y-1">
                          <li><span className="text-red-400 font-bold">5%未満 (危険):</span> 血液が止まっています。通貨が使われず、ただ減価して消えている状態です。</li>
                          <li><span className="text-green-400 font-bold">10%以上 (理想):</span> 活発に「手伝い」と「お礼」が交換されています。</li>
                        </ul>
                      </li>
                      <li><span className="text-slate-500 w-24 inline-block">ロジック:</span> 循環率が低い＝「誰も困っていない（飽和）」か「誰も払う余裕がない（枯渇）」のどちらかです。下の「資産分布」を見て判断します。</li>
                    </ul>
                  </div>

                  {/* Distribution */}
                  <div>
                    <h4 className="font-bold text-slate-200 mb-2">B. 資産分布 (Asset Distribution)</h4>
                    <ul className="list-disc list-inside space-y-1 text-slate-400">
                      <li>
                        <span className="text-slate-500 w-24 inline-block">定義:</span>全ユーザーの所持Lmごとの人数分布。
                        <ul className="pl-6 mt-1 space-y-1">
                          <li><span className="text-yellow-400">潤沢 (Rich):</span> 1500 Lm以上。余裕があり、依頼を出せる層。</li>
                          <li><span className="text-slate-400">安定 (Stable):</span> 500 ~ 1500 Lm。</li>
                          <li><span className="text-cyan-400">枯渇 (Needy):</span> 500 Lm未満。手伝いをしないと生き残れない層。</li>
                        </ul>
                      </li>
                      <li><span className="text-slate-500 w-24 inline-block">警告:</span> 「潤沢」が30%を超えると、通貨の価値が下がり、誰も働かなくなります（インフレ/飽和）。</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-lg text-white font-bold mb-4 border-b border-slate-800 pb-2 flex items-center gap-2">
                  <span className="text-yellow-400">🎚</span> 2. 調整レバー：基礎給付設定 (Supply Control)
                </h3>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-slate-200 mb-2">【基本物理法則のおさらい】</h4>
                    <ol className="list-decimal list-inside space-y-1 text-slate-400">
                      <li><span className="text-slate-200">減価:</span> 全ユーザーは生きているだけで <span className="font-mono text-yellow-500">毎時 10 Lm</span> を失います。</li>
                      <li><span className="text-slate-200">リセット:</span> 各ユーザーは登録日から <span className="font-mono text-cyan-400">10日ごと</span> に、ここで設定した「基礎給付額」まで残高が回復（またはカット）されます。</li>
                    </ol>
                  </div>

                  <div className="bg-yellow-900/10 border border-yellow-700/30 p-4 rounded text-yellow-200/80 text-xs">
                    <strong className="text-yellow-400 block mb-1">⚠️ 重要：法の不遡及（ふそきゅう）</strong>
                    このスライダーで設定を変更しても、<span className="underline decoration-yellow-500 decoration-wavy">今すぐ全員の残高が変わるわけではありません。</span><br/>
                    ユーザー個々人が「次の10日目のリセット日」を迎えた瞬間から、新しい設定値が適用されます。（効果が全体に行き渡るまで、最大で10日間のラグがあります）
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-lg text-white font-bold mb-4 border-b border-slate-800 pb-2 flex items-center gap-2">
                  <span className="text-red-400">🛠</span> 3. 状況別対応マニュアル (Philosophy)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div id="case-a" className="p-4 rounded-lg border border-yellow-500/20 bg-yellow-950/20">
                    <h4 className="font-bold text-yellow-300 mb-2">Case A: 静寂なる停滞 (Silent Stagnation)</h4>
                    <div className="space-y-2 text-xs text-yellow-100/70">
                      <p><span className="text-slate-400">条件:</span> 循環率 &lt; 消滅率 かつ <span className="text-yellow-400">平均残高 &gt; 1200 Lm (飽和)</span></p>
                      <p>人々は満たされていますが、繋がり（Wish/Gift）を忘れています。「平和だが、死に向かっている」状態です。</p>
                      <div className="mt-3 pt-3 border-t border-yellow-500/20">
                        <span className="text-white font-bold block mb-1">処方箋：【祝祭 (Jubilee)】</span>
                        <ul className="list-disc list-inside">
                          <li>無理に給付を減らす必要はありません（反感を買います）。</li>
                          <li>代わりに、<strong>「新たなWish（願い）」を喚起するイベント</strong>が必要です。</li>
                          <li>人々が溜め込んだエネルギーを一気に放出させるような、祝祭的な介入が有効です。</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div id="case-b" className="p-4 rounded-lg border border-cyan-500/20 bg-cyan-950/20">
                    <h4 className="font-bold text-cyan-300 mb-2">Case B: 渇きの連鎖 (Chain of Thirst)</h4>
                    <div className="space-y-2 text-xs text-cyan-100/70">
                      <p><span className="text-slate-400">条件:</span> 循環率 &lt; 消滅率 かつ <span className="text-cyan-400">平均残高 &lt; 1200 Lm (飢餓)</span></p>
                      <p>極めて危険な状態です。余裕がないため、誰も他者を助けることができず、信頼の連鎖が断ち切られています。</p>
                      <div className="mt-3 pt-3 border-t border-cyan-500/20">
                        <span className="text-white font-bold block mb-1">処方箋：【太陽の恵み (Sun's Grace)】</span>
                        <ul className="list-disc list-inside">
                           <li><strong>直ちに「太陽」の出力を上げてください。</strong> (Target: 3000Lm+)</li>
                           <li>乾いた大地に水を満たし、人々が顔を上げて「他者」を見る余裕を取り戻させる必要があります。</li>
                        </ul>
                      </div>
                    </div>
                  </div>


                  <div id="case-c" className="p-4 rounded-lg border border-red-500/20 bg-red-950/20 md:col-span-2">
                    <h4 className="font-bold text-red-300 mb-2">Case C: 完全循環不全 (Total Failure)</h4>
                    <div className="space-y-4 text-xs text-red-100/70">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p><span className="text-slate-500 block">症状:</span> 経済循環率 (Metabolism) が 5%未満 (RED)。資産分布に関わらず、とにかく取引が発生していない。</p>
                          <p className="mt-2 text-red-300 font-bold">これはシステムの問題ではなく、文化の不足です。</p>
                        </div>
                        <div>
                          <span className="text-white font-bold block mb-1">処置：【神的介入 (Divine Intervention)】</span>
                          <ul className="list-disc list-inside space-y-2">
                             <li>Admin自身が「最初の依頼」を出してください。</li>
                             <li>Admin自身が「最初の救済」を行ってください。</li>
                             <li>神が動かない世界で、人は動きません。</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      <DiagnosticModal 
        isOpen={showDiagnosisModal}
        onClose={() => setShowDiagnosisModal(false)}
        diagnosis={diagnostics}
        stats={stats}
        onScrollToSupply={scrollToSupply}
      />
    </div>
  );
};

