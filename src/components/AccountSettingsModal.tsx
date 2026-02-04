import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuthHook';
import { X, LogOut, Trash2, AlertTriangle } from 'lucide-react';

export const AccountSettingsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { signOut, deleteAccount } = useAuth();
    const [isDeleting, setIsDeleting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const handleSignOut = async () => {
        await signOut();
        onClose();
    };

    const handleDelete = async () => {
        if (!confirmDelete) {
            setConfirmDelete(true);
            return;
        }
        setIsDeleting(true);
        try {
            await deleteAccount();
            window.location.reload(); // Force refresh to clear state
        } catch (e) {
            console.error("Delete failed", e);
            alert("退会処理に失敗しました。再ログインしてからお試しください。");
            setIsDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden"
            >
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-slate-800">アカウント設定</h2>
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100">
                            <X size={20} className="text-slate-400" />
                        </button>
                    </div>

                    <div className="space-y-3">
                         <button 
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-3 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors text-slate-600 font-bold"
                        >
                            <LogOut size={20} />
                            ログアウト
                        </button>
                        
                        {!confirmDelete ? (
                             <button 
                                onClick={() => setConfirmDelete(true)}
                                className="w-full flex items-center gap-3 p-4 rounded-xl bg-red-50 hover:bg-red-100 transition-colors text-red-600 font-bold"
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
                                    <p className="text-sm text-red-800 font-bold leading-relaxed">
                                        すべての記録と LM は時の流れに還り、元に戻すことはできません。よろしいですか？
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setConfirmDelete(false)}
                                        className="flex-1 py-3 rounded-lg bg-white text-slate-600 font-bold shadow-sm border border-slate-100"
                                    >
                                        キャンセル
                                    </button>
                                    <button 
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="flex-1 py-3 rounded-lg bg-red-500 text-white font-bold shadow-sm hover:bg-red-600"
                                    >
                                        {isDeleting ? "処理中..." : "退会を実行"}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
