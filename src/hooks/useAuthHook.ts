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
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
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

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signIn = async (email: string, pass: string) => {
        if (!auth) throw new Error("Auth not initialized");
        await signInWithEmailAndPassword(auth, email, pass);
    };

    const signUp = async (email: string, pass: string, name: string, location: { prefecture: string, city: string }) => {
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
                    balance: 0,
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

        // 1. Tombstone: Anonymize User Profile (The Departure)
        const userRef = doc(db, 'users', user.uid);
        
        // Overwrite personal data while keeping ID for referential integrity
        await setDoc(userRef, {
            name: "名もなき住人", // Anonymized
            balance: 0, // Assets Burned
            xp: 0, // Reputation Reset (Optional, but requested "erasure")
            warmth: 0,
            completed_contracts: 0, 
            created_contracts: 0,
            bio: null,
            is_deleted: true,
            deleted_at: serverTimestamp(),
            last_updated: serverTimestamp()
        }, { merge: true }); // Merge to keep ID, but overwrite specified fields

        // 2. Hard Delete Auth (Irreversible)
        try {
            await user.delete(); 
            // Note: This automatically signs out.
        } catch (authError) {
             console.error("Auth Delete Failed (Requires recent login):", authError);
             // If sensitive, prompt re-login. For now, we accept Firestore anonymization as 'good enough' if Auth fails.
             // But we should try to sign out at least.
             await signOut();
             throw authError; // Let UI handle "Requires Login" error if strictly needed
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