import { UserProfile } from "../types";

export const isProfileComplete = (profile: UserProfile | null): boolean => {
    if (!profile) return false;
    
    // Check Avatar
    if (!profile.avatarUrl) return false;

    // Check Bio (non-empty)
    if (!profile.bio || profile.bio.trim().length === 0) return false;

    return true;
};
