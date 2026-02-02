import React, { useState } from "react";
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
} from "lucide-react";
import { Wish } from "../types";
import { calculateDecayedValue, calculateHistoricalValue } from "../logic/worldPhysics";
import { useWishActions } from "../hooks/useWishActions";
import { useUserView } from "../contexts/UserViewContext";
import { getTrustRank } from "../logic/worldPhysics";
import { useOtherProfile } from "../hooks/useOtherProfile";
import { useProfile } from "../hooks/useProfile";
import { isProfileComplete } from "../utils/profileCompleteness";
import { useToast } from "../contexts/ToastContext";
import { useWishesContext } from "../contexts/WishesContext";

// Internal Component: Individual Applicant Row with Real-time Data
const ApplicantItem: React.FC<{
  applicant: { id: string; name: string; trust_score?: number };
  onApprove: (id: string, name: string) => void;
  onOpenProfile: (id: string) => void;
  isActionLoading: boolean;
}> = ({ applicant, onApprove, onOpenProfile, isActionLoading }) => {
  const { profile } = useOtherProfile(applicant.id);

  // Use fresh data if available, otherwise snapshot
  const displayName = profile?.name || applicant.name;
  const avatarUrl = profile?.avatarUrl;
  const trustScore = applicant.trust_score || 0;
  const rank = getTrustRank(profile, trustScore);

  return (
    <div className="flex flex-col gap-3 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-center gap-3">
        {/* Avatar with fallback */}
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0 overflow-hidden">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-lg font-bold text-slate-400">
              {displayName?.charAt(0).toUpperCase() || (
                <User className="w-5 h-5 text-slate-300" />
              )}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <button
            onClick={() => onOpenProfile(applicant.id)}
            className="text-sm font-bold text-slate-800 hover:text-blue-600 hover:underline text-left truncate w-full block"
          >
            {displayName}
          </button>
          <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
            {/* Trust/Helped Count Badge */}
            <div
              title={`${trustScore} times helped`}
              className={`flex items-center gap-0.5 ${rank.color}`}
            >
              {rank.icon}
              <span className="font-mono font-bold">({trustScore})</span>
            </div>

            {/* Rank Label */}
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 font-bold">{rank.label}</span>
          </div>
        </div>
      </div>

      <button
        onClick={() => onApprove(applicant.id, displayName)}
        disabled={isActionLoading}
        className="w-full py-2.5 bg-slate-900 text-white text-xs rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 shadow-sm transition-all flex items-center justify-center gap-2 group-hover:scale-[1.02] active:scale-[0.98]"
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
  onOpenProfile?: () => void;
}

export const WishCard: React.FC<WishCardProps> = ({
  wish,
  currentUserId,
  onOpenProfile,
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
  const { openUserProfile } = useUserView();
  const { profile: requesterProfile } = useOtherProfile(wish.requester_id);
  const { profile: helperProfile } = useOtherProfile(wish.helper_id || null);
  const { profile: myProfile } = useProfile();
  const { showToast } = useToast();
  const { refresh } = useWishesContext();
  const [isLoading, setIsLoading] = useState(false);

  const [showApplicants, setShowApplicants] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(wish.content);

  // Custom Confirmation State
  const [confirmAction, setConfirmAction] = useState<
    "delete" | "compensate" | "resign" | null
  >(null);
  
  // Approval Modal State
  const [approvalTarget, setApprovalTarget] = useState<{id: string, name: string} | null>(null);
  const [contactNote, setContactNote] = useState("");

  // Anti-Gravity: Universal Decay Logic (静的計算)
  // Derived initial cost
  const getInitialCost = (tier: string) => {
    switch (tier) {
      case "light":
        return 100;
      case "medium":
        return 500;
      case "heavy":
        return 1000;
      default:
        return wish.cost || 0;
    }
  };
  const initialCost = wish.cost || getInitialCost(wish.gratitude_preset);

  // 静的な値を計算（Ticker廃止 - 1時間ごとに自動更新）
  const displayValue = calculateDecayedValue(initialCost, wish.created_at);

  // 期限切れ判定
  const isExpired =
    displayValue <= 0 &&
    (wish.status === "open" ||
      wish.status === "in_progress" ||
      wish.status === "review_pending");

  const isMyWish = wish.requester_id === currentUserId;
  const applicants = wish.applicants || [];
  const hasApplied = applicants.some((a) => a.id === currentUserId);

  // Handlers
  const handleApply = async () => {
    if (!isProfileComplete(myProfile)) {
      if (
        confirm(
          "プロフィールの器を完成させると、信頼されやすくなります（採用率が上がります）。\n\nプロフィールを編集しますか？",
        )
      ) {
        if (onOpenProfile) onOpenProfile();
        return;
      }
    }

    if (!confirm("この依頼に立候補しますか？")) return;
    setIsLoading(true);
    const success = await applyForWish(wish.id);
    setIsLoading(false);
    if (success) {
      showToast("立候補しました", "success");
      refresh();
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
        showToast("お願いしました", "success");
        setShowApplicants(false);
        setApprovalTarget(null);
        refresh(); // リストを更新
      }
  };

  const handleUpdate = async () => {
    if (!editContent.trim()) return;
    setIsLoading(true);
    const success = await updateWish(wish.id, editContent);
    if (success) {
      setIsEditing(false);
      showToast("更新しました", "success");
      refresh();
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
  const executeCancel = async () => {
    setIsLoading(true);
    try {
      let success = false;
      if (confirmAction === "resign") {
        success = await resignWish(wish.id);
        if (success) showToast("辞退しました", "success");
      } else {
        success = await cancelWish(wish.id);
        if (success)
          showToast(
            wish.status === "in_progress"
              ? "補償を支払ってキャンセルしました"
              : "キャンセルしました",
            "success",
          );
      }
      if (success) refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
      setConfirmAction(null);
    }
  };

  const handleCleanup = async () => {
    if (!confirm("この記録を整理して「過去の記録」へ移動しますか？")) return;
    setIsLoading(true);
    const success = await expireWish(wish.id);
    setIsLoading(false);
    if (success) {
      showToast("記録を整理しました", "success");
      refresh();
    }
  };

  const formatDate = (
    val: string | { toDate?: () => Date } | Date | undefined,
  ) => {
    if (!val) return "今";
    if (typeof val === "string") return new Date(val).toLocaleDateString();
    if ("toDate" in val && typeof val.toDate === "function")
      return val.toDate().toLocaleDateString();
    return "不明";
  };

  const trust = getTrustRank(requesterProfile, wish.requester_trust_score);

  return (
    <div
      className={`relative bg-white border shadow-sm rounded-2xl px-6 py-4 ${applicants.length > 0 && isMyWish && wish.status === "open" ? "border-yellow-400 shadow-yellow-100 ring-1 ring-yellow-400/50" : "border-slate-100"}`}
    >
      {/* Header: User & Meta & Badge */}
      <div className="relative flex justify-between items-start mb-2 gap-4">
        {/* User Info (Left) */}
        {/* User Info (Left) - Perspective Logic */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {isMyWish ? (
            // My Wish View
            wish.helper_id ? (
              // Show Helper Info (for in_progress, fulfilled, expired, etc.)
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
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">
                    手伝ってくれる人
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (wish.helper_id) openUserProfile(wish.helper_id);
                      }}
                      className="block text-sm font-bold text-slate-800 tracking-wide hover:underline text-left truncate max-w-full"
                    >
                      {helperProfile?.name || "名無しの隣人"}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              // Open Status or Unmatched History
              <div className="min-w-0 flex-1 py-1">
                 {['cancelled', 'expired'].includes(wish.status) && (
                     <div className="flex items-center gap-2 opacity-50">
                         <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
                             <User className="w-5 h-5 text-slate-300" />
                         </div>
                         <div className="text-xs text-slate-400 font-medium">
                             未成立
                         </div>
                     </div>
                 )}
              </div>
            )
          ) : (
            // Others View (Show Requester - Existing Logic)
            <>
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0 overflow-hidden">
                {requesterProfile?.avatarUrl ? (
                  <img
                    src={requesterProfile.avatarUrl}
                    alt={requesterProfile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-bold text-slate-400">
                    {requesterProfile?.name?.charAt(0).toUpperCase() || (
                      <User className="w-5 h-5 text-slate-300" />
                    )}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openUserProfile(wish.requester_id);
                    }}
                    className="block text-sm font-bold text-slate-800 tracking-wide hover:underline text-left truncate max-w-full"
                  >
                    {requesterProfile?.name ||
                      wish.requester_name ||
                      wish.requester_id.slice(0, 8)}
                  </button>
                  {trust.isVerified && (
                    <ShieldCheck
                      size={14}
                      className="text-blue-400 fill-blue-50 shrink-0"
                      strokeWidth={2.5}
                    />
                  )}
                  <div className="flex items-center gap-2 text-xs shrink-0">
                    <div
                      title={`Helped ${wish.requester_trust_score || 0} times`}
                      className={`flex items-center gap-0.5 ${trust.color}`}
                    >
                      {trust.icon}
                      <span className="font-mono">
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
                {/* Bio snippet - replaces headline */}
                {requesterProfile?.bio && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {requesterProfile.bio.length > 60
                      ? `${requesterProfile.bio.slice(0, 60)}...`
                      : requesterProfile.bio}
                  </p>
                )}
                <span className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(wish.created_at)}</span>
                </span>
              </div>
            </>
          )}
        </div>

        {/* My Wish Badge & Actions (Right - Flex Item) */}
        {isMyWish && (
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
                title="強制キャンセル (補償払い)"
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
          <p className="text-slate-600 text-base leading-relaxed font-medium whitespace-pre-wrap">
            {wish.content}
          </p>
        )}
      </div>

      {/* Value / Outcome Area */}
      <div className="relative mb-3 border-t border-slate-100 pt-2">
        {['fulfilled', 'cancelled', 'expired'].includes(wish.status) ? (
            <div className={`p-4 rounded-xl border flex justify-between items-center ${
                wish.status === 'fulfilled' ? 'bg-green-50/50 border-green-100/50' : 
                wish.status === 'cancelled' ? 'bg-red-50/30 border-red-100/50' : // Subtle Red for Cancelled
                'bg-slate-50/50 border-slate-100/50' // Gray for Expired
            }`}>
                <div className="flex items-center gap-2">
                    {wish.status === "fulfilled" ? (
                        <CheckCircle size={16} className="text-green-500" />
                    ) : wish.status === "cancelled" ? (
                        <X size={16} className="text-red-400" />
                    ) : (
                        <Archive size={16} className="text-slate-400" />
                    )}
                    <span className={`text-xs font-bold ${
                        wish.status === 'fulfilled' ? 'text-green-700' :
                        wish.status === 'cancelled' ? 'text-red-600' :
                        'text-slate-500'
                    }`}>
                        {wish.status === "fulfilled" ? "届けられた感謝 (最終値)" : 
                         wish.status === "cancelled" ? "お詫びのしるし" : 
                         "期限により自然消滅"}
                    </span>
                </div>
                <div className="text-lg font-bold font-mono text-slate-900 tracking-tight">
                    {wish.status === "fulfilled" ? (
                        <>{(wish.val_at_fulfillment || 0).toFixed(3)} <span className="text-[10px] text-slate-400 ml-0.5">Lm</span></>
                    ) : wish.status === "cancelled" ? (
                        wish.cancel_reason === 'compensatory_cancellation' || wish.val_at_fulfillment ? (
                             // Compensation Paid Case
                             <div className="flex flex-col items-end">
                                <span className="text-base text-red-500">
                                    {wish.val_at_fulfillment !== undefined 
                                        ? wish.val_at_fulfillment.toFixed(3) 
                                        : calculateHistoricalValue(
                                            wish.cost || 0, 
                                            wish.created_at, 
                                            wish.cancelled_at
                                          ).toFixed(3)
                                    } 
                                    <span className="text-[10px] ml-0.5">Lm</span>
                                </span>
                                <span className="text-[9px] text-red-300 font-bold">補償済</span>
                             </div>
                        ) : (
                             // Void Case (Show nothing on right, rely on main label)
                             null
                        )
                    ) : (
                        // Expired Case (Show nothing on right)
                        null
                    )}
                </div>
            </div>
        ) : (
            <div className="flex justify-between items-center bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
              <div>
                <div className="flex items-center gap-2 mb-1.5 opacity-80">
                    <Hourglass size={14} className={isMyWish ? "text-amber-500" : "text-orange-400"} />
                    <span className={`text-xs font-bold ${isMyWish ? "text-amber-600" : "text-slate-500"}`}>
                        {isMyWish ? "お礼の予約額" : "今もらえるお礼"}
                    </span>
                </div>
                {displayValue > 0 && (
                    <div className="text-[10px] text-red-400 font-semibold tracking-wide">
                      ※時間が経つと減ってしまいます
                    </div>
                )}
              </div>
              <div className="text-xl font-mono text-slate-800 font-bold tracking-tight">
                {displayValue.toFixed(3)} <span className="text-sm font-normal text-slate-500 ml-0.5">Lm</span>
              </div>
            </div>
        )}
      </div>

      {/* Contact Panel (For Active Participants) */}
      {wish.status === 'in_progress' && (isMyWish || wish.helper_id === currentUserId) && (
          <div className="relative mb-4 p-4 border border-slate-200 rounded-xl bg-slate-50/30">
              <h5 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <Megaphone size={14} className="text-slate-400" />
                  隣人に連絡する
              </h5>
              
              <div className="space-y-3">
                  {/* Email Section */}
                  <div className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          {isMyWish ? "相手の連絡先" : "依頼主の連絡先"}
                      </span>
                      {((isMyWish && wish.helper_contact_email) || (!isMyWish && wish.requester_contact_email)) ? (
                          <a 
                             href={`mailto:${isMyWish ? wish.helper_contact_email : wish.requester_contact_email}`}
                             className="text-sm font-mono font-bold text-blue-600 hover:underline flex items-center gap-1.5"
                          >
                             <Pencil size={12} />
                             {isMyWish ? wish.helper_contact_email : wish.requester_contact_email}
                          </a>
                      ) : (
                          <span className="text-xs text-slate-400 italic">連絡先は設定されていません</span>
                      )}
                  </div>

                  {/* Note Section (Only if note exists) */}
                  {wish.contact_note && (
                      <div className="flex flex-col gap-1 pt-2 border-t border-slate-100">
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                              承認時のメモ
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
        {/* Status Badge (Left) */}
        <div className="">
          {wish.status === "in_progress" && (
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 whitespace-nowrap shrink-0">
              進行中
            </span>
          )}
          {wish.status === "cancelled" && (
            <span className="text-xs font-bold text-red-500 bg-red-50 px-3 py-1 rounded-full border border-red-100 whitespace-nowrap shrink-0">
              キャンセル済み
            </span>
          )}
          {wish.status === "review_pending" && (
            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-100 animate-pulse whitespace-nowrap shrink-0">
              確認待ち
            </span>
          )}
          {wish.status === "fulfilled" && (
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

        {/* Action Buttons (Right) */}
        <div className="flex justify-end">
          {/* 1. Case: Requester View (My Wish) */}
          {isMyWish && (
            <>
              {wish.status === "open" && (
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
                                applicants.map((app) => (
                                  <ApplicantItem
                                    key={app.id}
                                    applicant={app}
                                    onApprove={handleApprove}
                                    onOpenProfile={openUserProfile}
                                    isActionLoading={isLoading}
                                  />
                                ))
                              )}
                            </div>

                            {/* Footer Note */}
                            <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                              <p className="text-[10px] text-slate-400">
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

              {!isExpired &&
                (wish.status === "review_pending" ||
                  wish.status === "in_progress") && (
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
                              showToast("お礼を送りました", "success");
                              setTimeout(() => refresh(), 500);
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
                )}

              {/* Redundant expired display removed as requested */}
            </>
          )}

          {/* 2. Case: Helper View (Applying/Working) */}
          {!isMyWish && !isExpired && (
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
                              showToast("立候補を取り消しました", "success");
                              refresh();
                            }
                          }
                        }}
                        disabled={isLoading}
                        className="px-3 py-1.5 text-[10px] font-bold text-slate-400 border border-slate-200 rounded-full hover:bg-slate-50 hover:text-slate-600 hover:border-slate-300 transition-all"
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
                      <span>立候補する</span>
                    </button>
                  )}
                </div>
              )}

              {/* Helper Views: In Progress (Status Only - No Report Button) */}
              {(wish.status === "in_progress" ||
                wish.status === "review_pending") &&
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
          {!isMyWish && isExpired && (
            <p className="text-[10px] text-slate-400 italic">
              期限切れのため終了しました
            </p>
          )}

          {/* 3. Cleanup Action for 0 Lm (My Wish) */}
          {isMyWish && isExpired && (
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
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
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
                ? "進行中の依頼を取り下げますか？"
                : confirmAction === "resign"
                ? "このお手伝いを辞退しますか？"
                : "このお願いを取り下げますか？"}
            </h4>

            <p className="text-xs text-slate-600 text-center mb-6 leading-relaxed whitespace-pre-wrap">
              {confirmAction === "compensate" ? (
                <>
                  協力者はすでに時間を空けて待機しています。
                  <br />
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
           <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
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
                 {isLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "承認して開始する"}
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
    </div>
  );
};
