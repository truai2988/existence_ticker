import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuthHook';
import { useLocationData } from '../hooks/useLocationData';
import { Loader2, ArrowRight, Heart, ChevronDown } from 'lucide-react';
import { PREFECTURES } from '../data/prefectures';

export const AuthScreen = () => {
    const { signIn, signUp, resetPassword } = useAuth();
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [isResetMode, setIsResetMode] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [gender, setGender] = useState<"male" | "female" | "other" | "">('');
    const [age_group, setAgeGroup] = useState('');
    const [location, setLocation] = useState({ prefecture: '', city: '' });
    const { cities, loading: loadingCities } = useLocationData(location.prefecture);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (mode === 'login') {
                await signIn(email, password);
            } else {
                if (!name.trim()) throw new Error("名前を入力してください");
                if (!gender) throw new Error("性別を選択してください");
                if (!age_group) throw new Error("年代を選択してください");
                if (!location.prefecture) throw new Error("都道府県を選択してください");
                if (!location.city) throw new Error("市区町村を選択してください");
                if (!email) throw new Error("メールアドレスを入力してください");
                if (!password) throw new Error("パスワードを入力してください");
                await signUp(email, password, name, location, age_group, gender as "male" | "female" | "other");
            }
        } catch (err) {
            console.error(err);
            if (err instanceof Error) {
                if (err.message.includes("auth/invalid-email")) setError("メールアドレスが無効です");
                else if (err.message.includes("auth/user-not-found")) setError("ユーザーが見つかりません");
                else if (err.message.includes("auth/wrong-password")) setError("パスワードが間違っています");
                else if (err.message.includes("auth/email-already-in-use")) setError("このメールアドレスは既に使用されています");
                else if (err.message.includes("auth/weak-password")) setError("パスワードは6文字以上で入力してください");
                else setError(`エラー: ${err.message}`);
            } else {
                setError("予期せぬエラーが発生しました");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setIsLoading(true);

        try {
            await resetPassword(email);
            setSuccessMessage("パスワード再設定メールを送信しました。\nメールボックスをご確認ください。");
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            const code = (err as { code?: string }).code;

            if (code === 'auth/user-not-found') setError("登録されていないメールアドレスです");
            else if (code === 'auth/invalid-email') setError("無効なメールアドレスです");
            else setError("送信に失敗しました: " + message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-800 animate-fade-in relative overflow-hidden">
            {/* Background Ambience (Subtle Light) */}
            <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50 to-blue-50 opacity-80" />
            <div className="absolute top-0 right-0 p-20 opacity-10 bg-orange-200 blur-[100px] rounded-full mix-blend-multiply"></div>
            <div className="absolute bottom-0 left-0 p-20 opacity-10 bg-blue-200 blur-[100px] rounded-full mix-blend-multiply"></div>
            
            <div className="w-full max-w-md bg-white p-8 rounded-3xl border border-slate-100 relative z-10 shadow-xl">
                <div className="text-center mb-8">
                    <div className="inline-flex justify-center items-center w-12 h-12 rounded-full bg-blue-50 mb-4 border border-blue-100">
                        <Heart className="w-6 h-6 text-blue-500 fill-blue-500/10" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">Existence Ticker</h1>
                    <p className="text-sm text-slate-500 font-medium">日々の感謝を巡らせる、<br/>あたらしい互助の習慣。</p>
                </div>

                {isResetMode ? (
                     <form onSubmit={handleResetPassword} className="space-y-5">
                        <div className="text-center mb-2">
                            <h3 className="text-slate-800 font-bold text-sm">パスワードの再設定</h3>
                            <p className="text-xs text-slate-500 mt-1">登録したメールアドレスを入力してください。</p>
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 ml-1">メールアドレス</label>
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="mail@example.com"
                                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-sans text-sm"
                                required
                            />
                        </div>

                        {error && (
                            <p className="text-red-500 text-xs text-center bg-red-50 py-2 rounded border border-red-100 font-medium">
                                {error}
                            </p>
                        )}
                        
                        {successMessage && (
                            <div className="text-green-600 text-xs text-center bg-green-50 py-3 rounded border border-green-100 whitespace-pre-wrap leading-relaxed font-medium">
                                {successMessage}
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-full flex items-center justify-center gap-2 hover:bg-slate-800 shadow-md hover:shadow-lg transition-all disabled:opacity-50 mt-2"
                        >
                            {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : "送信する"}
                        </button>

                        <button 
                            type="button"
                            onClick={() => {
                                setIsResetMode(false);
                                setError('');
                            }}
                            className="w-full text-xs text-slate-500 hover:text-slate-800 mt-2 py-2"
                        >
                            キャンセルして戻る
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {mode === 'register' && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 ml-1">
                                        お名前 (表示名)
                                        <span className="text-rose-500 ml-1">*</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="山田 太郎"
                                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-sans"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 ml-1">
                                        性別
                                        <span className="text-rose-500 ml-1">*</span>
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { value: 'male', label: '男性' },
                                            { value: 'female', label: '女性' },
                                            { value: 'other', label: '回答しない' }
                                        ].map((opt) => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setGender(opt.value as "male" | "female" | "other")}
                                                className={`py-2.5 rounded-xl text-xs font-bold transition-all border ${
                                                    gender === opt.value
                                                        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                                                        : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                                                }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 ml-1">
                                        年代
                                        <span className="text-rose-500 ml-1">*</span>
                                    </label>
                                    <div className="relative">
                                        <select 
                                            value={age_group}
                                            onChange={(e) => setAgeGroup(e.target.value)}
                                            className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-sans text-sm appearance-none"
                                            required
                                        >
                                            <option value="">未選択</option>
                                            <option value="20歳未満">20歳未満</option>
                                            <option value="20代">20代</option>
                                            <option value="30代">30代</option>
                                            <option value="40代">40代</option>
                                            <option value="50代">50代</option>
                                            <option value="60代">60代</option>
                                            <option value="70代">70代</option>
                                            <option value="80代以上">80代以上</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-4 h-4" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 ml-1">
                                            都道府県
                                            <span className="text-rose-500 ml-1">*</span>
                                        </label>
                                        <div className="relative">
                                            <select 
                                                value={location.prefecture}
                                                onChange={(e) => setLocation(prev => ({ ...prev, prefecture: e.target.value }))}
                                                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-sans text-sm appearance-none"
                                                required
                                            >
                                                <option value="">未選択</option>
                                                {PREFECTURES.map(pref => (
                                                    <option key={pref} value={pref}>{pref}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-4 h-4" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 ml-1">
                                            市区町村
                                            <span className="text-rose-500 ml-1">*</span>
                                        </label>
                                        <div className="relative">
                                            <select 
                                                value={location.city}
                                                onChange={(e) => setLocation(prev => ({ ...prev, city: e.target.value }))}
                                                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-sans text-sm appearance-none disabled:bg-slate-50 disabled:text-slate-400"
                                                required
                                                disabled={!location.prefecture || loadingCities}
                                            >
                                                <option value="">{loadingCities ? '読み込み中...' : '市区町村を選択'}</option>
                                                {cities.map(city => (
                                                    <option key={city} value={city}>{city}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400 mt-2 ml-1 leading-relaxed">
                                    ※番地やマンション名の入力は<strong className="text-slate-500 font-bold">不要</strong>です。<br/>
                                    あなたの生活圏の隣人とつながるための情報です。
                                </p>
                            </>
                    )}

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 ml-1">
                            メールアドレス
                            {mode === 'register' && <span className="text-rose-500 ml-1">*</span>}
                        </label>
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="mail@example.com"
                            className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-sans text-sm"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 ml-1">
                            パスワード
                            {mode === 'register' && <span className="text-rose-500 ml-1">*</span>}
                        </label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••"
                            className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-sans"
                            required
                        />
                    </div>

                    {error && (
                        <p className="text-red-500 text-xs text-center bg-red-50 py-2 rounded border border-red-100 font-medium">
                            {error}
                        </p>
                    )}

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-full flex items-center justify-center gap-2 hover:bg-slate-800 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                        {isLoading ? (
                            <Loader2 className="animate-spin w-5 h-5" />
                        ) : (
                            <>
                                <span>{mode === 'login' ? 'ログイン' : 'はじめる'}</span>
                                <ArrowRight className="w-4 h-4 ml-1" />
                            </>
                        )}
                    </button>
                </form>
            )}

                {!isResetMode && (
                    <div className="mt-8 text-center space-y-4 pt-4 border-t border-slate-100">
                        <button 
                            onClick={() => {
                                setMode(mode === 'login' ? 'register' : 'login');
                                setError('');
                            }}
                            className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors block w-full py-2 hover:bg-blue-50 rounded-lg"
                        >
                            {mode === 'login' ? '新しくアカウントを作る' : 'ログイン画面へ戻る'}
                        </button>

                        {mode === 'login' && (
                            <button 
                                onClick={() => {
                                    setIsResetMode(true);
                                    setError('');
                                }}
                                className="text-xs text-slate-400 hover:text-slate-600 transition-colors block w-full"
                            >
                                パスワードを忘れた場合
                            </button>
                        )}
                    </div>
                )}
            </div>
            
            <p className="absolute bottom-6 text-xs text-slate-400 font-sans">
                © 2026 Existence Ticker Project
            </p>
        </div>
    );
};
