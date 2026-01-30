import React, { useState, useRef, useEffect } from 'react';
import { Camera, MapPin, Link as LinkIcon, Save, Loader2, ChevronLeft, Mail, AlertCircle, ShieldCheck, CheckCircle, XCircle } from 'lucide-react';
import { useProfile } from '../hooks/useProfile';
import { useLocationData } from '../hooks/useLocationData';
import { useAuth } from '../hooks/useAuthHook';
import { PREFECTURES } from '../data/prefectures';
import { UserProfile } from '../types';

interface ProfileEditScreenProps {
    onClose: () => void;
    onBack: () => void;
}

export const ProfileEditScreen: React.FC<ProfileEditScreenProps> = ({ onBack }) => {
    const { profile, updateProfile } = useProfile();
    const { user, updateUserEmail } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    
    // Email Change Modal States
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [emailPassword, setEmailPassword] = useState('');
    const [emailError, setEmailError] = useState('');
    const [emailSuccess, setEmailSuccess] = useState('');
    
    // Form States
    const [name, setName] = useState(profile?.name || '');
    const [bio, setBio] = useState(profile?.bio || '');
    const [location, setLocation] = useState<{ prefecture: string, city: string }>({
        prefecture: profile?.location?.prefecture || '',
        city: profile?.location?.city || ''
    });
    const [links, setLinks] = useState<{ x: string, instagram: string, website: string }>({
        x: profile?.links?.x || '',
        instagram: profile?.links?.instagram || '',
        website: profile?.links?.website || ''
    });

    // Sync state with profile data when it loads
    useEffect(() => {
        if (profile) {
            setName(curr => curr || profile.name || '');
            setBio(curr => curr || profile.bio || '');
            setLocation(curr => {
                if (curr.prefecture && curr.city) return curr; // Don't overwrite if user started editing?
                // Actually if profile loads late, we want to start with profile data.
                return {
                    prefecture: profile.location?.prefecture || '',
                    city: profile.location?.city || ''
                };
            });
            // Update SNS links when profile loads
            setLinks(curr => {
                if (curr.x || curr.instagram || curr.website) return curr; // Don't overwrite if user started editing
                return {
                    x: profile.links?.x || '',
                    instagram: profile.links?.instagram || '',
                    website: profile.links?.website || ''
                };
            });
            // Update avatar preview when profile loads
            if (profile.avatarUrl) {
                setPreviewUrl(profile.avatarUrl);
            }
        }
    }, [profile]);
    
    // City Data Hook
    const { cities, loading: loadingCities } = useLocationData(location.prefecture);

    // Image Upload
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(profile?.avatarUrl || null);
    const [imageFile, setImageFile] = useState<File | null>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            
            // ファイルサイズチェック（100KB以下）
            if (file.size > 100 * 1024) {
                alert('画像サイズは100KB以下にしてください。画像を圧縮してから再度お試しください。');
                return;
            }
            
            setImageFile(file);
            
            // Base64に変換してプレビュー表示
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleEmailChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setEmailError('');
        setEmailSuccess('');
        setIsLoading(true);
        
        try {
            if (!newEmail || !emailPassword) {
                setEmailError('メールアドレスとパスワードを入力してください');
                return;
            }
            
            await updateUserEmail(newEmail, emailPassword);
            setEmailSuccess('メールアドレスを変更しました');
            setNewEmail('');
            setEmailPassword('');
            setTimeout(() => {
                setShowEmailModal(false);
                setEmailSuccess('');
            }, 2000);
        } catch (error: unknown) {
            console.error('Email update error:', error);
            const firebaseError = error as { code?: string };
            if (firebaseError.code === 'auth/wrong-password') {
                setEmailError('パスワードが正しくありません');
            } else if (firebaseError.code === 'auth/email-already-in-use') {
                setEmailError('このメールアドレスは既に使用されています');
            } else if (firebaseError.code === 'auth/invalid-email') {
                setEmailError('無効なメールアドレスです');
            } else {
                setEmailError('メールアドレスの変更に失敗しました');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            let avatarUrl = profile?.avatarUrl;

            // 1. Base64エンコードした画像を保存（Storage不要）
            if (imageFile && previewUrl) {
                avatarUrl = previewUrl; // Base64文字列をそのまま保存
            }

            // 2. Update Profile
            const updates: Partial<UserProfile> = {
                name,
                bio,
                location,
                links,
                avatarUrl
            };

            await updateProfile(updates);
            onBack(); // Go back to profile view
        } catch (error) {
            console.error("Failed to update profile", error);
            alert("更新に失敗しました。");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] bg-slate-50 flex flex-col pt-safe animate-fade-in font-sans w-full h-full">
            {/* Header */}
            <div className="w-full bg-white border-b border-slate-200 sticky top-0 z-10 shrink-0">
                <div className="max-w-md mx-auto flex items-center justify-between p-4">
                    <div className="flex items-center gap-2">
                        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                            <ChevronLeft size={24} />
                        </button>
                        <h2 className="text-lg font-bold text-slate-800">プロフィール編集</h2>
                    </div>
                    <button 
                        onClick={handleSave} 
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-full text-sm font-bold hover:bg-slate-800 disabled:opacity-50 transition-all shadow-sm"
                    >
                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        <span>保存</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar w-full">
                <div className="max-w-md mx-auto p-6 space-y-8 pb-24">
                    
                    {/* Avatar Selection */}
                    <div className="flex flex-col items-center">
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <div className="w-24 h-24 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-md">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                        <Camera size={32} />
                                    </div>
                                )}
                            </div>
                            <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera size={24} className="text-white" />
                            </div>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*" 
                                onChange={handleImageChange}
                            />
                        </div>
                        <p className="text-xs text-slate-400 mt-2 font-medium">写真を変更</p>
                    </div>

                {/* Trust Shield Progress */}
                <div className="bg-gradient-to-br from-blue-50 to-slate-50 p-5 rounded-2xl border border-blue-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <ShieldCheck size={18} className="text-blue-500" strokeWidth={2.5} />
                        <h3 className="text-sm font-bold text-slate-800">信頼の盾までの道のり</h3>
                    </div>
                    <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                        すべて整えると、プロフィールに<span className="font-bold text-blue-600">信頼の盾</span>が灯ります。あなたの誠実さが隣人に伝わり、安心して助け合える関係がここから広がっていきます。
                    </p>
                    <div className="space-y-2.5">
                        {/* Avatar Check */}
                        <div className="flex items-center gap-2.5">
                            {previewUrl ? (
                                <CheckCircle size={16} className="text-green-500 shrink-0" strokeWidth={2.5} />
                            ) : (
                                <XCircle size={16} className="text-slate-300 shrink-0" strokeWidth={2.5} />
                            )}
                            <span className={`text-xs ${previewUrl ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
                                プロフィール画像を登録
                            </span>
                        </div>
                        {/* Bio Check */}
                        <div className="flex items-center gap-2.5">
                            {bio.length >= 30 ? (
                                <CheckCircle size={16} className="text-green-500 shrink-0" strokeWidth={2.5} />
                            ) : (
                                <XCircle size={16} className="text-slate-300 shrink-0" strokeWidth={2.5} />
                            )}
                            <span className={`text-xs ${bio.length >= 30 ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
                                自己紹介を30文字以上入力 <span className="font-mono text-[10px]">({bio.length}/30)</span>
                            </span>
                        </div>
                        {/* Links Check */}
                        <div className="flex items-center gap-2.5">
                            {(links.x || links.instagram || links.website) ? (
                                <CheckCircle size={16} className="text-green-500 shrink-0" strokeWidth={2.5} />
                            ) : (
                                <XCircle size={16} className="text-slate-300 shrink-0" strokeWidth={2.5} />
                            )}
                            <span className={`text-xs ${(links.x || links.instagram || links.website) ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
                                SNSを1つ以上連携する
                            </span>
                        </div>
                    </div>
                </div>

                    {/* Basic Info Group */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">基本情報</h3>
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1.5">表示名</label>
                                <input 
                                    type="text" 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                                    placeholder="名前を入力"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1.5">自己紹介 (Bio)</label>
                                <textarea 
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all resize-none h-24"
                                    placeholder="自己紹介文を入力してください (最大160文字)"
                                    maxLength={160}
                                />
                                <div className="text-right text-[10px] text-slate-400 mt-1">{bio.length}/160</div>
                            </div>
                        </div>
                    </div>

                    {/* Location Group */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-1">
                            <MapPin size={12} />
                            居住地・拠点
                        </h3>
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1.5">都道府県</label>
                                    <div className="relative">
                                        <select 
                                            value={location.prefecture}
                                            onChange={(e) => setLocation(prev => ({ ...prev, prefecture: e.target.value }))}
                                            className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 text-sm font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        >
                                            <option value="">未選択</option>
                                            {PREFECTURES.map(pref => (
                                                <option key={pref} value={pref}>{pref}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <ChevronLeft size={16} className="-rotate-90" />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1.5">市区町村</label>
                                    <div className="relative">
                                        <select 
                                            value={location.city}
                                            onChange={(e) => setLocation(prev => ({ ...prev, city: e.target.value }))}
                                            className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 text-sm font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
                                            disabled={!location.prefecture || loadingCities}
                                        >
                                            <option value="">{loadingCities ? '読み込み中...' : '市区町村を選択'}</option>
                                            {cities.map(city => (
                                                <option key={city} value={city}>{city}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <ChevronLeft size={16} className="-rotate-90" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Links Group */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-1">
                            <LinkIcon size={12} />
                            ソーシャルリンク
                        </h3>
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                            <div className="flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white shrink-0 font-bold text-xs">𝕏</span>
                                <input 
                                    type="text" 
                                    value={links.x}
                                    onChange={(e) => setLinks(prev => ({ ...prev, x: e.target.value }))}
                                    className="flex-1 p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-600 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-slate-300"
                                    placeholder="@username or URL"
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center text-white shrink-0">
                                    <Camera size={16} />
                                </span>
                                <input 
                                    type="text" 
                                    value={links.instagram}
                                    onChange={(e) => setLinks(prev => ({ ...prev, instagram: e.target.value }))}
                                    className="flex-1 p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-600 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-slate-300"
                                    placeholder="@username or URL"
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                                    <LinkIcon size={16} />
                                </span>
                                <input 
                                    type="text" 
                                    value={links.website}
                                    onChange={(e) => setLinks(prev => ({ ...prev, website: e.target.value }))}
                                    className="flex-1 p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-600 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-slate-300"
                                    placeholder="https://example.com"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Email Address Group */}
                    {user?.email && (
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-1">
                                <Mail size={12} />
                                アカウント
                            </h3>
                            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1.5">登録メールアドレス</label>
                                    <div className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-600 text-sm font-mono">
                                        {user.email}
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1.5 ml-1 flex items-center gap-1">
                                        <AlertCircle size={10} />
                                        このアドレスは他のユーザーには公開されません
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowEmailModal(true)}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-sm font-medium hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Mail size={16} />
                                    メールアドレスを変更する
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* Email Change Modal */}
            {showEmailModal && (
                <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">
                    <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-xl">
                        <h3 className="font-bold text-slate-800 mb-4 text-center">メールアドレスの変更</h3>
                        <form onSubmit={handleEmailChange} className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1.5">新しいメールアドレス</label>
                                <input 
                                    type="email" 
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    placeholder="new@example.com" 
                                    required 
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1.5">現在のパスワード（確認用）</label>
                                <input 
                                    type="password" 
                                    value={emailPassword}
                                    onChange={(e) => setEmailPassword(e.target.value)}
                                    placeholder="パスワード" 
                                    required 
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                            {emailError && <p className="text-xs text-red-500 bg-red-50 p-2 rounded">{emailError}</p>}
                            {emailSuccess && <p className="text-xs text-green-500 bg-green-50 p-2 rounded">{emailSuccess}</p>}
                            
                            <div className="flex gap-3 mt-4">
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        setShowEmailModal(false);
                                        setEmailError('');
                                        setNewEmail('');
                                        setEmailPassword('');
                                    }}
                                    className="flex-1 py-2.5 bg-slate-100 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                                >
                                    キャンセル
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isLoading}
                                    className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 disabled:opacity-50 transition-colors"
                                >
                                    {isLoading ? '変更中...' : '変更する'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
