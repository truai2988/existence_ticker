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
import { doc, serverTimestamp, runTransaction, increment, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useAuthContext } from '../contexts/AuthContextDefinition';
import { calculateDecayedValue, toMilli, fromMilli, WORLD_CONSTANTS } from '../logic/worldPhysics';


export const useAuth = () => {
    // Consume Singleton State
    const { user, loading } = useAuthContext();

    const signIn = async (email: string, pass: string) => {
        if (!auth) throw new Error("Auth not initialized");
        await signInWithEmailAndPassword(auth, email, pass);
    };

    const signUp = async (email: string, pass: string, name: string, location: { prefecture: string, city: string }, age_group: string, gender: "male" | "female" | "other", invitationCode: string) => {
        if (!auth) throw new Error("Auth not initialized");
        if (!db) throw new Error("Database not connected");

        // Pre-validation: Check if invitation code is provided
        if (!invitationCode.trim()) {
            throw new Error("招待コードを入力してください");
        }

        // We do the validation INSIDE the transaction to ensure atomicity
        const invitationRef = doc(db, 'invitation_codes', invitationCode.trim());

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
                    // This is a catastrophic state (Orphaned Auth), but rare.
                }

                throw error;
            }
        }
    };

    const linkEmail = async (email: string, pass: string) => {
        if (!auth || !auth.currentUser) throw new Error("No user to link");
        const credential = EmailAuthProvider.credential(email, pass);
        await linkWithCredential(auth.currentUser, credential);
        // User remains logged in but is no longer anonymous
    };

    const signOut = async () => {
        if (!auth) return;
        try {
            await firebaseSignOut(auth);
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    const updateUserPassword = async (newPassword: string) => {
        if (!auth || !auth.currentUser) throw new Error("Not authenticated");
        await updatePassword(auth.currentUser, newPassword);
    };

    const resetPassword = async (email: string) => {
        if (!auth) throw new Error("Auth not initialized");
        // Sends a password reset email to the given address.
        // NOTE: If the email is not found, Firebase does not throw an error for security reasons (enumeration protection).
        await sendPasswordResetEmail(auth, email);
    };

    const updateUserEmail = async (newEmail: string, currentPassword: string) => {
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
    };

    const deleteAccount = async () => {
        if (!auth || !auth.currentUser || !db) throw new Error("Authentication or Database error");
        const user = auth.currentUser;

        try {
            // 1. Fetch all data needed for compensation & resignation analysis
            const wishesRef = collection(db, 'wishes');
            
            // Wishes created by user
            const qRequester = query(wishesRef, where('requester_id', '==', user.uid));
            const snapRequester = await getDocs(qRequester);
            
            // Wishes helped by user
            const qHelping = query(wishesRef, where('helper_id', '==', user.uid));
            const snapHelping = await getDocs(qHelping);

            // History subcollection (transaction logs)
            const historyRef = collection(db, 'users', user.uid, 'history');
            const historySnap = await getDocs(historyRef);

            // 2. Execute Transactional Death Ritual
            await runTransaction(db, async (transaction) => {
                const userRef = doc(db!, 'users', user.uid);
                const userSnap = await transaction.get(userRef);

                let requesterBalance = 0;
                let requesterName = "Anonymous";
                let lastUpdated = serverTimestamp();

                if (userSnap.exists()) {
                    const uData = userSnap.data();
                    requesterBalance = uData.balance || 0;
                    requesterName = uData.name || "Anonymous";
                    lastUpdated = uData.last_updated;

                    // STEP 0: INVITATION CODE RECYCLING (還流の理)
                    // Release the invitation code for reuse when user departs
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
                }

                const decayedBalance = calculateDecayedValue(requesterBalance, lastUpdated);
                let currentPoolMilli = toMilli(decayedBalance);

                // A. Process Requester Wishes (Compensation + Cleanup)
                for (const wishDoc of snapRequester.docs) {
                    const wishData = wishDoc.data();

                    if (wishData.status === 'in_progress' || wishData.status === 'review_pending') {
                        const helperId = wishData.helper_id;
                        if (helperId) {
                            const helperRef = doc(db!, 'users', helperId);
                            const helperSnap = await transaction.get(helperRef);

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

                                transaction.update(helperRef, {
                                    balance: fromMilli(hCappedMilli),
                                    last_updated: serverTimestamp()
                                });

                                const txPropRef = doc(collection(db!, 'transactions'));
                                transaction.set(txPropRef, {
                                    type: 'COMPENSATION',
                                    amount: actualPayment,
                                    sender_id: user.uid,
                                    sender_name: requesterName,
                                    recipient_id: helperId,
                                    recipient_name: hName,
                                    wish_title: wishData.content,
                                    wish_id: wishDoc.id,
                                    created_at: serverTimestamp(),
                                    description: actualPayment < wishDecayedValue ? "account_deleted (Bankruptcy Partial Payment)" : "account_deleted"
                                });
                            }
                        }
                    }
                    transaction.delete(wishDoc.ref);
                }

                // B. Process Helping Wishes (Resign)
                for (const helpDoc of snapHelping.docs) {
                    transaction.update(helpDoc.ref, {
                        helper_id: null,
                        status: 'open',
                        updated_at: serverTimestamp(),
                        system_note: '（隣人が旅立ったため、再び募集を開始しました）'
                    });
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
    };

    const reauthenticate = async (password: string) => {
        if (!auth || !auth.currentUser) throw new Error("Not authenticated");
        if (!auth.currentUser.email) throw new Error("No email to re-authenticate with");
        
        const credential = EmailAuthProvider.credential(
            auth.currentUser.email,
            password
        );
        await reauthenticateWithCredential(auth.currentUser, credential);
    };

    return {
        user,
        loading,
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