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
    return <OptimisticWishPhantom wish={state.wish} />;
  }

  return (
    <div className="relative bg-white shadow border border-slate-200 rounded-[2rem] p-6 transition-all group overflow-hidden">
      <CardHeader state={state} handlers={handlers} />
      <CardContent state={state} handlers={handlers} />
      <CardContact state={state} handlers={handlers} />
      <CardFooter state={state} handlers={handlers} />
      <CardModals state={state} handlers={handlers} />
    </div>
  );
};

export { WishCard as default };
