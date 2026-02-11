import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuthHook';
import { Eye, EyeOff, ArrowRight, Loader2, AlertCircle, Mail, Lock, User, MapPin, Key, ChevronDown } from 'lucide-react';
import { PREFECTURES } from '../data/prefectures';
import { useLocationData } from '../hooks/useLocationData';

interface AuthScreenProps {
    onSuccess: () => void;
}

// 日本語エラーメッセージへの変換 (Firebaseのエラー用)
const translateError = (code: string): string => {
    switch (code) {
        case 'auth/invalid-email': return 'メールアドレスの形式が正しくありません。';
        case 'auth/user-disabled': return 'このアカウントは無効化されています。';
        case 'auth/user-not-found': return 'メールアドレスまたはパスワードが正しくありません。';
        case 'auth/wrong-password': return 'メールアドレスまたはパスワードが正しくありません。';
        case 'auth/invalid-credential': return 'メールアドレスまたはパスワードが正しくありません。';
        case 'auth/email-already-in-use': return 'このメールアドレスは既に登録されています。';
        case 'auth/weak-password': return 'パスワードは6文字以上で入力してください。';
        case 'auth/operation-not-allowed': return '認証エラーが発生しました。管理者にお問い合わせください。';
        case 'auth/too-many-requests': return 'アクセスが集中しています。しばらく待ってから再度お試しください。';
        case 'auth/network-request-failed': return '回線が不安定です。ネットワーク接続を確認してください。';
        case 'auth/internal-error': return 'システムエラーが発生しました。';
        case 'auth/requires-recent-login': return '再認証が必要です。一度ログアウトして再度ログインしてください。';
        default: return '予期せぬエラーが発生しました (' + code + ')';
    }
};

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess }) => {
    const { signIn, signUp, resetPassword } = useAuth();
    const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    // Form States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [invitationCode, setInvitationCode] = useState('');
    
    // Location
    const [prefecture, setPrefecture] = useState('');
    const [city, setCity] = useState('');

    // Location Data Hook
    const { cities, loading: loadingCities } = useLocationData(prefecture);

    // Demographics
    const [ageGroup, setAgeGroup] = useState('');
    const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');

    // Validation for ASCII checks
    const validateAscii = (text: string) => /^[\x20-\x7E]*$/.test(text);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            if (mode === 'login') {
                if (!email) throw new Error('メールアドレスを入力してください。');
                if (!password) throw new Error('パスワードを入力してください。');
                await signIn(email, password);
                onSuccess();
            } else if (mode === 'signup') {
                // 詳細なバリデーションへの復帰
                if (!name.trim()) throw new Error('名前を入力してください。');
                if (!gender) throw new Error('性別を選択してください。');
                if (!ageGroup) throw new Error('年代を選択してください。');
                if (!prefecture) throw new Error('都道府県を選択してください。');
                if (!city) throw new Error('市区町村を選択してください。');
                if (!email) throw new Error('メールアドレスを入力してください。');
                if (!password) throw new Error('パスワードを入力してください。');
                if (!invitationCode.trim()) throw new Error('招待コードを入力してください。');

                if (!validateAscii(password)) {
                    throw new Error('パスワードは半角英数字と記号のみ使用可能です。');
                }
                if (!validateAscii(invitationCode)) {
                    throw new Error('招待コードは半角英数字のみ使用可能です。');
                }

                await signUp(
                    email, 
                    password, 
                    name, 
                    { prefecture, city }, 
                    ageGroup, 
                    gender as 'male' | 'female' | 'other', 
                    invitationCode
                );
                onSuccess();
            } else if (mode === 'forgot') {
                 if (!email) throw new Error('メールアドレスを入力してください。');
                 await resetPassword(email);
                 setError('パスワード再設定メールを送信しました。');
                 setIsLoading(false);
                 return;
            }
        } catch (err: unknown) {
            console.error(err);
            const firebaseError = err as { code?: string; message?: string };
            if (firebaseError.code) {
                setError(translateError(firebaseError.code));
            } else {
                setError(firebaseError.message || '予期せぬエラーが発生しました。');
            }
        } finally {
            if (mode !== 'forgot') setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 w-full max-w-md mx-auto relative z-10">
            <motion.div 
                layout 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="w-full bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 p-8 overflow-hidden"
            >
                <div className="flex flex-col items-center mb-8">
                    <h1 className="text-2xl font-serif font-bold text-slate-800 tracking-widest mb-2">
                        {mode === 'login' && 'ログイン'}
                        {mode === 'signup' && '新規登録'}
                        {mode === 'forgot' && 'パスワードの再設定'}
                    </h1>
                    <div className="h-1 w-12 bg-slate-300 rounded-full" />
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <AnimatePresence>
                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }} 
                                animate={{ opacity: 1, height: 'auto' }} 
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-start gap-2 mb-2"
                            >
                                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                <span>{error}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Login & Signup common fields */}
                    <div className="flex flex-col gap-4">
                        <AnimatePresence mode="popLayout">
                            {mode === 'signup' && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="flex flex-col gap-1.5"
                                >
                                    <label className="text-xs font-bold text-slate-500 ml-1">
                                        お名前 <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative group">
                                        <User className="absolute left-3 top-3 text-slate-400 group-focus-within:text-slate-600 transition-colors" size={18} />
                                        <input 
                                            type="text" 
                                            placeholder="山田 太郎" 
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-10 py-2.5 text-slate-700 outline-none focus:ring-2 focus:ring-slate-200 focus:border-transparent transition-all placeholder:text-slate-400"
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-500 ml-1">
                                メールアドレス <span className="text-red-500">*</span>
                            </label>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-3 text-slate-400 group-focus-within:text-slate-600 transition-colors" size={18} />
                                <input 
                                    type="email" 
                                    placeholder="mail@example.com" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-10 py-2.5 text-slate-700 outline-none focus:ring-2 focus:ring-slate-200 focus:border-transparent transition-all placeholder:text-slate-400"
                                />
                            </div>
                        </div>

                        {mode !== 'forgot' && (
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-500 ml-1">
                                    パスワード <span className="text-red-500">*</span>
                                </label>
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-3 text-slate-400 group-focus-within:text-slate-600 transition-colors" size={18} />
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        placeholder="••••••" 
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-10 py-2.5 text-slate-700 outline-none focus:ring-2 focus:ring-slate-200 focus:border-transparent transition-all placeholder:text-slate-400"
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        )}

                        <AnimatePresence>
                            {mode === 'signup' && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }} 
                                    animate={{ opacity: 1, height: 'auto' }} 
                                    exit={{ opacity: 0, height: 0 }}
                                    className="flex flex-col gap-4 overflow-hidden pt-2"
                                >
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-slate-500 ml-1">
                                            居住地 <span className="text-red-500">*</span>
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="relative group">
                                                <MapPin className="absolute left-3 top-3 text-slate-400 group-focus-within:text-slate-600 transition-colors pointer-events-none" size={18} />
                                                <select 
                                                    value={prefecture}
                                                    onChange={(e) => setPrefecture(e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-10 py-2.5 text-slate-700 outline-none focus:ring-2 focus:ring-slate-200 focus:border-transparent transition-all appearance-none"
                                                >
                                                    <option value="" disabled>都道府県</option>
                                                    {PREFECTURES.map(pref => (
                                                        <option key={pref} value={pref}>{pref}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-3 top-3 text-slate-400 pointer-events-none" size={18} />
                                            </div>
                                            <div className="relative group">
                                                <select 
                                                    value={city}
                                                    onChange={(e) => setCity(e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 outline-none focus:ring-2 focus:ring-slate-200 focus:border-transparent transition-all appearance-none disabled:opacity-50"
                                                    disabled={!prefecture || loadingCities}
                                                >
                                                    <option value="" disabled>{loadingCities ? '...' : '市区町村'}</option>
                                                    {cities.map(cityName => (
                                                        <option key={cityName} value={cityName}>{cityName}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-3 top-3 text-slate-400 pointer-events-none" size={18} />
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-slate-400 ml-1 mt-1 leading-tight">
                                            ※番地やマンション名の入力は不要です。
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-bold text-slate-500 ml-1">
                                                年代 <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative group">
                                                <select 
                                                    value={ageGroup} 
                                                    onChange={(e) => setAgeGroup(e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 outline-none focus:ring-2 focus:ring-slate-200 focus:border-transparent transition-all text-sm appearance-none"
                                                >
                                                    <option value="" disabled>年代</option>
                                                    <option value="10s">10代</option>
                                                    <option value="20s">20代</option>
                                                    <option value="30s">30代</option>
                                                    <option value="40s">40代</option>
                                                    <option value="50s">50代</option>
                                                    <option value="60s">60代以上</option>
                                                </select>
                                                <ChevronDown className="absolute right-3 top-3 text-slate-400 pointer-events-none" size={18} />
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-bold text-slate-500 ml-1">
                                                性別 <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative group">
                                                <select 
                                                    value={gender} 
                                                    onChange={(e) => setGender(e.target.value as 'male' | 'female' | 'other')}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 outline-none focus:ring-2 focus:ring-slate-200 focus:border-transparent transition-all text-sm appearance-none"
                                                >
                                                    <option value="" disabled>性別</option>
                                                    <option value="male">男性</option>
                                                    <option value="female">女性</option>
                                                    <option value="other">その他</option>
                                                </select>
                                                <ChevronDown className="absolute right-3 top-3 text-slate-400 pointer-events-none" size={18} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100 mt-2">
                                        <label className="text-xs font-bold text-slate-500 ml-1">
                                            招待コード <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative group">
                                            <Key className="absolute left-3 top-3 text-slate-400 group-focus-within:text-slate-600 transition-colors" size={18} />
                                            <input 
                                                type="text" 
                                                placeholder="ALPHA-XXXX" 
                                                value={invitationCode}
                                                onChange={(e) => setInvitationCode(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-10 py-2.5 text-slate-700 outline-none focus:ring-2 focus:ring-slate-200 focus:border-transparent transition-all font-mono"
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-400 ml-1 mt-1 leading-tight">
                                            現在は招待制のアルファテスト中です。お手元のコードを入力してください。
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

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
                                    {mode === 'login' && 'ログイン'}
                                    {mode === 'signup' && '新規登録'}
                                    {mode === 'forgot' && '送信する'}
                                </span>
                                {mode !== 'forgot' && <ArrowRight size={18} />}
                            </>
                        )}
                    </button>
                    
                    <div className="flex flex-col items-center gap-2 mt-4 text-sm text-slate-500">
                        {mode === 'login' && (
                            <>
                                <button type="button" onClick={() => setMode('signup')} className="hover:text-slate-800 underline underline-offset-4 decoration-slate-300">
                                    新規登録はこちら
                                </button>
                                <button type="button" onClick={() => setMode('forgot')} className="text-xs hover:text-slate-800">
                                    パスワードをお忘れの方
                                </button>
                            </>
                        )}
                        {mode === 'signup' && (
                             <button type="button" onClick={() => setMode('login')} className="hover:text-slate-800 underline underline-offset-4 decoration-slate-300">
                                ログイン画面に戻る
                            </button>
                        )}
                        {mode === 'forgot' && (
                             <button type="button" onClick={() => setMode('login')} className="hover:text-slate-800 underline underline-offset-4 decoration-slate-300">
                                ログイン画面に戻る
                            </button>
                        )}
                    </div>

                </form>
            </motion.div>
        </div>
    );
};
