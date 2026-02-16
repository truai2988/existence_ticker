import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { calculateDecayedValue, toMilli, fromMilli, WORLD_CONSTANTS, getMillis } from './worldPhysics';
import { Wish, UserProfile } from './types';

export const deleteAccount = functions.https.onCall(async (data, context) => {
    // FORCE PRODUCTION: The emulator suite automatically sets FIRESTORE_EMULATOR_HOST
    // even if we only started 'functions'. This causes the Admin SDK to try connecting
    // to localhost:8080, which is closed. We must clear it to reach Production.
    if (process.env.FIRESTORE_EMULATOR_HOST) {
        console.warn(" [deleteAccount] Clearing FIRESTORE_EMULATOR_HOST to force production connection:", process.env.FIRESTORE_EMULATOR_HOST);
        delete process.env.FIRESTORE_EMULATOR_HOST;
    }
    if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
        console.warn(" [deleteAccount] Clearing FIREBASE_AUTH_EMULATOR_HOST to force production connection:", process.env.FIREBASE_AUTH_EMULATOR_HOST);
        delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
    }

    // Initialize Admin SDK services lazily to avoid "Default app not exists" error
    // caused by module hoisting in index.ts
    const db = admin.firestore();
    const auth = admin.auth();

    // 1. Authentication Check
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const uid = context.auth.uid;
    const userRef = db.collection('users').doc(uid);

    try {
        // --- PROTECTION: LAST ADMIN CHECK ---
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

        // 1. Fetch all data needed for compensation & resignation analysis
        console.log(" [deleteAccount] Step 1: Fetching user data...");
        const wishesRef = db.collection('wishes');
        
        // Wishes created by user
        const qRequester = wishesRef.where('requester_id', '==', uid);
        const snapRequester = await qRequester.get();
        console.log(` [deleteAccount] Found ${snapRequester.size} wishes as requester.`);
        
        // Wishes where user was involved (helper or applicant)
        const qInvolved = wishesRef.where('applicant_ids', 'array-contains', uid);
        const snapInvolved = await qInvolved.get();
        console.log(` [deleteAccount] Found ${snapInvolved.size} wishes involved.`);

        // History subcollection
        const historyRef = userRef.collection('history');
        const historySnap = await historyRef.get();
        console.log(` [deleteAccount] Found ${historySnap.size} history items.`);

        // 2. Execute Transactional Death Ritual
        console.log(" [deleteAccount] Step 2: Starting Transaction...");
        await db.runTransaction(async (transaction) => {
            // READ 1: User Profile
            const tUserSnap = await transaction.get(userRef);

            // --- GHOST OPTIMIZATION ---
            if (!tUserSnap.exists) {
                console.log("[deleteAccount] No profile found (Ghost). Proceeding to direct Auth deletion.");
                return; 
            }

            // READ 2: Pre-fetch all Helper Profiles involved in active wishes
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

            // READ 2.5: Pre-fetch involved Requesters (for Scenario B)
             const originalRequesterMap = new Map<string, admin.firestore.DocumentSnapshot>();
             for (const helpDoc of snapInvolved.docs) {
                const wData = helpDoc.data() as Wish;
                if (wData.helper_id === uid && (wData.status === 'in_progress' || wData.status === 'review_pending')) {
                    if (!originalRequesterMap.has(wData.requester_id)) {
                        const rRef = db.collection('users').doc(wData.requester_id);
                        const rSnap = await transaction.get(rRef);
                        originalRequesterMap.set(wData.requester_id, rSnap);
                    }
                }
            }

            // --- WRITES START ---
            const uData = tUserSnap.data() as UserProfile;

            // STEP 0: INVITATION CODE RECYCLING
            const usedInvitationCode = uData.used_invitation_code;
            if (usedInvitationCode) {
                const invitationRef = db.collection('invitation_codes').doc(usedInvitationCode);
                transaction.update(invitationRef, {
                    is_used: false,
                    used_by: null,
                    used_at: null
                });
            }

            // STEP 0.5: DECREMENT LOCATION STATS
            if (uData.location && uData.location.prefecture && uData.location.city) {
                const cityKey = `${uData.location.prefecture}_${uData.location.city}`;
                const statRef = db.collection('location_stats').doc(cityKey);
                transaction.set(statRef, { count: FieldValue.increment(-1) }, { merge: true });
            }

            // === LAW 1: MASTER'S ABSENCE (Requester Deletes Account) ===
            let totalDecayMilli = 0;

            // User profile decay calculation
            const uBalance = uData.balance || 0;
            const uCommitted = uData.committed_lm || 0;
            const uLastUpdated = getMillis(uData.last_updated);
            const uElapsedSec = ((Date.now() - uLastUpdated) / 1000) | 0;
            const uBalanceDecayedMilli = calculateDecayedValue(toMilli(uBalance), uElapsedSec);
            const uCommittedDecayedMilli = calculateDecayedValue(toMilli(uCommitted), uElapsedSec);
            
            totalDecayMilli += (toMilli(uBalance) - uBalanceDecayedMilli);
            totalDecayMilli += (toMilli(uCommitted) - uCommittedDecayedMilli);

            for (const wishDoc of snapRequester.docs) {
                const wishData = wishDoc.data() as Wish;
                const wishInitialCost = wishData.cost || 0;
                const wishElapsedSec = ((Date.now() - getMillis(wishData.created_at)) / 1000) | 0;
                const wishDecayedMilli = calculateDecayedValue(toMilli(wishInitialCost), wishElapsedSec);
                totalDecayMilli += (toMilli(wishInitialCost) - wishDecayedMilli);
                
                // Compensation
                if ((wishData.status === 'in_progress' || wishData.status === 'review_pending') && wishData.helper_id) {
                        const helperSnap = helperMap.get(wishData.helper_id);
                        if (helperSnap && helperSnap.exists) {
                            const hData = helperSnap.data() as UserProfile;
                            const hBalance = hData.balance || 0;
                            const hLastUpdated = getMillis(hData.last_updated);
                            const hElapsedSec = ((Date.now() - hLastUpdated) / 1000) | 0;
                            const hDecayedBalanceMilli = calculateDecayedValue(toMilli(hBalance), hElapsedSec);
                            totalDecayMilli += (toMilli(hBalance) - hDecayedBalanceMilli);
                            
                            // User decay for comp calc
                            const uLastUpdatedForComp = getMillis(uData.last_updated);
                            const uElapsedSecForComp = ((Date.now() - uLastUpdatedForComp) / 1000) | 0;
                            const uDecayedBalanceMilliForComp = calculateDecayedValue(toMilli(uData.balance || 0), uElapsedSecForComp);
                            
                            const actualPaymentMilli = Math.min(wishDecayedMilli, uDecayedBalanceMilliForComp);
                            const actualPayment = fromMilli(actualPaymentMilli);

                            // Overflow handling
                            const hRawNewMilli = hDecayedBalanceMilli + actualPaymentMilli;
                            const hCappedMilli = Math.min(hRawNewMilli, WORLD_CONSTANTS.MAX_VESSEL_CAPACITY_MILLI);
                            const hOverflowMilli = Math.max(0, hRawNewMilli - WORLD_CONSTANTS.MAX_VESSEL_CAPACITY_MILLI);
                            totalDecayMilli += hOverflowMilli;

                            transaction.update(helperSnap.ref, {
                                balance: fromMilli(hCappedMilli),
                                pending_interruption_notification: "依頼主様がアプリを離れられたため（退会）、感謝のLmが補償として送り届けられました。",
                                last_updated: FieldValue.serverTimestamp()
                            });

                            // Log compensation
                            const txPropRef = db.collection('transactions').doc();
                            const currentUName = uData.name || "退会した奏者";

                            transaction.set(txPropRef, {
                                type: 'COMPENSATION',
                                amount: actualPayment,
                                sender_id: uid,
                                sender_name: currentUName, 
                                recipient_id: wishData.helper_id,
                                recipient_name: hData.name || "助け手",
                                wish_title: wishData.content,
                                wish_id: wishDoc.id,
                                created_at: FieldValue.serverTimestamp(),
                                description: "依頼主が退会されたため、これまでの感謝としてLmが届けられました。"
                            });
                        }
                }

                // CRYSTALLIZATION
                transaction.delete(wishDoc.ref);
            }

            // Global Stats
            if (totalDecayMilli > 0) {
                const globalStatsRef = db.doc(WORLD_CONSTANTS.GLOBAL_METABOLISM_PATH);
                transaction.set(globalStatsRef, {
                    total_decayed_stats: FieldValue.increment(fromMilli(totalDecayMilli)),
                    updated_at: FieldValue.serverTimestamp()
                }, { merge: true });
            }

            // === LAW 2: WISH VALIDITY (Helper Deletes Account) ===
            for (const helpDoc of snapInvolved.docs) {
                const wData = helpDoc.data() as Wish;
                
                // Remove from applicants
                const updatedApplicants = (wData.applicants || []).filter((a: { id: string }) => a.id !== uid);
                const updatedApplicantIds = (wData.applicant_ids || []).filter((id: string) => id !== uid);

                const updates: Record<string, unknown> = {
                    applicants: updatedApplicants,
                    applicant_ids: updatedApplicantIds,
                    updated_at: FieldValue.serverTimestamp(),
                };

                // If user was the active helper, reset wish to open
                if (wData.helper_id === uid) {
                    updates.status = 'open';
                    updates.helper_id = FieldValue.delete();
                    updates.helper_name = FieldValue.delete();
                    updates.accepted_at = FieldValue.delete();
                    updates.system_note = "お相手の退会に伴い、この願いは再び募集へ戻りました。";

                    // Notify Requester
                    const rRef = db.collection('users').doc(wData.requester_id);
                    transaction.update(rRef, {
                        pending_interruption_notification: "助け手様がアプリを離れられたため（退会）、願いが再び募集に戻りました。Lmは安全です。",
                        last_updated: FieldValue.serverTimestamp()
                    });
                }

                transaction.update(helpDoc.ref, updates);
            }

            // C. Delete History
            for (const historyDoc of historySnap.docs) {
                transaction.delete(historyDoc.ref);
            }

            // D. Delete Profile
            transaction.delete(userRef);
        });
        console.log(" [deleteAccount] Transaction committed successfully.");

        // 3. Delete Auth User
        console.log(" [deleteAccount] Step 3: Deleting Auth User...");
        await auth.deleteUser(uid);
        console.log(" [deleteAccount] Auth User deleted.");

        return { success: true };

    } catch (error) {
        console.error("Account deletion failed. Error Details:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        throw new functions.https.HttpsError('internal', 'Account deletion failed', error);
    }
});
