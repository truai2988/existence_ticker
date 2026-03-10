import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { X, Share, PlusSquare } from 'lucide-react';
import { setGlobalTriggerPWAInstall } from '../utils/pwaEvent';
import { useToast } from '../hooks/useToast';

export const PWAInstallBanner: React.FC = () => {
  const { showBanner, isIOS, triggerPrompt, dismissBanner, installPWA } = usePWAInstall();
  const { showToast } = useToast();
  const [hasPromptedIOS, setHasPromptedIOS] = useState(false);

  React.useEffect(() => {
    setGlobalTriggerPWAInstall(triggerPrompt);
  }, [triggerPrompt]);

  React.useEffect(() => {
    const handleInstalled = () => {
      showToast("アプリのインストールが完了しました。ホーム画面から起動してください。", 'success');
      dismissBanner();
    };

    window.addEventListener('pwa-installed', handleInstalled);
    return () => window.removeEventListener('pwa-installed', handleInstalled);
  }, [showToast, dismissBanner]);

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
                {hasPromptedIOS && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-2 p-2 bg-orange-50/50 rounded-lg text-orange-800/80 leading-relaxed"
                  >
                    追加が完了したら、<strong>このタブを閉じて</strong>ホーム画面のアイコンから起動してください。
                  </motion.div>
                )}
              </div>
            )}

            {isIOS && !hasPromptedIOS ? (
              <button
                onClick={() => setHasPromptedIOS(true)}
                className="w-full py-2.5 text-xs font-bold tracking-widest text-slate-500 hover:text-[#2D2D2D] transition-colors"
                >
                追加手順を確認しました
              </button>
            ) : null}

            <button
              onClick={dismissBanner}
              className={`w-full py-2.5 text-xs font-bold tracking-widest transition-colors ${isIOS && hasPromptedIOS ? 'text-[#2D2D2D]/80 hover:text-[#2D2D2D]' : 'text-[#2D2D2D]/50 hover:text-[#2D2D2D]'}`}
            >
              {isIOS && hasPromptedIOS ? '閉じる' : '今はしない'}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
