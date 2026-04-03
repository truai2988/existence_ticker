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
  ShieldCheck,
  Edit2,
  Shield,
  Menu,
  Users,
  Languages,
} from "lucide-react";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProfile } from "../hooks/useProfile";
import { useAuth } from "../hooks/useAuthHook";
import { AppViewMode } from "../types";
import { getTrustRank } from "../utils/trustRank";
import { useLocationStats } from "../hooks/useLocationStats";
import { formatLocationCount, mapPrefecture, mapCity } from "../utils/formatLocation";
import { mapAgeGroup } from "../utils/formatAgeGroup";
import { ProfileEditScreen } from "./ProfileEditScreen";
import { SideDrawer } from "./SideDrawer";
import { PresenceModal } from "./PresenceModal";
import { useLanguage } from "../contexts/LanguageContext";

interface ProfileViewProps {
  userId?: string;
  initialEditMode?: boolean;
  onTabChange?: (mode: AppViewMode) => void;
  onOpenOnboarding: () => void;
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
  children?: React.ReactNode;
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
  children,
}) => {
  return (
    <div
      className={`w-full flex items-center justify-between p-4 bg-white/20 backdrop-blur-md mb-2 rounded-2xl ${onClick ? "hover:bg-white/40 cursor-pointer active:scale-[0.98] transition-all" : ""} ${isDestructive ? "text-red-500" : "text-slate-700"}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${iconBg}`}>
          <Icon size={16} className={iconColor} />
        </div>
        <span className="text-base font-medium font-sans">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {value && (
          <span className="text-base font-bold text-slate-700 font-sans">{value}</span>
        )}
        {children}
        {hasArrow && onClick && (
          <ChevronRight size={16} className="text-slate-500" />
        )}
      </div>
    </div>
  );
};

