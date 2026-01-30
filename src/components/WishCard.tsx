import React, { useState } from "react";
import { Handshake, Loader2, Clock, User, CheckCircle, Hourglass, Megaphone, X, ShieldCheck, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { Wish } from "../types";
import { calculateLifePoints } from "../utils/decay";
import { useWishActions } from "../hooks/useWishActions";
import { useUserView } from "../contexts/UserViewContext";
import { getTrustRank } from "../utils/trustRank";
import { useOtherProfile } from "../hooks/useOtherProfile";
import { useProfile } from "../hooks/useProfile";
import { isProfileComplete } from "../utils/profileCompleteness";

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
                <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
                <span className="text-lg font-bold text-slate-400">
                    {displayName?.charAt(0).toUpperCase() || <User className="w-5 h-5 text-slate-300" />}
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
            <span className="text-slate-500 font-bold">
                {rank.label}
            </span>
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

export const WishCard: React.FC<WishCardProps> = ({ wish, currentUserId, onOpenProfile }) => {
  const { applyForWish, approveWish, fulfillWish, reportCompletion, cancelWish, updateWish } =
    useWishActions();
  const { openUserProfile } = useUserView();
  const { profile: requesterProfile } = useOtherProfile(wish.requester_id);
  const { profile: myProfile } = useProfile();
  const [isLoading, setIsLoading] = useState(false);

  const [showApplicants, setShowApplicants] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(wish.content);

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
  const displayValue = calculateLifePoints(initialCost, wish.created_at);

  const isMyWish = wish.requester_id === currentUserId;
  const applicants = wish.applicants || [];
  const hasApplied = applicants.some((a) => a.id === currentUserId);

  // Handlers
  const handleApply = async () => {
    if (!isProfileComplete(myProfile)) {
        if (confirm("プロフィールの器を完成させると、信頼されやすくなります（採用率が上がります）。\n\nプロフィールを編集しますか？")) {
            if (onOpenProfile) onOpenProfile();
            return;
        }
    }

    if (!confirm("この依頼に立候補しますか？")) return;
    setIsLoading(true);
    await applyForWish(wish.id);
    setIsLoading(false);
  };

  const handleApprove = async (applicantId: string, name: string) => {
    if (!confirm(`${name}さんにお願いしますか？`)) return;
    setIsLoading(true);
    await approveWish(wish.id, applicantId);
    setIsLoading(false);
  };

  const handleUpdate = async () => {
      if (!editContent.trim()) return;
      setIsLoading(true);
      const success = await updateWish(wish.id, editContent);
      if (success) setIsEditing(false);
      setIsLoading(false);
  };

  const handleCancel = async () => {
      if (!confirm("依頼を取り下げますか？\n予約されていたLmは手元に戻ります。")) return;
      setIsLoading(true);
      await cancelWish(wish.id);
      setIsLoading(false);
  };

  const formatDate = (
    val: string | { toDate?: () => Date } | Date | undefined,
  ) => {
    if (!val) return "Just now";
    if (typeof val === "string") return new Date(val).toLocaleDateString();
    if ("toDate" in val && typeof val.toDate === "function")
      return val.toDate().toLocaleDateString();
    return "Unknown";
  };

  const trust = getTrustRank(requesterProfile, wish.requester_trust_score);

  return (
    <div
      className={`relative bg-white border shadow-sm rounded-2xl p-6 ${applicants.length > 0 && isMyWish && wish.status === "open" ? "border-yellow-400 shadow-yellow-100 ring-1 ring-yellow-400/50" : "border-slate-100"}`}
    >
      {/* Header: User & Meta & Badge */}
      <div className="relative flex justify-between items-start mb-4 gap-4">
        {/* User Info (Left) */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0 overflow-hidden">
            {requesterProfile?.avatarUrl ? (
                <img src={requesterProfile.avatarUrl} alt={requesterProfile.name} className="w-full h-full object-cover" />
            ) : (
                <span className="text-lg font-bold text-slate-400">
                    {requesterProfile?.name?.charAt(0).toUpperCase() || <User className="w-5 h-5 text-slate-300" />}
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
                {requesterProfile?.name || wish.requester_name || wish.requester_id.slice(0, 8)}
              </button>
              {trust.isVerified && (
                <ShieldCheck size={14} className="text-blue-400 fill-blue-50 shrink-0" strokeWidth={2.5} />
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
                  <Megaphone className="w-3 h-3" /> <span className="font-bold">依頼実績: {wish.requester_completed_requests || 0}</span>
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
        </div>

        {/* My Wish Badge & Actions (Right - Flex Item) */}
        {isMyWish && (
            <div className="flex items-center gap-2 shrink-0">
                {/* Edit/Delete Actions for Open Wishes */}
                {wish.status === 'open' && (
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
                <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-full border border-slate-200 whitespace-nowrap">
                    あなたのお願い
                </span>
            </div>
        )}
      </div>

      {/* Body: Content */}
      <div className="relative mb-6">
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
                        {isLoading ? <Loader2 className="w-3 h-3 animate-spin"/> : '更新する'}
                    </button>
                </div>
            </div>
        ) : (
            <p className="text-slate-600 text-base leading-relaxed font-medium whitespace-pre-wrap">
              {wish.content}
            </p>
        )}
      </div>

      {/* Value / Entropy Area (Antigravity) */}
      <div className="relative mb-6 border-t border-slate-100 pt-4">
        <div className="flex justify-between items-center bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
          <div>
            <div className="text-xs text-slate-500 font-bold flex items-center gap-1 mb-1">
              <Hourglass className="w-3 h-3 text-amber-500" />
              今もらえるお礼
            </div>
            <div className="text-[10px] text-red-400 font-semibold tracking-wide">
              ※時間が経つと減ってしまいます
            </div>
          </div>
          <div className="text-xl font-mono text-slate-800 font-bold tracking-tight">
            {displayValue.toFixed(3)} <span className="text-sm font-normal text-slate-500 ml-0.5">Lm</span>
          </div>
        </div>
      </div>

      {/* Footer: Action Area */}
      <div className="relative pt-4 border-t border-slate-100 min-h-[50px] flex items-center justify-between gap-4 flex-wrap">
        {/* Status Badge (Left) */}
        <div className="">
          {wish.status === "in_progress" && (
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 whitespace-nowrap shrink-0">
              進行中 (In Progress)
            </span>
          )}
          {wish.status === "review_pending" && (
            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-100 animate-pulse whitespace-nowrap shrink-0">
              確認待ち (Review Pending)
            </span>
          )}
          {wish.status === "fulfilled" && (
            <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100 whitespace-nowrap shrink-0">
              感謝済み (Fulfilled)
            </span>
          )}
          {wish.status === 'open' && (
             displayValue === 0 ? (
              <span className="flex items-center gap-1 text-xs font-bold text-red-500 bg-red-50 px-3 py-1 rounded-full border border-red-100 whitespace-nowrap shrink-0">
                  <AlertTriangle size={12} />
                  自然死 (Expired)
              </span>
             ) : (
                <span className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-200 whitespace-nowrap shrink-0">
                  募集中 (Open)
                </span>
             )
          )}
        </div>

        {/* Action Buttons (Right) */}
        <div className="flex justify-end">
          {/* 1. Case: Requester View (My Wish) */}
          {isMyWish && (
            <>
              {wish.status === "open" && (
                <div>
                  {applicants.length === 0 ? (
                    <span className="text-xs text-slate-400 italic flex items-center gap-1">
                      <span className="animate-pulse">...</span>
                      親切な隣人を待っています
                    </span>
                  ) : (
                    <div className="relative">
                      <button
                        onClick={() => setShowApplicants(!showApplicants)}
                        className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-white rounded-full text-xs font-bold shadow-md shadow-yellow-200 hover:bg-yellow-500 transition-all active:scale-95"
                      >
                        <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                        手伝いの申し出 ({applicants.length})
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
                                    申し出た隣人たち <span className="text-slate-400 font-normal ml-1">({applicants.length})</span>
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

              {wish.status === "review_pending" && (
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
                          if (success)
                            alert("完了しました！感謝の循環が生まれました。");
                          setIsLoading(false);
                        };
                        run();
                      }
                    }
                  }}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold shadow-lg shadow-pink-200 hover:scale-105 active:scale-95 transition-all"
                >
                  <Handshake className="w-4 h-4" />
                  <span>ありがとう (お礼をする)</span>
                </button>
              )}
            </>
          )}

          {/* 2. Case: Helper View (Applying/Working) */}
          {!isMyWish && (
            <>
              {wish.status === "open" && (
                <div>
                  {hasApplied ? (
                    <span className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-500 rounded-full text-xs font-bold border border-slate-200 whitespace-nowrap shrink-0">
                      <Clock size={14} />
                      返事を待っています (Applied)
                    </span>
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
                  
                  {/* Expired Warning for Others */}
                  {displayValue === 0 && (
                      <p className="text-[10px] text-red-400 mt-2 text-center font-bold">
                          ※ この依頼は減価により消滅しました
                      </p>
                  )}
                </div>
              )}


              {wish.status === "in_progress" &&
                wish.helper_id === currentUserId && (
                  <button
                    onClick={async () => {
                      if (confirm("依頼主に完了を報告しますか？")) {
                        setIsLoading(true);
                        await reportCompletion(wish.id);
                        setIsLoading(false);
                      }
                    }}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-blue-500 text-white font-bold shadow-lg shadow-blue-200 hover:bg-blue-600 active:scale-95 transition-all"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>完了を報告する</span>
                  </button>
                )}

              {wish.status === "review_pending" &&
                wish.helper_id === currentUserId && (
                  <span className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-full text-xs font-bold border border-purple-100 whitespace-nowrap shrink-0">
                    <Clock size={14} />
                    承認待ち (Reported)
                  </span>
                )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};