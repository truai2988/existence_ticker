import React from "react";
import { Loader2, Heart, CheckCircle, X, Archive, Hourglass } from "lucide-react";
import { useLanguage } from "../../../contexts/LanguageContext";
import { WishCardState, WishCardHandlers } from "../types";
import { calculateHistoricalValue } from "../../../logic/worldPhysics";
import { UNIT_LABEL } from "../../../constants";

export const CardContent: React.FC<{ state: WishCardState; handlers: WishCardHandlers }> = ({ state, handlers }) => {
  const { t: MESSAGES } = useLanguage();
  const {
    wish, isEditing, editContent, isLoading, isExpired, initialCost, currentUserId, displayValue, isMyWish
  } = state;

  const { setIsEditing, setEditContent, handleUpdate } = handlers;

  return (
    <>
      <div className="relative mb-3">
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none text-sm resize-none min-h-[100px]"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(wish.content);
                }}
                className="px-3 py-2 text-base font-bold text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                {MESSAGES.WISH_CARD.BTN_CANCEL}
              </button>
              <button
                onClick={handleUpdate}
                disabled={isLoading || !editContent.trim()}
                className="px-3 py-2 text-base font-bold text-white bg-blue-500 hover:bg-blue-600 rounded-lg shadow-sm disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : MESSAGES.WISH_CARD.BTN_UPDATE}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-slate-900 text-base leading-relaxed font-serif font-medium whitespace-pre-wrap tracking-wide">
            {wish.content}
          </p>
        )}

        {wish.system_note && (
          <div className="mt-3 p-3 bg-amber-50/50 border border-amber-100 rounded-xl">
            <p className="text-sm text-amber-800 leading-relaxed font-bold font-sans">
              {wish.system_note}
            </p>
          </div>
        )}
      </div>

      <div className="relative mb-3 border-t border-slate-300 pt-2">
        {["fulfilled", "cancelled", "expired"].includes(wish.status) || (wish.status === "open" && isExpired) ? (
          <div
            className={`p-4 rounded-xl border flex justify-between items-center ${
              wish.status === "fulfilled"
                ? initialCost === 0
                  ? "bg-pink-50/30 border-pink-100/50"
                  : "bg-green-50/50 border-green-100/50"
                : wish.status === "cancelled"
                ? "bg-red-50/30 border-red-100/50"
                : wish.status === "interrupted"
                ? "bg-slate-100/50 border-slate-300/50"
                : "bg-slate-50/50 border-slate-300/50"
            }`}
          >
            <div className="flex items-center gap-2">
              {wish.status === "fulfilled" ? (
                initialCost === 0 ? <Heart size={16} className="text-pink-400" /> : <CheckCircle size={16} className="text-green-500" />
              ) : wish.status === "cancelled" ? (
                <X size={16} className="text-red-400" />
              ) : wish.status === "interrupted" ? (
                <X size={16} className="text-slate-700" />
              ) : (
                <Archive size={16} className="text-slate-700" />
              )}
              <span
                className={`text-sm font-bold font-sans ${
                  wish.status === "fulfilled"
                    ? initialCost === 0 ? "text-pink-600" : "text-green-700"
                    : wish.status === "cancelled"
                    ? "text-red-600"
                    : "text-slate-800"
                }`}
              >
                {wish.status === "fulfilled"
                  ? initialCost === 0 ? MESSAGES.WISH_CARD.LBL_RESONANCE : MESSAGES.WISH_CARD.LBL_DELIVERED_THANKS
                  : wish.status === "interrupted"
                  ? MESSAGES.WISH_CARD.LBL_END_BY_WITHDRAWAL
                  : wish.status === "cancelled"
                  ? (() => {
                      const isRequester = wish.requester_id === currentUserId;
                      const isHelperCancellation = wish.cancel_reason === "helper_cancellation";
                      const isCompensatory = wish.cancel_reason === "compensatory_cancellation";

                      if (isHelperCancellation) {
                        return isRequester ? MESSAGES.WISH_CARD.RSN_HELPER_RESIGN_REQ : MESSAGES.WISH_CARD.RSN_HELPER_RESIGN_HELP;
                      } else if (isCompensatory) {
                        return isRequester ? MESSAGES.WISH_CARD.RSN_COMP_REQ : MESSAGES.WISH_CARD.RSN_COMP_HELP;
                      } else {
                        return isRequester ? MESSAGES.WISH_CARD.RSN_CANCELLED_REQ : MESSAGES.WISH_CARD.RSN_CANCELLED_HELP;
                      }
                    })()
                  : MESSAGES.WISH_CARD.RSN_NATURAL_EXPIRY}
              </span>
            </div>
            <div className="text-xl font-medium font-mono text-slate-900 tracking-tight">
              {wish.status === "fulfilled" ? (
                initialCost === 0 ? (
                  <span className="text-pink-500 font-medium tracking-[0.15em]">{MESSAGES.WISH_CARD.TAG_ECHO}</span>
                ) : (
                  <>
                    {isMyWish ? '-' : '+'}{Math.floor(wish.val_at_fulfillment || 0).toLocaleString()} <span className="text-sm text-slate-700 ml-0.5">Lm</span>
                  </>
                )
              ) : wish.status === "cancelled" ? (
                wish.cancel_reason === "compensatory_cancellation" || wish.cancel_reason === "helper_cancellation" || wish.val_at_fulfillment ? (
                  <div className="flex flex-col items-end">
                    <span className={`text-base ${wish.cancel_reason === "helper_cancellation" ? (wish.requester_id === currentUserId ? "text-emerald-500" : "text-red-500") : (wish.requester_id === currentUserId ? "text-red-500" : "text-emerald-500")}`}>
                      {wish.cancel_reason === "helper_cancellation" ? (wish.requester_id === currentUserId ? '+' : '-') : (wish.requester_id === currentUserId ? '-' : '+')}
                      {wish.val_at_fulfillment !== undefined
                        ? Math.floor(wish.val_at_fulfillment).toLocaleString()
                        : Math.floor(calculateHistoricalValue(wish.cost || 0, wish.created_at || 0, wish.cancelled_at || 0)).toLocaleString()}
                      <span className="text-sm ml-0.5 whitespace-nowrap">Lm</span>
                    </span>
                    <span className="text-sm text-red-400 font-medium uppercase tracking-wider">
                      {wish.cancel_reason === "helper_cancellation" ? (wish.requester_id === currentUserId ? MESSAGES.WISH_CARD.LBL_RECV_DONE : MESSAGES.WISH_CARD.LBL_SENT_DONE) : (wish.requester_id === currentUserId ? MESSAGES.WISH_CARD.LBL_SENT_DONE : MESSAGES.WISH_CARD.LBL_RECV_DONE)}
                    </span>
                  </div>
                ) : null
              ) : null}
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-center bg-slate-50/60 p-3.5 rounded-xl border border-slate-300/40">
            <div>
              <div className="flex items-center gap-2 mb-1.5 opacity-90">
                <Hourglass size={14} className={isMyWish ? "text-amber-500" : "text-orange-400"} />
                <span className={`text-xs font-semibold ${isMyWish ? "text-amber-600" : "text-slate-800"}`}>
                  {isMyWish ? MESSAGES.WISH_CARD.LBL_GIVE_THANKS : MESSAGES.WISH_CARD.LBL_SHARE_THANKS}
                </span>
              </div>
              {displayValue > 0 && (
                <div className="text-xs text-slate-700 font-serif tracking-wide pt-0.5">
                  {MESSAGES.WISH_CARD.TXT_THANKS_DECAY_NOTE}
                </div>
              )}
            </div>
            <div className={`text-base font-mono ${initialCost === 0 ? "text-pink-400" : "text-slate-800"} font-medium tracking-tight`}>
              {initialCost === 0 ? "∞" : Math.floor(displayValue).toLocaleString()}{" "}
              <span className={`text-sm font-normal ${initialCost === 0 ? "text-pink-300" : "text-slate-700"} ml-0.5`}>
                {initialCost === 0 ? MESSAGES.WISH_CARD.LBL_ECHO : UNIT_LABEL}
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
