import React from "react";
import { Megaphone, Check, Copy, Mail } from "lucide-react";
import { WishCardState, WishCardHandlers } from "../types";

export const CardContact: React.FC<{ state: WishCardState; handlers: WishCardHandlers }> = ({ state, handlers }) => {
  const { wish, isReadOnly, isMyWish, currentUserId, contactEmail, isCopied, requesterProfile } = state;
  const { handleCopyEmail } = handlers;

  if (wish.status !== "in_progress" || isReadOnly || (!isMyWish && wish.helper_id !== currentUserId)) {
    return null;
  }

  const mailtoLink = state.mailtoLink;

  return (
    <div className="relative mb-4 p-4 border border-slate-200 rounded-xl bg-slate-50/30">
      <div className="space-y-3 mt-1">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-1">
            <Megaphone size={14} className="text-slate-400" />
            <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">
              {isMyWish ? "相手の連絡先" : "依頼主の連絡先"}
            </span>
          </div>
          {contactEmail ? (
            <div className="bg-white border border-slate-200 rounded-lg p-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-sm font-mono font-bold text-slate-700 break-all select-all">
                  {contactEmail}
                </span>
                <button
                  onClick={handleCopyEmail}
                  className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-md transition-colors shrink-0"
                  title="アドレスをコピー"
                >
                  {isCopied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                </button>
              </div>

              <a
                href={mailtoLink}
                className="flex items-center justify-center gap-2 w-full py-3 text-base font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-md transition-colors group"
              >
                <Mail size={16} className="text-slate-400 group-hover:text-slate-600" />
                メールを作成する
              </a>
            </div>
          ) : (
            <span className="text-xs text-slate-500 italic">連絡先は設定されていません</span>
          )}
        </div>

        {wish.contact_note && (
          <div className="flex flex-col gap-1 pt-2 border-t border-slate-100">
            <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">
              {isMyWish ? `${requesterProfile?.name || '自分'}さんのメモ` : "依頼者さんより"}
            </span>
            <p className="text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-100 whitespace-pre-wrap">
              {wish.contact_note}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
