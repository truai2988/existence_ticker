import React, { useState } from "react";
import {
  Trash2,
  Users,
  Activity,
} from "lucide-react";
import { db } from "../../lib/firebase";

export const AdminIntegrityPanel: React.FC = () => {
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [cleanupLog, setCleanupLog] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setCleanupLog((prev) => [...prev, msg].slice(-50)); // 最新50件を保持
  };

  const clearLog = () => setCleanupLog([]);

  // --- 1. Orphan Cleanup (データの整合性掃拭) ---
  const handleOrphanCleanup = async () => {
    if (
      !window.confirm(
        "⚠️ [データ整合性チェック]\n願いの所有権を確認し、リクエスター（ユーザー）が存在しない孤立した願いを削除します。\n\n実行しますか？"
      )
    )
      return;

    setIsCleaningUp(true);
    clearLog();
    addLog("[開始] 孤立データのスキャンを開始します...");

    try {
      if (!db) throw new Error("データベース接続に失敗しました");
      const {
        collection,
        getDocs,
        query,
        limit,
        writeBatch,
      } = await import("firebase/firestore");

      const wishesRef = collection(db, "wishes");
      // 安全のため、一度に500件までスキャン
      const wishSnapshot = await getDocs(query(wishesRef, limit(500)));
      const usersRef = collection(db, "users");
      const { documentId, where } = await import("firebase/firestore");

      let deletedCount = 0;
      const batch = writeBatch(db);

      addLog(`[分析] ${wishSnapshot.size}件の願いを検証中...`);

      // 1. Collect unique requester IDs
      const allRequesterIds = Array.from(new Set(
        wishSnapshot.docs
          .map(d => d.data().requester_id)
          .filter(id => !!id)
      ));

      // 2. Batch check user existence (30 IDs per query)
      const existingUserIds = new Set<string>();
      for (let i = 0; i < allRequesterIds.length; i += 30) {
        const idBatch = allRequesterIds.slice(i, i + 30);
        const q = query(usersRef, where(documentId(), 'in', idBatch));
        const snap = await getDocs(q);
        snap.docs.forEach(d => existingUserIds.add(d.id));
      }

      // 3. Process deletions
      for (const wishDoc of wishSnapshot.docs) {
        const wish = wishDoc.data();
        const requesterId = wish.requester_id;
        if (requesterId && !existingUserIds.has(requesterId)) {
          batch.delete(wishDoc.ref);
          deletedCount++;
          addLog(
            `[削除] 孤立データ発見: ${wish.content?.slice(
              0,
              15
            )}... (ユーザー ${requesterId} が存在しません)`
          );
        }
      }

      if (deletedCount > 0) {
        await batch.commit();
        addLog(`[完了] ${deletedCount}件の孤立データを整理しました。`);
      } else {
        addLog("[完了] 孤立データは検出されませんでした。");
      }
    } catch (e) {
      console.error(e);
      addLog(`[エラー] ${String(e)}`);
    } finally {
      setIsCleaningUp(false);
    }
  };

  // --- 2. World Recount (統計データの再構築) ---
  const handleWorldRecount = async () => {
    if (
      !window.confirm(
        "⚠️ [重負荷操作] 統計データの再構築\n全ユーザーをスキャンして地域別統計を再生成します。\n数秒かかる場合があります。\n\n実行しますか？"
      )
    )
      return;

    setIsCleaningUp(true);
    clearLog();
    addLog("[開始] 住民名簿の取得を開始します...");

    try {
      if (!db) throw new Error("データベース接続に失敗しました");
      const { collection, getDocs, query, writeBatch, doc } = await import(
        "firebase/firestore"
      );

      const userSnap = await getDocs(query(collection(db, "users")));
      addLog(`[取得] ${userSnap.size}件のユーザーレコードを読み込みました。`);

      const countsMap: Record<string, number> = {};
      userSnap.docs.forEach((uDoc) => {
        const data = uDoc.data();
        if (data.location?.prefecture && data.location?.city) {
          const key = `${data.location.prefecture}_${data.location.city}`;
          countsMap[key] = (countsMap[key] || 0) + 1;
        }
      });

      addLog("[計算] 統計データを集計中...");

      const statsRef = collection(db, "location_stats");
      const statsSnap = await getDocs(query(statsRef));
      const batch = writeBatch(db);

      // 旧統計を削除
      statsSnap.docs.forEach((sDoc) => batch.delete(sDoc.ref));

      // 新統計を書き込み
      Object.entries(countsMap).forEach(([key, count]) => {
        batch.set(doc(db!, "location_stats", key), { count });
      });

      await batch.commit();
      addLog(
        `[完了] ${Object.keys(countsMap).length}地域の統計を更新しました。`
      );
    } catch (e) {
      console.error(e);
      addLog(`[エラー] ${String(e)}`);
    } finally {
      setIsCleaningUp(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20">
      <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <Activity className="text-slate-400 mt-1" size={20} />
          <div>
            <h3 className="text-slate-200 font-bold text-sm uppercase tracking-wider">
              システム整合性ツール
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              データの不整合を検知・修正し、システムの健全性を維持するための管理機能です。
              <br />
              <span className="text-yellow-500/80">
                注意: これらの操作は本番データベースに直接影響を与えます。通常は使用不要です。
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ToolCard
          title="データの整合性掃拭"
          color="red"
          icon={<Trash2 size={18} />}
          description="外部干渉などによって残された、参照先のない孤立した願いをクリーンアップします。"
          actionLabel="掃拭を開始"
          onAction={handleOrphanCleanup}
          isProcessing={isCleaningUp}
        />

        <ToolCard
          title="統計データの再構築"
          color="blue"
          icon={<Users size={18} />}
          description="全住民の所在地情報を走査し、地域別の人口統計を最新の状態に再同期します。"
          actionLabel="再構築を実行"
          onAction={handleWorldRecount}
          isProcessing={isCleaningUp}
        />
      </div>

      {/* Log Console */}
      {cleanupLog.length > 0 && (
        <div className="mt-6 bg-black/80 rounded-lg border border-slate-800 overflow-hidden font-mono text-xs">
          <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-800 flex justify-between items-center">
            <span className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-2">
              <Activity size={14} /> 実行ログ
            </span>
            <button
              onClick={clearLog}
              className="text-slate-600 hover:text-slate-300 transition-colors"
            >
              クリア
            </button>
          </div>
          <div className="p-4 max-h-60 overflow-y-auto space-y-1 text-slate-300 custom-scrollbar">
            {cleanupLog.map((line, i) => (
              <div key={i} className="border-l-2 border-slate-700 pl-2 py-0.5 break-all">
                {line}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface ToolCardProps {
  title: string;
  icon: React.ReactNode;
  description: string;
  actionLabel: string;
  onAction: () => void;
  isProcessing: boolean;
  color: "red" | "blue";
}

const ToolCard: React.FC<ToolCardProps> = ({
  title,
  icon,
  description,
  actionLabel,
  onAction,
  isProcessing,
  color,
}) => {
  const colorMap = {
    red: "bg-red-500/10 border-red-500/20 text-red-400 hover:border-red-500/50",
    blue: "bg-blue-500/10 border-blue-500/20 text-blue-400 hover:border-blue-500/50",
  };
  
  const btnColorMap = {
    red: "bg-red-900/30 hover:bg-red-900/50 text-red-200",
    blue: "bg-blue-900/30 hover:bg-blue-900/50 text-blue-200",
  };

  return (
    <div className={`p-5 rounded-xl border transition-all ${colorMap[color]}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-black/20 rounded-lg">{icon}</div>
        <h4 className="font-bold text-sm tracking-wide">{title}</h4>
      </div>
      <p className="text-xs opacity-70 mb-5 min-h-[3em] leading-relaxed">
        {description}
      </p>
      <button
        onClick={onAction}
        disabled={isProcessing}
        className={`w-full py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${btnColorMap[color]} disabled:opacity-50`}
      >
        {isProcessing ? "実行中..." : actionLabel}
      </button>
    </div>
  );
};
