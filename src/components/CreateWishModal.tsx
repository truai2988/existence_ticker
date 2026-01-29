import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2, Send } from 'lucide-react';
import { useWishActions } from '../hooks/useWishActions';
import { useProfile } from '../hooks/useProfile';
import { useWallet } from '../hooks/useWallet';
import { GratitudeTier } from '../types';
import { WISH_COST, UNIT_LABEL } from '../constants';

type TierOption = {
  id: GratitudeTier;
  label: string;
  subLabel: string;
  cost: number;
}

const TIERS: TierOption[] = [
  {
    id: "light",
    label: `軽い手助け`,
    subLabel: "ちょっとした相談・作業",
    cost: WISH_COST.SPARK,
  },
  {
    id: "medium",
    label: `しっかりした仕事`,
    subLabel: "実務・制作・サポート",
    cost: WISH_COST.CANDLE,
  },
  {
    id: "heavy",
    label: `深い献身`,
    subLabel: "専門スキル・長期案件",
    cost: WISH_COST.BONFIRE,
  },
];

interface CreateWishModalProps {
    onClose: () => void;
}

export const CreateWishModal: React.FC<CreateWishModalProps> = ({ onClose }) => {
    const { name } = useProfile();
    const { availableLm } = useWallet();
    const { castWish, isSubmitting } = useWishActions();
    
    const [newWishContent, setNewWishContent] = useState('');
    const [selectedTier, setSelectedTier] = useState<GratitudeTier>('light');

    const selectedTierCost = TIERS.find(t => t.id === selectedTier)?.cost || 0;
    const exceedsAvailable = selectedTierCost > availableLm;

    const handlePostWish = async () => {
        if (!newWishContent.trim()) return;
        if (exceedsAvailable) return; // Double-check

        const result = await castWish({
            content: newWishContent,
            tier: selectedTier
        });

        if (result) {
            onClose();
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-0 bg-slate-50 z-[200] flex flex-col pt-safe"
            onClick={(e) => e.stopPropagation()}
        >
            {/* Header */}
            <div className="px-6 py-4 flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                <h3 className="text-lg font-bold text-slate-800">
                  お願いを伝える
                </h3>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  <X size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-8 pb-32">
               
               {/* Input Section */}
               <div className="space-y-3">
                  <label className="block text-sm font-bold text-slate-700">
                      内容を入力
                  </label>
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 focus-within:ring-2 focus-within:ring-orange-200 transition-all">
                      <div className="mb-2 text-xs text-slate-400 font-medium">
                          依頼者: <span className="text-slate-600">{name}</span>
                      </div>
                      <textarea
                        value={newWishContent}
                        onChange={(e) => setNewWishContent(e.target.value)}
                        placeholder="誰かに手伝ってほしいことや、解決したい悩みを具体的に書きましょう..."
                        className="w-full bg-transparent text-slate-800 placeholder:text-slate-400 text-base min-h-[120px] resize-none outline-none leading-relaxed"
                        autoFocus
                      />
                  </div>
               </div>
               
               {/* Reward Selector Section */}
               <div className="space-y-3">
                   <div className="flex items-center justify-between">
                       <label className="block text-sm font-bold text-slate-700">
                           お礼として渡す Lm (時間)
                       </label>
                       <span className="text-[10px] font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full border border-orange-100">
                           対価として支払われます
                       </span>
                   </div>
                    
                   {/* Available Info */}
                   <p className="text-xs text-slate-500 mb-2">
                       現在分かち合えるのは <span className="font-mono font-bold text-orange-600">{Math.floor(availableLm).toLocaleString()} {UNIT_LABEL}</span> までです
                   </p>

                   {/* Warning if exceeds */}
                   {exceedsAvailable && (
                       <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-xs text-orange-800 leading-relaxed">
                           器のゆとりを超えた約束はできません
                       </div>
                   )}
                    
                   <div className="grid grid-cols-1 gap-3">
                       {TIERS.map((tier) => (
                           <button
                             key={tier.id}
                             onClick={() => setSelectedTier(tier.id)}
                             className={`
                                 relative flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200
                                 ${selectedTier === tier.id
                                     ? "border-orange-400 bg-orange-50/50 shadow-sm"
                                     : "border-slate-100 bg-white text-slate-500 hover:border-slate-200"
                                 }
                             `}
                           >
                             <div className="flex flex-col items-start gap-0.5">
                               <span className={`text-sm font-bold ${selectedTier === tier.id ? "text-orange-800" : "text-slate-700"}`}>
                                 {tier.label}
                               </span>
                               <span className="text-xs text-slate-400">
                                 {tier.subLabel}
                               </span>
                             </div>

                             <div className="flex items-center gap-3">
                                <span className={`text-lg font-mono font-bold ${selectedTier === tier.id ? "text-orange-500" : "text-slate-300"}`}>
                                  {tier.cost.toLocaleString()} <span className="text-xs font-sans font-medium text-slate-400">{UNIT_LABEL}</span>
                                </span>
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                                    selectedTier === tier.id ? "border-orange-500 bg-orange-500" : "border-slate-200 bg-white"
                                }`}>
                                    {selectedTier === tier.id && <div className="w-2 h-2 rounded-full bg-white" />}
                                </div>
                             </div>
                           </button>
                       ))}
                   </div>
               </div>
            </div>

            {/* Footer Action */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-100 z-20">
                <button 
                    onClick={handlePostWish}
                    disabled={!newWishContent.trim() || isSubmitting || exceedsAvailable}
                    className="w-full py-4 rounded-full bg-slate-900 text-white font-bold text-base shadow-lg hover:bg-slate-800 hover:shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                            <span>送信中...</span>
                        </>
                    ) : (
                        <>
                            <Send size={18} />
                            <span>みんなにお願いする</span>
                        </>
                    )}
                </button>
            </div>
        </motion.div>
    );
};

