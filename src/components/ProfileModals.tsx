import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../contexts/LanguageContext";

// ====== 型定義 ======

interface ProfileModalsProps {
  // 共通状態
  isLoading: boolean;
  errorMsg: string;
  successMsg: string;
  isAnonymous: boolean;

  // ログアウト確認
  confirmMode: "logout" | "delete" | null;
  setConfirmMode: (mode: "logout" | "delete" | null) => void;
  onLogout: () => Promise<void>;

  // アカウント削除
  deleteStep: number;
  setDeleteStep: (step: number) => void;
  showReauth: boolean;
  setShowReauth: (v: boolean) => void;
  reauthPassword: string;
  setReauthPassword: (v: string) => void;
  setErrorMsg: (v: string) => void;
  onDelete: () => Promise<void>;

  // アカウント連携
  showLinkModal: boolean;
  setShowLinkModal: (v: boolean) => void;
  emailInput: string;
  setEmailInput: (v: string) => void;
  passInput: string;
  setPassInput: (v: string) => void;
  onLinkAccount: (e: React.FormEvent) => Promise<void>;

  // パスワード変更
  showPassModal: boolean;
  setShowPassModal: (v: boolean) => void;
  newPass: string;
  setNewPass: (v: string) => void;
  confirmNewPass: string;
  setConfirmNewPass: (v: string) => void;
  onChangePassword: (e: React.FormEvent) => Promise<void>;
}

// ====== コンポーネント ======

