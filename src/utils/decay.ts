import { calculateDecayedValue as cDV, toMilli, fromMilli, getMillis } from '../logic/worldPhysics';

export const calculateLifePoints = (balance: number, lastUpdatedMs: unknown): number => {
    const start = getMillis(lastUpdatedMs);
    const elapsedSec = ((Date.now() - start) / 1000) | 0;
    return fromMilli(cDV(toMilli(balance), elapsedSec));
};

export const calculateDecayedValue = calculateLifePoints;
export const calculateVoidValue = calculateLifePoints;
