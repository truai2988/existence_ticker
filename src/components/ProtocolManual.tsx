import React from "react";
import { X, Activity } from "lucide-react";
import { MESSAGES } from "../constants/messages";

interface ProtocolManualProps {
  onClose: () => void;
}

export const ProtocolManual: React.FC<ProtocolManualProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[200] bg-white shadow-sm border border-slate-200 p-6 overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-300 text-slate-900">
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
