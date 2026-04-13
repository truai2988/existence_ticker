import { useState, useMemo } from "react";
import { useWishActions } from "../../../hooks/useWishActions";
import { getTrustRank, calculateDecayedValue, toMilli, fromMilli } from "../../../logic/worldPhysics";
import { useOtherProfile } from "../../../hooks/useOtherProfile";
import { useProfile } from "../../../hooks/useProfile";
import { useWallet } from "../../../hooks/useWallet";
import { isProfileComplete } from "../../../utils/profileCompleteness";
import { useToast } from "../../../hooks/useToast";
import { WishCardProps, WishCardState, WishCardHandlers } from "../types";
import { FIXED_WISH_COST } from "../../../constants";
import { MESSAGES } from "../../../constants/messages";

export function useWishCard(props: WishCardProps): { state: WishCardState; handlers: WishCardHandlers } {
  const {
    wish,
    currentUserId,
    viewType = "radiance",
    onOpenProfile,
    onActionComplete,
    isReadOnly = false,
    onTabChange,
  } = props;

  const {
    applyForWish,
    approveWish,
    cancelWish,
    updateWish,
    resignWish,
    expireWish,
  } = useWishActions();

  const { profile: requesterProfile } = useOtherProfile(wish.requester_id);
  const { profile: helperProfile } = useOtherProfile(wish.helper_id || null);
  const { profile: myProfile } = useProfile();
  const { globalNow } = useWallet();
  const { showToast } = useToast();

  const isMyWish = wish.requester_id === currentUserId;

  const [isLoading, setIsLoading] = useState(false);
  const [showApplicants, setShowApplicants] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(wish.content);
  const [confirmAction, setConfirmAction] = useState<"delete" | "compensate" | "resign" | null>(null);
  const [approvalTarget, setApprovalTarget] = useState<{ id: string; name: string } | null>(null);
  const [contactNote, setContactNote] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  // 【課題3対応】confirm() 代替カスタムモーダル用状態
  const [showApplyConfirm, setShowApplyConfirm] = useState(false);
  const [applyConfirmIsAnonymous, setApplyConfirmIsAnonymous] = useState(false);
  const [showCleanupConfirm, setShowCleanupConfirm] = useState(false);

  const initialCost = wish.cost ?? FIXED_WISH_COST;

  const displayValue = useMemo(() => {
    const elapsedSec = ((globalNow - wish.created_at) / 1000) | 0;
    const decayedMilli = calculateDecayedValue(toMilli(initialCost), elapsedSec);
    return fromMilli(decayedMilli);
  }, [globalNow, initialCost, wish.created_at]);

  const isExpired =
    initialCost > 0 &&
    displayValue <= 0 &&
    (wish.status === "open" || wish.status === "in_progress");

  const applicants = wish.applicants || [];
  const hasApplied = applicants.some((a: { id: string }) => a.id === currentUserId);

  const isRequesterInterrupted = wish.status === "interrupted" && wish.cancel_reason === "account_deleted";
  const isHelperInterrupted = wish.status === "interrupted" && wish.cancel_reason === "helper_deleted";

  const isMasked =
    (!!wish.isAnonymous &&
      (wish.status === "open" || (!wish.helper_id && ["cancelled", "expired"].includes(wish.status)))) ||
    isRequesterInterrupted;

  const isHelperMasked = isHelperInterrupted;

  // 【課題2対応】Tailwindクラス名ではなく data-wish-id 属性で要素を特定し、
  // 最近傍の [data-scroll-container] を上にたどってスクロールさせる（堅牢な実装）
  const focusCard = () => {
    setTimeout(() => {
      const target = document.querySelector(`[data-wish-id="${wish.id}"]`);
      if (target) {
        const container = target.closest('[data-scroll-container]');
        if (container) {
          const targetRect = target.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          const offset = targetRect.top - containerRect.top + container.scrollTop - 120;
          container.scrollTo({ top: offset, behavior: 'smooth' });
        } else {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }, 100);
  };

  // 【課題3対応】立候補ボタン押下 → プロフィール未完の場合はプロフィール画面へ誘導、
  // その後カスタムモーダルを開く（confirm()を完全排除）
  const handleApply = async () => {
    if (!isProfileComplete(myProfile)) {
      showToast(MESSAGES.WISH_CARD.TOAST_INCOMPLETE_PROFILE, "error");
      if (onOpenProfile) {
        onOpenProfile();
        return;
      }
    }
    setApplyConfirmIsAnonymous(!!wish.isAnonymous);
    setShowApplyConfirm(true);
  };

  // カスタムモーダルで「手を挙げる」ボタンが押されたときに実際に立候補処理を行う
  const executeApply = async () => {
    setShowApplyConfirm(false);
    setIsLoading(true);
    const success = await applyForWish(wish.id);
    setIsLoading(false);

    if (success) {
      focusCard();
      setTimeout(() => {
        showToast(MESSAGES.WISH_CARD.TOAST_APPLY_SUCCESS, "success");
      }, onActionComplete ? 500 : 0);
      window.dispatchEvent(new Event("goyen-celebration"));
      if (onActionComplete) onActionComplete("applied");
    } else {
      showToast(MESSAGES.WISH_CARD.TOAST_APPLY_ERROR, "error");
    }
  };

  const handleApprove = (applicantId: string, name: string) => {
    setApprovalTarget({ id: applicantId, name });
    setContactNote("");
    setShowApplicants(false);
  };

  const executeApprove = async () => {
    if (!approvalTarget) return;
    setIsLoading(true);
    const success = await approveWish(wish.id, approvalTarget.id, contactNote);
    setIsLoading(false);

    if (success) {
      focusCard();
      setTimeout(() => {
        showToast(MESSAGES.WISH_CARD.TOAST_APPROVE_SUCCESS, "success");
      }, onActionComplete ? 500 : 0);
      setShowApplicants(false);
      setApprovalTarget(null);
      if (onActionComplete) onActionComplete("approved");
    } else {
      showToast(MESSAGES.WISH_CARD.TOAST_APPROVE_ERROR, "error");
    }
  };

  const handleUpdate = async () => {
    if (!editContent.trim()) return;
    setIsLoading(true);
    const success = await updateWish(wish.id, { content: editContent });
    if (success) {
      focusCard();
      setIsEditing(false);
      showToast(MESSAGES.WISH_CARD.TOAST_UPDATE_SUCCESS, "success");
    } else {
      showToast(MESSAGES.WISH_CARD.TOAST_UPDATE_ERROR, "error");
    }
    setIsLoading(false);
  };

  const handleCancel = async () => {
    if (!isMyWish && wish.helper_id === currentUserId) {
      setConfirmAction("resign");
      return;
    }
    if (wish.status === "open") {
      setConfirmAction("delete");
    } else if (wish.status === "in_progress") {
      setConfirmAction("compensate");
    }
  };

  const executeCancel = async () => {
    if (!confirmAction) return;

    setIsLoading(true);
    let success = false;
    let actionType: "cancelled" | "resigned" = "cancelled";

    if (confirmAction === "resign") {
      success = await resignWish(wish.id);
      actionType = "resigned";
    } else {
      success = await cancelWish(wish.id);
    }

    if (success) {
      const toastKey =
        confirmAction === "resign" ? "TOAST_CANCEL_SUCCESS_RESIGN" :
        confirmAction === "compensate" ? "TOAST_CANCEL_SUCCESS_COMPENSATE" :
        "TOAST_CANCEL_SUCCESS_DELETE";
      setTimeout(() => {
        showToast(MESSAGES.WISH_CARD[toastKey], "success");
      }, onActionComplete ? 500 : 0);
      if (onActionComplete) onActionComplete(actionType);
    } else {
      showToast(MESSAGES.WISH_CARD.TOAST_CANCEL_ERROR, "error");
    }

    setIsLoading(false);
    setConfirmAction(null);
  };

  // 【課題3対応】整理ボタン → confirm()ではなくカスタムモーダルで確認
  const handleCleanup = async () => {
    setShowCleanupConfirm(true);
  };

  const executeCleanup = async () => {
    setShowCleanupConfirm(false);
    setIsLoading(true);
    const success = await expireWish(wish.id);
    setIsLoading(false);
    if (success) {
      setTimeout(() => {
        showToast(MESSAGES.WISH_CARD.TOAST_CLEANUP_SUCCESS, "success");
      }, onActionComplete ? 500 : 0);
      if (onActionComplete) onActionComplete("cleanup");
    } else {
      showToast(MESSAGES.WISH_CARD.TOAST_CLEANUP_ERROR, "error");
    }
  };

  const formatDate = (val: number | undefined) => {
    if (!val) return "今";
    const date = new Date(val);
    if (isNaN(date.getTime())) return "不明";
    return date.toLocaleString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" });
  };

  const trust = getTrustRank(requesterProfile, wish.requester_trust_score);
  const displayRequesterName = requesterProfile?.name || wish.requester_name || wish.requester_id.slice(0, 8);
  const contactEmailTmp = (isMyWish && wish.helper_contact_email) || (!isMyWish && wish.requester_contact_email);
  const contactEmail = contactEmailTmp || undefined;
  const opponentName = isMyWish
    ? helperProfile?.name || wish.helper_name || "隣人"
    : requesterProfile?.name || wish.requester_name || "依頼者";

  const handleCopyEmail = () => {
    if (contactEmail) {
      navigator.clipboard.writeText(contactEmail);
      setIsCopied(true);
      showToast(MESSAGES.WISH_CARD.TOAST_EMAIL_COPIED, "success");
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const mailSubject = `[Existence Ticker] ${wish.content.length > 20 ? wish.content.slice(0, 20) + "..." : wish.content} について`;
  const mailBody = `${opponentName} 様\n\n`;
  const mailtoLink = contactEmail
    ? `mailto:${contactEmail}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`
    : "#";

  return {
    state: {
      wish,
      currentUserId,
      viewType,
      isReadOnly,
      onOpenProfile,
      onActionComplete,
      onTabChange,
      isMyWish,
      isLoading,
      showApplicants,
      isEditing,
      editContent,
      confirmAction,
      approvalTarget,
      contactNote,
      isCopied,
      showCompleteModal,
      showApplyConfirm,
      applyConfirmIsAnonymous,
      showCleanupConfirm,
      initialCost,
      displayValue,
      isExpired,
      hasApplied,
      isMasked,
      isHelperMasked,
      requesterProfile,
      helperProfile,
      myProfile,
      trust,
      displayRequesterName,
      contactEmail,
      opponentName,
      mailSubject,
      mailBody,
      mailtoLink,
    },
    handlers: {
      setIsLoading,
      setShowApplicants,
      setIsEditing,
      setEditContent,
      setConfirmAction,
      setApprovalTarget,
      setContactNote,
      setIsCopied,
      setShowCompleteModal,
      setShowApplyConfirm,
      setShowCleanupConfirm,
      executeApply,
      handleApply,
      handleApprove,
      executeApprove,
      handleUpdate,
      handleCancel,
      executeCancel,
      handleCleanup,
      executeCleanup,
      handleCopyEmail,
      formatDate,
    }
  };
}
