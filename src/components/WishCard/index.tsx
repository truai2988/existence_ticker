import React from "react";
import { WishCardProps } from "./types";
import { useWishCard } from "./hooks/useWishCard";
import { OptimisticWishPhantom } from "./components/OptimisticWishPhantom";
import { CardHeader } from "./components/CardHeader";
import { CardContent } from "./components/CardContent";
import { CardContact } from "./components/CardContact";
import { CardFooter } from "./components/CardFooter";
import { CardModals } from "./components/CardModals";

export const WishCard: React.FC<WishCardProps> = (props) => {
  const { state, handlers } = useWishCard(props);

  if (state.wish.isOptimistic) {
    return (
      <div id={`wish-${state.wish.id}`} className="scroll-mt-32">
        <OptimisticWishPhantom wish={state.wish} />
      </div>
    );
  }

  if (props.variant === "notice") {
    return (
      <div id={`wish-${state.wish.id}`} data-wish-id={state.wish.id} className="scroll-mt-32 w-full flex flex-col gap-6 sm:gap-8">
        {/* 1. 最上部（メッセージ） */}
        {props.noticeMessage && (
          <div className="px-2 pt-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight leading-snug">
              {props.noticeMessage}
            </h2>
          </div>
        )}

        {/* 2. 中部（ネクストアクション） */}
        {!state.wish.isSnapshot && (
          <div className="w-full">
            <CardFooter state={state} handlers={handlers} />
          </div>
        )}

        {/* 3. 下部（参照用カード） */}
        <div className={`relative bg-slate-50 border border-slate-200 rounded-[2rem] py-6 px-5 sm:p-6 transition-all overflow-hidden ${state.wish.isSnapshot ? 'grayscale-[0.5]' : ''}`}>
          <div className="opacity-80 pointer-events-none select-none">
             <CardHeader state={state} handlers={handlers} />
             <CardContent state={state} handlers={handlers} />
          </div>
          <div className={state.wish.isSnapshot ? 'opacity-20 blur-[2px] pointer-events-none' : ''}>
            <CardContact state={state} handlers={handlers} />
          </div>
          
          {/* CardModalsは必要（CardFooterから呼び出されるモーダル用） */}
          {!state.wish.isSnapshot && <CardModals state={state} handlers={handlers} />}

          {state.wish.isSnapshot && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/30 backdrop-blur-[2px]">
                <div className="bg-white/95 backdrop-blur-md px-6 py-4 rounded-2xl shadow-lg border border-slate-200 text-center mx-6 animate-in fade-in zoom-in-95 duration-500 delay-150">
                   <p className="text-slate-700 text-[13px] sm:text-sm font-bold tracking-wide leading-relaxed">
                     この願いはお役目を終えましたが、<br/>手を挙げてくれた温かい気持ちに<br className="sm:hidden"/>感謝します
                   </p>
                </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div id={`wish-${state.wish.id}`} data-wish-id={state.wish.id} className={`scroll-mt-32 relative bg-white shadow border border-slate-200 rounded-[2rem] p-6 transition-all group overflow-hidden ${state.wish.isSnapshot ? 'grayscale-[0.5]' : ''}`}>
      <CardHeader state={state} handlers={handlers} />
      <CardContent state={state} handlers={handlers} />
      
      <div className={state.wish.isSnapshot ? 'opacity-20 pointer-events-none blur-[2px]' : ''}>
        <CardContact state={state} handlers={handlers} />
        <CardFooter state={state} handlers={handlers} />
      </div>
      
      {!state.wish.isSnapshot && <CardModals state={state} handlers={handlers} />}

      {state.wish.isSnapshot && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/30 backdrop-blur-[2px]">
            <div className="bg-white/95 backdrop-blur-md px-6 py-4 rounded-2xl shadow-lg border border-slate-200 text-center mx-6 animate-in fade-in zoom-in-95 duration-500 delay-150">
               <p className="text-slate-700 text-[13px] sm:text-sm font-bold tracking-wide leading-relaxed">
                 この願いはお役目を終えましたが、<br/>手を挙げてくれた温かい気持ちに<br className="sm:hidden"/>感謝します
               </p>
            </div>
        </div>
      )}
    </div>
  );
};

export { WishCard as default };
