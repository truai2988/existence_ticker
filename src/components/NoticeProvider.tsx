import React, { useState, useEffect, ReactNode } from "react";
import { db } from "../lib/firebase";
import {
  collection,
  query,
  where,
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

        const noticesRef = collection(db, "notices");
        const q = query(
          noticesRef,
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );

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
            if (error.code === 'permission-denied') {
              // Silent retry if it's a known race condition during auth transition
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
    if (!db) return;
    try {
      await deleteDoc(doc(db, "notices", noticeId));
    } catch (e) {
      console.error("[NoticeProvider] Failed to dismiss notice:", e);
    }
  };

  const dismissAll = async () => {
    if (!db) return;
    const promises = notices.map((n) => deleteDoc(doc(db!, "notices", n.id)));
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
