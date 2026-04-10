import { useState } from "react";
import { useAuth } from "../useAuthHook";
import { db } from "../../lib/firebase";
import { doc, getDoc, runTransaction, serverTimestamp, Transaction, collection, query, where, getDocs, deleteDoc } from "firebase/firestore";
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

      let verifiedApplicantName = user.displayName || MESSAGES.WISH_ACTIONS.FALLBACK_APPLICANT;

      await runTransaction(db, async (transaction: Transaction) => {
        const wishDoc = await transaction.get(wishRef);
        if (!wishDoc.exists()) throw "Wish not found";

        const userData = (await transaction.get(userRef)).data();
        verifiedApplicantName = userData?.name || user.displayName || MESSAGES.WISH_ACTIONS.FALLBACK_APPLICANT;
        const applicantInfo = {
          id: user.uid,
          name: verifiedApplicantName, 
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
        sendNoticeSilently({
          userId: wishData.requester_id,
          wishId,
          message: MESSAGES.WISH_ACTIONS.NOTICE_APPLICATION.replace('%name', verifiedApplicantName),
          messageKey: "NOTICE_APPLICATION",
          params: { name: verifiedApplicantName },
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
      const userRef = doc(db, "users", user.uid);
      
      let verifiedRequesterName = user.displayName || MESSAGES.WISH_ACTIONS.FALLBACK_REQUESTER;

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
          
          const userData = (await transaction.get(userRef)).data();
          if (userData?.name) {
              verifiedRequesterName = userData.name;
          }
      });

      // 通知: 助け手に「承諾されました」を送る
      sendNoticeSilently({
        userId: applicantId,
        wishId,
        message: MESSAGES.WISH_ACTIONS.NOTICE_APPROVED.replace('%name', verifiedRequesterName),
        messageKey: "NOTICE_APPROVED",
        params: { name: verifiedRequesterName },
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
      const requesterId = await runTransaction(db, async (transaction) => {
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

        // 取消し完了後、送ったはずの通知を消去するための情報を返す
        return wishDoc.data().requester_id as string;
      });

      // 自分（応募者）が相手（requester_id）に送った「立候補されました」通知を全て探し出し、削除する
      if (requesterId) {
        try {
          const noticesRef = collection(db, "users", requesterId, "notices");
          const q = query(
            noticesRef,
            where("type", "==", "application_received"),
            where("wishId", "==", wishId),
            where("fromId", "==", user.uid)
          );
          const noticeSnaps = await getDocs(q);
          const deletePromises = noticeSnaps.docs.map(nDoc => deleteDoc(nDoc.ref));
          await Promise.all(deletePromises);
        } catch (noticeError) {
          console.error("Failed to silently delete withdrawn notice:", noticeError);
        }
      }

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
