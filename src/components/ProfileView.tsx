import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  LogOut,
  Trash2,
  KeyRound,
  Sun,
  Handshake,
  Megaphone,
  MapPin,
  Camera,
  Edit2,
  ShieldCheck,
  Settings,
} from "lucide-react";
import { useProfile } from "../hooks/useProfile";
import { ADMIN_UIDS } from "../constants";
import { useAuth } from "../hooks/useAuthHook";
import { HeaderNavigation } from "./HeaderNavigation";
import { AppViewMode } from "../types";
import { getTrustRank } from "../utils/trustRank";
import { ProfileEditScreen } from "./ProfileEditScreen";

interface ProfileViewProps {
  onOpenAdmin?: () => void;
  userId?: string;
  initialEditMode?: boolean;
  onTabChange?: (mode: AppViewMode) => void;
}

interface ListItemProps {
  icon: React.ElementType;
  label: string;
  value?: string;
  onClick?: () => void;
  isDestructive?: boolean;
  hasArrow?: boolean;
  iconColor?: string;
  iconBg?: string;
}

const ListItem: React.FC<ListItemProps> = ({
  icon: Icon,
  label,
  value,
  onClick,
  isDestructive = false,
  hasArrow = true,
  iconColor = "text-slate-500",
  iconBg = "bg-slate-100",
}) => (
  <button
    onClick={onClick}
    disabled={!onClick}
    className={`w-full flex items-center justify-between p-4 bg-white border-b border-slate-100 last:border-0 ${onClick ? "hover:bg-slate-50 cursor-pointer" : "cursor-default"} transition-colors ${isDestructive ? "text-red-500" : "text-slate-700"}`}
  >
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-full ${iconBg}`}>
        <Icon size={16} className={iconColor} />
      </div>
      <span className="text-sm font-medium">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      {value && (
        <span className="text-sm font-bold text-slate-700">{value}</span>
      )}
      {hasArrow && onClick && (
        <ChevronRight size={16} className="text-slate-300" />
      )}
    </div>
  </button>
);

export const ProfileView: React.FC<ProfileViewProps> = ({
  onOpenAdmin,
  initialEditMode = false,
  onTabChange,
}) => {
  const { profile, isLoading: isProfileLoading } = useProfile();
  const { user, signOut, linkEmail, deleteAccount, updateUserPassword, reauthenticate } =
    useAuth();

  const [isEditingProfile, setIsEditingProfile] = useState(initialEditMode);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [confirmMode, setConfirmMode] = useState<"logout" | "delete" | null>(
    null,
  );
  const [deleteStep, setDeleteStep] = useState(0);
  const [showReauth, setShowReauth] = useState(false);
  const [reauthPassword, setReauthPassword] = useState("");

  const [emailInput, setEmailInput] = useState("");
  const [passInput, setPassInput] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmNewPass, setConfirmNewPass] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const isAnonymous = user?.isAnonymous ?? false;
  const currentName = profile?.name || "名もなき旅人";
  const helpfulCount = profile?.completed_contracts || 0;
  const requestCount = profile?.completed_requests || 0;
  const rank = getTrustRank(profile);

  const handleLinkAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);
    try {
      await linkEmail(emailInput, passInput);
      setSuccessMsg("本登録が完了しました");
      setTimeout(() => setShowLinkModal(false), 1500);
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (newPass !== confirmNewPass) {
      setErrorMsg("パスワードが一致しません");
      return;
    }
    setIsLoading(true);
    try {
      await updateUserPassword(newPass);
      setSuccessMsg("変更しました");
      setTimeout(() => setShowPassModal(false), 1500);
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  const handleDelete = async () => {
    setErrorMsg("");
    setIsLoading(true);
    try {
      // Logic: If non-anonymous, we MUST re-authenticate before touching the database
      if (!isAnonymous && !showReauth) {
         // This state should be handled by the UI showing the input first,
         // but as a safety check:
         setShowReauth(true);
         setErrorMsg("本人確認のためパスワードを入力してください。");
         setIsLoading(false);
         return;
      }

      if (showReauth && !isAnonymous) {
        await reauthenticate(reauthPassword);
        // If it fails, it throws to catch
      }

      // NOW we can safely delete database and auth account
      await deleteAccount();
      alert("退会しました。またいつか、時の流れでお会いしましょう。");
      window.location.href = "/"; // Force refresh to clean state
    } catch (e: unknown) {
      console.error("Delete failed", e);
      const firebaseError = e as { code?: string; message?: string };
      if (firebaseError.code === 'auth/requires-recent-login' || firebaseError.message?.includes('requires-recent-login')) {
        setShowReauth(true);
        setErrorMsg("認証が必要です。パスワードを入力してください。");
      } else if (firebaseError.code === 'auth/wrong-password') {
        setErrorMsg("パスワードが正しくありません。");
      } else {
        setErrorMsg("エラー: " + (e instanceof Error ? e.message : String(e)));
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isEditingProfile) {
    return (
      <ProfileEditScreen
        onClose={() => setIsEditingProfile(false)}
        onBack={() => setIsEditingProfile(false)}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col w-full h-full">
      {/* Subtle Section Header */}
      <div className="border-b border-slate-100 bg-white/50">
          <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
              <div>
                  <h2 className="text-sm font-bold tracking-widest uppercase text-slate-900">Profile</h2>
                  <p className="text-xs text-slate-500 font-mono tracking-[0.2em] uppercase">あなたの記録</p>
              </div>
              <div className="flex items-center gap-2">
                  {onOpenAdmin &&
                    (profile?.role === "admin" ||
                      (profile?.id && ADMIN_UIDS.includes(profile.id))) && (
                      <button
                        onClick={onOpenAdmin}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
                      >
                        <Settings size={18} strokeWidth={1.5} />
                      </button>
                    )}
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
                  >
                    <Edit2 size={18} strokeWidth={1.5} />
                  </button>
                  {onTabChange && (
                    <div className="shrink-0 ml-1">
                        <HeaderNavigation 
                            currentTab={initialEditMode ? "profile_edit" : "profile"} 
                            onTabChange={(tab: AppViewMode) => onTabChange(tab)} 
                        />
                    </div>
                  )}
              </div>
          </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar w-full">
        <div className="max-w-2xl mx-auto w-full px-6 pt-4 pb-24">
          {/* 1. Header Profile Info */}
          <div className="flex flex-col items-center py-8 bg-white mb-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="relative mb-3">
              <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-md">
                {profile?.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={currentName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                    <span className="text-3xl font-bold text-slate-400">
                      {currentName?.charAt(0).toUpperCase() || "?"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 mb-1">
              <h3 className="text-xl font-bold text-slate-900">
                {currentName}
              </h3>
              {rank.isVerified && (
                <ShieldCheck
                  size={18}
                  className="text-blue-500 fill-blue-50"
                  strokeWidth={2.5}
                />
              )}
            </div>

            <div className="flex flex-col items-center gap-2">
              {(!profile?.bio || !profile?.avatarUrl) && (
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="mt-1 text-xs text-blue-500 font-bold hover:text-blue-600 hover:underline transition-colors animate-pulse"
                >
                  自己紹介を入力して信頼を高めましょう
                </button>
              )}

              <div
                className={`text-xs font-bold px-3 py-1 rounded-full ${rank.bg} ${rank.color} flex items-center gap-1.5 shadow-sm`}
              >
                <span>{rank.icon}</span>
                <span>{rank.label}</span>
              </div>

              {profile?.has_cancellation_history &&
                (profile.consecutive_completions || 0) < 2 &&
                user?.uid === profile.id && (
                  <div className="mt-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg max-w-[200px]">
                    <p className="text-xs text-slate-500 text-center leading-snug">
                      信頼の器がすこし傷ついています。
                      <br />
                      あと{" "}
                      <span className="font-bold text-slate-700">
                        {2 - (profile.consecutive_completions || 0)}
                      </span>{" "}
                      回、お願いに最後まで応えると元通りになります。
                    </p>
                  </div>
                )}

              <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400 font-mono mt-1 px-4">
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50/50 rounded-lg border border-slate-100/50">
                  <span>ID: {profile?.id?.slice(0, 6)}...</span>
                </div>
                {(profile?.location?.prefecture || profile?.location?.city) && (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-50/50 rounded-lg border border-slate-100/50 text-slate-500">
                    <MapPin size={10} className="shrink-0 text-slate-400" />
                    <span className="whitespace-nowrap">
                      {profile.location.prefecture} {profile.location.city}
                    </span>
                  </div>
                )}
                {profile?.age_group && (
                  <div className="flex items-center px-2 py-0.5 bg-slate-50/50 rounded-lg border border-slate-100/50 text-slate-500">
                    <span className="whitespace-nowrap">
                        {profile.age_group}
                        {profile.gender && profile.gender !== 'other' && ` / ${profile.gender === 'male' ? '男性' : '女性'}`}
                    </span>
                  </div>
                )}
              </div>

              {profile?.bio && (
                <div className="mt-3 max-w-xs text-center">
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                    {profile.bio}
                  </p>
                </div>
              )}

              {profile?.links &&
                Object.values(profile.links).some((v) => v) && (
                  <div className="flex items-center gap-4 mt-3">
                    {profile.links.x && (
                      <a
                        href={
                          profile.links.x.startsWith("http")
                            ? profile.links.x
                            : `https://x.com/${profile.links.x.replace("@", "")}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-slate-900 text-white rounded-full hover:opacity-80 transition-opacity"
                      >
                        <span className="text-xs font-bold block w-4 h-4 text-center">
                          𝕏
                        </span>
                      </a>
                    )}
                    {profile.links.instagram && (
                      <a
                        href={
                          profile.links.instagram.startsWith("http")
                            ? profile.links.instagram
                            : `https://instagram.com/${profile.links.instagram.replace("@", "")}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 text-white rounded-full hover:opacity-80 transition-opacity"
                      >
                        <Camera size={16} />
                      </a>
                    )}
                    {profile.links.website && (
                      <a
                        href={profile.links.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 transition-colors"
                      >
                        <ChevronRight size={16} className="rotate-270" />
                      </a>
                    )}
                  </div>
                )}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <div className="text-xs font-bold text-slate-400 ml-2 mb-2">
                アクティビティ・実績
              </div>
              <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                <ListItem
                  icon={Handshake}
                  label="手伝った回数"
                  value={`${helpfulCount}回`}
                  hasArrow={false}
                  iconColor="text-blue-500"
                  iconBg="bg-blue-50"
                />
                <ListItem
                  icon={Megaphone}
                  label="依頼実績 (完了済)"
                  value={`${requestCount}回`}
                  hasArrow={false}
                  iconColor="text-slate-500"
                  iconBg="bg-slate-100"
                />
              </div>
            </div>

            <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm">
              {isAnonymous ? (
                <ListItem
                  icon={Sun}
                  label="アカウント本登録"
                  value="未設定"
                  onClick={() => setShowLinkModal(true)}
                />
              ) : (
                <ListItem
                  icon={KeyRound}
                  label="パスワード変更"
                  onClick={() => setShowPassModal(true)}
                />
              )}

              <ListItem
                icon={LogOut}
                label="ログアウト"
                onClick={() => setConfirmMode("logout")}
              />

              {!isAnonymous &&
                !isProfileLoading &&
                profile?.role !== "admin" &&
                !ADMIN_UIDS.includes(profile?.id || "") && (
                  <ListItem
                    icon={Trash2}
                    label="退会する"
                    isDestructive
                    onClick={() => {
                      setConfirmMode("delete");
                      setDeleteStep(1);
                      // Pre-emptively show re-auth if they are registered
                      if (!isAnonymous) setShowReauth(true);
                      else setShowReauth(false);
                    }}
                  />
                )}
            </div>

            <div className="text-center text-xs text-slate-300 py-4">
              Existence Ticker v0.2.0
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {(confirmMode || showLinkModal || showPassModal) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6"
          >
            {confirmMode === "logout" && (
              <div className="bg-white p-6 rounded-2xl w-full max-w-xs text-center shadow-xl">
                <h3 className="font-bold text-slate-800 mb-2">
                  ログアウトしますか？
                </h3>
                {isAnonymous && (
                  <p className="text-xs text-red-500 mb-4 bg-red-50 p-2 rounded">
                    ゲストアカウントのため、データが消失します。
                  </p>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmMode(null)}
                    className="flex-1 py-2.5 bg-slate-100 rounded-lg text-sm font-bold text-slate-600"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex-1 py-2.5 bg-red-500 rounded-lg text-sm font-bold text-white"
                  >
                    ログアウト
                  </button>
                </div>
              </div>
            )}

            {confirmMode === "delete" && (
              <div className="bg-white p-6 rounded-2xl w-full max-w-xs text-center shadow-xl">
                {deleteStep === 1 ? (
                  <>
                    <h3 className="font-bold text-red-600 mb-2">退会手続き</h3>
                    <p className="text-xs text-slate-600 mb-4 text-left">
                      全てのデータ（XP、温もり、履歴）が完全に消去されます。この操作は取り消せません。
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setConfirmMode(null)}
                        className="flex-1 py-2.5 bg-slate-100 rounded-lg text-sm font-bold text-slate-600"
                      >
                        キャンセル
                      </button>
                      <button
                        onClick={() => setDeleteStep(2)}
                        className="flex-1 py-2.5 bg-red-100 text-red-600 rounded-lg text-sm font-bold"
                      >
                        進む
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="font-bold text-red-600 mb-2">最終確認</h3>
                    <p className="text-sm text-red-500 mb-4 font-bold leading-relaxed px-2">
                      すべての記録と LM
                      は時の流れに還り、元に戻すことはできません。よろしいですか？
                    </p>

                    {showReauth && (
                      <div className="mb-4 space-y-2 text-left">
                        <p className="text-xs text-red-600 font-bold">パスワードを確認します</p>
                        <input
                          type="password"
                          value={reauthPassword}
                          onChange={(e) => setReauthPassword(e.target.value)}
                          placeholder="パスワードを入力"
                          className="w-full px-3 py-2 text-sm border border-red-200 rounded-lg focus:outline-none focus:border-red-400"
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
                        className="flex-1 py-2.5 bg-slate-100 rounded-lg text-sm font-bold text-slate-600"
                      >
                        やめる
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={isLoading}
                        className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-bold shadow-md disabled:opacity-50"
                      >
                        {isLoading ? "処理中..." : (showReauth ? "認証して退会" : "はい、還ります")}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {showLinkModal && (
              <div className="bg-white p-6 rounded-2xl w-full max-w-xs shadow-xl">
                <h3 className="font-bold text-slate-800 mb-4 text-center">
                  アカウント本登録
                </h3>
                <form onSubmit={handleLinkAccount} className="space-y-3">
                  <input
                    type="email"
                    placeholder="メールアドレス"
                    required
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                  />
                  <input
                    type="password"
                    placeholder="パスワード"
                    required
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                    value={passInput}
                    onChange={(e) => setPassInput(e.target.value)}
                  />
                  {errorMsg && (
                    <p className="text-xs text-red-500">{errorMsg}</p>
                  )}
                  {successMsg && (
                    <p className="text-xs text-green-500">{successMsg}</p>
                  )}

                  <div className="flex gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => setShowLinkModal(false)}
                      className="flex-1 py-2 bg-slate-100 rounded-lg text-xs font-bold text-slate-600"
                    >
                      閉じる
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold"
                    >
                      登録
                    </button>
                  </div>
                </form>
              </div>
            )}

            {showPassModal && (
              <div className="bg-white p-6 rounded-2xl w-full max-w-xs shadow-xl">
                <h3 className="font-bold text-slate-800 mb-4 text-center">
                  パスワード変更
                </h3>
                <form onSubmit={handleChangePassword} className="space-y-3">
                  <input
                    type="password"
                    placeholder="新しいパスワード"
                    required
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                  />
                  <input
                    type="password"
                    placeholder="確認用"
                    required
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                    value={confirmNewPass}
                    onChange={(e) => setConfirmNewPass(e.target.value)}
                  />
                  {errorMsg && (
                    <p className="text-xs text-red-500">{errorMsg}</p>
                  )}
                  {successMsg && (
                    <p className="text-xs text-green-500">{successMsg}</p>
                  )}

                  <div className="flex gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => setShowPassModal(false)}
                      className="flex-1 py-2 bg-slate-100 rounded-lg text-xs font-bold text-slate-600"
                    >
                      閉じる
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold"
                    >
                      変更
                    </button>
                  </div>
                </form>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
