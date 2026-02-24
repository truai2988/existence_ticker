import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Trash2, BellOff } from "lucide-react";
import { useNoticeContext } from "../hooks/useNoticeContext";
import { Notice } from "../types/notice";

/** 通知の type に応じた色クラス */
const typeColorMap: Record<Notice["type"], string> = {
  application_received: "bg-amber-400",
  wish_cancelled: "bg-red-400",
  helper_resigned: "bg-orange-400",
  user_deleted: "bg-slate-400",
  wish_approved: "bg-green-400",
  wish_fulfilled: "bg-pink-400",
  system: "bg-blue-400",
};

/** 日時フォーマット */
const formatTime = (ms: number) => {
  const d = new Date(ms);
  const now = Date.now();
  const diff = now - ms;
  if (diff < 60_000) return "たった今";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}分前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}時間前`;
  return d.toLocaleDateString("ja-JP", {
    month: "short",
    day: "numeric",
  });
};

export const NoticePanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notices, unreadCount, dismissNotice, dismissAll } = useNoticeContext();
  const panelRef = useRef<HTMLDivElement>(null);

  // 外側クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={panelRef} className="relative z-50">
      {/* ベルアイコン + バッジ */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all active:scale-95"
        aria-label="お知らせ"
      >
        <Bell size={24} strokeWidth={1.5} />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-500 rounded-full ring-2 ring-white shadow-sm"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
      </button>

      {/* パネル */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-80 max-h-[70vh] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col"
          >
            {/* ヘッダー */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-700 tracking-wide">
                お知らせ
              </h3>
              <div className="flex items-center gap-1">
                {notices.length > 0 && (
                  <button
                    onClick={dismissAll}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="すべて畳む"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* リスト */}
            <div className="overflow-y-auto flex-1 custom-scrollbar">
              {notices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                  <BellOff
                    size={28}
                    className="text-slate-300 mb-3"
                    strokeWidth={1.5}
                  />
                  <p className="text-sm text-slate-400 font-medium">
                    お知らせはありません
                  </p>
                  <p className="text-xs text-slate-300 mt-1">
                    新しい動きがあるとここに届きます
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {notices.map((notice) => (
                    <motion.div
                      key={notice.id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, height: 0 }}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50/50 transition-colors group"
                    >
                      {/* ドットインジケーター */}
                      <span
                        className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${typeColorMap[notice.type] || "bg-slate-300"}`}
                      />

                      {/* メッセージ */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 leading-relaxed font-medium">
                          {notice.message}
                        </p>
                        <span className="text-xs text-slate-400 mt-0.5 block">
                          {formatTime(notice.createdAt)}
                        </span>
                      </div>

                      {/* 削除ボタン */}
                      <button
                        onClick={() => dismissNotice(notice.id)}
                        className="p-1 text-slate-300 hover:text-slate-500 hover:bg-slate-100 rounded-md transition-colors opacity-0 group-hover:opacity-100 shrink-0 mt-0.5"
                        title="お知らせを畳む"
                      >
                        <X size={14} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
