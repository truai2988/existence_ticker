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

          // Logic: 
          // Always silently sync the new cycle days.
          // The user found the notification screen unnecessary ("buttons show the info").
          if (storedDays !== newDays) {
              localStorage.setItem("seasonal_cycle_days", newDays.toString());
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
