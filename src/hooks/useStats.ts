import { useState, useEffect } from 'react';
import { LUNAR_CONSTANTS } from '../constants';
import { db } from '../lib/firebase';
import { collection, query, limit, getDocs, doc, getDoc, getCountFromServer, setDoc } from 'firebase/firestore';
import { calculateLifePoints } from '../utils/decay';

export type Season = 'Spring' | 'Autumn' | 'Winter';
export type MetabolismStatus = 'Active' | 'Stable' | 'Stagnant';

export interface DashboardStats {
    cycle: {
        day: number;
        totalDays: number;
        season: Season;
        timeLeftHours: number;
        rebornToday: number;
    };
    metabolism: {
        volume24h: number;
        giftVolume: number;
        wishVolume: number;
        rate: number; // percentage
        status: MetabolismStatus;
        totalSupply: number;
        decay24h: number; // Estimated gravity loss
    };
    distribution: {
        full: number; // count
        quarter: number;
        new: number;
    };
    sunCapacity: number;
}

export const useStats = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [sunCapacity, setSunCapacity] = useState(LUNAR_CONSTANTS.FULL_MOON_BALANCE);
    const [error, setError] = useState<string | null>(null);

    // Effect 1: Init Capacity (Mount only)
    useEffect(() => {
        const fetchCapacity = async () => {
             if (!db) return;
             try {
                 const settingsRef = doc(db, 'system_settings', 'stats');
                 const snap = await getDoc(settingsRef);
                 if (snap.exists()) {
                     setSunCapacity(snap.data().global_capacity || LUNAR_CONSTANTS.FULL_MOON_BALANCE);
                 }
             } catch (e) {
                 console.warn("Failed to fetch global capacity", e);
             }
        };
        fetchCapacity();
    }, []);

    // Effect 2: Stats Loop (Depends on sunCapacity to pass it to state)
    useEffect(() => {
        const calculateStats = async () => {
            const now = Date.now();
            
            // 2. Metabolism (Scalable)
            let volume = 0;
            let giftVolume = 0;
            let wishVolume = 0;
            let rebornCount = 0;

            if (db) {
                try {
                    const today = new Date().toISOString().split('T')[0];
                    const dailyStatsRef = doc(db, 'daily_stats', today);
                    const dailyStatsSnap = await getDoc(dailyStatsRef);
                    
                    if (dailyStatsSnap.exists()) {
                        const data = dailyStatsSnap.data();
                        volume = data.volume || 0;
                        giftVolume = data.gift_volume || 0;
                        wishVolume = data.wish_volume || 0;
                        rebornCount = data.reborn_count || 0;
                    }
                } catch (e) {
                     console.warn("Failed to fetch daily stats", e);
                }
            }

            // 3. Distribution (Scalable)
            // 3. Distribution (Scalable)
            const fetchDistribution = async () => {
                if (!db) return;
                try {
                    const userColl = collection(db, 'users');
                    const q = query(userColl, limit(1000));
                    const snapshot = await getDocs(q);
                    
                    let full = 0;
                    let quarter = 0;
                    let low = 0;
                    let sampleSize = 0;
                    let totalDaysSum = 0; // For average cycle calculation

                    snapshot.forEach(doc => {
                        const data = doc.data();
                        const rawBal = Number(data.balance) || 0;
                        const lastUpdated = data.last_updated || data.created_at;
                        const trueBal = calculateLifePoints(rawBal, lastUpdated);

                        if (trueBal >= 1500) full++;
                        else if (trueBal >= 500) quarter++;
                        else low++;
                        
                        // Cycle Calculation
                        // cycle_started_at -> days elapsed
                        let startedAt = now; 
                        if (data.cycle_started_at) startedAt = data.cycle_started_at.toMillis();
                        else if (data.created_at) startedAt = data.created_at.toMillis();
                        
                        const elapsed = now - startedAt;
                        // 1 day = 86400000ms
                        // Day is 1-indexed. Elapsed < 24h -> Day 1.
                        let currentDay = Math.floor(elapsed / (24 * 60 * 60 * 1000)) + 1;
                        if (currentDay > 10) currentDay = 10; // Cap at max cycle logic for avg
                        if (currentDay < 1) currentDay = 1;
                        
                        totalDaysSum += currentDay;
                        sampleSize++;
                    });

                    let totalPopulation = sampleSize;
                    try {
                        const countSnap = await getCountFromServer(userColl);
                        totalPopulation = countSnap.data().count;
                    } catch (e) {
                        console.warn("Count failed, using sample size");
                    }

                    const distribution = {
                        full,
                        quarter,
                        new: low
                    };
                    
                    // Calculate Total Supply & Decay
                    let calculatedTotalSupply = 0;
                    snapshot.forEach(doc => {
                        const d = doc.data();
                        const b = Number(d.balance) || 0;
                        const l = d.last_updated || d.created_at;
                        calculatedTotalSupply += calculateLifePoints(b, l);
                    });
                    
                    // Approximate total supply for whole population if sample is small
                    if (totalPopulation > sampleSize && sampleSize > 0) {
                        calculatedTotalSupply = (calculatedTotalSupply / sampleSize) * totalPopulation;
                    }

                    // Decay = Population * Decay_Per_Sec * 86400
                    // 10 Lm/hour = 240 Lm/day per person
                    // This is "Potential Decay". Actual decay depends on if they have balance, but macro-level fits.
                    const estimatedDecay24h = totalPopulation * 240; 
                    
                    const rate = calculatedTotalSupply > 0 ? Number(((volume / calculatedTotalSupply) * 100).toFixed(4)) : 0;
                    
                    let status: MetabolismStatus = 'Stable';
                    if (rate >= 10) status = 'Active';
                    if (rate < 5) status = 'Stagnant';
                    
                    // Average Cycle Stats
                    const avgDay = sampleSize > 0 ? Math.round(totalDaysSum / sampleSize) : 1;
                    let realSeason: Season = 'Spring';
                    if (avgDay >= 4) realSeason = 'Autumn';
                    if (avgDay >= 8) realSeason = 'Winter';
                    const timeLeftHours = (10 - avgDay) * 24;

                    setStats({
                        cycle: {
                            day: avgDay,
                            totalDays: LUNAR_CONSTANTS.CYCLE_DAYS,
                            season: realSeason,
                            timeLeftHours, 
                            rebornToday: rebornCount 
                        },
                        metabolism: {
                            volume24h: volume,
                            giftVolume,
                            wishVolume,
                            rate,
                            status,
                            totalSupply: calculatedTotalSupply,
                            decay24h: estimatedDecay24h
                        },
                        distribution,
                        sunCapacity // Reads current state
                    });
                    setError(null);

                } catch (e) {
                    console.error('Failed to fetch user stats', e);
                    setError('統計データの取得に失敗しました');
                }
            };
            
            fetchDistribution();
        };

        calculateStats();
        const interval = setInterval(calculateStats, 60000); 
        return () => clearInterval(interval);
    }, [sunCapacity]);

    const updateCapacity = async (newCapacity: number) => {
        setSunCapacity(newCapacity);
        if (db) {
            try {
                const settingsRef = doc(db, 'system_settings', 'stats');
                await setDoc(settingsRef, { global_capacity: newCapacity }, { merge: true });
                console.log(`Sun Capacity Synced: ${newCapacity}`);
            } catch (e) {
                console.error("Failed to sync sun capacity", e);
            }
        }
    };

    return { stats, error, updateCapacity };
};
