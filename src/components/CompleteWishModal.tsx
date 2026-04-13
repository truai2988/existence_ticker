import { useState } from 'react';
import { Check, HeartHandshake } from 'lucide-react';
import { GratitudeTier } from '../types';
import { UNIT_LABEL } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import { useMicroInteractions } from '../hooks/useMicroInteractions';

// 親コンポーネントから、対象の wish データ（作成時に決めた内容）を受け取る
interface Props {
  wishTitle: string;    // "引っ越しの荷造り..."
  helperName: string;   // "Stray Cat"
  preset: GratitudeTier; // 作成時に決めたランク
  cost: number;         // 100, 500, 1000
  onConfirm: (message?: string) => void;
  onCancel: () => void;
}

export const CompleteWishModal = ({ wishTitle, helperName, preset, cost, onConfirm, onCancel }: Props) => {
  const { t: MESSAGES } = useLanguage();
  const { triggerComplete } = useMicroInteractions();
  const [message, setMessage] = useState("");

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-fade-in text-left">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onCancel} />
      
      <div className="relative w-full max-w-sm bg-white rounded-2xl p-6 space-y-5 shadow-2xl animate-scale-in">
        
        {/* Header */}
        <div className="text-center space-y-2 pt-2">
          <div className="inline-flex justify-center items-center w-14 h-14 rounded-full bg-blue-50 mb-2 border border-blue-100">
            <HeartHandshake className="w-7 h-7 text-blue-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">{MESSAGES.COMPLETE_WISH.TITLE}</h2>
          <p className="text-xs text-slate-700 font-medium">
            <span className="font-bold text-slate-900">{helperName}</span> {MESSAGES.COMPLETE_WISH.GREETING}
          </p>
        </div>

        {/* The Pact (約束の内容) */}
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-300 space-y-4 shadow-inner">
          <div className="space-y-1">
             <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">{MESSAGES.COMPLETE_WISH.REQ_LABEL}</span>
             <p className="text-sm text-slate-900 font-medium leading-relaxed break-words line-clamp-2">
                 {wishTitle}
             </p>
          </div>
          
          <div className="border-t border-slate-300/50" />

          {/* Locked Reward Display */}
          <div className="flex justify-between items-center">
            <div>
               <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">{MESSAGES.COMPLETE_WISH.THANKS_LABEL}</span>
               <span className="text-xs text-slate-800 font-medium">
                 {preset === 'light' && MESSAGES.COMPLETE_WISH.TIER_LIGHT}
                 {preset === 'medium' && MESSAGES.COMPLETE_WISH.TIER_MEDIUM}
                 {preset === 'heavy' && MESSAGES.COMPLETE_WISH.TIER_HEAVY}
               </span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold font-mono text-slate-900">-{cost.toLocaleString()}</span>
              <span className="text-xs text-slate-700 ml-1 font-sans">{UNIT_LABEL}</span>
            </div>
          </div>
        </div>

        {/* Message Input */}
        <div className="space-y-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="（感謝のメッセージがあればここに入力してください）"
            className="w-full h-24 p-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none resize-none transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <button 
            onClick={() => { triggerComplete(); onConfirm(message.trim() || undefined); }}
            className="w-full relative overflow-hidden rounded-full bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl active:scale-[0.98]"
          >
             <div className="flex items-center justify-center gap-2 py-3.5 px-6">
              <Check className="w-5 h-5 text-blue-100" />
              <span className="text-white font-bold text-sm tracking-wide">
                {MESSAGES.COMPLETE_WISH.BTN_CONFIRM}
              </span>
            </div>
          </button>
          
          <button onClick={onCancel} className="w-full text-xs font-bold text-slate-700 hover:text-slate-900 py-3 transition-colors">
            {MESSAGES.COMPLETE_WISH.BTN_CANCEL}
          </button>
        </div>

      </div>
    </div>
  );
};
