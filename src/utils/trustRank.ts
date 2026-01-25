
export interface TrustRank {
    label: string;
    icon: string;
    color: string;
    bg: string;
}

export const getTrustRank = (completedContracts: number = 0): TrustRank => {
    if (completedContracts >= 10) {
        return { label: 'Veteran', icon: '🏆', color: 'text-amber-500', bg: 'bg-amber-100' };
    }
    if (completedContracts >= 3) {
        return { label: 'Regular', icon: '★', color: 'text-blue-500', bg: 'bg-blue-100' };
    }
    return { label: 'Beginner', icon: '🔰', color: 'text-green-500', bg: 'bg-green-100' };
};
