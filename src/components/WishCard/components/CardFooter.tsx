import React from "react";
import {
  AlertTriangle,
  Clock,
  Handshake,
  Loader2,
  Archive,
} from "lucide-react";
import { WishCardState, WishCardHandlers } from "../types";
import { useWishActions } from "../../../hooks/useWishActions";
import { useToast } from "../../../hooks/useToast";

export const CardFooter: React.FC<{
  state: WishCardState;
  handlers: WishCardHandlers;
}> = ({ state, handlers }) => {
  const {
    wish,
    isExpired,
    isMyWish,
    isReadOnly,
    isLoading,
    showApplicants,
    hasApplied,
    displayValue,
    currentUserId,
  } = state;

  const {
    setShowApplicants,
    handleApply,
    handleCancel,
    handleCleanup,
    formatDate,
    setIsLoading,
  } = handlers;

  const { withdrawApplication, fulfillWish } = useWishActions();
  const { showToast } = useToast();
  const applicants = wish.applicants || [];

  return (
    <div className="relative pt-4 border-t border-slate-100 min-h-[50px] flex items-center justify-between gap-4 flex-wrap">
      <div className="flex flex-col gap-1 items-start">
        <div className="">
          {wish.status === "in_progress" && (
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 whitespace-nowrap shrink-0">
              進行中
            </span>
          )}
          {wish.status === "cancelled" && (
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full border whitespace-nowrap shrink-0 ${
                wish.cancel_reason === "helper_cancellation" ||
                wish.cancel_reason === "compensatory_cancellation"
                  ? "text-red-600 bg-red-50 border-red-100"
                  : "text-slate-500 bg-slate-100 border-slate-200"
              }`}
            >
              {wish.cancel_reason === "helper_cancellation" ||
              wish.cancel_reason === "compensatory_cancellation"
                ? wish.requester_id === currentUserId
                  ? "お詫び受領"
                  : "お詫び送付"
                : "キャンセル済み"}
            </span>
          )}
          {wish.status === "review_pending" && (
            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-100 animate-pulse whitespace-nowrap shrink-0">
              確認待ち
            </span>
          )}
          {(wish.status === "fulfilled" || wish.status === "completed") && (
            <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100 whitespace-nowrap shrink-0">
              感謝済み
            </span>
          )}
          {wish.status === "expired" && (
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 whitespace-nowrap shrink-0">
              整理済み（期限切れ）
            </span>
          )}
          {wish.status === "open" &&
            (isExpired ? (
              <span className="flex items-center gap-1 text-xs font-bold text-red-500 bg-red-50 px-3 py-1 rounded-full border border-red-100 whitespace-nowrap shrink-0">
                <AlertTriangle size={12} />
                期限切れ
              </span>
            ) : (
              <span className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-200 whitespace-nowrap shrink-0">
                募集中
              </span>
            ))}
        </div>

        {isMyWish && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 ml-1">
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatDate(wish.created_at)}</span>
            </span>
            {wish.isAnonymous && (
              <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-100 uppercase tracking-tight">
                匿名
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        {isMyWish && (
          <>
            {wish.status === "open" && !isExpired && (
              <div>
                {applicants.length > 0 && (
                  <div className="relative">
                    <button
                      onClick={() => setShowApplicants(!showApplicants)}
                      className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-white rounded-full text-base font-bold shadow-md shadow-yellow-200 hover:bg-yellow-500 transition-all active:scale-95"
                    >
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                      {applicants.length}人が手を挙げています
                    </button>
                  </div>
                )}
              </div>
            )}

            {!isExpired &&
              !isReadOnly &&
              (wish.status === "review_pending" ||
                wish.status === "in_progress") && (
                <div className="flex flex-col items-end gap-2">
                  <p className="text-xs font-bold text-slate-700">
                    実費（材料費など）の清算が済んでいることを確認し、感謝の Lm
                    を贈ります。
                  </p>
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          "本当にお礼をしてよろしいですか？Lumenが送られます。",
                        )
                      ) {
                        if (wish.helper_id) {
                          const run = async () => {
                            setIsLoading(true);
                            const success = await fulfillWish(
                              wish.id,
                              wish.helper_id!,
                            );
                            if (success) {
                              showToast("感謝を届けました", "success");
                              import("../../../utils/pwaEvent").then(
                                ({ globalTriggerPWAInstall }) => {
                                  globalTriggerPWAInstall();
                                },
                              );
                              if (state.onTabChange)
                                state.onTabChange("history");
                            }
                            setIsLoading(false);
                          };
                          run();
                        }
                      }
                    }}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold shadow-lg shadow-pink-200 hover:scale-105 active:scale-95 transition-all"
                  >
                    <Handshake className="w-4 h-4 text-white" />
                    <span>お礼をする (完了)</span>
                  </button>
                </div>
              )}
          </>
        )}

        {!isMyWish && !isExpired && !isReadOnly && (
          <>
            {wish.status === "open" && (
              <div>
                {hasApplied ? (
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-500 rounded-full text-xs font-bold border border-slate-200 whitespace-nowrap shrink-0">
                      <Clock size={14} />
                      返事を待っています
                    </span>
                    <button
                      onClick={async () => {
                        if (confirm("本当に立候補を取り消しますか？")) {
                          setIsLoading(true);
                          const success = await withdrawApplication(wish.id);
                          setIsLoading(false);
                          if (success) {
                            showToast("とりやめました", "success");
                            if (state.onActionComplete)
                              state.onActionComplete("withdrawn");
                          }
                        }
                      }}
                      disabled={isLoading}
                      className="px-3 py-2 text-base font-bold text-slate-400 border border-slate-200 rounded-full hover:bg-slate-50 hover:text-slate-600 hover:border-slate-300 transition-all"
                    >
                      取り消す
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleApply}
                    disabled={isLoading || displayValue === 0}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-500 hover:text-white hover:border-amber-500 text-base font-bold transition-all shadow-sm hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Handshake className="w-4 h-4" />
                    )}
                    <span>応える</span>
                  </button>
                )}
              </div>
            )}

            {(wish.status === "in_progress" ||
              wish.status === "review_pending") &&
              !isReadOnly &&
              wish.helper_id === currentUserId && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCancel}
                    disabled={isLoading}
                    className="text-slate-600 hover:text-red-500 text-base font-bold transition-all underline decoration-slate-300 hover:decoration-red-200 underline-offset-4"
                  >
                    辞退する
                  </button>
                </div>
              )}
          </>
        )}

        {isMyWish && isExpired && !isReadOnly && (
          <button
            onClick={handleCleanup}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-base font-bold hover:bg-slate-800 transition-all active:scale-[0.98] shadow-md shadow-slate-200 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Archive size={14} />
            )}
            <span>この記録を整理する</span>
          </button>
        )}
      </div>
    </div>
  );
};
