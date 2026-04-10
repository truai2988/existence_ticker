import React from "react";
import {
  Clock,
  Handshake,
  Loader2,
  Archive,
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
  const { getCandidateAction } = useMicroInteractions();
  const applicants = wish.applicants || [];

  const handleFulfill = async () => {
    setIsLoading(true);
    const success = await fulfillWish(wish.id, wish.helper_id!);
    if (success) {
      showToast(MESSAGES.WISH_CARD.TOAST_THANKED, "success");
      import("../../../utils/pwaEvent").then(
        ({ globalTriggerPWAInstall }) => {
          globalTriggerPWAInstall();
        },
      );
      if (state.onTabChange) state.onTabChange("history");
    }
    setIsLoading(false);
  };

  return (
    <div className="relative pt-4 border-t border-slate-300 min-h-[50px] flex items-center justify-between gap-4 flex-wrap">
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        {isMyWish && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 ml-1">
            <span className="flex items-center gap-1 text-sm text-slate-800">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatDate(wish.created_at)}</span>
            </span>

          </div>
        )}
      </div>

      <div className="flex justify-end">
        {isMyWish && (
          <>
            {wish.status === "open" && !isExpired && (
              <div>
                {applicants.length > 0 ? (
                  <div className="relative">
                    <button
                      onClick={() => setShowApplicants(!showApplicants)}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-full text-sm font-bold shadow-md shadow-orange-200 hover:scale-105 transition-all active:scale-95"
                    >
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                      {applicants.length}
                      {MESSAGES.WISH_CARD.FTR_APPLICANTS}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-sm font-bold text-slate-800 whitespace-nowrap">
                    <Clock size={16} />
                    <span>{MESSAGES.WISH_CARD.TXT_WAITING_CANDIDATE}</span>
                  </div>
                )}
              </div>
            )}

            {!isExpired &&
              !isReadOnly &&
              (wish.status === "review_pending" ||
                wish.status === "in_progress") && (
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center justify-end gap-1.5 text-sm font-bold text-slate-800 text-right">
                    <Clock size={16} className="shrink-0" />
                    <span>{MESSAGES.WISH_CARD.FTR_THANK_CONFIRM}</span>
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm(MESSAGES.WISH_CARD.FTR_THANK_ALERT)) {
                        handleFulfill();
                      }
                    }}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold shadow-lg shadow-pink-200 hover:scale-105 active:scale-95 transition-all"
                  >
                    <Handshake className="w-4 h-4 text-white" />
                    <span>{MESSAGES.WISH_CARD.BTN_GIVE_THANKS_DONE}</span>
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
                  <div className="flex flex-wrap items-center justify-end gap-3">
                    <span className="flex items-center gap-1.5 text-sm font-bold text-slate-800 whitespace-nowrap shrink-0">
                      <Clock size={16} />
                      {MESSAGES.WISH_CARD.TXT_WAITING_REPLY}
                    </span>
                    <button
                      onClick={async () => {
                        if (confirm(MESSAGES.WISH_CARD.MSG_CONFIRM_CANCEL)) {
                          setIsLoading(true);
                          const success = await withdrawApplication(wish.id);
                          setIsLoading(false);
                          if (success) {
                            showToast(MESSAGES.WISH_CARD.MSG_CANCEL_SUCCESS, "success");
                            if (state.onActionComplete)
                              state.onActionComplete("withdrawn");
                          }
                        }
                      }}
                      disabled={isLoading}
                      className="px-4 py-2 text-sm font-bold text-slate-700 border border-slate-300 rounded-full hover:bg-slate-50 hover:text-slate-800 hover:border-slate-300 transition-all whitespace-nowrap shrink-0"
                    >
                      {MESSAGES.WISH_CARD.BTN_CANCEL_APPLY}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={getCandidateAction(handleApply)}
                    disabled={isLoading || displayValue === 0}
                    className="relative overflow-hidden z-10 flex items-center gap-2 px-6 py-2.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-500 hover:text-white hover:border-amber-500 text-base font-bold transition-all shadow-sm hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Handshake className="w-4 h-4" />
                    )}
                    <span>{MESSAGES.WISH_CARD.BTN_RESPOND}</span>
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
                    className="text-slate-800 hover:text-red-500 text-base font-bold transition-all underline decoration-slate-300 hover:decoration-red-200 underline-offset-4"
                  >
                    {MESSAGES.WISH_CARD.BTN_DECLINE}
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
            <span>{MESSAGES.WISH_CARD.BTN_CLEANUP_RECORD}</span>
          </button>
        )}
      </div>
    </div>
  );
};
