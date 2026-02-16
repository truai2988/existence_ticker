
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
                <h2 className="text-2xl md:text-3xl font-serif font-medium text-slate-800 tracking-[0.2em] mb-4">
                    お裾分けの目安とお作法
                </h2>
                <p className="text-xs md:text-sm text-slate-500 font-serif tracking-widest opacity-80">
                    GUIDELINE
                </p>
                </div>

                {/* Introduction */}
                <section className="mb-20 text-center font-serif leading-loose text-slate-600">
                <p className="mb-8 text-base md:text-lg tracking-wide">
                    Lm（ルーメン）は、あなたの「元気」のしるし。<br className="hidden md:block" />
                    感謝の気持ちを光に乗せて、誰かに手渡してみましょう。
                </p>
                <div className="w-12 h-[1px] bg-slate-200 mx-auto my-8"></div>
                </section>

                {/* Examples Section */}
                <section className="space-y-6 mb-20">
                {/* 100 Lm */}
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-slate-100 shadow-sm md:grid md:grid-cols-12 md:gap-8 items-center cursor-default hover:shadow-md transition-shadow duration-500">
                    <div className="md:col-span-4 mb-4 md:mb-0 text-center md:text-left">
                    <span className="inline-block text-2xl font-mono font-bold text-amber-500 mb-1">100 <span className="text-xs font-normal text-slate-400">Lm</span></span>
                    <h3 className="text-lg font-serif font-bold text-slate-800">軽い手助け</h3>
                    <p className="text-xs text-slate-400 tracking-widest uppercase mt-1">Casual Help</p>
                    </div>
                    <div className="md:col-span-8 relative">
                    <div className="hidden md:block absolute left-0 top-0 bottom-0 w-[1px] bg-slate-100"></div>
                    <div className="md:pl-8">
                        <p className="text-slate-700 leading-relaxed text-sm">
                        荷物運び、スマホ操作、ちょっとした相談など。<br/>
                        100 Lmは、お茶をご馳走するような気軽な感謝のしるしです。
                        </p>
                    </div>
                </div>
                </div>

                {/* 500 Lm */}
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-slate-100 shadow-sm md:grid md:grid-cols-12 md:gap-8 items-center cursor-default hover:shadow-md transition-shadow duration-500">
                    <div className="md:col-span-4 mb-4 md:mb-0 text-center md:text-left">
                    <span className="inline-block text-2xl font-mono font-bold text-amber-600 mb-1">500 <span className="text-xs font-normal text-slate-400">Lm</span></span>
                    <h3 className="text-lg font-serif font-bold text-slate-800">しっかりしたお礼</h3>
                    <p className="text-xs text-slate-400 tracking-widest uppercase mt-1">Solid Gratitude</p>
                    </div>
                    <div className="md:col-span-8 relative">
                    <div className="hidden md:block absolute left-0 top-0 bottom-0 w-[1px] bg-slate-100"></div>
                    <div className="md:pl-8">
                        <p className="text-slate-700 leading-relaxed text-sm">
                        草むしり、お悩み相談、不用品回収の手伝いなど。<br/>
                        500 Lmは、ランチをご馳走するような、しっかりとした誠意を伝えます。
                        </p>
                    </div>
                </div>
                </div>

                {/* 1000 Lm */}
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-slate-100 shadow-sm md:grid md:grid-cols-12 md:gap-8 items-center cursor-default hover:shadow-md transition-shadow duration-500">
                    <div className="md:col-span-4 mb-4 md:mb-0 text-center md:text-left">
                    <span className="inline-block text-2xl font-mono font-bold text-rose-500 mb-1">1,000 <span className="text-xs font-normal text-slate-400">Lm</span></span>
                    <h3 className="text-lg font-serif font-bold text-slate-800">深い献身</h3>
                    <p className="text-xs text-slate-400 tracking-widest uppercase mt-1">Deep Dedication</p>
                    </div>
                    <div className="md:col-span-8 relative">
                    <div className="hidden md:block absolute left-0 top-0 bottom-0 w-[1px] bg-slate-100"></div>
                    <div className="md:pl-8">
                        <p className="text-slate-700 leading-relaxed text-sm">
                        専門スキル、一晩の見守り、大掛かりな片付けなど。<br/>
                        1,000 Lmは、ディナーをご馳走するような、深い信頼と献身への賛辞です。
                        </p>
                    </div>
                </div>
                </div>
                </section>

                {/* Important Note: Hybrid Usage */}
                <section className="bg-slate-800 text-slate-200 rounded-2xl p-8 md:p-10 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
                
                <h4 className="text-base font-serif font-bold text-amber-100 mb-6 tracking-widest relative z-10">
                    ハイブリッドな使い方のススメ
                </h4>
                <div className="inline-block bg-white/10 px-6 py-4 rounded-xl border border-white/10 backdrop-blur-md mb-6 relative z-10">
                    <p className="text-sm font-bold text-white shadow-sm">
                        実費（材料費や交通費）は『円』で。<br/>
                        手間や感謝は『Lm』で。
                    </p>
                </div>
                <p className="text-xs text-slate-400 tracking-widest opacity-80 leading-relaxed relative z-10">
                    実費の清算が終わったあとに、そっとLm（元気）を添える。<br/>
                    そんな優しい循環を、ここから始めましょう。
                </p>
                </section>
                
                <div className="mt-12 text-center">
                    <button 
                        onClick={onClose}
                        className="px-8 py-3 rounded-full bg-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-300 transition-colors tracking-widest"
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
