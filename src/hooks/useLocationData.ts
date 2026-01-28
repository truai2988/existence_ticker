import { useState, useEffect } from 'react';

// Simple in-memory cache to avoid re-fetching
let cachedData: Record<string, string[]> | null = null;
let fetchPromise: Promise<Record<string, string[]>> | null = null;

export const useLocationData = (prefecture: string) => {
    const [cities, setCities] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!prefecture) {
            setCities([]);
            return;
        }

        const loadCities = async () => {
            if (cachedData) {
                setCities(cachedData[prefecture] || []);
                return;
            }

            setLoading(true);
            try {
                if (!fetchPromise) {
                    fetchPromise = fetch('https://geolonia.github.io/japanese-addresses/api/ja.json')
                        .then(res => {
                            if (!res.ok) throw new Error('Failed to fetch location data');
                            return res.json();
                        })
                        .then(data => {
                            cachedData = data;
                            return data;
                        });
                }
                
                const data = await fetchPromise;
                setCities(data[prefecture] || []);
            } catch (error) {
                console.error("Error fetching location data:", error);
                setCities([]);
            } finally {
                setLoading(false);
            }
        };

        loadCities();
    }, [prefecture]);

    return { cities, loading };
};
