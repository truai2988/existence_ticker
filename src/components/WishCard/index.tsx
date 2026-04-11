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
