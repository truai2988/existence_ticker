import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut as firebaseSignOut, 
    updateProfile,
    linkWithCredential,
    EmailAuthProvider,
    updatePassword,
    sendPasswordResetEmail,
    updateEmail,
    reauthenticateWithCredential
} from 'firebase/auth';
import { doc, serverTimestamp, runTransaction, increment, collection, query, where, getDocs, getDoc, QueryDocumentSnapshot, DocumentData, deleteField } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useAuthContext } from '../contexts/AuthContextDefinition';
import { calculateDecayedValue, toMilli, fromMilli, WORLD_CONSTANTS, getMillis } from '../logic/worldPhysics';
import { useCallback } from 'react';


export const useAuth = () => {
    // Consume Singleton State
    const { user, isAdmin, loading, isRegistering, setIsRegistering } = useAuthContext();

    const signIn = useCallback(async (email: string, pass: string) => {
        if (!auth) throw new Error("Auth not initialized");
        await signInWithEmailAndPassword(auth, email, pass);
    }, []);

    const signUp = useCallback(async (email: string, pass: string, name: string, location: { prefecture: string, city: string }, age_group: string, gender: "male" | "female" | "other", invitationCode: string) => {
        if (!auth) throw new Error("Auth not initialized");
        if (!db) throw new Error("Database not connected");

        // Pre-validation: Check if invitation code is provided
        if (!invitationCode.trim()) {
            throw new Error("招待コードを入力してください");
        }

        // We do the validation INSIDE the transaction to ensure atomicity
        const invitationRef = doc(db, 'invitation_codes', invitationCode.trim());

        // PRE-CHECK: Validate Invitation Code BEFORE creating Auth User
        // This prevents "Login Screen Flash" caused by create->rollback cycle
        const invSnapPre = await getDoc(invitationRef);
        if (!invSnapPre.exists()) {
            throw new Error("招待コードが正しくありません");
        }
        if (invSnapPre.data()?.is_used) {
            throw new Error("この招待コードは既に使用されています");
        }

        // CRITICAL: Set isRegistering flag DIRECTLY to prevent ghost profile purge
        // We use window object directly to avoid React State async delays
        window.__isRegistering = true;
        setIsRegistering(true);

        try {
            const cred = await createUserWithEmailAndPassword(auth, email, pass);
            if (cred.user) {
                try {
                    // 1. Update Auth Profile
                    await updateProfile(cred.user, { displayName: name });
                    
                    // 2. Initialize Firestore Profile AND Stats atomically
                    const userRef = doc(db, 'users', cred.user.uid);
                    
                    await runTransaction(db, async (transaction) => {
                        // Check Invitation Code
                        const invSnap = await transaction.get(invitationRef);
                        if (!invSnap.exists()) {
                            throw new Error("招待コードが正しくありません");
                        }
                        if (invSnap.data()?.is_used) {
                            throw new Error("この招待コードは既に使用されています");
                        }
     
                        // Check user existence
                        const check = await transaction.get(userRef);
                        if (check.exists()) {
                            throw new Error("User profile already exists. Registration aborted to prevent overwrite.");
                        }
     
                        // 1. Consume Invitation Code
                        transaction.update(invitationRef, {
                            is_used: true,
                            used_by: cred.user!.uid,
                            used_at: serverTimestamp()
                        });

                        // 2. Create User
                        transaction.set(userRef, {
                            id: cred.user!.uid,
                            name: name,
                            email: email,
                            location: location,
                            age_group: age_group,
                            gender: gender,
                            balance: 2400,
                            xp: 0,
                            warmth: 0,
                            used_invitation_code: invitationCode.trim(),
                            last_updated: serverTimestamp()
                            // cycle_started_at is OMITTED to trigger First Birth Ritual
                        });

                        // 3. Increment Stats
                        if (location && location.prefecture && location.city) {
                            const cityKey = `${location.prefecture}_${location.city}`;
                            const statRef = doc(db!, 'location_stats', cityKey);
                            transaction.set(statRef, { count: increment(1) }, { merge: true });
                        }
                    });

                    // Registration successful - clear flag after small delay to allow Firestore sync
                    setTimeout(() => {
                                if (window.__isRegistering !== undefined) window.__isRegistering = false;
                                setIsRegistering(false);
                    }, 3000);
                } catch (error) {
                    // ATOMICITY ENFORCEMENT:
                    // If Firestore profile creation fails, we MUST delete the Auth user
                    // to prevent a "Zombie User" (Auth exists, Profile missing).
                    console.error("Sign up transaction failed. Rolling back Auth user.", error);
                    
                    try {
                        await cred.user.delete();
                        console.log("Auth user rollback successful.");
                    } catch (deleteErr) {
                        console.error("CRITICAL: Failed to rollback Auth user after Firestore error.", deleteErr);
                        // Double Tap: If delete fails (e.g., network), force sign-out locally to preventing 'Ghost Login'.
                        // This ensures the user returns to the 'guest' state (Nothingness).
                        if (auth) await auth.signOut();
                    }

                    // Clear isRegistering flag on error
                            if (window.__isRegistering !== undefined) window.__isRegistering = false;
                            setIsRegistering(false);

                    throw error;
                }
            }
        } catch (error) {
            // Clear isRegistering flag on any error
                    if (window.__isRegistering !== undefined) window.__isRegistering = false;
                    setIsRegistering(false);
            throw error;
        }
    }, [setIsRegistering]);

    const linkEmail = useCallback(async (email: string, pass: string) => {
        if (!auth || !auth.currentUser) throw new Error("No user to link");
        if (!db) throw new Error("Database not connected");

        const user = auth.currentUser;
        const credential = EmailAuthProvider.credential(email, pass);
        await linkWithCredential(user, credential);

        // SYNC: Update email in Firestore profile after successful link
        const userRef = doc(db, 'users', user.uid);
        await runTransaction(db, async (transaction) => {
            const snap = await transaction.get(userRef);
            if (snap.exists()) {
                transaction.update(userRef, {
                    email: email,
                    last_updated: serverTimestamp()
                });
            }
        });
    }, []);

    const signOut = useCallback(async () => {
        if (!auth) return;
        try {
            await firebaseSignOut(auth);
            setIsRegistering(false); // Reset on logout just in case
        } catch (error) {
            console.error("Error signing out:", error);
        }
    }, [setIsRegistering]);

    const updateUserPassword = async (newPassword: string) => {
        if (!auth || !auth.currentUser) throw new Error("Not authenticated");
        await updatePassword(auth.currentUser, newPassword);
    };

    const resetPassword = useCallback(async (email: string) => {
        if (!auth) throw new Error("Auth not initialized");
        // Sends a password reset email to the given address.
        // NOTE: If the email is not found, Firebase does not throw an error for security reasons (enumeration protection).
        await sendPasswordResetEmail(auth, email);
    }, []);

    const updateUserEmail = useCallback(async (newEmail: string, currentPassword: string) => {
        if (!auth || !auth.currentUser) throw new Error("Not authenticated");
        if (!auth.currentUser.email) throw new Error("No email on current user");
        if (!db) throw new Error("Database not connected");

        const user = auth.currentUser;

        // Step 1: Re-authenticate the user (required for sensitive operations)
        const credential = EmailAuthProvider.credential(
            user.email!,
            currentPassword
        );
        await reauthenticateWithCredential(user, credential);
        
        // Step 2: Update the email in Auth
        await updateEmail(user, newEmail);

        // Step 3: SYNC to Firestore
        const userRef = doc(db, 'users', user.uid);
        await runTransaction(db, async (transaction) => {
            const snap = await transaction.get(userRef);
            if (snap.exists()) {
                transaction.update(userRef, {
                    email: newEmail,
                    last_updated: serverTimestamp()
                });
            }
        });
    }, []);

    const deleteAccount = useCallback(async () => {
        if (!auth || !auth.currentUser || !db) throw new Error("Authentication or Database error");
        const user = auth.currentUser;

        // --- PROTECTION: LAST ADMIN CHECK ---
        // Ensure the system is never left without at least one DB administrator.
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists() && userSnap.data().role === 'admin') {
            const adminQuery = query(collection(db, 'users'), where('role', '==', 'admin'));
            const adminSnap = await getDocs(adminQuery);
            if (adminSnap.size <= 1) {
                throw new Error("あなたが最後の管理者です。他の方を管理者に任命してから退会してください。");
            }
        }

        try {
            // 1. Fetch all data needed for compensation & resignation analysis
            const wishesRef = collection(db, 'wishes');
            
            // Wishes created by user
            const qRequester = query(wishesRef, where('requester_id', '==', user.uid));
            const snapRequester = await getDocs(qRequester);
            
            // Wishes where user was involved (helper or applicant)
            const qInvolved = query(wishesRef, where('applicant_ids', 'array-contains', user.uid));
            const snapInvolved = await getDocs(qInvolved);

            // History subcollection (transaction logs)
            const historyRef = collection(db, 'users', user.uid, 'history');
            const historySnap = await getDocs(historyRef);

            // 2. Execute Transactional Death Ritual
            await runTransaction(db, async (transaction) => {
                const userRef = doc(db!, 'users', user.uid);
                
                // READ 1: User Profile
                const userSnap = await transaction.get(userRef);

                // --- GHOST OPTIMIZATION ---
                // If the profile document doesn't even exist, we skip the complex cleanup
                // and just proceed to Auth deletion.
                if (!userSnap.exists()) {
                    console.log("[deleteAccount] No profile found (Ghost). Proceeding to direct Auth deletion.");
                    return; 
                }

                // READ 2: Pre-fetch all Helper Profiles involved in active wishes
                // Must be done BEFORE any writes
                const helperMap = new Map();
                const activeWishes: { doc: QueryDocumentSnapshot<DocumentData>, data: DocumentData }[] = [];
                
                for (const wishDoc of snapRequester.docs) {
                    const wData = wishDoc.data();
                    if ((wData.status === 'in_progress' || wData.status === 'review_pending') && wData.helper_id) {
                        activeWishes.push({ doc: wishDoc, data: wData });
                        if (!helperMap.has(wData.helper_id)) {
                             const hRef = doc(db!, 'users', wData.helper_id);
                             const hSnap = await transaction.get(hRef);
                             helperMap.set(wData.helper_id, hSnap);
                        }
                    }
                }

                // READ 2.5: Pre-fetch all Requesters of wishes this user is helping (Scenario B: Helper deletion)
                const originalRequesterMap = new Map();
                for (const helpDoc of snapInvolved.docs) {
                    const wData = helpDoc.data();
                    if (wData.helper_id === user.uid && (wData.status === 'in_progress' || wData.status === 'review_pending')) {
                        if (!originalRequesterMap.has(wData.requester_id)) {
                            const rRef = doc(db!, 'users', wData.requester_id);
                            const rSnap = await transaction.get(rRef);
                            originalRequesterMap.set(wData.requester_id, rSnap);
                        }
                    }
                }

                // --- ALL READS COMPLETE. STARTING WRITES ---

                if (userSnap.exists()) {
                    const uData = userSnap.data();

                    // STEP 0: INVITATION CODE RECYCLING
                    const usedInvitationCode = uData.used_invitation_code;
                    if (usedInvitationCode) {
                        const invitationRef = doc(db!, 'invitation_codes', usedInvitationCode);
                        transaction.update(invitationRef, {
                            is_used: false,
                            used_by: null,
                            used_at: null
                        });
                    }

                    // STEP 0.5: DECREMENT LOCATION STATS
                    if (uData.location && uData.location.prefecture && uData.location.city) {
                        const cityKey = `${uData.location.prefecture}_${uData.location.city}`;
                        const statRef = doc(db!, 'location_stats', cityKey);
                        transaction.set(statRef, { count: increment(-1) }, { merge: true });
                    }
                }

                // === LAW 1: MASTER'S ABSENCE (Requester Deletes Account) ===
                // If the owner is gone, the wish is CRYSTALIZED (Deleted).
                let totalDecayMilli = 0;

                // User profile decay
                if (userSnap.exists()) {
                    const uData = userSnap.data();
                    const uBalance = uData.balance || 0;
                    const uCommitted = uData.committed_lm || 0;
                    const uLastUpdated = getMillis(uData.last_updated);

                    const uElapsedSec = ((Date.now() - uLastUpdated) / 1000) | 0;
                    const uBalanceDecayedMilli = calculateDecayedValue(toMilli(uBalance), uElapsedSec);
                    const uCommittedDecayedMilli = calculateDecayedValue(toMilli(uCommitted), uElapsedSec);
                    
                    totalDecayMilli += (toMilli(uBalance) - uBalanceDecayedMilli);
                    totalDecayMilli += (toMilli(uCommitted) - uCommittedDecayedMilli);
                }

                for (const wishDoc of snapRequester.docs) {
                    const wishData = wishDoc.data();
                    const wishInitialCost = wishData.cost || 0;
                    const wishElapsedSec = ((Date.now() - getMillis(wishData.created_at)) / 1000) | 0;
                    const wishDecayedMilli = calculateDecayedValue(toMilli(wishInitialCost), wishElapsedSec);
                    totalDecayMilli += (toMilli(wishInitialCost) - wishDecayedMilli);
                    
                    // Compensation if helper was in progress
                    if ((wishData.status === 'in_progress' || wishData.status === 'review_pending') && wishData.helper_id) {
                         const helperSnap = helperMap.get(wishData.helper_id);
                         if (helperSnap && helperSnap.exists()) {
                             const hData = helperSnap.data();
                             const hBalance = hData.balance || 0;
                             const hLastUpdated = getMillis(hData.last_updated);
                             const hElapsedSec = ((Date.now() - hLastUpdated) / 1000) | 0;
                             const hDecayedBalanceMilli = calculateDecayedValue(toMilli(hBalance), hElapsedSec);
                             totalDecayMilli += (toMilli(hBalance) - hDecayedBalanceMilli);
                             
                             const uData = userSnap.data();
                             const uLastUpdatedForComp = getMillis(uData?.last_updated);
                             const uElapsedSecForComp = ((Date.now() - uLastUpdatedForComp) / 1000) | 0;
                             const uDecayedBalanceMilli = calculateDecayedValue(toMilli(uData?.balance || 0), uElapsedSecForComp);
                             
                             const actualPaymentMilli = Math.min(wishDecayedMilli, uDecayedBalanceMilli);
                             const actualPayment = fromMilli(actualPaymentMilli);

                             // Overflow handling for helper
                             const hRawNewMilli = hDecayedBalanceMilli + actualPaymentMilli;
                             const hCappedMilli = Math.min(hRawNewMilli, WORLD_CONSTANTS.MAX_VESSEL_CAPACITY_MILLI);
                             const hOverflowMilli = Math.max(0, hRawNewMilli - WORLD_CONSTANTS.MAX_VESSEL_CAPACITY_MILLI);
                             totalDecayMilli += hOverflowMilli;

                             transaction.update(helperSnap.ref, {
                                 balance: fromMilli(hCappedMilli),
                                 pending_interruption_notification: "依頼主様がアプリを離れられたため（退会）、感謝のLmが補償として送り届けられました。",
                                 last_updated: serverTimestamp()
                             });

                             // Log compensation before deletion (Crystallized names)
                             const txPropRef = doc(collection(db!, 'transactions'));
                             const currentUData = userSnap.data();
                             const currentUName = currentUData?.name || "退会した奏者";

                             transaction.set(txPropRef, {
                                 type: 'COMPENSATION',
                                 amount: actualPayment,
                                 sender_id: user.uid,
                                 sender_name: currentUName, 
                                 recipient_id: wishData.helper_id,
                                 recipient_name: hData.name || "助け手",
                                 wish_title: wishData.content,
                                 wish_id: wishDoc.id,
                                 created_at: serverTimestamp(),
                                 description: "依頼主が退会されたため、これまでの感謝としてLmが届けられました。"
                             });
                         }
                    }

                    // PHYSICAL DELETION (Crystallyzation)
                    transaction.delete(wishDoc.ref);
                }

                // Global Stats Update
                if (totalDecayMilli > 0) {
                    const globalStatsRef = doc(db!, WORLD_CONSTANTS.GLOBAL_METABOLISM_PATH);
                    transaction.set(globalStatsRef, {
                        total_decayed_stats: increment(fromMilli(totalDecayMilli)),
                        updated_at: serverTimestamp()
                    }, { merge: true });
                }

                // === LAW 2: WISH VALIDITY (Helper Deletes Account) ===
                // If the requester is still here but the helper leaves, the wish is RECAST (Open).
                for (const helpDoc of snapInvolved.docs) {
                    const wData = helpDoc.data();
                    
                    // Remove from applicants
                    const updatedApplicants = (wData.applicants || []).filter((a: { id: string }) => a.id !== user.uid);
                    const updatedApplicantIds = (wData.applicant_ids || []).filter((id: string) => id !== user.uid);

                    const updates: Record<string, unknown> = {
                        applicants: updatedApplicants,
                        applicant_ids: updatedApplicantIds,
                        updated_at: serverTimestamp(),
                    };

                    // If user was the active helper, reset wish to open
                    if (wData.helper_id === user.uid) {
                        updates.status = 'open';
                        updates.helper_id = deleteField();
                        updates.helper_name = deleteField();
                        updates.accepted_at = deleteField();
                        updates.system_note = "お相手の退会に伴い、この願いは再び募集へ戻りました。";

                        // Notify Requester
                        const rRef = doc(db!, 'users', wData.requester_id);
                        transaction.update(rRef, {
                            pending_interruption_notification: "助け手様がアプリを離れられたため（退会）、願いが再び募集に戻りました。Lmは安全です。",
                            last_updated: serverTimestamp()
                        });
                    }

                    transaction.update(helpDoc.ref, updates);
                }

                // C. Delete History Subcollection
                for (const historyDoc of historySnap.docs) {
                    transaction.delete(historyDoc.ref);
                }

                // D. Delete Profile
                if (userSnap.exists()) {
                    transaction.delete(userRef);
                }
            });

            // 3. Finally, Delete Auth User
            await user.delete();
            console.log("Account Deletion Complete: Requester wishes compensated, Helper roles resigned.");
        } catch (error) {
             console.error("Account deletion failed:", error);
             throw error;
        }
    }, []);

    const reauthenticate = useCallback(async (password: string) => {
        if (!auth || !auth.currentUser) throw new Error("Not authenticated");
        if (!auth.currentUser.email) throw new Error("No email to re-authenticate with");
        
        const credential = EmailAuthProvider.credential(
            auth.currentUser.email,
            password
        );
        await reauthenticateWithCredential(auth.currentUser, credential);
    }, []);

    return {
        user,
        isAdmin,
        loading,
        isRegistering,
        signIn,
        signUp,
        linkEmail,
        signOut,
        deleteAccount,
        updateUserPassword,
        updateUserEmail,
        resetPassword,
        reauthenticate 
    };
};