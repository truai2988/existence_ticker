import { Check, Sparkles } from 'lucide-react';
import { GratitudeTier } from '../types';

// 親コンポーネントから、対象の wish データ（作成時に決めた内容）を受け取る
interface Props {
  wishTitle: string;    // "引っ越しの荷造り..."
  helperName: string;   // "Stray Cat"
  preset: GratitudeTier; // 作成時に決めたランク
  cost: number;         // 100, 500, 1000
  onConfirm: () => void;
  onCancel: () => void;
}

export const CompleteWishModal = ({ wishTitle, helperName, preset, cost, onConfirm, onCancel }: Props) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onCancel} />
      
      <div className="relative w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-2xl animate-scale-in">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex justify-center items-center w-12 h-12 rounded-full bg-yellow-500/10 mb-2">
            <Check className="w-6 h-6 text-yellow-500" />
          </div>
          <h2 className="text-xl font-serif text-slate-200">願いの完了</h2>
          <p className="text-sm text-slate-500">
            {helperName} さんへの感謝を確定します
          </p>
        </div>

        {/* The Pact (約束の内容) */}
        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800 space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-xs text-slate-500 uppercase tracking-wider">Target Wish</span>
            <span className="text-xs text-slate-400 text-right w-2/3">{wishTitle.substring(0, 40)}{wishTitle.length > 40 ? '...' : ''}</span>
          </div>
          
          <div className="border-t border-slate-800 my-2" />

          {/* Locked Reward Display */}
          <div className="flex justify-between items-center">
            <div>
               <span className="text-xs text-slate-500 block">Reward (Locked)</span>
               <span className="text-yellow-100 font-serif">
                 {preset === 'light' && '淡い光'}
                 {preset === 'medium' && '確かな輝き'}
                 {preset === 'heavy' && '太陽の恵み'}
               </span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold font-mono text-yellow-400">{cost}</span>
              <span className="text-xs text-yellow-600 ml-1">Pt</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button 
            onClick={onConfirm}
            className="w-full group relative overflow-hidden rounded-full bg-yellow-600 p-[1px] hover:bg-yellow-500 transition-colors"
          >
             <div className="relative flex items-center justify-center gap-2 bg-slate-950/90 group-hover:bg-transparent transition-colors rounded-full px-8 py-3 h-full w-full">
              <Sparkles className="w-4 h-4 text-yellow-200" />
              <span className="text-yellow-100 font-medium group-hover:text-white">
                光を贈って完了する
              </span>
            </div>
          </button>
          
          <button onClick={onCancel} className="w-full text-sm text-slate-500 hover:text-slate-300 py-2">
            キャンセル
          </button>
        </div>

      </div>
    </div>
  );
};
