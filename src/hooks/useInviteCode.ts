import { useState, useEffect, useCallback } from 'react';
import { db } from '../lib/firebase';

export interface MyInviteCode {
  id: string;         // コード文字列そのもの（ドキュメントID）
  is_used: boolean;
  created_at?: number;
  used_by?: string;
  used_at?: number;
}

const MAX_PENDING = 3;
const APP_URL = 'https://www.existenceticker.com';

export function useInviteCode(uid: string | null) {
  const [myCodes, setMyCodes] = useState<MyInviteCode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 自分が発行したコードをリアルタイム購読
  useEffect(() => {
    if (!uid || !db) return;

    let unsubscribe: (() => void) | undefined;

    (async () => {
      setIsLoading(true);
      try {
        const { collection, query, where, onSnapshot } = await import('firebase/firestore');
        const q = query(
          collection(db!, 'invitation_codes'),
          where('issuer_uid', '==', uid)
        );

        unsubscribe = onSnapshot(q, (snap) => {
          const codes = snap.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              is_used: data.is_used ?? false,
              created_at: data.created_at?.toMillis?.() ?? null,
              used_by: data.used_by ?? null,
              used_at: data.used_at?.toMillis?.() ?? null,
            } as MyInviteCode;
          });
          // 新しい順にソート
          codes.sort((a, b) => (b.created_at ?? 0) - (a.created_at ?? 0));
          setMyCodes(codes);
          setIsLoading(false);
        });
      } catch (e) {
        console.error('useInviteCode: fetch error', e);
        setIsLoading(false);
      }
    })();

    return () => {
      unsubscribe?.();
    };
  }, [uid]);

  // 未使用コードの数
  const pendingCount = myCodes.filter((c) => !c.is_used).length;

  // コードを発行する
  const generateCode = useCallback(async (): Promise<string | null> => {
    if (!uid || !db) return null;
    if (pendingCount >= MAX_PENDING) return null;

    setIsGenerating(true);
    setError(null);
    try {
      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');

      // USR-XXXX-XXXX 形式
      const part1 = Math.random().toString(36).substring(2, 6).toUpperCase();
      const part2 = Math.random().toString(36).substring(2, 6).toUpperCase();
      const code = `USR-${part1}-${part2}`;
      const codeRef = doc(db!, 'invitation_codes', code);

      await setDoc(codeRef, {
        is_used: false,
        created_at: serverTimestamp(),
        created_by: uid,       // 後方互換
        issuer_uid: uid,       // ユーザー発行フラグ
      });

      return code;
    } catch (e) {
      console.error('useInviteCode: generate error', e);
      setError('generate_failed');
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [uid, pendingCount]);

  // コードをシェアする（Web Share API → クリップボードフォールバック）
  const shareCode = useCallback(async (
    code: string,
    shareTitle: string,
    shareTextTemplate: string  // %s が2箇所：コード、URL
  ): Promise<'shared' | 'copied' | 'failed'> => {
    const inviteUrl = `${APP_URL}/?code=${code}`;
    const text = shareTextTemplate
      .replace('%s', code)
      .replace('%s', inviteUrl);

    // Web Share API（LINE等ネイティブシェア）
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text });
        return 'shared';
      } catch {
        // キャンセルされた場合もここに来るが失敗ではない
        return 'shared';
      }
    }

    // クリップボードフォールバック
    try {
      await navigator.clipboard.writeText(`${text}\n${inviteUrl}`);
      return 'copied';
    } catch {
      return 'failed';
    }
  }, []);

  // 未使用コードを削除する
  const deleteCode = useCallback(async (code: string): Promise<boolean> => {
    if (!uid || !db) return false;
    try {
      const { doc, deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db!, 'invitation_codes', code));
      return true;
    } catch (e) {
      console.error('useInviteCode: delete error', e);
      return false;
    }
  }, [uid]);

  return {
    myCodes,
    pendingCount,
    canGenerate: pendingCount < MAX_PENDING,
    isLoading,
    isGenerating,
    error,
    generateCode,
    shareCode,
    deleteCode,
    MAX_PENDING,
  };
}
