import React, { useState, useEffect, ReactNode } from "react";
import { db } from "../lib/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { useAuth } from "../hooks/useAuthHook";
import { Notice } from "../types/notice";
import { NoticeContext } from "../hooks/useNoticeContext";

export const NoticeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!db || !user?.uid) {
      setNotices([]);
      setIsLoading(false);
      return;
    }

    let unsubscribe: (() => void) | null = null;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    let isMounted = true;

    const setupListener = (delay = 0) => {
      retryTimeout = setTimeout(() => {
        if (!isMounted || !db || !user?.uid) return;

        // サブコレクション: users/{uid}/notices — where不要、orderByも安全に使用可
        const noticesRef = collection(db, "users", user.uid, "notices");
        const q = query(noticesRef, orderBy("createdAt", "desc"));

        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const results: Notice[] = snapshot.docs.map((docSnap) => ({
              id: docSnap.id,
              ...docSnap.data(),
            })) as Notice[];
            setNotices(results);
            setIsLoading(false);
          },
          (error) => {
            if (error.code === "permission-denied") {
              // 認証遷移中の競合状態によるリトライ
              if (isMounted) setupListener(2000);
            } else {
              console.error("[NoticeProvider] Firestore listener error:", error);
              setIsLoading(false);
            }
          }
        );
      }, delay);
    };

    setupListener();

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, [user?.uid]);

  const dismissNotice = async (noticeId: string) => {
    if (!db || !user?.uid) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "notices", noticeId));
    } catch (e) {
      console.error("[NoticeProvider] Failed to dismiss notice:", e);
    }
  };

  const dismissAll = async () => {
    if (!db || !user?.uid) return;
    const promises = notices.map((n) =>
      deleteDoc(doc(db!, "users", user!.uid, "notices", n.id))
    );
    try {
      await Promise.all(promises);
    } catch (e) {
      console.error("[NoticeProvider] Failed to dismiss all notices:", e);
    }
  };

  return (
    <NoticeContext.Provider
      value={{
        notices,
        unreadCount: notices.length,
        isLoading,
        dismissNotice,
        dismissAll,
      }}
    >
      {children}
    </NoticeContext.Provider>
  );
};
