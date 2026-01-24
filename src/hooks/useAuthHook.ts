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
    sendPasswordResetEmail
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

    const signUp = async (email: string, pass: string, name: string) => {
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

    const deleteAccount = async () => {
        if (!auth || !auth.currentUser || !user) throw new Error("Not authenticated");
        if (!db) throw new Error("Database not connected");

        // 1. Mark wishes as "Departure" (Optional: or keep distinct/anonymize)
        // For Soft Delete, we usually preserve history but mark the user as gone.
        // Let's Keep wishes as is, or mark user status.
        
        // 2. Soft Delete User Profile (The Departure)
        // Instead of erasing, we mark as departed. 
        // Data is preserved for recovery.
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, { 
            is_deleted: true,
            deleted_at: serverTimestamp(),
            // Preserve other fields? setDoc overwrites unless merge used. 
            // We want to keep name/xp for history? 
            // Let's use update() to add flags, or setDoc with merge.
            // Actually, let's keep it simple: Just mark deleted.
        }, { merge: true });

        // 3. DO NOT Delete Auth Account (So it can be recovered/audited)
        // await auth.currentUser.delete();
        
        // 4. Sign Out
        await signOut();
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
        resetPassword
    };
};