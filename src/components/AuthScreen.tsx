import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuthHook';
import { Eye, EyeOff, ArrowRight, Loader2, AlertCircle, Mail, Lock, User, MapPin, Key, ChevronDown } from 'lucide-react';
import { PREFECTURES } from '../data/prefectures';
import { useLocationData } from '../hooks/useLocationData';

interface AuthScreenProps {
    onSuccess: () => void;
}

// 日本語エラーメッセージへの変換
const translateError = (code: string): string => {
    switch (code) {
        case 'auth/invalid-email': return 'メールアドレスの形式が正しくありません。';
        case 'auth/user-disabled': return 'このアカウントは無効化されています。';
        case 'auth/user-not-found': return 'アカウントが見つかりません。';
        case 'auth/wrong-password': return 'パスワードが間違っています。';
        case 'auth/email-already-in-use': return 'このメールアドレスは既に使用されています。';
        case 'auth/weak-password': return 'パスワードは6文字以上で入力してください。';
        case 'auth/operation-not-allowed': return '認証エラーが発生しました。管理者にお問い合わせください。';
        case 'auth/too-many-requests': return '試行回数が多すぎます。しばらく待ってから再度お試しください。';
        case 'auth/network-request-failed': return 'ネットワーク接続を確認してください。';
        case 'auth/internal-error': return '内部エラーが発生しました。';
        case 'auth/requires-recent-login': return '再認証が必要です。一度ログアウトして再度ログインしてください。';
        default: return 'エラーが発生しました: ' + code;
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
    const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');

    // Validation for ASCII checks
    const validateAscii = (text: string) => /^[\x20-\x7E]*$/.test(text);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            if (mode === 'login') {
                if (!email || !password) throw new Error('メールアドレスとパスワードを入力してください。');
                await signIn(email, password);
                onSuccess();
            } else if (mode === 'signup') {
                if (!email || !password || !name || !invitationCode || !prefecture || !city || !ageGroup) {
                    throw new Error('すべての項目を入力してください。');
                }
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
                    gender, 
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
                        {mode === 'login' && '星の扉'}
                        {mode === 'signup' && '魂の登録'}
                        {mode === 'forgot' && '灯火の再燃'}
                    </h1>
                    <div className="h-1 w-12 bg-slate-300 rounded-full" />
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

                    <div className="relative group">
                        <Mail className="absolute left-3 top-3 text-slate-400 group-focus-within:text-slate-600 transition-colors" size={18} />
                        <input 
                            type="email" 
                            placeholder="メールアドレス" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-10 py-2.5 text-slate-700 outline-none focus:ring-2 focus:ring-slate-200 focus:border-transparent transition-all placeholder:text-slate-400"
                        />
                    </div>

                    {mode !== 'forgot' && (
                        <div className="relative group">
                            <Lock className="absolute left-3 top-3 text-slate-400 group-focus-within:text-slate-600 transition-colors" size={18} />
                            <input 
                                type={showPassword ? "text" : "password"} 
                                placeholder="パスワード" 
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
                    )}

                    <AnimatePresence>
                        {mode === 'signup' && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }} 
                                animate={{ opacity: 1, height: 'auto' }} 
                                exit={{ opacity: 0, height: 0 }}
                                className="flex flex-col gap-4 overflow-hidden"
                            >
                                <div className="relative group">
                                    <User className="absolute left-3 top-3 text-slate-400 group-focus-within:text-slate-600 transition-colors" size={18} />
                                    <input 
                                        type="text" 
                                        placeholder="お名前（ニックネーム可）" 
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-10 py-2.5 text-slate-700 outline-none focus:ring-2 focus:ring-slate-200 focus:border-transparent transition-all placeholder:text-slate-400"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="relative group">
                                        <MapPin className="absolute left-3 top-3 text-slate-400 group-focus-within:text-slate-600 transition-colors pointer-events-none" size={18} />
                                        <select 
                                            value={prefecture}
                                            onChange={(e) => setPrefecture(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-10 py-2.5 text-slate-700 outline-none focus:ring-2 focus:ring-slate-200 focus:border-transparent transition-all placeholder:text-slate-400 appearance-none"
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
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 outline-none focus:ring-2 focus:ring-slate-200 focus:border-transparent transition-all placeholder:text-slate-400 appearance-none disabled:opacity-50"
                                            disabled={!prefecture || loadingCities}
                                        >
                                            <option value="" disabled>{loadingCities ? '読み込み中...' : '市区町村'}</option>
                                            {cities.map(cityName => (
                                                <option key={cityName} value={cityName}>{cityName}</option>
                                            ))}
                                         </select>
                                         <ChevronDown className="absolute right-3 top-3 text-slate-400 pointer-events-none" size={18} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
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
                                    </div>
                                    <div className="relative group">
                                        <select 
                                            value={gender} 
                                            onChange={(e) => setGender(e.target.value as 'male' | 'female' | 'other')}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 outline-none focus:ring-2 focus:ring-slate-200 focus:border-transparent transition-all text-sm appearance-none"
                                        >
                                            <option value="male">男性</option>
                                            <option value="female">女性</option>
                                            <option value="other">その他</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="relative group">
                                    <Key className="absolute left-3 top-3 text-slate-400 group-focus-within:text-slate-600 transition-colors" size={18} />
                                    <input 
                                        type="text" 
                                        placeholder="招待コード" 
                                        value={invitationCode}
                                        onChange={(e) => setInvitationCode(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-10 py-2.5 text-slate-700 outline-none focus:ring-2 focus:ring-slate-200 focus:border-transparent transition-all placeholder:text-slate-400 font-mono"
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full bg-slate-800 text-white rounded-xl py-3 font-medium tracking-wide shadow-lg shadow-slate-200 hover:bg-slate-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            <>
                                <span>
                                    {mode === 'login' && '扉を開く'}
                                    {mode === 'signup' && '登録を完了する'}
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
                                    まだアカウントをお持ちでない方はこちら
                                </button>
                                <button type="button" onClick={() => setMode('forgot')} className="text-xs hover:text-slate-800">
                                    パスワードをお忘れの方
                                </button>
                            </>
                        )}
                        {mode === 'signup' && (
                             <button type="button" onClick={() => setMode('login')} className="hover:text-slate-800 underline underline-offset-4 decoration-slate-300">
                                既にアカウントをお持ちの方はこちら
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
