import React, { useState } from 'react';
import { X, Activity, Moon, Sun, AlertTriangle, Book } from 'lucide-react';
import { useStats, MetabolismStatus } from '../hooks/useStats';

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
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = originalStyle;
        };
    }, []);

    if (!stats) return <div className="p-10 text-white">Loading God Mode...</div>;

    const { cycle, metabolism, distribution } = stats;

    // Helper Styles
    // getSeasonColor removed as it is no longer used in the new UI layout

    const getMetaColor = (s: MetabolismStatus) => {
        if (s === 'Active') return 'text-green-400';
        if (s === 'Stable') return 'text-yellow-400';
        return 'text-red-500';
    };

    const totalPop = distribution.full + distribution.quarter + distribution.new;
    
    // Pre-calculate ratios for diagnosis
    const distRatio = {
        full: distribution.full / (totalPop || 1), // Avoid DBZ
        quarter: distribution.quarter / (totalPop || 1),
        new: distribution.new / (totalPop || 1)
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md overflow-y-auto">
            <div className="min-h-full p-4 pb-40 max-w-3xl mx-auto relative">
                {/* Header */}
                <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl -mx-4 px-4 py-4 mb-6 border-b border-slate-800/50 flex justify-between items-center transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-800 rounded-lg">
                      <Activity className="w-5 h-5 text-slate-200" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-slate-200 tracking-wider">ADMIN DASHBOARD</h1>
                      <p className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em]">Ecosystem Monitor</p>
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
                        text: 'メタボリズム (循環不全) が現在の課題です',
                        bg: 'bg-red-900/30 border-red-500'
                    });
                  }
                  if (distRatio.full >= 0.3) {
                    activeDiagnoses.push({
                         text: '飽和した楽園 (Oversupply) が現在の課題です',
                         bg: 'bg-yellow-900/30 border-yellow-500'
                    });
                  }
                  if (distRatio.new >= 0.5) {
                    activeDiagnoses.push({
                         text: '凍える荒野 (Undersupply) が現在の課題です',
                         bg: 'bg-blue-900/30 border-blue-500'
                    });
                  }

                  if (activeDiagnoses.length === 0) {
                      return (
                        <div className="p-4 mb-4 rounded-lg border bg-green-900/30 border-green-500 text-white flex-none">
                          システムは安定しています
                        </div>
                      );
                  }

                  return (
                    <div className="flex flex-col gap-2 mb-4 flex-none">
                        {activeDiagnoses.map((d, i) => (
                            <div key={i} className={`p-4 rounded-lg border ${d.bg} text-white`}>
                              {d.text}
                            </div>
                        ))}
                    </div>
                  );
                })()}


                {/* Content Stack */}
                <div className="flex flex-col gap-6">
                
                {/* SECTION A: ACTIVE CYCLES */}
                <div className={`p-6 rounded-2xl border border-slate-700 bg-slate-900/20 relative overflow-hidden group`}>
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Moon size={100} />
                    </div>
                    <h2 className="text-xs font-mono uppercase tracking-widest opacity-70 mb-4">Active Cycles</h2>
                    
                    <div className="flex flex-col gap-4">
                        <div>
                            <span className="text-3xl font-bold text-slate-200">Day {cycle.day}</span>
                            <span className="text-xs text-slate-400 ml-2">現在のサイクル日数</span>
                            <span className="text-xs text-slate-500 ml-2">({cycle.season} Phase)</span>
                        </div>
                        
                        <div className="flex flex-col gap-1">
                             <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-mono text-cyan-300">{cycle.rebornToday}</span>
                                <div className="flex flex-col">
                                    <span className="text-sm text-slate-400">Souls Reborn Today</span>
                                    <span className="text-[10px] text-slate-500">本日の魂の再生数</span>
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
                                                className={`h-full transition-all duration-1000 ${isWarning ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-cyan-500/50'} animate-pulse`} 
                                                style={{ width: `${barWidth}%` }}
                                             />
                                         </div>
                                         <div className="flex justify-between mt-1 px-0.5">
                                             <span className="text-[9px] text-slate-600 font-mono">0%</span>
                                             <span className="text-[9px] text-cyan-500 font-bold font-mono">10% IDEAL</span>
                                             <span className="text-[9px] text-slate-600 font-mono">20%+</span>
                                         </div>
                                         <p className="text-[10px] text-slate-400 mt-1 leading-tight border-t border-slate-800/50 pt-1">
                                             日次代謝率: 10%が理想状態。中央より右なら過剰、左なら停滞を意味します。
                                         </p>
                                     </div>
                                 );
                             })()}
                        </div>
                    </div>
                </div>

                {/* SECTION B: METABOLISM */}
                <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/20 relative">
                     <h2 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">Metabolism</h2>
                     
                     <div className="flex justify-between items-end mb-6">
                         <div>
                             <div className="text-sm text-slate-400 mb-1">
                                 24h Vol
                                 <span className="text-[10px] text-slate-600 ml-2">24時間の総循環量</span>
                             </div>
                             <div className="text-3xl font-mono text-slate-200">{metabolism.volume24h.toLocaleString()} <span className="text-sm font-sans">Lm</span></div>
                         </div>
                         <div className={`text-right ${getMetaColor(metabolism.status)}`}>
                             <div className="text-3xl font-bold">{metabolism.rate}%</div>
                             <div className="text-xs uppercase tracking-wider">{metabolism.status}</div>
                             <div className="text-[10px] opacity-70">循環効率</div>
                         </div>
                     </div>

                     {/* Visual Meter */}
                     <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                         <div 
                            className={`h-full ${stats.metabolism.status === 'Stagnant' ? 'bg-red-500' : stats.metabolism.status === 'Active' ? 'bg-green-500' : 'bg-yellow-500'}`} 
                            style={{ width: `${Math.min(100, stats.metabolism.rate * 10)}%` }} // Scale approx for visual
                         />
                     </div>
                </div>

                {/* SECTION C: MOON DISTRIBUTION */}
                <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/20 md:col-span-2 lg:col-span-1">
                    <h2 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-6">Moon Distribution</h2>
                    
                    <div className="space-y-4">
                        {/* Full */}
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-yellow-200">🌕 Full (&gt;1500) <span className="text-[10px] text-slate-500 ml-1">飽和状態の魂</span></span>
                                <span className="font-mono text-slate-300">{distribution.full} <span className="text-[10px] opacity-70">({(distRatio.full * 100).toFixed(1)}%)</span></span>
                            </div>
                            <div className="w-full h-2 bg-slate-800/50 rounded-full overflow-hidden">
                                <div className="h-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.4)]" style={{ width: `${distRatio.full * 100}%` }} />
                            </div>
                        </div>
                        {/* Quarter */}
                        <div>
                             <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-300">🌓 Quarter <span className="text-[10px] text-slate-500 ml-1">安定した魂</span></span>
                                <span className="font-mono text-slate-300">{distribution.quarter} <span className="text-[10px] opacity-70">({(distRatio.quarter * 100).toFixed(1)}%)</span></span>
                            </div>
                            <div className="w-full h-2 bg-slate-800/50 rounded-full overflow-hidden">
                                <div className="h-full bg-slate-400 shadow-[0_0_8px_rgba(148,163,184,0.3)]" style={{ width: `${distRatio.quarter * 100}%` }} />
                            </div>
                        </div>
                        {/* New */}
                        <div>
                             <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-400">🌑 New (&lt;500) <span className="text-[10px] text-slate-500 ml-1">新生した魂</span></span>
                                <span className="font-mono text-slate-300">{distribution.new} <span className="text-[10px] opacity-70">({(distRatio.new * 100).toFixed(1)}%)</span></span>
                            </div>
                            <div className="w-full h-2 bg-slate-800/50 rounded-full overflow-hidden">
                                <div className="h-full bg-cyan-600 shadow-[0_0_8px_rgba(8,145,178,0.3)]" style={{ width: `${distRatio.new * 100}%` }} />
                            </div>
                        </div>
                    </div>

                    {/* Alert Logic */}
                    {cycle.season === 'Winter' && distribution.full > totalPop * 0.3 && (
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
                    <h2 className="text-xs font-mono text-yellow-600 uppercase tracking-widest mb-4">Solar Control</h2>
                    
                    <div className="mb-8 text-center">
                        <div className="text-xs text-yellow-600/70 mb-2">
                            Next Cycle Output
                            <div className="text-[10px]">次回のサイクル供給量</div>
                        </div>
                        <div className="text-5xl font-bold text-yellow-500 font-mono tracking-tighter">
                            {sliderValue.toLocaleString()} <span className="text-lg">Lm</span>
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
                            if (window.confirm(`PUBLISH NEW LAW: Solar Capacity = ${sliderValue.toLocaleString()} Lm.\n\nThis will take effect for each soul upon their next rebirth.\nAre you sure?`)) {
                                try {
                                    // Dynamic import
                                    const { db } = await import('../lib/firebase');
                                    const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
                                    
                                    if (!db) throw new Error("Database not initialized");

                                    // Just update the Law (Configuration)
                                    const settingsRef = doc(db, 'system_settings', 'global');
                                    await setDoc(settingsRef, {
                                        capacity: sliderValue,
                                        updated_at: serverTimestamp()
                                    }, { merge: true });

                                    alert(`Success: Solar Capacity updated to ${sliderValue} Lm.\nThe world will gradually adjust to this new constant.`);
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
                    <p className="text-center text-[10px] text-slate-500 mt-2">New capacity will apply to souls upon their next rebirth.</p>
                </div>

            </div>
            </div>

            {/* === GOD'S MANUAL OVERLAY === */}
            {showManual && (
                <div className="absolute inset-0 z-[200] bg-black/95 backdrop-blur-xl p-6 overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="max-w-2xl mx-auto pb-20">
                        <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4 sticky top-0 bg-black/50 backdrop-blur-sm z-10 pt-2">
                             <div className="flex items-center gap-2 text-yellow-500">
                                <Book size={20} />
                                <h2 className="font-bold tracking-wider">運用ガイド: 生態系の整え方</h2>
                             </div>
                             <button onClick={() => setShowManual(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400">
                                 <X size={20} />
                             </button>
                        </div>

                        <div className="space-y-10 text-slate-300 text-sm leading-relaxed">
                            <p className="italic text-slate-500 border-l-2 border-slate-700 pl-4">
                                このダッシュボードは、自律分散的に動く世界の「体温」を診断するためのものです。<br/>
                                基本方針: 神は個別の介入を行わず、<span className="text-yellow-200 font-bold">「太陽の出力 (Current Supply)」</span>という物理定数だけを調整して、個々の生命活動を誘導します。
                            </p>

                            <section>
                                <h3 className="text-lg text-white font-bold mb-4 border-b border-slate-800 pb-2 flex items-center gap-2">
                                    <span className="text-blue-400">📊</span> 1. 診断のポイント (Diagnosis)
                                </h3>
                                
                                <div className="space-y-6 pl-2">
                                    {/* Diagnosis A: Metabolism */}
                                    <div className={`p-4 rounded-lg border transition-all duration-300 ${
                                        metabolism.rate < 5 
                                        ? 'bg-red-900/30 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
                                        : 'bg-slate-900/40 border-slate-800/50 opacity-50'
                                    }`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className={`font-bold ${metabolism.rate < 5 ? 'text-red-400' : 'text-slate-200'}`}>
                                                A. メタボリズム (循環不全)
                                            </h4>
                                            {metabolism.rate < 5 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">CURRENTLY ACTIVE</span>}
                                        </div>
                                        <ul className="list-disc list-inside space-y-1 text-slate-400">
                                            <li><span className="text-slate-500 w-16 inline-block">症状:</span> Metabolism Rate が <span className={`font-bold ${metabolism.rate < 5 ? 'text-red-400 border-b border-red-500' : 'text-red-400'}`}>RED (5%未満)</span> で停滞している。</li>
                                            <li><span className="text-slate-500 w-16 inline-block">意味:</span> 誰も動いていません。「死の世界」になりかけています。</li>
                                            <li><span className="text-slate-500 w-16 inline-block">処置:</span> <span className="text-cyan-300 font-bold">太陽操作の前に、まずはユーザーに声をかけ、最初の火を灯す必要があります。</span></li>
                                        </ul>
                                    </div>

                                    {/* Diagnosis B: Oversupply */}
                                    <div className={`p-4 rounded-lg border transition-all duration-300 ${
                                        (distribution.full / totalPop) >= 0.3 
                                        ? 'bg-yellow-900/30 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]' 
                                        : 'bg-slate-900/40 border-slate-800/50 opacity-50'
                                    }`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className={`font-bold ${distRatio.full >= 0.3 ? 'text-yellow-400' : 'text-slate-200'}`}>
                                                B. 飽和した楽園 (Oversupply)
                                            </h4>
                                            {(distribution.full / totalPop) >= 0.3 && <span className="bg-yellow-500 text-black text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">CURRENTLY ACTIVE</span>}
                                        </div>
                                        <ul className="list-disc list-inside space-y-1 text-slate-400">
                                            <li><span className="text-slate-500 w-16 inline-block">症状:</span> Moon Distribution で Full Moon (&gt;1500 Lm) が <span className={`font-bold ${(distribution.full / totalPop) >= 0.3 ? 'text-yellow-400 border-b border-yellow-500' : 'text-yellow-400'}`}>30%以上</span> を占めている。</li>
                                            <li><span className="text-slate-500 w-16 inline-block">意味:</span> ポイントが余りすぎています。誰もが満たされており、必死に他者を助ける（願いを叶える）動機が失われています。</li>
                                            <li><span className="text-slate-500 w-16 inline-block">処置:</span> <span className="text-cyan-300 font-bold">太陽を弱めてください (Cool Down)。</span></li>
                                        </ul>
                                    </div>

                                    {/* Diagnosis C: Undersupply */}
                                    <div className={`p-4 rounded-lg border transition-all duration-300 ${
                                        (distribution.new / totalPop) >= 0.5 
                                        ? 'bg-blue-900/30 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                                        : 'bg-slate-900/40 border-slate-800/50 opacity-50'
                                    }`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className={`font-bold ${distRatio.new >= 0.5 ? 'text-blue-400' : 'text-slate-200'}`}>
                                                C. 凍える荒野 (Undersupply)
                                            </h4>
                                            {(distribution.new / totalPop) >= 0.5 && <span className="bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">CURRENTLY ACTIVE</span>}
                                        </div>
                                        <ul className="list-disc list-inside space-y-1 text-slate-400">
                                            <li><span className="text-slate-500 w-16 inline-block">症状:</span> Moon Distribution で New Moon (&lt;500 Lm) が <span className={`font-bold ${(distribution.new / totalPop) >= 0.5 ? 'text-blue-400 border-b border-blue-500' : 'text-red-400'}`}>50%以上</span> を占めている。</li>
                                            <li><span className="text-slate-500 w-16 inline-block">意味:</span> 「大飢饉」です。生きるだけで精一杯で、願いを発行するコストさえ払えません。</li>
                                            <li><span className="text-slate-500 w-16 inline-block">処置:</span> <span className="text-orange-300 font-bold">太陽を強めてください (Warm Up)。</span></li>
                                        </ul>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-lg text-white font-bold mb-4 border-b border-slate-800 pb-2 flex items-center gap-2">
                                    <span className="text-yellow-400">🎚</span> 2. 調整のアクション (Solar Control)
                                </h3>
                                
                                <div className="mb-6 bg-yellow-900/10 border border-yellow-700/30 p-4 rounded text-yellow-200/80 text-xs">
                                    <strong className="text-yellow-400 block mb-1">⚠️ 重要:</strong>
                                    設定を変更しても、即座に全員の数値が変わるわけではありません。「次の誕生日（サイクル更新）」を迎えた者から順に、新しい法則が適用されます。徐々に世界の色が変わっていく様子を観測してください。
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <div className="p-4 rounded-lg border border-cyan-500/20 bg-cyan-950/20">
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="font-bold text-cyan-300">【太陽を弱める (Cool Down)】</h4>
                                            <span className="text-xs font-mono bg-black/50 px-2 py-1 rounded text-cyan-400">2000 - 2200 Lm</span>
                                        </div>
                                        <div className="space-y-2 text-sm text-cyan-100/70">
                                            <p><span className="text-slate-500">目的:</span> 世界を寒冷化し、ハングリーさを取り戻す。</p>
                                            <p><span className="text-slate-500">効果:</span> 器の容量が減るため、人々は早期に枯渇への恐怖を感じます。生存のために、安価な願い（Spark: 100 Lm）さえも奪い合うようになり、活動量が増加します。</p>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-lg border border-orange-500/20 bg-orange-950/20">
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="font-bold text-orange-300">【太陽を強める (Warm Up)】</h4>
                                            <span className="text-xs font-mono bg-black/50 px-2 py-1 rounded text-orange-400">2600 - 3000 Lm</span>
                                        </div>
                                        <div className="space-y-2 text-sm text-orange-100/70">
                                            <p><span className="text-slate-500">目的:</span> 世界を温暖化し、文化を育む。</p>
                                            <p><span className="text-slate-500">効果:</span> 生存に余裕が生まれます。単純な生存競争を超えて、高額な献身（Bonfire: 1000 Lm）や、見返りのない愛が生まれやすくなります。</p>
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
