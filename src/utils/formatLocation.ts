import { MESSAGES as BaseMessages } from "../constants/messages";

export const formatLocationCount = (
  count: number | string | null | undefined,
  currentMessages: typeof BaseMessages
): string => {
  if (count === null || count === undefined) return currentMessages.SYSTEM.LOCATION_FORMAT_CHECKING;
  const numCount = Number(count);
  if (isNaN(numCount)) return currentMessages.SYSTEM.LOCATION_FORMAT_ERROR;
  if (numCount === 0) return currentMessages.SYSTEM.LOCATION_FORMAT_EMPTY;
  if (numCount < 5) return currentMessages.SYSTEM.LOCATION_FORMAT_FEW;
  return `${numCount}${currentMessages.SYSTEM.LOCATION_FORMAT_COUNT}`;
};

export const mapPrefecture = (
  prefName: string | undefined | null
): string => {
  if (!prefName) return "";
  return prefName;
};

export const mapCity = (
  cityName: string | undefined | null
): string => {
  if (!cityName) return "";
  
  // As per user preference, we display the original Japanese city name 
  // even in English mode to maintain consistency with the selection UI.
  return cityName;
};
