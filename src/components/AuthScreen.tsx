import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuthHook';
import { useToast } from '../hooks/useToast';
import { useLanguage } from '../contexts/LanguageContext';
import {
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  MapPin,
  Key,
  ChevronDown,
  ArrowRight,
  Loader2,
  AlertCircle
} from "lucide-react";
import { PREFECTURES } from "../data/prefectures";
import { useLocationData } from "../hooks/useLocationData";

/* Typography Rule: font-serif/font-sans, 3sizes (text-3xl, text-base, text-xs) */

interface AuthScreenProps {
  onSuccess: () => void;
  isModal?: boolean;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess, isModal = false }) => {
  const { t: MESSAGES } = useLanguage();
  const { signIn, signUp, resetPassword } = useAuth();
  const { showToast } = useToast();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const feedbackNeeded = sessionStorage.getItem("ghost_pured_feedback_needed");
      if (code || feedbackNeeded === "true") return "signup";
    }
    return "login";
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  // ゴースト是正後のフィードバック検知 (エラー表示のみ残す)
  useEffect(() => {
    const feedbackNeeded = sessionStorage.getItem(
      "ghost_pured_feedback_needed",
    );
    if (feedbackNeeded === "true") {
      setError(MESSAGES.AUTH.GHOST_PURGE_FEEDBACK);
      sessionStorage.removeItem("ghost_pured_feedback_needed");
    }
  }, [MESSAGES.AUTH.GHOST_PURGE_FEEDBACK]);

  // Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [invitationCode, setInvitationCode] = useState("");

  // URLのパラメータから招待コードを取得
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      setInvitationCode(code);
    }
  }, []);

  // Location
  const [prefecture, setPrefecture] = useState("");
  const [city, setCity] = useState("");

  // Location Data Hook
  const { cities, loading: loadingCities } = useLocationData(prefecture);

  // Demographics
  const [ageGroup, setAgeGroup] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other" | "">("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSuccess(false);
    setIsLoading(true);

    // 標準的なバリデーション (メール形式チェック)
    const validateEmail = (email: string) => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    try {
      if (mode === "login") {
        if (!email) throw new Error(MESSAGES.AUTH.EMAIL_REQUIRED);
        if (!validateEmail(email))
          throw new Error(MESSAGES.AUTH.EMAIL_INVALID);
        if (!password) throw new Error(MESSAGES.AUTH.PASSWORD_REQUIRED);

        await signIn(email, password);
        setShowWelcome(true);
        setTimeout(() => onSuccess(), 4000);
      } else if (mode === "signup") {
        // バリデーション
        if (!name.trim()) throw new Error(MESSAGES.AUTH.NAME_REQUIRED);
        if (!gender) throw new Error(MESSAGES.AUTH.GENDER_REQUIRED);
        if (!ageGroup) throw new Error(MESSAGES.AUTH.AGE_GROUP_REQUIRED);
        if (!prefecture) throw new Error(MESSAGES.AUTH.PREFECTURE_REQUIRED);
        if (!city) throw new Error(MESSAGES.AUTH.CITY_REQUIRED);

        if (!email) throw new Error(MESSAGES.AUTH.EMAIL_REQUIRED);
        if (!validateEmail(email))
          throw new Error(MESSAGES.AUTH.EMAIL_INVALID);

        if (!password) throw new Error(MESSAGES.AUTH.PASSWORD_REQUIRED);
        if (password.length < 6)
          throw new Error(MESSAGES.AUTH.PASSWORD_WEAK);

        if (!invitationCode.trim()) {
            showToast(MESSAGES.AUTH.INVITE_REQUEST, 'error');
            return;
        }
        await signUp(
          email,
          password,
          name,
          { prefecture, city },
          ageGroup,
          gender as "male" | "female" | "other",
          invitationCode,
        );
        setShowWelcome(true);
        setTimeout(() => onSuccess(), 4000);
      } else if (mode === "forgot") {
        if (!email) throw new Error(MESSAGES.AUTH.EMAIL_REQUIRED);
        await resetPassword(email);
        showToast(MESSAGES.AUTH.PW_RESET_SENT, 'success');
        setIsSuccess(true);
        setIsLoading(false);
        return;
      }
    } catch (err: unknown) {
      console.error(err);
      const error = err as { code?: string; message?: string };
      const message = error.code
        ? MESSAGES.AUTH.FIREBASE_ERRORS[error.code as keyof typeof MESSAGES.AUTH.FIREBASE_ERRORS] || MESSAGES.SYSTEM.ERROR_GENERIC
        : error.message || MESSAGES.SYSTEM.ERROR_GENERIC;
      showToast(message, 'error');
      setError(message);
    } finally {
      if (mode !== "forgot") setIsLoading(false);
    }
  };

  return (
    <div className={`flex flex-col items-center p-4 w-full max-w-2xl mx-auto relative z-10 ${isModal ? 'mt-2' : 'justify-center min-h-[100dvh]'}`}>
      <motion.div
        layout
        initial={isModal ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-white border border-slate-200 rounded-2xl shadow-xl p-8 overflow-hidden"
      >
        <div className="flex flex-col items-center mb-8">
          <h1
            className="text-xl font-serif font-medium text-slate-900 mb-2 whitespace-nowrap"
            style={{ fontFamily: "Inter, Noto Sans JP" }}
          >
            {mode === "login" && MESSAGES.AUTH.APP_TITLE}
            {mode === "signup" && MESSAGES.AUTH.APP_TITLE}
            {mode === "forgot" && MESSAGES.AUTH.REIGNITE_TITLE}
          </h1>
          <div className="h-1 w-12 bg-slate-300 rounded-full" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Login & Signup common fields */}
          <div className="flex flex-col gap-4">
            <AnimatePresence mode="popLayout">
              {mode === "signup" && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col gap-1.5"
                >
                  <label className="text-sm font-bold text-slate-800 ml-1">
                    {MESSAGES.AUTH.NAME_LABEL} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <User
                      className="absolute left-3 top-3 text-slate-700 group-focus-within:text-slate-800 transition-colors"
                      size={18}
                    />
                    <input
                      type="text"
                      placeholder={MESSAGES.AUTH.NAME_PLACEHOLDER}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-10 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-slate-200 focus:border-transparent transition-all placeholder:text-slate-700 text-sm"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-800 ml-1">
                {MESSAGES.AUTH.EMAIL_LABEL} <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <Mail
                  className="absolute left-3 top-3 text-slate-700 group-focus-within:text-slate-800 transition-colors"
                  size={18}
                />
                <input
                  type="email"
                  placeholder={MESSAGES.AUTH.EMAIL_PLACEHOLDER}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-10 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-slate-200 focus:border-transparent transition-all placeholder:text-slate-700 text-sm"
                />
              </div>
            </div>

            {mode !== "forgot" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-slate-800 ml-1">
                  {MESSAGES.AUTH.PASSWORD_LABEL} <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <Lock
                    className="absolute left-3 top-3 text-slate-700 group-focus-within:text-slate-800 transition-colors"
                    size={18}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder={MESSAGES.AUTH.PASSWORD_PLACEHOLDER}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-10 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-slate-200 focus:border-transparent transition-all placeholder:text-slate-700 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-700 hover:text-slate-800 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            <AnimatePresence>
              {mode === "signup" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-col gap-4 overflow-hidden pt-2"
                >
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold text-slate-800 ml-1">
                      {MESSAGES.AUTH.RESIDENCE_LABEL} <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative group">
                        <MapPin
                          className="absolute left-3 top-3 text-slate-700 group-focus-within:text-slate-800 transition-colors pointer-events-none"
                          size={18}
                        />
                        <select
                          value={prefecture}
                          onChange={(e) => {
                            setPrefecture(e.target.value);
                            setCity("");
                          }}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-10 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-slate-200 focus:border-transparent transition-all appearance-none text-sm"
                        >
                          <option value="" disabled>
                            {MESSAGES.AUTH.PREFECTURE_PLACEHOLDER}
                          </option>
                          {PREFECTURES.map((pref) => (
                            <option key={pref} value={pref}>
                              {pref}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          className="absolute right-3 top-3 text-slate-700 pointer-events-none"
                          size={18}
                        />
                      </div>
                      <div className="relative group">
                        <select
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-slate-200 focus:border-transparent transition-all appearance-none disabled:opacity-50 text-sm"
                          disabled={!prefecture || loadingCities}
                        >
                          <option value="" disabled>
                            {loadingCities ? MESSAGES.AUTH.CITY_LOADING : MESSAGES.AUTH.CITY_PLACEHOLDER}
                          </option>
                          {cities.map((cityName) => (
                            <option key={cityName} value={cityName}>
                              {cityName}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          className="absolute right-3 top-3 text-slate-700 pointer-events-none"
                          size={18}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-slate-700 ml-1 mt-1 leading-tight font-medium">
                      {MESSAGES.AUTH.RESIDENCE_HELP}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-bold text-slate-800 ml-1">
                        {MESSAGES.AUTH.AGE_GROUP_LABEL} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative group">
                        <select
                          value={ageGroup}
                          onChange={(e) => setAgeGroup(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-slate-200 focus:border-transparent transition-all text-sm appearance-none"
                        >
                          <option value="" disabled>
                            {MESSAGES.AUTH.AGE_GROUP_PLACEHOLDER}
                          </option>
                          <option value="under_20">{MESSAGES.AUTH.AGE_GROUP_UNDER_20}</option>
                          <option value="20">{MESSAGES.AUTH.AGE_GROUP_20S}</option>
                          <option value="30">{MESSAGES.AUTH.AGE_GROUP_30S}</option>
                          <option value="40">{MESSAGES.AUTH.AGE_GROUP_40S}</option>
                          <option value="50">{MESSAGES.AUTH.AGE_GROUP_50S}</option>
                          <option value="60">{MESSAGES.AUTH.AGE_GROUP_60S}</option>
                          <option value="70">{MESSAGES.AUTH.AGE_GROUP_70S}</option>
                          <option value="over_80">{MESSAGES.AUTH.AGE_GROUP_OVER_80}</option>
                        </select>
                        <ChevronDown
                          className="absolute right-3 top-3 text-slate-700 pointer-events-none"
                          size={18}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-bold text-slate-800 ml-1">
                        {MESSAGES.AUTH.GENDER_LABEL} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative group">
                        <select
                          value={gender}
                          onChange={(e) =>
                            setGender(
                              e.target.value as "male" | "female" | "other",
                            )
                          }
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-slate-200 focus:border-transparent transition-all text-sm appearance-none"
                        >
                          <option value="" disabled>
                            {MESSAGES.AUTH.GENDER_PLACEHOLDER}
                          </option>
                          <option value="male">{MESSAGES.AUTH.GENDER_MALE}</option>
                          <option value="female">{MESSAGES.AUTH.GENDER_FEMALE}</option>
                          <option value="other">{MESSAGES.AUTH.GENDER_OTHER}</option>
                        </select>
                        <ChevronDown
                          className="absolute right-3 top-3 text-slate-700 pointer-events-none"
                          size={18}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-300 mt-2">
                    <label className="text-sm font-bold text-slate-800 ml-1">
                      {MESSAGES.AUTH.INVITE_LABEL}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative group">
                      <Key
                        className="absolute left-3 top-3 text-slate-700 group-focus-within:text-slate-800 transition-colors"
                        size={18}
                      />
                      <input
                        type="text"
                        placeholder={MESSAGES.AUTH.INVITE_PLACEHOLDER}
                        value={invitationCode}
                        onChange={(e) => setInvitationCode(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-10 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-slate-200 focus:border-transparent transition-all font-mono text-sm"
                      />
                    </div>
                    <p className="text-xs text-slate-700 ml-1 mt-1 leading-tight font-medium">
                      {MESSAGES.AUTH.INVITE_HELP}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-start gap-2 mb-2"
              >
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
            {isSuccess && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-emerald-50 text-emerald-600 p-4 rounded-xl text-sm flex items-start gap-3 mb-2 border border-emerald-100 shadow-sm"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 12 }}
                >
                  <Mail
                    size={18}
                    className="mt-0.5 shrink-0 text-emerald-500"
                  />
                </motion.div>
                <div className="flex flex-col gap-1">
                  <span className="font-bold">
                    {MESSAGES.AUTH.PW_RESET_SENT}
                  </span>
                  <p className="text-xs text-emerald-600/80 leading-relaxed">
                    {MESSAGES.AUTH.PW_RESET_HELP}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-slate-800 text-white rounded-xl py-3.5 font-bold tracking-wide shadow-lg shadow-slate-200 hover:bg-slate-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                <span>
                  {mode === "login" && MESSAGES.AUTH.LOGIN_BUTTON}
                  {mode === "signup" && MESSAGES.AUTH.SIGNUP_BUTTON}
                  {mode === "forgot" && MESSAGES.AUTH.REIGNITE_BUTTON}
                </span>
                {mode !== "forgot" && <ArrowRight size={18} />}
              </>
            )}
          </button>

          <div className="flex flex-col items-center gap-2 mt-6 text-base font-sans">
            {mode === "login" && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                  }}
                  className="hover:text-slate-900 underline underline-offset-4 decoration-slate-300"
                >
                  {MESSAGES.AUTH.TO_SIGNUP}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("forgot");
                    setError(null);
                  }}
                  className="text-xs hover:text-slate-900"
                >
                  {MESSAGES.AUTH.TO_FORGOT}
                </button>
              </>
            )}
            {mode === "signup" && (
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
                className="hover:text-slate-900 underline underline-offset-4 decoration-slate-300"
              >
                {MESSAGES.AUTH.TO_LOGIN_BACK}
              </button>
            )}
            {mode === "forgot" && (
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
                className="hover:text-slate-900 underline underline-offset-4 decoration-slate-300"
              >
                {MESSAGES.AUTH.TO_LOGIN_BACK}
              </button>
            )}
          </div>
        </form>
      </motion.div>

      {/* Golden Dawn / Welcome Screen */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
          >
            {/* Golden Dawn Flash Background */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 1 }}
              transition={{ duration: 2, ease: "easeOut" }}
              className="absolute inset-0 bg-gradient-radial from-amber-100 via-orange-50 to-white"
            />

            {/* Washi Paper Texture Overlay */}
            <div
              className="absolute inset-0 opacity-40 mix-blend-multiply pointer-events-none"
              style={{
                backgroundImage:
                  'url("https://www.transparenttextures.com/patterns/handmade-paper.png")',
              }}
            />

            {/* Sumi Ink Message */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1, duration: 2 }}
              className="relative z-10 px-12 py-16 text-center"
            >
              <h2 className="text-3xl md:text-5xl font-serif text-slate-900 tracking-[0.3em] font-bold leading-relaxed whitespace-pre-wrap">
                {MESSAGES.AUTH.WELCOME_MSG_1}{"\n"}{MESSAGES.AUTH.WELCOME_MSG_2}
              </h2>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 2, duration: 1.5 }}
                className="h-[1px] bg-slate-400 mt-12 mx-auto"
              />
            </motion.div>

            {/* Particles / Sparkles */}
            <motion.div
              animate={{
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_white_100%)]"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
