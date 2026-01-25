import { useRegisterSW } from 'virtual:pwa-register/react'

export function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: ServiceWorkerRegistration | undefined) {
      console.log('SW Registered: ' + r)
    },
    onRegisterError(error: unknown) {
      console.log('SW registration error', error)
    },
  })

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  return (
    <div className="Container">
      { (offlineReady || needRefresh) && (
        <div className="fixed bottom-20 right-4 p-4 rounded-xl bg-slate-800 text-white shadow-lg z-[100] animate-fade-in text-sm max-w-xs border border-slate-700">
          <div className="mb-2">
            { offlineReady ? (
              <span>App ready to work offline</span>
            ) : (
              <span>New content available, click on reload button to update.</span>
            )}
          </div>
          <div className="flex gap-2">
            { needRefresh && (
              <button className="px-3 py-1 bg-blue-600 rounded text-white font-bold" onClick={() => updateServiceWorker(true)}>
                Reload
              </button>
            )}
            <button className="px-3 py-1 border border-slate-500 rounded" onClick={close}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
