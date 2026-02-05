import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2, Send } from 'lucide-react';
import { useWishActions } from '../hooks/useWishActions';
import { useProfile } from '../hooks/useProfile';
import { useWallet } from '../hooks/useWallet';
import { GratitudeTier } from '../types';
import { WISH_COST, UNIT_LABEL } from '../constants';
import { useToast } from '../contexts/ToastContext';
import { useWishesContext } from '../contexts/WishesContext';

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
    const { showToast } = useToast();
    const { refresh } = useWishesContext();
    
    const [newWishContent, setNewWishContent] = useState('');
    const [selectedTier, setSelectedTier] = useState<GratitudeTier>('light');
    const [isAnonymous, setIsAnonymous] = useState(false);

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
            showToast("依頼を投稿しました", "success");
            setTimeout(() => refresh(), 300);
            onClose();
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-0 bg-slate-50 z-[200] flex flex-col pt-safe w-full h-full"
            onClick={(e) => e.stopPropagation()}
        >
            {/* Header */}
            <div className="w-full bg-white/50 backdrop-blur-sm sticky top-0 z-10 border-b border-slate-200">
                <div className="max-w-md mx-auto px-6 py-4 flex justify-between items-center">
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
            </div>

            <div className="flex-1 overflow-y-auto w-full">
                <div className="max-w-md mx-auto px-6 py-4 space-y-8 pb-32">
               
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
                       <span className="text-[11px] font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full border border-orange-100">
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
                           分かち合える分（ゆとり）がありません。今の約束（募集中の願い）を整理してください
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

               {/* Anonymous Option */}
               <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                   <label className="flex items-start gap-3 cursor-pointer group">
                       <div className="relative flex items-center mt-0.5">
                           <input
                               type="checkbox"
                               className="peer sr-only"
                               checked={isAnonymous}
                               onChange={(e) => setIsAnonymous(e.target.checked)}
                           />
                           <div className="w-5 h-5 border-2 border-slate-300 rounded transition-colors peer-checked:bg-slate-800 peer-checked:border-slate-800 bg-white" />
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
                           <span className={`text-sm font-bold transition-colors ${isAnonymous ? "text-slate-800" : "text-slate-600"}`}>
                               匿名でお願いする
                           </span>
                           <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                               ※相談がまとまる（進行中になる）まで、お互いの名前やアイコンは表示されません
                           </p>
                       </div>
                   </label>
               </div>
                </div>
            </div>

            {/* Footer Action */}
            <div className="absolute bottom-0 left-0 right-0 z-20">
                <div className="w-full bg-white border-t border-slate-100 p-6">
                    <div className="max-w-md mx-auto">
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
                </div>
            </div>
        </motion.div>
    );
};

