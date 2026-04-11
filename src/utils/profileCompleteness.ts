import { UserProfile } from "../types";

export const isProfileComplete = (profile: UserProfile | null): boolean => {
    if (!profile) return false;
    
    // Check if SNS or website link exists
    const hasSns = profile.links && (profile.links.x || profile.links.instagram || profile.links.website);
    if (hasSns) return true;

    // Check Avatar and long Bio
    const hasAvatar = !!profile.avatarUrl;
    const hasLongBio = profile.bio && profile.bio.trim().length >= 30;
    
    if (hasAvatar && hasLongBio) return true;

    return false;
};
