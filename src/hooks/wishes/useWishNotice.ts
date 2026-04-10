import { Notice } from "../../types/notice";
import { useAuth } from "../useAuthHook";
import { addNotice } from "../../utils/addNotice";

export const useWishNotice = () => {
  const { user } = useAuth();

  const sendNoticeSilently = async (noticeData: { 
    userId: string; 
    message: string; 
    messageKey?: string;
    params?: Record<string, string>;
    type: Notice["type"]; 
    fromId?: string;
    wishId?: string;
  }) => {
    try {
      await addNotice({
        userId: noticeData.userId,
        fromId: noticeData.fromId || user?.uid || "system",
        wishId: noticeData.wishId,
        message: noticeData.message,
        messageKey: noticeData.messageKey,
        params: noticeData.params,
        type: noticeData.type,
        createdAt: Date.now(),
      });
    } catch (error) {
      console.error("Notice failed to send, but action proceeded:", error);
    }
  };

  return { sendNoticeSilently };
};
