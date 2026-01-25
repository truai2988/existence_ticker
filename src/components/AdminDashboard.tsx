import React, { useState } from "react";
import { X, Activity, Moon, Sun, AlertTriangle, Book } from "lucide-react";
import { useStats, MetabolismStatus } from "../hooks/useStats";

interface AdminDashboardProps {
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const { stats, error, updateCapacity } = useStats();
  const [sliderValue, setSliderValue] = useState(2400);
  const [showManual, setShowManual] = useState(false);


  // Sync slider with stats when loaded
  React.useEffect(() => {
    if (stats) setSliderValue(stats.sunCapacity);
  }, [stats]);

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
        {(() => {
          const activeDiagnoses = [];

          if (metabolism.rate < 5) {
            activeDiagnoses.push({
              text: "【警告】経済循環率が低下しています（停滞）",
              bg: "bg-red-900/30 border-red-500",
            });
          }
          if (distRatio.full >= 0.3) {
            activeDiagnoses.push({
              text: "【警告】市場が飽和しています（インフレ懸念）",
              bg: "bg-yellow-900/30 border-yellow-500",
            });
          }
          if (distRatio.new >= 0.5) {
            activeDiagnoses.push({
              text: "【警告】資金が枯渇しています（デフレ懸念）",
              bg: "bg-blue-900/30 border-blue-500",
            });
          }

          if (activeDiagnoses.length === 0) {
            return (
              <div className="p-4 mb-4 rounded-lg border bg-green-900/30 border-green-500 text-white flex-none">
                【正常】システムは安定稼働中です
              </div>
            );
          }

          return (
            <div className="flex flex-col gap-2 mb-4 flex-none">
              {activeDiagnoses.map((d, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-lg border ${d.bg} text-white flex justify-between items-center`}
                >
                  <span>{d.text}</span>
                </div>
              ))}
            </div>
          );
        })()}

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

            {/* Altruism Rate (New) */}
            {(() => {
              const m = metabolism;
              const giftRate =
                m.volume24h > 0 ? ((m.giftVolume || 0) / m.volume24h) * 100 : 0;
              return (
                <div className="mt-4 flex items-center gap-4 text-xs pt-4 border-t border-slate-800/50">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-500">
                        Altruism Rate (利他指数)
                      </span>
                      <span className="text-gold-400 font-mono">
                        {giftRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-gold-500"
                        style={{ width: `${giftRate}%` }}
                      />
                      <div
                        className="h-full bg-slate-700"
                        style={{ width: `${100 - giftRate}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                      <span>GIFT (Free)</span>
                      <span>WISH (Contract)</span>
                    </div>
                  </div>
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
          <div className="p-6 rounded-2xl border border-yellow-900/30 bg-yellow-900/5 md:col-span-2 lg:col-span-1 relative overflow-hidden">
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
                  <span className="text-red-400">🛠</span> 3. 状況別対応マニュアル (Troubleshooting)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div id="case-a" className="p-4 rounded-lg border border-yellow-500/20 bg-yellow-950/20">
                    <h4 className="font-bold text-yellow-300 mb-2">ケースA：世界が「淀んで」いる（飽和・インフレ）</h4>
                    <div className="space-y-2 text-xs text-yellow-100/70">
                      <p><span className="text-slate-500 block">症状:</span> 循環率が低く、かつ「潤沢（Rich）」な人が多い。</p>
                      <p><span className="text-slate-500 block">原因:</span> 基礎給付が多すぎて、誰も必死になっていません。「手伝わなくても生きていける」状態です。</p>
                      <div className="mt-3 pt-3 border-t border-yellow-500/20">
                        <span className="text-white font-bold block mb-1">処置：【引き締め (Cool Down)】</span>
                        <ul className="list-disc list-inside">
                          <li>設定値を <span className="font-mono text-yellow-400">2000 ~ 2200 Lm</span> に下げてください。</li>
                          <li><span className="text-slate-400">効果:</span> 器が小さくなり、早く枯渇するようになります。「やばい、減ってきた」という焦燥感が、他者への貢献（手伝い）を促します。</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div id="case-b" className="p-4 rounded-lg border border-cyan-500/20 bg-cyan-950/20">
                    <h4 className="font-bold text-cyan-300 mb-2">ケースB：世界が「凍えて」いる（枯渇・デフレ）</h4>
                    <div className="space-y-2 text-xs text-cyan-100/70">
                      <p><span className="text-slate-500 block">症状:</span> 循環率が低く、かつ「枯渇（Needy）」な人が多い。</p>
                      <p><span className="text-slate-500 block">原因:</span> 基礎給付が少なすぎて、生きるだけで精一杯です。他者に依頼するコストさえ払えません。</p>
                      <div className="mt-3 pt-3 border-t border-cyan-500/20">
                        <span className="text-white font-bold block mb-1">処置：【緩和・救済 (Warm Up)】</span>
                        <ul className="list-disc list-inside">
                          <li>設定値を <span className="font-mono text-cyan-400">2600 ~ 3000 Lm</span> に上げてください。</li>
                          <li><span className="text-slate-400">効果:</span> 全員に余裕が生まれます。生存競争を超えた、高額な感謝（1000 Lmクラス）や、文化的な活動が生まれやすくなります。</li>
                        </ul>
                      </div>
                    </div>
                  </div>


                  <div id="case-c" className="p-4 rounded-lg border border-red-500/20 bg-red-950/20 md:col-span-2">
                    <h4 className="font-bold text-red-300 mb-2">ケースC：世界が「止まって」いる（循環不全・停滞）</h4>
                    <div className="space-y-4 text-xs text-red-100/70">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p><span className="text-slate-500 block">症状:</span> 経済循環率 (Metabolism) が 5%未満 (RED)。資産分布に関わらず、とにかく取引が発生していない。</p>
                          <p className="mt-2"><span className="text-slate-500 block">原因:</span> 「見合い状態」: 誰もが「誰かが動くのを待っている」状態。心理的障壁: 「手伝う」ことへの心理的ハードルが高い。</p>
                        </div>
                        <div>
                          <span className="text-white font-bold block mb-1">処置：【呼び水 (Pump Priming)】</span>
                          <ul className="list-disc list-inside space-y-2">
                            <li><span className="font-bold text-red-400">物理的ショック療法:</span> 一時的に設定値を <span className="font-mono text-red-400">2000 Lm 以下</span> に厳しく下げてください。「動かないと本当に損をする」という危機感を与えます。</li>
                            <li><span className="font-bold text-yellow-500">神的介入（重要）:</span> システム設定だけでは解決しません。管理者自身がユーザーとして「依頼」を出してください。または、サクラ（協力者）に頼んで、最初の数件の「手伝い」を成立させてください。</li>
                          </ul>
                        </div>
                      </div>
                      <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded text-red-200">
                        <strong className="block mb-1 text-red-300">💡 リードエンジニアの推奨:</strong>
                        この「ケースC」は、アプリ公開直後（ローンチ時）に100%の確率で発生する現象です。
                        誰もいないダンスフロアで、最初に踊り出す勇気を持つ人がいないのと同じです。
                        <br/>
                        したがって、<strong>「管理者自身が最初の『踊り手』になりなさい」</strong>。<br/>
                        「ああ、こうやって使えばいいのか」という実例（背中）を見せることが、唯一の解決策です。
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

