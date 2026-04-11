import { Wish } from "../../types";
import { UserProfile, AppViewMode } from "../../types";
import { TrustRank } from "../../logic/worldPhysics";

export interface WishCardProps {
  wish: Wish;
  currentUserId: string;
  viewType?: "radiance" | "flow";
  onOpenProfile?: () => void;
  onActionComplete?: (
    action:
      | "applied"
      | "withdrawn"
      | "approved"
      | "cancelled"
      | "resigned"
      | "completed"
      | "cleanup",
  ) => void;
  isReadOnly?: boolean;
  onTabChange?: (tab: AppViewMode) => void;
}

export interface WishCardState {
  wish: Wish;
  currentUserId: string;
  viewType: "radiance" | "flow";
  isReadOnly: boolean;
  onOpenProfile?: () => void;
  onActionComplete?: (
    action:
      | "applied"
      | "withdrawn"
      | "approved"
      | "cancelled"
      | "resigned"
      | "completed"
      | "cleanup",
  ) => void;
  onTabChange?: (tab: AppViewMode) => void;

  isMyWish: boolean;
  isLoading: boolean;
  showApplicants: boolean;
  isEditing: boolean;
  editContent: string;
  confirmAction: "delete" | "compensate" | "resign" | null;
  approvalTarget: { id: string; name: string } | null;
  contactNote: string;
  isCopied: boolean;
  showCompleteModal: boolean;
  showApplyConfirm: boolean;
  applyConfirmIsAnonymous: boolean;
  showCleanupConfirm: boolean;

  initialCost: number;
  displayValue: number;
  isExpired: boolean;
  hasApplied: boolean;
  isMasked: boolean;
  isHelperMasked: boolean;

  requesterProfile: UserProfile | null;
  helperProfile: UserProfile | null;
  myProfile: UserProfile | null;
  trust: TrustRank;

  displayRequesterName: string;
  contactEmail: string | undefined;
  opponentName: string;
  mailSubject: string;
  mailBody: string;
  mailtoLink: string;
}

export interface WishCardHandlers {
  setIsLoading: (val: boolean) => void;
  setShowApplicants: (val: boolean) => void;
  setIsEditing: (val: boolean) => void;
  setEditContent: (val: string) => void;
  setConfirmAction: (val: "delete" | "compensate" | "resign" | null) => void;
  setApprovalTarget: (val: { id: string; name: string } | null) => void;
  setContactNote: (val: string) => void;
  setIsCopied: (val: boolean) => void;
  setShowCompleteModal: (val: boolean) => void;
  setShowApplyConfirm: (val: boolean) => void;
  setShowCleanupConfirm: (val: boolean) => void;
  executeApply: () => Promise<void>;

  handleApply: () => Promise<void>;
  handleApprove: (id: string, name: string) => void;
  executeApprove: () => Promise<void>;
  handleUpdate: () => Promise<void>;
  handleCancel: () => Promise<void>;
  executeCancel: () => Promise<void>;
  handleCleanup: () => Promise<void>;
  executeCleanup: () => Promise<void>;
  handleCopyEmail: () => void;
  formatDate: (val: number | undefined) => string;
}
