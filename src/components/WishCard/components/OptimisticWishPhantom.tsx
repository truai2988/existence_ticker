import React from "react";
import { AlertTriangle, Trash2, Send, Loader2 } from "lucide-react";
import { useWishesContext } from "../../../contexts/WishesContext";
import { Wish } from "../../../types";
import { MESSAGES } from "../../../constants/messages";

export const OptimisticWishPhantom: React.FC<{ wish: Wish }> = ({ wish }) => {
  const { removeOptimisticWish } = useWishesContext();

  const onDismissError = () => {
    removeOptimisticWish(wish.id);
  };

  if (wish.error) {
    return (
      <div className="relative bg-white border-2 border-red-200 rounded-2xl p-6 overflow-hidden">
        <div className="flex items-start gap-2 mb-4 text-red-600">
          <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" />
          <div className="flex-grow">
            <span className="text-base font-bold font-sans">{MESSAGES.WISH_CARD.PH_ERROR_TITLE}</span>
            <p className="text-sm text-red-500 mt-0.5 whitespace-pre-wrap">{wish.content}</p>
          </div>
        </div>
        {wish.error && (
          <div className="mt-4 p-3 bg-red-500/10 rounded border border-red-500/20">
            <p className="text-sm text-red-500 font-medium font-sans">{MESSAGES.WISH_CARD.PH_ERROR_REASON}{wish.error}</p>
          </div>
        )}
        <button
          onClick={onDismissError}
          className="mt-4 w-full py-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold font-sans rounded transition-colors flex items-center justify-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          {MESSAGES.WISH_CARD.PH_TRASH}
        </button>
        <p className="text-sm text-slate-600 mt-3 text-center font-sans">{MESSAGES.WISH_CARD.PH_CAUTION}</p>
      </div>
    );
  }

  return (
    <div className="relative bg-slate-50/50 border border-slate-200 rounded-2xl p-6 overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm z-10 rounded-xl">
        <div className="flex flex-col items-center text-slate-500">
          <Send className="w-6 h-6 animate-bounce mb-2" />
          <span className="text-sm font-bold tracking-wider font-sans">{MESSAGES.WISH_CARD.PH_SENDING}</span>
        </div>
      </div>
      <div className="space-y-3 mb-6">
        <div className="h-4 w-full bg-slate-100 rounded" />
        <div className="h-4 w-5/6 bg-slate-100 rounded" />
      </div>
      <div className="h-10 w-full bg-slate-200 rounded-xl" />
      <div className="absolute top-4 right-6 flex items-center gap-1.5 text-slate-600 text-sm font-bold uppercase tracking-widest font-sans">
        <Loader2 size={12} className="animate-spin" />
        {MESSAGES.WISH_CARD.PH_SENDING}
      </div>
    </div>
  );
};
