import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

// セッション内キャッシュ
const nameCache: Record<string, string> = {};

interface NameResolverProps {
  userId: string | null;
  initialName?: string | null;
  className?: string;
}

/**
 * 名前が欠落している場合、Firestoreから自動的に取得して表示する自己修復型コンポーネント
 */
export const NameResolver: React.FC<NameResolverProps> = ({ userId, initialName, className }) => {
  const [resolvedName, setResolvedName] = useState<string | null>(initialName || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // すでに有効な名前がある場合は何もしない
    if (initialName && initialName.trim() !== "" && !initialName.includes("【バグ】")) {
        setResolvedName(initialName);
        return;
    }

    if (!userId) return;

    // キャッシュ確認
    if (nameCache[userId]) {
      setResolvedName(nameCache[userId]);
      return;
    }

    // 名前を解決（自己修復）
    const resolveName = async () => {
      setLoading(true);
      try {
        const userDoc = await getDoc(doc(db!, 'users', userId));
        if (userDoc.exists()) {
          const name = userDoc.data().name;
          if (name) {
            nameCache[userId] = name;
            setResolvedName(name);
          } else {
            setResolvedName("（名前未設定）");
          }
        } else {
          setResolvedName("（退会した奏者）");
        }
      } catch (error) {
        console.error("Name recovery failed:", error);
        setResolvedName("（取得失敗）");
      } finally {
        setLoading(false);
      }
    };

    resolveName();
  }, [userId, initialName]);

  if (loading) {
    return <span className={`${className} animate-pulse opacity-80`}>取得中...</span>;
  }

  return <span className={className}>{resolvedName || "（読込中）"}</span>;
};
