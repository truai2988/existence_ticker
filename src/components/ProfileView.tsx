import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Swords, Gift, Wallet, Sprout, TreeDeciduous, Sun, Copy, LogOut } from 'lucide-react';
import QRCode from "react-qr-code";
import { useProfile } from '../hooks/useProfile';
import { calculateLifePoints } from '../utils/decay';
import { UNIT_LABEL } from '../constants';
import { useAuth } from '../hooks/useAuthHook';

interface ProfileViewProps {
    onClose: () => void;
    userId?: string; 
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onClose }) => {
    const { profile, updateProfile } = useProfile();
    const { user, signOut, linkEmail, deleteAccount, updateUserPassword } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    
    // Link Account State
    const [linkEmailInput, setLinkEmailInput] = useState('');
    const [linkPassInput, setLinkPassInput] = useState('');
    const [linkLoading, setLinkLoading] = useState(false);
    const [linkError, setLinkError] = useState('');

    // Password Change State
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [newPass, setNewPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [passError, setPassError] = useState('');
    const [passSuccess, setPassSuccess] = useState('');
    const [passLoading, setPassLoading] = useState(false);

    // Confirmation States
    const [confirmMode, setConfirmMode] = useState<'logout' | 'delete' | null>(null);
    const [deleteStep, setDeleteStep] = useState(0); // 0: none, 1: first warning, 2: final warning

    const isAnonymous = user?.isAnonymous ?? false;
    
    const handleLogoutClick = () => {
        setConfirmMode('logout');
    };

    const confirmLogout = async () => {
        await signOut();
        onClose();
    };

    const handleDeleteClick = () => {
        setConfirmMode('delete');
        setDeleteStep(1);
    };

    const confirmDelete = async () => {
        try {
            await deleteAccount();
            alert("アカウントを削除しました。");
            onClose();
        } catch (e) {
            console.error(e);
            alert("削除に失敗しました: " + (e instanceof Error ? e.message : String(e)));
        }
    };

    const cancelConfirm = () => {
        setConfirmMode(null);
        setDeleteStep(0);
    };

    const handleLinkAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        setLinkError('');
        setLinkLoading(true);
        try {
            await linkEmail(linkEmailInput, linkPassInput);
            alert("アカウントの本登録が完了しました。これでログアウトしても復帰できます。");
            setLinkEmailInput('');
            setLinkPassInput('');
        } catch (err) {
            console.error(err);
            setLinkError("登録に失敗しました: " + (err instanceof Error ? err.message : String(err)));
        } finally {
            setLinkLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPassError('');
        setPassSuccess('');
        
        if (newPass !== confirmPass) {
            setPassError('パスワードが一致しません。');
            return;
        }
        if (newPass.length < 6) {
            setPassError('パスワードは6文字以上で設定してください。');
            return;
        }

        setPassLoading(true);
        try {
            await updateUserPassword(newPass);
            setPassSuccess("パスワードを変更しました。");
            setNewPass('');
            setConfirmPass('');
            setTimeout(() => {
                setIsChangingPassword(false);
                setPassSuccess('');
            }, 2000);
        } catch (err: any) {
            if (err.code === 'auth/requires-recent-login') {
                setPassError("セキュリティのため、再ログインが必要です。一度ログアウトしてから再度お試しください。");
            } else {
                setPassError("変更に失敗しました: " + (err.message || String(err)));
            }
        } finally {
            setPassLoading(false);
        }
    };
    
    // Use real stats from profile (fallback to 0)
    const xp = profile?.xp || 0;
    const warmth = profile?.warmth || 0;
    const currentName = profile?.name || 'Anonymous Soul';

    // Sync local state when not editing or when profile updates
    React.useEffect(() => {
        if (!isEditing && profile?.name) {
            setEditName(profile.name);
        }
    }, [profile?.name, isEditing]);

    const handleStartEditing = () => {
        setEditName(currentName);
        setIsEditing(true);
    };

    const handleSaveName = () => {
        if (editName.trim() !== currentName) {
             updateProfile({ name: editName });
        }
        setIsEditing(false);
    };

    // === Visual Decay Logic ===
    const [displayBalance, setDisplayBalance] = useState(() => {
        if (profile) {
            return calculateLifePoints(profile.balance, profile.last_updated);
        }
        return 0;
    });

    React.useEffect(() => {
        if (!profile) return;

        const baseBalance = profile.balance;
        const lastUpdated = profile.last_updated;

        const updateValue = () => {
             const current = calculateLifePoints(baseBalance, lastUpdated);
             setDisplayBalance(current);
        };

        updateValue();

        const timer = setInterval(updateValue, 1000);
        return () => clearInterval(timer);
    }, [profile]);

    // ... [unchanged] ...

    // Rank Logic
    const getRank = (score: number) => {
        if (score < 500) return { label: 'Seed (種)', icon: <Sprout size={32} />, color: 'text-green-300' };
        if (score < 2000) return { label: 'Sprout (芽)', icon: <TreeDeciduous size={32} />, color: 'text-green-500' };
        return { label: 'Sun (恒星)', icon: <Sun size={32} />, color: 'text-gold-500' };
    };

    const rank = getRank(xp);

    // ... [unchanged] ...

    return (
        <div className="fixed inset-0 h-[100dvh] z-[100] flex flex-col items-center bg-black/95 backdrop-blur-md animate-fade-in overflow-y-auto no-scrollbar">
            <div className="w-full max-w-sm flex-grow flex flex-col p-6 relative min-h-screen">
                 {/* Header */}
                <div className="flex justify-between items-end mb-8 border-b border-white/5 pb-4">
                    <div>
                        <h2 className="text-2xl font-serif text-white/90">プロフィール</h2>
                        <p className="text-xs text-gray-500 font-mono tracking-widest uppercase">Profile</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        <X className="text-gray-400" size={24} />
                    </button>
                </div>

                {/* Profile Card */}
                <div className="flex flex-col items-center gap-6">
                    {/* ... [Rank Icon & Name Input unchanged] ... */}
                    {/* Rank Icon */}
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-900 to-black border border-white/10 flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.05)] relative"
                    >
                         {/* Rank Glow */}
                        <div className={`absolute inset-0 rounded-full blur-xl opacity-20 ${rank.color === 'text-gold-500' ? 'bg-gold-500' : 'bg-green-500'}`}></div>
                        <div className={`${rank.color}`}>
                            {rank.icon}
                        </div>
                    </motion.div>
                    
                    <div className="text-center -mt-2">
                        <span className="text-[10px] uppercase tracking-widest text-gray-500">Contribution Rank</span>
                        <p className={`text-sm font-bold ${rank.color} mt-1`}>{rank.label}</p>
                    </div>

                    {/* Name Input */}
                    <div className="w-full text-center mt-1 mb-4">
                        {isEditing ? (
                            <input 
                                type="text" 
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onBlur={handleSaveName}
                                className="bg-transparent border-b border-gold-400 text-center text-xl text-white outline-none w-full pb-1 font-serif"
                                autoFocus
                            />
                        ) : (
                            <h3 
                                onClick={handleStartEditing}
                                className="text-xl text-white font-serif cursor-pointer hover:text-gold-200 transition-colors border-b border-transparent hover:border-white/10 pb-1"
                            >
                                {currentName}
                            </h3>
                        )}
                        <p className="text-xs text-gray-600 mt-2">タップして名前を変更</p>
                    </div>


                    {/* === 1. SOUL RECORDS (History) === */}
                    <div className="w-full space-y-3">
                         <div className="flex items-center justify-center gap-2 mb-2 opacity-60">
                            <div className="h-[1px] w-8 bg-slate-600"></div>
                            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">SOUL RECORDS (History)</span>
                            <div className="h-[1px] w-8 bg-slate-600"></div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 w-full">
                            {/* EARNED */}
                            <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-700/50 flex flex-col items-center gap-1 group">
                                <div className="flex items-center gap-1.5 mb-1 opacity-70 group-hover:opacity-100 transition-opacity">
                                    <Swords className="w-3.5 h-3.5 text-blue-300" /> 
                                    <span className="text-[9px] text-blue-200 uppercase tracking-widest">EARNED</span>
                                </div>
                                <div className="text-2xl font-mono font-bold text-white tracking-tight">
                                    {xp} <span className="text-[10px] font-normal text-slate-500">XP</span>
                                </div>
                                <div className="w-full h-[1px] bg-slate-800 my-1" />
                                <div className="text-[9px] text-slate-400 text-center leading-tight">
                                    叶えた願いの対価<br/>
                                    <span className="text-[8px] text-slate-600">(自らの行動で獲得)</span>
                                </div>
                            </div>

                            {/* GIFTED */}
                            <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-700/50 flex flex-col items-center gap-1 group">
                                <div className="flex items-center gap-1.5 mb-1 opacity-70 group-hover:opacity-100 transition-opacity">
                                    <Gift className="w-3.5 h-3.5 text-pink-400" />
                                    <span className="text-[9px] text-pink-200 uppercase tracking-widest">GIFTED</span>
                                </div>
                                <div className="text-2xl font-mono font-bold text-pink-100 tracking-tight">
                                    {warmth}
                                </div>
                                <div className="w-full h-[1px] bg-slate-800 my-1" />
                                <div className="text-[9px] text-slate-400 text-center leading-tight">
                                    贈られた感謝<br/>
                                    <span className="text-[8px] text-slate-600">(対価なく受領)</span>
                                </div>
                            </div>
                        </div>
                        
                         <p className="text-[10px] text-center text-slate-600 font-serif italic opacity-70">
                            "一度刻まれた徳と温もりは、決して消えることはない"
                        </p>
                    </div>

                    {/* === 2. WALLET STATUS === */}
                    <div className="w-full relative pt-6 pb-2">
                        <div className="absolute top-2 inset-x-8 border-t border-dashed border-slate-800" />
                        
                        <div className="bg-slate-900/80 rounded-xl p-4 border border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.05)] flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] text-yellow-500/70 uppercase tracking-widest font-bold flex items-center gap-1">
                                    <Wallet size={12} />
                                    Life Duration
                                </span>
                                <span className="text-[9px] text-slate-500">
                                    残された時間
                                </span>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-mono font-bold text-yellow-400 tabular-nums leading-none">
                                    {Math.floor(displayBalance)}
                                    <span className="text-sm text-yellow-500/60 ml-0.5">.{(displayBalance % 1).toFixed(2).substring(2)}</span>
                                    <span className="text-sm font-normal ml-1">{UNIT_LABEL}</span>
                                </div>
                                <div className="flex items-center justify-end gap-1 text-[9px] text-red-400/80 mt-1 font-mono">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block"></span> decaying
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* === 3. IDENTITY (QR) === */}
                    <div className="relative bg-white p-5 rounded-2xl flex flex-col items-center gap-4 shadow-[0_0_40px_rgba(255,255,255,0.05)] mt-4 mb-8 w-full">
                        <div className="absolute top-3 right-3 p-1 rounded-md hover:bg-slate-100 cursor-pointer transition-colors group">
                           <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                        </div>
                        <div className="p-1">
                           <QRCode 
                                value={profile?.id || "loading..."} 
                                size={140}
                                fgColor="#000000"
                                bgColor="#FFFFFF"
                            />
                        </div>
                        <div className="text-center space-y-0.5">
                          <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">
                            EXISTENCE ID (QR)
                          </p>
                        </div>
                    </div>

                    {/* === 4. LINK ACCOUNT (Anonymous Only) === */}
                    {isAnonymous && (
                        <div className="w-full bg-yellow-900/10 border border-yellow-500/30 rounded-xl p-4 mb-8 animate-fade-in">
                            <h4 className="text-xs font-bold text-yellow-500 mb-2 flex items-center gap-1">
                                <Sun size={12} />
                                魂を刻む (アカウント本登録)
                            </h4>
                            <p className="text-[10px] text-slate-400 mb-4">
                                現在は仮の姿（ゲスト）です。ログアウトすると、全ての記憶と記録が<span className="text-red-400">永遠に失われます</span>。
                                以下を設定して、存在を確定させてください。
                            </p>
                            <form onSubmit={handleLinkAccount} className="space-y-3">
                                <input 
                                    type="email" 
                                    placeholder="Email"
                                    value={linkEmailInput}
                                    onChange={e => setLinkEmailInput(e.target.value)}
                                    className="w-full bg-black/50 border border-slate-700 rounded p-2 text-xs text-white"
                                    required
                                />
                                <input 
                                    type="password" 
                                    placeholder="Password"
                                    value={linkPassInput}
                                    onChange={e => setLinkPassInput(e.target.value)}
                                    className="w-full bg-black/50 border border-slate-700 rounded p-2 text-xs text-white"
                                    required
                                />
                                {linkError && (
                                    <p className="text-[10px] text-red-400">{linkError}</p>
                                )}
                                <button 
                                    type="submit" 
                                    disabled={linkLoading}
                                    className="w-full py-2 bg-yellow-600/20 border border-yellow-500/50 text-yellow-200 text-xs rounded hover:bg-yellow-600/30 transition-colors"
                                >
                                    {linkLoading ? "刻印中..." : "本登録完了"}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* === 5. SECURITY (Change Password) === */}
                    {!isAnonymous && (
                        <div className="w-full bg-slate-900/40 border border-slate-700/50 rounded-xl p-4 mb-4">
                            <button 
                                onClick={() => setIsChangingPassword(!isChangingPassword)}
                                className="w-full flex items-center justify-between text-xs font-bold text-slate-300 mb-2"
                            >
                                <span className="flex items-center gap-2">
                                    <LogOut size={12} className="rotate-90" /> {/* Reusing icon for key-like visual or just generic */}
                                    パスワード変更
                                </span>
                                <span className="text-[10px] text-slate-500">{isChangingPassword ? '閉じる' : '開く'}</span>
                            </button>
                            
                            {isChangingPassword && (
                                <form onSubmit={handleChangePassword} className="space-y-3 animate-fade-in mt-2 border-t border-white/5 pt-3">
                                    <input 
                                        type="password" 
                                        placeholder="新しいパスワード"
                                        value={newPass}
                                        onChange={e => setNewPass(e.target.value)}
                                        className="w-full bg-black/50 border border-slate-700 rounded p-2 text-xs text-white"
                                        required
                                    />
                                    <input 
                                        type="password" 
                                        placeholder="新しいパスワード（確認）"
                                        value={confirmPass}
                                        onChange={e => setConfirmPass(e.target.value)}
                                        className="w-full bg-black/50 border border-slate-700 rounded p-2 text-xs text-white"
                                        required
                                    />
                                    {passError && <p className="text-[10px] text-red-400">{passError}</p>}
                                    {passSuccess && <p className="text-[10px] text-green-400">{passSuccess}</p>}
                                    
                                    <button 
                                        type="submit" 
                                        disabled={passLoading}
                                        className="w-full py-2 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 text-white text-xs rounded transition-colors"
                                    >
                                        {passLoading ? "変更中..." : "パスワードを変更"}
                                    </button>
                                </form>
                            )}
                        </div>
                    )}

                    {/* === 6. ACTIONS (Logout & Delete) === */}
                    <div className="w-full flex flex-col gap-3 py-4 mb-20">
                        {/* Normal Buttons */}
                        {confirmMode === null && (
                            <>
                                <button 
                                    onClick={handleLogoutClick}
                                    className="w-full py-4 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl border border-slate-800 hover:border-slate-600 transition-all flex items-center justify-center gap-2"
                                >
                                    <LogOut size={16} />
                                    <span className="text-xs uppercase tracking-widest">Sign Out</span>
                                </button>

                                {!isAnonymous && (
                                    <button 
                                        onClick={handleDeleteClick}
                                        className="w-full py-2 text-red-900/40 hover:text-red-600 hover:bg-red-900/10 rounded-xl transition-all flex items-center justify-center gap-2 mt-4"
                                    >
                                        <span className="text-[10px] uppercase tracking-widest font-bold">Delete Account (退会)</span>
                                    </button>
                                )}
                            </>
                        )}

                        {/* Logout Confirmation */}
                        {confirmMode === 'logout' && (
                            <div className="bg-slate-900/90 border border-slate-700 p-4 rounded-xl animate-fade-in text-center">
                                <p className="text-sm text-white mb-4 whitespace-pre-line leading-relaxed">
                                    {isAnonymous 
                                        ? "【警告】ゲストアカウントです。\nこのままログアウトすると、全てのデータが失われます。\n\n本当にログアウトしますか？"
                                        : "ログアウトしてもよろしいですか？"
                                    }
                                </p>
                                <div className="flex gap-2">
                                    <button onClick={cancelConfirm} className="flex-1 py-2 text-xs text-slate-400 border border-slate-700 rounded hover:bg-slate-800">
                                        Cancel
                                    </button>
                                    <button onClick={confirmLogout} className="flex-1 py-2 text-xs text-white bg-red-900/50 border border-red-800 rounded hover:bg-red-800">
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Delete Confirmation */}
                        {confirmMode === 'delete' && (
                            <div className="bg-slate-900/90 border border-red-900/50 p-4 rounded-xl animate-fade-in text-center">
                                {deleteStep === 1 && (
                                    <>
                                        <h4 className="text-red-400 font-bold mb-2">【重要】退会確認</h4>
                                        <p className="text-xs text-slate-300 mb-4 text-left leading-relaxed">
                                            ・全ての記録（プロフィール、XP、温もり）が消去されます。<br/>
                                            ・あなたが放った「願い」は全て<span className="text-slate-500">無に帰します</span>（または名もなき記憶となります）。<br/>
                                            ・この操作は取り消せません。
                                        </p>
                                        <div className="flex gap-2">
                                            <button onClick={cancelConfirm} className="flex-1 py-2 text-xs text-slate-400 border border-slate-700 rounded hover:bg-slate-800">
                                                とどまる
                                            </button>
                                            <button onClick={() => setDeleteStep(2)} className="flex-1 py-2 text-xs text-red-200 bg-red-900/30 border border-red-800 rounded hover:bg-red-900/50">
                                                進む
                                            </button>
                                        </div>
                                    </>
                                )}
                                {deleteStep === 2 && (
                                    <>
                                        <h4 className="text-red-500 font-bold mb-2">本当に実行しますか？</h4>
                                        <p className="text-xs text-red-400/80 mb-4">
                                            この操作は不可逆です。<br/>あなたの存在（アカウント）は完全に消去されます。
                                        </p>
                                        <div className="flex gap-2">
                                            <button onClick={cancelConfirm} className="flex-1 py-2 text-xs text-slate-400 border border-slate-700 rounded hover:bg-slate-800">
                                                キャンセル
                                            </button>
                                            <button onClick={confirmDelete} className="flex-1 py-2 text-xs text-white bg-red-600 border border-red-500 rounded hover:bg-red-500 shadow-[0_0_15px_rgba(220,38,38,0.4)]">
                                                存在を消去する
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};
