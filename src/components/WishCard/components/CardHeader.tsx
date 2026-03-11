import React from "react";
import { User, ShieldCheck, Megaphone, Clock, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { useLanguage } from "../../../contexts/LanguageContext";
import { WishCardState, WishCardHandlers } from "../types";
import { useUserView } from "../../../contexts/UserViewContext";

export const CardHeader: React.FC<{ state: WishCardState; handlers: WishCardHandlers }> = ({ state, handlers }) => {
  const { t: MESSAGES } = useLanguage();
  const {
    wish, viewType, isMyWish, isReadOnly, isLoading, isExpired, isMasked, isHelperMasked,
    helperProfile, requesterProfile, trust, displayRequesterName, isEditing
  } = state;

  const { setIsEditing, handleCancel, formatDate } = handlers;
  const { openUserProfile } = useUserView();

  let contextLabel = "";
  if (viewType === "radiance") {
      if (isMyWish) {
          contextLabel = MESSAGES.WISH_CARD.HDR_MY_WISH;
      } else if (wish.helper_id === state.currentUserId) {
          contextLabel = MESSAGES.WISH_CARD.HDR_MY_HELP;
      }
  } else if (viewType === "flow") {
      contextLabel = MESSAGES.WISH_CARD.HDR_OTHER_WISH;
  }

  return (
    <>
      <div className="flex items-center gap-2 mb-3">
        {contextLabel && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-md uppercase tracking-tighter font-sans ${
            isMyWish ? "bg-amber-50 text-amber-600 border border-amber-100/50" :
            wish.helper_id === state.currentUserId ? "bg-blue-50 text-blue-600 border border-blue-100/50" :
            "bg-slate-50 text-slate-400 border border-slate-100"
          }`}>
            {contextLabel}
          </span>
        )}
      </div>

      <div className="relative flex justify-between items-start mb-2 gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {isMyWish ? (
            wish.helper_id ? (
              <>
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 shrink-0 overflow-hidden">
                  {helperProfile?.avatarUrl ? (
                    <img src={helperProfile.avatarUrl} alt={helperProfile.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-blue-300" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (wish.helper_id && !isHelperMasked) openUserProfile(wish.helper_id, isMasked);
                      }}
                      className={`text-base font-bold tracking-wide text-left transition-colors whitespace-nowrap font-sans ${isHelperMasked ? "text-slate-500 cursor-default" : "text-slate-800 hover:text-blue-600 hover:underline"}`}
                    >
                      {helperProfile?.name || wish.helper_name || wish.applicants?.find((a: { id: string }) => a.id === wish.helper_id)?.name || wish.helper_id?.slice(0, 8) || MESSAGES.WISH_CARD.HDR_DEFAULT_HELPER}
                    </button>
                    {wish.status !== "open" && wish.status !== "expired" && (
                      <div className="flex flex-wrap items-center gap-1 text-slate-500 font-sans">
                        <span className="font-bold text-slate-700">
                          {helperProfile?.name || wish.helper_name || wish.applicants?.find((a: { id: string }) => a.id === wish.helper_id)?.name || wish.helper_id?.slice(0, 8) || MESSAGES.WISH_CARD.HDR_DEFAULT_HELPER}
                        </span>
                        <span>
                          {wish.status === "fulfilled" || wish.status === "completed"
                            ? MESSAGES.WISH_CARD.HDR_SENDER_DONE
                            : wish.status === "interrupted" ? MESSAGES.WISH_CARD.HDR_INTERRUPTED : wish.status === "cancelled" ? MESSAGES.WISH_CARD.HDR_CANCELLED : MESSAGES.WISH_CARD.HDR_IN_PROGRESS}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="min-w-0 flex-1 py-1">
                {["cancelled", "expired"].includes(wish.status) && (
                  <div className="flex items-center gap-2 opacity-50 mb-1">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
                      <User className="w-5 h-5 text-slate-500" />
                    </div>
                    <div className="text-xs text-slate-600 font-bold font-sans">{MESSAGES.WISH_CARD.HDR_UNFULFILLED}</div>
                  </div>
                )}
              </div>
            )
          ) : (
            <>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border shrink-0 overflow-hidden ${isMasked ? "bg-slate-200 border-slate-300" : "bg-slate-100 border-slate-200"}`}>
                {!isMasked && requesterProfile?.avatarUrl ? (
                  <img src={requesterProfile.avatarUrl} alt={requesterProfile.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-base font-bold text-slate-400">
                    {isMasked ? <User className="w-5 h-5 text-slate-500" /> : (requesterProfile?.name?.charAt(0).toUpperCase() || <User className="w-5 h-5 text-slate-500" />)}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 max-w-full">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isMasked) openUserProfile(wish.requester_id, isMasked);
                    }}
                    className={`block text-base font-bold tracking-wide text-left truncate max-w-full transition-colors font-sans ${isMasked ? "text-slate-500 cursor-default" : "text-slate-800 hover:underline"}`}
                  >
                    <span className="font-bold text-slate-800 text-base md:text-lg truncate">
                      {isMyWish ? MESSAGES.WISH_CARD.HDR_TITLE_MY : viewType === "flow" ? `${displayRequesterName}${MESSAGES.WISH_CARD.HDR_TITLE_HELP}` : `${displayRequesterName}${MESSAGES.WISH_CARD.HDR_TITLE_OTHER}`}
                    </span>
                  </button>
                  {!isMyWish && (
                    <>
                      {trust.isVerified && <ShieldCheck size={14} className="text-blue-400 fill-blue-50 shrink-0" strokeWidth={2.5} />}
                      <div className="flex items-center gap-2 text-xs shrink-0">
                        <div title={`${MESSAGES.WISH_CARD.TTL_THANKS_DELIVERED} ${wish.requester_trust_score || 0}`} className={`flex items-center gap-0.5 ${trust.color}`}>
                          {trust.icon} <span className="text-xs font-bold leading-none translate-y-px">{trust.label}</span>
                        </div>
                        {(wish.requester_completed_requests || 0) > 0 && (
                          <span title={MESSAGES.WISH_CARD.HDR_REQ_COUNT + (wish.requester_completed_requests || 0)} className="text-slate-500 font-bold flex items-center gap-1">
                            <Megaphone className="w-3 h-3" /> <span className="font-bold">{MESSAGES.WISH_CARD.HDR_REQ_COUNT}{wish.requester_completed_requests || 0}</span>
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
                {!isMasked && requesterProfile?.bio && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed font-sans">
                    {requesterProfile.bio.length > 60 ? `${requesterProfile.bio.slice(0, 60)}...` : requesterProfile.bio}
                  </p>
                )}
                <span className="flex items-center gap-1 text-xs text-slate-500 mt-0.5 font-sans">
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(wish.created_at)}</span>
                </span>
              </div>
            </>
          )}
        </div>

        {isMyWish && !isReadOnly && (
          <div className="flex items-center gap-2 shrink-0">
            {!isExpired && wish.status === "open" && (
              <>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  disabled={isLoading}
                  className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                  title={MESSAGES.WISH_CARD.BTN_EDIT}
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  title={MESSAGES.WISH_CARD.BTN_WITHDRAW}
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
            {!isExpired && wish.status === "in_progress" && (
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                title={MESSAGES.WISH_CARD.BTN_INTERRUPT}
              >
                <AlertTriangle size={16} />
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
};