export const ProfileView: React.FC<ProfileViewProps> = ({
  initialEditMode = false,
  onTabChange,
  onOpenOnboarding,
}) => {
  const { profile, isLoading: isProfileLoading } = useProfile();
  const { t: MESSAGES, lang, setLang } = useLanguage();
  const { user, isAdmin, signOut, linkEmail, deleteAccount, updateUserPassword, reauthenticate } =
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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showPresenceModal, setShowPresenceModal] = useState(false);

  const isAnonymous = user?.isAnonymous ?? false;
  const currentName = profile?.name || MESSAGES.PROFILE.FALLBACK_NAME;
  const helpfulCount = profile?.completed_contracts || 0;
  const requestCount = profile?.completed_requests || 0;
  const rank = getTrustRank(profile);

  const handleLinkAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);
    try {
      await linkEmail(emailInput, passInput);
      setSuccessMsg(MESSAGES.PROFILE.LINK_SUCCESS);
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
      setErrorMsg(MESSAGES.PROFILE.PW_MISMATCH);
      return;
    }
    setIsLoading(true);
    try {
      await updateUserPassword(newPass);
      setSuccessMsg(MESSAGES.PROFILE.PW_CHANGE_SUCCESS);
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
         setErrorMsg(MESSAGES.PROFILE.AUTH_REQUIRE);
         setIsLoading(false);
         return;
      }

      if (showReauth && !isAnonymous) {
        await reauthenticate(reauthPassword);
        // If it fails, it throws to catch
      }

      // NOW we can safely delete database and auth account
      await deleteAccount();
      alert(MESSAGES.PROFILE.MSG_FAREWELL);
      window.location.href = "/"; // Force refresh to clean state
    } catch (e: unknown) {
      console.error("Delete failed", e);
      const firebaseError = e as { code?: string; message?: string };
      if (firebaseError.code === 'auth/requires-recent-login' || firebaseError.message?.includes('requires-recent-login')) {
        setShowReauth(true);
        setErrorMsg(MESSAGES.PROFILE.PW_REQUIRED);
      } else if (firebaseError.code === 'auth/wrong-password') {
        setErrorMsg(MESSAGES.PROFILE.PW_INCORRECT);
      } else {
        setErrorMsg(MESSAGES.PROFILE.ERROR_PREFIX + (e instanceof Error ? e.message : String(e)));
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isEditingProfile) {
    return (
      <ProfileEditScreen
        onClose={() => {
            setIsEditingProfile(false);
            onTabChange?.("profile");
        }}
        onBack={() => {
            setIsEditingProfile(false);
            onTabChange?.("profile");
        }}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col w-full h-full">
      {/* Subtle Section Header */}
      <div className="pt-safe">
          <div className="max-w-2xl mx-auto px-6 py-4 md:py-6 flex items-center justify-between flex-wrap gap-y-4 gap-x-2">
              <div className="flex items-center gap-3 min-w-0">
                   {/* Logo: ホームへ戻るボタン */}
                   <button
                       onClick={() => onTabChange?.('home')}
                       aria-label={MESSAGES.LAYOUT.RETURN_HOME}
                       className="shrink-0 focus:outline-none active:scale-95 transition-transform"
                   >
                       <img
                           src="/logo.png"
                           alt="Existence Ticker"
                           className="w-10 h-10 rounded-lg shadow-sm border border-slate-200/40 object-cover hover:opacity-80 transition-opacity"
                       />
                   </button>
                   {/* Text Group */}
                   <div className="flex flex-col min-w-0 flex-1 justify-center">
                                <h2 className="text-xl sm:text-2xl font-light tracking-[0.2em] sm:tracking-[0.4em] text-slate-800 truncate leading-tight uppercase" style={{fontFamily: "'Noto Serif JP', serif"}}>{MESSAGES.PROFILE.TITLE}</h2>
                   </div>
              </div>
              <div className="flex h-12 items-center gap-3 shrink-0">
                  {/* Page-specific: Admin */}
                  {user && !user.isAnonymous && isAdmin && (
                    <button
                      onClick={() => onTabChange?.("admin")}
                      className="p-3 text-red-400 hover:text-red-600 transition-colors active:scale-95"
                      aria-label={MESSAGES.PROFILE.ARIA_ADMIN}
                    >
                      <Shield size={22} strokeWidth={1.5} />
                    </button>
                  )}
                  {/* Page-specific: Profile Edit */}
                  {!initialEditMode && (
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="p-3 text-slate-500 hover:text-slate-600 transition-colors active:scale-95"
                      aria-label={MESSAGES.PROFILE.ARIA_EDIT}
                    >
                      <Edit2 size={22} strokeWidth={1.5} />
                    </button>
                  )}
                  {/* Hamburger */}
                  <button
                    onClick={() => setIsDrawerOpen(true)}
                    className="p-3 -mr-3 text-slate-500 hover:text-slate-800 transition-colors active:scale-95"
                    aria-label={MESSAGES.LAYOUT.OPEN_MENU}
                  >
                    <Menu size={24} strokeWidth={1.5} />
                  </button>
              </div>
          </div>
      </div>

      <SideDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        currentTab={initialEditMode ? "profile_edit" : "profile"}
        onTabChange={(tab: AppViewMode) => onTabChange?.(tab)}
        onOpenOnboarding={onOpenOnboarding}
      />

      <div className="flex-1 overflow-y-auto no-scrollbar w-full">
        <div className="max-w-2xl mx-auto w-full px-6 pt-4 pb-32">
          {/* 1. Header Profile Info (Glass Sanctuary) */}
          <div className="flex flex-col items-center py-10 bg-white/40 backdrop-blur-3xl mb-6 rounded-[2.5rem] border border-white/60">
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
                    <span className="text-3xl font-bold text-slate-500">
                      {currentName?.charAt(0).toUpperCase() || "?"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 mb-1">
              <h3 className="text-base font-bold text-slate-900 font-sans">
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
                  className="mt-1 text-base text-amber-600 font-bold hover:text-amber-700 hover:underline transition-colors animate-pulse font-sans"
                >
                  {MESSAGES.PROFILE.PROMPT_BIO}
                </button>
              )}

              <div
                className={`text-xs font-bold px-3 py-1 rounded-full ${rank.bg} ${rank.color} flex items-center gap-1.5 shadow-sm font-sans`}
              >
                <span>{rank.icon}</span>
                <span>{MESSAGES.DATA.RANKS[rank.id]}</span>
              </div>

              {profile?.has_cancellation_history &&
                (profile.consecutive_completions || 0) < 2 &&
                user?.uid === profile.id && (
                  <div className="mt-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg max-w-[240px]">
                    <p className="text-sm text-slate-600 text-center leading-relaxed font-sans">
                      {MESSAGES.PROFILE.TRUST_RECOVERY_1}
                      <br />
                      {MESSAGES.PROFILE.TXT_LEFT_DAYS}{" "}
                      <span className="font-bold text-slate-700">
                        {2 - (profile.consecutive_completions || 0)}
                      </span>{" "}
                      {MESSAGES.PROFILE.TRUST_RECOVERY_2}
                    </p>
                  </div>
                )}

              <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-slate-500 font-mono mt-1 px-4">
                {(profile?.location?.prefecture || profile?.location?.city) && (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-50/50 rounded-lg border border-slate-100/50 text-slate-500">
                    <MapPin size={12} className="shrink-0 text-slate-500" />
                    <span className="whitespace-nowrap">
                      {mapPrefecture(profile.location.prefecture)} {mapCity(profile.location.city)}
                    </span>
                  </div>
                )}
                {profile?.age_group && (
                  <div className="flex items-center px-2 py-0.5 bg-slate-50/50 rounded-lg border border-slate-100/50 text-slate-500">
                    <span className="whitespace-nowrap">
                        {mapAgeGroup(profile.age_group, MESSAGES)}
                        {profile.gender && profile.gender !== 'other' && ` / ${profile.gender === 'male' ? MESSAGES.WISH_CARD.LBL_MALE : MESSAGES.WISH_CARD.LBL_FEMALE}`}
                    </span>
                  </div>
                )}
              </div>

               {profile?.bio && (
                <div className="mt-3 max-w-xs text-center">
                  <p className="text-base text-slate-700 leading-relaxed bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 font-sans">
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
                        <span className="text-sm font-bold block w-4 h-4 text-center">
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
            {/* エリア情報 */}
            <AreaInfoCard 
              profile={profile} 
              onClick={() => setShowPresenceModal(true)} 
            />
            <div>
               <div className="text-sm font-bold text-slate-500 ml-2 mb-2" style={{fontFamily: "'Noto Serif JP', serif"}}>
                {MESSAGES.PROFILE.TTL_ACTIVITY}
              </div>
               <div className="bg-transparent space-y-1">
                <ListItem
                  icon={Handshake}
                  label={MESSAGES.PROFILE.ACT_HELPED}
                  value={`${helpfulCount}${MESSAGES.PROFILE.TXT_TIMES}`}
                  hasArrow={false}
                  iconColor="text-emerald-600"
                  iconBg="bg-emerald-50/50"
                />
                <ListItem
                  icon={Megaphone}
                  label={MESSAGES.PROFILE.ACT_REQUESTED}
                  value={`${requestCount}${MESSAGES.PROFILE.TXT_TIMES}`}
                  hasArrow={false}
                  iconColor="text-amber-600"
                  iconBg="bg-amber-50/50"
                />
              </div>
            </div>

            <div className="bg-transparent space-y-1">
              {isAnonymous ? (
                <ListItem
                  icon={Sun}
                  label={MESSAGES.PROFILE.MENU_LINK_ACCOUNT}
                  value={MESSAGES.PROFILE.TXT_NOT_SET}
                  onClick={() => setShowLinkModal(true)}
                />
              ) : (
                <ListItem
                  icon={KeyRound}
                  label={MESSAGES.PROFILE.MENU_CHANGE_PASS}
                  onClick={() => setShowPassModal(true)}
                />
              )}

              <ListItem
                icon={LogOut}
                label={MESSAGES.PROFILE.MENU_LOGOUT}
                onClick={() => setConfirmMode("logout")}
              />

              {!isAnonymous &&
                !isProfileLoading &&
                profile?.role !== "admin" && (
                  <ListItem
                    icon={Trash2}
                    label={MESSAGES.PROFILE.MENU_DELETE}
                    isDestructive
                    onClick={() => {
                      setConfirmMode("delete");
                      setDeleteStep(1);
                      if (!isAnonymous) setShowReauth(true);
                      else setShowReauth(false);
                    }}
                  />
                )}

              <ListItem
                icon={Languages}
                label={MESSAGES.PROFILE.LANG_TITLE}
                hasArrow={false}
              >
                <div className="flex bg-slate-100 p-0.5 rounded-lg shrink-0">
                  <button
                    onClick={() => setLang('ja')}
                    className={`px-3 py-1 text-sm font-bold rounded-md transition-all ${
                      lang === 'ja'
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    日本語
                  </button>
                  <button
                    onClick={() => setLang('en')}
                    className={`px-3 py-1 text-sm font-bold rounded-md transition-all ${
                      lang === 'en'
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    EN
                  </button>
                </div>
              </ListItem>
            </div>



             <div className="text-center text-xs uppercase tracking-[0.3em] text-slate-500 opacity-60 py-8 font-sans focus:outline-none">
               Existence Ticker v0.2.0 Sanctuary Edition
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
                 <h3 className="font-bold text-slate-800 mb-2 text-base font-sans">
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
                     className="flex-1 py-2.5 bg-slate-100 rounded-lg text-base font-bold text-slate-600 font-sans"
                   >
                     {MESSAGES.PROFILE.BTN_CANCEL}
                   </button>
                   <button
                     onClick={handleLogout}
                     className="flex-1 py-2.5 bg-red-500 rounded-lg text-base font-bold text-white font-sans"
                   >
                     {MESSAGES.PROFILE.MENU_LOGOUT}
                   </button>
                 </div>
              </div>
            )}

            {confirmMode === "delete" && (
              <div className="bg-white p-6 rounded-2xl w-full max-w-xs text-center shadow-xl">
                {deleteStep === 1 ? (
                  <>
                    <h3 className="font-bold text-red-600 mb-2 text-base font-sans">{MESSAGES.PROFILE.DELETE_TITLE_1}</h3>
                    <p className="text-xs text-slate-600 mb-4 text-left font-sans">
                      {MESSAGES.PROFILE.DELETE_DESC_1}
                    </p>
                     <div className="flex gap-3">
                       <button
                         onClick={() => setConfirmMode(null)}
                         className="flex-1 py-2.5 bg-slate-100 rounded-lg text-base font-bold text-slate-600 font-sans"
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
                     <h3 className="font-bold text-red-600 mb-2 text-base font-sans">{MESSAGES.PROFILE.DELETE_TITLE_2}</h3>
                     <p className="text-base text-red-500 mb-4 font-bold leading-relaxed px-2 font-sans">
                       {MESSAGES.PROFILE.DELETE_DESC_2}
                     </p>

                    {showReauth && (
                      <div className="mb-4 space-y-2 text-left">
                        <p className="text-sm text-red-600 font-bold">{MESSAGES.PROFILE.PW_VERIFY}</p>
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
                         className="flex-1 py-2.5 bg-slate-100 rounded-lg text-base font-bold text-slate-600 font-sans"
                       >
                         {MESSAGES.PROFILE.BTN_QUIT}
                       </button>
                       <button
                         onClick={handleDelete}
                         disabled={isLoading}
                         className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-base font-bold shadow-md disabled:opacity-50 font-sans"
                       >
                         {isLoading ? MESSAGES.PROFILE.PROC_LOADING : (showReauth ? MESSAGES.PROFILE.BTN_AUTH_LEAVE : MESSAGES.PROFILE.BTN_LEAVE)}
                       </button>
                     </div>
                  </>
                )}
              </div>
            )}

            {showLinkModal && (
              <div className="bg-white p-6 rounded-2xl w-full max-w-xs shadow-xl">
                <h3 className="font-bold text-slate-800 mb-4 text-center">
                  {MESSAGES.PROFILE.TTL_ACCOUNT_REG}
                </h3>
                <form onSubmit={handleLinkAccount} className="space-y-3">
                  <input
                    type="email"
                    placeholder={MESSAGES.PROFILE.PH_EMAIL}
                    required
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg text-base"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                  />
                  <input
                    type="password"
                    placeholder={MESSAGES.PROFILE.PH_PASSWORD}
                    required
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg text-base"
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
                      className="flex-1 py-3 bg-slate-100 rounded-lg text-base font-bold text-slate-600"
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

            {showPassModal && (
              <div className="bg-white p-6 rounded-2xl w-full max-w-xs shadow-xl">
                <h3 className="font-bold text-slate-800 mb-4 text-center">
                  {MESSAGES.PROFILE.TTL_PW_CHANGE}
                </h3>
                <form onSubmit={handleChangePassword} className="space-y-3">
                  <input
                    type="password"
                    placeholder={MESSAGES.PROFILE.PH_NEW_PASSWORD}
                    required
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg text-base"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                  />
                  <input
                    type="password"
                    placeholder={MESSAGES.PROFILE.PH_CONFIRM}
                    required
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg text-base"
                    value={confirmNewPass}
                    onChange={(e) => setConfirmNewPass(e.target.value)}
                  />
                  {errorMsg && (
                    <p className="text-sm text-red-600">{errorMsg}</p>
                  )}
                  {successMsg && (
                    <p className="text-sm text-green-600">{successMsg}</p>
                  )}

                  <div className="flex gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => setShowPassModal(false)}
                      className="flex-1 py-3 bg-slate-100 rounded-lg text-base font-bold text-slate-600"
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

      <AnimatePresence>
        {showPresenceModal && (
          <PresenceModal onClose={() => setShowPresenceModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

/** エリア情報カード — ProfileView専用 */
const AreaInfoCard: React.FC<{ 
  profile: ReturnType<typeof useProfile>["profile"],
  onClick: () => void 
}> = ({ profile, onClick }) => {
  const { t: MESSAGES } = useLanguage();
  const { statsCount } = useLocationStats(
    profile?.location?.prefecture,
    profile?.location?.city,
  );

  const locationText = profile?.location
    ? `${mapPrefecture(profile.location.prefecture)} ${mapCity(profile.location.city)}`.trim() : MESSAGES.PROFILE.TXT_AREA_NOT_SET;

  const userCountText = statsCount === null ? MESSAGES.PROFILE.TXT_CHECKING : formatLocationCount(statsCount, MESSAGES);

  return (
    <div className="group">
      <div className="text-sm font-bold text-slate-500 ml-2 mb-2 font-sans group-hover:text-slate-600 transition-colors">
        {MESSAGES.PROFILE.TTL_AREA_INFO}
      </div>
      <button 
        onClick={onClick}
        className="w-full bg-white/40 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/60 transition-all hover:bg-white/50 active:scale-[0.99] text-left"
      >
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-emerald-50 group-hover:bg-emerald-100 transition-colors">
              <MapPin size={18} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-800 font-sans">
                {locationText}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Users size={14} className="text-slate-500" />
                <span className="text-sm text-slate-600 font-mono">
                  {userCountText}
                </span>
              </div>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-500 group-hover:text-slate-500 transition-colors" />
        </div>
      </button>
    </div>
  );
};
