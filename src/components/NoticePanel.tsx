import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, BellOff, Loader2, ChevronRight } from "lucide-react";
import { useNoticeContext } from "../hooks/useNoticeContext";
import { Notice } from "../types/notice";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../hooks/useAuthHook";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Wish } from "../types";
import { WishCard } from "./WishCard";
import { getMillis } from "../logic/worldPhysics";

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

/** Resolve a notice message strictly using its messageKey + params. */
const resolveMessage = (
  notice: Notice,
  wishActions: Record<string, string>,
): string => {
  if (!notice.messageKey) return notice.message || "";
  
  const template = wishActions[notice.messageKey];
  if (!template) return notice.message || "";

  let msg = template;
  if (notice.params) {
    for (const [k, v] of Object.entries(notice.params)) {
      msg = msg.replace(`%${k}`, v);
    }
  }
  
  // 過去の通知で params が記録されていなかった場合のフォールバック
  msg = msg.replace(/%name/g, "匿名");
  
  return msg;
};

/** 日時フォーマット */
const formatTime = (
  ms: number,
  justNow: string,
  minutesAgo: string,
  hoursAgo: string,
) => {
  const d = new Date(ms);
  const now = Date.now();
  const diff = now - ms;
  if (diff < 60_000) return justNow;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}${minutesAgo}`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}${hoursAgo}`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

/** 動的メッセージ解決: Wish の現在のステータスを優先し、該当しない場合は通常の Notice メッセージを表示 */
const resolveDynamicMessage = (
  notice: Notice,
  wish: Wish,
  currentUserId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any
): string => {
  const isRequester = wish.requester_id === currentUserId;
  const guide = t.NOTICE.STATUS_GUIDE;

  if (guide) {
    if (wish.status === "open") {
      if (notice.type === "system") return resolveMessage(notice, t.WISH_ACTIONS as unknown as Record<string, string>);
      return isRequester ? guide.OPEN_REQ : guide.OPEN_HELP;
    }
    if (wish.status === "in_progress") {
      return isRequester ? guide.IN_PROGRESS_REQ : guide.IN_PROGRESS_HELP;
    }

    if (wish.status === "fulfilled" || wish.status === "completed") {
      return isRequester ? guide.FULFILLED_REQ : guide.FULFILLED_HELP;
    }
    if (wish.status === "cancelled" || wish.status === "interrupted" || wish.status === "expired") {
      return guide.CANCELLED;
    }
  }

  // Fallback
  return resolveMessage(notice, t.WISH_ACTIONS as unknown as Record<string, string>);
};

