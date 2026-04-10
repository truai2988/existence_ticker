import React from "react";
import { User, ShieldCheck, Megaphone, Clock, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { useLanguage } from "../../../contexts/LanguageContext";
import { WishCardState, WishCardHandlers } from "../types";
import { useUserView } from "../../../contexts/UserViewContext";
import { mapAgeGroup } from "../../../utils/formatAgeGroup";

export const CardHeader: React.FC<{ state: WishCardState; handlers: WishCardHandlers }> = ({ state, handlers }) => {
  const { t: MESSAGES } = useLanguage();
  const {
    wish, isMyWish, isReadOnly, isLoading, isExpired, isMasked, hasApplied,
    requesterProfile, trust, displayRequesterName, isEditing
  } = state;

  const { setIsEditing, handleCancel, formatDate } = handlers;
  const { openUserProfile } = useUserView();

  const getStatusBadge = () => {
    if (['completed', 'fulfilled', 'cancelled', 'expired'].includes(wish.status)) return null;

    let label = '';
    let colorClass = '';

    if (isMyWish) {
      if (wish.status === 'open') {
        label = MESSAGES.WISH_CARD.STATUS_OPEN;
        colorClass = 'bg-emerald-600 text-white shadow-sm shadow-emerald-200';
      } else if (wish.status === 'in_progress' || wish.status === 'review_pending') {
        label = MESSAGES.WISH_CARD.STATUS_ACTIVE;
        colorClass = 'bg-blue-600 text-white shadow-sm shadow-blue-200';
      }
    } else {
      if (wish.status === 'open') {
        if (hasApplied) {
          label = MESSAGES.WISH_CARD.STATUS_PENDING;
          colorClass = 'bg-amber-500 text-white shadow-sm shadow-amber-200';
        } else {
          label = MESSAGES.WISH_CARD.STATUS_OPEN;
          colorClass = 'bg-emerald-600 text-white shadow-sm shadow-emerald-200';
        }
      } else if (wish.status === 'review_pending' || wish.status === 'in_progress') {
        label = MESSAGES.WISH_CARD.STATUS_ACTIVE;
        colorClass = 'bg-blue-600 text-white shadow-sm shadow-blue-200';
      }
    }

    if (!label) return null;

    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider whitespace-nowrap shrink-0 ${colorClass}`}>
        {label}
      </span>
    );
  };

  return (
    <>
      <div className="relative flex justify-between items-start mb-2 gap-4">
        <div className="flex flex-col gap-3 flex-1 min-w-0">
          {/* 投稿者プロフィール行 — 常に表示 */}
          <div className="flex items-center gap-3 w-full">
            {/* アバター */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border shrink-0 overflow-hidden ${isMasked ? "bg-slate-200 border-slate-300" : "bg-slate-100 border-slate-300"}`}>
              {!isMasked && requesterProfile?.avatarUrl ? (
                <img src={requesterProfile.avatarUrl} alt={requesterProfile.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-base font-bold text-slate-700">
                  {isMasked ? <User className="w-5 h-5 text-slate-700" /> : (requesterProfile?.name?.charAt(0) || <User className="w-5 h-5 text-slate-700" />)}
                </span>
              )}
            </div>

            {/* 名前・バッジ・日時 */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                {/* 名前ボタン（プロフィールモーダルへ） */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isMasked) openUserProfile(wish.requester_id, isMasked);
                  }}
                  disabled={isMasked}
                  className={`text-base font-bold tracking-wide text-left font-sans transition-colors ${isMasked ? "text-slate-600 cursor-default" : "text-slate-900 hover:underline"}`}
                >
                  {isMasked ? (
                    <div className="flex items-center gap-2">
                      <span>
                        {MESSAGES.WISH_CARD.LBL_ANONYMOUS}
                        {isMyWish && <span className="opacity-80 ml-0.5">{MESSAGES.WISH_CARD.LBL_YOU_ANONYMOUS}</span>}
                      </span>
                      {requesterProfile?.age_group && (
                        <span className="text-[13px] font-normal text-slate-500 font-mono tracking-normal shrink-0 translate-y-[1px]">
                          {mapAgeGroup(requesterProfile.age_group, MESSAGES)}
                          {requesterProfile.gender && requesterProfile.gender !== 'other' 
                            ? ` / ${requesterProfile.gender === 'male' ? MESSAGES.WISH_CARD.LBL_MALE : MESSAGES.WISH_CARD.LBL_FEMALE}` 
                            : ''}
                        </span>
                      )}
                    </div>
                  ) : displayRequesterName}
                </button>

                {/* トラスト・実績（自分以外） */}
                {!isMyWish && !isMasked && (
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



              <div className="flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1 text-sm text-slate-800 font-sans">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatDate(wish.created_at)}</span>
                </span>
                {getStatusBadge()}
              </div>
            </div>
          </div>

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
