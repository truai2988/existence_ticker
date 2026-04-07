import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuthHook';
import { X, LogOut, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

/* Typography Rule: font-serif/font-sans, 3sizes (text-3xl, text-base, text-xs) */

export const AccountSettingsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { signOut, deleteAccount, reauthenticate } = useAuth();
    const { t: MESSAGES } = useLanguage();
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
                setError(MESSAGES.ACCOUNT_MODAL.ERR_REAUTH);
            } else if (e.code === 'auth/wrong-password') {
                setError(MESSAGES.ACCOUNT_MODAL.ERR_WRONG_PW);
            } else {
                setError(MESSAGES.ACCOUNT_MODAL.ERR_FAIL);
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
                        <h2 className="text-base font-bold text-slate-900 font-sans">{MESSAGES.ACCOUNT_MODAL.TITLE}</h2>
                        <button 
                            onClick={onClose} 
                            disabled={isDeleting}
                            className={`p-3 rounded-full hover:bg-slate-100 ${isDeleting ? 'opacity-30 cursor-not-allowed' : ''}`}
                        >
                            <X size={20} className="text-slate-700" />
                        </button>
                    </div>

                    <div className="space-y-3">
                         {!showReauth && !confirmDelete && (
                         <button 
                            onClick={handleSignOut}
                            disabled={isDeleting}
                            className="w-full flex items-center gap-3 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors text-slate-800 font-bold disabled:opacity-50 text-base font-sans"
                        >
                            <LogOut size={20} />
                            {MESSAGES.ACCOUNT_MODAL.BTN_LOGOUT}
                        </button>
                        )}
                        
                        {!confirmDelete ? (
                             <button 
                                onClick={() => setConfirmDelete(true)}
                                disabled={isDeleting}
                                className="w-full flex items-center gap-3 p-4 rounded-xl bg-red-50 hover:bg-red-100 transition-colors text-red-600 font-bold disabled:opacity-50 text-base font-sans"
                            >
                                <Trash2 size={20} />
                                {MESSAGES.ACCOUNT_MODAL.BTN_DELETE}
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
                                        {MESSAGES.ACCOUNT_MODAL.DELETE_WARNING}
                                    </p>
                                </div>

                                {showReauth && (
                                    <div className="mb-4 space-y-2">
                                        <p className="text-xs text-red-600 font-bold font-sans">{MESSAGES.ACCOUNT_MODAL.PW_CONFIRM_TITLE}</p>
                                        <input 
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            disabled={isDeleting}
                                            placeholder={MESSAGES.ACCOUNT_MODAL.PW_PLACEHOLDER}
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
                                        className="flex-1 py-3 rounded-lg bg-white text-slate-800 font-bold shadow-sm border border-slate-300 disabled:opacity-50 text-base font-sans"
                                    >
                                        {MESSAGES.ACCOUNT_MODAL.BTN_CANCEL}
                                    </button>
                                     <button 
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="flex-1 py-3 rounded-lg bg-red-500 text-white font-bold shadow-sm hover:bg-red-600 disabled:bg-red-300 flex items-center justify-center gap-2 text-base font-sans"
                                    >
                                        {isDeleting ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" />
                                                {MESSAGES.ACCOUNT_MODAL.BTN_DELETING}
                                            </>
                                        ) : (
                                            showReauth ? MESSAGES.ACCOUNT_MODAL.BTN_AUTH_DELETE : MESSAGES.ACCOUNT_MODAL.BTN_EXEC_DELETE
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
                            className="absolute inset-0 bg-white shadow-sm border border-slate-200 flex flex-col items-center justify-center p-6 text-center z-10"
                        >
                             <Loader2 size={40} className="text-red-500 animate-spin mb-4" />
                            <h3 className="text-base font-bold text-slate-900 mb-2 font-sans">{MESSAGES.ACCOUNT_MODAL.LOADING_TITLE}</h3>
                            <p className="text-xs text-slate-700 leading-relaxed font-sans" dangerouslySetInnerHTML={{ __html: MESSAGES.ACCOUNT_MODAL.LOADING_DESC.replace('\n', '<br />') }} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};
