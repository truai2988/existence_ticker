import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuthHook';
import { Loader2, ArrowRight } from 'lucide-react';

export const AuthScreen = () => {
    const { signIn, signUp, resetPassword } = useAuth();
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [isResetMode, setIsResetMode] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
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
                await signUp(email, password, name);
            }
        } catch (err) {
            console.error(err);
            if (err instanceof Error) {
                // Simple error mapping
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
        console.log("[AuthScreen] Attempting to reset password for:", email);

        try {
            await resetPassword(email);
            console.log("[AuthScreen] Reset email sent successfully.");
            setSuccessMessage("パスワード再設定メールを送信しました。\nメールボックスをご確認ください。");
            
            // Optional: Auto-switch back to login after delay, but showing message is prioritized now
            // setTimeout(() => { ... }, 5000);
        } catch (err) {
            console.error("[AuthScreen] Reset failed:", err);
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
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white animate-fade-in relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-black to-black opacity-80" />
            
            <div className="w-full max-w-md bg-slate-900/40 p-8 rounded-3xl border border-slate-800 backdrop-blur-md relative z-10 shadow-2xl">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-serif text-gold-400 tracking-widest mb-2">EXISTENCE</h1>
                    <p className="text-xs text-slate-500 uppercase tracking-[0.3em]">Anti-Gravity System</p>
                </div>

                {isResetMode ? (
                     <form onSubmit={handleResetPassword} className="space-y-6">
                        <div className="text-center mb-4">
                            <h3 className="text-white font-bold mb-1">パスワードの再設定</h3>
                            <p className="text-xs text-slate-400">登録したメールアドレスを入力してください。</p>
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-xs text-slate-400 ml-1">Email</label>
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="mail@example.com"
                                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder:text-slate-700 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50 transition-all font-mono text-sm"
                                required
                            />
                        </div>

                        {error && (
                            <p className="text-red-400 text-xs text-center bg-red-900/20 py-2 rounded border border-red-900/30">
                                {error}
                            </p>
                        )}
                        
                        {successMessage && (
                            <div className="text-green-400 text-xs text-center bg-green-900/20 py-3 rounded border border-green-900/30 whitespace-pre-wrap leading-relaxed">
                                {successMessage}
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full bg-white text-black font-bold py-4 rounded-full flex items-center justify-center gap-2 hover:bg-gold-100 transition-colors disabled:opacity-50 mt-4"
                        >
                            {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : "送信する"}
                        </button>

                        <button 
                            type="button"
                            onClick={() => {
                                setIsResetMode(false);
                                setError('');
                            }}
                            className="w-full text-xs text-slate-500 hover:text-white mt-4"
                        >
                            キャンセルして戻る
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {mode === 'register' && (
                            <div className="space-y-2">
                                <label className="text-xs text-slate-400 ml-1">Name</label>
                            <input 
                                type="text" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="あなたの名前"
                                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder:text-slate-700 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50 transition-all font-serif"
                                required
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-xs text-slate-400 ml-1">Email</label>
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="mail@example.com"
                            className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder:text-slate-700 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50 transition-all font-mono text-sm"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs text-slate-400 ml-1">Password</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••"
                            className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder:text-slate-700 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50 transition-all font-mono"
                            required
                        />
                    </div>

                    {error && (
                        <p className="text-red-400 text-xs text-center bg-red-900/20 py-2 rounded border border-red-900/30">
                            {error}
                        </p>
                    )}

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full bg-white text-black font-bold py-4 rounded-full flex items-center justify-center gap-2 hover:bg-gold-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                    >
                        {isLoading ? (
                            <Loader2 className="animate-spin w-5 h-5" />
                        ) : (
                            <>
                                <span>{mode === 'login' ? 'LOGIN' : 'START EXISTENCE'}</span>
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </form>
            )}

                {!isResetMode && (
                    <div className="mt-8 text-center space-y-4">
                        <button 
                            onClick={() => {
                                setMode(mode === 'login' ? 'register' : 'login');
                                setError('');
                            }}
                            className="text-xs text-slate-500 hover:text-white transition-colors underline underline-offset-4 block w-full"
                        >
                            {mode === 'login' ? 'アカウントを新規作成' : 'すでにアカウントをお持ちの方へ'}
                        </button>

                        {mode === 'login' && (
                            <button 
                                onClick={() => {
                                    setIsResetMode(true);
                                    setError('');
                                }}
                                className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors block w-full"
                            >
                                パスワードを忘れた場合
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
