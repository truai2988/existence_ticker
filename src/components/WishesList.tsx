import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Sparkles, Loader2, User, Handshake } from "lucide-react";
import { GratitudeTier } from '../types';
import { useWishActions } from '../hooks/useWishActions';
import { useWishes } from '../hooks/useWishes';
import { useProfile } from '../hooks/useProfile';
import { WishCard } from './WishCard';

import { WISH_COST, UNIT_LABEL } from '../constants';

type TierOption = {
  id: GratitudeTier;
  label: string;
  subLabel: string;
  cost: number;
  colorClass: string;
  shadowClass: string;
}

const TIERS: TierOption[] = [
  {
    id: "light",
    label: `Spark (${WISH_COST.SPARK} ${UNIT_LABEL})`,
    subLabel: "言葉・気づき",
    cost: WISH_COST.SPARK,
    colorClass:
      "text-gold-100 border-gold-500/30 bg-gold-900/10 hover:bg-gold-500/10",
    shadowClass: "hover:shadow-[0_0_15px_rgba(251,192,45,0.1)]",
  },
  {
    id: "medium",
    label: `Candle (${WISH_COST.CANDLE} ${UNIT_LABEL})`,
    subLabel: "実務・手助け",
    cost: WISH_COST.CANDLE,
    colorClass:
      "text-gold-100 border-gold-500/60 bg-gold-900/20 hover:bg-gold-500/20",
    shadowClass: "hover:shadow-[0_0_20px_rgba(251,192,45,0.25)]",
  },
  {
    id: "heavy",
    label: `Bonfire (${WISH_COST.BONFIRE} ${UNIT_LABEL})`,
    subLabel: "専門技術・献身",
    cost: WISH_COST.BONFIRE,
    colorClass:
      "text-white border-gold-400 bg-gold-900/40 hover:bg-gold-500/30",
    shadowClass:
      "shadow-[0_0_10px_rgba(251,192,45,0.2)] hover:shadow-[0_0_30px_rgba(251,192,45,0.5)]",
  },
];



type TabType = 'all' | 'mine' | 'accepted';

interface WishesListProps {
  currentUserId: string;
}

