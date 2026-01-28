import { UserProfile } from '../types';

export interface TrustRank {
    label: string;
    icon: string;
    color: string;
    bg: string;
    isVerified: boolean;
}

export const getTrustRank = (profile: UserProfile | null, snapshotScore: number = 0): TrustRank => {
    // 1. Snapshot / Loading Fallback (Loose logic)
    if (!profile) {
        if (snapshotScore >= 10) return { label: 'Veteran', icon: '🏆', color: 'text-amber-500', bg: 'bg-amber-100', isVerified: false };
        if (snapshotScore >= 3) return { label: 'Regular', icon: '★', color: 'text-blue-500', bg: 'bg-blue-100', isVerified: false };
        return { label: 'Beginner', icon: '🔰', color: 'text-green-500', bg: 'bg-green-100', isVerified: false };
    }

    // 2. Strict Logic with Profile Completeness
    const score = profile.completed_contracts ?? snapshotScore;
    
    // Verification Criteria (Trust Shield):
    // 1. Has avatar
    // 2. Bio is 30+ characters
    // 3. Has at least one social link
    const hasAvatar = !!profile.avatarUrl;
    const hasBioComplete = !!(profile.bio && profile.bio.length >= 30);
    const hasLinks = profile.links && (profile.links.x || profile.links.instagram || profile.links.website);
    const isVerified = hasAvatar && hasBioComplete && !!hasLinks;
    
    // Basic Completeness (for rank calculation)
    const hasBio = !!profile.bio;

    // Veteran: Score 10+ AND Verified AND Bio AND Avatar
    if (score >= 10 && isVerified && hasBio && hasAvatar) {
        return { label: 'Veteran', icon: '🏆', color: 'text-amber-500', bg: 'bg-amber-100', isVerified };
    }
    
    // Regular: Score 3+ AND (Bio OR Avatar)
    if (score >= 3 && (hasBio || hasAvatar)) {
        return { label: 'Regular', icon: '★', color: 'text-blue-500', bg: 'bg-blue-100', isVerified };
    }
    
    // Beginner (Default)
    // Note: Even if Score is high, if you are a "Ghost" (no avatar/bio), you remain Beginner/Ghost.
    return { label: 'Beginner', icon: '🔰', color: 'text-green-500', bg: 'bg-green-100', isVerified };
};
