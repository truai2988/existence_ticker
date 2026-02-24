import { createContext, useContext } from "react";
import { Notice } from "../types/notice";

export interface NoticeContextType {
  notices: Notice[];
  unreadCount: number;
  isLoading: boolean;
  dismissNotice: (noticeId: string) => Promise<void>;
  dismissAll: () => Promise<void>;
}

export const NoticeContext = createContext<NoticeContextType | undefined>(undefined);

export const useNoticeContext = () => {
  const context = useContext(NoticeContext);
  if (context === undefined) {
    throw new Error("useNoticeContext must be used within a NoticeProvider");
  }
  return context;
};
