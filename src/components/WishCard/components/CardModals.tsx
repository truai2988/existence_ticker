import React from "react";
import { Handshake, Loader2, X, AlertTriangle } from "lucide-react";
import { useLanguage } from "../../../contexts/LanguageContext";
import { WishCardState, WishCardHandlers } from "../types";
import { ApplicantItem } from "../ApplicantItem";
import { CompleteWishModal } from "../../CompleteWishModal";
import { useWishActions } from "../../../hooks/useWishActions";
import { useToast } from "../../../hooks/useToast";
import { useUserView } from "../../../contexts/UserViewContext";
import { toMilli } from "../../../logic/worldPhysics";
import { useMicroInteractions } from "../../../hooks/useMicroInteractions";

export const CardModals: React.FC<{ state: WishCardState; handlers: WishCardHandlers }> = ({ state, handlers }) => {
  const { t: MESSAGES } = useLanguage();
  const {
    wish, isLoading, showApplicants, confirmAction, approvalTarget, contactNote, showCompleteModal,
    helperProfile, currentUserId, initialCost
  } = state;

  const {
    setShowApplicants, setConfirmAction, setApprovalTarget, setContactNote, setShowCompleteModal,
    executeCancel, executeApprove, handleApprove
  } = handlers;

  const { fulfillWish, withdrawApplication } = useWishActions();
  const { showToast } = useToast();
  const { openUserProfile } = useUserView();
  const { triggerAccept } = useMicroInteractions();
  const applicants = wish.applicants || [];

  return (
    <>
      {/* 1. Applicants Modal */}
      {showApplicants && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity" onClick={() => setShowApplicants(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[70vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-300 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-yellow-100 rounded-full">
                  <Handshake className="w-4 h-4 text-yellow-600" />
                </div>
                <h4 className="text-base font-bold text-slate-900">
                  {MESSAGES.WISH_CARD.MODAL_HELPER_LIST} <span className="text-slate-700 font-normal ml-1">({applicants.length})</span>
                </h4>
              </div>
              <button onClick={() => setShowApplicants(false)} className="p-2.5 text-slate-700 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {applicants.length === 0 ? (
                <div className="py-8 text-center text-slate-800 text-base">{MESSAGES.WISH_CARD.MODAL_NO_APPLICANTS}</div>
              ) : (
                applicants.map((app: { id: string; name: string; trust_score?: number }) => (
                  <ApplicantItem
                    key={app.id}
                    applicant={app}
                    onApprove={handleApprove}
                    onOpenProfile={openUserProfile}
                    isActionLoading={isLoading}
                    isMasked={false} // 願いの匿名設定に引きずられず、立候補者の実態を表示する
                  />
                ))
              )}
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-300 text-center">
              <p className="text-sm text-slate-800">{MESSAGES.WISH_CARD.MODAL_SELECT_ONE}</p>
            </div>
          </div>
        </div>
      )}

      {/* 2. Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <div className={`p-3 rounded-full mb-4 ${confirmAction === "compensate" ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-700"}`}>
              <AlertTriangle size={24} />
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-2 text-center">
              {confirmAction === "compensate" ? MESSAGES.WISH_CARD.MODAL_CANCEL_WISH_Q : confirmAction === "resign" ? MESSAGES.WISH_CARD.MODAL_RESIGN_Q : MESSAGES.WISH_CARD.MODAL_CANCEL_REQ_Q}
            </h4>
            <p className="text-base text-slate-900 mb-6 text-center leading-relaxed font-sans">
              {confirmAction === "compensate" ? (
                <>{MESSAGES.WISH_CARD.MODAL_COMPENSATE_WARN_1}<br />
                <strong className="text-red-500">{MESSAGES.WISH_CARD.MODAL_COMPENSATE_WARN_2}</strong></>
              ) : confirmAction === "resign" ? MESSAGES.WISH_CARD.MODAL_RESIGN_WARN : MESSAGES.WISH_CARD.MODAL_CANCEL_SAFE}
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
                           showToast(MESSAGES.WISH_CARD.TOAST_CANCELLED, "success");
                           if (state.onActionComplete) state.onActionComplete("withdrawn");
                       }
                   } else {
                       executeCancel();
                   }
                }}
                disabled={isLoading}
                className={`w-full py-3 rounded-xl text-base font-bold text-white shadow-md transition-all active:scale-[0.98] ${confirmAction === "compensate" ? "bg-red-500 hover:bg-red-600 shadow-red-200" : "bg-slate-700 hover:bg-slate-800 shadow-slate-200"}`}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : confirmAction === "compensate" ? MESSAGES.WISH_CARD.BTN_COMPENSATE : confirmAction === "resign" ? MESSAGES.WISH_CARD.BTN_RESIGN : MESSAGES.WISH_CARD.BTN_CANCEL_REQ}
              </button>
              <button
                onClick={() => setConfirmAction(null)}
                disabled={isLoading}
                className="px-4 py-2 text-base font-bold text-slate-800 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors font-sans w-full md:w-auto mt-2 md:mt-0"
              >
                {MESSAGES.WISH_CARD.BTN_BACK}
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
            <h4 className="text-base font-bold text-slate-900 mb-1 text-center">
              {MESSAGES.WISH_CARD.MODAL_APPROVE_Q.includes('%name') 
                ? MESSAGES.WISH_CARD.MODAL_APPROVE_Q.replace('%name', approvalTarget.name)
                : `${approvalTarget.name} ${MESSAGES.WISH_CARD.MODAL_APPROVE_Q}`
              }
            </h4>
            <p className="text-sm text-slate-800 mb-6 text-center">{MESSAGES.WISH_CARD.MODAL_MSG_HINT}</p>
            <textarea
              value={contactNote}
              onChange={(e) => setContactNote(e.target.value)}
              placeholder={MESSAGES.WISH_CARD.MODAL_MSG_PLACEHOLDER}
              className="w-full p-3 border border-slate-300 rounded-xl mb-4 text-sm focus:ring-2 focus:ring-green-100 focus:border-green-400 outline-none resize-none min-h-[80px]"
            />
            <div className="flex flex-col gap-2 w-full">
              <button onClick={() => { triggerAccept(); executeApprove(); }} disabled={isLoading} className="w-full py-3 rounded-xl text-base font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all active:scale-[0.98]">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : MESSAGES.WISH_CARD.BTN_APPROVE}
              </button>
              <button
                onClick={() => { setApprovalTarget(null); setContactNote(""); }}
                disabled={isLoading}
                className="w-full py-3 rounded-xl text-base font-bold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                {MESSAGES.WISH_CARD.BTN_CANCEL}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Complete Wish Modal */}
      {showCompleteModal && (
        <CompleteWishModal
          wishTitle={wish.content}
          helperName={helperProfile?.name || wish.helper_name || MESSAGES.WISH_CARD.ANONYMOUS_HELPER}
          preset={wish.gratitude_preset}
          cost={toMilli(initialCost)}
          onConfirm={async () => {
            setShowCompleteModal(false);
            handlers.setIsLoading(true);
            const success = await fulfillWish(wish.id, currentUserId);
            handlers.setIsLoading(false);
            if (success) {
              showToast(MESSAGES.WISH_CARD.TOAST_THANKED, "success");
              window.dispatchEvent(new Event("goyen-celebration"));
              if (state.onActionComplete) state.onActionComplete("completed");
            } else {
              showToast(MESSAGES.WISH_CARD.TOAST_ERROR, "error");
            }
          }}
          onCancel={() => setShowCompleteModal(false)}
        />
      )}
    </>
  );
};
