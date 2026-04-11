import React from "react";
import {
  Clock,
  Handshake,
  Loader2,
} from "lucide-react";
import { useLanguage } from "../../../contexts/LanguageContext";
import { WishCardState, WishCardHandlers } from "../types";
import { useWishActions } from "../../../hooks/useWishActions";
import { useToast } from "../../../hooks/useToast";
import { useMicroInteractions } from "../../../hooks/useMicroInteractions";

export const CardFooter: React.FC<{
  state: WishCardState;
  handlers: WishCardHandlers;
}> = ({ state, handlers }) => {
  const { t: MESSAGES } = useLanguage();
  const {
    wish,
    isExpired,
    isMyWish,
    isReadOnly,
    isLoading,
    showApplicants,
    hasApplied,
    currentUserId,
  } = state;

  const {
    setShowApplicants,
    handleApply,
    handleCancel,
    setIsLoading,
  } = handlers;

  const { withdrawApplication, fulfillWish } = useWishActions();
  const { showToast } = useToast();
  const { getCandidateAction } = useMicroInteractions();
  const applicants = wish.applicants || [];

  const handleFulfill = async (message?: string) => {
    setIsLoading(true);
    const success = await fulfillWish(wish.id, wish.helper_id!, message);
    if (success) {
      setTimeout(() => {
        showToast(MESSAGES.WISH_CARD.TOAST_THANKED, "success");
      }, 500);
    }
    setIsLoading(false);
  };

  if (isExpired && isMyWish) {
    return null; // isExpired for MyWish only has cleanup, which is now in CardHeader
  }

  return (
    <div className="relative pt-4 mt-2 border-t border-slate-200 min-h-[44px] flex items-center flex-wrap justify-between gap-3">
      {/* 2. 消極的な動作（左側） */}
      <div className="flex items-center gap-2 flex-1 justify-start">
        {isMyWish && !isReadOnly && !isExpired && (
          <>
            {wish.status === "open" && (
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="flex items-center justify-center px-4 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 bg-transparent border border-slate-300 hover:border-slate-400 hover:bg-slate-50 rounded-full transition-colors whitespace-nowrap"
                title={MESSAGES.WISH_CARD.BTN_WITHDRAW}
              >
                <span>{MESSAGES.WISH_CARD.BTN_WITHDRAW}</span>
              </button>
            )}
            {wish.status === "in_progress" && (
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="flex items-center justify-center px-4 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 bg-transparent border border-slate-300 hover:border-slate-400 hover:bg-slate-50 rounded-full transition-colors whitespace-nowrap"
                title={MESSAGES.WISH_CARD.BTN_INTERRUPT}
              >
                <span>{MESSAGES.WISH_CARD.BTN_INTERRUPT}</span>
              </button>
            )}
          </>
        )}

        {!isMyWish && !isExpired && !isReadOnly && (
          <>
            {wish.status === "open" && hasApplied && (
              <button
                onClick={async () => {
                  if (confirm(MESSAGES.WISH_CARD.MSG_CONFIRM_CANCEL)) {
                    setIsLoading(true);
                    const success = await withdrawApplication(wish.id);
                    setIsLoading(false);
                    if (success) {
                      setTimeout(() => {
                        showToast(MESSAGES.WISH_CARD.MSG_CANCEL_SUCCESS, "success");
                      }, state.onActionComplete ? 500 : 0);
                      if (state.onActionComplete)
                        state.onActionComplete("withdrawn");
                    }
                  }
                }}
                disabled={isLoading}
                className="flex items-center justify-center px-4 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 bg-transparent border border-slate-300 hover:border-slate-400 hover:bg-slate-50 rounded-full transition-colors whitespace-nowrap"
              >
                <span>{MESSAGES.WISH_CARD.BTN_CANCEL_APPLY}</span>
              </button>
            )}
            {(wish.status === "in_progress" || wish.status === "review_pending") &&
              wish.helper_id === currentUserId && (
                <button
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="flex items-center justify-center px-4 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 bg-transparent border border-slate-300 hover:border-slate-400 hover:bg-slate-50 rounded-full transition-colors whitespace-nowrap"
                >
                  <span>{MESSAGES.WISH_CARD.BTN_DECLINE}</span>
                </button>
              )}
          </>
        )}
      </div>

      {/* 3. 積極的な動作（右側） */}
      <div className="flex items-center gap-2 flex-shrink-0 justify-end">
        {isMyWish && (
          <>
            {wish.status === "open" && !isExpired && (
              <div>
                {applicants.length > 0 && state.viewType !== "flow" ? (
                  <button
                    onClick={() => setShowApplicants(!showApplicants)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-full text-sm font-bold shadow-md shadow-orange-200/50 hover:scale-105 transition-all active:scale-[0.98] whitespace-nowrap"
                  >
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                    {MESSAGES.WISH_CARD.BTN_RESPONDENTS}
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 text-sm font-bold text-slate-500 whitespace-nowrap px-2">
                    <Clock size={16} />
                    <span>{MESSAGES.WISH_CARD.TXT_WAITING_CANDIDATE}</span>
                  </div>
                )}
              </div>
            )}

            {!isExpired && !isReadOnly && (wish.status === "review_pending" || wish.status === "in_progress") && (
              <button
                onClick={() => {
                  const confirmPrompt = MESSAGES.WISH_CARD.FTR_THANK_ALERT + "\n\n（感謝のメッセージがあればここに入力してください）：";
                  const msg = window.prompt(confirmPrompt);
                  if (msg !== null) {
                    handleFulfill(msg.trim() || undefined);
                  }
                }}
                disabled={isLoading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-600 text-white font-bold shadow-md shadow-emerald-200/50 hover:bg-emerald-700 active:scale-95 transition-all whitespace-nowrap"
              >
                <Handshake className="w-4 h-4 text-white" />
                <span>{MESSAGES.WISH_CARD.BTN_GIVE_THANKS_DONE}</span>
              </button>
            )}
          </>
        )}

        {!isMyWish && !isExpired && !isReadOnly && (
          <>
            {wish.status === "open" && !hasApplied && (
              <button
                onClick={getCandidateAction(handleApply)}
                disabled={isLoading}
                className="relative overflow-hidden z-10 flex items-center gap-2 px-6 py-2.5 rounded-full bg-amber-500 text-white hover:bg-amber-600 text-sm font-bold transition-all shadow-md shadow-amber-200/50 hover:scale-[1.03] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Handshake className="w-4 h-4" />
                )}
                <span>{MESSAGES.WISH_CARD.BTN_RESPOND}</span>
              </button>
            )}
            
            {wish.status === "open" && hasApplied && (
               <span className="flex items-center gap-1.5 text-sm font-bold text-emerald-600 whitespace-nowrap px-2">
                 <Clock size={16} />
                 {MESSAGES.WISH_CARD.TXT_WAITING_REPLY}
               </span>
            )}
          </>
        )}
      </div>
    </div>
  );
};
