import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, User, ChevronRight, ChevronDown, QrCode, 
    LogOut, Trash2, KeyRound, ShieldAlert, Sun,
    Wallet, Heart, Star
} from 'lucide-react';
import QRCode from "react-qr-code";
import { useProfile } from '../hooks/useProfile';
import { calculateLifePoints } from '../utils/decay';
import { UNIT_LABEL, SURVIVAL_CONSTANTS } from '../constants';
import { useAuth } from '../hooks/useAuthHook';

interface ProfileViewProps {
    onClose: () => void;
    onOpenAdmin?: () => void;
    userId?: string; 
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onClose, onOpenAdmin }) => {
    const { profile, updateProfile } = useProfile();
    const { user, signOut, linkEmail, deleteAccount, updateUserPassword } = useAuth();
    
    // UI States
    const [isEditingName, setIsEditingName] = useState(false);
    const [editName, setEditName] = useState('');
    const [isQrOpen, setIsQrOpen] = useState(false);
    
    // Auth Flow States (Link/Password/Delete)
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [showPassModal, setShowPassModal] = useState(false);
    const [confirmMode, setConfirmMode] = useState<'logout' | 'delete' | null>(null);
    const [deleteStep, setDeleteStep] = useState(0);

    // Form Inputs
    const [emailInput, setEmailInput] = useState('');
    const [passInput, setPassInput] = useState('');
    const [newPass, setNewPass] = useState('');
    const [confirmNewPass, setConfirmNewPass] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const isAnonymous = user?.isAnonymous ?? false;

    // Stats Logic
    const xp = profile?.xp || 0;
    const warmth = profile?.warmth || 0;
    const currentName = profile?.name || '名もなき旅人';
    const helpfulCount = profile?.completed_contracts || 0;
    const requestCount = profile?.created_contracts || 0;

    // Visual Decay Logic
    const [displayBalance, setDisplayBalance] = useState(() => 
        profile ? calculateLifePoints(profile.balance, profile.last_updated) : 0
    );

    React.useEffect(() => {
        if (!profile) return;
        const updateValue = () => {
             setDisplayBalance(calculateLifePoints(profile.balance, profile.last_updated));
        };
        updateValue();
        const timer = setInterval(updateValue, 1000);
        return () => clearInterval(timer);
    }, [profile]);

    // Name Edit Handlers
    const startEditName = () => {
        setEditName(currentName);
        setIsEditingName(true);
    };
    const saveName = () => {
        if (editName.trim() && editName !== currentName) {
            updateProfile({ name: editName });
        }
        setIsEditingName(false);
    };

    // Auth Handlers
    const handleLinkAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setIsLoading(true);
        try {
            await linkEmail(emailInput, passInput);
            setSuccessMsg("本登録が完了しました");
            setTimeout(() => setShowLinkModal(false), 1500);
        } catch (e: unknown) {
            setErrorMsg(e instanceof Error ? e.message : String(e));
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        if (newPass !== confirmNewPass) {
            setErrorMsg("パスワードが一致しません");
            return;
        }
        setIsLoading(true);
        try {
            await updateUserPassword(newPass);
            setSuccessMsg("変更しました");
            setTimeout(() => setShowPassModal(false), 1500);
        } catch (e: unknown) {
            setErrorMsg(e instanceof Error ? e.message : String(e));
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        await signOut();
        onClose();
    };

    const handleDelete = async () => {
        try {
            await deleteAccount();
            alert("退会しました");
            onClose();
        } catch (e: unknown) {
            alert("エラー: " + (e instanceof Error ? e.message : String(e)));
        }
    };

    // Render Helpers
    const ListItem = ({ 
        icon: Icon, 
        label, 
        value, 
        onClick, 
        isDestructive = false,
        hasArrow = true 
    }: {
        icon: React.ElementType;
        label: string;
        value?: string;
        onClick: () => void;
        isDestructive?: boolean;
        hasArrow?: boolean;
    }) => (
        <button 
            onClick={onClick}
            className={`w-full flex items-center justify-between p-4 bg-white border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors ${isDestructive ? 'text-red-500' : 'text-slate-700'}`}
        >
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${isDestructive ? 'bg-red-50' : 'bg-slate-100'}`}>
                    <Icon size={16} className={isDestructive ? 'text-red-500' : 'text-slate-500'} />
                </div>
                <span className="text-sm font-medium">{label}</span>
            </div>
            <div className="flex items-center gap-2">
                {value && <span className="text-xs text-slate-400">{value}</span>}
                {hasArrow && <ChevronRight size={16} className="text-slate-300" />}
            </div>
        </button>
    );

    return (
        <div className="fixed inset-0 z-[60] bg-slate-50 flex flex-col pt-safe animate-fade-in">
            {/* Header / Nav */}
            <div className="flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-10 shrink-0">
                <h2 className="text-lg font-bold text-slate-800">登録情報</h2>
                <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                    <X size={20} className="text-slate-600" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
                {/* 1. Header Profile Info */}
                <div className="flex flex-col items-center py-8 bg-white mb-4 border-b border-slate-200">
                    <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-3 shadow-inner border border-slate-200">
                        <User size={40} className="text-slate-400" />
                    </div>
                    
                    {isEditingName ? (
                        <input 
                            autoFocus
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            onBlur={saveName}
                            className="text-xl font-bold text-center border-b-2 border-amber-400 outline-none w-1/2"
                        />
                    ) : (
                        <h3 onClick={startEditName} className="text-xl font-bold text-slate-900 mb-2 cursor-pointer hover:opacity-70 flex items-center gap-2">
                            {currentName}
                            <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">編集</span>
                        </h3>
                    )}
                    
                    <div className="flex gap-2 mt-1">
                        <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                            手伝い: {helpfulCount}回
                        </span>
                        <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                            依頼: {requestCount}回
                        </span>
                    </div>
                </div>

                {/* 2. Stats Grid */}
                <div className="grid grid-cols-2 gap-4 px-4 mb-6">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center">
                        <span className="text-[10px] text-slate-400 font-bold mb-1">手伝いのお礼</span>
                        <div className="text-xl font-bold text-slate-800 flex items-center gap-1">
                            <Star size={16} className="text-blue-400" />
                            {xp.toLocaleString()}
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center">
                        <span className="text-[10px] text-slate-400 font-bold mb-1">寄付・贈与</span>
                        <div className="text-xl font-bold text-slate-800 flex items-center gap-1">
                            <Heart size={16} className="text-pink-400" />
                            {warmth.toLocaleString()}
                        </div>
                    </div>
                </div>

                {/* 3. Settings List Group */}
                <div className="px-4 space-y-6">
                    
                    {/* Section: Wallet & ID */}
                    <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-50 rounded-full">
                                    <Wallet size={16} className="text-amber-500" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-slate-700">手持ち詳細</div>
                                    <div className="text-[10px] text-slate-400">
                                        減価レート: -{(SURVIVAL_CONSTANTS.DECAY_PER_SEC * 3600).toFixed(0)} {UNIT_LABEL}/h
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-bold text-slate-800 tabular-nums">
                                    {Math.floor(displayBalance).toLocaleString()}
                                    <span className="text-xs text-slate-400 ml-1">{UNIT_LABEL}</span>
                                </div>
                            </div>
                        </div>

                         <div className="border-t border-slate-100">
                            <button 
                                onClick={() => setIsQrOpen(!isQrOpen)}
                                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-100 rounded-full">
                                        <QrCode size={16} className="text-slate-500" />
                                    </div>
                                    <span className="text-sm font-medium text-slate-700">受取用QRコード</span>
                                </div>
                                {isQrOpen ? <ChevronDown size={16} className="text-slate-300" /> : <ChevronRight size={16} className="text-slate-300" />}
                            </button>
                            
                            <AnimatePresence>
                                {isQrOpen && (
                                    <motion.div 
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden bg-slate-50"
                                    >
                                        <div className="p-6 flex flex-col items-center justify-center border-t border-slate-100">
                                            <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-200 mb-2">
                                                <QRCode value={profile?.id || "loading"} size={160} />
                                            </div>
                                            <p className="text-[10px] text-slate-400">相手にスキャンしてもらってください</p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Section: Account Settings */}
                    <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                        
                        {isAnonymous ? (
                            <ListItem 
                                icon={Sun} 
                                label="アカウント本登録" 
                                value="未設定"
                                onClick={() => setShowLinkModal(true)} 
                            />
                        ) : (
                             <ListItem 
                                icon={KeyRound} 
                                label="パスワード変更" 
                                onClick={() => setShowPassModal(true)} 
                            />
                        )}

                        {profile?.role === 'admin' && onOpenAdmin && (
                            <ListItem 
                                icon={ShieldAlert} 
                                label="管理者メニュー" 
                                value="Kernal"
                                onClick={() => {
                                    onOpenAdmin();
                                    // onClose(); // Removed to prevent conflict with view switching
                                }} 
                            />
                        )}
                        
                        <ListItem 
                            icon={LogOut} 
                            label="ログアウト" 
                            onClick={() => setConfirmMode('logout')} 
                        />
                        
                        {!isAnonymous && (
                             <ListItem 
                                icon={Trash2} 
                                label="退会する" 
                                isDestructive
                                onClick={() => {
                                    setConfirmMode('delete');
                                    setDeleteStep(1);
                                }} 
                            />
                        )}
                    </div>
                    
                    <div className="text-center text-[10px] text-slate-300 py-4">
                        Existence Ticker v0.2.0
                    </div>

                </div>
            </div>

            {/* Modals & Dialogs Overlay */}
            <AnimatePresence>
                {(confirmMode || showLinkModal || showPassModal) && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6"
                    >
                        {/* Logout Confirm */}
                        {confirmMode === 'logout' && (
                            <div className="bg-white p-6 rounded-2xl w-full max-w-xs text-center shadow-xl">
                                <h3 className="font-bold text-slate-800 mb-2">ログアウトしますか？</h3>
                                {isAnonymous && <p className="text-xs text-red-500 mb-4 bg-red-50 p-2 rounded">ゲストアカウントのため、データが消失します。</p>}
                                <div className="flex gap-3">
                                    <button onClick={() => setConfirmMode(null)} className="flex-1 py-2.5 bg-slate-100 rounded-lg text-sm font-bold text-slate-600">キャンセル</button>
                                    <button onClick={handleLogout} className="flex-1 py-2.5 bg-red-500 rounded-lg text-sm font-bold text-white">ログアウト</button>
                                </div>
                            </div>
                        )}

                        {/* Delete Confirm */}
                        {confirmMode === 'delete' && (
                            <div className="bg-white p-6 rounded-2xl w-full max-w-xs text-center shadow-xl">
                                {deleteStep === 1 ? (
                                    <>
                                        <h3 className="font-bold text-red-600 mb-2">退会手続き</h3>
                                        <p className="text-xs text-slate-600 mb-4 text-left">
                                            全てのデータ（XP、温もり、履歴）が完全に消去されます。この操作は取り消せません。
                                        </p>
                                        <div className="flex gap-3">
                                            <button onClick={() => setConfirmMode(null)} className="flex-1 py-2.5 bg-slate-100 rounded-lg text-sm font-bold text-slate-600">キャンセル</button>
                                            <button onClick={() => setDeleteStep(2)} className="flex-1 py-2.5 bg-red-100 text-red-600 rounded-lg text-sm font-bold">進む</button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <h3 className="font-bold text-red-600 mb-2">最終確認</h3>
                                        <p className="text-xs text-red-500 mb-4 font-bold">本当に削除してよろしいですか？</p>
                                        <div className="flex gap-3">
                                            <button onClick={() => setConfirmMode(null)} className="flex-1 py-2.5 bg-slate-100 rounded-lg text-sm font-bold text-slate-600">やめる</button>
                                            <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-bold">削除実行</button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Link Account Logic (Reuse old logic but simpler UI) */}
                        {showLinkModal && (
                            <div className="bg-white p-6 rounded-2xl w-full max-w-xs shadow-xl">
                                <h3 className="font-bold text-slate-800 mb-4 text-center">アカウント本登録</h3>
                                <form onSubmit={handleLinkAccount} className="space-y-3">
                                    <input 
                                        type="email" placeholder="メールアドレス" required 
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                        value={emailInput} onChange={e => setEmailInput(e.target.value)}
                                    />
                                    <input 
                                        type="password" placeholder="パスワード" required 
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                        value={passInput} onChange={e => setPassInput(e.target.value)}
                                    />
                                    {errorMsg && <p className="text-xs text-red-500">{errorMsg}</p>}
                                    {successMsg && <p className="text-xs text-green-500">{successMsg}</p>}
                                    
                                    <div className="flex gap-3 mt-4">
                                        <button type="button" onClick={() => setShowLinkModal(false)} className="flex-1 py-2 bg-slate-100 rounded-lg text-xs font-bold text-slate-600">閉じる</button>
                                        <button type="submit" disabled={isLoading} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold">登録</button>
                                    </div>
                                </form>
                            </div>
                        )}

                         {/* Password Change Logic */}
                         {showPassModal && (
                            <div className="bg-white p-6 rounded-2xl w-full max-w-xs shadow-xl">
                                <h3 className="font-bold text-slate-800 mb-4 text-center">パスワード変更</h3>
                                <form onSubmit={handleChangePassword} className="space-y-3">
                                    <input 
                                        type="password" placeholder="新しいパスワード" required 
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                        value={newPass} onChange={e => setNewPass(e.target.value)}
                                    />
                                    <input 
                                        type="password" placeholder="確認用" required 
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                        value={confirmNewPass} onChange={e => setConfirmNewPass(e.target.value)}
                                    />
                                    {errorMsg && <p className="text-xs text-red-500">{errorMsg}</p>}
                                    {successMsg && <p className="text-xs text-green-500">{successMsg}</p>}
                                    
                                    <div className="flex gap-3 mt-4">
                                        <button type="button" onClick={() => setShowPassModal(false)} className="flex-1 py-2 bg-slate-100 rounded-lg text-xs font-bold text-slate-600">閉じる</button>
                                        <button type="submit" disabled={isLoading} className="flex-1 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold">変更</button>
                                    </div>
                                </form>
                            </div>
                        )}

                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
