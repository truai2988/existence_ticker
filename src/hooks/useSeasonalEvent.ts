import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export interface SeasonalEventData {
  season: string;
  days: number;
  message: string;
  color: string;
}

export const useSeasonalEvent = () => {
  const [isChecking, setIsChecking] = useState(true);
  const [eventData, setEventData] = useState<SeasonalEventData | null>(null);
  const [currentCycleDays, setCurrentCycleDays] = useState<number | null>(null);

  useEffect(() => {
    const checkEvent = async () => {
      if (!db) {
        setIsChecking(false);
        return;
      }

      try {
        const docRef = doc(db, "system_settings", "global");
        const snapshot = await getDoc(docRef);

        if (snapshot.exists()) {
          const data = snapshot.data();
          const newDays = data.cycleDays || 10;

          // Retrieve stored days from localStorage
          const storedDaysStr = localStorage.getItem("seasonal_cycle_days");
          const storedDays = storedDaysStr ? parseInt(storedDaysStr, 10) : null;

          setCurrentCycleDays(newDays);

          // Logic: Trigger if FIRST VISIT (storedDays is null) OR CHANGED
          if (storedDays === null || storedDays !== newDays) {
            let season = "Equinox";
            let message = "世界が調和を取り戻しました。";
            let color = "bg-yellow-500";

            if (newDays < 10) {
              season = "Spring";
              message = "豊穣の季節が訪れました。恵みが増幅します。";
              color = "bg-green-500";
            } else if (newDays > 10) {
              season = "Winter";
              message = "試練の季節が始まりました。備えなさい。";
              color = "bg-slate-600";
            }

            setEventData({
              season,
              days: newDays,
              message,
              color,
            });
          }
        }
      } catch (error) {
        console.error("Failed to check seasonal event:", error);
      } finally {
        setIsChecking(false);
      }
    };

    checkEvent();
  }, []);

  const completeEvent = () => {
    if (currentCycleDays !== null) {
      localStorage.setItem("seasonal_cycle_days", currentCycleDays.toString());
    }
    setEventData(null);
  };

  return { isChecking, eventData, completeEvent };
};
