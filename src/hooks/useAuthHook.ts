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
import { doc, deleteDoc, serverTimestamp, runTransaction, increment } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useAuthContext } from '../contexts/AuthContextDefinition';


export const useAuth = () => {
    // Consume Singleton State
    const { user, loading } = useAuthContext();

    const signIn = async (email: string, pass: string) => {
        if (!auth) throw new Error("Auth not initialized");
        await signInWithEmailAndPassword(auth, email, pass);
    };

    const signUp = async (email: string, pass: string, name: string, location: { prefecture: string, city: string }, age_group: string) => {
        if (!auth) throw new Error("Auth not initialized");
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        if (cred.user) {
            // 1. Update Auth Profile
            await updateProfile(cred.user, { displayName: name });
            
            // 2. Initialize Firestore Profile AND Stats atomically
            if (db) {
                const userRef = doc(db, 'users', cred.user.uid);
                
                await runTransaction(db, async (transaction) => {
                    // Check existence (rare race)
                    const check = await transaction.get(userRef);
                    if (check.exists()) return;

                    // Create User
                    transaction.set(userRef, {
                        id: cred.user!.uid,
                        name: name,
                        location: location,
                        age_group: age_group,
                        balance: 2400,
                        xp: 0,
                        warmth: 0,
                        last_updated: serverTimestamp(),
                        cycle_started_at: serverTimestamp() // Set cycle start
                    });

                    // Increment Stats (Strict OnCreate Logic)
                    if (location && location.prefecture && location.city) {
                        const cityKey = `${location.prefecture}_${location.city}`;
                        const statRef = doc(db!, 'location_stats', cityKey);
                        transaction.set(statRef, { count: increment(1) }, { merge: true });
                    }
                });
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

        // Firebase Auth "requires-recent-login" is a common security hurdle.
        // We try to delete Auth FIRST because it's the most likely to fail due to security.
        // If we delete Firestore first and Auth fails, we leave an inconsistent state.
        try {
            // 1. Hard Delete Auth (Irreversible)
            await user.delete(); 
            
            // 2. If Auth Deletion succeeds, clean up Firestore
            const userRef = doc(db, 'users', user.uid);
            await deleteDoc(userRef);
            
            console.log("Account and Profile deleted successfully.");
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