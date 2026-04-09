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
    console.log(`[deleteAccount] Execution Started`);
    const isEmulator = !!process.env.FUNCTIONS_EMULATOR || !!process.env.FIRESTORE_EMULATOR_HOST;
    let app;
    if (isEmulator) {
        console.log(" [deleteAccount] Running in EMULATOR. Forcing Production Connection...");
        delete process.env.FIRESTORE_EMULATOR_HOST;
        delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
        delete process.env.STORAGE_EMULATOR_HOST;
        const appName = 'production_connection';
        if (admin.apps.some(a => (a === null || a === void 0 ? void 0 : a.name) === appName)) {
            app = admin.app(appName);
        }
        else {
            const projectId = process.env.GCLOUD_PROJECT || 'existence-ticker';
            app = admin.initializeApp({ projectId }, appName);
        }
    }
    else {
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
            const userData = userSnap.data();
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
            const uData = tUserSnap.data();
            const usedInvitationCode = uData.used_invitation_code;
            if (usedInvitationCode) {
                const invitationRef = db.collection('invitation_codes').doc(usedInvitationCode);
                transaction.update(invitationRef, { is_used: false, used_by: null, used_at: null });
            }
            // Stats (Managed by trigger)
            // Manual decrement removed to prevent double-counting.
            let totalDecayMilli = 0;
            const now = Date.now();
            // Calculate User's current physical state for metabolism logging
            const uCycleStart = (0, worldPhysics_1.getMillis)(uData.cycle_started_at, 0);
            if (uCycleStart > 0) {
                const uElapsedSec = ((now - uCycleStart) / 1000) | 0;
                const uDecayedVesselMilli = (0, worldPhysics_1.calculateDecayedValue)((0, worldPhysics_1.toMilli)(worldPhysics_1.WORLD_CONSTANTS.REBIRTH_AMOUNT), uElapsedSec);
                // Decay logged is effectively what would have happened if they stayed
                totalDecayMilli += ((0, worldPhysics_1.toMilli)(worldPhysics_1.WORLD_CONSTANTS.REBIRTH_AMOUNT) - uDecayedVesselMilli);
            }
            for (const wishDoc of snapRequester.docs) {
                const wishData = wishDoc.data();
                const wishInitialCost = wishData.cost || 0;
                const wishCreatedAt = (0, worldPhysics_1.getMillis)(wishData.created_at);
                const wishElapsedSec = ((now - wishCreatedAt) / 1000) | 0;
                const wishDecayedMilli = (0, worldPhysics_1.calculateDecayedValue)((0, worldPhysics_1.toMilli)(wishInitialCost), wishElapsedSec);
                // Track wish decay for global stats
                totalDecayMilli += ((0, worldPhysics_1.toMilli)(wishInitialCost) - wishDecayedMilli);
                if ((wishData.status === 'in_progress' || wishData.status === 'review_pending') && wishData.helper_id) {
                    const helperSnap = helperMap.get(wishData.helper_id);
                    if (helperSnap && helperSnap.exists) {
                        const hData = helperSnap.data();
                        const hCycleStart = (0, worldPhysics_1.getMillis)(hData.cycle_started_at, 0);
                        const hElapsedSec = ((now - hCycleStart) / 1000) | 0;
                        const hDecayedVesselMilli = (0, worldPhysics_1.calculateDecayedValue)((0, worldPhysics_1.toMilli)(worldPhysics_1.WORLD_CONSTANTS.REBIRTH_AMOUNT), hElapsedSec);
                        // Enforce Solvency: Balance must cover all commissions (skipped for deletion compensation as it is a gift)
                        // But we must respect the 2400 WALL for the helper
                        const uCycleStartForComp = (0, worldPhysics_1.getMillis)(uData.cycle_started_at, 0);
                        const uElapsedSecForComp = ((now - uCycleStartForComp) / 1000) | 0;
                        const uDecayedVesselMilliForComp = (0, worldPhysics_1.calculateDecayedValue)((0, worldPhysics_1.toMilli)(worldPhysics_1.WORLD_CONSTANTS.REBIRTH_AMOUNT), uElapsedSecForComp);
                        const uCurrentRealMilli = Math.max(0, uDecayedVesselMilliForComp - (0, worldPhysics_1.toMilli)(uData.spent_lm || 0));
                        const actualPaymentMilli = Math.min(wishDecayedMilli, uCurrentRealMilli);
                        const actualPaymentAmount = (0, worldPhysics_1.fromMilli)(actualPaymentMilli);
                        // Wall check for helper: helper's balance <= 2400
                        const minHSpentMilli = hDecayedVesselMilli - (0, worldPhysics_1.toMilli)(worldPhysics_1.WORLD_CONSTANTS.REBIRTH_AMOUNT);
                        const currentHSpentMilli = (0, worldPhysics_1.toMilli)(hData.spent_lm || 0);
                        const newHSpentMilli = Math.max(minHSpentMilli, currentHSpentMilli - actualPaymentMilli);
                        transaction.update(helperSnap.ref, {
                            spent_lm: (0, worldPhysics_1.fromMilli)(newHSpentMilli),
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
                            created_at: firestore_1.FieldValue.serverTimestamp(),
                            description: "依頼主が退会されたため、これまでの感謝としてLmが届けられました。"
                        });
                    }
                }
                transaction.delete(wishDoc.ref);
            }
            if (totalDecayMilli > 0) {
                const globalStatsRef = db.doc(worldPhysics_1.WORLD_CONSTANTS.GLOBAL_METABOLISM_PATH);
                transaction.set(globalStatsRef, {
                    total_decayed_stats: firestore_1.FieldValue.increment((0, worldPhysics_1.fromMilli)(totalDecayMilli)),
                    updated_at: firestore_1.FieldValue.serverTimestamp()
                }, { merge: true });
            }
            for (const helpDoc of snapInvolved.docs) {
                const wData = helpDoc.data();
                const updatedApplicants = (wData.applicants || []).filter((a) => a.id !== uid);
                const updatedApplicantIds = (wData.applicant_ids || []).filter((id) => id !== uid);
                const updates = {
                    applicants: updatedApplicants,
                    applicant_ids: updatedApplicantIds,
                    updated_at: firestore_1.FieldValue.serverTimestamp(),
                };
                if (wData.helper_id === uid) {
                    updates.status = 'open';
                    updates.helper_id = firestore_1.FieldValue.delete();
                    updates.helper_name = firestore_1.FieldValue.delete();
                    updates.accepted_at = firestore_1.FieldValue.delete();
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
            // Step 2.5: Purge Transactions associated with this user
            // Note: We do this inside the transaction or in a separate batch if many.
            // For now, let's fetch them and add to transaction.
            const txRef = db.collection('transactions');
            const qS = txRef.where('sender_id', '==', uid);
            const qR = txRef.where('recipient_id', '==', uid);
            const qO = txRef.where('owner_id', '==', uid);
            const [snapS, snapR, snapO] = await Promise.all([qS.get(), qR.get(), qO.get()]);
            const allTxDocs = [...snapS.docs, ...snapR.docs, ...snapO.docs];
            for (const txDoc of allTxDocs) {
                transaction.delete(txDoc.ref);
            }
            transaction.delete(userRef);
        });
        console.log(" [deleteAccount] Step 3: Deleting Auth User...");
        await auth.deleteUser(uid);
        console.log(" [deleteAccount] Auth User deleted.");
        return { success: true };
    }
    catch (error) {
        console.error("Account deletion failed. Error:", error);
        if (error instanceof functions.https.HttpsError)
            throw error;
        throw new functions.https.HttpsError('internal', 'Account deletion failed', error);
    }
});
//# sourceMappingURL=deleteAccount.js.map