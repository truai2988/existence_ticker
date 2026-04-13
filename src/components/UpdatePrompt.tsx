import React from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, X } from "lucide-react";

/**
 * PWA更新バナー
 * Service Workerが新しいバージョンを検知したとき、
 * 画面下部にバナーを表示してユーザーに更新を促す。
 */
export const UpdatePrompt: React.FC = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      // 60分ごとに新しいSWをポーリング（デプロイ後に確実に検知）
      if (r) {
        setInterval(async () => {
          if (!(!r.installing && navigator)) return;
          if ("connection" in navigator && !navigator.onLine) return;
          const resp = await fetch(swUrl, {
            cache: "no-store",
            headers: { cache: "no-store", "cache-control": "no-cache" },
          });
          if (resp?.status === 200) await r.update();
        }, 60 * 60 * 1000);
      }
    },
  });

  const handleUpdate = () => {
    updateServiceWorker(true);
  };

  const handleDismiss = () => {
    setNeedRefresh(false);
  };

  return (
    <AnimatePresence>
      {needRefresh && (
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 80 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="fixed bottom-6 left-4 right-4 z-[9999] flex justify-center pointer-events-none"
        >
          <div className="w-full max-w-sm bg-slate-900 text-white rounded-2xl shadow-2xl px-5 py-4 flex items-center gap-4 pointer-events-auto">
            {/* アイコン */}
            <div className="shrink-0 w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <RefreshCw size={16} className="text-amber-400" />
            </div>

            {/* テキスト */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white leading-tight">新しいバージョンが利用可能</p>
              <p className="text-xs text-slate-400 mt-0.5">タップして最新版に更新する</p>
            </div>

            {/* 更新ボタン */}
            <button
              onClick={handleUpdate}
              className="shrink-0 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold transition-colors active:scale-95"
            >
              更新
            </button>

            {/* 閉じるボタン */}
            <button
              onClick={handleDismiss}
              className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="閉じる"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