export const WishesList = ({ currentUserId }: WishesListProps) => {
  const { wishes } = useWishes();
  const { name } = useProfile();
  
  // Local state only for UI interactions, not data
  const [isMakingWish, setIsMakingWish] = useState(false);
  const [newWishContent, setNewWishContent] = useState('');
  const [selectedTier, setSelectedTier] = useState<GratitudeTier>('light');

  const [activeTab, setActiveTab] = useState<TabType>('all');
  
  const { castWish, acceptWish, isSubmitting } = useWishActions();

  // Handle Accept
  const handleAcceptWish = async (wishId: string) => {
      await acceptWish(wishId);
      // Data update is handled by onSnapshot in useWishes
  };

  const handlePostWish = async () => {
        if (!newWishContent.trim()) return;

        const result = await castWish({
            content: newWishContent,
            tier: selectedTier
        });

        if (result) {
            setIsMakingWish(false);
            setNewWishContent('');
            setSelectedTier('light');
            // Optimistic update is handled by onSnapshot in useWishes
        }
    };

  // Filter Logic
  const filteredWishes = wishes.filter(wish => {
      // Use real IDs
      
      if (activeTab === 'all') {
          return wish.status === 'open';
      }
      if (activeTab === 'mine') {
          return wish.requester_id === currentUserId;
      }
      if (activeTab === 'accepted') {
          return wish.status === 'in_progress' && (
              wish.helper_id === currentUserId || wish.requester_id === currentUserId
            );
      }
      return true;
  });

  // Render Logic for Contract Tab
  const renderContractTabContent = () => {
    const effectiveUserId = currentUserId;
    // 1. Quests (I help others)
    const myQuests = filteredWishes.filter(w => w.helper_id === effectiveUserId);
    // 2. Requests (Others help me)
    const myRequests = filteredWishes.filter(w => w.requester_id === effectiveUserId);

    if (myQuests.length === 0 && myRequests.length === 0) {
      return (
        <div className="text-center py-20 px-6 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
          <p className="text-slate-500 text-sm">現在進行中の契約はありません。</p>
        </div>
      );
    }

    return (
      <div className="space-y-8 animate-in fade-in">
        
        {/* Section A: Quests (You Help) */}
        {myQuests.length > 0 && (
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-xs font-bold text-yellow-500 uppercase tracking-widest pl-1">
              <Handshake className="w-4 h-4" />
              遂行中のクエスト
            </h3>
            {myQuests.map(wish => (
                <motion.div
                    key={wish.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-full max-w-[350px] mx-auto"
                >
                  <WishCard 
                    wish={wish} 
                    currentUserId={effectiveUserId} 
                    onAccept={handleAcceptWish} 
                  />
              </motion.div>
            ))}
          </div>
        )}

        {/* Section B: Requests (You rely on others) */}
        {myRequests.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 pl-1 border-b border-slate-800 pb-1 mb-2 mt-6">
              <User className="w-4 h-4 text-slate-400" />
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                進行中の依頼 (待機中)
              </h3>
            </div>
            
            {myRequests.map(wish => (
                <motion.div
                    key={wish.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-full max-w-[350px] mx-auto opacity-80 hover:opacity-100 transition-opacity"
                >
                 <WishCard 
                   wish={wish} 
                   currentUserId={effectiveUserId} 
                   onAccept={handleAcceptWish} 
                 />
                 <p className="text-[10px] text-center text-green-500 mt-2 font-mono flex items-center justify-center gap-1">
                   <Loader2 className="w-3 h-3 animate-spin" />
                   担当者が決定しました。作業完了を待ってください。
                 </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col relative pb-24">
      {/* Header / Tab Navigation */}
      <div className="p-4 bg-slate-950/80 backdrop-blur-md border-b border-t border-slate-900 sticky top-0 z-30 shadow-lg shrink-0">
          <div className="flex justify-between items-center mb-4 px-2">
            <h2 className="text-xl font-serif text-gold-400 tracking-widest flex items-center gap-2">
                <Sparkles size={18} />
                <span>WISHES</span>
            </h2>
             {/* No Close Button */}
          </div>

          <div className="flex gap-1 bg-slate-900/50 p-1 rounded-xl border border-slate-800">
            <button
            onClick={() => setActiveTab('all')}
            className={`
                flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition-all duration-300
                ${activeTab === 'all' 
                ? 'bg-slate-800 text-yellow-400 shadow-sm ring-1 ring-yellow-500/20' 
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'
                }
            `}
            >
            <Sparkles className="w-3.5 h-3.5" />
            <span>星々</span>
            </button>

            <button
            onClick={() => setActiveTab('mine')}
            className={`
                flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition-all duration-300
                ${activeTab === 'mine' 
                ? 'bg-slate-800 text-yellow-400 shadow-sm ring-1 ring-yellow-500/20' 
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'
                }
            `}
            >
            <User className="w-3.5 h-3.5" />
            <span>私の願い</span>
            </button>

            <button
            onClick={() => setActiveTab('accepted')}
            className={`
                flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition-all duration-300
                ${activeTab === 'accepted' 
                ? 'bg-slate-800 text-yellow-400 shadow-sm ring-1 ring-yellow-500/20' 
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'
                }
            `}
            >
            <Handshake className="w-3.5 h-3.5" />
            <span>契約中</span>
            </button>
          </div>
      </div>

      {/* Main Content: Wish List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 relative">
        
        {activeTab === 'accepted' ? (
            renderContractTabContent()
        ) : (
            filteredWishes.length === 0 ? (
                <div className="text-center py-20 px-6 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
                <p className="text-slate-500 text-sm mb-2">
                    {activeTab === 'all' && '現在、輝く星は見当たりません。'}
                    {activeTab === 'mine' && 'あなたはまだ願いを放っていません。'}
                </p>
                {activeTab === 'mine' && (
                    <p className="text-xs text-slate-600">
                    右下のボタンから、最初の願いを灯してみましょう。
                    </p>
                )}
                </div>
            ) : (
                filteredWishes.map((wish, index) => (
                    <motion.div
                    key={wish.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="w-full max-w-[350px] mx-auto mb-4"
                    >
                        <WishCard 
                            wish={wish} 
                            currentUserId={currentUserId} 
                            onAccept={async (id) => handleAcceptWish(id)}
                        />
                    </motion.div>
                ))
            )
        )}
      </div>

      {/* Make a Wish Mode (Modal) */}
      <AnimatePresence>
        {isMakingWish && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -300, scale: 0.8, transition: { duration: 0.8 } }}
            className="fixed inset-0 bg-black/95 z-[200] flex flex-col p-6 pt-20 overflow-hidden"
          >
            <button
              onClick={() => setIsMakingWish(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10"
            >
              <X size={24} className="text-gray-500" />
            </button>

            <h3 className="text-xl font-serif text-white/90 mb-8 text-center">
              星に願いを灯す
            </h3>

            <div className="flex-grow overflow-y-auto overflow-x-hidden p-1 space-y-8 max-w-lg mx-auto w-full no-scrollbar">
               {/* Input Section */}
               <div className="space-y-4">
                  <p className="text-gray-400 text-sm leading-relaxed font-serif">
                       <span className="text-gold-200 font-semibold underline decoration-gold-600 underline-offset-4">
                           私 ({name})
                       </span> は、以下のことについて<br/>
                       <span className="text-white font-medium">
                           力を貸してくれる人を探しています。
                       </span>
                  </p>
                                    
                  <div className="relative">
                      <textarea
                        value={newWishContent}
                        onChange={(e) => setNewWishContent(e.target.value)}
                        placeholder="例：引っ越しの荷造りを手伝ってほしい、Reactのバグについて相談したい..."
                        className="w-full bg-gray-900/50 text-gray-100 placeholder:text-gray-600 text-lg p-4 rounded-xl border border-white/10 focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50 transition-all resize-none outline-none h-32"
                        autoFocus
                      />
                  </div>
               </div>
               
               {/* Reward Selector Section */}
               <div className="space-y-3">
                   <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                       <label className="text-gray-400 text-sm font-serif">
                           Life to Give (譲渡する命)
                       </label>
                        
                       {/* Payment Explanation */}
                       <div className="flex items-center gap-1.5 bg-gray-900/50 px-2 py-1 rounded border border-white/10 w-fit">
                           <div className="w-1.5 h-1.5 rounded-full bg-gold-400 shadow-[0_0_5px_rgba(251,192,45,0.8)]" />
                           <span className="text-[10px] text-gray-400 leading-tight">
                               あなたの<span className="text-gold-200">Life (寿命)</span>を分け与えます
                           </span>
                       </div>
                   </div>
                    
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                       {TIERS.map((tier) => (
                           <button
                             key={tier.id}
                             onClick={() => setSelectedTier(tier.id)}
                             className={`
                                 relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-300 group
                                 ${selectedTier === tier.id
                                     ? `${tier.colorClass} ring-1 ring-gold-500/50 scale-[1.02] ${tier.shadowClass}`
                                     : "border-white/10 bg-gray-900/20 text-gray-500 hover:border-gray-700"
                                 }
                             `}
                           >
                             <span className={`text-sm font-serif mb-1 ${selectedTier === tier.id ? "opacity-100" : "opacity-70"}`}>
                               {tier.label}
                             </span>

                             <span className="text-[10px] text-opacity-80 mb-2 font-sans tracking-tight">
                               {tier.subLabel}
                             </span>

                             <span className={`text-lg font-bold font-mono ${selectedTier === tier.id ? "text-gold-400" : "text-gray-600"}`}>
                               {tier.cost}{" "}
                               <span className="text-xs font-normal">{UNIT_LABEL}</span>
                             </span>

                             {selectedTier === tier.id && (
                               <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-gold-400 shadow-[0_0_8px_rgba(251,192,45,0.8)]" />
                             )}
                           </button>
                       ))}
                   </div>
               </div>

               <button 
                   onClick={handlePostWish}
                   disabled={!newWishContent.trim() || isSubmitting}
                   className="w-full py-4 rounded-full bg-gold-900/20 border border-gold-400/30 text-gold-200 font-serif text-lg hover:bg-gold-400/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group relative overflow-hidden"
               >
                   {isSubmitting ? (
                       <>
                           <Loader2 className="w-5 h-5 text-gold-200 animate-spin" />
                           <span className="text-gold-100 font-medium tracking-wider">
                               詠唱中...
                           </span>
                           <div className="absolute inset-0 bg-gold-500/10 animate-pulse" />
                       </>
                   ) : (
                       <>
                           <Sparkles size={20} className="group-hover:text-white transition-colors" />
                           <span>空へ放つ</span>
                       </>
                   )}
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB: Create Wish */}
      {!isMakingWish && (
        <motion.button
          layoutId="create-wish-fab"
          onClick={() => setIsMakingWish(true)}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-gradient-to-tr from-yellow-600 to-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.4)] flex items-center justify-center text-white hover:scale-110 hover:text-white transition-all z-40"
        >
          <Plus size={28} />
        </motion.button>
      )}
    </div>
  );
};
