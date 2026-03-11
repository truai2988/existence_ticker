import { MESSAGES as BaseMessages } from "../constants/messages";

export const mapAgeGroup = (ageGroup: string, currentMessages: typeof BaseMessages): string => {
  if (!ageGroup) return "";
  
  // Map agnostic DB keys to their localized equivalents via the current Messages object
  switch (ageGroup) {
    case "under_20":
      return currentMessages.AUTH.AGE_GROUP_UNDER_20;
    case "20":
      return currentMessages.AUTH.AGE_GROUP_20S;
    case "30":
      return currentMessages.AUTH.AGE_GROUP_30S;
    case "40":
      return currentMessages.AUTH.AGE_GROUP_40S;
    case "50":
      return currentMessages.AUTH.AGE_GROUP_50S;
    case "60":
      return currentMessages.AUTH.AGE_GROUP_60S;
    case "70":
      return currentMessages.AUTH.AGE_GROUP_70S;
    case "over_80":
      return currentMessages.AUTH.AGE_GROUP_OVER_80;
    default:
      return ageGroup; // Fallback
  }
};
