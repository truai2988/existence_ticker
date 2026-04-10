import { useRegisterSW } from 'virtual:pwa-register/react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, X } from 'lucide-react'

export function ReloadPrompt() {
  const {
    offlineReady: [, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered() {
      // SW登録完了
    },
    onRegisterError() {
      // SW登録エラーは本番では無視
    },
  })

  // offlineReady は静かに完了させるだけ（ユーザーへの通知不要）
  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  return (
    <AnimatePresence>
      {needRefresh && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed bottom-24 left-4 right-4 z-[9998] max-w-sm mx-auto"
        >
          <div className="bg-white border border-slate-200 shadow-lg rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-bold text-slate-900 tracking-wide">
                  アプリが更新されました
                </span>
                <span className="text-xs text-slate-700 leading-relaxed">
                  最新のバージョンが利用できます。再読み込みして反映しますか？
                </span>
              </div>
              <button
                onClick={close}
                className="shrink-0 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="閉じる"
              >
                <X size={16} />
              </button>
            </div>
            <button
              onClick={() => updateServiceWorker(true)}
              className="w-full py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 active:scale-[0.98] transition-all"
            >
              <RefreshCw size={14} />
              再読み込みして更新
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
