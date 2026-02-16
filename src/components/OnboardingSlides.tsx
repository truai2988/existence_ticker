import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, X, Sun, Hourglass, HeartHandshake, Scale, Footprints } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const SLIDES = [
  {
    id: 1,
    icon: <Sun className="w-8 h-8 text-amber-500" />,
    title: "存在の価値",
    subtitle: "THE VESSEL",
    bgColor: "#FFFDF5", // Faint Warm Yellow
    content: (
        <div className="space-y-6 text-center leading-relaxed font-serif text-slate-700">
            <p className="text-base font-medium">
                あなたには、10日（変動あり）ごとに
            </p>
            <div className="py-2">
                <span className="text-3xl font-bold text-amber-600 font-serif tracking-tight">2,400 Lm</span>
                <span className="text-lg text-slate-600 ml-2">の</span><br/>
                <span className="text-lg text-slate-600">Lmが与えられます。</span>
            </div>
            <p className="text-sm opacity-80 font-sans text-slate-500">
                これがあなたの源気の源です。
            </p>
        </div>
    )
  },
  {
    id: 2,
    icon: <Hourglass className="w-8 h-8 text-blue-500" />,
    title: "Lmの儚さ",
    subtitle: "THE DECAY",
    bgColor: "#F5FAFF", // Faint Cool Blue
    content: (
        <div className="space-y-6 text-center leading-relaxed font-serif text-slate-700">
            <p className="text-base font-medium">
                このLmは、何もしなくても
            </p>
            <div className="py-2">
                <span className="text-3xl font-bold text-blue-500 font-serif">徐々に</span><br/>
                <span className="text-lg">空へと還っていきます。</span>
            </div>
            <div className="text-sm opacity-80 font-sans space-y-2 text-slate-500">
                <p>留めておくことはできません。</p>
                <p>だからこそ、今あるLmを大切に。</p>
            </div>
        </div>
    )
  },
  {
    id: 3,
    icon: <HeartHandshake className="w-8 h-8 text-rose-500" />,
    title: "Lmの循環",
    subtitle: "THE CONNECTION",
    bgColor: "#FFF5F7", // Faint Warm Pink
    content: (
        <div className="space-y-8 text-center leading-relaxed font-serif text-slate-700">
            <p className="text-lg font-medium">
                減っていくLmを、<br/>
                誰かのために使いましょう。
            </p>
            <div className="flex justify-center gap-10 text-lg font-bold">
                <span className="text-amber-500">お願い</span>
                <span className="text-blue-500">応える</span>
            </div>
            <div className="text-sm opacity-80 font-sans leading-loose text-slate-500">
                「ありがとう」と受け取ってもらえた時、<br/>
                そのLmは永遠の輝きに変わります。
            </div>
        </div>
    )
  },
  {
    id: 4,
    icon: <Scale className="w-8 h-8 text-emerald-500" />,
    title: "お裾分けの目安",
    subtitle: "THE STANDARD",
    bgColor: "#F6F9F8", // Faint Mint/Green
    content: (
        <div className="space-y-3 w-full max-w-[280px] mx-auto">
            <div className="bg-white/60 p-3 rounded-xl flex items-center gap-4">
                <span className="text-xl font-bold text-amber-400 w-12 text-right shrink-0 font-mono">100</span>
                <div className="text-left">
                    <div className="text-sm font-bold text-slate-700">軽い手助け</div>
                    <div className="text-xs text-slate-400">荷物運び、スマホ操作など</div>
                </div>
            </div>
            <div className="bg-white/60 p-3 rounded-xl flex items-center gap-4">
                <span className="text-xl font-bold text-amber-600 w-12 text-right shrink-0 font-mono">500</span>
                <div className="text-left">
                    <div className="text-sm font-bold text-slate-700">しっかりしたお礼</div>
                    <div className="text-xs text-slate-400">草むしり、相談、片付けなど</div>
                </div>
            </div>
            <div className="bg-white/60 p-3 rounded-xl flex items-center gap-4">
                <span className="text-xl font-bold text-rose-500 w-12 text-right shrink-0 font-mono">1,000</span>
                <div className="text-left">
                    <div className="text-sm font-bold text-slate-700">深い献身</div>
                    <div className="text-xs text-slate-400">専門スキル、長時間の見守り</div>
                </div>
            </div>
        </div>
    )
  },
  {
    id: 5,
    icon: <Footprints className="w-8 h-8 text-slate-600" />,
    title: "始まりの作法",
    subtitle: "THE BEGINNING",
    bgColor: "#F9F9F9", // Faint Neutral Gray
    content: (
        <div className="space-y-4 text-center leading-relaxed font-serif w-full mb-4">
            <div className="bg-[#0F1C3F] text-white py-4 px-3 rounded-xl shadow-md mx-auto w-full max-w-[280px]">
                <p className="font-bold text-sm mb-2 leading-relaxed">
                    実費（円）は<br /><span className="inline-block">「お財布」から。</span>
                </p>
                <p className="font-bold text-base leading-relaxed">
                    感謝（Lm）は<br /><span className="inline-block">「心」から。</span>
                </p>
            </div>
            <div className="text-xs text-slate-600 font-sans leading-loose opacity-90">
                <p>お金では伝えきれない<br />「ありがとう」を。</p>
                <p className="mt-2">さあ、新しい循環を<br className="sm:hidden" />始めましょう。</p>
            </div>
        </div>
    )
  }
];

