import { useState } from "react";
import { useAuth } from "../useAuthHook";
import { db } from "../../lib/firebase";
import { collection, doc, query, where, getDocs, getDoc, runTransaction, serverTimestamp, Transaction } from "firebase/firestore";
import { MESSAGES } from "../../constants/messages";
import { useWishNotice } from "./useWishNotice";

export const useWishApplication = () => {
  const { user } = useAuth();
  const { sendNoticeSilently } = useWishNotice();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const applyForWish = async (wishId: string): Promise<boolean> => {
    if (!db || !user) return false;
    setIsSubmitting(true);

    try {
      const wishRef = doc(db, "wishes", wishId);
      const userRef = doc(db, "users", user.uid);

      await runTransaction(db, async (transaction: Transaction) => {
        const wishDoc = await transaction.get(wishRef);
        if (!wishDoc.exists()) throw "Wish not found";

        const userData = (await transaction.get(userRef)).data();
        const applicantInfo = {
          id: user.uid,
          name: userData?.name || user.displayName || MESSAGES.WISH_ACTIONS.FALLBACK_APPLICANT, 
          trust_score: userData?.completed_contracts || 0,
          contact_email: user.email || undefined,
        };

        const currentApplicants = wishDoc.data().applicants || [];
        const currentApplicantIds = wishDoc.data().applicant_ids || [];
        if (currentApplicants.some((a: { id: string }) => a.id === user.uid)) {
          throw "Already applied";
        }

        transaction.update(wishRef, {
          applicants: [...currentApplicants, applicantInfo],
          applicant_ids: [...currentApplicantIds, user.uid],
        });
      });

      // 通知: 願い主に「応募がありました」を送る
      const wishDocSnap = await getDoc(doc(db, 'wishes', wishId));
      if (wishDocSnap.exists()) {
        const wishData = wishDocSnap.data();
        const applicantName = user.displayName || MESSAGES.WISH_ACTIONS.FALLBACK_APPLICANT;
        sendNoticeSilently({
          userId: wishData.requester_id,
          message: MESSAGES.WISH_ACTIONS.NOTICE_APPLICATION.replace('%name', applicantName),
          messageKey: "NOTICE_APPLICATION",
          params: { name: applicantName },
          type: "application_received",
        });
      }

      return true;
    } catch (e) {
      console.error(e);
      alert(MESSAGES.WISH_ACTIONS.ALERT_APPLY_FAILED);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const approveWish = async (
    wishId: string,
    applicantId: string,
    contactNote?: string,
  ): Promise<boolean> => {
    if (!db || !user) return false;
    setIsSubmitting(true);
    try {
      const wishRef = doc(db, "wishes", wishId);
      
      await runTransaction(db, async (transaction: Transaction) => {
          const wishDoc = await transaction.get(wishRef);
          if (!wishDoc.exists()) throw "Wish not found";
          
          const data = wishDoc.data();
          const applicants = data.applicants || [];
          const selectedApplicant = applicants.find((a: { id: string }) => a.id === applicantId);
          
          if (!selectedApplicant) throw "Applicant not found";

          transaction.update(wishRef, {
            status: "in_progress",
            helper_id: applicantId,
            helper_name: selectedApplicant.name || "",
            accepted_at: serverTimestamp(),
            contact_note: contactNote || "",
            requester_contact_email: user.email || "",
            helper_contact_email: selectedApplicant.contact_email || "",
          });
      });

      // 通知: 助け手に「承諾されました」を送る
      sendNoticeSilently({
        userId: applicantId,
        message: MESSAGES.WISH_ACTIONS.NOTICE_APPROVED,
        messageKey: "NOTICE_APPROVED",
        type: "wish_approved",
      });

      return true;
    } catch (e) {
      console.error(e);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const withdrawApplication = async (wishId: string): Promise<boolean> => {
    if (!db || !user) return false;
    setIsSubmitting(true);
    try {
      const wishRef = doc(db, "wishes", wishId);
      await runTransaction(db, async (transaction) => {
        const wishDoc = await transaction.get(wishRef);
        if (!wishDoc.exists()) throw "Wish not found";

        const currentApplicants = wishDoc.data().applicants || [];
        const updatedApplicants = currentApplicants.filter(
          (a: { id: string }) => a.id !== user.uid,
        );
        const currentApplicantIds = wishDoc.data().applicant_ids || [];
        const updatedApplicantIds = currentApplicantIds.filter(
          (id: string) => id !== user.uid,
        );

        transaction.update(wishRef, {
          applicants: updatedApplicants,
          applicant_ids: updatedApplicantIds,
        });
      });
      return true;
    } catch (e) {
      console.error("Failed to withdraw application:", e);
      alert("取り消しに失敗しました");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { applyForWish, approveWish, withdrawApplication, isSubmitting };
};