export const ProfileModals: React.FC<ProfileModalsProps> = ({
  isLoading,
  errorMsg,
  successMsg,
  isAnonymous,
  confirmMode,
  setConfirmMode,
  onLogout,
  deleteStep,
  setDeleteStep,
  showReauth,
  setShowReauth,
  reauthPassword,
  setReauthPassword,
  setErrorMsg,
  onDelete,
  showLinkModal,
  setShowLinkModal,
  emailInput,
  setEmailInput,
  passInput,
  setPassInput,
  onLinkAccount,
  showPassModal,
  setShowPassModal,
  newPass,
  setNewPass,
  confirmNewPass,
  setConfirmNewPass,
  onChangePassword,
}) => {
  const { t: MESSAGES } = useLanguage();
  const isVisible = !!(confirmMode || showLinkModal || showPassModal);

  return (
    <>
      {/* ====== ログアウト / 削除 / 連携 / パスワード変更モーダル ====== */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6"
          >
            {/* ログアウト確認 */}
            {confirmMode === "logout" && (
              <div className="bg-white p-6 rounded-2xl w-full max-w-xs text-center shadow-xl">
                <h3 className="font-bold text-slate-900 mb-2 text-base font-sans">
                  {MESSAGES.PROFILE.LOGOUT_CONFIRM}
                </h3>
                {isAnonymous && (
                  <p className="text-sm text-red-500 mb-4 bg-red-50 p-3 rounded font-sans">
                    {MESSAGES.PROFILE.LOGOUT_GUEST_WARN}
                  </p>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmMode(null)}
                    className="flex-1 py-2.5 bg-slate-100 rounded-lg text-base font-bold text-slate-800 font-sans"
                  >
                    {MESSAGES.PROFILE.BTN_CANCEL}
                  </button>
                  <button
                    onClick={onLogout}
                    className="flex-1 py-2.5 bg-red-500 rounded-lg text-base font-bold text-white font-sans"
                  >
                    {MESSAGES.PROFILE.MENU_LOGOUT}
                  </button>
                </div>
              </div>
            )}

            {/* アカウント削除確認 */}
            {confirmMode === "delete" && (
              <div className="bg-white p-6 rounded-2xl w-full max-w-xs text-center shadow-xl">
                {deleteStep === 1 ? (
                  <>
                    <h3 className="font-bold text-red-600 mb-2 text-base font-sans">
                      {MESSAGES.PROFILE.DELETE_TITLE_1}
                    </h3>
                    <p className="text-xs text-slate-800 mb-4 text-left font-sans">
                      {MESSAGES.PROFILE.DELETE_DESC_1}
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setConfirmMode(null)}
                        className="flex-1 py-2.5 bg-slate-100 rounded-lg text-base font-bold text-slate-800 font-sans"
                      >
                        {MESSAGES.PROFILE.BTN_CANCEL}
                      </button>
                      <button
                        onClick={() => setDeleteStep(2)}
                        className="flex-1 py-2.5 bg-red-100 text-red-600 rounded-lg text-base font-bold font-sans"
                      >
                        {MESSAGES.PROFILE.BTN_PROCEED}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="font-bold text-red-600 mb-2 text-base font-sans">
                      {MESSAGES.PROFILE.DELETE_TITLE_2}
                    </h3>
                    <p className="text-base text-red-500 mb-4 font-bold leading-relaxed px-2 font-sans">
                      {MESSAGES.PROFILE.DELETE_DESC_2}
                    </p>

                    {showReauth && (
                      <div className="mb-4 space-y-2 text-left">
                        <p className="text-sm text-red-600 font-bold">
                          {MESSAGES.PROFILE.PW_VERIFY}
                        </p>
                        <input
                          type="password"
                          value={reauthPassword}
                          onChange={(e) => setReauthPassword(e.target.value)}
                          placeholder={MESSAGES.PROFILE.PW_INPUT}
                          className="w-full px-3 py-2 text-base border border-red-200 rounded-lg focus:outline-none focus:border-red-400 font-sans"
                        />
                      </div>
                    )}

                    {errorMsg && (
                      <p className="text-xs text-red-600 mb-3 font-bold text-left">{errorMsg}</p>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setConfirmMode(null);
                          setShowReauth(false);
                          setReauthPassword("");
                          setErrorMsg("");
                        }}
                        className="flex-1 py-2.5 bg-slate-100 rounded-lg text-base font-bold text-slate-800 font-sans"
                      >
                        {MESSAGES.PROFILE.BTN_QUIT}
                      </button>
                      <button
                        onClick={onDelete}
                        disabled={isLoading}
                        className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-base font-bold shadow-md disabled:opacity-50 font-sans"
                      >
                        {isLoading
                          ? MESSAGES.PROFILE.PROC_LOADING
                          : showReauth
                          ? MESSAGES.PROFILE.BTN_AUTH_LEAVE
                          : MESSAGES.PROFILE.BTN_LEAVE}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* アカウント連携モーダル */}
            {showLinkModal && (
              <div className="bg-white p-6 rounded-2xl w-full max-w-xs shadow-xl">
                <h3 className="font-bold text-slate-900 mb-4 text-center">
                  {MESSAGES.PROFILE.TTL_ACCOUNT_REG}
                </h3>
                <form onSubmit={onLinkAccount} className="space-y-3">
                  <input
                    type="email"
                    placeholder={MESSAGES.PROFILE.PH_EMAIL}
                    required
                    className="w-full p-4 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                  />
                  <input
                    type="password"
                    placeholder={MESSAGES.PROFILE.PH_PASSWORD}
                    required
                    className="w-full p-4 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                    value={passInput}
                    onChange={(e) => setPassInput(e.target.value)}
                  />
                  {errorMsg && <p className="text-xs text-red-500">{errorMsg}</p>}
                  {successMsg && <p className="text-xs text-green-500">{successMsg}</p>}
                  <div className="flex gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => setShowLinkModal(false)}
                      className="flex-1 py-3 bg-slate-100 rounded-lg text-base font-bold text-slate-800"
                    >
                      {MESSAGES.PROFILE.BTN_CLOSE}
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 py-3 bg-blue-600 text-white rounded-lg text-base font-bold"
                    >
                      {MESSAGES.PROFILE.BTN_REGISTER}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* パスワード変更モーダル */}
            {showPassModal && (
              <div className="bg-white p-6 rounded-2xl w-full max-w-xs shadow-xl">
                <h3 className="font-bold text-slate-900 mb-4 text-center">
                  {MESSAGES.PROFILE.TTL_PW_CHANGE}
                </h3>
                <form onSubmit={onChangePassword} className="space-y-3">
                  <input
                    type="password"
                    placeholder={MESSAGES.PROFILE.PH_NEW_PASSWORD}
                    required
                    className="w-full p-4 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                  />
                  <input
                    type="password"
                    placeholder={MESSAGES.PROFILE.PH_CONFIRM}
                    required
                    className="w-full p-4 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                    value={confirmNewPass}
                    onChange={(e) => setConfirmNewPass(e.target.value)}
                  />
                  {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
                  {successMsg && <p className="text-sm text-green-600">{successMsg}</p>}
                  <div className="flex gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => setShowPassModal(false)}
                      className="flex-1 py-3 bg-slate-100 rounded-lg text-base font-bold text-slate-800"
                    >
                      {MESSAGES.PROFILE.BTN_CLOSE}
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 py-3 bg-slate-800 text-white rounded-lg text-base font-bold"
                    >
                      {MESSAGES.PROFILE.BTN_CHANGE_PW}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
