
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import { MESSAGES } from '../constants/messages';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-[#F9F8F4] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Background Textures */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-multiply z-0"
               style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
          <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-amber-100/20 blur-[120px] rounded-full pointer-events-none z-0" />

          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 z-50 p-2 rounded-full bg-white/50 hover:bg-white text-slate-500 hover:text-slate-600 transition-colors shadow-sm"
          >
            <X size={20} />
          </button>

          {/* Scrollable Area */}
          <div className="overflow-y-auto flex-1 p-5 md:p-12 relative z-10 scroll-smooth">
            
            <div className="max-w-3xl mx-auto">
                {/* Title Section */}
                <div className="mb-16 text-center">
                <div className="inline-flex items-center justify-center p-3 mb-6 bg-white rounded-full shadow-sm">
                    <Sparkles size={20} className="text-amber-400" />
                </div>
                <h2 className="text-3xl font-serif font-medium text-slate-800 tracking-[0.2em] mb-4">
                    {MESSAGES.MODALS.GUIDE_TITLE}
                </h2>
                <p className="text-xs md:text-sm text-slate-500 font-serif tracking-widest opacity-80">
                    {MESSAGES.MODALS.GUIDE_SUBTITLE}
                </p>
                </div>

                {/* Introduction */}
                <section className="mb-20 text-center font-serif leading-loose text-slate-600">
                <p className="mb-8 text-base tracking-wide">
                    <span className="inline-block">{MESSAGES.MODALS.GUIDE_INTRO_1}</span><br className="hidden md:block" />
                    <span className="inline-block">{MESSAGES.MODALS.GUIDE_INTRO_2}</span>
                </p>
                <div className="w-12 h-[1px] bg-slate-200 mx-auto my-8"></div>
                </section>

                {/* Examples Section */}
                <section className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 md:p-10 border border-slate-100 shadow-sm divide-y divide-slate-100/80 mb-16 md:mb-20">
                {/* 1000 Lm */}
                <div className="py-6 md:py-8 first:pt-0 last:pb-0 md:grid md:grid-cols-12 md:gap-8 items-center cursor-default">
                    <div className="md:col-span-4 mb-3 md:mb-0 text-center md:text-left">
                    <span className="inline-block text-3xl font-mono font-bold text-[#B8860B] mb-1">1,000 <span className="text-xs font-normal text-slate-500">Lm</span></span>
                    <h3 className="text-3xl font-serif font-bold text-slate-800">{MESSAGES.MODALS.GUIDE_HEAVY_TITLE}</h3>
                    <p className="text-xs text-slate-500 tracking-widest uppercase mt-1">{MESSAGES.MODALS.GUIDE_HEAVY_SUB}</p>
                    </div>
                    <div className="md:col-span-8 relative">
                    <div className="hidden md:block absolute left-0 top-0 bottom-0 w-[1px] bg-slate-100"></div>
                    <div className="md:pl-8 text-center md:text-left">
                        <p className="text-slate-700 leading-relaxed text-base" dangerouslySetInnerHTML={{ __html: MESSAGES.MODALS.GUIDE_HEAVY_DESC.replace('\n', '<br/>') }} />
                    </div>
                </div>
                </div>

                {/* 500 Lm */}
                <div className="py-6 md:py-8 first:pt-0 last:pb-0 md:grid md:grid-cols-12 md:gap-8 items-center cursor-default">
                    <div className="md:col-span-4 mb-3 md:mb-0 text-center md:text-left">
                    <span className="inline-block text-3xl font-mono font-bold text-amber-600 mb-1">500 <span className="text-xs font-normal text-slate-500">Lm</span></span>
                    <h3 className="text-3xl font-serif font-bold text-slate-800">{MESSAGES.MODALS.GUIDE_MEDIUM_TITLE}</h3>
                    <p className="text-xs text-slate-500 tracking-widest uppercase mt-1">{MESSAGES.MODALS.GUIDE_MEDIUM_SUB}</p>
                    </div>
                    <div className="md:col-span-8 relative">
                    <div className="hidden md:block absolute left-0 top-0 bottom-0 w-[1px] bg-slate-100"></div>
                    <div className="md:pl-8 text-center md:text-left">
                        <p className="text-slate-700 leading-relaxed text-base" dangerouslySetInnerHTML={{ __html: MESSAGES.MODALS.GUIDE_MEDIUM_DESC.replace('\n', '<br/>') }} />
                    </div>
                </div>
                </div>

                {/* 0 Lm */}
                <div className="py-6 md:py-8 first:pt-0 last:pb-0 md:grid md:grid-cols-12 md:gap-8 items-center cursor-default">
                    <div className="md:col-span-4 mb-3 md:mb-0 text-center md:text-left">
                    <span className="inline-block text-3xl font-mono font-bold text-pink-400 mb-1">0 <span className="text-xs font-normal text-slate-500">Lm</span></span>
                    <h3 className="text-3xl font-serif font-bold text-slate-800">{MESSAGES.MODALS.GUIDE_LIGHT_TITLE}</h3>
                    <p className="text-xs text-slate-500 tracking-widest uppercase mt-1">{MESSAGES.MODALS.GUIDE_LIGHT_SUB}</p>
                    </div>
                    <div className="md:col-span-8 relative">
                    <div className="hidden md:block absolute left-0 top-0 bottom-0 w-[1px] bg-slate-100"></div>
                    <div className="md:pl-8 text-center md:text-left">
                        <p className="text-slate-700 leading-relaxed text-base" dangerouslySetInnerHTML={{ __html: MESSAGES.MODALS.GUIDE_LIGHT_DESC.replace('\n', '<br/>') }} />
                    </div>
                </div>
                </div>
                </section>

                {/* Important Note: Hybrid Usage */}
                <section className="bg-amber-50/50 text-slate-700 rounded-3xl p-6 md:p-10 text-center relative overflow-hidden border border-amber-100/50 shadow-inner">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/20 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-100/20 rounded-full blur-3xl pointer-events-none"></div>
                
                <h4 className="text-base font-serif font-bold text-amber-800 mb-4 md:mb-6 tracking-widest relative z-10">
                    {MESSAGES.MODALS.GUIDE_HYBRID_TITLE}
                </h4>
                <div className="inline-block bg-white px-5 py-3 md:px-6 md:py-4 rounded-xl border border-amber-100 shadow-sm mb-4 md:mb-6 relative z-10 w-full md:w-auto">
                    <p className="text-base font-bold text-slate-800" dangerouslySetInnerHTML={{ __html: MESSAGES.MODALS.GUIDE_HYBRID_1.replace('\n', '<br/>') }} />
                </div>
                <p className="text-xs text-slate-500 tracking-widest opacity-80 leading-relaxed relative z-10" dangerouslySetInnerHTML={{ __html: MESSAGES.MODALS.GUIDE_HYBRID_2.replace('\n', '<br/>') }} />
                </section>
                
                <div className="mt-12 text-center">
                    <button 
                        onClick={onClose}
                        className="px-8 py-3 rounded-full bg-slate-200 text-slate-600 text-base font-bold hover:bg-slate-300 transition-colors tracking-widest"
                    >
                        {MESSAGES.MODALS.BTN_CLOSE}
                    </button>
                </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
