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
import { doc, serverTimestamp, runTransaction, increment, collection, query, where, getDocs, getDoc, QueryDocumentSnapshot, DocumentData, FieldValue } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useAuthContext } from '../contexts/AuthContextDefinition';
import { calculateDecayedValue, toMilli, fromMilli, WORLD_CONSTANTS } from '../logic/worldPhysics';
import { useCallback } from 'react';


export const useAuth = () => {
    // Consume Singleton State
    const { user, loading, isRegistering, setIsRegistering } = useAuthContext();

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
        const credential = EmailAuthProvider.credential(email, pass);
        await linkWithCredential(auth.currentUser, credential);
        // User remains logged in but is no longer anonymous
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
        
        // Step 1: Re-authenticate the user (required for sensitive operations)
        const credential = EmailAuthProvider.credential(
            auth.currentUser.email,
            currentPassword
        );
        await reauthenticateWithCredential(auth.currentUser, credential);
        
        // Step 2: Update the email
        await updateEmail(auth.currentUser, newEmail);
    }, []);

    const deleteAccount = useCallback(async () => {
        if (!auth || !auth.currentUser || !db) throw new Error("Authentication or Database error");
        const user = auth.currentUser;

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

                let requesterBalance = 0;
                let lastUpdated = serverTimestamp();

                if (userSnap.exists()) {
                    const uData = userSnap.data();
                    requesterBalance = uData.balance || 0;
                    lastUpdated = uData.last_updated;

                    // STEP 0: INVITATION CODE RECYCLING
                    const usedInvitationCode = uData.used_invitation_code;
                    if (usedInvitationCode) {
                        const invitationRef = doc(db!, 'invitation_codes', usedInvitationCode);
                        transaction.update(invitationRef, {
                            is_used: false,
                            used_by: null,
                            used_at: null
                        });
                        console.log(`Invitation code "${usedInvitationCode}" released for reuse.`);
                    }

                    // STEP 0.5: DECREMENT LOCATION STATS
                    if (uData.location && uData.location.prefecture && uData.location.city) {
                        const cityKey = `${uData.location.prefecture}_${uData.location.city}`;
                        const statRef = doc(db!, 'location_stats', cityKey);
                        transaction.set(statRef, { count: increment(-1) }, { merge: true });
                        console.log(`Location stats decremented for ${cityKey}`);
                    }
                }

                const decayedBalance = calculateDecayedValue(requesterBalance, lastUpdated);
                let currentPoolMilli = toMilli(decayedBalance);

                // A. Process Requester Wishes (Interruption + Atomic Lm Transfer to Helper)
                for (const { doc: wishDoc, data: wishData } of activeWishes) {
                    const helperId = wishData.helper_id;
                    if (helperMap.has(helperId)) {
                        const helperSnap = helperMap.get(helperId);
                        if (helperSnap.exists()) {
                            const hData = helperSnap.data();
                            const hDecayedBalance = calculateDecayedValue(hData.balance || 0, hData.last_updated);
                            const hName = hData.name || "Helper";

                            const bounty = wishData.cost || 0;
                            const wishDecayedValue = calculateDecayedValue(bounty, wishData.created_at);

                            const actualPaymentMilli = Math.min(toMilli(wishDecayedValue), currentPoolMilli);
                            const actualPayment = fromMilli(actualPaymentMilli);
                            currentPoolMilli -= actualPaymentMilli;

                            const hNewMilli = toMilli(hDecayedBalance) + actualPaymentMilli;
                            const hCappedMilli = Math.min(hNewMilli, WORLD_CONSTANTS.MAX_VESSEL_CAPACITY_MILLI);

                            transaction.update(helperSnap.ref, {
                                balance: fromMilli(hCappedMilli),
                                last_updated: serverTimestamp()
                            });

                            const txPropRef = doc(collection(db!, 'transactions'));
                            transaction.set(txPropRef, {
                                type: 'COMPENSATION',
                                amount: actualPayment,
                                sender_id: user.uid,
                                sender_name: "退会された方", // Masked in log for Scenario B
                                recipient_id: helperId,
                                recipient_name: hName,
                                wish_title: wishData.content,
                                wish_id: wishDoc.id,
                                created_at: serverTimestamp(),
                                description: "account_deleted"
                            });

                            // Scenario B: Requester deletion
                            transaction.update(wishDoc.ref, {
                                status: "interrupted",
                                requester_name: "退会された方",
                                cancel_reason: "account_deleted",
                                cancelled_at: serverTimestamp(),
                                val_at_fulfillment: actualPayment // Record the compensation
                            });
                        }
                    }
                }

                // Process OTHER requester wishes (Open/Expired/etc.) - Status to interrupted or just mask?
                // For simplicity and historical record, let's mark all as interrupted and mask.
                for (const wishDoc of snapRequester.docs) {
                     const wishData = wishDoc.data();
                     // Only update if not already processed in activeWishes loop
                     if (!activeWishes.some(aw => aw.doc.id === wishDoc.id)) {
                         transaction.update(wishDoc.ref, {
                             status: wishData.status === 'open' ? 'interrupted' : wishData.status,
                             requester_name: "退会された方",
                             requester_id: user.uid, // Keep ID for indexing but UI hides it
                             cancelled_at: serverTimestamp()
                         });
                     }
                }

                // B. Process Involved Wishes (Helper deletion Scenario)
                for (const helpDoc of snapInvolved.docs) {
                    const wData = helpDoc.data();
                    
                    // Always remove from applicant list
                    const updatedApplicants = (wData.applicants || []).filter((a: { id: string }) => a.id !== user.uid);
                    const updatedApplicantIds = (wData.applicant_ids || []).filter((id: string) => id !== user.uid);

                    const updates: {
                        applicants: { id: string; name: string; trust_score?: number }[];
                        applicant_ids: string[];
                        updated_at: FieldValue;
                        status?: string;
                        helper_name?: string;
                        cancel_reason?: string;
                        cancelled_at?: FieldValue;
                    } = {
                        applicants: updatedApplicants,
                        applicant_ids: updatedApplicantIds,
                        updated_at: serverTimestamp(),
                    };

                    // Scenario B: Helper deletion (If active worker)
                    if (wData.helper_id === user.uid && (wData.status === 'in_progress' || wData.status === 'review_pending')) {
                        updates.status = 'interrupted';
                        updates.helper_name = "退会された方";
                        updates.cancel_reason = "helper_deleted";
                        updates.cancelled_at = serverTimestamp();
                        
                        // Atomically release requester's committed_lm
                        const requesterSnap = originalRequesterMap.get(wData.requester_id);
                        if (requesterSnap && requesterSnap.exists()) {
                            const rData = requesterSnap.data();
                            const rLastUpdated = rData.last_updated;
                            const rCommittedLm = rData.committed_lm || 0;
                            const wishCost = wData.cost || 0;

                            transaction.update(requesterSnap.ref, {
                                committed_lm: Math.max(0, calculateDecayedValue(rCommittedLm, rLastUpdated) - wishCost),
                                last_updated: serverTimestamp()
                            });

                            // Log Transaction for Scenario B (Helper deletion)
                            const txRef = doc(collection(db!, 'transactions'));
                            transaction.set(txRef, {
                                type: 'WISH_INTERRUPTED',
                                amount: 0,
                                sender_id: user.uid,
                                sender_name: "退会された方",
                                recipient_id: wData.requester_id,
                                recipient_name: rData.name || "Requester",
                                wish_title: wData.content,
                                wish_id: helpDoc.id,
                                created_at: serverTimestamp(),
                                description: "お相手が退会されたため、願いは終了となりました。予約していたLmは、あなたの手元に戻りました。"
                            });
                        }
                    }

                    transaction.update(helpDoc.ref, updates);
                }

                // C. Delete History Subcollection
                for (const historyDoc of historySnap.docs) {
                    transaction.delete(historyDoc.ref);
                }

                // D. Delete Profile (Physical deletion, but wishes remain as 'interrupted')
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