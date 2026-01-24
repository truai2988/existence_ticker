import { useState, useEffect } from 'react';
import { Point } from '../types';

const STORAGE_KEY = 'existence_ticker_points';

export const usePersistence = () => {
  const [points, setPoints] = useState<Point[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Failed to load points', e);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(points));
    } catch (e) {
      console.error('Failed to save points', e);
    }
  }, [points]);

  const addPoint = (value: number, reason: string) => {
    const newPoint: Point = {
      id: crypto.randomUUID(),
      value,
      reason,
      timestamp: Date.now()
    };
    setPoints(prev => [...prev, newPoint]);
  };

  return { points, addPoint, setPoints };
};
