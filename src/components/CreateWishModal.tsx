import React, { useState, useEffect } from 'react';
import { Loader2, Send } from 'lucide-react';
import { GuideModal } from './GuideModal';
import { useWishActions } from '../hooks/useWishActions';
import { useWallet } from '../hooks/useWallet';
import { GratitudeTier, SeedPlaceholder } from '../types';
import { db } from '../lib/firebase';
import { WISH_COST, UNIT_LABEL } from '../constants';
import { useToast } from '../contexts/ToastContext';

type TierOption = {
  id: GratitudeTier;
  label: string;
  subLabel: string;
  cost: number;
}

const TIERS: TierOption[] = [
  {
    id: "heavy",
    label: "人生の節目",
    subLabel: "大切な局面を、共に歩んでほしいとき",
    cost: WISH_COST.BONFIRE,
  },
  {
    id: "medium",
    label: "日常の手助け",
    subLabel: "暮らしのなかの、ささやかな支え合いに",
    cost: WISH_COST.CANDLE,
  },
  {
    id: "light",
    label: "魂の共鳴",
    subLabel: "損得を超えた、純粋な繋がりを求めて",
    cost: WISH_COST.SPARK,
  },
];
const TIER_MAP: Record<GratitudeTier, 1000 | 500 | 0> = {
  heavy: 1000,
  medium: 500,
  light: 0
};

const FALLBACK_PLACEHOLDER = "あなたの今の願いを、静かに綴ってください";

// Session-level cache for seeds
let cachedSeeds: SeedPlaceholder[] | null = null;

interface CreateWishModalProps {
    onClose: () => void;
}

