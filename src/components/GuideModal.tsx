
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';

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
            className="absolute top-6 right-6 z-50 p-2 rounded-full bg-white/50 hover:bg-white text-slate-400 hover:text-slate-600 transition-colors shadow-sm"
          >
            <X size={20} />
          </button>

          {/* Scrollable Area */}
          <div className="overflow-y-auto flex-1 p-8 md:p-12 relative z-10 scroll-smooth">
            
            <div className="max-w-3xl mx-auto">
                {/* Title Section */}
                <div className="mb-16 text-center">
                <div className="inline-flex items-center justify-center p-3 mb-6 bg-white rounded-full shadow-sm">
                    <Sparkles size={20} className="text-amber-400" />
                </div>
                <h2 className="text-3xl font-serif font-medium text-slate-800 tracking-[0.2em] mb-4">
                    お裾分けの目安とお作法
                </h2>
                <p className="text-xs md:text-sm text-slate-500 font-serif tracking-widest opacity-80">
                    GUIDELINE
                </p>
                </div>

                {/* Introduction */}
                <section className="mb-20 text-center font-serif leading-loose text-slate-600">
                <p className="mb-8 text-base tracking-wide">
                    Lm（ルーメン）は、あなたの「源気」のしるし。<br className="hidden md:block" />
                    感謝の気持ちを光に乗せて、誰かに手渡してみましょう。
                </p>
                <div className="w-12 h-[1px] bg-slate-200 mx-auto my-8"></div>
                </section>

                {/* Examples Section */}
                <section className="space-y-6 mb-20">
                {/* 0 Lm */}
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-slate-100 shadow-sm md:grid md:grid-cols-12 md:gap-8 items-center cursor-default hover:shadow-md transition-shadow duration-500">
                    <div className="md:col-span-4 mb-4 md:mb-0 text-center md:text-left">
                    <span className="inline-block text-3xl font-mono font-bold text-pink-400 mb-1">0 <span className="text-xs font-normal text-slate-400">Lm</span></span>
                    <h3 className="text-3xl font-serif font-bold text-slate-800">魂の共鳴</h3>
                    <p className="text-xs text-slate-400 tracking-widest uppercase mt-1">Priceless</p>
                    </div>
                    <div className="md:col-span-8 relative">
                    <div className="hidden md:block absolute left-0 top-0 bottom-0 w-[1px] bg-slate-100"></div>
                    <div className="md:pl-8">
                        <p className="text-slate-700 leading-relaxed text-base">
                        損得を超えた、純粋な繋がりを求めて。<br/>
                        0 Lm（共鳴）は、相手と響き合うことそのものを願うギフトのしるしです。
                        </p>
                    </div>
                </div>
                </div>

                {/* 500 Lm */}
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-slate-100 shadow-sm md:grid md:grid-cols-12 md:gap-8 items-center cursor-default hover:shadow-md transition-shadow duration-500">
                    <div className="md:col-span-4 mb-4 md:mb-0 text-center md:text-left">
                    <span className="inline-block text-3xl font-mono font-bold text-amber-600 mb-1">500 <span className="text-xs font-normal text-slate-400">Lm</span></span>
                    <h3 className="text-3xl font-serif font-bold text-slate-800">日常の手助け</h3>
                    <p className="text-xs text-slate-400 tracking-widest uppercase mt-1">Gratitude</p>
                    </div>
                    <div className="md:col-span-8 relative">
                    <div className="hidden md:block absolute left-0 top-0 bottom-0 w-[1px] bg-slate-100"></div>
                    <div className="md:pl-8">
                        <p className="text-slate-700 leading-relaxed text-base">
                        暮らしのなかの、ささやかな支え合いに。<br/>
                        500 Lmは、ランチをご馳走するような、等身大の願いと素直な感謝を伝えます。
                        </p>
                    </div>
                </div>
                </div>

                {/* 1000 Lm */}
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-slate-100 shadow-sm md:grid md:grid-cols-12 md:gap-8 items-center cursor-default hover:shadow-md transition-shadow duration-500">
                    <div className="md:col-span-4 mb-4 md:mb-0 text-center md:text-left">
                    <span className="inline-block text-3xl font-mono font-bold text-[#B8860B] mb-1">1,000 <span className="text-xs font-normal text-slate-400">Lm</span></span>
                    <h3 className="text-3xl font-serif font-bold text-slate-800">人生の節目</h3>
                    <p className="text-xs text-slate-400 tracking-widest uppercase mt-1">Respect</p>
                    </div>
                    <div className="md:col-span-8 relative">
                    <div className="hidden md:block absolute left-0 top-0 bottom-0 w-[1px] bg-slate-100"></div>
                    <div className="md:pl-8">
                        <p className="text-slate-700 leading-relaxed text-base">
                        大切な局面を、共に歩んでほしいとき。<br/>
                        1,000 Lmは、ディナーをご馳走するような、特別な状況への最大の敬意を託します。
                        </p>
                    </div>
                </div>
                </div>
                </section>

                {/* Important Note: Hybrid Usage */}
                <section className="bg-amber-50/50 text-slate-700 rounded-2xl p-8 md:p-10 text-center relative overflow-hidden border border-amber-100/50 shadow-inner">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/20 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-100/20 rounded-full blur-3xl pointer-events-none"></div>
                
                <h4 className="text-base font-serif font-bold text-amber-800 mb-6 tracking-widest relative z-10">
                    ハイブリッドな使い方のススメ
                </h4>
                <div className="inline-block bg-white px-6 py-4 rounded-xl border border-amber-100 shadow-sm mb-6 relative z-10">
                    <p className="text-base font-bold text-slate-800">
                        実費（材料費や交通費）は『円』で。<br/>
                        手間や感謝は『Lm』で。
                    </p>
                </div>
                <p className="text-xs text-slate-500 tracking-widest opacity-80 leading-relaxed relative z-10">
                    実費の清算が終わったあとに、そっとLm（源気）を添える。<br/>
                    そんな優しい循環を、ここから始めましょう。
                </p>
                </section>
                
                <div className="mt-12 text-center">
                    <button 
                        onClick={onClose}
                        className="px-8 py-3 rounded-full bg-slate-200 text-slate-600 text-base font-bold hover:bg-slate-300 transition-colors tracking-widest"
                    >
                        閉じる
                    </button>
                </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
