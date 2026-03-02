import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { X, Share, PlusSquare } from 'lucide-react';
import { setGlobalTriggerPWAInstall } from '../utils/pwaEvent';

export const PWAInstallBanner: React.FC = () => {
  const { showBanner, isIOS, triggerPrompt, dismissBanner, installPWA } = usePWAInstall();

  React.useEffect(() => {
    setGlobalTriggerPWAInstall(triggerPrompt);
  }, [triggerPrompt]);

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="fixed bottom-4 left-4 right-4 z-[9999] flex flex-col p-5 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-[#2D2D2D]/10 bg-[#F9F8F4] text-[#2D2D2D] max-w-lg md:mx-auto"
        >
          <div className="flex justify-between items-start mb-3 gap-4">
            <p className="font-serif leading-relaxed text-sm">
              ホーム画面やデスクトップに、このアプリを置きませんか？ ブラウザの枠やボタンが消えて画面が広くなり、本物のアプリと同じように、いつでも静かに使い始めることができます。
            </p>
            <button
              onClick={dismissBanner}
              className="flex-shrink-0 p-1.5 rounded-full hover:bg-black/5 transition-colors text-[#2D2D2D]/40 hover:text-[#2D2D2D]"
              aria-label="今はしない"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex flex-col gap-3 mt-2">
            {!isIOS && (
              <button
                onClick={installPWA}
                className="w-full py-3 rounded-xl bg-[#2D2D2D] text-[#F9F8F4] font-bold text-sm tracking-widest shadow-md hover:bg-black active:scale-[0.98] transition-all"
              >
                アプリとして追加
              </button>
            )}

            {isIOS && (
              <div className="bg-white/60 rounded-xl p-3.5 border border-black/5 flex flex-col gap-3 text-xs tracking-wide">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded flex items-center justify-center bg-black/5 text-[#2D2D2D]">
                    <Share size={16} />
                  </div>
                  <span>画面下部の「共有ボタン」をタップ</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded flex items-center justify-center bg-black/5 text-[#2D2D2D]">
                    <PlusSquare size={16} />
                  </div>
                  <span>「ホーム画面に追加」を選択</span>
                </div>
              </div>
            )}

            <button
              onClick={dismissBanner}
              className="w-full py-2.5 text-xs font-bold tracking-widest text-[#2D2D2D]/50 hover:text-[#2D2D2D] transition-colors"
            >
              今はしない
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
