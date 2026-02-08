import React, { useState } from "react";
import { useAuth } from "../hooks/useAuthHook";
import { useLocationData } from "../hooks/useLocationData";
import { Loader2, ChevronDown, Sparkles } from "lucide-react";
import { PREFECTURES } from "../data/prefectures";
import { motion, AnimatePresence } from "framer-motion";

interface AuthScreenProps {
  onSuccess?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess }) => {
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [isResetMode, setIsResetMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other" | "">("");
  const [age_group, setAgeGroup] = useState("");
  const [location, setLocation] = useState({ prefecture: "", city: "" });
  const { cities, loading: loadingCities } = useLocationData(
    location.prefecture,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState('');
  const [invitationCode, setInvitationCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (mode === "login") {
        await signIn(email, password);
      } else {
        if (!name.trim()) throw new Error("名前を入力してください");
        if (!gender) throw new Error("性別を選択してください");
        if (!age_group) throw new Error("年代を選択してください");
        if (!location.prefecture) throw new Error("都道府県を選択してください");
        if (!location.city) throw new Error("市区町村を選択してください");
        if (!email) throw new Error("メールアドレスを入力してください");
        if (!password) throw new Error("パスワードを入力してください");
        if (!invitationCode.trim()) throw new Error("招待コードを入力してください");
        await signUp(
          email,
          password,
          name,
          location,
          age_group,
          gender as "male" | "female" | "other",
          invitationCode,
        );
      }
      // Call onSuccess callback if provided (e.g. to redirect to home)
      onSuccess?.();
    } catch (err) {
      console.error(err);
      if (err instanceof Error) {
        if (err.message.includes("auth/invalid-email"))
          setError("メールアドレスが無効です");
        else if (err.message.includes("auth/user-not-found"))
          setError("登録されているユーザーが見つかりません");
        else if (err.message.includes("auth/wrong-password"))
          setError("パスワードが間違っています");
        else if (err.message.includes("auth/email-already-in-use"))
          setError("このメールアドレスは既に登録されています");
        else if (err.message.includes("auth/weak-password"))
          setError("パスワードは6文字以上で設定してください");
        else setError(`エラー: ${err.message}`);
      } else {
        setError("接続に失敗しました。時間をおいて再度お試しください。");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      await resetPassword(email);
      setSuccessMessage(
        "パスワード再設定のメールを送信しました。\n届いたメールの内容に従って手続きを完了してください。",
      );
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === "auth/user-not-found")
        setError("入力されたメールアドレスは登録されていません");
      else if (code === "auth/invalid-email")
        setError("メールアドレスの形式が正しくありません");
      else setError("メールの送信に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F8F4] flex flex-col items-center justify-center py-20 px-6 text-[#2D2D2D] font-sans selection:bg-orange-100/30 relative overflow-y-auto">
      {/* Washi Texture Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-multiply"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Ambient Blooms */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-100/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-100/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-12">
          <div className="mb-8 flex justify-center">
            <motion.div
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="p-4 rounded-full bg-white/40 shadow-sm border border-white/20"
            >
              <Sparkles className="w-5 h-5 text-orange-300" />
            </motion.div>
          </div>
          <h1 className="text-sm font-medium tracking-[0.4em] text-[#888888] uppercase font-serif mb-4">
            Existence Ticker
          </h1>
          <p className="text-lg text-[#555555] font-serif tracking-widest leading-relaxed">
            {isResetMode
              ? "パスワードの再設定"
              : mode === "login"
                ? "ログイン"
                : "新規登録"}
          </p>
        </div>

        <div className="bg-white/60 backdrop-blur-sm p-8 md:p-10 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.02)] border border-white/40">
          <AnimatePresence mode="wait">
            {isResetMode ? (
              <motion.form
                key="reset"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onSubmit={handleResetPassword}
                className="space-y-8"
              >
                <div className="space-y-4">
                  <label className="text-xs font-bold text-[#888888] tracking-widest ml-1 uppercase">
                    メールアドレス
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="mail@example.com"
                    className="w-full bg-white border border-[#E8E8E8] shadow-[inset_0_2px_8px_rgba(0,0,0,0.06)] rounded-2xl px-6 py-4 text-lg text-[#2D2D2D] placeholder:text-[#CCCCCC] focus:outline-none focus:shadow-[inset_0_2px_12px_rgba(0,0,0,0.08)] transition-all font-serif"
                    required
                  />
                </div>

                {error && (
                  <p className="text-red-400 text-xs text-center font-serif tracking-wider">
                    {error}
                  </p>
                )}
                {successMessage && (
                  <div className="text-[#9C7C60] text-sm text-center font-serif leading-relaxed tracking-wider py-4 bg-orange-50/30 rounded-2xl">
                    {successMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#2D2D2D] text-white font-bold py-5 rounded-2xl tracking-[0.2em] hover:bg-black shadow-lg hover:shadow-xl transition-all disabled:opacity-50 text-sm"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin w-5 h-5 mx-auto" />
                  ) : (
                    "手続きメールを送信する"
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsResetMode(false);
                    setError("");
                  }}
                  className="w-full text-xs text-[#888888] tracking-widest hover:text-[#2D2D2D] transition-colors py-2"
                >
                  戻る
                </button>
              </motion.form>
            ) : (
              <motion.form
                key={mode}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onSubmit={handleSubmit}
                className="space-y-8"
              >
                {mode === "register" && (
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <label className="text-xs font-bold text-[#888888] tracking-widest ml-1 uppercase">
                        お名前
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="山田 太郎"
                        className="w-full bg-white border border-[#E8E8E8] shadow-[inset_0_2px_8px_rgba(0,0,0,0.06)] rounded-2xl px-6 py-4 text-lg text-[#2D2D2D] placeholder:text-[#CCCCCC] focus:outline-none focus:shadow-[inset_0_2px_12px_rgba(0,0,0,0.08)] transition-all font-serif"
                        required
                      />
                    </div>

                    <div className="space-y-4">
                      <label className="text-xs font-bold text-[#888888] tracking-widest ml-1 uppercase">
                        性別
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { value: "male", label: "男性" },
                          { value: "female", label: "女性" },
                          { value: "other", label: "その他" },
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() =>
                              setGender(
                                opt.value as "male" | "female" | "other",
                              )
                            }
                            className={`py-4 rounded-2xl text-sm font-bold transition-all ${
                              gender === opt.value
                                ? "bg-[#2D2D2D] text-white shadow-lg"
                                : "bg-white/50 text-[#888888] hover:bg-white/80"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-xs font-bold text-[#888888] tracking-widest ml-1 uppercase">
                        年代
                      </label>
                      <div className="relative">
                        <select
                          value={age_group}
                          onChange={(e) => setAgeGroup(e.target.value)}
                          className="w-full bg-white border border-[#E8E8E8] shadow-[inset_0_2px_8px_rgba(0,0,0,0.06)] rounded-2xl px-6 py-4 text-lg text-[#2D2D2D] appearance-none focus:outline-none focus:shadow-[inset_0_2px_12px_rgba(0,0,0,0.08)] transition-all font-serif"
                          required
                        >
                          <option value="">選択してください</option>
                          {[
                            "20歳未満",
                            "20代",
                            "30代",
                            "40代",
                            "50代",
                            "60代",
                            "70代",
                            "80代以上",
                          ].map((age) => (
                            <option key={age} value={age}>
                              {age}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-[#CCCCCC] pointer-events-none w-5 h-5" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <label className="text-xs font-bold text-[#888888] tracking-widest ml-1 uppercase">
                          都道府県
                        </label>
                        <div className="relative">
                          <select
                            value={location.prefecture}
                            onChange={(e) =>
                              setLocation((prev) => ({
                                ...prev,
                                prefecture: e.target.value,
                              }))
                            }
                            className="w-full bg-white border border-[#E8E8E8] shadow-[inset_0_2px_8px_rgba(0,0,0,0.06)] rounded-2xl px-6 py-4 text-sm text-[#2D2D2D] appearance-none focus:outline-none focus:shadow-[inset_0_2px_12px_rgba(0,0,0,0.08)] transition-all font-serif"
                            required
                          >
                            <option value="">選択</option>
                            {PREFECTURES.map((pref) => (
                              <option key={pref} value={pref}>
                                {pref}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#CCCCCC] pointer-events-none w-4 h-4" />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <label className="text-xs font-bold text-[#888888] tracking-widest ml-1 uppercase">
                          市区町村
                        </label>
                        <div className="relative">
                          <select
                            value={location.city}
                            onChange={(e) =>
                              setLocation((prev) => ({
                                ...prev,
                                city: e.target.value,
                              }))
                            }
                            className="w-full bg-white border border-[#E8E8E8] shadow-[inset_0_2px_8px_rgba(0,0,0,0.06)] rounded-2xl px-6 py-4 text-sm text-[#2D2D2D] appearance-none focus:outline-none focus:shadow-[inset_0_2px_12px_rgba(0,0,0,0.08)] transition-all font-serif disabled:opacity-40"
                            required
                            disabled={!location.prefecture || loadingCities}
                          >
                            <option value="">
                              {loadingCities ? "..." : "選択"}
                            </option>
                            {cities.map((city) => (
                              <option key={city} value={city}>
                                {city}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#CCCCCC] pointer-events-none w-4 h-4" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4 pt-4 border-t border-white/20">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#888888] tracking-widest ml-1 uppercase">
                          招待コード
                        </label>
                        <p className="text-[10px] text-[#AAAAAA] ml-1 font-serif leading-tight">
                          現在は招待制のアルファテスト中です。
                          <br />
                          お手元のコードを入力してください。
                        </p>
                      </div>
                      <input
                        type="text"
                        value={invitationCode}
                        onChange={(e) => setInvitationCode(e.target.value)}
                        placeholder="ALPHA-XXXX"
                        className="w-full bg-white border border-[#E8E8E8] shadow-[inset_0_2px_8px_rgba(0,0,0,0.06)] rounded-2xl px-6 py-4 text-lg text-[#2D2D2D] placeholder:text-[#CCCCCC] focus:outline-none focus:shadow-[inset_0_2px_12px_rgba(0,0,0,0.08)] transition-all font-serif"
                        required={mode === "register"}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-[#888888] tracking-widest ml-1 uppercase">
                      メールアドレス
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="mail@example.com"
                      className="w-full bg-white border border-[#E8E8E8] shadow-[inset_0_2px_8px_rgba(0,0,0,0.06)] rounded-2xl px-6 py-4 text-lg text-[#2D2D2D] placeholder:text-[#CCCCCC] focus:outline-none focus:shadow-[inset_0_2px_12px_rgba(0,0,0,0.08)] transition-all font-serif"
                      required
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-bold text-[#888888] tracking-widest ml-1 uppercase">
                      パスワード
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••"
                      className="w-full bg-white border border-[#E8E8E8] shadow-[inset_0_2px_8px_rgba(0,0,0,0.06)] rounded-2xl px-6 py-4 text-lg text-[#2D2D2D] placeholder:text-[#CCCCCC] focus:outline-none focus:shadow-[inset_0_2px_12px_rgba(0,0,0,0.08)] transition-all font-serif"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-red-400 text-xs text-center font-serif tracking-wider">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#2D2D2D] text-white font-bold py-5 rounded-2xl tracking-[0.2em] hover:bg-black shadow-lg hover:shadow-xl transition-all disabled:opacity-50 text-sm"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin w-5 h-5 mx-auto" />
                  ) : (
                    <span>
                      {mode === "login" ? "ログイン" : "アカウントを作成する"}
                    </span>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {!isResetMode && (
          <div className="mt-12 text-center space-y-6">
            <button
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError("");
              }}
              className="text-sm font-serif text-[#888888] hover:text-[#2D2D2D] tracking-widest transition-colors block w-full py-2"
            >
              {mode === "login"
                ? "新規登録はこちら"
                : "既にアカウントをお持ちの方"}
            </button>

            {mode === "login" && (
              <button
                onClick={() => {
                  setIsResetMode(true);
                  setError("");
                }}
                className="text-xs font-serif text-[#AAAAAA] hover:text-[#888888] tracking-widest transition-colors block w-full"
              >
                パスワードを忘れた場合
              </button>
            )}
          </div>
        )}
      </motion.div>

      <p className="absolute bottom-10 text-[10px] text-[#AAAAAA] tracking-[0.4em] uppercase font-serif">
        © 2026 Existence Ticker Project
      </p>
    </div>
  );
};
