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

  // openUserProfile is not needed here

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

  // すべての願いは1000 Lm固定。DBに cost フィールドが存在する場合はそれを尊重する（メイン：wish.costが常に書き込まれる）。
  const initialCost = wish.cost ?? FIXED_WISH_COST;

  const displayValue = useMemo(() => {
    const elapsedSec = ((globalNow - wish.created_at) / 1000) | 0;
    const decayedMilli = calculateDecayedValue(toMilli(initialCost), elapsedSec);
    return fromMilli(decayedMilli);
  }, [globalNow, initialCost, wish.created_at]);

  const isExpired =
    initialCost > 0 &&
    displayValue <= 0 &&
    (wish.status === "open" || wish.status === "in_progress" || wish.status === "review_pending");

  const applicants = wish.applicants || [];
  const hasApplied = applicants.some((a: { id: string }) => a.id === currentUserId);

  const isRequesterInterrupted = wish.status === "interrupted" && wish.cancel_reason === "account_deleted";
  const isHelperInterrupted = wish.status === "interrupted" && wish.cancel_reason === "helper_deleted";

  const isMasked =
    (!!wish.isAnonymous &&
      (wish.status === "open" || (!wish.helper_id && ["cancelled", "expired"].includes(wish.status)))) ||
    isRequesterInterrupted;

  const isHelperMasked = isHelperInterrupted;

  const handleApply = async () => {
    if (!isProfileComplete(myProfile)) {
      if (confirm("プロフィールの器を構成すると、信頼の輪が広がりやすくなります（想いがかなう機会が増えます）。\n\nプロフィールを編集しますか？")) {
        if (onOpenProfile) onOpenProfile();
        return;
      }
    }

    if (!confirm(wish.isAnonymous ? "これは「匿名の願い」です。決定されるまで、あなたも匿名として扱われます。\n\n立候補しますか？" : "この依頼に立候補しますか？")) return;
    
    setIsLoading(true);
    const success = await applyForWish(wish.id);
    setIsLoading(false);
    
    if (success) {
      showToast("応える意思を伝えました", "success");
      window.dispatchEvent(new Event("goyen-celebration"));
      import('../../../utils/pwaEvent').then(({ globalTriggerPWAInstall }) => {
        globalTriggerPWAInstall();
      });
      if (onActionComplete) onActionComplete("applied");
    } else {
      showToast("立候補に失敗しました。時間をおいて再度お試しください。", "error");
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
      showToast("願いを託しました", "success");
      import('../../../utils/pwaEvent').then(({ globalTriggerPWAInstall }) => {
        globalTriggerPWAInstall();
      });
      setShowApplicants(false);
      setApprovalTarget(null);
      if (onActionComplete) onActionComplete("approved");
    } else {
      showToast("承認に失敗しました。通信状態を確認してください。", "error");
    }
  };

  const handleUpdate = async () => {
    if (!editContent.trim()) return;
    setIsLoading(true);
    const success = await updateWish(wish.id, { content: editContent });
    if (success) {
      setIsEditing(false);
      showToast("更新しました", "success");
    } else {
      showToast("更新に失敗しました", "error");
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
      showToast(
        confirmAction === "resign"
          ? "辞退しました"
          : confirmAction === "compensate" ? "誠実のしるしを渡して取り下げました" : "取り下げました",
        "success"
      );
      if (onActionComplete) onActionComplete(actionType);
    } else {
      showToast("不具合により取り下げに失敗しました。時間をおいて再度お試しください。", "error");
    }
    
    // コンポーネントがアンマウントされない場合（非物理削除時等）に備え、状態をリセットする
    setIsLoading(false);
    setConfirmAction(null);
  };

  const handleCleanup = async () => {
    if (!confirm("この記録を整理して「過去の記録」へ移動しますか？")) return;
    setIsLoading(true);
    const success = await expireWish(wish.id);
    setIsLoading(false);
    if (success) {
      showToast("記録を整理しました", "success");
      if (onActionComplete) onActionComplete("cleanup");
    } else {
      showToast("整理に失敗しました", "error");
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
      showToast("メールアドレスをコピーしました", "success");
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
      handleApply,
      handleApprove,
      executeApprove,
      handleUpdate,
      handleCancel,
      executeCancel,
      handleCleanup,
      handleCopyEmail,
      formatDate,
    }
  };
}
