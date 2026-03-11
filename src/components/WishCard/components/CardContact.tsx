import React from "react";
import { Copy, Mail, Check } from "lucide-react";
import { useLanguage } from "../../../contexts/LanguageContext";
import { WishCardState, WishCardHandlers } from "../types";

export const CardContact: React.FC<{ state: WishCardState; handlers: WishCardHandlers }> = ({ state, handlers }) => {
  const { t: MESSAGES } = useLanguage();
  const { wish, isReadOnly, isMyWish, currentUserId, contactEmail, isCopied, requesterProfile } = state;
  const { handleCopyEmail } = handlers;

  if (wish.status !== "in_progress" || isReadOnly || (!isMyWish && wish.helper_id !== currentUserId)) {
    return null;
  }

  return (
    <div className="relative mb-4 p-4 border border-slate-200 rounded-xl bg-slate-50/30">
      <div className="space-y-3 mt-1">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-3">
            <h4 className="text-sm font-bold text-slate-700">
              {isMyWish ? MESSAGES.WISH_CARD.HDR_CONTACT_REQ : MESSAGES.WISH_CARD.HDR_CONTACT_HELP}
            </h4>
          </div>
          {contactEmail ? (
            <div className="bg-white border border-slate-200 rounded-lg p-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-sm font-mono font-bold text-slate-700 break-all select-all">
                  {contactEmail}
                </span>
                <button
                  onClick={handleCopyEmail}
                  className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                  title={MESSAGES.WISH_CARD.BTN_COPY}
                >
                  {isCopied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                </button>
              </div>

              <a
                href={`mailto:${contactEmail}`}
                className="mt-3 w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 text-sm font-bold rounded-lg border border-slate-200 transition-colors flex items-center justify-center gap-2"
              >
                <Mail className="w-4 h-4" />
                {MESSAGES.WISH_CARD.BTN_MAIL}
              </a>
            </div>
          ) : (
            <span className="text-xs text-slate-500 italic">{MESSAGES.WISH_CARD.TXT_NO_CONTACT}</span>
          )}
        </div>

        {wish.contact_note && (
          <div className="flex flex-col gap-2">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              {isMyWish ? `${requesterProfile?.name || MESSAGES.WISH_CARD.LBL_MYSELF}${MESSAGES.WISH_CARD.HDR_MEMO_REQ}` : MESSAGES.WISH_CARD.HDR_MEMO_HELP}
            </h4>
            <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 whitespace-pre-wrap leading-relaxed shadow-inner font-sans">
              {wish.contact_note}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
