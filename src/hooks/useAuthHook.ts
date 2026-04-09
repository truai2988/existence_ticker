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
import { doc, serverTimestamp, runTransaction, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from '../lib/firebase';
import { useAuthContext } from '../contexts/AuthContextDefinition';
import { useCallback } from 'react';


export const useAuth = () => {
    // Consume Singleton State
    const { user, isAdmin, loading, isRegistering, setIsRegistering } = useAuthContext();
    
    // ... (keep other functions)

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

                        // 3. Stats (Managed by trigger)
                        // Manual increment removed to prevent double-counting.
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
        if (!auth || !auth.currentUser) throw new Error("Authentication error");
        if (!functions) throw new Error("Functions not initialized");
        
        try {
            const deleteAccountFn = httpsCallable(functions, 'deleteAccount');
            await deleteAccountFn();
            
            // Sign out locally to clear state
            await firebaseSignOut(auth);
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