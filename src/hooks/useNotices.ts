import { useState, useEffect } from "react";
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
import { useAuth } from "./useAuthHook";
import { Notice } from "../types/notice";

/**
 * 現在のユーザー宛ての通知をリアルタイムで購読し、
 * 個別削除の機能を提供するカスタムフック。
 */
export function useNotices() {
  const { user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!db || !user) {
      setNotices([]);
      setIsLoading(false);
      return;
    }

    const noticesRef = collection(db, "notices");
    const q = query(
      noticesRef,
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(
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
        console.error("[useNotices] Firestore listener error:", error);
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user]);

  /** 通知を1件削除（Firestoreから完全削除） */
  const dismissNotice = async (noticeId: string) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, "notices", noticeId));
    } catch (e) {
      console.error("[useNotices] Failed to dismiss notice:", e);
    }
  };

  /** すべての通知を削除 */
  const dismissAll = async () => {
    if (!db) return;
    const promises = notices.map((n) => deleteDoc(doc(db!, "notices", n.id)));
    try {
      await Promise.all(promises);
    } catch (e) {
      console.error("[useNotices] Failed to dismiss all notices:", e);
    }
  };

  return {
    notices,
    unreadCount: notices.length,
    isLoading,
    dismissNotice,
    dismissAll,
  };
}
