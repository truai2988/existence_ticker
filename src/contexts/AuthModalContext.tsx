import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from "react";
import { useAuth } from "../hooks/useAuthHook";

interface AuthModalContextValue {
  /** Auth Modal が開いているか */
  isOpen: boolean;
  /** 認証済みなら callback を即実行、未認証なら Modal を開いてログイン後に自動実行 */
  requireAuth: (callback: () => void) => void;
  /** Modal を直接開く（callback なし） */
  showAuthModal: () => void;
  /** Modal を閉じる */
  closeAuthModal: () => void;
  /** ログイン成功時に呼び出す（pending callback を実行） */
  onAuthSuccess: () => void;
}

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export const AuthModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const pendingCallbackRef = useRef<(() => void) | null>(null);

  const requireAuth = useCallback((callback: () => void) => {
    if (user) {
      // ログイン済み → 即実行
      callback();
    } else {
      // 未ログイン → callback を保持して Modal を開く
      pendingCallbackRef.current = callback;
      setIsOpen(true);
    }
  }, [user]);

  const showAuthModal = useCallback(() => {
    pendingCallbackRef.current = null;
    setIsOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    pendingCallbackRef.current = null;
    setIsOpen(false);
  }, []);

  const onAuthSuccess = useCallback(() => {
    setIsOpen(false);
    // ログイン成功後、pending callback があれば実行
    if (pendingCallbackRef.current) {
      const cb = pendingCallbackRef.current;
      pendingCallbackRef.current = null;
      // 少し待ってから実行（状態更新の反映を待つ）
      setTimeout(cb, 100);
    }
  }, []);

  return (
    <AuthModalContext.Provider value={{ isOpen, requireAuth, showAuthModal, closeAuthModal, onAuthSuccess }}>
      {children}
    </AuthModalContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuthModal = (): AuthModalContextValue => {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error("useAuthModal must be used within an AuthModalProvider");
  }
  return context;
};