export const OnboardingSlides: React.FC<Props> = ({ isOpen, onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] transition-colors duration-500"
          style={{ backgroundColor: SLIDES[currentSlide].bgColor }}
        >
            {/* Ambient Background Gradient */}
            <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-gradient-to-br from-amber-50/50 via-transparent to-blue-50/50 pointer-events-none" />
            
            {/* Noise Texture */}
            <div className="absolute inset-0 opacity-[0.03] mix-blend-multiply pointer-events-none"
                 style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }} 
            />

            {/* Top Bar: Close Button & Dots */}
            <div className="shrink-0 p-6 z-50 flex justify-between items-start relative">
                 {/* Progress Dots (Centered) */}
                <div className="absolute top-8 left-0 right-0 flex justify-center gap-2 pointer-events-none">
                    {SLIDES.map((_, idx) => (
                        <div 
                            key={idx} 
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                                idx === currentSlide ? "bg-slate-600 w-8" : "bg-slate-200 w-1.5"
                            }`}
                        />
                    ))}
                </div>

                {/* Close Button (Right) */}
                <button 
                    onClick={onClose}
                    className="absolute top-6 right-6 w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors z-50"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Main Content Area (Compact, No Scroll) */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 pt-4 pb-12 relative z-10 w-full">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSlide}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="flex flex-col items-center w-full min-h-full justify-center"
                    >
                        {/* Icon Circle - Reduced margin */}
                        <div className="w-20 h-20 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 ring-4 ring-white/50 shrink-0">
                            {SLIDES[currentSlide].icon}
                        </div>

                        {/* Titles - Reduced margin */}
                        <div className="text-center mb-2 shrink-0">
                            <h2 className="text-2xl font-serif font-medium text-slate-800 tracking-widest mb-2">
                                {SLIDES[currentSlide].title}
                            </h2>
                            <p className="text-xs text-slate-300 font-bold tracking-[0.3em] uppercase">
                                {SLIDES[currentSlide].subtitle}
                            </p>
                        </div>

                        {/* Content Body */}
                        <div className="w-full">
                            {SLIDES[currentSlide].content}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Footer / Navigation (Fixed at bottom, Centered Buttons) */}
            <div className="shrink-0 w-full px-8 pb-8 pt-0 z-20">
                <div className="flex items-center justify-center gap-4 relative w-full max-w-[320px] mx-auto">
                    {/* Back Button */}
                    <button 
                        onClick={handlePrev}
                        className={`flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-all min-w-[100px] ${currentSlide === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                    >
                        <ChevronLeft size={16} />
                        <span>戻る</span>
                    </button>

                    {/* Next/Start Button */}
                    <button 
                        onClick={handleNext}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-900 rounded-xl font-bold shadow-sm hover:shadow active:scale-[0.98] transition-all border border-slate-100"
                    >
                        <span>{currentSlide === SLIDES.length - 1 ? "始める" : "次へ"}</span>
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
