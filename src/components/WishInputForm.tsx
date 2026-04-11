import React, { useState, useRef } from 'react';
import { Loader2, Send, PenTool } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useWishActions } from '../hooks/useWishActions';
import { useWallet } from '../hooks/useWallet';
import { FIXED_WISH_COST, UNIT_LABEL } from '../constants';
import { useToast } from '../hooks/useToast';
import { useLanguage } from '../contexts/LanguageContext';
import { useMicroInteractions } from '../hooks/useMicroInteractions';

interface WishInputFormProps {
  onSuccess?: () => void;
}

export const WishInputForm: React.FC<WishInputFormProps> = ({ onSuccess }) => {
  const { availableLm } = useWallet();
  const { castWish, isSubmitting } = useWishActions();
  const { showToast } = useToast();
  const { t: MESSAGES } = useLanguage();
  const { getSendAction } = useMicroInteractions();

  const [newWishContent, setNewWishContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [creationError, setCreationError] = useState<string | null>(null);
  const [draftKeyword, setDraftKeyword] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);
  // 【スパム防止】成功後5秒間の再呼び出しをブロック（クールダウン）
  const lastDraftAt = useRef<number>(0);
  const DRAFT_COOLDOWN_MS = 5000;
  // 【コスト最適化】getFunctions()のインスタンスをコンポーネントライフサイクルで1度だけ生成
  const functionsRef = useRef(getFunctions());

  // セッションごとにランダムな9件のサジェストを選択
  const randomSuggestions = React.useMemo(() => {
    const shuffled = [...MESSAGES.CREATE_WISH.AI_DRAFT_SUGGESTIONS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 9);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 残高が1000Lm未満の場合は送信不可
  const insufficientBalance = availableLm < FIXED_WISH_COST;

  // AIによる下書き生成（スパム防止: isDraftingフラグ + 5秒クールダウン）
  const handleDraftWish = async () => {
    const now = Date.now();
    if (!draftKeyword.trim() || isDrafting) return;
    // クールダウン期間中はAPIを呼ばない
    if (now - lastDraftAt.current < DRAFT_COOLDOWN_MS) return;

    setIsDrafting(true);
    setCreationError(null);
    try {
      const generateWishDraft = httpsCallable(functionsRef.current, 'generateWishDraft');
      const result = await generateWishDraft({ keyword: draftKeyword });
      const data = result.data as { draft?: string };
      if (data.draft) {
        setNewWishContent(data.draft);
        setDraftKeyword('');
        lastDraftAt.current = Date.now(); // クールダウン開始
      } else {
        setCreationError(MESSAGES.CREATE_WISH.AI_DRAFT_ERROR);
      }
    } catch (error) {
      console.error("Failed to generate draft", error);
      setCreationError(MESSAGES.CREATE_WISH.AI_DRAFT_ERROR);
    } finally {
      setIsDrafting(false);
    }
  };

  // 願いの公開
  const handlePostWish = async () => {
    if (!newWishContent.trim() || insufficientBalance) return;
    setCreationError(null);

    const result = await castWish({
      content: newWishContent,
      isAnonymous,
    });

    if (result.success) {
      showToast(MESSAGES.CREATE_WISH.TOAST_SUCCESS, "success");
      import('../utils/pwaEvent').then(({ globalTriggerPWAInstall }) => {
        globalTriggerPWAInstall();
      });
      if (onSuccess) onSuccess();
      setNewWishContent('');
      setDraftKeyword('');
      setIsAnonymous(false);
      
      if (result.id) {
        setTimeout(() => {
          const target = document.getElementById(`wish-${result.id}`);
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            target.style.transition = 'box-shadow 0.3s ease-out';
            target.style.boxShadow = '0 0 0 4px rgba(217, 119, 6, 0.4)';
            setTimeout(() => {
              target.style.boxShadow = '';
            }, 2000);
          }
        }, 100);
      }
    } else {
      setCreationError(result.error || "通信エラーが発生しました。");
    }
  };

  return (
    <div className="w-full">
      <div className="max-w-2xl mx-auto py-4 space-y-10">

        {/* 固定コスト注釈 */}
        <p className="text-xs text-slate-500 px-1">
          ※ 感謝は一律{' '}
          <span className="font-mono font-medium text-amber-600">1,000 {UNIT_LABEL}</span>{' '}
          です。
        </p>

        {/* 願いの内容入力 */}
        <div className="space-y-4">
          <label className="block text-xs uppercase tracking-widest font-bold text-slate-700 font-sans">
            {MESSAGES.CREATE_WISH.LBL_CONTENT}
          </label>

          {/* AI下書きアシスト */}
          <div className="flex flex-col gap-3 relative z-10 w-full">
            {isDrafting && (
              <div className="absolute -inset-2 bg-slate-50/50 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-2xl" />
            )}

            <div className="flex flex-col sm:flex-row gap-3 items-center relative z-20 w-full">
              <input
                type="text"
                value={draftKeyword}
                onChange={(e) => {
                  setDraftKeyword(e.target.value);
                  setCreationError(null);
                }}
                onKeyDown={(e) => {
                  // Enterキー連打でのAPI重複コールを防止
                  if (e.key === 'Enter') { e.preventDefault(); handleDraftWish(); }
                }}
                placeholder={MESSAGES.CREATE_WISH.AI_DRAFT_PLACEHOLDER}
                className="flex-1 w-full bg-white text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 px-4 py-3.5 sm:py-3 rounded-xl border border-amber-200/50 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all font-sans"
                maxLength={50}
              />
              <button
                onClick={handleDraftWish}
                disabled={!draftKeyword.trim() || isDrafting}
                className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 px-5 py-3.5 sm:py-3 rounded-xl bg-amber-900/5 hover:bg-amber-900/10 text-amber-900 border border-amber-900/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold tracking-widest"
              >
                {isDrafting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{MESSAGES.CREATE_WISH.AI_DRAFT_BTN_LOADING}</span>
                  </>
                ) : (
                  <>
                    <PenTool className="w-4 h-4" />
                    <span>{MESSAGES.CREATE_WISH.AI_DRAFT_BTN_IDLE}</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1 relative z-20">
              <span className="text-xs text-amber-900/70 mr-1 font-medium tracking-wider">
                {MESSAGES.CREATE_WISH.AI_DRAFT_SUGGESTION_LABEL}
              </span>
              {randomSuggestions.map((suggest) => (
                <button
                  key={suggest}
                  onClick={() => setDraftKeyword(suggest)}
                  className="text-xs text-amber-900/80 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-full border border-amber-200/60 shadow-sm transition-all text-left"
                >
                  {suggest}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white shadow-sm border border-slate-200 p-6 rounded-[2rem] focus-within:bg-white/70 focus-within:shadow-md transition-all duration-700 mt-2">
            <textarea
              value={newWishContent}
              onChange={(e) => {
                setNewWishContent(e.target.value);
                setCreationError(null);
              }}
              placeholder={MESSAGES.CREATE_WISH.PLACEHOLDER_FALLBACK}
              className="w-full bg-transparent text-slate-900 placeholder:text-slate-700 text-sm min-h-[160px] resize-none outline-none leading-relaxed font-serif tracking-wide"
            />
          </div>
        </div>

        {/* 匿名・送信エリア */}
        <div className="space-y-4 pt-6">
          {/* 匿名オプション */}
          <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-5 hover:bg-white/40 transition-colors">
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
                <span className={`text-sm font-bold uppercase tracking-widest transition-colors ${isAnonymous ? "text-amber-900" : "text-slate-800"}`}>
                  {MESSAGES.CREATE_WISH.CHK_ANONYMOUS}
                </span>
                <p className="text-xs text-slate-700 mt-1 leading-relaxed opacity-80">
                  {MESSAGES.CREATE_WISH.NOTE_ANONYMOUS}
                </p>
              </div>
            </label>
          </div>

          {/* エラー表示 */}
          {creationError && (
            <div className="bg-red-50/80 backdrop-blur-sm rounded-xl p-4 text-xs font-bold text-red-600 leading-relaxed shadow-sm text-center border border-red-100">
              ⚠️ {creationError}
            </div>
          )}

          {/* 公開ボタン */}
          <button
            onClick={getSendAction(handlePostWish)}
            disabled={!newWishContent.trim() || isSubmitting || insufficientBalance}
            className="w-full py-6 rounded-full bg-amber-900/90 backdrop-blur-md text-white font-bold text-base shadow-[0_15px_30px_-5px_rgba(69,26,3,0.3)] hover:bg-amber-900 hover:shadow-[0_20px_40px_-5px_rgba(69,26,3,0.4)] active:scale-[0.98] transition-all disabled:opacity-20 disabled:cursor-not-allowed relative overflow-hidden group"
          >
            <span className="relative z-10 flex items-center justify-center gap-4 transition-transform duration-300">
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
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};