export const CreateWishModal: React.FC<CreateWishModalProps> = ({ onClose }) => {
    const { availableLm } = useWallet();
    const { castWish, isSubmitting } = useWishActions();
    const { showToast } = useToast();
    
    const [newWishContent, setNewWishContent] = useState('');
    const [selectedTier, setSelectedTier] = useState<GratitudeTier>('heavy');
    const [currentPlaceholder, setCurrentPlaceholder] = useState(FALLBACK_PLACEHOLDER);
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [showGuide, setShowGuide] = useState(false);

    // Fetch seeds and set initial placeholder
    useEffect(() => {
        const loadSeeds = async () => {
            if (cachedSeeds) {
                updatePlaceholder(selectedTier, cachedSeeds);
                return;
            }

            try {
                if (!db) throw new Error("Database not initialized");
                const { collection, getDocs } = await import('firebase/firestore');
                const snap = await getDocs(collection(db, 'seed_placeholders'));
                const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SeedPlaceholder[];
                cachedSeeds = fetched;
                updatePlaceholder(selectedTier, fetched);
            } catch (e) {
                console.error("Failed to load seeds, using fallback", e);
            }
        };
        loadSeeds();
    }, [selectedTier]);

    const updatePlaceholder = (tier: GratitudeTier, seedsList: SeedPlaceholder[]) => {
        const numericTier = TIER_MAP[tier];
        const tierSeeds = seedsList.filter(s => s.tier === numericTier);
        if (tierSeeds.length > 0) {
            const random = tierSeeds[Math.floor(Math.random() * tierSeeds.length)];
            setCurrentPlaceholder(`例えば：\n${random.content}`);
        } else {
            setCurrentPlaceholder(FALLBACK_PLACEHOLDER);
        }
    };

    // Update placeholder when tier changes (if content is empty or placeholder was recently refreshed)
    const handleTierChange = (tier: GratitudeTier) => {
        setSelectedTier(tier);
        if (!newWishContent.trim() && cachedSeeds) {
            updatePlaceholder(tier, cachedSeeds);
        }
    };

    const selectedTierCost = TIERS.find(t => t.id === selectedTier)?.cost || 0;
    const exceedsAvailable = selectedTierCost > availableLm;

    const handlePostWish = async () => {
        if (!newWishContent.trim()) return;
        if (exceedsAvailable) return; // Double-check

        const result = await castWish({
            content: newWishContent,
            tier: selectedTier,
            isAnonymous
        });

        if (result) {
            showToast("願いをシェアしました", "success");
            import('../utils/pwaEvent').then(({ globalTriggerPWAInstall }) => {
                globalTriggerPWAInstall();
            });
            onClose();
        }
    };

    return (
        <div className="w-full">
            <div className="max-w-2xl mx-auto py-4 space-y-10">
               
                {/* Reward Selector Section - MOVED TO TOP */}
               <div className="space-y-4">
                   <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 px-1">
                       <div className="flex items-baseline flex-wrap gap-x-3 gap-y-1">
                           <label className="text-xs uppercase tracking-widest font-bold text-slate-500 shrink-0">
                               お裾分けする Lm <span className="text-xs font-normal text-slate-500 ml-0.5">(源気)</span>
                           </label>
                           <button 
                             type="button"
                             onClick={() => setShowGuide(true)}
                             className="text-xs text-slate-500 font-medium hover:text-indigo-600 underline underline-offset-4 transition-colors whitespace-nowrap"
                           >
                             お裾分けの目安とお作法
                           </button>
                       </div>
                       <span className="self-start sm:self-center text-xs font-bold text-amber-600 bg-amber-50/50 px-3 py-1 rounded-full border border-amber-100/50 tracking-wider">
                           感謝としてお贈りします
                       </span>
                   </div>
                    
                   <GuideModal isOpen={showGuide} onClose={() => setShowGuide(false)} />
                    
                   {/* Available Info */}
                   <p className="text-xs text-slate-500 mb-2">
                       現在分かち合えるのは <span className="font-mono font-bold text-amber-600">{Math.floor(availableLm).toLocaleString()} {UNIT_LABEL}</span> までです
                   </p>

                   {/* Warning if exceeds */}
                   {exceedsAvailable && (
                       <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-xs text-orange-800 leading-relaxed">
                           分かち合える分（ゆとり）がありません。今の約束（募集中の願い）を整理してください
                       </div>
                   )}
                    
                   <div className="grid grid-cols-1 gap-3">
                       {TIERS.map((tier) => (
                           <button
                             key={tier.id}
                             onClick={() => handleTierChange(tier.id)}
                             className={`
                                 relative flex items-center justify-between p-4 rounded-xl border transition-all duration-500
                                 ${selectedTier === tier.id
                                     ? tier.cost === 1000
                                       ? "border-[#B8860B] bg-white shadow-[0_10px_30px_-5px_rgba(184,134,11,0.2)] ring-1 ring-[#B8860B]/20"
                                       : tier.cost === 500
                                         ? "border-[#8B4513] bg-gradient-to-r from-amber-50/50 to-white shadow-[0_8px_20px_-4px_rgba(139,69,19,0.15)] ring-1 ring-[#8B4513]/10"
                                         : "border-pink-100 bg-white shadow-[0_4px_15px_-3px_rgba(244,114,182,0.1)] ring-1 ring-pink-50 animate-pulse-subtle"
                                     : "border-slate-100 bg-white text-slate-500 hover:border-slate-200"
                                 }
                             `}
                           >
                             <div className="flex flex-col items-start gap-1">
                               <span className={`text-base font-bold tracking-wide ${selectedTier === tier.id 
                                 ? tier.cost === 1000 ? "text-slate-900" : tier.cost === 500 ? "text-[#8B4513]" : "text-pink-900" 
                                 : "text-slate-600"}`}>
                                 {tier.label}
                               </span>
                               <span className="text-xs text-slate-500 font-bold uppercase tracking-tighter opacity-70">
                                 {tier.subLabel}
                               </span>
                             </div>

                             <div className="flex items-center gap-4">
                                 <span className={`text-3xl font-mono font-bold tracking-tighter ${selectedTier === tier.id 
                                   ? tier.cost === 1000 ? "text-[#B8860B]" : tier.cost === 500 ? "text-amber-700" : "text-pink-400" 
                                   : "text-slate-200"}`}>
                                   {tier.cost === 0 ? "∞" : tier.cost.toLocaleString()} <span className="text-xs font-sans font-bold opacity-60 uppercase">{tier.cost === 0 ? "Gift" : UNIT_LABEL}</span>
                                 </span>
                             </div>
                             
                             {/* Breathing Glow for 0 Lm */}
                             {selectedTier === tier.id && tier.cost === 0 && (
                               <div className="absolute inset-0 rounded-xl bg-pink-100/10 animate-soft-glow pointer-events-none" />
                             )}
                           </button>
                       ))}
                   </div>
                </div>

               {/* Input Section */}
               <div className="space-y-4">
                  <label className="block text-xs uppercase tracking-widest font-bold text-slate-500 font-sans">
                      内容を入力
                  </label>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 focus-within:ring-2 focus-within:ring-orange-200/30 transition-all duration-500">
                      <textarea
                        value={newWishContent}
                        onChange={(e) => setNewWishContent(e.target.value)}
                        placeholder={currentPlaceholder}
                        className="w-full bg-transparent text-slate-800 placeholder:text-slate-400 text-base min-h-[160px] resize-none outline-none leading-relaxed font-serif tracking-wide"
                      />
                  </div>
               </div>

               {/* Anonymous Option */}
               <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100">
                   <label className="flex items-start gap-4 cursor-pointer group">
                       <div className="relative flex items-center mt-0.5">
                           <input
                               type="checkbox"
                               className="peer sr-only"
                               checked={isAnonymous}
                               onChange={(e) => setIsAnonymous(e.target.checked)}
                           />
                           <div className="w-5 h-5 border-2 border-slate-200 rounded transition-all peer-checked:bg-slate-800 peer-checked:border-slate-800 bg-white" />
                           <svg
                               className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"
                               fill="none"
                               viewBox="0 0 24 24"
                               stroke="currentColor"
                               strokeWidth="3"
                           >
                               <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                           </svg>
                       </div>
                       <div className="flex-1">
                           <span className={`text-base font-bold transition-colors ${isAnonymous ? "text-slate-800" : "text-slate-500"}`}>
                               匿名でお願いする
                           </span>
                           <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                               ※相談がまとまる（進行中になる）まで、お互いの名前やアイコンは表示されません
                           </p>
                       </div>
                   </label>
               </div>

               {/* Action Button */}
               <div className="pt-4">
                    <button 
                        onClick={handlePostWish}
                        disabled={!newWishContent.trim() || isSubmitting || exceedsAvailable}
                        className="w-full py-5 rounded-full bg-slate-900 text-white font-bold text-base shadow-lg hover:bg-slate-800 hover:shadow-xl active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                                <span className="tracking-widest">送信中...</span>
                            </>
                        ) : (
                            <>
                                <Send size={18} />
                                <span className="tracking-widest">みんなに想いを届ける</span>
                            </>
                        )}
                    </button>
               </div>
            </div>
        </div>
    );
};


