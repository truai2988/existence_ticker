"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAccount = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const worldPhysics_1 = require("./worldPhysics");
exports.deleteAccount = functions.https.onCall(async (data, context) => {
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
            const userData = userSnap.data();
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
            const helperMap = new Map();
            for (const wishDoc of snapRequester.docs) {
                const wData = wishDoc.data();
                if ((wData.status === 'in_progress' || wData.status === 'review_pending') && wData.helper_id) {
                    if (!helperMap.has(wData.helper_id)) {
                        const hRef = db.collection('users').doc(wData.helper_id);
                        const hSnap = await transaction.get(hRef);
                        helperMap.set(wData.helper_id, hSnap);
                    }
                }
            }
            // READ 2.5: Pre-fetch involved Requesters (for Scenario B)
            const originalRequesterMap = new Map();
            for (const helpDoc of snapInvolved.docs) {
                const wData = helpDoc.data();
                if (wData.helper_id === uid && (wData.status === 'in_progress' || wData.status === 'review_pending')) {
                    if (!originalRequesterMap.has(wData.requester_id)) {
                        const rRef = db.collection('users').doc(wData.requester_id);
                        const rSnap = await transaction.get(rRef);
                        originalRequesterMap.set(wData.requester_id, rSnap);
                    }
                }
            }
            // --- WRITES START ---
            const uData = tUserSnap.data();
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
                transaction.set(statRef, { count: firestore_1.FieldValue.increment(-1) }, { merge: true });
            }
            // === LAW 1: MASTER'S ABSENCE (Requester Deletes Account) ===
            let totalDecayMilli = 0;
            // User profile decay calculation
            const uBalance = uData.balance || 0;
            const uCommitted = uData.committed_lm || 0;
            const uLastUpdated = (0, worldPhysics_1.getMillis)(uData.last_updated);
            const uElapsedSec = ((Date.now() - uLastUpdated) / 1000) | 0;
            const uBalanceDecayedMilli = (0, worldPhysics_1.calculateDecayedValue)((0, worldPhysics_1.toMilli)(uBalance), uElapsedSec);
            const uCommittedDecayedMilli = (0, worldPhysics_1.calculateDecayedValue)((0, worldPhysics_1.toMilli)(uCommitted), uElapsedSec);
            totalDecayMilli += ((0, worldPhysics_1.toMilli)(uBalance) - uBalanceDecayedMilli);
            totalDecayMilli += ((0, worldPhysics_1.toMilli)(uCommitted) - uCommittedDecayedMilli);
            for (const wishDoc of snapRequester.docs) {
                const wishData = wishDoc.data();
                const wishInitialCost = wishData.cost || 0;
                const wishElapsedSec = ((Date.now() - (0, worldPhysics_1.getMillis)(wishData.created_at)) / 1000) | 0;
                const wishDecayedMilli = (0, worldPhysics_1.calculateDecayedValue)((0, worldPhysics_1.toMilli)(wishInitialCost), wishElapsedSec);
                totalDecayMilli += ((0, worldPhysics_1.toMilli)(wishInitialCost) - wishDecayedMilli);
                // Compensation
                if ((wishData.status === 'in_progress' || wishData.status === 'review_pending') && wishData.helper_id) {
                    const helperSnap = helperMap.get(wishData.helper_id);
                    if (helperSnap && helperSnap.exists) {
                        const hData = helperSnap.data();
                        const hBalance = hData.balance || 0;
                        const hLastUpdated = (0, worldPhysics_1.getMillis)(hData.last_updated);
                        const hElapsedSec = ((Date.now() - hLastUpdated) / 1000) | 0;
                        const hDecayedBalanceMilli = (0, worldPhysics_1.calculateDecayedValue)((0, worldPhysics_1.toMilli)(hBalance), hElapsedSec);
                        totalDecayMilli += ((0, worldPhysics_1.toMilli)(hBalance) - hDecayedBalanceMilli);
                        // User decay for comp calc
                        const uLastUpdatedForComp = (0, worldPhysics_1.getMillis)(uData.last_updated);
                        const uElapsedSecForComp = ((Date.now() - uLastUpdatedForComp) / 1000) | 0;
                        const uDecayedBalanceMilliForComp = (0, worldPhysics_1.calculateDecayedValue)((0, worldPhysics_1.toMilli)(uData.balance || 0), uElapsedSecForComp);
                        const actualPaymentMilli = Math.min(wishDecayedMilli, uDecayedBalanceMilliForComp);
                        const actualPayment = (0, worldPhysics_1.fromMilli)(actualPaymentMilli);
                        // Overflow handling
                        const hRawNewMilli = hDecayedBalanceMilli + actualPaymentMilli;
                        const hCappedMilli = Math.min(hRawNewMilli, worldPhysics_1.WORLD_CONSTANTS.MAX_VESSEL_CAPACITY_MILLI);
                        const hOverflowMilli = Math.max(0, hRawNewMilli - worldPhysics_1.WORLD_CONSTANTS.MAX_VESSEL_CAPACITY_MILLI);
                        totalDecayMilli += hOverflowMilli;
                        transaction.update(helperSnap.ref, {
                            balance: (0, worldPhysics_1.fromMilli)(hCappedMilli),
                            pending_interruption_notification: "依頼主様がアプリを離れられたため（退会）、感謝のLmが補償として送り届けられました。",
                            last_updated: firestore_1.FieldValue.serverTimestamp()
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
                            created_at: firestore_1.FieldValue.serverTimestamp(),
                            description: "依頼主が退会されたため、これまでの感謝としてLmが届けられました。"
                        });
                    }
                }
                // CRYSTALLIZATION
                transaction.delete(wishDoc.ref);
            }
            // Global Stats
            if (totalDecayMilli > 0) {
                const globalStatsRef = db.doc(worldPhysics_1.WORLD_CONSTANTS.GLOBAL_METABOLISM_PATH);
                transaction.set(globalStatsRef, {
                    total_decayed_stats: firestore_1.FieldValue.increment((0, worldPhysics_1.fromMilli)(totalDecayMilli)),
                    updated_at: firestore_1.FieldValue.serverTimestamp()
                }, { merge: true });
            }
            // === LAW 2: WISH VALIDITY (Helper Deletes Account) ===
            for (const helpDoc of snapInvolved.docs) {
                const wData = helpDoc.data();
                // Remove from applicants
                const updatedApplicants = (wData.applicants || []).filter((a) => a.id !== uid);
                const updatedApplicantIds = (wData.applicant_ids || []).filter((id) => id !== uid);
                const updates = {
                    applicants: updatedApplicants,
                    applicant_ids: updatedApplicantIds,
                    updated_at: firestore_1.FieldValue.serverTimestamp(),
                };
                // If user was the active helper, reset wish to open
                if (wData.helper_id === uid) {
                    updates.status = 'open';
                    updates.helper_id = firestore_1.FieldValue.delete();
                    updates.helper_name = firestore_1.FieldValue.delete();
                    updates.accepted_at = firestore_1.FieldValue.delete();
                    updates.system_note = "お相手の退会に伴い、この願いは再び募集へ戻りました。";
                    // Notify Requester
                    const rRef = db.collection('users').doc(wData.requester_id);
                    transaction.update(rRef, {
                        pending_interruption_notification: "助け手様がアプリを離れられたため（退会）、願いが再び募集に戻りました。Lmは安全です。",
                        last_updated: firestore_1.FieldValue.serverTimestamp()
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
    }
    catch (error) {
        console.error("Account deletion failed. Error Details:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        throw new functions.https.HttpsError('internal', 'Account deletion failed', error);
    }
});
//# sourceMappingURL=deleteAccount.js.map