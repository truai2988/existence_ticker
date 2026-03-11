import { MESSAGES } from "../constants/messages";

export const formatLocationCount = (count: number | string | null | undefined): string => {
  if (count === null || count === undefined) return MESSAGES.SYSTEM.LOCATION_FORMAT_CHECKING;
  const numCount = Number(count);
  if (isNaN(numCount)) return MESSAGES.SYSTEM.LOCATION_FORMAT_ERROR;
  if (numCount === 0) return MESSAGES.SYSTEM.LOCATION_FORMAT_EMPTY;
  if (numCount < 5) return MESSAGES.SYSTEM.LOCATION_FORMAT_FEW;
  return `${numCount}${MESSAGES.SYSTEM.LOCATION_FORMAT_COUNT}`;
};