/** 単一の願いをフェッチして表示するモーダル */
const NoticeWishModal: React.FC<{
  notice: Notice;
  onClose: () => void;
}> = ({ notice, onClose }) => {
  const wishId = notice.wishId!;
  const { user } = useAuth();
  const { t } = useLanguage();
  const [wish, setWish] = useState<Wish | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchWish = async () => {
      if (!db) return;
      const unsub = onSnapshot(
        doc(db, "wishes", wishId),
        (snap) => {
          if (!active) return;
          if (snap.exists()) {
            const raw = snap.data();
            setWish({
              ...raw,
              id: snap.id,
              created_at: getMillis(raw.created_at),
              accepted_at: raw.accepted_at ? getMillis(raw.accepted_at) : undefined,
              fulfilled_at: raw.fulfilled_at ? getMillis(raw.fulfilled_at) : undefined,
              cancelled_at: raw.cancelled_at ? getMillis(raw.cancelled_at) : undefined,
            } as Wish);
          } else {
            if (notice.params?.wishSnapshot) {
              try {
                const raw = JSON.parse(notice.params.wishSnapshot);
                setWish({
                  ...raw,
                  id: wishId,
                  isSnapshot: true,
                } as Wish);
              } catch (e) {
                console.error("Failed to parse wishSnapshot", e);
                setWish(null);
              }
            } else {
              setWish(null);
            }
          }
          setLoading(false);
        },
        (err) => {
          console.error("Failed to fetch wish for notice", err);
          if (active) setLoading(false);
        }
      );
      return unsub;
    };
    const unsubPromise = fetchWish();
    return () => { 
      active = false; 
      unsubPromise.then(unsub => {
        if (unsub && typeof unsub === "function") unsub();
      });
    };
  }, [wishId, notice.params?.wishSnapshot]);

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="relative w-full max-w-lg max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-3 -right-1 sm:-top-4 sm:-right-4 z-50 p-2.5 bg-slate-800 text-white hover:bg-slate-900 rounded-full shadow-xl border-2 border-white transition-transform active:scale-95"
        >
          <X size={20} strokeWidth={2.5}/>
        </button>

        <div className="w-full flex-1 overflow-y-auto no-scrollbar rounded-[2rem]">
          {loading ? (
            <div className="bg-white rounded-[2rem] shadow-xl p-12 flex flex-col items-center justify-center h-full min-h-[300px]">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-4" />
              <p className="text-slate-500 font-bold">{t.NOTICE.LOADING_WISH || "確認中..."}</p>
            </div>
          ) : !wish ? (
            <div className="bg-white rounded-[2rem] shadow-xl p-12 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
              <BellOff className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-slate-600 font-bold">{t.NOTICE.WISH_NOT_FOUND || "この願いは、役目を終えました。"}</p>
            </div>
          ) : (
            <div className="bg-white rounded-[2rem] shadow-xl p-6 sm:p-8">
               <WishCard 
                 wish={wish} 
                 currentUserId={user?.uid || ""} 
                 variant="notice" 
                 noticeMessage={resolveDynamicMessage(notice, wish, user?.uid || "", t)}
               />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const NoticePanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const { notices, unreadCount, dismissNotice, dismissAll } = useNoticeContext();
  const panelRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  // 外側クリックで閉じる（モーダルが開いているときは無効化）
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen && !selectedNotice) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, selectedNotice]);

  // Cast WISH_ACTIONS to a simple string map for resolveMessage
  const wishActions = t.WISH_ACTIONS as unknown as Record<string, string>;

  return (
    <>
      <div ref={panelRef} className="relative z-50 flex items-center">
        {/* ベルアイコン + バッジ */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative p-3 rounded-full transition-all active:scale-95 ${
            unreadCount > 0
              ? "text-amber-500 bg-amber-50/50"
              : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
          }`}
          aria-label={t.NOTICE.TITLE}
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
              className="fixed left-4 right-4 top-[70px] sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 max-h-[70vh] bg-white rounded-2xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col z-50"
            >
              {/* ヘッダー */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-50 bg-white">
                <h3 className="text-base font-serif font-medium text-slate-900 tracking-widest">
                  {t.NOTICE.TITLE}
                </h3>
                <div className="flex items-center gap-3">
                  {notices.length > 0 && (
                    <button
                      onClick={dismissAll}
                      className="text-xs text-slate-700 hover:text-amber-600 transition-colors tracking-tighter"
                    >
                      {t.NOTICE.TOOLTIP_DISMISS_ALL}
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 text-slate-700 hover:text-slate-700 transition-colors"
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
                      className="text-slate-700 mb-3"
                      strokeWidth={1.5}
                    />
                    <p className="text-sm text-slate-700 font-medium">
                      {t.NOTICE.EMPTY_TITLE}
                    </p>
                    <p className="text-xs text-slate-700 mt-1">
                      {t.NOTICE.EMPTY_DESC}
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
                        className="group relative"
                      >
                        <div
                          className={`flex items-start gap-4 px-6 py-5 transition-colors ${
                            notice.wishId ? "hover:bg-amber-50 cursor-pointer" : "hover:bg-slate-50/30"
                          }`}
                          onClick={() => {
                            if (notice.wishId) {
                              setSelectedNotice(notice);
                              setIsOpen(false);
                            }
                          }}
                        >
                          {/* ドットインジケーター */}
                          <span
                            className={`mt-2 w-1.5 h-1.5 rounded-full shrink-0 opacity-90 ${typeColorMap[notice.type] || "bg-slate-300"}`}
                          />

                          {/* メッセージ */}
                          <div className="flex-1 min-w-0 pr-2">
                            <p className="text-base sm:text-sm text-slate-800 leading-relaxed tracking-wide text-left">
                              {resolveMessage(notice, wishActions)}
                            </p>
                            {notice.params?.note && (
                              <div className="mt-2.5 p-3 bg-white rounded-xl border border-slate-200 text-slate-600 text-sm italic shadow-sm">
                                {notice.params.note}
                              </div>
                            )}
                            <span className="text-xs text-slate-700 mt-1.5 block font-sans tracking-tight text-left">
                              {formatTime(
                                notice.createdAt,
                                t.NOTICE.TIME_JUST_NOW,
                                t.NOTICE.TIME_MINUTES_AGO,
                                t.NOTICE.TIME_HOURS_AGO,
                              )}
                            </span>
                          </div>

                          {/* アクション群（開く・削除） */}
                          <div className="flex items-center gap-1 shrink-0 -mr-2 mt-1">
                            {notice.wishId && (
                              <div className="text-slate-300 group-hover:text-amber-400 group-active:text-amber-500 transition-colors hidden sm:block">
                                <ChevronRight size={18} />
                              </div>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); dismissNotice(notice.id); }}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-md transition-all sm:opacity-0 group-hover:opacity-100"
                              title={t.NOTICE.TOOLTIP_DISMISS}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* モーダル：document.body にポータルとして描画（イベント競合を完全回避） */}
      {selectedNotice && selectedNotice.wishId &&
        ReactDOM.createPortal(
          <NoticeWishModal
            notice={selectedNotice}
            onClose={() => setSelectedNotice(null)}
          />,
          document.body
        )
      }
    </>
  );
};

