import React from "react";
import { X, Activity } from "lucide-react";
import { Logo } from "./Logo";

interface ProtocolManualProps {
  onClose: () => void;
}

export const ProtocolManual: React.FC<ProtocolManualProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[200] bg-white/95 backdrop-blur-xl p-6 overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-300 text-slate-800">
      <div className="max-w-3xl mx-auto pb-20 mt-10">
        {/* Header */}
        <div className="flex justify-between items-start mb-12 border-b-2 border-slate-900 pb-6">
          <div>
            <div className="flex items-center gap-2 text-slate-500 mb-2 uppercase tracking-[0.2em] text-xs font-sans">
              <Activity size={14} />
              <span><Logo className="inline" /> Protocol v2.0</span>
            </div>
            <h1 className="text-4xl font-serif font-bold text-slate-900 leading-tight">
              自律分散型互助生態系構想書
              <span className="block text-lg font-sans font-normal text-slate-500 mt-2">Autonomous Mutual Aid Ecosystem Protocol</span>
            </h1>
          </div>
          <button
            onClick={onClose}
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
              <h2 className="text-2xl font-bold text-slate-900 font-sans">理念 (Philosophy)</h2>
            </div>
            <h3 className="text-xl font-bold mb-4">"Stock" から "Flow" へ</h3>
            <p className="mb-6">
              現代社会の閉塞感は「感謝の滞留」にあります。エネルギー（貨幣）が循環の媒体としての機能を失い、個人の所有物（Stock）としてダムのように堰き止められた時、生態系は枯れ果てます。<br/>
              我々はこの問題を解決するために、通貨を<strong className="text-slate-900 font-bold bg-yellow-100 px-1">「保存する資産（Stock）」から「感謝を伝えるエネルギー（Flow）」へと再定義</strong>しました。
            </p>
            <p>
              この世界では、溜め込むことは重力による<strong className="text-slate-900 font-bold">「深化（Deepening）」</strong>を意味し、他者へ循環させることこそが生存戦略となります。<br/>
              住人は「富を得るため」ではなく、「誰かを助け、誰かに助けられるため」にこのエネルギーを使用します。
            </p>
          </section>

          {/* Chapter 2 */}
          <section>
            <div className="flex items-center gap-4 mb-6">
              <span className="text-6xl font-thin text-slate-200">02</span>
              <div className="h-px bg-slate-200 flex-grow"></div>
              <h2 className="text-2xl font-bold text-slate-900 font-sans">構造 (Mechanism)</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-slate-50 p-6 rounded border border-slate-100">
                <h3 className="text-lg font-bold font-sans mb-3 text-slate-900 flex items-center gap-2">
                  <span className="text-blue-500">▼</span> 深化 (Deepening)
                </h3>
                <p className="text-base text-slate-600">
                  自然界の法則と同様に、全てのエネルギーは時間とともに器の底へと「深化」します。
                  この物理現象により、既得権益の固定化（格差の固定）を自然法則として阻止し、常に新たな代謝を促します。
                  これは「損失」ではなく、エネルギーがより純粋な形へと相転移する過程です。
                </p>
              </div>

              <div className="bg-slate-50 p-6 rounded border border-slate-100">
                <h3 className="text-lg font-bold font-sans mb-3 text-slate-900 flex items-center gap-2">
                  <span className="text-yellow-500">▲</span> 太陽 (The Sun)
                </h3>
                <p className="text-base text-slate-600">
                  「深化」によって底へと還ったエネルギーは、システム全体への「生命贈与（Basic Supply）」として蒸散・還元されます。
                  これは行政による「給付」でも、再分配でもありません。
                  あなたがここに<strong className="text-slate-900">「存在している」という事実そのものを担保にして</strong>、天から降り注ぐ光のギフトです。
                </p>
              </div>
            </div>
          </section>

          {/* Chapter 3 */}
          <section>
            <div className="flex items-center gap-4 mb-6">
              <span className="text-6xl font-thin text-slate-200">03</span>
              <div className="h-px bg-slate-200 flex-grow"></div>
              <h2 className="text-2xl font-bold text-slate-900 font-sans">統治 (Governance)</h2>
            </div>
            <h3 className="text-xl font-bold mb-4">支配ではなく、調律</h3>
            <p className="mb-6">
              管理者の役割は、住人の個別のやり取りを監視することではありません。<br/>
              世界の「温度（代謝率）」と「湿度（エネルギー分布）」を観測し、<strong className="text-slate-900 font-bold">「再生サイクル期間（Regeneration Cycle Duration）」というたった一つの物理定数（時間軸）を調整すること</strong>だけが許された権限です。
            </p>
            
            <div className="bg-slate-900 text-white p-8 rounded-sm shadow-xl mt-8">
               <h4 className="font-sans text-xs uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-700 pb-2">管理者の誓い (Admin Protocol)</h4>
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
              <h2 className="text-2xl font-bold text-slate-900 font-sans">運用規約 (Operational Protocols)</h2>
            </div>
            
            <h3 className="text-xl font-bold mb-6 font-sans">4.1 構造的制約 (Structural Constraints)</h3>
              <div className="bg-slate-50 p-6 rounded border border-slate-100 mb-8">
                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                  <span className="text-blue-600">ℹ</span> エネルギー還流 (Energy Reflux)
                </h4>
                <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                  本システムでは「あるがままの計算（Simple Physics）」を採用しています。
                  個々の「願い（Committed Lm）」も時間とともに「深化」し、その価値を減じていきます。
                  この際、持ち主の Available Lm が微増する現象が発生しますが、これは<strong className="text-slate-900">「深化によって願いがより純粋な形になり、余剰エネルギーが器に還流した」</strong>ものとして定義されます。
                  この自然な還流を、我々は生態系の健全な呼吸として仕様認定しています。
                </p>

                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2 border-t border-slate-200 pt-4">
                  <span className="text-slate-900">V</span> 物理定数 (Physical Baseline)
                </h4>
                <p className="font-mono text-slate-600 text-sm mb-0 leading-relaxed">
                  一人の人間が保持できるエネルギーの限界点は <strong className="text-slate-900">2400 Lm</strong> です。
                  この器（Vessel）を超えたエネルギーは「溢出（Overflow）」となり、巡り巡って「太陽」の燃料として再利用されるエコシステム・ループを形成します。
                </p>


               <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2 border-t border-slate-200 pt-4">
                   <span className="text-yellow-600">⚠</span> 法の不遡及 (Law of Non-Retroactivity)
               </h4>
               <p className="text-slate-600 text-sm mb-0 leading-relaxed">
                   「再生サイクルの期間」の変更は、即座に全ユーザーに適用されるわけではありません。<br/>
                   各ユーザーは個別に決定された「リセット日」を持っており、新しい時間設定は<strong className="text-slate-900">個々の次回リセット計算時</strong>に初めて適用されます。<br/>
                   したがって、調律（Tuning）の効果が生態系全体に行き渡るまでには、現行サイクルの解消待ち（Latency）が発生します。
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
                         C. 世界の季節 (Global Seasons)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-center text-sm mb-2">
                        <div className="bg-green-50 p-2 rounded border border-green-100">
                            <span className="block font-bold text-green-700">春 (5-9 Days)</span>
                            <span className="text-xs text-slate-500">豊穣・加速</span>
                        </div>
                        <div className="bg-yellow-50 p-2 rounded border border-yellow-100">
                            <span className="block font-bold text-yellow-700">分点 (10 Days)</span>
                            <span className="text-xs text-slate-500">調和・標準</span>
                        </div>
                        <div className="bg-slate-100 p-2 rounded border border-slate-200">
                            <span className="block font-bold text-slate-700">冬 (11-20 Days)</span>
                            <span className="text-xs text-slate-500">試練・選別</span>
                        </div>
                    </div>
                    <p className="text-slate-600 text-sm">
                        調律者は「1サイクルの長さ」を伸縮させることで季節を操ります。<br/>
                        <strong>春（豊穣期）</strong>では頻繁に給付が行われ、世界は潤いますが、インフレ（飽和）のリスクがあります。<br/>
                        <strong>冬（厳冬期）</strong>では次の給付までの期間が長く、備蓄が枯渇しやすくなります。これにより生存本能が刺激され、停滞した富の強制循環（贈与）が促されます。
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


            <h3 className="text-xl font-bold mt-10 mb-6 font-sans">4.4 介入の書 (Intervention Matrix)</h3>
            <div className="overflow-hidden border border-slate-200 rounded-lg">
                {/* Mobile View (Cards) */}
                <div className="md:hidden divide-y divide-slate-100">
                    {/* Healthy */}
                    <div className="bg-green-50/50 p-4">
                        <div className="font-bold text-green-800 mb-1">HEALTHY</div>
                        <div className="text-xs font-normal text-green-600 mb-3">Rate &gt; 10% + Balanced</div>
                        
                        <div className="text-xs font-bold text-slate-400 uppercase mb-1">Root Cause</div>
                        <div className="text-sm text-slate-700 mb-3">理想的な循環状態</div>
                        
                        <div className="text-xs font-bold text-slate-400 uppercase mb-1">Actions</div>
                        <div className="text-sm">
                            <span className="block font-bold text-green-600">ACTION: 維持 (Maintain)</span>
                            介入不要。この均衡を見守ることが神の仕事です。
                        </div>
                    </div>

                    {/* Starvation */}
                    <div className="bg-white p-4">
                        <div className="font-bold text-slate-900 mb-1">STARVATION</div>
                        <div className="text-xs font-normal text-slate-500 mb-3">Low Rate + Low Balance</div>
                        
                        <div className="text-xs font-bold text-slate-400 uppercase mb-1">Root Cause</div>
                        <div className="text-sm text-slate-700 mb-3">流動性枯渇による信頼崩壊</div>
                        
                        <div className="text-xs font-bold text-slate-400 uppercase mb-1">Actions</div>
                         <div className="text-sm">
                            <span className="block font-bold text-blue-600">ACTION: 春化 (Spring Shift)</span>
                            サイクルを短縮 (例えば5日へ) し、給付頻度を倍増させる。<br/>恐怖を取り除くことが最優先。
                        </div>
                    </div>

                    {/* Saturation */}
                    <div className="bg-white p-4">
                        <div className="font-bold text-slate-900 mb-1">SATURATION</div>
                        <div className="text-xs font-normal text-slate-500 mb-3">Low Rate + High Balance</div>
                        
                        <div className="text-xs font-bold text-slate-400 uppercase mb-1">Root Cause</div>
                        <div className="text-sm text-slate-700 mb-3">欲求(Wish)不足による停滞</div>
                        
                        <div className="text-xs font-bold text-slate-400 uppercase mb-1">Actions</div>
                        <div className="text-sm">
                            <span className="block font-bold text-purple-600">ACTION: 冬化 (Winter Shift)</span>
                            サイクルを延長 (例えば20日へ)。<br/>「使わなければ尽きる」環境を作る。
                        </div>
                    </div>

                     {/* Stagnation */}
                    <div className="bg-white p-4">
                        <div className="font-bold text-slate-900 mb-1">STAGNATION</div>
                        <div className="text-xs font-normal text-slate-500 mb-3">Rate &lt; 5% (Critical)</div>
                        
                        <div className="text-xs font-bold text-slate-400 uppercase mb-1">Root Cause</div>
                        <div className="text-sm text-slate-700 mb-3">文化の欠如 / 初期段階</div>
                        
                        <div className="text-xs font-bold text-slate-400 uppercase mb-1">Actions</div>
                        <div className="text-sm">
                            <span className="block font-bold text-red-600">ACTION: 緊急介入 (Emergency Intervention)</span>
                            Admin自身による直接取引。<br/>管理者が動いて手本を示す。
                        </div>
                    </div>
                </div>

                {/* Desktop View (Table) */}
                <table className="hidden md:table min-w-full text-sm text-left text-slate-600">
                    <thead className="bg-slate-100 text-slate-900 font-sans uppercase text-xs">
                        <tr>
                            <th className="px-6 py-3">状況 (Phase)</th>
                            <th className="px-6 py-3">根本原因 (Root Cause)</th>
                            <th className="px-6 py-3">処方箋 (Actions)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        <tr className="bg-green-50/50">
                            <td className="px-6 py-4 font-bold text-green-800">HEALTHY<br/><span className="text-xs font-normal text-green-600">Rate &gt; 10% + Balanced</span></td>
                            <td className="px-6 py-4">理想的な循環状態</td>
                            <td className="px-6 py-4">
                                <span className="block font-bold text-green-600">ACTION: 維持 (Maintain)</span>
                                介入不要。この均衡を見守ることが神の仕事です。
                            </td>
                        </tr>
                        <tr className="bg-white">
                            <td className="px-6 py-4 font-bold text-slate-900">STARVATION<br/><span className="text-xs font-normal text-slate-500">Low Rate + Low Balance</span></td>
                            <td className="px-6 py-4">流動性枯渇による信頼崩壊</td>
                            <td className="px-6 py-4">
                                <span className="block font-bold text-blue-600">ACTION: 春化 (Spring Shift)</span>
                                サイクルを短縮 (例えば5日へ) し、給付頻度を倍増させる。<br/>恐怖を取り除くことが最優先。
                            </td>
                        </tr>
                        <tr className="bg-white">
                            <td className="px-6 py-4 font-bold text-slate-900">SATURATION<br/><span className="text-xs font-normal text-slate-500">Low Rate + High Balance</span></td>
                            <td className="px-6 py-4">欲求(Wish)不足による停滞</td>
                            <td className="px-6 py-4">
                                <span className="block font-bold text-purple-600">ACTION: 冬化 (Winter Shift)</span>
                                サイクルを延長 (例えば20日へ)。<br/>「使わなければ尽きる」環境を作る。
                            </td>
                        </tr>
                        <tr className="bg-white">
                            <td className="px-6 py-4 font-bold text-slate-900">STAGNATION<br/><span className="text-xs font-normal text-slate-500">Rate &lt; 5% (Critical)</span></td>
                            <td className="px-6 py-4">文化の欠如 / 初期段階</td>
                            <td className="px-6 py-4">
                                <span className="block font-bold text-red-600">ACTION: 緊急介入 (Emergency Intervention)</span>
                                Admin自身による直接取引。<br/>管理者が動いて手本を示す。
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
  );
};
