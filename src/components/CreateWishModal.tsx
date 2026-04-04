import React, { useState, useEffect } from 'react';
import { Loader2, Send } from 'lucide-react';
import { useWishActions } from '../hooks/useWishActions';
import { useWallet } from '../hooks/useWallet';
import { GratitudeTier, SeedPlaceholder } from '../types';
import { db } from '../lib/firebase';
import { WISH_COST, UNIT_LABEL } from '../constants';
import { useToast } from '../hooks/useToast';
import { useLanguage } from '../contexts/LanguageContext';

// Session-level cache for seeds
let cachedSeeds: SeedPlaceholder[] | null = null;

interface CreateWishModalProps {
    onClose: () => void;
}

export const CreateWishModal: React.FC<CreateWishModalProps> = ({ onClose }) => {
    const { availableLm } = useWallet();
    const { castWish, isSubmitting } = useWishActions();
    const { showToast } = useToast();
    const { t: MESSAGES } = useLanguage();

    const TIER_MAP: Record<GratitudeTier, 1000 | 500 | 0> = React.useMemo(() => ({
      heavy: 1000,
      medium: 500,
      light: 0
    }), []);

    const TIERS = React.useMemo(() => [
      {
        id: "heavy",
        label: MESSAGES.CREATE_WISH.TIER_HEAVY_LABEL,
        subLabel: MESSAGES.CREATE_WISH.TIER_HEAVY_SUB,
        cost: WISH_COST.BONFIRE,
      },
      {
        id: "medium",
        label: MESSAGES.CREATE_WISH.TIER_MEDIUM_LABEL,
        subLabel: MESSAGES.CREATE_WISH.TIER_MEDIUM_SUB,
        cost: WISH_COST.CANDLE,
      },
      {
        id: "light",
        label: MESSAGES.CREATE_WISH.TIER_LIGHT_LABEL,
        subLabel: MESSAGES.CREATE_WISH.TIER_LIGHT_SUB,
        cost: WISH_COST.SPARK,
      },
    ] as const, [MESSAGES]);

    const FALLBACK_PLACEHOLDER = MESSAGES.CREATE_WISH.PLACEHOLDER_FALLBACK;
    
    const [newWishContent, setNewWishContent] = useState('');
    const [selectedTier, setSelectedTier] = useState<GratitudeTier>('heavy');
    const [currentPlaceholder, setCurrentPlaceholder] = useState<string>(FALLBACK_PLACEHOLDER);
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [creationError, setCreationError] = useState<string | null>(null);

    const updatePlaceholder = React.useCallback((tier: GratitudeTier, seedsList: SeedPlaceholder[]) => {
        const numericTier = TIER_MAP[tier];
        const tierSeeds = seedsList.filter(s => s.tier === numericTier);
        if (tierSeeds.length > 0) {
            const random = tierSeeds[Math.floor(Math.random() * tierSeeds.length)];
            setCurrentPlaceholder(`${MESSAGES.CREATE_WISH.PLACEHOLDER_PREFIX}${random.content}`);
        } else {
            setCurrentPlaceholder(FALLBACK_PLACEHOLDER);
        }
    }, [FALLBACK_PLACEHOLDER, MESSAGES.CREATE_WISH.PLACEHOLDER_PREFIX, TIER_MAP]);

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
    }, [selectedTier, updatePlaceholder]);

    // Update placeholder when tier changes (if content is empty or placeholder was recently refreshed)
    const handleTierChange = (tier: GratitudeTier) => {
        setSelectedTier(tier);
        setCreationError(null);
        if (!newWishContent.trim() && cachedSeeds) {
            updatePlaceholder(tier, cachedSeeds);
        }
    };

    const selectedTierCost = TIERS.find(t => t.id === selectedTier)?.cost || 0;
    const exceedsAvailable = selectedTierCost > availableLm;

    const handlePostWish = async () => {
        if (!newWishContent.trim()) return;
        if (exceedsAvailable) return; // Double-check

        setCreationError(null);

        const result = await castWish({
            content: newWishContent,
            tier: selectedTier,
            isAnonymous
        });

        if (result.success) {
            showToast(MESSAGES.CREATE_WISH.TOAST_SUCCESS, "success");
            import('../utils/pwaEvent').then(({ globalTriggerPWAInstall }) => {
                globalTriggerPWAInstall();
            });
            onClose();
        } else {
            setCreationError(result.error || "通信エラーが発生しました。");
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
                               {MESSAGES.CREATE_WISH.LBL_MIGHT} <span className="text-xs font-normal text-slate-500 ml-0.5">{MESSAGES.CREATE_WISH.LBL_UNIT}</span>
                           </label>
                       </div>
                       <span className="self-start sm:self-center text-xs uppercase font-bold text-amber-700 bg-amber-100/30 backdrop-blur-md px-3 py-1 rounded-full tracking-[0.2em]">
                           {MESSAGES.CREATE_WISH.TAG_GIFT}
                       </span>
                   </div>
                    
                   {/* Available Info */}
                   <p className="text-xs text-slate-500 mb-2">
                       {MESSAGES.CREATE_WISH.LBL_AVAILABLE_1} <span className="font-mono font-medium text-amber-600">{Math.floor(availableLm).toLocaleString()} {UNIT_LABEL}</span> {MESSAGES.CREATE_WISH.LBL_AVAILABLE_2}
                   </p>


                    
                   <div className="grid grid-cols-1 gap-3">
                       {TIERS.map((tier) => (
                            <button
                              key={tier.id}
                              onClick={() => handleTierChange(tier.id)}
                                  className={`
                                      relative flex items-center justify-between p-5 rounded-2xl transition-all duration-700 border border-transparent
                                      ${selectedTier === tier.id
                                          ? tier.cost === 0
                                            ? "bg-white/95 backdrop-blur-3xl shadow-[0_15px_40px_-5px_rgba(245,158,11,0.3)] z-10"
                                            : tier.cost === 500
                                              ? "bg-white/80 backdrop-blur-xl shadow-[0_10px_25px_-5px_rgba(251,191,36,0.15)] z-10"
                                              : "bg-white/60 backdrop-blur-lg shadow-md z-10"
                                          : "bg-white/40 backdrop-blur-md text-slate-500 hover:bg-white/60 hover:shadow-md"
                                      }
                                  `}
                            >
                              <div className="flex items-center gap-4">
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all duration-500
                                    ${selectedTier === tier.id 
                                      ? (tier.cost === 0 ? "border-amber-600 bg-amber-600" : tier.cost === 500 ? "border-amber-500 bg-amber-500" : "border-slate-500 bg-slate-500")
                                      : "border-slate-300/80 bg-white/50"}`}>
                                    {selectedTier === tier.id && <div className="w-2 h-2 rounded-full bg-white scale-in-center shadow-sm" />}
                                </div>
                                <div className="flex flex-col items-start gap-1">
                                  <span className={`text-base font-medium tracking-[0.1em] ${selectedTier === tier.id 
                                    ? tier.cost === 0 ? "text-amber-900" : tier.cost === 500 ? "text-amber-800" : "text-amber-800" 
                                    : "text-slate-600"}`} style={{fontFamily: "'Noto Serif JP', serif"}}>
                                    {tier.label}
                                  </span>
                                  <span className="text-xs text-slate-500/80 font-medium uppercase tracking-[0.2em]">
                                    {tier.subLabel}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-4 pl-4 shrink-0">
                                  <span className={`flex items-baseline gap-1.5 font-mono font-light tracking-widest ${selectedTier === tier.id 
                                    ? tier.cost === 0 ? "text-amber-600" : tier.cost === 500 ? "text-amber-500" : "text-slate-500" 
                                    : "text-slate-400"}`}>
                                    {tier.cost === 0 
                                      ? <span className="text-4xl sm:text-5xl leading-[0.5] pt-3">∞</span> 
                                      : <span className="text-lg sm:text-xl">{tier.cost.toLocaleString()}</span>}
                                    <span className="text-xs font-sans font-medium opacity-50 uppercase tracking-widest">{tier.cost === 0 ? MESSAGES.CREATE_WISH.TIER_0 : UNIT_LABEL}</span>
                                  </span>
                              </div>
                              
                              {/* Breathing Glow for 0 Lm */}
                              {selectedTier === tier.id && tier.cost === 0 && (
                                <div className="absolute inset-0 rounded-xl bg-amber-200/10 animate-soft-glow pointer-events-none mix-blend-overlay" />
                              )}
                            </button>
                       ))}
                   </div>
                </div>

               {/* Input Section */}
               <div className="space-y-4">
                  <label className="block text-xs uppercase tracking-widest font-bold text-slate-500 font-sans">
                      {MESSAGES.CREATE_WISH.LBL_CONTENT}
                  </label>
                   <div className="bg-white/50 backdrop-blur-3xl p-6 rounded-[2rem] border border-transparent shadow-sm focus-within:bg-white/70 focus-within:shadow-md transition-all duration-700">
                      <textarea
                        value={newWishContent}
                        onChange={(e) => {
                            setNewWishContent(e.target.value);
                            setCreationError(null);
                        }}
                        placeholder={currentPlaceholder}
                        className="w-full bg-transparent text-slate-800 placeholder:text-slate-500 text-base min-h-[160px] resize-none outline-none leading-relaxed font-serif tracking-wide"
                      />
                  </div>
               </div>

               {/* Final Actions Area: Anonymous, Warning, and Submit */}
               <div className="space-y-4 pt-6">
                   {/* Anonymous Option */}
                   <div className="bg-white/30 backdrop-blur-md rounded-2xl p-5 border border-transparent shadow-sm hover:bg-white/40 transition-colors">
                       <label className="flex items-start gap-4 cursor-pointer group">
                           <div className="relative flex items-center mt-1 shrink-0">
                               <input
                                   type="checkbox"
                                   className="peer sr-only"
                                   checked={isAnonymous}
                                   onChange={(e) => setIsAnonymous(e.target.checked)}
                               />
                               <div className="w-5 h-5 border border-slate-300 rounded-[6px] transition-all duration-300 peer-checked:bg-amber-600 peer-checked:border-amber-600 bg-white/80 shadow-sm group-hover:border-slate-400 group-hover:bg-white" />
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
                               <span className={`text-sm font-bold uppercase tracking-widest transition-colors ${isAnonymous ? "text-amber-900" : "text-slate-600"}`}>
                                   {MESSAGES.CREATE_WISH.CHK_ANONYMOUS}
                               </span>
                               <p className="text-xs text-slate-500 mt-1 leading-relaxed opacity-80">
                                   {MESSAGES.CREATE_WISH.NOTE_ANONYMOUS}
                               </p>
                           </div>
                       </label>
                   </div>

                   {/* Warning if exceeds */}
                   {exceedsAvailable && (
                       <div className="bg-orange-50/80 backdrop-blur-sm rounded-xl p-4 text-xs text-orange-800 leading-relaxed shadow-sm">
                           {MESSAGES.CREATE_WISH.WARN_EXCEED}
                       </div>
                   )}

                   {/* Creation Error */}
                   {creationError && (
                       <div className="bg-red-50/80 backdrop-blur-sm rounded-xl p-4 text-xs font-bold text-red-600 leading-relaxed shadow-sm text-center border border-red-100">
                           ⚠️ {creationError}
                       </div>
                   )}

                   {/* Action Button */}
                   <button 
                       onClick={handlePostWish}
                       disabled={!newWishContent.trim() || isSubmitting || exceedsAvailable}
                       className="w-full py-6 rounded-full bg-amber-900/90 backdrop-blur-md text-white font-bold text-base shadow-[0_15px_30px_-5px_rgba(69,26,3,0.3)] hover:bg-amber-900 hover:shadow-[0_20px_40px_-5px_rgba(69,26,3,0.4)] active:scale-[0.98] transition-all disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center gap-4 group"
                   >
                       {isSubmitting ? (
                           <>
                               <Loader2 className="w-5 h-5 animate-spin text-amber-100" />
                               <span className="tracking-widest">{MESSAGES.CREATE_WISH.BTN_SENDING}</span>
                           </>
                       ) : (
                           <>
                               <Send size={18} className="text-amber-100" />
                               <span className="tracking-widest">{MESSAGES.CREATE_WISH.BTN_SUBMIT}</span>
                           </>
                       )}
                   </button>
               </div>
            </div>
        </div>
    );
};


