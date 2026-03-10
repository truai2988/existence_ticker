import React from "react";
import { User, ShieldCheck, Megaphone, Clock, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { WishCardState, WishCardHandlers } from "../types";
import { useUserView } from "../../../contexts/UserViewContext";

export const CardHeader: React.FC<{ state: WishCardState; handlers: WishCardHandlers }> = ({ state, handlers }) => {
  const {
    wish, viewType, isMyWish, isReadOnly, isLoading, isExpired, isMasked, isHelperMasked,
    helperProfile, requesterProfile, trust, displayRequesterName, isEditing
  } = state;

  const { setIsEditing, handleCancel, formatDate } = handlers;
  const { openUserProfile } = useUserView();

  return (
    <>
      <div className="flex items-center gap-2 mb-3">
        {viewType === "radiance" ? (
          isMyWish ? (
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-600 border border-amber-100/50 uppercase tracking-tighter font-sans">
              [ 自分が願ったこと ]
            </span>
          ) : wish.helper_id === state.currentUserId ? (
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-100/50 uppercase tracking-tighter font-sans">
              [ あなたが応えていること ]
            </span>
          ) : null
        ) : (
          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-50 text-slate-400 border border-slate-100 uppercase tracking-tighter font-sans">
            [ 誰かの願い ]
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
                      {helperProfile?.name || wish.helper_name || wish.applicants?.find((a: { id: string }) => a.id === wish.helper_id)?.name || wish.helper_id?.slice(0, 8) || "隣人"}
                    </button>
                    <span className="text-xs uppercase font-bold text-slate-400 tracking-wider whitespace-nowrap font-sans">
                      {wish.status === "fulfilled" || wish.status === "completed"
                        ? "さんに感謝を届けました"
                        : wish.status === "interrupted" ? "さんの事情により終了しました" : wish.status === "cancelled" ? "さんとの願いを中断しました" : "さんが応えてくれます"}
                    </span>
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
                    <div className="text-xs text-slate-600 font-bold font-sans">未成立</div>
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
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isMasked) openUserProfile(wish.requester_id, isMasked);
                    }}
                    className={`block text-base font-bold tracking-wide text-left truncate max-w-full transition-colors font-sans ${isMasked ? "text-slate-500 cursor-default" : "text-slate-800 hover:underline"}`}
                  >
                    {isMyWish ? "あなたの想い" : viewType === "flow" ? `${displayRequesterName} さんの願いに応える` : `${displayRequesterName} さんの願ったこと`}
                  </button>
                  {trust.isVerified && <ShieldCheck size={14} className="text-blue-400 fill-blue-50 shrink-0" strokeWidth={2.5} />}
                  <div className="flex items-center gap-2 text-xs shrink-0">
                    <div title={`感謝を届けた回数: ${wish.requester_trust_score || 0}`} className={`flex items-center gap-0.5 ${trust.color}`}>
                      {trust.icon}
                      <span className="font-sans font-medium">({wish.requester_trust_score || 0})</span>
                    </div>
                    <span className="text-slate-500">|</span>
                    <span title="過去に完了/お礼を行った回数" className="text-slate-500 font-bold flex items-center gap-1">
                      <Megaphone className="w-3 h-3" /> <span className="font-bold">依頼実績: {wish.requester_completed_requests || 0}</span>
                    </span>
                  </div>
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
                  title="編集"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  title="取り下げ"
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
                title="中断 (誠実のしるしを渡す)"
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
