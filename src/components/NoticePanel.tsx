import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, BellOff } from "lucide-react";
import { useNoticeContext } from "../hooks/useNoticeContext";
import { Notice } from "../types/notice";
import { MESSAGES } from "../constants/messages";

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
  if (diff < 60_000) return MESSAGES.NOTICE.TIME_JUST_NOW;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}${MESSAGES.NOTICE.TIME_MINUTES_AGO}`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}${MESSAGES.NOTICE.TIME_HOURS_AGO}`;
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
    <div ref={panelRef} className="relative z-50 flex items-center">
      {/* ベルアイコン + バッジ */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-3 rounded-full transition-all active:scale-95 ${
          unreadCount > 0 
            ? "text-amber-500 bg-amber-50/50" 
            : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
        }`}
        aria-label={MESSAGES.NOTICE.TITLE}
      >
        <Bell size={24} strokeWidth={1.5} className={unreadCount > 0 ? "animate-pulse" : ""} />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-2 right-2 w-2.5 h-2.5 bg-amber-400 rounded-full ring-2 ring-white shadow-[0_0_8px_rgba(251,191,36,0.5)]"
          />
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
            className="fixed left-4 right-4 top-[70px] sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 max-h-[70vh] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col z-50"
          >
            {/* ヘッダー */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-50 bg-white">
              <h3 className="text-base font-serif font-medium text-slate-800 tracking-widest">
                {MESSAGES.NOTICE.TITLE}
              </h3>
              <div className="flex items-center gap-3">
                {notices.length > 0 && (
                  <button
                    onClick={dismissAll}
                    className="text-xs text-slate-400 hover:text-amber-600 transition-colors tracking-tighter"
                  >
                    {MESSAGES.NOTICE.TOOLTIP_DISMISS_ALL}
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-slate-300 hover:text-slate-500 transition-colors"
                >
                  <X size={18} strokeWidth={1.5} />
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
                    {MESSAGES.NOTICE.EMPTY_TITLE}
                  </p>
                  <p className="text-xs text-slate-300 mt-1">
                    {MESSAGES.NOTICE.EMPTY_DESC}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {notices.map((notice) => (
                    <motion.div
                      key={notice.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex items-start gap-4 px-6 py-5 hover:bg-slate-50/30 transition-colors group relative"
                    >
                      {/* ドットインジケーター (より淡く) */}
                      <span
                        className={`mt-2 w-1.5 h-1.5 rounded-full shrink-0 opacity-60 ${typeColorMap[notice.type] || "bg-slate-300"}`}
                      />

                      {/* メッセージ */}
                        <p className="text-[13px] text-slate-600 leading-relaxed font-light tracking-wide">
                          {notice.message}
                        </p>
                        <span className="text-[10px] text-slate-300 mt-1.5 block font-sans tracking-tight">
                          {formatTime(notice.createdAt)}
                        </span>

                      {/* 削除ボタン */}
                      <button
                        onClick={() => dismissNotice(notice.id)}
                        className="p-2.5 text-slate-300 hover:text-slate-500 hover:bg-slate-100 rounded-md transition-colors opacity-0 group-hover:opacity-100 shrink-0 mt-0.5"
                        title={MESSAGES.NOTICE.TOOLTIP_DISMISS}
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
