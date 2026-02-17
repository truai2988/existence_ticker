import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { calculateDecayedValue, toMilli, fromMilli, WORLD_CONSTANTS, getMillis } from './worldPhysics';
import { Wish, UserProfile } from './types';

export const deleteAccount = functions.https.onCall(async (data, context) => {
    console.log(`[deleteAccount] Execution Started`);

    const isEmulator = !!process.env.FUNCTIONS_EMULATOR || !!process.env.FIRESTORE_EMULATOR_HOST;
    let app: admin.app.App;

    if (isEmulator) {
        console.log(" [deleteAccount] Running in EMULATOR. Forcing Production Connection...");
        delete process.env.FIRESTORE_EMULATOR_HOST;
        delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
        delete process.env.STORAGE_EMULATOR_HOST;

        const appName = 'production_connection';
        if (admin.apps.some(a => a?.name === appName)) {
            app = admin.app(appName);
        } else {
            const projectId = process.env.GCLOUD_PROJECT || 'existence-ticker';
            app = admin.initializeApp({ projectId }, appName);
        }
    } else {
        console.log(" [deleteAccount] Running in PRODUCTION.");
        app = admin.app();
    }
    
    const db = app.firestore();
    const auth = app.auth();

    try {
        if (!context.auth) {
            console.error(" [deleteAccount] Unauthenticated call attempt.");
            throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
        }
        const uid = context.auth.uid;
        console.log(` [deleteAccount] Target UID: ${uid}`);
        const userRef = db.collection('users').doc(uid);

        console.log(" [deleteAccount] Checking Admin status...");
        const userSnap = await userRef.get();
        if (userSnap.exists) {
             const userData = userSnap.data() as UserProfile;
             if (userData.role === 'admin') {
                const adminQuery = db.collection('users').where('role', '==', 'admin');
                const adminSnap = await adminQuery.get();
                if (adminSnap.size <= 1) {
                    throw new functions.https.HttpsError('failed-precondition', "あなたが最後の管理者です。他の方を管理者に任命してから退会してください。");
                }
             }
        }

        console.log(" [deleteAccount] Step 1: Fetching user data...");
        const wishesRef = db.collection('wishes');
        const qRequester = wishesRef.where('requester_id', '==', uid);
        const snapRequester = await qRequester.get();
        const qInvolved = wishesRef.where('applicant_ids', 'array-contains', uid);
        const snapInvolved = await qInvolved.get();
        const historyRef = userRef.collection('history');
        const historySnap = await historyRef.get();

        console.log(" [deleteAccount] Step 2: Starting Transaction...");
        await db.runTransaction(async (transaction) => {
            const tUserSnap = await transaction.get(userRef);
            if (!tUserSnap.exists) {
                console.log("[deleteAccount] No profile found (Ghost).");
                return; 
            }

            const helperMap = new Map<string, admin.firestore.DocumentSnapshot>();
            for (const wishDoc of snapRequester.docs) {
                const wData = wishDoc.data() as Wish;
                if ((wData.status === 'in_progress' || wData.status === 'review_pending') && wData.helper_id) {
                    if (!helperMap.has(wData.helper_id)) {
                        const hRef = db.collection('users').doc(wData.helper_id);
                        const hSnap = await transaction.get(hRef);
                        helperMap.set(wData.helper_id, hSnap);
                    }
                }
            }

            const uData = tUserSnap.data() as UserProfile;
            const usedInvitationCode = uData.used_invitation_code;
            if (usedInvitationCode) {
                const invitationRef = db.collection('invitation_codes').doc(usedInvitationCode);
                transaction.update(invitationRef, { is_used: false, used_by: null, used_at: null });
            }

            if (uData.location && uData.location.prefecture && uData.location.city) {
                const cityKey = `${uData.location.prefecture}_${uData.location.city}`;
                const statRef = db.collection('location_stats').doc(cityKey);
                transaction.set(statRef, { count: FieldValue.increment(-1) }, { merge: true });
            }

            let totalDecayMilli = 0;
            const now = Date.now();

            // Calculate User's current physical state for metabolism logging
            const uCycleStart = getMillis(uData.cycle_started_at, 0);
            if (uCycleStart > 0) {
                const uElapsedSec = ((now - uCycleStart) / 1000) | 0;
                const uDecayedVesselMilli = calculateDecayedValue(toMilli(WORLD_CONSTANTS.REBIRTH_AMOUNT), uElapsedSec);
                const uCurrentSpentMilli = toMilli(uData.spent_lm || 0);
                
                // Decay logged is effectively what would have happened if they stayed
                totalDecayMilli += (toMilli(WORLD_CONSTANTS.REBIRTH_AMOUNT) - uDecayedVesselMilli);
            }

            for (const wishDoc of snapRequester.docs) {
                const wishData = wishDoc.data() as Wish;
                const wishInitialCost = wishData.cost || 0;
                const wishCreatedAt = getMillis(wishData.created_at);
                const wishElapsedSec = ((now - wishCreatedAt) / 1000) | 0;
                const wishDecayedMilli = calculateDecayedValue(toMilli(wishInitialCost), wishElapsedSec);
                
                // Track wish decay for global stats
                totalDecayMilli += (toMilli(wishInitialCost) - wishDecayedMilli);
                
                if ((wishData.status === 'in_progress' || wishData.status === 'review_pending') && wishData.helper_id) {
                    const helperSnap = helperMap.get(wishData.helper_id);
                    if (helperSnap && helperSnap.exists) {
                        const hData = helperSnap.data() as UserProfile;
                        const hCycleStart = getMillis(hData.cycle_started_at, 0);
                        const hElapsedSec = ((now - hCycleStart) / 1000) | 0;
                        const hDecayedVesselMilli = calculateDecayedValue(toMilli(WORLD_CONSTANTS.REBIRTH_AMOUNT), hElapsedSec);
                        
                        // Enforce Solvency: Balance must cover all commissions (skipped for deletion compensation as it is a gift)
                        // But we must respect the 2400 WALL for the helper
                        const uCycleStartForComp = getMillis(uData.cycle_started_at, 0);
                        const uElapsedSecForComp = ((now - uCycleStartForComp) / 1000) | 0;
                        const uDecayedVesselMilliForComp = calculateDecayedValue(toMilli(WORLD_CONSTANTS.REBIRTH_AMOUNT), uElapsedSecForComp);
                        const uCurrentRealMilli = Math.max(0, uDecayedVesselMilliForComp - toMilli(uData.spent_lm || 0));

                        const actualPaymentMilli = Math.min(wishDecayedMilli, uCurrentRealMilli);
                        const actualPaymentAmount = fromMilli(actualPaymentMilli);

                        // Wall check for helper: helper's balance <= 2400
                        const minHSpentMilli = hDecayedVesselMilli - toMilli(WORLD_CONSTANTS.REBIRTH_AMOUNT);
                        const currentHSpentMilli = toMilli(hData.spent_lm || 0);
                        const newHSpentMilli = Math.max(minHSpentMilli, currentHSpentMilli - actualPaymentMilli);

                        transaction.update(helperSnap.ref, {
                            spent_lm: fromMilli(newHSpentMilli),
                            pending_interruption_notification: "依頼主様がアプリを離れられたため（退会）、感謝のLmが補償として送り届けられました。",
                        });

                        const txPropRef = db.collection('transactions').doc();
                        transaction.set(txPropRef, {
                            type: 'COMPENSATION',
                            amount: actualPaymentAmount,
                            sender_id: uid,
                            sender_name: uData.name || "奏者", 
                            recipient_id: wishData.helper_id,
                            recipient_name: hData.name || "助け手",
                            wish_title: wishData.content,
                            wish_id: wishDoc.id,
                            created_at: FieldValue.serverTimestamp(),
                            description: "依頼主が退会されたため、これまでの感謝としてLmが届けられました。"
                        });
                    }
                }
                transaction.delete(wishDoc.ref);
            }

            if (totalDecayMilli > 0) {
                const globalStatsRef = db.doc(WORLD_CONSTANTS.GLOBAL_METABOLISM_PATH);
                transaction.set(globalStatsRef, {
                    total_decayed_stats: FieldValue.increment(fromMilli(totalDecayMilli)),
                    updated_at: FieldValue.serverTimestamp()
                }, { merge: true });
            }

            for (const helpDoc of snapInvolved.docs) {
                const wData = helpDoc.data() as Wish;
                const updatedApplicants = (wData.applicants || []).filter((a: { id: string }) => a.id !== uid);
                const updatedApplicantIds = (wData.applicant_ids || []).filter((id: string) => id !== uid);
                const updates: Record<string, unknown> = {
                    applicants: updatedApplicants,
                    applicant_ids: updatedApplicantIds,
                    updated_at: FieldValue.serverTimestamp(),
                };

                if (wData.helper_id === uid) {
                    updates.status = 'open';
                    updates.helper_id = FieldValue.delete();
                    updates.helper_name = FieldValue.delete();
                    updates.accepted_at = FieldValue.delete();
                    updates.system_note = "お相手の退会に伴い、この願いは再び募集へ戻りました。";

                    const rRef = db.collection('users').doc(wData.requester_id);
                    transaction.update(rRef, {
                        pending_interruption_notification: "助け手様がアプリを離れられたため（退会）、願いが再び募集に戻りました。Lmは安全です。",
                    });
                }
                transaction.update(helpDoc.ref, updates);
            }

            for (const historyDoc of historySnap.docs) {
                transaction.delete(historyDoc.ref);
            }
            transaction.delete(userRef);
        });

        console.log(" [deleteAccount] Step 3: Deleting Auth User...");
        await auth.deleteUser(uid);
        console.log(" [deleteAccount] Auth User deleted.");

        return { success: true };

    } catch (error) {
        console.error("Account deletion failed. Error:", error);
        if (error instanceof functions.https.HttpsError) throw error;
        throw new functions.https.HttpsError('internal', 'Account deletion failed', error);
    }
});
