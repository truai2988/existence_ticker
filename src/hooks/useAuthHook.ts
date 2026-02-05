import { useState, useEffect } from 'react';
import { 
    User, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut as firebaseSignOut, 
    onAuthStateChanged,
    updateProfile,
    linkWithCredential,
    EmailAuthProvider,
    updatePassword,
    sendPasswordResetEmail,
    updateEmail,
    reauthenticateWithCredential
} from 'firebase/auth';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
// collection, query, where, getDocs, deleteDoc, writeBatch removed


export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth) {
            setLoading(false);
            return;
        }

        console.log("[useAuth] Initializing onAuthStateChanged...");
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            console.log("[useAuth] Auth state changed:", currentUser ? `User: ${currentUser.uid}` : "No user");
            setUser(currentUser);
            setLoading(false);
        }, (error) => {
            console.error("[useAuth] Auth error:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signIn = async (email: string, pass: string) => {
        if (!auth) throw new Error("Auth not initialized");
        await signInWithEmailAndPassword(auth, email, pass);
    };

    const signUp = async (email: string, pass: string, name: string, location: { prefecture: string, city: string }, ageGroup: string) => {
        if (!auth) throw new Error("Auth not initialized");
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        if (cred.user) {
            // 1. Update Auth Profile
            await updateProfile(cred.user, { displayName: name });
            
            // 2. Initialize Firestore Profile immediately to ensure name is correct
            // (Prevents race condition where useProfile sees null displayName)
            if (db) {
                await setDoc(doc(db, 'users', cred.user.uid), {
                    id: cred.user.uid,
                    name: name,
                    location: location,
                    ageGroup: ageGroup,
                    balance: 2400,
                    xp: 0,
                    warmth: 0,
                    last_updated: serverTimestamp()
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