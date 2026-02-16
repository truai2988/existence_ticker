import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export const useLocationStats = (prefecture?: string, city?: string) => {
  const [statsCount, setStatsCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!prefecture || !city || !db) {
      setStatsCount(null);
      return;
    }

    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const docId = `${prefecture}_${city}`;
        const docRef = doc(db!, "location_stats", docId);
        const snap = await getDoc(docRef);
        
        if (snap.exists()) {
          setStatsCount(snap.data().count || 0);
        } else {
          setStatsCount(0);
        }
      } catch (e) {
        console.error("[useLocationStats] Fetch failed", e);
        setStatsCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [prefecture, city]);

  return { statsCount, isLoading };
};
