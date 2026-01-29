import React, { useState } from "react";
import { X, Activity, Moon, Sun, AlertTriangle, Book } from "lucide-react";
import { useStats, MetabolismStatus } from "../hooks/useStats";
import { useDiagnostics } from "../hooks/useDiagnostics";
import { DiagnosticModal } from "./DiagnosticModal";

interface AdminDashboardProps {
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const { stats, error } = useStats(); // updateCapacity removed
  const [cycleDays, setCycleDays] = useState(10);
  const [showManual, setShowManual] = useState(false);
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);
  
  const supplySectionRef = React.useRef<HTMLDivElement>(null);

  const scrollToSupply = () => {
      supplySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };


  // Load Cycle Config from Firestore directly
  React.useEffect(() => {
    const fetchConfig = async () => {
        try {
            const { db } = await import("../lib/firebase");
            const { doc, getDoc } = await import("firebase/firestore");
            if (!db) return;
            
            const settingsRef = doc(db, "system_settings", "global");
            const snap = await getDoc(settingsRef);
            if (snap.exists() && snap.data().cycleDays) {
                setCycleDays(snap.data().cycleDays);
            }
        } catch (e) {
            console.error("Failed to fetch cycle config", e);
        }
    };
    fetchConfig();
  }, []);

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
              className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
              title="Protocol Whitepaper"
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

          {/* SECTION D: TIME CONTROL (Previously Sun Control) */}
          <div ref={supplySectionRef} className="p-6 rounded-2xl border border-yellow-900/30 bg-yellow-900/5 md:col-span-2 lg:col-span-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-yellow-500">
              <Sun size={80} />
            </div>
            <h2 className="text-xs font-mono text-yellow-600 uppercase tracking-widest mb-4">
              時空調整 (TIME CONTROL)
            </h2>

            <div className="mb-8 text-center">
              <div className="text-xs text-yellow-600/70 mb-2">
                再生サイクル期間 (Cycle Duration)
                <div className="text-[10px]">次回リセットまでの日数</div>
              </div>
              <div className="text-5xl font-bold text-yellow-500 font-mono tracking-tighter">
                {cycleDays}{" "}
                <span className="text-lg">Days</span>
              </div>
              <div className="mt-2 text-sm font-bold">
                 {cycleDays < 10 && <span className="text-green-500">Spring (豊穣 - 循環加速)</span>}
                 {cycleDays === 10 && <span className="text-yellow-500">Equinox (調和 - 標準)</span>}
                 {cycleDays > 10 && <span className="text-slate-400">Winter (試練 - 選別)</span>}
              </div>
            </div>

            <div className="relative mb-6">
                <input
                  type="range"
                  min="5"
                  max="20"
                  step="1"
                  value={cycleDays}
                  onChange={(e) => setCycleDays(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-2">
                    <span>5 Days (Fast)</span>
                    <span>10 Days (Std)</span>
                    <span>20 Days (Slow)</span>
                </div>
            </div>

            <button
              onClick={async () => {
                if (
                  window.confirm(
                    `PUBLISH NEW LAW: Cycle Duration = ${cycleDays} Days.\n\nChanges will apply to users upon their NEXT rebirth calculation.\n\nShorter cycle = More frequent 2400 Lm grants.\nLonger cycle = Scarcity.\n\nAre you sure?`,
                  )
                ) {
                  try {
                    // Dynamic import
                    const { db } = await import("../lib/firebase");
                    const { doc, setDoc, serverTimestamp } =
                      await import("firebase/firestore");

                    if (!db) throw new Error("Database not initialized");

                    // Update Global Config (cycleDays)
                    const settingsRef = doc(db, "system_settings", "global");
                    await setDoc(
                      settingsRef,
                      {
                        cycleDays: cycleDays,
                        updated_at: serverTimestamp(),
                      },
                      { merge: true },
                    );

                    alert(
                      `Success: Time Law updated to ${cycleDays} Days.\nThe world rhythm will shift.`,
                    );
                    // No need to update local stats derived state immediately, handled by next reload or logic
                  } catch (e: unknown) {
                    console.error(e);
                    alert(`Failed to Publish Law: ${e}`);
                  }
                }
              }}
              className="w-full py-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-yellow-500/50 text-yellow-500 font-bold uppercase tracking-widest text-xs transition-colors"
            >
              PUBLISH NEW LAW (Update Cycle)
            </button>
            <p className="text-center text-[10px] text-slate-500 mt-2">
              Fixed Rebirth Amount: <span className="text-slate-300">2,400 Lm</span> (Immutable)
            </p>
          </div>
        </div>
      </div>

      {/* === PROTOCOL WHITEPAPER OVERLAY === */}
      {showManual && (
        <div className="fixed inset-0 z-[200] bg-white/95 backdrop-blur-xl p-6 overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-300 text-slate-800">
          <div className="max-w-3xl mx-auto pb-20 mt-10">
            {/* Header */}
            <div className="flex justify-between items-start mb-12 border-b-2 border-slate-900 pb-6">
              <div>
                <div className="flex items-center gap-2 text-slate-500 mb-2 uppercase tracking-[0.2em] text-[10px] font-sans">
                  <Activity size={14} />
                  <span>Existence Ticker Protocol v2.0</span>
                </div>
                <h1 className="text-4xl font-serif font-bold text-slate-900 leading-tight">
                  自律分散型互助生態系構想書
                  <span className="block text-lg font-sans font-normal text-slate-500 mt-2">Autonomous Mutual Aid Ecosystem Protocol</span>
                </h1>
              </div>
              <button
                onClick={() => setShowManual(false)}
                className="p-3 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-16 font-serif leading-relaxed text-lg text-slate-700">
              
              {/* Introduction */}
              <section className="prose prose-slate max-w-none">
                <p className="text-xl italic text-slate-500 border-l-4 border-slate-200 pl-6 py-2">
                  本ドキュメントは、本システムの投資家および設計協力者に向けたアーキテクチャ解説書です。<br/>
                  我々は「富の保存」ではなく「感謝の循環」を価値の源泉とする、新たな経済物理学を実装しました。
                </p>
              </section>

              {/* Chapter 1 */}
              <section>
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-6xl font-thin text-slate-200">01</span>
                  <div className="h-px bg-slate-200 flex-grow"></div>
                  <h2 className="text-2xl font-bold text-slate-900 font-sans">哲学 (Philosophy)</h2>
                </div>
                <h3 className="text-xl font-bold mb-4">"Stock" から "Flow" へ</h3>
                <p className="mb-6">
                  現代社会の閉塞感は「感謝の滞留」にあります。エネルギー（貨幣）が循環の媒体としての機能を失い、個人の所有物（Stock）としてダムのように堰き止められた時、生態系は枯れ果てます。<br/>
                  我々はこの問題を解決するために、通貨を<strong className="text-slate-900 font-bold bg-yellow-100 px-1">「保存する資産」から「感謝を伝えるエネルギー」へと再定義</strong>しました。
                </p>
                <p>
                  この世界では、溜め込むことは腐敗（減価）を意味し、他者へ循環させることこそが生存戦略となります。<br/>
                  住人は「富を得るため」ではなく、「誰かを助け、誰かに助けられるため」にこのエネルギーを使用します。
                </p>
              </section>

              {/* Chapter 2 */}
              <section>
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-6xl font-thin text-slate-200">02</span>
                  <div className="h-px bg-slate-200 flex-grow"></div>
                  <h2 className="text-2xl font-bold text-slate-900 font-sans">機構 (Mechanism)</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-slate-50 p-6 rounded border border-slate-100">
                    <h3 className="text-lg font-bold font-sans mb-3 text-slate-900 flex items-center gap-2">
                      <span className="text-red-400">▼</span> エントロピー (Entropy)
                    </h3>
                    <p className="text-base text-slate-600">
                      自然界の法則と同様に、全てのエネルギーは時間とともに散逸（Decay）します。
                      現在、<span className="font-mono bg-slate-200 text-slate-800 px-1 text-sm">毎時 10 Lm</span> の減価圧力がシステム全体にかかっています。
                      これにより、既得権益の固定化（格差の固定）を物理的に阻止し、常に新たな代謝を促します。
                    </p>
                  </div>

                  <div className="bg-slate-50 p-6 rounded border border-slate-100">
                    <h3 className="text-lg font-bold font-sans mb-3 text-slate-900 flex items-center gap-2">
                      <span className="text-yellow-500">▲</span> 太陽 (The Sun)
                    </h3>
                    <p className="text-base text-slate-600">
                      減価によって失われた総量は、システム全体への「生命維持エネルギー（Basic Supply）」として還元されます。
                      これは行政による「給付」でも、富める者からの「再分配」でもありません。<br/>
                      あなたがここに<strong className="text-slate-900">「存在している」という事実そのものを担保にして</strong>、天から無条件に降り注ぐ<span className="font-mono bg-slate-200 text-slate-800 px-1 text-sm">光のギフト</span>です。
                      太陽が昇る限り、あなたの生存は世界によって肯定され続けます。
                    </p>
                  </div>
                </div>
              </section>

              {/* Chapter 3 */}
              <section>
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-6xl font-thin text-slate-200">03</span>
                  <div className="h-px bg-slate-200 flex-grow"></div>
                  <h2 className="text-2xl font-bold text-slate-900 font-sans">運用 (Governance)</h2>
                </div>
                <h3 className="text-xl font-bold mb-4">支配ではなく、調律</h3>
                <p className="mb-6">
                  管理者の役割は、住人の個別のやり取りを監視することではありません。<br/>
                  世界の「温度（代謝率）」と「湿度（エネルギー分布）」を観測し、<strong className="text-slate-900 font-bold">「基礎給付額（Basic Supply）」というたった一つの物理定数を調整すること</strong>だけが許された権限です。
                </p>
                
                <div className="bg-slate-900 text-white p-8 rounded-sm shadow-xl mt-8">
                   <h4 className="font-sans text-xs uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-700 pb-2">Admin Protocol</h4>
                   <p className="font-mono text-sm leading-relaxed text-slate-300">
                     &gt; We do not manage the economy. <span className="text-slate-500 text-xs">(我々は経済を管理しない)</span><br/>
                     &gt; We design the ecosystem. <span className="text-slate-500 text-xs">(我々は生態系を設計する)</span><br/>
                     &gt; <br/>
                     &gt; The goal is to maximize the "Circulation Rate" (Metabolism), not the "Total Asset Value" (Stock).<br/>
                     <span className="text-slate-500 text-xs pl-4 block mb-1"> (目的は「循環」の最大化であり、「総資産」の最大化ではない)</span>
                     &gt; A healthy world is not one where everyone is rich, but one where help is always available.<br/>
                     <span className="text-slate-500 text-xs pl-4 block"> (健全な世界とは、全員が富裕な場所ではなく、救済が常に遍在する場所である)</span>
                   </p>
                </div>
              </section>

              {/* Chapter 4 */}
              <section>
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-6xl font-thin text-slate-200">04</span>
                  <div className="h-px bg-slate-200 flex-grow"></div>
                  <h2 className="text-2xl font-bold text-slate-900 font-sans">運用プロトコル (Operational Protocols)</h2>
                </div>
                
                <h3 className="text-xl font-bold mb-6 font-sans">4.1 構造的制約 (Structural Constraints)</h3>
                <div className="bg-slate-50 p-6 rounded border border-slate-100 mb-8">
                   <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                       <span className="text-blue-600">ℹ</span> 基準値 (Standard Baseline)
                   </h4>
                   <p className="font-mono text-slate-600 text-sm mb-4 leading-relaxed">
                       本システムのデフォルト容量（物理定数）は <strong className="text-slate-900">2400 Lm</strong> に設定されています。<br/><br/>
                       これは「24時間 × 10日間 = 2400 Lm」という、<strong className="text-slate-900">一人の人間が誰にも助けられずに生存できる最大備蓄量</strong>を意味します。孤立した個体が保持できるエネルギーの物理的限界点です。<br/><br/>
                       この器（Cap）を超えたエネルギーは「溢出（Overflow）」となり、虚空へ還ります。<br/>
                       しかし、この「溢れ」こそが、実は「太陽（Basic Supply）」のエネルギー源として再利用される<strong className="text-slate-900">隠れたエコシステム・ループ</strong>を形成しています。<br/>
                       個人の余剰は、巡り巡って世界全体の生命維持装置を稼働させる燃料となるのです。
                   </p>

                   <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2 border-t border-slate-200 pt-4">
                       <span className="text-yellow-600">⚠</span> 法の不遡及 (Law of Non-Retroactivity)
                   </h4>
                   <p className="text-slate-600 text-sm mb-0 leading-relaxed">
                       「基礎給付額（Basic Supply）」の変更は、即座に全ユーザーに適用されるわけではありません。<br/>
                       各ユーザーは個別に決定された「リセット日（10日周期）」を持っており、新しい設定値は<strong className="text-slate-900">個々の次回リセット時</strong>に初めて適用されます。<br/>
                       したがって、調律（Tuning）の効果が生態系全体に行き渡るまでには、最大で10日間のタイムラグ（Latency）が発生します。
                   </p>
                </div>

                <h3 className="text-xl font-bold mb-6 font-sans">4.2 生体バイタル (Vital Signs)</h3>
                
                <div className="space-y-6">
                    {/* KPI 1 */}
                    <div>
                        <h4 className="border-l-4 border-slate-900 pl-3 font-bold text-lg text-slate-800 mb-2">
                            A. 経済代謝率 (Metabolic Rate)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-2">
                             <div className="bg-slate-50 p-3 rounded">
                                 <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Calculation</div>
                                 <div className="font-mono text-slate-700">Daily Volume ÷ Total Supply × 100 (%)</div>
                             </div>
                             <div className="bg-slate-50 p-3 rounded">
                                 <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Target Zone</div>
                                 <div className="font-mono text-green-600 font-bold">&gt; 10.0% (Ideal)</div>
                             </div>
                        </div>
                        <p className="text-slate-600 text-sm">
                            総滞留量（GDP）の多寡は重要ではありません。「血液の流速」こそが生命の証です。<br/>
                            5%を下回る状態は「心停止」と同義であり、緊急の介入（Divine Intervention）を要します。
                        </p>
                    </div>

                    {/* KPI 2 */}
                    <div>
                        <h4 className="border-l-4 border-slate-900 pl-3 font-bold text-lg text-slate-800 mb-2">
                            B. 資産分布深度 (Distribution Depth)
                        </h4>
                         <ul className="list-disc list-inside space-y-2 text-slate-600 text-sm">
                             <li>
                                 <strong className="text-slate-800">Saturated (&gt;1500 Lm):</strong> 
                                 この層が30%を超えると「飽和（Saturation）」です。エネルギー価値が希釈され、誰も働かなくなります。
                             </li>
                             <li>
                                 <strong className="text-slate-800">Thirsty (&lt;500 Lm):</strong>
                                 この層が50%を超えると「飢餓（Starvation）」です。生存不安により、他者への貢献（循環）が停止します。
                             </li>
                         </ul>
                    </div>
                </div>

                <h3 className="text-xl font-bold mt-10 mb-6 font-sans">4.3 サイクルと季節性 (Cycle & Seasonality)</h3>
                <div className="space-y-6">
                    <div>
                        <h4 className="border-l-4 border-slate-900 pl-3 font-bold text-lg text-slate-800 mb-2">
                             C. 平均サイクル日数 (Average Phase)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-center text-sm mb-2">
                            <div className="bg-green-50 p-2 rounded border border-green-100">
                                <span className="block font-bold text-green-700">Spring (Day 1-3)</span>
                                <span className="text-xs text-slate-500">成長期</span>
                            </div>
                            <div className="bg-orange-50 p-2 rounded border border-orange-100">
                                <span className="block font-bold text-orange-700">Autumn (Day 4-7)</span>
                                <span className="text-xs text-slate-500">成熟期</span>
                            </div>
                            <div className="bg-slate-100 p-2 rounded border border-slate-200">
                                <span className="block font-bold text-slate-700">Winter (Day 8-10)</span>
                                <span className="text-xs text-slate-500">終末期</span>
                            </div>
                        </div>
                        <p className="text-slate-600 text-sm">
                            「Winter」における富の蓄積は危険です。死にゆく者が資産を抱え込んでも、それは数日後に消滅する運命にあるからです。Winterでの飽和は迅速な消費（Gift）を促す必要があります。
                        </p>
                    </div>

                    <div>
                         <h4 className="border-l-4 border-slate-900 pl-3 font-bold text-lg text-slate-800 mb-2">
                             D. 日次代謝率 (Daily Turnover)
                        </h4>
                         <ul className="list-disc list-inside space-y-1 text-slate-600 text-sm">
                             <li><strong className="text-slate-800">Ideal: 10%</strong> (10日間で1巡するため、毎日10%が入れ替わるのが平衡状態)</li>
                             <li>この値が大きく偏ると、将来的に特定の日だけ「リセット祭り」が発生するボラティリティのリスクとなります。</li>
                         </ul>
                    </div>
                </div>

                <h3 className="text-xl font-bold mt-10 mb-6 font-sans">4.4 介入マトリクス (Intervention Matrix)</h3>
                <div className="overflow-hidden border border-slate-200 rounded-lg">
                    <table className="min-w-full text-sm text-left text-slate-600">
                        <thead className="bg-slate-100 text-slate-900 font-sans uppercase text-xs">
                            <tr>
                                <th className="px-6 py-3">Phase (Condition)</th>
                                <th className="px-6 py-3">Root Cause</th>
                                <th className="px-6 py-3">Protocol Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <tr className="bg-green-50/50">
                                <td className="px-6 py-4 font-bold text-green-800">HEALTHY<br/><span className="text-xs font-normal text-green-600">Rate &gt; 10% + Balanced</span></td>
                                <td className="px-6 py-4">理想的な循環状態</td>
                                <td className="px-6 py-4">
                                    <span className="block font-bold text-green-600">ACTION: Maintain</span>
                                    介入不要。この均衡を見守ることが神の仕事です。
                                </td>
                            </tr>
                            <tr className="bg-white">
                                <td className="px-6 py-4 font-bold text-slate-900">STARVATION<br/><span className="text-xs font-normal text-slate-500">Low Rate + Low Balance</span></td>
                                <td className="px-6 py-4">流動性枯渇による信頼崩壊</td>
                                <td className="px-6 py-4">
                                    <span className="block font-bold text-blue-600">ACTION: Sun's Grace</span>
                                    基礎給付を大幅増額 (Target: 3000Lm)。<br/>恐怖を取り除くことが最優先。
                                </td>
                            </tr>
                            <tr className="bg-white">
                                <td className="px-6 py-4 font-bold text-slate-900">SATURATION<br/><span className="text-xs font-normal text-slate-500">Low Rate + High Balance</span></td>
                                <td className="px-6 py-4">欲求(Wish)不足による停滞</td>
                                <td className="px-6 py-4">
                                    <span className="block font-bold text-purple-600">ACTION: Jubilee</span>
                                    金融政策ではなく、消費喚起イベントを実施。<br/>「金を使う理由」を作る。
                                </td>
                            </tr>
                            <tr className="bg-white">
                                <td className="px-6 py-4 font-bold text-slate-900">STAGNATION<br/><span className="text-xs font-normal text-slate-500">Rate &lt; 5% (Critical)</span></td>
                                <td className="px-6 py-4">文化の欠如 / 初期段階</td>
                                <td className="px-6 py-4">
                                    <span className="block font-bold text-red-600">ACTION: First Move</span>
                                    Admin自身による直接取引。<br/>神が動いて手本を示す。
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
              </section>

              {/* Footer */}
              <div className="pt-20 text-center">
                 <div className="w-16 h-px bg-slate-300 mx-auto mb-6"></div>
                 <p className="text-slate-400 font-sans text-xs uppercase tracking-widest">
                   Proprietary & Confidential<br/>
                   Designed for The Mutual Aid Economic Zone
                 </p>
              </div>

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

