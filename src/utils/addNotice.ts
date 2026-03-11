import { db } from "../lib/firebase";
import { collection, doc, setDoc } from "firebase/firestore";
import { CreateNoticeInput } from "../types/notice";

/**
 * Firestore の `notices` コレクションに通知を追加するユーティリティ。
 * サーバーサイドのトランザクション内でも、クライアント側の後処理でも使える。
 */
export async function addNotice(input: CreateNoticeInput): Promise<void> {
  if (!db) return;

  try {
    const noticesRef = collection(db, "notices");
    const noticeId = `notice_${input.userId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const noticeDoc = doc(noticesRef, noticeId);

    await setDoc(noticeDoc, {
      userId: input.userId,
      fromId: input.fromId,
      message: input.message,
      ...(input.messageKey ? { messageKey: input.messageKey } : {}),
      ...(input.params ? { params: input.params } : {}),
      type: input.type,
      createdAt: Date.now(),
      read: false,
    });
  } catch (e) {
    console.error("[addNotice] Failed to create notice:", e);
  }
}
