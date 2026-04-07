import React from "react";
import { X, Activity } from "lucide-react";
import { MESSAGES } from "../constants/messages";

interface ProtocolManualProps {
  onClose: () => void;
}

export const ProtocolManual: React.FC<ProtocolManualProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[200] bg-white/95 backdrop-blur-xl p-6 overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-300 text-slate-900">
      <div className="max-w-3xl mx-auto pb-20 mt-10">
        {/* Header */}
        <div className="flex justify-between items-start mb-12 border-b-2 border-slate-900 pb-6">
          <div>
            <div className="flex items-center gap-2 text-slate-900 mb-2 uppercase tracking-[0.2em] text-sm font-sans">
              <Activity size={14} />
              <span>{MESSAGES.PROTOCOL.HEADER_SUB}</span>
            </div>
            <h1 className="text-4xl font-serif font-bold text-slate-900 leading-tight">
              {MESSAGES.PROTOCOL.HEADER_TITLE}
            </h1>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-slate-100 rounded-full text-slate-700 hover:text-slate-900 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-16 font-serif leading-relaxed text-base text-slate-900">
          
          {/* Introduction */}
          <section className="prose prose-slate max-w-none">
            <p className="text-base italic text-slate-800 border-l-4 border-slate-300 pl-6 py-2">
              {MESSAGES.PROTOCOL.INTRO_1}<br/>
              {MESSAGES.PROTOCOL.INTRO_2}
            </p>
          </section>

          {/* Chapter 1 */}
          <section>
            <div className="flex items-center gap-4 mb-6">
              <span className="text-6xl font-thin text-slate-200">{MESSAGES.PROTOCOL.CH1_NUM}</span>
              <div className="h-px bg-slate-200 flex-grow"></div>
              <h2 className="text-2xl font-bold text-slate-900 font-sans">{MESSAGES.PROTOCOL.CH1_TITLE}</h2>
            </div>
            <h3 className="text-xl font-bold mb-4">{MESSAGES.PROTOCOL.CH1_SUB}</h3>
            <p className="mb-6">
              {MESSAGES.PROTOCOL.CH1_P1_1}<br/>
              {MESSAGES.PROTOCOL.CH1_P1_2}<strong className="text-slate-900 font-bold bg-yellow-100 px-1">{MESSAGES.PROTOCOL.CH1_P1_STRONG}</strong>{MESSAGES.PROTOCOL.CH1_P1_3}
            </p>
            <p>
              {MESSAGES.PROTOCOL.CH1_P2_1}<strong className="text-slate-900 font-bold">{MESSAGES.PROTOCOL.CH1_P2_STRONG}</strong>{MESSAGES.PROTOCOL.CH1_P2_2}<br/>
              {MESSAGES.PROTOCOL.CH1_P2_3}
            </p>
          </section>

          {/* Chapter 2 */}
          <section>
            <div className="flex items-center gap-4 mb-6">
              <span className="text-6xl font-thin text-slate-200">{MESSAGES.PROTOCOL.CH2_NUM}</span>
              <div className="h-px bg-slate-200 flex-grow"></div>
              <h2 className="text-2xl font-bold text-slate-900 font-sans">{MESSAGES.PROTOCOL.CH2_TITLE}</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-slate-50 p-6 rounded border border-slate-300">
                <h3 className="text-lg font-bold font-sans mb-3 text-slate-900 flex items-center gap-2">
                  <span className="text-blue-500">▼</span> {MESSAGES.PROTOCOL.CH2_SEC1_TITLE.replace("▼ ", "")}
                </h3>
                <p className="text-base text-slate-800">
                  {MESSAGES.PROTOCOL.CH2_SEC1_DESC}
                </p>
              </div>

              <div className="bg-slate-50 p-6 rounded border border-slate-300">
                <h3 className="text-lg font-bold font-sans mb-3 text-slate-900 flex items-center gap-2">
                  <span className="text-yellow-500">▲</span> {MESSAGES.PROTOCOL.CH2_SEC2_TITLE.replace("▲ ", "")}
                </h3>
                <p className="text-base text-slate-800">
                  {MESSAGES.PROTOCOL.CH2_SEC2_DESC_1}
                  <strong className="text-slate-900">{MESSAGES.PROTOCOL.CH2_SEC2_STRONG}</strong>
                  {MESSAGES.PROTOCOL.CH2_SEC2_DESC_2}
                </p>
              </div>
            </div>
          </section>

          {/* Chapter 3 */}
          <section>
            <div className="flex items-center gap-4 mb-6">
              <span className="text-6xl font-thin text-slate-200">{MESSAGES.PROTOCOL.CH3_NUM}</span>
              <div className="h-px bg-slate-200 flex-grow"></div>
              <h2 className="text-2xl font-bold text-slate-900 font-sans">{MESSAGES.PROTOCOL.CH3_TITLE}</h2>
            </div>
            <h3 className="text-xl font-bold mb-4">{MESSAGES.PROTOCOL.CH3_SUB}</h3>
            <p className="mb-6">
              {MESSAGES.PROTOCOL.CH3_P1_1}<br/>
              {MESSAGES.PROTOCOL.CH3_P1_G}<strong className="text-slate-900 font-bold">{MESSAGES.PROTOCOL.CH3_P1_STRONG}</strong>{MESSAGES.PROTOCOL.CH3_P1_2}
            </p>
            
            <div className="bg-slate-900 text-white p-8 rounded-sm shadow-xl mt-8">
               <h4 className="font-sans text-sm uppercase tracking-widest text-slate-700 mb-4 border-b border-slate-700 pb-2">{MESSAGES.PROTOCOL.CH3_OATH_TITLE}</h4>
                <p className="font-mono text-base leading-relaxed text-slate-700">
                  {MESSAGES.PROTOCOL.CH3_OATH_1}<br/>
                  {MESSAGES.PROTOCOL.CH3_OATH_2}<br/>
                  {MESSAGES.PROTOCOL.CH3_OATH_3}<br/>
                  {MESSAGES.PROTOCOL.CH3_OATH_4}<br/>
                  {MESSAGES.PROTOCOL.CH3_OATH_5}<br/>
                </p>
            </div>
          </section>

          {/* Chapter 4 */}
          <section>
            <div className="flex items-center gap-4 mb-6">
              <span className="text-6xl font-thin text-slate-200">{MESSAGES.PROTOCOL.CH4_NUM}</span>
              <div className="h-px bg-slate-200 flex-grow"></div>
              <h2 className="text-2xl font-bold text-slate-900 font-sans">{MESSAGES.PROTOCOL.CH4_TITLE}</h2>
            </div>
            
            <h3 className="text-xl font-bold mb-6 font-sans">{MESSAGES.PROTOCOL.CH4_1_TITLE}</h3>
              <div className="bg-slate-50 p-6 rounded border border-slate-300 mb-8">
                <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <span className="text-blue-600">ℹ</span> {MESSAGES.PROTOCOL.CH4_1_SEC1_TITLE.replace("ℹ ", "")}
                </h4>
                <p className="text-slate-800 text-base mb-4 leading-relaxed">
                  {MESSAGES.PROTOCOL.CH4_1_SEC1_P1_1}
                  <strong className="text-slate-900">{MESSAGES.PROTOCOL.CH4_1_SEC1_STRONG}</strong>
                  {MESSAGES.PROTOCOL.CH4_1_SEC1_P1_2}
                </p>

                <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2 border-t border-slate-300 pt-4">
                  <span className="text-slate-900">V</span> {MESSAGES.PROTOCOL.CH4_1_SEC2_TITLE.replace("V ", "")}
                </h4>
                <p className="font-mono text-slate-800 text-base mb-0 leading-relaxed">
                  {MESSAGES.PROTOCOL.CH4_1_SEC2_P1_1}<strong className="text-slate-900">{MESSAGES.PROTOCOL.CH4_1_SEC2_STRONG}</strong>
                  {MESSAGES.PROTOCOL.CH4_1_SEC2_P1_2}
                </p>


               <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2 border-t border-slate-300 pt-4">
                   <span className="text-yellow-600">⚠</span> {MESSAGES.PROTOCOL.CH4_1_SEC3_TITLE.replace("⚠ ", "")}
               </h4>
               <p className="text-slate-900 text-base mb-0 leading-relaxed">
                   {MESSAGES.PROTOCOL.CH4_1_SEC3_P1_1}<br/>
                   {MESSAGES.PROTOCOL.CH4_1_SEC3_P1_2}<strong className="text-slate-900">{MESSAGES.PROTOCOL.CH4_1_SEC3_STRONG}</strong>{MESSAGES.PROTOCOL.CH4_1_SEC3_P1_3}<br/>
                   {MESSAGES.PROTOCOL.CH4_1_SEC3_P1_4}
               </p>
            </div>

            <h3 className="text-xl font-bold mb-6 font-sans">{MESSAGES.PROTOCOL.CH4_2_TITLE}</h3>
            
            <div className="space-y-6">
                {/* KPI 1 */}
                <div>
                    <h4 className="border-l-4 border-slate-900 pl-3 font-bold text-lg text-slate-900 mb-2">
                        {MESSAGES.PROTOCOL.CH4_2_A_TITLE}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base mb-2">
                         <div className="bg-slate-50 p-3 rounded">
                             <div className="text-sm text-slate-700 uppercase tracking-wider mb-1">{MESSAGES.PROTOCOL.CH4_2_A_CALC_LBL}</div>
                             <div className="font-mono text-slate-900">{MESSAGES.PROTOCOL.CH4_2_A_CALC_VAL}</div>
                         </div>
                         <div className="bg-slate-50 p-3 rounded">
                             <div className="text-sm text-slate-700 uppercase tracking-wider mb-1">{MESSAGES.PROTOCOL.CH4_2_A_TARGET_LBL}</div>
                             <div className="font-mono text-green-700 font-bold">{MESSAGES.PROTOCOL.CH4_2_A_TARGET_VAL}</div>
                         </div>
                    </div>
                    <p className="text-slate-900 text-base">
                        {MESSAGES.PROTOCOL.CH4_2_A_DESC_1}<br/>
                        {MESSAGES.PROTOCOL.CH4_2_A_DESC_2}
                    </p>
                </div>

                {/* KPI 2 */}
                <div>
                    <h4 className="border-l-4 border-slate-900 pl-3 font-bold text-lg text-slate-900 mb-2">
                        {MESSAGES.PROTOCOL.CH4_2_B_TITLE}
                    </h4>
                     <ul className="list-disc list-inside space-y-2 text-slate-900 text-base">
                         <li>
                             <strong className="text-slate-900">{MESSAGES.PROTOCOL.CH4_2_B_L1_STRONG}</strong> 
                             {MESSAGES.PROTOCOL.CH4_2_B_L1_DESC}
                         </li>
                         <li>
                             <strong className="text-slate-900">{MESSAGES.PROTOCOL.CH4_2_B_L2_STRONG}</strong>
                             {MESSAGES.PROTOCOL.CH4_2_B_L2_DESC}
                         </li>
                     </ul>
                </div>
            </div>

            <h3 className="text-xl font-bold mt-10 mb-6 font-sans">{MESSAGES.PROTOCOL.CH4_3_TITLE}</h3>
            <div className="space-y-6">
                <div>
                    <h4 className="border-l-4 border-slate-900 pl-3 font-bold text-lg text-slate-900 mb-2">
                         {MESSAGES.PROTOCOL.CH4_3_C_TITLE}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-center text-base mb-2">
                        <div className="bg-green-50 p-2 rounded border border-green-100">
                            <span className="block font-bold text-green-700">{MESSAGES.PROTOCOL.CH4_3_C_SPRING}</span>
                            <span className="text-sm text-slate-800">{MESSAGES.PROTOCOL.CH4_3_C_SPRING_DESC}</span>
                        </div>
                        <div className="bg-yellow-50 p-2 rounded border border-yellow-100">
                            <span className="block font-bold text-yellow-700">{MESSAGES.PROTOCOL.CH4_3_C_EQUINOX}</span>
                            <span className="text-sm text-slate-800">{MESSAGES.PROTOCOL.CH4_3_C_EQUINOX_DESC}</span>
                        </div>
                        <div className="bg-slate-100 p-2 rounded border border-slate-300">
                            <span className="block font-bold text-slate-900">{MESSAGES.PROTOCOL.CH4_3_C_WINTER}</span>
                            <span className="text-sm text-slate-800">{MESSAGES.PROTOCOL.CH4_3_C_WINTER_DESC}</span>
                        </div>
                    </div>
                    <p className="text-slate-900 text-base">
                        {MESSAGES.PROTOCOL.CH4_3_C_DESC_1}<br/>
                        <strong>{MESSAGES.PROTOCOL.CH4_3_C_DESC_SPRING}</strong>{MESSAGES.PROTOCOL.CH4_3_C_DESC_2}<br/>
                        <strong>{MESSAGES.PROTOCOL.CH4_3_C_DESC_WINTER}</strong>{MESSAGES.PROTOCOL.CH4_3_C_DESC_3}
                    </p>
                </div>

                <div>
                     <h4 className="border-l-4 border-slate-900 pl-3 font-bold text-lg text-slate-900 mb-2">
                         {MESSAGES.PROTOCOL.CH4_3_D_TITLE}
                    </h4>
                     <ul className="list-disc list-inside space-y-1 text-slate-900 text-base">
                         <li><strong className="text-slate-900">{MESSAGES.PROTOCOL.CH4_3_D_L1_STRONG}</strong> {MESSAGES.PROTOCOL.CH4_3_D_L1_DESC}</li>
                         <li>{MESSAGES.PROTOCOL.CH4_3_D_L2}</li>
                     </ul>
                </div>
            </div>


            <h3 className="text-xl font-bold mt-10 mb-6 font-sans">{MESSAGES.PROTOCOL.CH4_4_TITLE}</h3>
            <div className="overflow-hidden border border-slate-300 rounded-lg">
                {/* Mobile View (Cards) */}
                <div className="md:hidden divide-y divide-slate-100">
                    {/* Healthy */}
                    <div className="bg-green-50/50 p-4">
                        <div className="font-bold text-green-800 mb-1">{MESSAGES.PROTOCOL.CH4_4_R1_TITLE}</div>
                        <div className="text-sm font-normal text-green-600 mb-3 font-mono">{MESSAGES.PROTOCOL.CH4_4_R1_COND}</div>
                        
                        <div className="text-xs font-bold text-slate-700 uppercase mb-1">{MESSAGES.PROTOCOL.CH4_4_CAUSE_LBL}</div>
                        <div className="text-sm text-slate-900 mb-3">{MESSAGES.PROTOCOL.CH4_4_R1_CAUSE}</div>
                        
                        <div className="text-xs font-bold text-slate-700 uppercase mb-1">{MESSAGES.PROTOCOL.CH4_4_ACTION_LBL}</div>
                        <div className="text-sm">
                            <span className="block font-bold text-green-600">{MESSAGES.PROTOCOL.CH4_4_R1_ACTION}</span>
                            {MESSAGES.PROTOCOL.CH4_4_R1_DESC}
                        </div>
                    </div>

                    {/* Starvation */}
                    <div className="bg-white p-4">
                        <div className="font-bold text-slate-900 mb-1">{MESSAGES.PROTOCOL.CH4_4_R2_TITLE}</div>
                        <div className="text-sm font-normal text-slate-700 mb-3 font-mono">{MESSAGES.PROTOCOL.CH4_4_R2_COND}</div>
                        
                        <div className="text-xs font-bold text-slate-700 uppercase mb-1">{MESSAGES.PROTOCOL.CH4_4_CAUSE_LBL}</div>
                        <div className="text-sm text-slate-900 mb-3">{MESSAGES.PROTOCOL.CH4_4_R2_CAUSE}</div>
                        
                        <div className="text-xs font-bold text-slate-700 uppercase mb-1">{MESSAGES.PROTOCOL.CH4_4_ACTION_LBL}</div>
                         <div className="text-sm">
                            <span className="block font-bold text-blue-600">{MESSAGES.PROTOCOL.CH4_4_R2_ACTION}</span>
                            {MESSAGES.PROTOCOL.CH4_4_R2_DESC_1}<br/>{MESSAGES.PROTOCOL.CH4_4_R2_DESC_2}
                        </div>
                    </div>

                    {/* Saturation */}
                    <div className="bg-white p-4">
                        <div className="font-bold text-slate-900 mb-1">{MESSAGES.PROTOCOL.CH4_4_R3_TITLE}</div>
                        <div className="text-sm font-normal text-slate-700 mb-3 font-mono">{MESSAGES.PROTOCOL.CH4_4_R3_COND}</div>
                        
                        <div className="text-xs font-bold text-slate-700 uppercase mb-1">{MESSAGES.PROTOCOL.CH4_4_CAUSE_LBL}</div>
                        <div className="text-sm text-slate-900 mb-3">{MESSAGES.PROTOCOL.CH4_4_R3_CAUSE}</div>
                        
                        <div className="text-xs font-bold text-slate-700 uppercase mb-1">{MESSAGES.PROTOCOL.CH4_4_ACTION_LBL}</div>
                        <div className="text-sm">
                            <span className="block font-bold text-purple-600">{MESSAGES.PROTOCOL.CH4_4_R3_ACTION}</span>
                            {MESSAGES.PROTOCOL.CH4_4_R3_DESC_1}<br/>{MESSAGES.PROTOCOL.CH4_4_R3_DESC_2}
                        </div>
                    </div>

                     {/* Stagnation */}
                    <div className="bg-white p-4">
                        <div className="font-bold text-slate-900 mb-1">{MESSAGES.PROTOCOL.CH4_4_R4_TITLE}</div>
                        <div className="text-sm font-mono font-bold text-red-500 mb-3">{MESSAGES.PROTOCOL.CH4_4_R4_COND}</div>
                        
                        <div className="text-xs font-bold text-slate-700 uppercase mb-1">{MESSAGES.PROTOCOL.CH4_4_CAUSE_LBL}</div>
                        <div className="text-sm text-slate-900 mb-3">{MESSAGES.PROTOCOL.CH4_4_R4_CAUSE}</div>
                        
                        <div className="text-xs font-bold text-slate-700 uppercase mb-1">{MESSAGES.PROTOCOL.CH4_4_ACTION_LBL}</div>
                        <div className="text-sm">
                            <span className="block font-bold text-red-600">{MESSAGES.PROTOCOL.CH4_4_R4_ACTION}</span>
                            {MESSAGES.PROTOCOL.CH4_4_R4_DESC_1}<br/>{MESSAGES.PROTOCOL.CH4_4_R4_DESC_2}
                        </div>
                    </div>
                </div>

                {/* Desktop View (Table) */}
                <table className="hidden md:table min-w-full text-base text-left text-slate-800">
                    <thead className="bg-slate-100 text-slate-900 font-sans uppercase text-base">
                        <tr>
                            <th className="px-6 py-3">{MESSAGES.PROTOCOL.CH4_4_TBL_H1}</th>
                            <th className="px-6 py-3">{MESSAGES.PROTOCOL.CH4_4_TBL_H2}</th>
                            <th className="px-6 py-3">{MESSAGES.PROTOCOL.CH4_4_TBL_H3}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        <tr className="bg-green-50/50">
                            <td className="px-6 py-4 font-bold text-green-800">{MESSAGES.PROTOCOL.CH4_4_R1_TITLE}<br/><span className="text-sm font-normal text-green-600 font-mono">{MESSAGES.PROTOCOL.CH4_4_R1_COND}</span></td>
                            <td className="px-6 py-4">{MESSAGES.PROTOCOL.CH4_4_R1_CAUSE}</td>
                            <td className="px-6 py-4">
                                <span className="block font-bold text-green-600">{MESSAGES.PROTOCOL.CH4_4_R1_ACTION}</span>
                                {MESSAGES.PROTOCOL.CH4_4_R1_DESC}
                            </td>
                        </tr>
                        <tr className="bg-white">
                            <td className="px-6 py-4 font-bold text-slate-900">{MESSAGES.PROTOCOL.CH4_4_R2_TITLE}<br/><span className="text-sm font-normal text-slate-700 font-mono">{MESSAGES.PROTOCOL.CH4_4_R2_COND}</span></td>
                            <td className="px-6 py-4">{MESSAGES.PROTOCOL.CH4_4_R2_CAUSE}</td>
                            <td className="px-6 py-4">
                                <span className="block font-bold text-blue-600">{MESSAGES.PROTOCOL.CH4_4_R2_ACTION}</span>
                                {MESSAGES.PROTOCOL.CH4_4_R2_DESC_1}<br/>{MESSAGES.PROTOCOL.CH4_4_R2_DESC_2}
                            </td>
                        </tr>
                        <tr className="bg-white">
                            <td className="px-6 py-4 font-bold text-slate-900">{MESSAGES.PROTOCOL.CH4_4_R3_TITLE}<br/><span className="text-sm font-normal text-slate-700 font-mono">{MESSAGES.PROTOCOL.CH4_4_R3_COND}</span></td>
                            <td className="px-6 py-4">{MESSAGES.PROTOCOL.CH4_4_R3_CAUSE}</td>
                            <td className="px-6 py-4">
                                <span className="block font-bold text-purple-600">{MESSAGES.PROTOCOL.CH4_4_R3_ACTION}</span>
                                {MESSAGES.PROTOCOL.CH4_4_R3_DESC_1}<br/>{MESSAGES.PROTOCOL.CH4_4_R3_DESC_2}
                            </td>
                        </tr>
                        <tr className="bg-white">
                            <td className="px-6 py-4 font-bold text-slate-900">{MESSAGES.PROTOCOL.CH4_4_R4_TITLE}<br/><span className="text-sm font-mono font-bold text-red-500">{MESSAGES.PROTOCOL.CH4_4_R4_COND}</span></td>
                            <td className="px-6 py-4">{MESSAGES.PROTOCOL.CH4_4_R4_CAUSE}</td>
                            <td className="px-6 py-4">
                                <span className="block font-bold text-red-600">{MESSAGES.PROTOCOL.CH4_4_R4_ACTION}</span>
                                {MESSAGES.PROTOCOL.CH4_4_R4_DESC_1}<br/>{MESSAGES.PROTOCOL.CH4_4_R4_DESC_2}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
          </section>

          {/* Footer */}
          <div className="pt-20 text-center">
             <div className="w-16 h-px bg-slate-200 mx-auto mb-6"></div>
             <p className="text-slate-700 font-sans text-sm uppercase tracking-widest">
               {MESSAGES.PROTOCOL.FOOTER_P1}<br/>
               {MESSAGES.PROTOCOL.FOOTER_P2}
             </p>
          </div>

        </div>
      </div>
    </div>
  );
};
