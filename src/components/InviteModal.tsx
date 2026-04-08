import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Feather, RefreshCw, Share2, Copy, Check, Trash2, X, MailOpen } from 'lucide-react';
import { useAuth } from '../hooks/useAuthHook';
import { useInviteCode } from '../hooks/useInviteCode';
import { useLanguage } from '../contexts/LanguageContext';

export const InviteModal: React.FC = () => {
  const { user } = useAuth();
  const { t: MESSAGES } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const {
    myCodes,
    canGenerate,
    isGenerating,
    generateCode,
    shareCode,
    deleteCode,
    MAX_PENDING,
  } = useInviteCode(user?.uid ?? null);

  // 匿名ユーザーには表示しない
  if (!user || user.isAnonymous) return null;

  const pendingCodes = myCodes.filter(c => !c.is_used);

  return (
    <>
      {/* ヘッダーに追加するアイコンボタン */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2.5 transition-colors active:scale-95"
        aria-label="万年筆を手渡す（招待状を送る）"
        title={canGenerate ? '招待状を綴る' : '招待状がいっぱいです'}
      >
        <Feather
          size={20}
          strokeWidth={1.5}
          className={`transition-colors duration-300 ${
            canGenerate
              ? 'text-amber-700 hover:text-amber-900'   // 招待可能：温かみのある琥珀色
              : 'text-slate-400 hover:text-slate-500'   // いっぱい：落ち着いたグレー
          }`}
        />
      </button>

      {/* モーダル */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-end justify-center p-0 sm:items-center sm:p-6"
            onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false); }}
          >
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="bg-white w-full max-w-md rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden"
            >
              {/* ヘッダー */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900" style={{ fontFamily: "'Noto Serif JP', serif" }}>
                    {MESSAGES.INVITE.SECTION_TITLE}
                  </h2>
                  <p className="text-xs text-slate-700 mt-0.5">{MESSAGES.INVITE.SECTION_SUB}</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="px-6 py-5 flex flex-col gap-4">
                {/* 3スロットビジュアル */}
                <div className="flex gap-3">
                  {Array.from({ length: MAX_PENDING }).map((_, i) => {
                    const code = pendingCodes[i] ?? null;
                    const isPending = !!code;
                    return (
                      <div
                        key={i}
                        className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all ${
                          isPending
                            ? 'bg-amber-50 border-amber-200'
                            : 'bg-white border-dashed border-slate-300'
                        }`}
                      >
                        <MailOpen
                          size={18}
                          className={isPending ? 'text-amber-600' : 'text-slate-300'}
                        />
                        <span className={`text-xs font-bold tracking-wide ${
                          isPending ? 'text-amber-700' : 'text-slate-300'
                        }`}>
                          {isPending ? MESSAGES.INVITE.SLOT_PENDING : MESSAGES.INVITE.SLOT_EMPTY}
                        </span>
                        {isPending && (
                          <span className="text-[9px] font-mono text-amber-600 truncate w-full text-center">
                            {code.id}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* 未使用コードのシェア＋削除リスト */}
                {pendingCodes.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {pendingCodes.map(code => (
                      <div key={code.id} className="flex items-center gap-2 bg-amber-50/60 border border-amber-100 rounded-xl px-3 py-2">
                        <span className="font-mono text-sm text-amber-800 flex-1 truncate">{code.id}</span>
                        {/* シェアボタン */}
                        <button
                          onClick={async () => {
                            const result = await shareCode(
                              code.id,
                              MESSAGES.INVITE.SHARE_TITLE,
                              MESSAGES.INVITE.SHARE_TEXT
                            );
                            if (result === 'copied') {
                              setCopiedCodeId(code.id);
                              setTimeout(() => setCopiedCodeId(null), 2500);
                            }
                          }}
                          className="shrink-0 p-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 transition-colors"
                          aria-label="シェア"
                        >
                          {copiedCodeId === code.id
                            ? <Check size={14} className="text-emerald-600" />
                            : ('share' in navigator)
                            ? <Share2 size={14} className="text-amber-700" />
                            : <Copy size={14} className="text-amber-700" />}
                        </button>
                        {/* 削除ボタン */}
                        <button
                          onClick={() => deleteCode(code.id)}
                          className="shrink-0 p-1.5 rounded-lg bg-red-50 hover:bg-red-100 transition-colors"
                          aria-label="削除"
                        >
                          <Trash2 size={14} className="text-red-400 hover:text-red-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* 上限メッセージ */}
                {!canGenerate && (
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 rounded-xl p-3 border border-slate-100">
                    {MESSAGES.INVITE.LIMIT_REACHED}
                  </p>
                )}

                {/* 発行ボタン */}
                <button
                  onClick={async () => {
                    if (!canGenerate || isGenerating) return;
                    await generateCode();
                  }}
                  disabled={!canGenerate || isGenerating}
                  className={`w-full py-3.5 px-4 rounded-2xl text-sm font-bold tracking-wide transition-all flex items-center justify-center gap-2 ${
                    canGenerate
                      ? 'bg-amber-900/90 text-white shadow-[0_10px_20px_-5px_rgba(69,26,3,0.3)] hover:bg-amber-900 active:scale-[0.98]'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isGenerating
                    ? <><RefreshCw size={14} className="animate-spin" />{MESSAGES.INVITE.BTN_GENERATING}</>
                    : <><MailOpen size={14} />{MESSAGES.INVITE.BTN_SEND}</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
