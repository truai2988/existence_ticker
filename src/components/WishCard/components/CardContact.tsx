import React from "react";
import { Copy, Mail, Check } from "lucide-react";
import { useLanguage } from "../../../contexts/LanguageContext";
import { WishCardState, WishCardHandlers } from "../types";

export const CardContact: React.FC<{ state: WishCardState; handlers: WishCardHandlers }> = ({ state, handlers }) => {
  const { t: MESSAGES } = useLanguage();
  const { wish, isReadOnly, isMyWish, currentUserId, contactEmail, isCopied, requesterProfile, helperProfile, isMasked, isHelperMasked } = state;
  const { handleCopyEmail } = handlers;

  if (wish.status !== "in_progress" || isReadOnly || (!isMyWish && wish.helper_id !== currentUserId)) {
    return null;
  }

  const partnerProfile = isMyWish ? helperProfile : requesterProfile;
  const partnerName = isMyWish 
      ? (partnerProfile?.name || wish.helper_name || wish.applicants?.find((a: any) => a.id === wish.helper_id)?.name || wish.helper_id?.slice(0, 8) || MESSAGES.WISH_CARD.HDR_DEFAULT_HELPER)
      : (partnerProfile?.name || "匿名ユーザー");
  const partnerMasked = isMyWish ? isHelperMasked : isMasked;

  return (
    <div className="mt-5 pt-5 pb-2 border-t border-slate-200">
      <div className="space-y-4">
        {/* Header and Avatar */}
        <div className="flex flex-col gap-3 px-1">
          <h4 className="text-sm font-bold text-slate-800 tracking-wide">
            {isMyWish ? MESSAGES.WISH_CARD.HDR_CONTACT_REQ : MESSAGES.WISH_CARD.HDR_CONTACT_HELP}
          </h4>

        </div>

        {/* Email and Action Area */}
        {contactEmail ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
              <span className="text-sm font-mono font-medium text-slate-700 tracking-tight break-all select-all">
                {contactEmail}
              </span>
              <button
                onClick={handleCopyEmail}
                className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                title={MESSAGES.WISH_CARD.BTN_COPY}
              >
                {isCopied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
              </button>
            </div>

            <a
              href={`mailto:${contactEmail}`}
              className="w-full py-2.5 bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 text-slate-800 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]"
            >
              <Mail className="w-4 h-4 text-slate-500" />
              {MESSAGES.WISH_CARD.BTN_MAIL}
            </a>
          </div>
        ) : (
          <span className="text-xs text-slate-500 italic px-1">{MESSAGES.WISH_CARD.TXT_NO_CONTACT}</span>
        )}

        {/* Memo Area */}
        {wish.contact_note && (
          <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 mt-2">
            <h4 className="text-[11px] font-bold text-slate-500 tracking-widest px-1">
              {isMyWish 
                ? `${partnerMasked ? MESSAGES.WISH_CARD.ANONYMOUS_HELPER : partnerName}${MESSAGES.WISH_CARD.HDR_MEMO_REQ}` 
                : MESSAGES.WISH_CARD.HDR_MEMO_HELP}
            </h4>
            <div className="text-sm text-slate-800 bg-slate-50/80 p-4 rounded-xl whitespace-pre-wrap leading-relaxed font-sans">
              {wish.contact_note}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
