import React, { useState } from "react";
import { Handshake, Loader2, Clock, User, CheckCircle, Hourglass, Megaphone, X } from "lucide-react";
import { Wish } from "../types";
import { calculateLifePoints } from "../utils/decay";
import { useWishActions } from "../hooks/useWishActions";
import { useUserView } from "../contexts/UserViewContext";
import { getTrustRank } from "../utils/trustRank";

interface WishCardProps {
  wish: Wish;
  currentUserId: string;
}

export const WishCard: React.FC<WishCardProps> = ({ wish, currentUserId }) => {
  const { applyForWish, approveWish, fulfillWish, reportCompletion } =
    useWishActions();
  const { openUserProfile } = useUserView();
  const [isLoading, setIsLoading] = useState(false);

  const [showApplicants, setShowApplicants] = useState(false);

  // Anti-Gravity: Universal Decay Logic
  const [displayValue, setDisplayValue] = useState(0);

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

  // Effect: Tick decay every 100ms
  React.useEffect(() => {
    const updateValue = () => {
      const val = calculateLifePoints(initialCost, wish.created_at);
      setDisplayValue(val);
    };
    updateValue();
    const timer = setInterval(updateValue, 100);
    return () => clearInterval(timer);
  }, [wish.created_at, initialCost]);

  const isMyWish = wish.requester_id === currentUserId;
  const applicants = wish.applicants || [];
  const hasApplied = applicants.some((a) => a.id === currentUserId);

  // Handlers
  const handleApply = async () => {
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

  const formatDate = (
    val: string | { toDate?: () => Date } | Date | undefined,
  ) => {
    if (!val) return "Just now";
    if (typeof val === "string") return new Date(val).toLocaleDateString();
    if ("toDate" in val && typeof val.toDate === "function")
      return val.toDate().toLocaleDateString();
    return "Unknown";
  };

  const trust = getTrustRank(wish.requester_trust_score);

  return (
    <div
      className={`relative bg-white border shadow-sm rounded-2xl p-6 ${applicants.length > 0 && isMyWish && wish.status === "open" ? "border-yellow-400 shadow-yellow-100 ring-1 ring-yellow-400/50" : "border-slate-100"}`}
    >
      {/* Header: User & Meta & Badge */}
      <div className="relative flex justify-between items-start mb-4 gap-4">
        {/* User Info (Left) */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
            <User className="w-5 h-5 text-slate-400" />
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
                {wish.requester_name || wish.requester_id.slice(0, 8)}
              </button>
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
            <span className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
              <Clock className="w-3 h-3" />
              <span>{formatDate(wish.created_at)}</span>
            </span>
          </div>
        </div>

        {/* My Wish Badge (Right - Flex Item) */}
        {isMyWish && (
            <span className="shrink-0 bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-full border border-slate-200 whitespace-nowrap">
                あなたのお願い
            </span>
        )}
      </div>

      {/* Body: Content */}
      <div className="relative mb-6">
        <p className="text-slate-600 text-base leading-relaxed font-medium">
          {wish.content}
        </p>
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
          {wish.status === "open" && (
            <span className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-200 whitespace-nowrap shrink-0">
              募集中 (Open)
            </span>
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
                        <div className="absolute bottom-full right-0 mb-3 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-20 animate-fade-in-up">
                          <div className="flex justify-between items-center mb-2 px-1">
                            <h4 className="text-xs font-bold text-slate-500">
                              申し出た隣人たち
                            </h4>
                            <button
                              onClick={() => setShowApplicants(false)}
                              className="text-slate-300 hover:text-slate-500"
                              title="Close"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                            {applicants.map((app) => (
                              <div
                                key={app.id}
                                className="flex justify-between items-center p-3 bg-slate-50 rounded-xl hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-slate-100"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-lg shadow-sm">
                                    {getTrustRank(app.trust_score).icon}
                                  </div>
                                  <div>
                                    <button
                                      onClick={() => openUserProfile(app.id)}
                                      className="text-xs font-bold text-slate-700 hover:underline text-left"
                                    >
                                      {app.name}
                                    </button>
                                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                      <span
                                        className={
                                          getTrustRank(app.trust_score).color
                                        }
                                      >
                                        {getTrustRank(app.trust_score).label}
                                      </span>
                                      <span>
                                        • {app.trust_score || 0} helps
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() =>
                                    handleApprove(app.id, app.name)
                                  }
                                  disabled={isLoading}
                                  className="px-3 py-1.5 bg-green-500 text-white text-[10px] rounded-lg font-bold hover:bg-green-600 disabled:opacity-50 shadow-sm hover:shadow-green-200"
                                >
                                  {isLoading ? "..." : "お願いします"}
                                </button>
                              </div>
                            ))}
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