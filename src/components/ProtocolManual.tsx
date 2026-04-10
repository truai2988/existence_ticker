import React from "react";
import { X, Activity, Shield } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

interface ProtocolManualProps {
  onClose: () => void;
}

export const ProtocolManual: React.FC<ProtocolManualProps> = ({ onClose }) => {
  const { t } = useLanguage();
  return (
    <div className="fixed inset-0 z-[200] bg-slate-50 overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-300 text-slate-900 pb-32">
      
      {/* Absolute Close Button above anything else */}
      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={onClose}
          className="p-3 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-slate-800 hover:text-slate-900 transition-all shadow-lg active:scale-95 border border-slate-300"
          aria-label="Close"
        >
          <X size={24} />
        </button>
      </div>

      {/* Hero Section */}
      <div className="relative w-full h-[40vh] sm:h-[50vh] bg-slate-900 overflow-hidden shadow-2xl mb-12">
        <img 
          src="/protocol_hero.png" 
          alt="Existence Ticker Ecosystem" 
          className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-screen"
        />
        <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-slate-50 via-slate-50/80 to-transparent"></div>
        
        <div className="absolute bottom-0 left-0 w-full pb-6 sm:pb-10 md:pb-12 pt-16 z-10">
          <div className="max-w-4xl mx-auto px-6 sm:px-10 md:px-12">
            <div className="flex items-center gap-2 text-yellow-600 mb-3 uppercase tracking-[0.3em] text-xs font-sans font-bold">
              <Activity size={14} />
              <span>{t.PROTOCOL.HEADER_SUB}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-black text-slate-900 leading-tight mb-4 drop-shadow-sm" style={{fontFamily: "'Noto Serif JP', serif"}}>
              {t.PROTOCOL.HEADER_TITLE}
            </h1>
            <p className="text-base sm:text-lg text-slate-900 font-semibold border-l-2 border-yellow-500 pl-3 font-serif leading-relaxed max-w-2xl">
              {t.PROTOCOL.INTRO_1}
              <br className="block md:hidden" />
              {t.PROTOCOL.INTRO_2}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 sm:px-10 md:px-12 space-y-20 font-serif leading-relaxed text-sm text-slate-900">
        
        {/* Chapter 1 */}
        <section className="flow-root">
          <div className="flex items-center gap-4 mb-4 relative z-0">
            <span className="text-4xl sm:text-5xl font-thin text-slate-300 font-mono tracking-tighter">{t.PROTOCOL.CH1_NUM}</span>
            <div className="h-px bg-slate-300 flex-grow"></div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-sans mb-2">{t.PROTOCOL.CH1_TITLE}</h2>

          <div className="clear-both hidden"></div>
          
          <div className="float-none sm:float-right w-full sm:w-1/2 md:w-5/12 sm:ml-8 mb-6 sm:mb-2 sm:mt-2 rounded-[2rem] overflow-hidden shadow-2xl ring-1 ring-slate-900/5 aspect-square relative group bg-slate-900 z-10">
            <img src="/protocol_ch1.png" alt="Circulation" className="w-full h-full object-cover transition-transform duration-[10s] group-hover:scale-110 opacity-90 mix-blend-screen" />
            <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(0,0,0,0.8)]"></div>
          </div>

          <h3 className="text-base text-slate-500 font-medium mb-5 tracking-wider">{t.PROTOCOL.CH1_SUB}</h3>
          
          <p className="mb-4 text-slate-800 leading-loose text-base">
            {t.PROTOCOL.CH1_P1_1}<br className="hidden sm:block"/>
            {t.PROTOCOL.CH1_P1_2}<strong className="text-slate-900 font-bold bg-yellow-100/80 px-1.5 py-0.5 rounded shadow-sm mx-1">{t.PROTOCOL.CH1_P1_STRONG}</strong>{t.PROTOCOL.CH1_P1_3}
          </p>
          <p className="text-slate-800 leading-loose text-base">
            {t.PROTOCOL.CH1_P2_1}<strong className="text-slate-900 font-bold px-1">{t.PROTOCOL.CH1_P2_STRONG}</strong>{t.PROTOCOL.CH1_P2_2}<br className="hidden sm:block"/>
            {t.PROTOCOL.CH1_P2_3}
          </p>
        </section>

        {/* Chapter 2 */}
        <section className="flow-root">
          <div className="flex items-center gap-4 mb-4 relative z-0">
            <span className="text-4xl sm:text-5xl font-thin text-slate-300 font-mono tracking-tighter">{t.PROTOCOL.CH2_NUM}</span>
            <div className="h-px bg-slate-300 flex-grow"></div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-sans mb-6">{t.PROTOCOL.CH2_TITLE}</h2>

          <div className="clear-both hidden"></div>

          <div className="float-none sm:float-left w-full sm:w-1/2 md:w-5/12 sm:mr-8 mb-6 sm:mb-2 sm:mt-2 rounded-[2rem] overflow-hidden shadow-2xl ring-1 ring-slate-900/5 aspect-square relative group bg-slate-900 z-10">
            <img src="/protocol_ch2.png" alt="Gravity and Sun" className="w-full h-full object-cover transition-transform duration-[10s] group-hover:scale-110 opacity-90 mix-blend-screen" />
            <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(0,0,0,0.8)]"></div>
          </div>
          
          <div className="space-y-5">
            <div className="bg-white/80 p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
              <h3 className="text-lg font-bold font-sans mb-3 text-slate-900 flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-50 text-blue-600 shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] text-sm">▼</span> 
                {t.PROTOCOL.CH2_SEC1_TITLE.replace("▼ ", "")}
              </h3>
              <p className="text-base text-slate-700 leading-loose">
                {t.PROTOCOL.CH2_SEC1_DESC}
              </p>
            </div>

            <div className="bg-white/80 p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-yellow-500"></div>
              <h3 className="text-lg font-bold font-sans mb-3 text-slate-900 flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-yellow-50 text-yellow-600 shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] text-sm">▲</span>
                {t.PROTOCOL.CH2_SEC2_TITLE.replace("▲ ", "")}
              </h3>
              <p className="text-base text-slate-700 leading-loose">
                {t.PROTOCOL.CH2_SEC2_DESC_1}
                <strong className="text-slate-900 mx-1 border-b border-yellow-400">{t.PROTOCOL.CH2_SEC2_STRONG}</strong>
                {t.PROTOCOL.CH2_SEC2_DESC_2}
              </p>
            </div>
          </div>
        </section>

        {/* Chapter 3 */}
        <section>
          <div className="flex items-center gap-4 mb-4">
            <span className="text-4xl sm:text-5xl font-thin text-slate-300 font-mono tracking-tighter">{t.PROTOCOL.CH3_NUM}</span>
            <div className="h-px bg-slate-300 flex-grow"></div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-sans mb-2">{t.PROTOCOL.CH3_TITLE}</h2>
          <h3 className="text-base text-slate-500 font-medium mb-5 tracking-wider">{t.PROTOCOL.CH3_SUB}</h3>
          
          <div className="max-w-3xl">
            <p className="mb-8 text-slate-800 leading-loose text-base">
              {t.PROTOCOL.CH3_P1_1}<br/>
              {t.PROTOCOL.CH3_P1_G}<strong className="text-slate-900 font-bold px-1">{t.PROTOCOL.CH3_P1_STRONG}</strong>{t.PROTOCOL.CH3_P1_2}
            </p>
            
            <div className="bg-slate-900 text-slate-300 p-5 sm:p-6 rounded-2xl shadow-2xl ring-1 ring-white/10 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-48 h-48 bg-white opacity-5 mix-blend-overlay rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
               <h4 className="font-sans text-xs uppercase tracking-[0.3em] text-slate-400 mb-4 border-b border-slate-700/50 pb-2 flex items-center gap-2">
                 <Shield size={14} />
                 {t.PROTOCOL.CH3_OATH_TITLE}
               </h4>
                <div className="font-serif text-sm leading-relaxed space-y-1.5 relative z-10 text-slate-300">
                  {t.PROTOCOL.CH3_OATH_1 && <p>{t.PROTOCOL.CH3_OATH_1}</p>}
                  {t.PROTOCOL.CH3_OATH_2 && <p>{t.PROTOCOL.CH3_OATH_2}</p>}
                  {t.PROTOCOL.CH3_OATH_3 && <p>{t.PROTOCOL.CH3_OATH_3}</p>}
                  {t.PROTOCOL.CH3_OATH_4 && <p>{t.PROTOCOL.CH3_OATH_4}</p>}
                  {t.PROTOCOL.CH3_OATH_5 && <p>{t.PROTOCOL.CH3_OATH_5}</p>}
                </div>
            </div>
          </div>
        </section>

        {/* Chapter 4 */}
        <section>
          <div className="flex items-center gap-4 mb-4">
            <span className="text-4xl sm:text-5xl font-thin text-slate-300 font-mono tracking-tighter">{t.PROTOCOL.CH4_NUM}</span>
            <div className="h-px bg-slate-300 flex-grow"></div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-sans mb-6">{t.PROTOCOL.CH4_TITLE}</h2>
          
          <h3 className="text-lg font-bold mb-6 font-sans text-slate-600 border-l-4 border-slate-400 pl-3">{t.PROTOCOL.CH4_1_TITLE}</h3>
            <div className="flex flex-col gap-6">
              
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-lg shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] shrink-0">
                  ℹ
                </div>
                <h4 className="font-bold text-slate-900 text-base">
                  {t.PROTOCOL.CH4_1_SEC1_TITLE.replace("ℹ ", "")}
                </h4>
                <p className="text-slate-700 text-sm leading-loose">
                  {t.PROTOCOL.CH4_1_SEC1_P1_1}
                  <strong className="text-slate-900 border-b border-yellow-400 mx-1">{t.PROTOCOL.CH4_1_SEC1_STRONG}</strong>
                  {t.PROTOCOL.CH4_1_SEC1_P1_2}
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center text-lg shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] shrink-0">
                  V
                </div>
                <h4 className="font-bold text-slate-900 text-base">
                  {t.PROTOCOL.CH4_1_SEC2_TITLE.replace("V ", "")}
                </h4>
                <div className="text-slate-700 text-sm leading-loose">
                  {t.PROTOCOL.CH4_1_SEC2_P1_1}
                  <span className="font-mono text-base text-slate-900 font-bold tracking-tight bg-slate-100 px-1 py-0.5 rounded shadow-sm mx-1">{t.PROTOCOL.CH4_1_SEC2_STRONG}</span>
                  {t.PROTOCOL.CH4_1_SEC2_P1_2}
                </div>
              </div>

             <div className="bg-white p-5 rounded-2xl border border-red-100 shadow-sm flex flex-col items-start gap-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-red-50 rounded-bl-full -z-0"></div>
                <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-lg shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] z-10 shrink-0">
                  ⚠
                </div>
                 <h4 className="font-bold text-slate-900 text-base z-10">
                     {t.PROTOCOL.CH4_1_SEC3_TITLE.replace("⚠ ", "")}
                 </h4>
                 <p className="text-slate-700 text-sm leading-loose z-10">
                     {t.PROTOCOL.CH4_1_SEC3_P1_1}<br/><br/>
                     {t.PROTOCOL.CH4_1_SEC3_P1_2}
                     <strong className="text-red-900 font-bold border-b border-red-200 mx-1">{t.PROTOCOL.CH4_1_SEC3_STRONG}</strong>
                     {t.PROTOCOL.CH4_1_SEC3_P1_3}<br/><br/>
                     {t.PROTOCOL.CH4_1_SEC3_P1_4}
                 </p>
              </div>

            </div>

        </section>

        {/* Footer */}
        <div className="pt-20 pb-10 text-center">
            <Activity className="mx-auto text-slate-300 mb-5" size={28} />
           <div className="w-12 h-px bg-slate-300 mx-auto mb-6"></div>
           <p className="text-slate-500 font-sans text-xs uppercase tracking-[0.4em] leading-loose">
              {t.PROTOCOL.FOOTER_P1}<br/>
             {t.PROTOCOL.FOOTER_P2}
           </p>
        </div>

      </div>
    </div>
  );
};
