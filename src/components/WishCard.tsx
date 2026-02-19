import {
  Handshake,
  Loader2,
  Clock,
  User,
  CheckCircle,
  Hourglass,
  Megaphone,
  X,
  ShieldCheck,
  Pencil,
  Trash2,
  AlertTriangle,
  Archive,
  Copy,
  Check,
  Mail,
  Heart,
  Infinity,
} from "lucide-react";

import React, { useState } from "react";
import { Wish } from "../types";
import {
  calculateDecayedValue,
  calculateHistoricalValue,
  toMilli,
  fromMilli
} from "../logic/worldPhysics";
import { useWishActions } from "../hooks/useWishActions";
import { useUserView } from "../contexts/UserViewContext";
import { getTrustRank } from "../logic/worldPhysics";
import { useOtherProfile } from "../hooks/useOtherProfile";
import { useProfile } from "../hooks/useProfile";
import { useWallet } from "../hooks/useWallet";
import { isProfileComplete } from "../utils/profileCompleteness";
import { useToast } from "../contexts/ToastContext";
import { useWishesContext } from "../contexts/WishesContext";
import { CompleteWishModal } from "./CompleteWishModal";
import { UNIT_LABEL } from "../constants";

// Internal Component: Individual Applicant Row with Real-time Data
const ApplicantItem: React.FC<{
  applicant: { id: string; name: string; trust_score?: number };
  onApprove: (id: string, name: string) => void;
  onOpenProfile: (id: string) => void;
  isActionLoading: boolean;
  isMasked?: boolean;
}> = ({ applicant, onApprove, onOpenProfile, isActionLoading, isMasked }) => {
  const { profile } = useOtherProfile(applicant.id);

  // Use fresh data if available, otherwise snapshot
  // MASKING LOGIC
  const displayName = isMasked ? "匿名" : profile?.name || applicant.name;
  const avatarUrl = isMasked ? null : profile?.avatarUrl;
  const trustScore = applicant.trust_score || 0;
  const rank = getTrustRank(profile, trustScore);

  const genderLabel =
    profile?.gender && profile.gender !== "other"
      ? profile.gender === "male"
        ? "男性"
        : "女性"
      : "";

  const metadata = isMasked
    ? profile?.location
      ? `(${profile.location.prefecture} ${profile.location.city}) ${genderLabel}`
      : genderLabel
    : profile?.age_group
      ? `${profile.age_group}${genderLabel ? ` / ${genderLabel}` : ""}`
      : genderLabel;

  return (
    <div className="flex flex-col gap-3 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-center gap-3">
        {/* Avatar with fallback */}
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center border shrink-0 overflow-hidden ${isMasked ? "bg-slate-200 border-slate-300" : "bg-slate-100 border-slate-200"}`}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-lg font-bold text-slate-400">
              {isMasked ? (
                <User className="w-5 h-5 text-slate-400" />
              ) : (
                displayName?.charAt(0).toUpperCase() || (
                  <User className="w-5 h-5 text-slate-300" />
                )
              )}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <button
            onClick={() => !isMasked && onOpenProfile(applicant.id)}
            disabled={isMasked}
            className={`text-base font-bold text-left truncate w-full block transition-colors font-sans ${isMasked ? "text-slate-500 cursor-default" : "text-slate-800 hover:text-blue-600 hover:underline"}`}
          >
            {displayName}
            {metadata && (
              <span className="ml-1.5 text-xs font-normal text-slate-400 opacity-80 whitespace-nowrap font-sans">
                {metadata}
              </span>
            )}
          </button>
          <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
            {/* Trust/Helped Count Badge */}
            <div
              title={`${trustScore} times helped`}
              className={`flex items-center gap-0.5 ${rank.color}`}
            >
              {rank.icon}
              <span className="font-sans font-bold">({trustScore})</span>
            </div>

            {/* Rank Label */}
            <>
              <span className="text-slate-300">|</span>
              <span className="text-slate-600 font-bold">{rank.label}</span>
            </>
          </div>
        </div>
      </div>

      <button
        onClick={() => onApprove(applicant.id, displayName)}
        disabled={isActionLoading}
        className="w-full py-2.5 bg-slate-900 text-white text-xs rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 shadow-sm transition-all flex items-center justify-center gap-2 group-hover:scale-[1.02] active:scale-[0.98] font-sans"
      >
        {isActionLoading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <CheckCircle className="w-3 h-3" />
        )}
        <span>この人にお願いする</span>
      </button>
    </div>
  );
};

interface WishCardProps {
  wish: Wish;
  currentUserId: string;
  viewType?: "radiance" | "flow"; // 'radiance' for my view, 'flow' for public board
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
  onTabChange?: (tab: "give" | "flow" | "history") => void;
}

export const WishCard: React.FC<WishCardProps> = ({
  wish,
  currentUserId,
  viewType = "radiance",
  onOpenProfile,
  onActionComplete,
  isReadOnly = false,
  onTabChange,
}) => {
  const {
    applyForWish,
    approveWish,
    fulfillWish,
    cancelWish,
    updateWish,
    resignWish,
    withdrawApplication,
    expireWish,
  } = useWishActions();
  const { removeOptimisticWish } = useWishesContext();
  const { openUserProfile } = useUserView();
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

  // Custom Confirmation State
  const [confirmAction, setConfirmAction] = useState<
    "delete" | "compensate" | "resign" | null
  >(null);

  // Approval Modal State
  const [approvalTarget, setApprovalTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [contactNote, setContactNote] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  
  // Mission 2: Complete Wish Modal State
  const [showCompleteModal, setShowCompleteModal] = useState(false);


  // Anti-Gravity: Universal Decay Logic (静的計算)
  // Derived initial cost
  const getInitialCost = (tier: string) => {
    switch (tier) {
      case "light":
        return 0; // Priceless
      case "medium":
        return 500;
      case "heavy":
        return 1000;
      default:
        return wish.cost || 0;
    }
  };
  const initialCost = wish.cost !== undefined ? wish.cost : getInitialCost(wish.gratitude_preset);

  // Determine Cycle Days (Creator's metabolism) - Abolished for decay logic but kept for UI meta if needed

  // Recalculate whenever globalNow changes (standardized stillness)
  const displayValue = React.useMemo(() => {
    const elapsedSec = ((globalNow - wish.created_at) / 1000) | 0;
    const decayedMilli = calculateDecayedValue(toMilli(initialCost), elapsedSec);
    return fromMilli(decayedMilli);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalNow, initialCost, wish.created_at]);

  // 期限切れ判定
  const isExpired =
    displayValue <= 0 &&
    (wish.status === "open" ||
      wish.status === "in_progress" ||
      wish.status === "review_pending");

  // const isMyWish = wish.requester_id === currentUserId; // Moved to top
  const applicants = wish.applicants || [];
  const hasApplied = applicants.some((a: { id: string }) => a.id === currentUserId);

  // MASKING LOGIC FOR REQUESTER
  // Hidden if anonymous AND (open OR (cancelled/expired without match))
  // OR IF INTERRUPTED (Scenario B: account deletion)
  const isRequesterInterrupted = wish.status === "interrupted" && wish.cancel_reason === "account_deleted";
  const isHelperInterrupted = wish.status === "interrupted" && wish.cancel_reason === "helper_deleted";

  const isMasked =
    (!!wish.isAnonymous &&
    (wish.status === "open" ||
      (!wish.helper_id && ["cancelled", "expired"].includes(wish.status)))) || 
    isRequesterInterrupted;
    
  const isHelperMasked = isHelperInterrupted;

  // Handlers
  const handleApply = async () => {
    if (!isProfileComplete(myProfile)) {
      if (
        confirm(
          "プロフィールの器を構成すると、信頼の輪が広がりやすくなります（想いがかなう機会が増えます）。\n\nプロフィールを編集しますか？",
        )
      ) {
        if (onOpenProfile) onOpenProfile();
        return;
      }
    }

    if (
      !confirm(
        wish.isAnonymous
          ? "これは「匿名の願い」です。決定されるまで、あなたも匿名として扱われます。\n\n立候補しますか？"
          : "この依頼に立候補しますか？",
      )
    )
      return;
    setIsLoading(true);
    const success = await applyForWish(wish.id);
    setIsLoading(false);
    if (success) {
      showToast("応える意思を伝えました", "success");

      if (onActionComplete) onActionComplete("applied");
    } else {
      showToast("立候補に失敗しました。時間をおいて再度お試しください。", "error");
    }
  };

  const handleApprove = (applicantId: string, name: string) => {
    setApprovalTarget({ id: applicantId, name });
    setContactNote(""); // Reset
    setShowApplicants(false);
  };

  const executeApprove = async () => {
    if (!approvalTarget) return;
    setIsLoading(true);
    const success = await approveWish(wish.id, approvalTarget.id, contactNote);
    setIsLoading(false);
    if (success) {
      showToast("願いを託しました", "success");
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
    const success = await updateWish(wish.id, editContent);
    if (success) {
      setIsEditing(false);
      showToast("更新しました", "success");
    } else {
      showToast("更新に失敗しました", "error");
    }
    setIsLoading(false);
  };

  // Trigger Modal
  const handleCancel = async () => {
    // Helper (Resignation)
    if (!isMyWish && wish.helper_id === currentUserId) {
      setConfirmAction("resign");
      return;
    }

    // Requester (Withdrawal / Compensation Cancel)
    if (wish.status === "open") {
      setConfirmAction("delete");
    } else if (wish.status === "in_progress") {
      setConfirmAction("compensate");
    }
  };

  // Execute Logic
  // Execute Logic
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

    setIsLoading(false);
    setConfirmAction(null);

    if (success) {
      showToast(
        confirmAction === "resign"
          ? "辞退しました"
          : confirmAction === "compensate"
            ? "誠実のしるしを渡して取り下げました"
            : "取り下げました",
        "success",
      );

      if (onActionComplete) onActionComplete(actionType);
    } else {
      showToast("不具合により取り下げに失敗しました。時間をおいて再度お試しください。", "error");
    }
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
    return date.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const trust = getTrustRank(requesterProfile, wish.requester_trust_score);

  const displayRequesterName =
    requesterProfile?.name ||
    wish.requester_name ||
    wish.requester_id.slice(0, 8);

  // Contact Logic
  const contactEmail =
    (isMyWish && wish.helper_contact_email) ||
    (!isMyWish && wish.requester_contact_email);
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

  // --- OPTIMISTIC RENDER (The Phantom) ---
  if (wish.isOptimistic) {
    if (wish.error) {
        return (
            <div className="relative bg-white border-2 border-red-200 rounded-2xl p-6 shadow-sm overflow-hidden animate-in fade-in duration-300">
                <div className="flex items-center gap-2 mb-4 text-red-600">
                    <AlertTriangle size={20} />
                    <span className="text-base font-bold font-sans">通信エラー: 願いが届きませんでした</span>
                </div>
                <p className="text-slate-600 text-base mb-6 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 font-sans">
                    {wish.content}
                </p>
                <div className="flex flex-col gap-3">
                    <p className="text-xs text-red-400 font-medium font-sans">理由: {wish.error}</p>
                    <button 
                        onClick={() => removeOptimisticWish(wish.id)}
                        className="w-full py-3 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                    >
                        <Trash2 size={14} />
                        この内容を消去する
                    </button>
                    <p className="text-xs text-slate-400 text-center font-sans">※このお願いのLm予約はすでに解除されています</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative bg-slate-50/50 border border-slate-200 rounded-2xl p-6 overflow-hidden animate-pulse">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-slate-200" />
                <div className="space-y-2 flex-1">
                    <div className="h-4 w-32 bg-slate-200 rounded" />
                    <div className="h-3 w-48 bg-slate-100 rounded" />
                </div>
            </div>
            <div className="space-y-3 mb-6">
                <div className="h-4 w-full bg-slate-100 rounded" />
                <div className="h-4 w-5/6 bg-slate-100 rounded" />
            </div>
            <div className="h-10 w-full bg-slate-200 rounded-xl" />
            <div className="absolute top-4 right-6 flex items-center gap-1.5 text-slate-300 text-xs font-bold uppercase tracking-widest font-sans">
                <Loader2 size={12} className="animate-spin" />
                伝搬中...
            </div>
        </div>
    );
  }

  return (
    <div className="relative bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow group overflow-hidden">
      {/* Role Badge - Perspective Indicator */}
      <div className="flex items-center gap-2 mb-3">
        {viewType === "radiance" ? (
          isMyWish ? (
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-600 border border-amber-100/50 uppercase tracking-tighter font-sans">
              [ 自分が願ったこと ]
            </span>
          ) : wish.helper_id === currentUserId ? (
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-100/50 uppercase tracking-tighter font-sans">
              [ あなたが応えていること ]
            </span>
          ) : null
        ) : (
          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-50 text-slate-400 border border-slate-100 uppercase tracking-tighter font-sans">
            [ 誰かの願い ]
          </span>
        )}
      </div>

      {/* Header: User & Meta & Badge */}
      <div className="relative flex justify-between items-start mb-2 gap-4">
        {/* User Info (Left) */}
        {/* User Info (Left) - Perspective Logic */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {isMyWish ? (
            // My Wish View
            wish.helper_id ? (
              // Show Helper Info + Timestamp
              <>
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 shrink-0 overflow-hidden">
                  {helperProfile?.avatarUrl ? (
                    <img
                      src={helperProfile.avatarUrl}
                      alt={helperProfile.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5 text-blue-300" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (wish.helper_id && !isHelperMasked)
                          openUserProfile(wish.helper_id, isMasked); 
                      }}
                      className={`text-base font-bold tracking-wide text-left transition-colors whitespace-nowrap font-sans ${isHelperMasked ? "text-slate-500 cursor-default" : "text-slate-800 hover:text-blue-600 hover:underline"}`}
                    >
                      {helperProfile?.name ||
                        wish.helper_name ||
                        wish.applicants?.find((a) => a.id === wish.helper_id)
                          ?.name ||
                        wish.helper_id?.slice(0, 8) ||
                        "隣人"}
                    </button>
                    <span className="text-xs uppercase font-bold text-slate-400 tracking-wider whitespace-nowrap font-sans">
                      {wish.status === "fulfilled" || wish.status === "completed" 
                        ? "さんに感謝を届けました" 
                        : wish.status === "interrupted"
                          ? "さんの事情により終了しました"
                          : wish.status === "cancelled" 
                            ? "さんとの願いを中断しました"
                            : "さんが応えてくれます"}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              // Open Status or Unmatched History
              <div className="min-w-0 flex-1 py-1">
                {["cancelled", "expired"].includes(wish.status) && (
                  <div className="flex items-center gap-2 opacity-50 mb-1">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
                      <User className="w-5 h-5 text-slate-300" />
                    </div>
                    <div className="text-xs text-slate-600 font-bold font-sans">
                      未成立
                    </div>
                  </div>
                )}
              </div>
            )
          ) : (
            // Others View (Show Requester - Existing Logic)
            <>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border shrink-0 overflow-hidden ${isMasked ? "bg-slate-200 border-slate-300" : "bg-slate-100 border-slate-200"}`}
              >
                {!isMasked && requesterProfile?.avatarUrl ? (
                  <img
                    src={requesterProfile.avatarUrl}
                    alt={requesterProfile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-bold text-slate-400">
                    {isMasked ? (
                      <User className="w-5 h-5 text-slate-400" />
                    ) : (
                      requesterProfile?.name?.charAt(0).toUpperCase() || (
                        <User className="w-5 h-5 text-slate-300" />
                      )
                    )}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isMasked) openUserProfile(wish.requester_id, isMasked);
                    }}
                    className={`block text-base font-bold tracking-wide text-left truncate max-w-full transition-colors font-sans ${isMasked ? "text-slate-500 cursor-default" : "text-slate-800 hover:underline"}`}
                  >
                    {isMyWish
                      ? "あなたの想い"
                      : viewType === "flow"
                        ? `${displayRequesterName} さんの願いに応える`
                        : `${displayRequesterName} さんの願ったこと`}
                  </button>
                  {/* Verified Badge */}
                  {trust.isVerified && (
                    <ShieldCheck
                      size={14}
                      className="text-blue-400 fill-blue-50 shrink-0"
                      strokeWidth={2.5}
                    />
                  )}
                  {/* Trust Stats */}
                  <div className="flex items-center gap-2 text-xs shrink-0">
                    <div
                      title={`Helped ${wish.requester_trust_score || 0} times`}
                      className={`flex items-center gap-0.5 ${trust.color}`}
                    >
                      {trust.icon}
                      <span className="font-sans font-medium">
                        ({wish.requester_trust_score || 0})
                      </span>
                    </div>
                    <span className="text-slate-300">|</span>
                    <span
                      title="過去に完了/支払いを行った回数"
                      className="text-slate-500 font-bold flex items-center gap-1"
                    >
                      <Megaphone className="w-3 h-3" />{" "}
                      <span className="font-bold">
                        依頼実績: {wish.requester_completed_requests || 0}
                      </span>
                    </span>
                  </div>
                </div>
                {/* Bio snippet - replaces headline - HIDE IF MASKED */}
                {!isMasked && requesterProfile?.bio && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed font-sans">
                    {requesterProfile.bio.length > 60
                      ? `${requesterProfile.bio.slice(0, 60)}...`
                      : requesterProfile.bio}
                  </p>
                )}
                <span className="flex items-center gap-1 text-xs text-slate-500 mt-0.5 font-sans">
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(wish.created_at)}</span>
                </span>
              </div>
            </>
          )}
        </div>

        {/* My Wish Badge & Actions (Right - Flex Item) */}
        {isMyWish && !isReadOnly && (
          <div className="flex items-center gap-2 shrink-0">
            {/* Edit/Delete Actions for Open Wishes - Only if NOT expired */}
            {!isExpired && wish.status === "open" && (
              <>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  disabled={isLoading}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                  title="編集 (内容のみ)"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  title="取り下げ (削除)"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
            {/* In Progress Cancel (Compensation) - Only if NOT expired */}
            {!isExpired && wish.status === "in_progress" && (
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                title="誠実のしるしを渡して中断"
              >
                <AlertTriangle size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Body: Content */}
      <div className="relative mb-3">
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none text-base resize-none min-h-[100px]"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(wish.content);
                }}
                className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg"
              >
                キャンセル
              </button>
              <button
                onClick={handleUpdate}
                disabled={isLoading || !editContent.trim()}
                className="px-3 py-1.5 text-xs font-bold text-white bg-blue-500 hover:bg-blue-600 rounded-lg shadow-sm disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  "更新する"
                )}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-slate-800 text-base leading-relaxed font-serif font-medium whitespace-pre-wrap tracking-wide">
            {wish.content}
          </p>
        )}

        {/* System Note - Gentle Explanation for Status Changes */}
        {wish.system_note && (
          <div className="mt-3 p-3 bg-amber-50/50 border border-amber-100 rounded-xl">
            <p className="text-xs text-amber-800 leading-relaxed font-bold font-sans">
              {wish.system_note}
            </p>
          </div>
        )}
      </div>

      {/* Value / Outcome Area */}
      <div className="relative mb-3 border-t border-slate-100 pt-2">
        {["fulfilled", "cancelled", "expired"].includes(wish.status) ||
        (wish.status === "open" && isExpired) ? (
          <div
            className={`p-4 rounded-xl border flex justify-between items-center ${
              wish.status === "fulfilled"
                ? initialCost === 0 
                  ? "bg-pink-50/30 border-pink-100/50" 
                  : "bg-green-50/50 border-green-100/50"
                : wish.status === "cancelled"
                  ? "bg-red-50/30 border-red-100/50" // Subtle Red for Cancelled
                  : wish.status === "interrupted"
                    ? "bg-slate-100/50 border-slate-200/50" // Neutral for Interrupted
                    : "bg-slate-50/50 border-slate-100/50" // Gray for Expired
            }`}
          >
            <div className="flex items-center gap-2">
              {wish.status === "fulfilled" ? (
                initialCost === 0 
                  ? <Heart size={16} className="text-pink-400" />
                  : <CheckCircle size={16} className="text-green-500" />
              ) : wish.status === "cancelled" ? (
                <X size={16} className="text-red-400" />
              ) : wish.status === "interrupted" ? (
                <X size={16} className="text-slate-400" />
              ) : (
                <Archive size={16} className="text-slate-400" />
              )}
              <span
                className={`text-xs font-bold font-sans ${
                  wish.status === "fulfilled"
                    ? initialCost === 0 ? "text-pink-600" : "text-green-700"
                    : wish.status === "cancelled"
                      ? "text-red-600"
                      : "text-slate-500"
                }`}
              >
                  {wish.status === "fulfilled"
                  ? initialCost === 0 ? "共鳴（Priceless）" : "届けられた感謝 (最終値)"
                  : wish.status === "interrupted"
                    ? "退会により終了"
                    : wish.status === "cancelled"
                    ? // Logic to determine Label
                      (() => {
                        const isRequester = wish.requester_id === currentUserId;
                        const isHelperCancellation =
                          wish.cancel_reason === "helper_cancellation";
                        const isCompensatory =
                          wish.cancel_reason === "compensatory_cancellation";

                        // Case 1: Helper Cancelled (Resignation)
                        if (isHelperCancellation) {
                          return isRequester
                            ? `相手が辞退したため、予約分が手元に戻りました`
                            : `私が辞退したため、願いから離れました`;
                        }
                        // Case 2: Requester Cancelled (Withdrawal with Compensation)
                        else if (isCompensatory) {
                          return isRequester
                            ? `私が中断したため、誠実のしるしをお渡ししました`
                            : `相手が中断したため、誠実のしるしを受け取りました`;
                        }
                        // Case 3: Simple Void (Open Cancel)
                        else {
                          return isRequester ? "取り下げ済み" : "中断済み";
                        }
                      })()
                    : "期限により自然消滅"}
              </span>
            </div>
            <div className="text-lg font-bold font-mono text-slate-900 tracking-tight">
              {wish.status === "fulfilled" ? (
                initialCost === 0 ? (
                  <span className="text-pink-500 font-bold tracking-widest">∞ Gift</span>
                ) : (
                  <>
                    {Math.floor(wish.val_at_fulfillment || 0).toLocaleString()}{" "}
                    <span className="text-xs text-slate-400 ml-0.5">Lm</span>
                  </>
                )
              ) : wish.status === "cancelled" ? (
                wish.cancel_reason === "compensatory_cancellation" ||
                wish.cancel_reason === "helper_cancellation" ||
                wish.val_at_fulfillment ? (
                  // Apology Transaction Case using generic wording
                  <div className="flex flex-col items-end">
                    <span className="text-base text-red-500">
                      {wish.val_at_fulfillment !== undefined
                        ? Math.floor(wish.val_at_fulfillment).toLocaleString()
                        : Math.floor(
                            calculateHistoricalValue(
                              wish.cost || 0,
                              wish.created_at || 0,
                              wish.cancelled_at || 0,
                            ),
                          ).toLocaleString()}
                      <span className="text-xs ml-0.5 whitespace-nowrap">
                        Lm
                      </span>
                    </span>
                    <span className="text-xs text-red-300 font-bold uppercase tracking-wider">
                      {(() => {
                        const isRequester = wish.requester_id === currentUserId;
                        const isHelperCancellation =
                          wish.cancel_reason === "helper_cancellation";
                        return isHelperCancellation
                          ? isRequester
                            ? "受取済"
                            : "送付済"
                          : isRequester
                            ? "送付済"
                            : "受取済";
                      })()}
                    </span>
                  </div>
                ) : // Void Case
                null
              ) : // Expired Case
              null}
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-center bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
            <div>
              <div className="flex items-center gap-2 mb-1.5 opacity-80">
                <Hourglass
                  size={14}
                  className={isMyWish ? "text-amber-500" : "text-orange-400"}
                />
                <span
                  className={`text-xs font-bold ${isMyWish ? "text-amber-600" : "text-slate-500"}`}
                >
                  {isMyWish ? "お渡しする感謝" : "今わかちあえる感謝"}
                </span>
              </div>
              {displayValue > 0 && (
                <div className="text-xs text-red-400 font-semibold tracking-wide">
                  ※時間が経つと減っていきます
                </div>
              )}
            </div>
            <div className={`text-xl font-mono ${initialCost === 0 ? "text-pink-400" : "text-slate-800"} font-bold tracking-tight`}>
              {initialCost === 0 ? "∞" : Math.floor(displayValue).toLocaleString()}{" "}
              <span className={`text-sm font-normal ${initialCost === 0 ? "text-pink-300" : "text-slate-500"} ml-0.5`}>
                {initialCost === 0 ? "Gift" : UNIT_LABEL}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Contact Panel (For Active Participants) */}
      {wish.status === "in_progress" && !isReadOnly &&
        (isMyWish || wish.helper_id === currentUserId) && (
          <div className="relative mb-4 p-4 border border-slate-200 rounded-xl bg-slate-50/30">
            <div className="space-y-3 mt-1">
              {/* Email Section */}
              {/* Email Section with Copy & Mailto */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 mb-1">
                  <Megaphone size={14} className="text-slate-400" />
                  <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                    {isMyWish ? "相手の連絡先" : "依頼主の連絡先"}
                  </span>
                </div>
                {contactEmail ? (
                  <div className="bg-white border border-slate-200 rounded-lg p-3">
                    {/* Top Row: Address + Copy */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-sm font-mono font-bold text-slate-700 break-all select-all">
                        {contactEmail}
                      </span>
                      <button
                        onClick={handleCopyEmail}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-md transition-colors shrink-0"
                        title="アドレスをコピー"
                      >
                        {isCopied ? (
                          <Check size={16} className="text-green-500" />
                        ) : (
                          <Copy size={16} />
                        )}
                      </button>
                    </div>

                    {/* Bottom Row: Mailto Action */}
                    <a
                      href={mailtoLink}
                      className="flex items-center justify-center gap-2 w-full py-2 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-md transition-colors group"
                    >
                      <Mail
                        size={14}
                        className="text-slate-400 group-hover:text-slate-600"
                      />
                      メールを作成する
                    </a>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic">
                    連絡先は設定されていません
                  </span>
                )}
              </div>

              {/* Note Section (Only if note exists) */}
              {wish.contact_note && (
                <div className="flex flex-col gap-1 pt-2 border-t border-slate-100">
                  <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                    {isMyWish ? `${requesterProfile?.name || '自分'}さんのメモ` : "依頼者さんより"}
                  </span>
                  <p className="text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-100 whitespace-pre-wrap">
                    {wish.contact_note}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

      {/* Footer: Action Area */}
      <div className="relative pt-4 border-t border-slate-100 min-h-[50px] flex items-center justify-between gap-4 flex-wrap">
        {/* Status Badge & Timestamp (Left) */}
        <div className="flex flex-col gap-1 items-start">
          <div className="">
            {wish.status === "in_progress" && (
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 whitespace-nowrap shrink-0">
                進行中
              </span>
            )}
            {wish.status === "cancelled" && (
              <span className={`text-xs font-bold px-3 py-1 rounded-full border whitespace-nowrap shrink-0 ${
                wish.cancel_reason === "helper_cancellation" || wish.cancel_reason === "compensatory_cancellation"
                  ? "text-red-600 bg-red-50 border-red-100"
                  : "text-slate-500 bg-slate-100 border-slate-200"
              }`}>
                {wish.cancel_reason === "helper_cancellation" || wish.cancel_reason === "compensatory_cancellation"
                  ? (wish.requester_id === currentUserId ? "お詫び受領" : "お詫び送付")
                  : "キャンセル済み"}
              </span>
            )}
            {wish.status === "review_pending" && (
              <span className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-100 animate-pulse whitespace-nowrap shrink-0">
                確認待ち
              </span>
            )}
            {(wish.status === "fulfilled" || wish.status === "completed") && (
              <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100 whitespace-nowrap shrink-0">
                感謝済み
              </span>
            )}
            {wish.status === "expired" && (
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 whitespace-nowrap shrink-0">
                整理済み（期限切れ）
              </span>
            )}
            {wish.status === "open" &&
              (isExpired ? (
                <span className="flex items-center gap-1 text-xs font-bold text-red-500 bg-red-50 px-3 py-1 rounded-full border border-red-100 whitespace-nowrap shrink-0">
                  <AlertTriangle size={12} />
                  期限切れ
                </span>
              ) : (
                <span className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-200 whitespace-nowrap shrink-0">
                  募集中
                </span>
              ))}
          </div>

          {/* Timestamp for My Wish (Moved to Footer) */}
          {isMyWish && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 ml-1">
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatDate(wish.created_at)}</span>
              </span>
              {wish.isAnonymous && (
                <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-100 uppercase tracking-tight">
                  匿名
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons (Right) */}
        <div className="flex justify-end">
          {/* 1. Case: Requester View (My Wish) */}
          {isMyWish && (
            <>
              {wish.status === "open" && !isExpired && (
                <div>
                  {applicants.length === 0 ? null : (
                    <div className="relative">
                      <button
                        onClick={() => setShowApplicants(!showApplicants)}
                        className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-white rounded-full text-xs font-bold shadow-md shadow-yellow-200 hover:bg-yellow-500 transition-all active:scale-95"
                      >
                        <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                        {applicants.length}人が手を挙げています
                      </button>

                      {showApplicants && (
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                          {/* Backdrop */}
                          <div
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity"
                            onClick={() => setShowApplicants(false)}
                          />

                          {/* Modal Content */}
                          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[70vh] animate-in fade-in zoom-in-95 duration-200">
                            {/* Modal Header */}
                            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-yellow-100 rounded-full">
                                  <Handshake className="w-4 h-4 text-yellow-600" />
                                </div>
                                <h4 className="text-sm font-bold text-slate-700">
                                  手伝ってくれる人々{" "}
                                  <span className="text-slate-400 font-normal ml-1">
                                    ({applicants.length})
                                  </span>
                                </h4>
                              </div>
                              <button
                                onClick={() => setShowApplicants(false)}
                                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                                title="Close"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>

                            {/* Scrollable List */}
                            <div className="overflow-y-auto p-4 space-y-3 custom-scrollbar">
                              {applicants.length === 0 ? (
                                <div className="py-8 text-center text-slate-400 text-sm">
                                  まだ申し出はありません
                                </div>
                              ) : (
                                applicants.map((app: { id: string; name: string; trust_score?: number }) => (
                                  <ApplicantItem
                                    key={app.id}
                                    applicant={app}
                                    onApprove={handleApprove}
                                    onOpenProfile={openUserProfile}
                                    isActionLoading={isLoading}
                                    isMasked={isMasked}
                                  />
                                ))
                              )}
                            </div>

                            {/* Footer Note */}
                            <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                              <p className="text-xs text-slate-400">
                                お願いする人を一人選んでください
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {!isExpired && !isReadOnly &&
                (wish.status === "review_pending" ||
                  wish.status === "in_progress") && (
                  <div className="flex flex-col items-end gap-2">
                    <p className="text-xs font-bold text-slate-700">
                      実費（材料費など）の清算が済んでいることを確認し、感謝の Lm を贈ります。
                    </p>
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            "本当にお礼をしてよろしいですか？Lumenが送られます。",
                          )
                        ) {
                          if (wish.helper_id) {
                            const run = async () => {
                              setIsLoading(true);
                              const success = await fulfillWish(
                                wish.id,
                                wish.helper_id!,
                              );
                              if (success) {
                                showToast("感謝を届けました", "success");
                                // 完了後は「履歴」タブへ
                                if (onTabChange) onTabChange("history");
                              }
                              setIsLoading(false);
                            };
                            run();
                          }
                        }
                      }}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold shadow-lg shadow-pink-200 hover:scale-105 active:scale-95 transition-all"
                  >
                    <Handshake className="w-4 h-4 text-white" />
                    <span>お礼をする (完了)</span>
                  </button>
                </div>
              )}

              {/* Redundant expired display removed as requested */}
            </>
          )}

          {/* 2. Case: Helper View (Applying/Working) */}
          {!isMyWish && !isExpired && !isReadOnly && (
            <>
              {wish.status === "open" && (
                <div>
                  {hasApplied ? (
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-500 rounded-full text-xs font-bold border border-slate-200 whitespace-nowrap shrink-0">
                        <Clock size={14} />
                        返事を待っています
                      </span>
                      <button
                        onClick={async () => {
                          if (confirm("本当に立候補を取り消しますか？")) {
                            setIsLoading(true);
                            const success = await withdrawApplication(wish.id);
                            setIsLoading(false);
                            if (success) {
                              showToast("とりやめました", "success");

                              if (onActionComplete)
                                onActionComplete("withdrawn");
                            }
                          }
                        }}
                        disabled={isLoading}
                        className="px-3 py-1.5 text-xs font-bold text-slate-400 border border-slate-200 rounded-full hover:bg-slate-50 hover:text-slate-600 hover:border-slate-300 transition-all"
                      >
                        取り消す
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleApply}
                      disabled={isLoading || displayValue === 0}
                      className="
                                flex items-center gap-2 px-6 py-2.5 rounded-full 
                                bg-amber-100 text-amber-700 border border-amber-200
                                hover:bg-amber-500 hover:text-white hover:border-amber-500
                                text-sm font-bold transition-all shadow-sm hover:shadow-md
                                active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                                "
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Handshake className="w-4 h-4" />
                      )}
                      <span>応える</span>
                    </button>
                  )}
                </div>
              )}

              {/* Helper Views: In Progress (Status Only - No Report Button) */}
              {(wish.status === "in_progress" ||
                wish.status === "review_pending") && !isReadOnly &&
                wish.helper_id === currentUserId && (
                  <div className="flex items-center gap-3">
                    {/* Helper Resignation */}
                    <button
                      onClick={handleCancel}
                      disabled={isLoading}
                      className="text-slate-400 hover:text-red-500 text-xs font-bold transition-all underline decoration-slate-200 hover:decoration-red-200 underline-offset-4"
                    >
                      辞退する
                    </button>
                  </div>
                )}
            </>
          )}

          {/* 2b. Case: Expired Passive Message (Non-Requester) */}

          {/* 3. Cleanup Action for 0 Lm (My Wish) */}
          {isMyWish && isExpired && !isReadOnly && (
            <button
              onClick={handleCleanup}
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all active:scale-[0.98] shadow-md shadow-slate-200 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Archive size={14} />
              )}
              <span>この記録を整理する</span>
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Overlay (Fixed) */}
      {confirmAction && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`p-3 rounded-full mb-4 ${
                confirmAction === "compensate"
                  ? "bg-red-100 text-red-600"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              <AlertTriangle size={24} />
            </div>

            <h4 className="text-base font-bold text-slate-800 mb-2 text-center">
              {confirmAction === "compensate"
                ? "この願いを取り下げますか？"
                : confirmAction === "resign"
                  ? "このお手伝いを辞退しますか？"
                  : "このお願いを取り下げますか？"}
            </h4>

            <p className="text-xs text-slate-600 text-center mb-6 leading-relaxed whitespace-pre-wrap">
              {confirmAction === "compensate" ? (
                <>
                  今キャンセルする場合、予約していたLmは
                  <br />
                  <strong className="text-red-500">
                    『時間の補償』として全額相手に支払われます。
                  </strong>
                </>
              ) : confirmAction === "resign" ? (
                "これまでの経緯は白紙に戻ります。"
              ) : (
                "予約していたLmは、再び自由に使えるようになります。"
              )}
            </p>

            <div className="flex flex-col gap-2 w-full">
              <button
                onClick={executeCancel}
                disabled={isLoading}
                className={`w-full py-3 rounded-xl text-sm font-bold text-white shadow-md transition-all active:scale-[0.98] ${
                  confirmAction === "compensate"
                    ? "bg-red-500 hover:bg-red-600 shadow-red-200"
                    : "bg-slate-700 hover:bg-slate-800 shadow-slate-200"
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : confirmAction === "compensate" ? (
                  "補償してキャンセルする"
                ) : confirmAction === "resign" ? (
                  "辞退する"
                ) : (
                  "取り下げる"
                )}
              </button>
              <button
                onClick={() => setConfirmAction(null)}
                disabled={isLoading}
                className="w-full py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-colors"
              >
                戻る
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal (Fixed) */}
      {approvalTarget && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-green-100 text-green-600 p-3 rounded-full mb-4">
              <Handshake size={24} />
            </div>

            <h4 className="text-base font-bold text-slate-800 mb-1 text-center">
              {approvalTarget.name}さんにお願いしますか？
            </h4>
            <p className="text-xs text-slate-500 mb-6 text-center">
              承認時に相手へのメッセージ（連絡事項など）を送れます。
            </p>

            <textarea
              value={contactNote}
              onChange={(e) => setContactNote(e.target.value)}
              placeholder="例: よろしくお願いします。詳細はメールでご連絡します。"
              className="w-full p-3 border border-slate-200 rounded-xl mb-4 text-sm focus:ring-2 focus:ring-green-100 focus:border-green-400 outline-none resize-none min-h-[80px]"
            />

            <div className="flex flex-col gap-2 w-full">
              <button
                onClick={executeApprove}
                disabled={isLoading}
                className="w-full py-3 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all active:scale-[0.98]"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  "承認して開始する"
                )}
              </button>
              <button
                onClick={() => {
                  setApprovalTarget(null);
                  setContactNote("");
                }}
                disabled={isLoading}
                className="w-full py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Mission 2: Complete Wish Modal Integration */}
      {showCompleteModal && (
        <CompleteWishModal
          wishTitle={wish.content}
          helperName={
            helperProfile?.name || wish.helper_name || "名無しのヘルパー"
          }
          preset={wish.gratitude_preset}
          cost={toMilli(initialCost)} // Pass full milli if needed, but Modal expects number. Let's verify modal props. 
          // Wait, Modal expects `cost: number` (display value). `initialCost` is likely currently number (e.g. 100).
          // `wish.cost` is number. Let's pass `initialCost`.
          onConfirm={async () => {
              setShowCompleteModal(false);
              setIsLoading(true);
              const success = await fulfillWish(wish.id, currentUserId); // Text message is removed as per user request
              setIsLoading(false);
              if (success) {
                  showToast("感謝を届けました", "success");
                  if (onActionComplete) onActionComplete("completed");
              } else {
                  showToast("完了報告に失敗しました", "error");
              }
          }}
          onCancel={() => setShowCompleteModal(false)}
        />
      )}
    </div>
  );
};
