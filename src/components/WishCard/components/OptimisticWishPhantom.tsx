import React from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { useWishesContext } from "../../../contexts/WishesContext";
import { Wish } from "../../../types";

export const OptimisticWishPhantom: React.FC<{ wish: Wish }> = ({ wish }) => {
  const { removeOptimisticWish } = useWishesContext();

  if (wish.error) {
    return (
      <div className="relative bg-white border-2 border-red-200 rounded-2xl p-6 shadow-sm overflow-hidden animate-in fade-in duration-300">
        <div className="flex items-center gap-2 mb-4 text-red-600">
          <AlertTriangle size={20} />
          <span className="text-base font-bold font-sans">通信エラー: 願いが届きませんでした</span>
        </div>
        <p className="text-slate-600 text-base mb-6 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 font-sans">
          {wish.content}
        </p>
        <div className="flex flex-col gap-3">
          <p className="text-xs text-red-400 font-medium font-sans">理由: {wish.error}</p>
          <button
            onClick={() => removeOptimisticWish(wish.id)}
            className="w-full py-3 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 size={14} />
            この内容を消去する
          </button>
          <p className="text-xs text-slate-500 text-center font-sans">※このお願いのLm予約はすでに解除されています</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-slate-50/50 border border-slate-200 rounded-2xl p-6 overflow-hidden animate-pulse">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-slate-200" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-32 bg-slate-200 rounded" />
          <div className="h-3 w-48 bg-slate-100 rounded" />
        </div>
      </div>
      <div className="space-y-3 mb-6">
        <div className="h-4 w-full bg-slate-100 rounded" />
        <div className="h-4 w-5/6 bg-slate-100 rounded" />
      </div>
      <div className="h-10 w-full bg-slate-200 rounded-xl" />
      <div className="absolute top-4 right-6 flex items-center gap-1.5 text-slate-500 text-xs font-bold uppercase tracking-widest font-sans">
        <Loader2 size={12} className="animate-spin" />
        伝搬中...
      </div>
    </div>
  );
};
