import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Info, AlertCircle } from 'lucide-react';
import { ToastContext } from './ToastContext';

type ToastType = 'success' | 'info' | 'error';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [nextId, setNextId] = useState(0);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = nextId;
    setNextId(prev => prev + 1);
    
    setToasts(prev => [...prev, { id, message, type }]);

    // 3秒後に自動削除
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  }, [nextId]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg pointer-events-auto ${
                toast.type === 'success'
                  ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200'
                  : toast.type === 'error'
                    ? 'bg-gradient-to-r from-red-50 to-orange-50 border border-red-200'
                    : 'bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              ) : toast.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              ) : (
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
              )}
              <span className={`text-sm font-medium ${
                toast.type === 'success' ? 'text-emerald-900' : toast.type === 'error' ? 'text-red-900' : 'text-blue-900'
              }`}>
                {toast.message}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
