import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuthHook';
import { X, LogOut, Trash2, AlertTriangle, Loader2 } from 'lucide-react';

/* Typography Rule: font-serif/font-sans, 3sizes (text-3xl, text-base, text-xs) */

export const AccountSettingsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { signOut, deleteAccount, reauthenticate } = useAuth();
    const [isDeleting, setIsDeleting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    
    // Re-auth state
    const [showReauth, setShowReauth] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSignOut = async () => {
        await signOut();
        onClose();
    };

    const handleDelete = async () => {
        setError('');
        setIsDeleting(true);
        try {
            if (showReauth) {
                // If in re-auth mode, authenticate first
                await reauthenticate(password);
                setShowReauth(false); // Clear re-auth mode if successful
            }
            
            await deleteAccount();
            window.location.reload(); // Force refresh to clear state
        } catch (error: unknown) {
            console.error("Delete failed", error);
            setIsDeleting(false);
            
            const e = error as { code?: string; message?: string };

            // Handle "Requires Recent Login"
            if (e.code === 'auth/requires-recent-login' || e.message?.includes('requires-recent-login')) {
                setShowReauth(true);
                setError("セキュリティ保護のため、パスワードの再入力が必要です。");
            } else if (e.code === 'auth/wrong-password') {
                setError("パスワードが間違っています。");
            } else {
                setError("退会処理に失敗しました。時間をおいて再試行してください。");
            }
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={isDeleting ? undefined : onClose} />
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden"
            >
                {/* Modal Content */}
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-base font-bold text-slate-800 font-sans">アカウント設定</h2>
                        <button 
                            onClick={onClose} 
                            disabled={isDeleting}
                            className={`p-1 rounded-full hover:bg-slate-100 ${isDeleting ? 'opacity-30 cursor-not-allowed' : ''}`}
                        >
                            <X size={20} className="text-slate-400" />
                        </button>
                    </div>

                    <div className="space-y-3">
                         {!showReauth && !confirmDelete && (
                         <button 
                            onClick={handleSignOut}
                            disabled={isDeleting}
                            className="w-full flex items-center gap-3 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors text-slate-600 font-bold disabled:opacity-50 text-base font-sans"
                        >
                            <LogOut size={20} />
                            ログアウト
                        </button>
                        )}
                        
                        {!confirmDelete ? (
                             <button 
                                onClick={() => setConfirmDelete(true)}
                                disabled={isDeleting}
                                className="w-full flex items-center gap-3 p-4 rounded-xl bg-red-50 hover:bg-red-100 transition-colors text-red-600 font-bold disabled:opacity-50 text-base font-sans"
                            >
                                <Trash2 size={20} />
                                退会する
                            </button>
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="bg-red-50 p-4 rounded-xl text-left"
                            >
                                <div className="flex items-start gap-3 mb-4">
                                     <AlertTriangle size={24} className="text-red-500 shrink-0" />
                                    <p className="text-xs text-red-800 font-bold leading-relaxed font-sans">
                                        すべての記録と LM は時の流れに還り、元に戻すことはできません。よろしいですか？
                                    </p>
                                </div>

                                {showReauth && (
                                    <div className="mb-4 space-y-2">
                                        <p className="text-xs text-red-600 font-bold font-sans">パスワードを確認します</p>
                                        <input 
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            disabled={isDeleting}
                                            placeholder="パスワードを入力"
                                            className="w-full px-3 py-2 text-base border border-red-200 rounded-lg focus:outline-none focus:border-red-400 disabled:bg-red-50/50 font-sans"
                                        />
                                    </div>
                                )}

                                {error && (
                                    <p className="text-xs text-red-600 mb-3 font-bold font-sans">{error}</p>
                                )}

                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => {
                                            setConfirmDelete(false);
                                            setShowReauth(false);
                                            setPassword('');
                                            setError('');
                                        }}
                                        disabled={isDeleting}
                                        className="flex-1 py-3 rounded-lg bg-white text-slate-600 font-bold shadow-sm border border-slate-100 disabled:opacity-50 text-base font-sans"
                                    >
                                        キャンセル
                                    </button>
                                     <button 
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="flex-1 py-3 rounded-lg bg-red-500 text-white font-bold shadow-sm hover:bg-red-600 disabled:bg-red-300 flex items-center justify-center gap-2 text-base font-sans"
                                    >
                                        {isDeleting ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" />
                                                処理中
                                            </>
                                        ) : (
                                            showReauth ? "認証して退会" : "退会を実行"
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Loading Overlay */}
                <AnimatePresence>
                    {isDeleting && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10"
                        >
                             <Loader2 size={40} className="text-red-500 animate-spin mb-4" />
                            <h3 className="text-base font-bold text-slate-800 mb-2 font-sans">退会処理を行っています</h3>
                            <p className="text-xs text-slate-500 leading-relaxed font-sans">
                                完了までしばらくお待ちください。<br />
                                画面を閉じず、そのままお待ちください。
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};
