import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, ChevronRight, ChevronLeft, Sun, Hourglass, HeartHandshake, Scale, Footprints } from 'lucide-react';

interface OnboardingStoryProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void; // Callback for blessing trigger
  mode?: 'onboarding' | 'reference';
  initialSlide?: number; // For opening directly to "Standards" etc.
}

// Define slides function to accept mode
const getSlides = () => [
  {
    id: 'vessel',
    title: '存在の価値',
    subtitle: 'THE VESSEL',
    icon: <Sun size={32} className="text-amber-500" />,
    content: (
      <div className="text-center font-serif text-slate-700 leading-loose">
        <p className="mb-6 text-lg">
          あなたには、10日（変動あり）ごとに<br />
          <span className="text-2xl font-bold text-amber-600 mx-1">2,400 Lm</span> の<br />
          Lmが与えられます。
        </p>
        <p className="text-sm text-slate-600 font-medium">
          これがあなたの源気の源です。
        </p>
      </div>
    )
  },
  {
    id: 'decay',
    title: 'Lmの儚さ',
    subtitle: 'THE DECAY',
    icon: <Hourglass size={32} className="text-blue-400" />,
    content: (
      <div className="text-center font-serif text-slate-700 leading-loose">
        <p className="mb-6 text-lg">
          このLmは、何もしなくても<br />
          <span className="text-2xl font-bold text-blue-500 mx-1">徐々に</span> <br />
          空へと還っていきます。
        </p>
        <p className="text-sm text-slate-600 font-medium">
          留めておくことはできません。<br />
          だからこそ、今あるLmを大切に。
        </p>
      </div>
    )
  },
  {
    id: 'connect',
    title: 'Lmの循環',
    subtitle: 'THE CONNECTION',
    icon: <HeartHandshake size={32} className="text-rose-400" />,
    content: (
      <div className="text-center font-serif text-slate-700 leading-loose">
        <p className="mb-6 text-lg">
          減っていくLmを、<br />
          誰かのために使いましょう。
        </p>
        <div className="flex justify-center gap-8 mb-4 text-sm font-bold opacity-80">
          <div className="flex flex-col items-center">
            <span className="text-amber-600 mb-1">お願い</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-indigo-600 mb-1">応える</span>
          </div>
        </div>
        <p className="text-xs text-slate-600 font-medium">
          「ありがとう」と受け取ってもらえた時、<br />
          そのLmは永遠の輝きに変わります。
        </p>
      </div>
    )
  },
  {
    id: 'standard',
    title: 'お裾分けの目安',
    subtitle: 'THE STANDARD',
    icon: <Scale size={32} className="text-emerald-500" />,
    content: (
      <div className="space-y-4 w-full max-w-sm mx-auto">
        <div className="bg-white/60 p-4 rounded-xl border border-slate-100 flex items-center gap-4">
          <span className="font-mono font-bold text-amber-500 w-16 text-right">100</span>
          <div className="text-left">
            <div className="text-sm font-bold text-slate-700">軽い手助け</div>
            <div className="text-xs text-slate-600 font-bold">荷物運び、スマホ操作など</div>
          </div>
        </div>
        <div className="bg-white/60 p-4 rounded-xl border border-slate-100 flex items-center gap-4">
          <span className="font-mono font-bold text-amber-600 w-16 text-right">500</span>
          <div className="text-left">
            <div className="text-sm font-bold text-slate-700">しっかりしたお礼</div>
            <div className="text-xs text-slate-600 font-bold">草むしり、相談、片付けなど</div>
          </div>
        </div>
        <div className="bg-white/60 p-4 rounded-xl border border-slate-100 flex items-center gap-4">
          <span className="font-mono font-bold text-rose-500 w-16 text-right">1,000</span>
          <div className="text-left">
            <div className="text-sm font-bold text-slate-700">深い献身</div>
            <div className="text-xs text-slate-600 font-bold">専門スキル、長時間の見守り</div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'start',
    title: '始まりの作法',
    subtitle: 'THE BEGINNING',
    icon: <Footprints size={32} className="text-slate-600" />,
    content: (
      <div className="text-center font-serif text-slate-700 leading-loose">
         <div className="bg-white text-slate-800 p-6 rounded-2xl mb-6 shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl"></div>
            <p className="text-base font-bold relative z-10 flex flex-col items-center gap-1">
              <span className="whitespace-nowrap">実費（円）は「お財布」から。</span>
              <span className="whitespace-nowrap">感謝（Lm）は「心」から。</span>
            </p>
         </div>
        <p className="text-sm text-slate-600 font-medium">
          お金では伝えきれない「ありがとう」を。<br />
          さあ、新しい循環を始めましょう。
        </p>
      </div>
    )
  }
];

export const OnboardingStory: React.FC<OnboardingStoryProps> = ({ 
  isOpen, 
  onClose, 
  onComplete,
  mode = 'reference', 
  initialSlide = 0 
}) => {
  const [currentSlide, setCurrentSlide] = useState(initialSlide);
  
  const slides = getSlides();

  useEffect(() => {
    if (isOpen) {
      setCurrentSlide(initialSlide);
    }
  }, [isOpen, initialSlide, mode]);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
        // Last Slide Logic
        if (mode === 'onboarding' && onComplete) {
            onComplete(); // Trigger Blessing
        } else {
            onClose(); // Just Close
        }
    }
  };

  const handleBack = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  if (!isOpen) return null;

  const isLastSlide = currentSlide === slides.length - 1;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative w-full max-w-lg bg-[#F9F8F4] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col min-h-[500px]"
        >
          {/* Background Textures (Washi) */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.05] mix-blend-multiply z-0"
               style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
          
          {/* Dynamic Ambient Light */}
          <motion.div 
            key={`bg-${currentSlide}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className={`absolute top-0 right-0 w-[80%] h-[80%] blur-[100px] rounded-full pointer-events-none z-0
              ${currentSlide % 5 === 0 ? 'bg-amber-200/30' : 
                currentSlide % 5 === 1 ? 'bg-blue-200/30' : 
                currentSlide % 5 === 2 ? 'bg-rose-200/30' : 
                currentSlide % 5 === 3 ? 'bg-emerald-200/30' : 'bg-slate-200/30'}`}
          />

          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 z-50 p-3 rounded-full bg-white/50 hover:bg-white text-slate-400 hover:text-slate-600 transition-colors shadow-sm"
            aria-label="Close"
          >
            <X size={20} />
          </button>

          {/* Slide Content Area */}
          <div className="flex-1 flex flex-col relative z-10 p-8 sm:p-10">
            
            {/* Slide Indicators */}
            <div className="flex justify-center gap-2 mb-8">
              {slides.map((_, idx) => (
                <div 
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentSlide ? 'w-8 bg-slate-600' : 'w-2 bg-slate-200'}`}
                />
              ))}
            </div>

            {/* Main Content Transition */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col items-center justify-center"
              >
                {/* Icon Circle */}
                <div className="w-20 h-20 bg-white rounded-full shadow-md flex items-center justify-center mb-6 ring-4 ring-white/50">
                  {slides[currentSlide].icon}
                </div>

                {/* Typography */}
                <h2 className="text-2xl font-serif font-medium text-slate-800 tracking-widest mb-2 text-center">
                  {slides[currentSlide].title}
                </h2>
                <div className="text-xs font-bold tracking-[0.3em] text-slate-300 uppercase mb-8 text-center">
                  {slides[currentSlide].subtitle}
                </div>

                {/* Body Text */}
                <div className="w-full">
                  {slides[currentSlide].content}
                </div>

              </motion.div>
            </AnimatePresence>

          </div>

          {/* Footer / Navigation - High Accessibility */}
          <div className="p-8 pt-0 relative z-20">
            <div className="flex gap-4">
              
              {/* Back Button (Hidden on first slide) */}
              <button
                onClick={handleBack}
                disabled={currentSlide === 0}
                className={`flex-1 py-4 rounded-xl font-bold text-slate-500 transition-all flex items-center justify-center gap-2
                  ${currentSlide === 0 ? 'opacity-0 pointer-events-none' : 'hover:bg-slate-100 active:scale-[0.98]'}`}
              >
                <ChevronLeft size={20} />
                戻る
              </button>

              {/* Next / Finish Button - Porcelain Texture */}
              <button
                onClick={handleNext}
                className="flex-[2] py-4 rounded-xl bg-white text-slate-800 font-bold shadow-[0_4px_0_0_rgba(203,213,225,0.5)] hover:shadow-[0_2px_0_0_rgba(203,213,225,0.5)] hover:translate-y-[2px] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-2 border border-slate-100"
              >
                {isLastSlide ? (
                  mode === 'onboarding' ? (
                      <>
                        ご縁を結ぶ (はじめる)
                        <Sparkles size={20} className="text-amber-400" />
                      </>
                  ) : (
                      <>
                        閉じる
                        <X size={20} className="text-slate-400" />
                      </>
                  )
                ) : (
                  <>
                    次へ
                    <ChevronRight size={20} />
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
