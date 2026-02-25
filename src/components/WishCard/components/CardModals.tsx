import React from "react";
import { Handshake, Loader2, X, AlertTriangle } from "lucide-react";
import { WishCardState, WishCardHandlers } from "../types";
import { ApplicantItem } from "../ApplicantItem";
import { CompleteWishModal } from "../../CompleteWishModal";
import { useWishActions } from "../../../hooks/useWishActions";
import { useToast } from "../../../contexts/ToastContext";
import { useUserView } from "../../../contexts/UserViewContext";
import { toMilli } from "../../../logic/worldPhysics";

export const CardModals: React.FC<{ state: WishCardState; handlers: WishCardHandlers }> = ({ state, handlers }) => {
  const {
    wish, isLoading, showApplicants, confirmAction, approvalTarget, contactNote, showCompleteModal,
    isMasked, helperProfile, currentUserId, initialCost
  } = state;

  const {
    setShowApplicants, setConfirmAction, setApprovalTarget, setContactNote, setShowCompleteModal,
    executeCancel, executeApprove, handleApprove
  } = handlers;

  const { fulfillWish, withdrawApplication } = useWishActions();
  const { showToast } = useToast();
  const { openUserProfile } = useUserView();
  const applicants = wish.applicants || [];

  return (
    <>
      {/* 1. Applicants Modal */}
      {showApplicants && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity" onClick={() => setShowApplicants(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[70vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-yellow-100 rounded-full">
                  <Handshake className="w-4 h-4 text-yellow-600" />
                </div>
                <h4 className="text-sm font-bold text-slate-700">
                  手伝ってくれる人々 <span className="text-slate-400 font-normal ml-1">({applicants.length})</span>
                </h4>
              </div>
              <button onClick={() => setShowApplicants(false)} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {applicants.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-sm">まだ申し出はありません</div>
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
            <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-400">お願いする人を一人選んでください</p>
            </div>
          </div>
        </div>
      )}

      {/* 2. Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <div className={`p-3 rounded-full mb-4 ${confirmAction === "compensate" ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-500"}`}>
              <AlertTriangle size={24} />
            </div>
            <h4 className="text-base font-bold text-slate-800 mb-2 text-center">
              {confirmAction === "compensate" ? "この願いを取り下げますか？" : confirmAction === "resign" ? "このお手伝いを辞退しますか？" : "このお願いを取り下げますか？"}
            </h4>
            <p className="text-xs text-slate-600 text-center mb-6 leading-relaxed whitespace-pre-wrap">
              {confirmAction === "compensate" ? (
                <>今キャンセルする場合、予約していたLmは<br /><strong className="text-red-500">『時間の補償』として全額相手に支払われます。</strong></>
              ) : confirmAction === "resign" ? "これまでの経緯は白紙に戻ります。" : "予約していたLmは、再び自由に使えるようになります。"}
            </p>
            <div className="flex flex-col gap-2 w-full">
              <button
                onClick={async () => {
                   if (confirmAction === "resign" && !state.isMyWish) {
                       handlers.setIsLoading(true);
                       const success = await withdrawApplication(wish.id);
                       handlers.setIsLoading(false);
                       setConfirmAction(null);
                       if (success) {
                           showToast("とりやめました", "success");
                           if (state.onActionComplete) state.onActionComplete("withdrawn");
                       }
                   } else {
                       executeCancel();
                   }
                }}
                disabled={isLoading}
                className={`w-full py-3 rounded-xl text-base font-bold text-white shadow-md transition-all active:scale-[0.98] ${confirmAction === "compensate" ? "bg-red-500 hover:bg-red-600 shadow-red-200" : "bg-slate-700 hover:bg-slate-800 shadow-slate-200"}`}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : confirmAction === "compensate" ? "補償してキャンセルする" : confirmAction === "resign" ? "辞退する" : "取り下げる"}
              </button>
              <button onClick={() => setConfirmAction(null)} disabled={isLoading} className="w-full py-3 rounded-xl text-base font-bold text-slate-500 hover:bg-slate-100 transition-colors">
                戻る
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Approval Modal */}
      {approvalTarget && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <div className="bg-green-100 text-green-600 p-3 rounded-full mb-4">
              <Handshake size={24} />
            </div>
            <h4 className="text-base font-bold text-slate-800 mb-1 text-center">{approvalTarget.name}さんにお願いしますか？</h4>
            <p className="text-xs text-slate-500 mb-6 text-center">承認時に相手へのメッセージ（連絡事項など）を送れます。</p>
            <textarea
              value={contactNote}
              onChange={(e) => setContactNote(e.target.value)}
              placeholder="例: よろしくお願いします。詳細はメールでご連絡します。"
              className="w-full p-3 border border-slate-200 rounded-xl mb-4 text-base focus:ring-2 focus:ring-green-100 focus:border-green-400 outline-none resize-none min-h-[80px]"
            />
            <div className="flex flex-col gap-2 w-full">
              <button onClick={executeApprove} disabled={isLoading} className="w-full py-3 rounded-xl text-base font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all active:scale-[0.98]">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "承認して開始する"}
              </button>
              <button
                onClick={() => { setApprovalTarget(null); setContactNote(""); }}
                disabled={isLoading}
                className="w-full py-3 rounded-xl text-base font-bold text-slate-500 hover:bg-slate-100 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Complete Wish Modal */}
      {showCompleteModal && (
        <CompleteWishModal
          wishTitle={wish.content}
          helperName={helperProfile?.name || wish.helper_name || "名無しのヘルパー"}
          preset={wish.gratitude_preset}
          cost={toMilli(initialCost)}
          onConfirm={async () => {
            setShowCompleteModal(false);
            handlers.setIsLoading(true);
            const success = await fulfillWish(wish.id, currentUserId);
            handlers.setIsLoading(false);
            if (success) {
              showToast("感謝を届けました", "success");
              window.dispatchEvent(new Event("goyen-celebration"));
              if (state.onActionComplete) state.onActionComplete("completed");
            } else {
              showToast("完了報告に失敗しました", "error");
            }
          }}
          onCancel={() => setShowCompleteModal(false)}
        />
      )}
    </>
  );
};
