import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Feather, RefreshCw, Share2, Copy, Check, Trash2, X,
  MailOpen, QrCode, ChevronLeft,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuthHook';
import { useInviteCode } from '../hooks/useInviteCode';
import { useLanguage } from '../contexts/LanguageContext';
import { QRCodeDisplay } from './QRCodeDisplay';

const APP_URL = 'https://www.existenceticker.com';

/** コードからアプリの招待URLを生成 */
const buildInviteUrl = (code: string) => `${APP_URL}/?code=${code}`;

export const InviteModal: React.FC = () => {
  const { user } = useAuth();
  const { t: MESSAGES } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [qrCodeId, setQrCodeId] = useState<string | null>(null);  // QR表示中のコードID

  const {
    myCodes,
    canGenerate,
    isGenerating,
    generateCode,
    shareCode,
    deleteCode,
    MAX_PENDING,
  } = useInviteCode(user?.uid ?? null);

  /** URLをクリップボードにコピー */
  const handleCopyUrl = useCallback(async (code: string) => {
    const url = buildInviteUrl(code);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedCodeId(code);
      setTimeout(() => setCopiedCodeId(null), 2500);
    } catch {
      // フォールバック
    }
  }, []);

  // 匿名ユーザーには表示しない（フックより後）
  const pendingCodes = myCodes.filter(c => !c.is_used);

  /** QR表示中のコードの招待URL */
  const qrUrl = qrCodeId ? buildInviteUrl(qrCodeId) : null;

  if (!user || user.isAnonymous) return null;

  return (
    <>
      {/* ヘッダーのアイコンボタン */}
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
              ? 'text-amber-700 hover:text-amber-900'
              : 'text-slate-400 hover:text-slate-500'
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
            onClick={(e) => { if (e.target === e.currentTarget) { setIsOpen(false); setQrCodeId(null); } }}
          >
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="bg-white w-full max-w-md rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden"
            >
              {/* ─── QRコード画面 ─── */}
              <AnimatePresence mode="wait">
                {qrUrl && qrCodeId ? (
                  <motion.div
                    key="qr-view"
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 40 }}
                    transition={{ duration: 0.25 }}
                    className="flex flex-col items-center gap-6 px-6 pt-6 pb-8"
                  >
                    {/* 戻るボタン */}
                    <div className="w-full flex items-center justify-between">
                      <button
                        onClick={() => setQrCodeId(null)}
                        className="flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors"
                      >
                        <ChevronLeft size={18} />
                        戻る
                      </button>
                      <button
                        onClick={() => { setQrCodeId(null); setIsOpen(false); }}
                        className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    {/* 見出し */}
                    <div className="text-center">
                      <p className="text-base font-bold text-slate-800" style={{ fontFamily: "'Noto Serif JP', serif" }}>
                        相手にスキャンしてもらう
                      </p>
                      <p className="text-xs text-slate-500 mt-1">カメラでQRコードを読み取るだけで参加できます</p>
                    </div>

                    {/* QRコード */}
                    <div className="p-4 bg-white rounded-3xl shadow-lg border border-slate-100">
                      <QRCodeDisplay value={qrUrl} size={220} />
                    </div>

                    {/* コード＆URL表示 */}
                    <div className="w-full bg-slate-50 rounded-2xl px-4 py-3 flex flex-col gap-1.5 border border-slate-100">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-sm font-bold text-slate-700">{qrCodeId}</span>
                        <button
                          onClick={() => handleCopyUrl(qrCodeId)}
                          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold transition-colors"
                        >
                          {copiedCodeId === qrCodeId
                            ? <><Check size={13} className="text-emerald-600" />コピー済</>
                            : <><Copy size={13} />URLをコピー</>
                          }
                        </button>
                      </div>
                      <span className="font-mono text-[11px] text-slate-400 break-all">{qrUrl}</span>
                    </div>

                    {/* Web Share（スマホで開いている場合） */}
                    {'share' in navigator && (
                      <button
                        onClick={() => shareCode(
                          qrCodeId,
                          MESSAGES.INVITE.SHARE_TITLE,
                          MESSAGES.INVITE.SHARE_TEXT
                        )}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-800 text-white text-sm font-bold hover:bg-slate-900 active:scale-[0.98] transition-all"
                      >
                        <Share2 size={16} />
                        アプリで共有する
                      </button>
                    )}
                  </motion.div>
                ) : (
                  /* ─── コード一覧画面 ─── */
                  <motion.div
                    key="list-view"
                    initial={{ opacity: 0, x: -40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.25 }}
                  >
                    {/* ヘッダー */}
                    <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
                      <div>
                        <h2 className="text-base font-bold text-slate-900" style={{ fontFamily: "'Noto Serif JP', serif" }}>
                          {MESSAGES.INVITE.SECTION_TITLE}
                        </h2>
                        <p className="text-xs text-slate-600 mt-0.5">{MESSAGES.INVITE.SECTION_SUB}</p>
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

                      {/* 未使用コードのアクションリスト */}
                      {pendingCodes.length > 0 && (
                        <div className="flex flex-col gap-2">
                          {pendingCodes.map(code => (
                            <div key={code.id} className="flex items-center gap-2 bg-amber-50/60 border border-amber-100 rounded-xl px-3 py-2.5">
                              {/* コード文字列 */}
                              <span className="font-mono text-sm text-amber-800 flex-1 truncate">{code.id}</span>

                              {/* QRコードボタン */}
                              <button
                                onClick={() => setQrCodeId(code.id)}
                                className="shrink-0 p-2 rounded-lg bg-amber-100 hover:bg-amber-200 transition-colors"
                                aria-label="QRコードを表示"
                                title="QRコードで近距離共有"
                              >
                                <QrCode size={15} className="text-amber-700" />
                              </button>

                              {/* URLコピーボタン */}
                              <button
                                onClick={() => handleCopyUrl(code.id)}
                                className="shrink-0 p-2 rounded-lg bg-amber-100 hover:bg-amber-200 transition-colors"
                                aria-label="招待URLをコピー"
                                title="招待URLをクリップボードにコピー"
                              >
                                {copiedCodeId === code.id
                                  ? <Check size={15} className="text-emerald-600" />
                                  : <Copy size={15} className="text-amber-700" />
                                }
                              </button>

                              {/* 削除ボタン */}
                              <button
                                onClick={() => deleteCode(code.id)}
                                className="shrink-0 p-2 rounded-lg bg-red-50 hover:bg-red-100 transition-colors"
                                aria-label="削除"
                              >
                                <Trash2 size={15} className="text-red-400 hover:text-red-600" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 上限メッセージ */}
                      {!canGenerate && (
                        <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 rounded-xl p-3 border border-slate-100">
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
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
