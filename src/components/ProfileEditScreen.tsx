import React, { useState, useRef, useEffect } from 'react';
import { Camera, MapPin, Link as LinkIcon, Save, Loader2, ChevronLeft, Mail, AlertCircle, ShieldCheck, CheckCircle, XCircle, Sparkles, X } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { useProfile } from '../hooks/useProfile';
import { useLocationData } from '../hooks/useLocationData';
import { useAuth } from '../hooks/useAuthHook';
import { PREFECTURES } from '../data/prefectures';
import { UserProfile } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { MESSAGES as BaseMessages } from '../constants/messages';
import { mapAgeGroup } from '../utils/formatAgeGroup';

interface ProfileEditScreenProps {
    onClose: () => void;
    onBack: () => void;
}

export const ProfileEditScreen: React.FC<ProfileEditScreenProps> = ({ onBack }) => {
    const { t: MESSAGES } = useLanguage();
    const { profile, updateProfile } = useProfile();
    const { user, updateUserEmail } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [isOptimizing, setIsOptimizing] = useState(false);
    
    // Email Change Modal States
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [emailPassword, setEmailPassword] = useState('');
    const [emailError, setEmailError] = useState('');
    const [emailSuccess, setEmailSuccess] = useState('');
    
    // Form States
    const [name, setName] = useState(profile?.name || '');
    const [bio, setBio] = useState(profile?.bio || '');
    const [age_group, setAgeGroup] = useState(profile?.age_group || '');
    const [gender, setGender] = useState<"male" | "female" | "other" | "">(profile?.gender || '');
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
            setAgeGroup(curr => curr || profile.age_group || '');
            setGender(curr => curr || profile.gender || '');
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

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const rawFile = e.target.files[0];
            
            setIsOptimizing(true);
            try {
                // 圧縮オプションの設定
                const options = {
                    maxSizeMB: 0.09, // 100KB弱を目指す
                    maxWidthOrHeight: 400,
                    useWebWorker: true,
                    fileType: 'image/webp' as string, // WebPを優先
                    initialQuality: 0.8,
                };

                // ブラウザ内での圧縮実行
                const compressedFile = await imageCompression(rawFile, options);
                
                // Fileオブジェクトとして保持
                setImageFile(compressedFile);
                
                // Base64に変換してプレビュー表示
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPreviewUrl(reader.result as string);
                };
                reader.readAsDataURL(compressedFile);
            } catch (error) {
                console.error("Image optimization failed:", error);
                alert(MESSAGES.PROFILE.PHOTO_ERROR);
            } finally {
                setIsOptimizing(false);
            }
        }
    };

    const handleEmailChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setEmailError('');
        setEmailSuccess('');
        setIsLoading(true);
        
        try {
            if (!newEmail || !emailPassword) {
                setEmailError(MESSAGES.PROFILE.EMAIL_REQ_BOTH);
                return;
            }
            
            await updateUserEmail(newEmail, emailPassword);
            setEmailSuccess(MESSAGES.PROFILE.EMAIL_CHANGE_SUCCESS);
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
                setEmailError(MESSAGES.PROFILE.PW_INCORRECT);
            } else if (firebaseError.code === 'auth/email-already-in-use') {
                setEmailError(MESSAGES.PROFILE.EMAIL_IN_USE);
            } else if (firebaseError.code === 'auth/invalid-email') {
                setEmailError(MESSAGES.PROFILE.EMAIL_INVALID);
            } else {
                setEmailError(MESSAGES.PROFILE.EMAIL_CHANGE_FAIL);
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
            // Clean undefined values to prevent Firestore errors
            const updates: Partial<UserProfile> = {
                name,
                location, // location is required type, assumed set
                bio: bio || null,
                age_group: age_group || undefined,
                gender: gender || undefined,
                links: links || null,
                avatarUrl: avatarUrl || null
            };

            const result = await updateProfile(updates);
            if (result && result.success) {
                onBack(); 
            } else {
                const errorMsg = result?.error ? String(result.error) : MESSAGES.SYSTEM.ERROR_UNKNOWN;
                alert(`${MESSAGES.PROFILE.SAVE_ERROR_PREFIX}${errorMsg}`);
            }
        } catch (error) {
            console.error("Failed to update profile", error);
            alert(`${MESSAGES.SYSTEM.ERROR_GENERIC}: ${error}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] bg-[#F9F8F4]/80 backdrop-blur-3xl flex flex-col animate-fade-in font-sans w-full h-full">
            {/* Header */}
            <div className="w-full sticky top-0 z-10 shrink-0 pt-safe">
                <div className="border-b border-transparent">
                    <div className="max-w-2xl mx-auto px-6 py-4 md:py-8 flex items-center justify-between flex-nowrap gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                            <button
                                onClick={onBack}
                                aria-label={MESSAGES.SYSTEM.BTN_CLOSE}
                                className="p-2 -ml-2 text-slate-400 hover:text-slate-600 transition-colors active:scale-95"
                            >
                                <X size={24} strokeWidth={1.5} />
                            </button>
                            {/* Text Group */}
                            <div className="flex flex-col min-w-0">
                                <h2 className="text-xl sm:text-2xl font-light tracking-[0.2em] sm:tracking-[0.4em] uppercase text-slate-900 truncate leading-tight" style={{fontFamily: "'Noto Serif JP', serif"}}>
                                    {MESSAGES.PROFILE.EDIT_TITLE}
                                </h2>
                            </div>
                        </div>
                        <div className="flex h-12 items-center">
                            <button 
                                onClick={handleSave} 
                                disabled={isLoading}
                                className="flex items-center gap-2 px-6 py-3 bg-amber-900/90 backdrop-blur-md text-white rounded-full text-sm font-bold shadow-[0_10px_20px_-5px_rgba(69,26,3,0.3)] hover:bg-amber-900 hover:shadow-2xl active:scale-[0.98] transition-all disabled:opacity-20 disabled:cursor-not-allowed group font-sans tracking-widest"
                            >
                                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                <span>{MESSAGES.PROFILE.SAVE_BUTTON}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar w-full">
                <div className="max-w-2xl mx-auto p-6 space-y-8 pb-24">
                    
                    {/* Avatar Selection */}
                    <div className="flex flex-col items-center">
                        <div className="relative group cursor-pointer" onClick={() => !isOptimizing && fileInputRef.current?.click()}>
                            <div className="w-24 h-24 rounded-full bg-white/40 backdrop-blur-md overflow-hidden p-0.5 relative group">
                                <div className="w-full h-full rounded-full overflow-hidden border-2 border-white/60 shadow-sm">
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Avatar" className={`w-full h-full object-cover transition-opacity duration-700 ${isOptimizing ? 'opacity-30' : 'opacity-100'}`} />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-50">
                                            <Camera size={32} />
                                        </div>
                                    )}
                                </div>
                                
                                {/* Optimization Overlay */}
                                {isOptimizing && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/40 backdrop-blur-[1px]">
                                        <Loader2 size={24} className="text-blue-500 animate-spin mb-1" />
                                    </div>
                                )}
                            </div>
                            
                            {!isOptimizing && (
                                <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera size={24} className="text-white" />
                                </div>
                            )}

                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*" 
                                onChange={handleImageChange}
                                disabled={isOptimizing}
                            />
                        </div>
                        <div className="flex flex-col items-center gap-1 mt-2">
                           {isOptimizing ? (
                               <div className="flex items-center gap-1.5 text-blue-700 animate-pulse">
                                   <Sparkles size={12} />
                                   <span className="text-sm font-bold tracking-wider">{MESSAGES.PROFILE.PHOTO_OPTIMIZING}</span>
                               </div>
                           ) : (
                               <p className="text-sm text-slate-500 font-medium">{MESSAGES.PROFILE.PHOTO_CHANGE}</p>
                           )}
                        </div>
                    </div>

                {/* Trust Shield Progress */}
                <div className="bg-white/40 backdrop-blur-xl p-6 rounded-[2rem] border border-white/60 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <ShieldCheck size={18} className="text-amber-700" strokeWidth={2} />
                        <h3 className="text-sm font-bold text-amber-900 tracking-[0.1em]" style={{fontFamily: "'Noto Serif JP', serif"}}>{MESSAGES.PROFILE.SHIELD_TITLE}</h3>
                    </div>
                    <p className="text-xs text-slate-500 mb-5 leading-relaxed opacity-80">
                        {MESSAGES.PROFILE.SHIELD_DESC}
                    </p>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            {previewUrl ? (
                                <CheckCircle size={16} className="text-amber-600 shrink-0" strokeWidth={2.5} />
                            ) : (
                                <XCircle size={16} className="text-slate-300 shrink-0" strokeWidth={2} />
                            )}
                            <span className={`text-[13px] tracking-wide ${previewUrl ? 'text-amber-900 font-medium' : 'text-slate-400'}`}>
                                {MESSAGES.PROFILE.REQ_AVATAR}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            {bio.length >= 30 ? (
                                <CheckCircle size={16} className="text-amber-600 shrink-0" strokeWidth={2.5} />
                            ) : (
                                <XCircle size={16} className="text-slate-300 shrink-0" strokeWidth={2} />
                            )}
                            <span className={`text-[13px] tracking-wide ${bio.length >= 30 ? 'text-amber-900 font-medium' : 'text-slate-400'}`}>
                                {MESSAGES.PROFILE.REQ_BIO} <span className="font-mono text-sm opacity-50 ml-1">({bio.length}/30)</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            {(links.x || links.instagram || links.website) ? (
                                <CheckCircle size={16} className="text-amber-600 shrink-0" strokeWidth={2.5} />
                            ) : (
                                <XCircle size={16} className="text-slate-300 shrink-0" strokeWidth={2} />
                            )}
                            <span className={`text-[13px] tracking-wide ${(links.x || links.instagram || links.website) ? 'text-amber-900 font-medium' : 'text-slate-400'}`}>
                                {MESSAGES.PROFILE.REQ_SNS}
                            </span>
                        </div>
                    </div>
                </div>

                    {/* Basic Info Group */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-[0.2em] ml-2" style={{fontFamily: "'Noto Serif JP', serif"}}>{MESSAGES.PROFILE.BASIC_INFO}</h3>
                        <div className="bg-white/40 backdrop-blur-xl p-6 rounded-[2rem] border border-white/60 shadow-sm space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1.5">{MESSAGES.PROFILE.NAME_LABEL}</label>
                                <input 
                                    type="text" 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full p-4 bg-white/40 border border-white/60 rounded-2xl text-slate-800 font-medium focus:outline-none focus:bg-white/60 transition-all text-base placeholder:text-slate-300"
                                    placeholder={MESSAGES.PROFILE.NAME_PLACEHOLDER}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1.5">{MESSAGES.PROFILE.AGE_LABEL}</label>
                                <div className="relative">
                                    <select 
                                        value={age_group}
                                        onChange={(e) => setAgeGroup(e.target.value)}
                                        className="w-full p-4 bg-white/40 border border-white/60 rounded-2xl text-slate-800 font-medium appearance-none focus:outline-none focus:bg-white/60 transition-all text-base"
                                    >
                                        <option value="">{MESSAGES.PROFILE.AGE_UNSELECTED}</option>
                                        {BaseMessages.PROFILE.AGE_OPTIONS.map(age => (
                                            <option key={age} value={age}>{mapAgeGroup(age, MESSAGES)}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <ChevronLeft size={16} className="-rotate-90" />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1.5">{MESSAGES.PROFILE.GENDER_LABEL}</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { value: 'male', label: MESSAGES.AUTH.GENDER_MALE },
                                        { value: 'female', label: MESSAGES.AUTH.GENDER_FEMALE },
                                        { value: 'other', label: MESSAGES.AUTH.GENDER_OTHER }
                                    ].map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setGender(opt.value as "male" | "female" | "other")}
                                            className={`py-3 px-2 rounded-2xl text-sm font-bold transition-all border ${
                                                gender === opt.value
                                                    ? "bg-amber-900/10 text-amber-900 border-amber-900/20"
                                                    : "bg-white/20 text-slate-400 border-transparent hover:bg-white/40"
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                                {gender === 'other' && (
                                    <p className="text-sm text-slate-500 mt-1.5 ml-1">
                                        {MESSAGES.PROFILE.GENDER_NOTE}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1.5">{MESSAGES.PROFILE.BIO_LABEL}</label>
                                <textarea 
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    className="w-full p-4 bg-white/40 border border-white/60 rounded-2xl text-slate-800 text-base focus:outline-none focus:bg-white/60 transition-all resize-none h-24 placeholder:text-slate-300"
                                    placeholder={MESSAGES.PROFILE.BIO_PLACEHOLDER}
                                    maxLength={160}
                                />
                                <div className="text-right text-sm text-slate-500 mt-1">{bio.length}/160</div>
                            </div>
                        </div>
                    </div>

                    {/* Location Group */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-1" style={{fontFamily: "'Noto Serif JP', serif"}}>
                            <MapPin size={12} />
                            {MESSAGES.PROFILE.LOCATION_TITLE}
                        </h3>
                        <div className="bg-white/40 backdrop-blur-xl p-6 rounded-[2rem] border border-white/60 shadow-sm space-y-5">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-bold text-slate-600 mb-1.5">{MESSAGES.PROFILE.LOCATION_PREF_LABEL}</label>
                                    <div className="relative">
                                        <select 
                                            value={location.prefecture}
                                            onChange={(e) => setLocation(prev => ({ ...prev, prefecture: e.target.value }))}
                                            className="w-full p-4 bg-white/40 border border-white/60 rounded-2xl text-slate-800 text-base font-medium appearance-none focus:outline-none focus:bg-white/60 transition-all"
                                        >
                                            <option value="">{MESSAGES.PROFILE.AGE_UNSELECTED}</option>
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
                                    <label className="block text-sm font-bold text-slate-600 mb-1.5">{MESSAGES.PROFILE.LOCATION_CITY_LABEL}</label>
                                    <div className="relative">
                                        <select 
                                            value={location.city}
                                            onChange={(e) => setLocation(prev => ({ ...prev, city: e.target.value }))}
                                            className="w-full p-4 bg-white/40 border border-white/60 rounded-2xl text-slate-800 text-base font-medium appearance-none focus:outline-none focus:bg-white/60 disabled:opacity-30 transition-all"
                                            disabled={!location.prefecture || loadingCities}
                                        >
                                            <option value="">{loadingCities ? MESSAGES.PROFILE.LOCATION_LOADING : MESSAGES.PROFILE.LOCATION_CITY_SELECT}</option>
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
                        <h3 className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-1" style={{fontFamily: "'Noto Serif JP', serif"}}>
                            <LinkIcon size={12} />
                            {MESSAGES.PROFILE.SNS_TITLE}
                        </h3>
                        <div className="bg-white/40 backdrop-blur-xl p-6 rounded-[2rem] border border-white/60 shadow-sm space-y-5">
                            <div className="flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white shrink-0 font-bold text-sm">𝕏</span>
                                <input 
                                    type="text" 
                                    value={links.x}
                                    onChange={(e) => setLinks(prev => ({ ...prev, x: e.target.value }))}
                                    className="flex-1 min-w-0 p-4 bg-white/40 border border-white/60 rounded-2xl text-slate-700 text-base font-mono focus:outline-none focus:bg-white/60 transition-all placeholder:text-slate-300"
                                    placeholder={MESSAGES.PROFILE.SNS_PLACEHOLDER_USER}
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
                                    className="flex-1 min-w-0 p-4 bg-white/40 border border-white/60 rounded-2xl text-slate-700 text-base font-mono focus:outline-none focus:bg-white/60 transition-all placeholder:text-slate-300"
                                    placeholder={MESSAGES.PROFILE.SNS_PLACEHOLDER_USER}
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
                                    className="flex-1 min-w-0 p-4 bg-white/40 border border-white/60 rounded-2xl text-slate-700 text-base font-mono focus:outline-none focus:bg-white/60 transition-all placeholder:text-slate-300"
                                    placeholder={MESSAGES.PROFILE.SNS_PLACEHOLDER_WEB}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Email Address Group */}
                    {user?.email && (
                        <div className="space-y-4">
                            <h3 className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-1" style={{fontFamily: "'Noto Serif JP', serif"}}>
                                <Mail size={12} />
                                {MESSAGES.PROFILE.ACCOUNT_TITLE}
                            </h3>
                            <div className="bg-white/40 backdrop-blur-xl p-6 rounded-[2rem] border border-white/60 shadow-sm space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-slate-600 mb-1.5">{MESSAGES.PROFILE.EMAIL_LABEL}</label>
                                    <div className="w-full p-4 bg-white/20 border border-white/40 rounded-2xl text-slate-500 text-base font-mono">
                                        {user.email}
                                    </div>
                                    <p className="text-sm text-slate-500 mt-1.5 ml-1 flex items-center gap-1">
                                        <AlertCircle size={10} />
                                        {MESSAGES.PROFILE.EMAIL_NOTE}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowEmailModal(true)}
                                    className="w-full p-4 bg-white/20 border border-white/60 rounded-2xl text-slate-500 text-sm font-medium hover:bg-white/40 transition-all flex items-center justify-center gap-2"
                                >
                                    <Mail size={16} />
                                    {MESSAGES.PROFILE.EMAIL_CHANGE_BTN}
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
                        <h3 className="font-bold text-slate-800 mb-4 text-center">{MESSAGES.PROFILE.EMAIL_MODAL_TITLE}</h3>
                        <form onSubmit={handleEmailChange} className="space-y-3">
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1.5">{MESSAGES.PROFILE.EMAIL_NEW_LABEL}</label>
                                <input 
                                    type="email" 
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    placeholder="new@example.com" 
                                    required 
                                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-base font-mono focus:outline-none focus:ring-2 focus:ring-blue-100 shadow-[inset_0_1px_4px_rgba(0,0,0,0.02)]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1.5">{MESSAGES.PROFILE.EMAIL_PW_LABEL}</label>
                                <input 
                                    type="password" 
                                    value={emailPassword}
                                    onChange={(e) => setEmailPassword(e.target.value)}
                                    placeholder={MESSAGES.PROFILE.PH_PASSWORD} 
                                    required 
                                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-100 shadow-[inset_0_1px_4px_rgba(0,0,0,0.02)]"
                                />
                            </div>
                            {emailError && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{emailError}</p>}
                            {emailSuccess && <p className="text-sm text-green-600 bg-green-50 p-2 rounded">{emailSuccess}</p>}
                            
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
                                    {MESSAGES.PROFILE.BTN_CANCEL}
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isLoading}
                                    className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 disabled:opacity-50 transition-colors"
                                >
                                    {isLoading ? MESSAGES.PROFILE.BTN_CHANGING : MESSAGES.PROFILE.BTN_CHANGE}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
