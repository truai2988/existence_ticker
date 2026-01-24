import React, { useState } from 'react';
import { Handshake, Loader2, Clock, User } from 'lucide-react';
import { Wish } from '../types';
import { calculateLifePoints } from '../utils/decay';

interface WishCardProps {
  wish: Wish;
  currentUserId: string;
  onAccept: (wishId: string) => Promise<void>;
}

export const WishCard: React.FC<WishCardProps> = ({ wish, currentUserId, onAccept }) => {
  const [isLoading, setIsLoading] = useState(false);
  
  // Anti-Gravity: Universal Decay Logic
  // const DECAY_RATE = 1; // Moved to utils/decay.ts
  const [displayValue, setDisplayValue] = useState(0);

  // Derived initial cost
  const getInitialCost = (tier: string) => {
      switch(tier) {
          case 'light': return 100;
          case 'medium': return 500;
          case 'heavy': return 1000;
          default: return wish.cost || 0;
      }
  };
  const initialCost = wish.cost || getInitialCost(wish.gratitude_preset);

  // Effect: Tick decay every second
  React.useEffect(() => {
    // Shared Decay Logic from Utils
    const updateValue = () => {
        const val = calculateLifePoints(initialCost, wish.created_at);
        setDisplayValue(val);
    };

    updateValue(); // Initial

    const timer = setInterval(updateValue, 1000);
    return () => clearInterval(timer);
  }, [wish.created_at, initialCost]);

  const isMyWish = wish.requester_id === currentUserId;

  const handlePress = async () => {
    if (!confirm('この願いを引き受けますか？（この操作は取り消せません）')) {
      return;
    }
    setIsLoading(true);
    await onAccept(wish.id);
    setIsLoading(false);
  };

  // Format Date safely
  const formatDate = (val: string | { toDate?: () => Date } | Date | undefined) => {
      if (!val) return 'Just now';
      if (typeof val === 'string') return new Date(val).toLocaleDateString();
      if ('toDate' in val && typeof val.toDate === 'function') return val.toDate().toLocaleDateString();
      return 'Unknown';
  };

  return (
    <div className="relative group bg-slate-900/40 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 transition-all duration-300">
      
      {/* Glow Effect (Hover時) */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />

      {/* Header: User & Meta */}
      <div className="relative flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
            <User className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <span className="block text-sm font-serif text-slate-200 tracking-wide">
              {wish.requester_name || wish.requester_id.slice(0, 8)} 
            </span>
            <span className="flex items-center gap-1 text-[10px] text-slate-500">
              <Clock className="w-3 h-3" />
              <span>{formatDate(wish.created_at)}</span>
            </span>
          </div>
        </div>
        
        {/* Reward Badge (Cost) */}
        <div className="text-right">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">CURRENT VALUE</div>
          <div className={`text-xl font-mono font-bold text-shadow-sm transition-colors duration-500 ${displayValue === 0 ? 'text-gray-600' : 'text-yellow-500/90'}`}>
            {displayValue} <span className="text-sm font-normal text-yellow-500/50">Pt</span>
          </div>
          {displayValue < initialCost && (
             <div className="text-[9px] text-red-400/60 font-mono text-right mt-0.5">
                 Decaying from {initialCost}
             </div>
          )}
        </div>
      </div>

      {/* Body: Content */}
      <div className="relative mb-6">
        <p className="text-slate-300 text-base leading-relaxed font-light font-serif">
          {wish.content}
        </p>
      </div>

      {/* Footer: Action Button */}
      {!isMyWish && (
         <div className="relative pt-4 border-t border-slate-800/50 flex justify-end w-full">
            {wish.status === 'open' ? (
                <button
                    onClick={handlePress}
                    disabled={isLoading || displayValue === 0}
                    className="
                    flex items-center gap-2 px-6 py-2.5 rounded-full 
                    border border-slate-600 bg-slate-900/50
                    hover:bg-slate-800 hover:border-slate-400 hover:text-white
                    text-slate-400 text-sm font-medium transition-all 
                    active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                    "
                >
                    {isLoading ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>処理中...</span>
                    </>
                    ) : (
                    <>
                        <Handshake className="w-4 h-4" />
                        <span>引き受ける</span>
                    </>
                    )}
                </button>
            ) : (
                <div className="flex items-center gap-2 text-[10px] text-gold-400/80 font-serif border border-gold-500/20 px-3 py-1 rounded-full bg-gold-900/10 cursor-default">
                    {wish.status === 'fulfilled' ? (
                        <span>成就済み (Fulfilled)</span>
                    ) : (
                        <span>対応中 (In Progress)</span>
                    )}
                </div>
            )}
        </div>
      )}
    </div>
  );
};
