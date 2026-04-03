import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Droplets, Wind, Sparkles, Scale, HeartHandshake, Footprints } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { MESSAGES } from '../constants/messages';

interface OnboardingStoryProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void; // Callback for blessing trigger
  mode?: 'onboarding' | 'reference';
  initialSlide?: number; // For opening directly to "Standards" etc.
}

// Define slides function to accept mode
const getSlides = (t: typeof MESSAGES) => [
  {
    id: 'vessel',
    title: t.ONBOARDING.SLIDE1_TITLE,
    subtitle: '',
    icon: <Droplets size={28} className="text-amber-500" />,
    content: (
      <div className="text-center font-serif text-slate-700 leading-relaxed px-2">
        <p className="text-sm sm:text-base text-slate-700 leading-7 sm:leading-8 tracking-wide mb-4">
          {t.ONBOARDING.SLIDE1_P1}{t.ONBOARDING.SLIDE1_P2}
        </p>
        <p className="mb-4">
          <span className="text-lg sm:text-xl font-bold text-amber-600 mr-2">2,400 Lm</span>
          <span className="text-sm sm:text-base text-slate-700 leading-7 sm:leading-8 tracking-wide">{t.ONBOARDING.SLIDE1_P3}</span>
        </p>
        <p className="text-sm sm:text-base text-slate-700 leading-7 sm:leading-8 tracking-wide mb-5">
          {t.ONBOARDING.SLIDE1_P4}
        </p>
        <p className="text-xs sm:text-sm text-slate-500 font-medium tracking-wide">
          {t.ONBOARDING.SLIDE1_P5}
        </p>
      </div>
    )
  },
  {
    id: 'decay',
    title: t.ONBOARDING.SLIDE2_TITLE,
    subtitle: '',
    icon: <Wind size={28} className="text-blue-400" />,
    content: (
      <div className="text-center font-serif text-slate-700 leading-relaxed px-2">
        <p className="text-sm sm:text-base text-slate-700 leading-7 sm:leading-8 tracking-wide mb-4">
          {t.ONBOARDING.SLIDE2_P1}{t.ONBOARDING.SLIDE2_P2}
        </p>
        <p className="text-lg sm:text-xl font-bold text-blue-500/80 tracking-widest my-5">
          {t.ONBOARDING.SLIDE2_P3}
        </p>
        <p className="text-sm sm:text-base text-slate-700 leading-7 sm:leading-8 tracking-wide mb-5">
          {t.ONBOARDING.SLIDE2_P4}
        </p>
        <p className="text-xs sm:text-sm text-slate-500 font-medium tracking-wide">
          {t.ONBOARDING.SLIDE2_P5}{t.ONBOARDING.SLIDE2_P6}
        </p>
      </div>
    )
  },
  {
    id: 'connect',
    title: t.ONBOARDING.SLIDE3_TITLE,
    subtitle: '',
    icon: <Sparkles size={28} className="text-rose-400" />,
    content: (
      <div className="text-center font-serif text-slate-700 leading-relaxed px-2">
        <p className="text-sm sm:text-base text-slate-700 leading-7 sm:leading-8 tracking-wide mb-6">
          {t.ONBOARDING.SLIDE3_P1}{t.ONBOARDING.SLIDE3_P2}
        </p>
        <p className="text-xs sm:text-sm text-slate-500 font-medium tracking-wide">
          {t.ONBOARDING.SLIDE3_P3}{t.ONBOARDING.SLIDE3_P4}
        </p>
      </div>
    )
  },
  {
    id: 'standard',
    title: t.ONBOARDING.SLIDE4_TITLE,
    subtitle: '',
    icon: <Scale size={28} className="text-emerald-500" />,
    content: (
      <div className="space-y-2.5 w-full max-w-sm mx-auto">
        <div className="bg-white/50 backdrop-blur-3xl p-3 sm:p-4 rounded-2xl border border-transparent shadow-sm flex items-center gap-3">
          <span className="font-mono font-bold text-base sm:text-lg text-[#B8860B] w-12 sm:w-14 text-right shrink-0">1,000</span>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-slate-800 mb-0.5">{t.ONBOARDING.SLIDE4_TIER1_TITLE}</h3>
            <p className="text-xs text-slate-500 leading-snug text-left">
              {t.ONBOARDING.SLIDE4_TIER1_DESC}
            </p>
          </div>
        </div>
        <div className="bg-white/50 backdrop-blur-3xl p-3 sm:p-4 rounded-2xl border border-transparent shadow-sm flex items-center gap-3">
          <span className="font-mono font-bold text-base sm:text-lg text-amber-600 w-12 sm:w-14 text-right shrink-0">500</span>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-slate-800 mb-0.5">{t.ONBOARDING.SLIDE4_TIER2_TITLE}</h3>
            <p className="text-xs text-slate-500 leading-snug text-left">
              {t.ONBOARDING.SLIDE4_TIER2_DESC}
            </p>
          </div>
        </div>
        <div className="bg-white/50 backdrop-blur-3xl p-3 sm:p-4 rounded-2xl border border-transparent shadow-sm flex items-center gap-3">
          <span className="font-mono font-bold text-base sm:text-lg text-pink-400 w-12 sm:w-14 text-right shrink-0">0</span>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-slate-800 mb-0.5">{t.ONBOARDING.SLIDE4_TIER3_TITLE}</h3>
            <p className="text-xs text-slate-500 leading-snug text-left">
              {t.ONBOARDING.SLIDE4_TIER3_DESC}
            </p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'start',
    title: t.ONBOARDING.SLIDE5_TITLE,
    subtitle: '',
    icon: <Footprints size={28} className="text-slate-600" />,
    content: (
      <div className="text-center font-serif text-slate-700 leading-relaxed px-1 flex flex-col items-center">
        <div className="py-1 mb-4 relative w-full">
          <p className="text-sm sm:text-base text-slate-700 leading-7 sm:leading-8 tracking-wide mb-2 w-full max-w-sm mx-auto">
            <span className="text-slate-500 mr-1">{t.ONBOARDING.SLIDE5_P1_1}</span>{t.ONBOARDING.SLIDE5_P1_2}
          </p>
          <p className="text-sm sm:text-base text-slate-700 leading-7 sm:leading-8 tracking-wide w-full max-w-sm mx-auto">
            <span className="text-slate-500 mr-1">{t.ONBOARDING.SLIDE5_P2_1}</span>{t.ONBOARDING.SLIDE5_P2_2}
          </p>
        </div>
        <div className="text-xs sm:text-sm text-slate-500 font-medium tracking-wide w-full px-1">
          <p className="text-lg sm:text-xl font-bold text-amber-800/90 leading-8 sm:leading-9 tracking-widest mt-2 mb-6 sm:mb-8 mx-auto max-w-[280px] sm:max-w-sm break-keep">
            {t.ONBOARDING.SLIDE5_P3_1}{t.ONBOARDING.SLIDE5_P3_2}
          </p>
          <p className="text-slate-700 font-bold">
            {t.ONBOARDING.SLIDE5_P4_1}{t.ONBOARDING.SLIDE5_P4_2}
          </p>
        </div>
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
  const { t: MESSAGES } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(initialSlide);
  
  const slides = getSlides(MESSAGES);

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
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
          className="relative w-full max-w-lg bg-[#F9F8F4] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col h-[600px] max-h-[calc(100dvh-2rem)]"
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
            className="absolute top-6 right-6 z-50 p-3 rounded-full bg-white/40 backdrop-blur-md border border-transparent text-slate-500 hover:text-slate-600 hover:bg-white/60 shadow-sm hover:shadow-md transition-all"
            aria-label={MESSAGES.SYSTEM.BTN_CLOSE}
          >
            <HeartHandshake size={20} />
          </button>

          {/* Slide Content Area */}
          <div className="flex-1 flex flex-col relative z-10 p-4 sm:p-6 md:p-8 overflow-y-auto no-scrollbar">
            
            {/* Slide Indicators */}
            <div className="flex justify-center gap-2 mb-4">
              {slides.map((_, idx) => (
                <div 
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentSlide ? 'w-8 bg-slate-400' : 'w-2 bg-slate-200/80'}`}
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
                className="flex-1 min-h-full flex flex-col items-center justify-center py-4"
              >
                {/* Icon Circle */}
                <div className="w-12 h-12 bg-white rounded-full shadow-md flex items-center justify-center mb-2 ring-4 ring-white/50">
                  {slides[currentSlide].icon}
                </div>

                {/* Typography */}
                <h2 className="text-xl sm:text-2xl font-serif font-medium text-slate-800 tracking-widest mb-0.5 text-center">
                  {slides[currentSlide].title}
                </h2>
                <div className="text-xs font-bold tracking-[0.3em] text-slate-500 uppercase mb-3 text-center">
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
          <div className="px-5 pb-5 pt-2 sm:px-8 sm:pb-8 relative z-20 shrink-0">
            <div className="flex gap-4">
              
              {/* Back Button (Hidden on first slide) */}
              <button
                onClick={handleBack}
                disabled={currentSlide === 0}
                className={`flex-1 py-3 rounded-xl font-bold text-slate-500 transition-all flex items-center justify-center gap-2 outline-none select-none
                  ${currentSlide === 0 ? 'opacity-0 pointer-events-none' : 'hover:bg-slate-100 active:scale-[0.98]'}`}
              >
                <ChevronLeft size={18} />
                {MESSAGES.ONBOARDING.BTN_BACK}
              </button>

              {/* Next / Finish Button */}
              <button
                onClick={handleNext}
                className="flex-[2] py-3.5 rounded-2xl bg-white/80 backdrop-blur-md text-slate-700 font-bold shadow-sm hover:shadow-md border border-transparent hover:bg-white active:scale-[0.98] transition-all flex items-center justify-center gap-2 outline-none select-none"
              >
                {isLastSlide ? (
                  <>
                    {MESSAGES.ONBOARDING.BTN_CLOSE}
                    <HeartHandshake size={20} className="text-slate-500" />
                  </>
                ) : (
                  <>
                    {MESSAGES.ONBOARDING.BTN_NEXT}
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
