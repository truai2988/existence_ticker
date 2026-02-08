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
import { doc, deleteDoc, serverTimestamp, runTransaction, increment, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useAuthContext } from '../contexts/AuthContextDefinition';


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

                    // Check user existence (rare race)
                    const check = await transaction.get(userRef);
                    if (check.exists()) return;
 
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
                        last_updated: serverTimestamp(),
                        cycle_started_at: serverTimestamp()
                    });

                    // 3. Increment Stats
                    if (location && location.prefecture && location.city) {
                        const cityKey = `${location.prefecture}_${location.city}`;
                        const statRef = doc(db!, 'location_stats', cityKey);
                        transaction.set(statRef, { count: increment(1) }, { merge: true });
                    }
                });
            } catch (error) {
                // If anything fails during Firestore setup, we technically have a "ghost" auth user.
                // In a production app, we might want to delete the auth user here,
                // but for now we'll throw and let the UI handle it.
                console.error("Sign up transaction failed:", error);
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
        if (!auth || !auth.currentUser || !user) throw new Error("Not authenticated");
        if (!db) throw new Error("Database not connected");

        try {
            // 1. Delete all wishes created by the user
            // We must do this BEFORE deleting the Auth user, because Firestore rules likely restrict deletion to the owner.
            const batch = writeBatch(db);

            // 0. Reset wishes where user is a HELPER
            // If the user was helping someone, we must "resign" from that role so the wish becomes open again.
            const helpingRef = collection(db, 'wishes');
            const qHelping = query(helpingRef, where('helper_id', '==', user.uid));
            const helpingSnap = await getDocs(qHelping);
            
            helpingSnap.forEach((doc) => {
                batch.update(doc.ref, {
                    helper_id: null,
                    status: 'open',
                    updated_at: serverTimestamp()
                });
            });

            // 1. Delete all wishes created by the user (Requester)
            const wishesRef = collection(db, 'wishes');
            const q = query(wishesRef, where('requester_id', '==', user.uid));
            const snapshot = await getDocs(q);
            
            snapshot.forEach((doc) => {
                batch.delete(doc.ref);
            });

            // 2. Delete History Subcollection
            const historyRef = collection(db, 'users', user.uid, 'history');
            const historySnap = await getDocs(historyRef);
            historySnap.forEach((doc) => {
                batch.delete(doc.ref);
            });

            await batch.commit();

            // 3. Delete Firestore User Profile
            const userRef = doc(db, 'users', user.uid);
            await deleteDoc(userRef);
            
            // 4. Finally, Delete Auth User (Irreversible and strips permissions)
            await user.delete(); 

            console.log("Account, Profile, History, and Wishes deleted successfully.");
        } catch (error) {
             const firebaseError = error as { code?: string };
             if (firebaseError.code === 'auth/requires-recent-login') {
                 alert("セキュリティ保護のため、退会には再ログインが必要です。\n一度ログアウトしてから再度ログインし、すぐに退会をやり直してください。");
             }
             console.error("Account deletion failed:", error);
             throw error; 
        }
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
        resetPassword
    };
};