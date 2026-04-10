import React from "react";
import { User, ShieldCheck, Megaphone, Clock, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { useLanguage } from "../../../contexts/LanguageContext";
import { WishCardState, WishCardHandlers } from "../types";
import { useUserView } from "../../../contexts/UserViewContext";

export const CardHeader: React.FC<{ state: WishCardState; handlers: WishCardHandlers }> = ({ state, handlers }) => {
  const { t: MESSAGES } = useLanguage();
  const {
    wish, viewType, isMyWish, isReadOnly, isLoading, isExpired, isMasked,
    requesterProfile, trust, displayRequesterName, isEditing
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
      <div className="relative flex justify-between items-start mb-2 gap-4">
        <div className="flex flex-col gap-3 flex-1 min-w-0">
          {contextLabel && (
            <div className="flex items-center">
              <span className={`text-xs font-semibold tracking-[0.2em] font-serif ${
                isMyWish ? "text-amber-500/90" :
                wish.helper_id === state.currentUserId ? "text-blue-500/90" :
                "text-slate-700/90"
              }`}>
                {contextLabel}
              </span>
            </div>
          )}

          {(!isMyWish || ["cancelled", "expired"].includes(wish.status)) && (
            <div className="flex items-center gap-3 w-full">
              {isMyWish ? (
                <div className="min-w-0 flex-1 py-1">
                  {["cancelled", "expired"].includes(wish.status) && (
                    <div className="flex items-center gap-2 opacity-80 mb-1">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-300 shrink-0">
                        <User className="w-5 h-5 text-slate-700" />
                      </div>
                      <div className="text-sm text-slate-800 font-bold font-sans">{MESSAGES.WISH_CARD.HDR_UNFULFILLED}</div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border shrink-0 overflow-hidden ${isMasked ? "bg-slate-200 border-slate-300" : "bg-slate-100 border-slate-300"}`}>
                    {!isMasked && requesterProfile?.avatarUrl ? (
                      <img src={requesterProfile.avatarUrl} alt={requesterProfile.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-base font-bold text-slate-700">
                        {isMasked ? <User className="w-5 h-5 text-slate-700" /> : (requesterProfile?.name?.charAt(0).toUpperCase() || <User className="w-5 h-5 text-slate-700" />)}
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
                        className={`block text-base font-bold tracking-wide text-left truncate max-w-full transition-colors font-sans ${isMasked ? "text-slate-700 cursor-default" : "text-slate-900 hover:underline"}`}
                      >
                        <span className="font-bold text-slate-900 text-base md:text-lg truncate">
                          {isMyWish ? MESSAGES.WISH_CARD.HDR_TITLE_MY : viewType === "flow" ? `${displayRequesterName}${MESSAGES.WISH_CARD.HDR_TITLE_HELP}` : `${displayRequesterName}${MESSAGES.WISH_CARD.HDR_TITLE_OTHER}`}
                        </span>
                      </button>
                      {!isMyWish && (
                        <>
                          {trust.isVerified && <ShieldCheck size={14} className="text-blue-400 fill-blue-50 shrink-0" strokeWidth={2.5} />}
                          <div className="flex items-center gap-2 text-sm shrink-0">
                            <div title={`${MESSAGES.WISH_CARD.TTL_THANKS_DELIVERED} ${wish.requester_trust_score || 0}`} className={`flex items-center gap-0.5 ${trust.color}`}>
                              {trust.icon} <span className="text-sm font-bold leading-none translate-y-px">{trust.label}</span>
                            </div>
                            {(wish.requester_completed_requests || 0) > 0 && (
                              <span title={MESSAGES.WISH_CARD.HDR_REQ_COUNT + (wish.requester_completed_requests || 0)} className="text-slate-800 font-bold flex items-center gap-1">
                                <Megaphone className="w-3 h-3" /> <span className="text-sm font-bold">{MESSAGES.WISH_CARD.HDR_REQ_COUNT}{wish.requester_completed_requests || 0}</span>
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                    {!isMasked && requesterProfile?.bio && (
                      <p className="text-sm text-slate-800 mt-1 line-clamp-2 leading-relaxed font-sans">
                        {requesterProfile.bio.length > 60 ? `${requesterProfile.bio.slice(0, 60)}...` : requesterProfile.bio}
                      </p>
                    )}
                    <span className="flex items-center gap-1 text-sm text-slate-800 mt-0.5 font-sans">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatDate(wish.created_at)}</span>
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {isMyWish && !isReadOnly && (
          <div className="flex items-center gap-1 shrink-0 -mt-2 -mr-2">
            {!isExpired && wish.status === "open" && (
              <>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  disabled={isLoading}
                  className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50/50 rounded-full transition-colors"
                  title={MESSAGES.WISH_CARD.BTN_EDIT}
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50/50 rounded-full transition-colors"
                  title={MESSAGES.WISH_CARD.BTN_WITHDRAW}
                >
                  <Trash2 size={15} />
                </button>
              </>
            )}
            {!isExpired && wish.status === "in_progress" && (
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50/50 rounded-full transition-colors"
                title={MESSAGES.WISH_CARD.BTN_INTERRUPT}
              >
                <AlertTriangle size={15} />
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
};
