import { doc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Force deletes a user and all their associated data (wishes).
 * Use this when the Auth account is already gone but Firestore data remains.
 * @param uid The User ID (document ID) to delete.
 */
export const forceDeleteUser = async (uid: string) => {
    if (!db) {
        console.error("Database not connected");
        return;
    }

    if (!uid) {
        console.error("Please provide a User ID: deleteUser('UID')");
        return;
    }

    console.log(`Starting forced deletion for user: ${uid}...`);

    try {
        const batch = writeBatch(db);
        let count = 0;

        // 1. Find and delete user's wishes
        const wishesRef = collection(db, 'wishes');
        const q = query(wishesRef, where('requester_id', '==', uid));
        const wishSnap = await getDocs(q);

        wishSnap.forEach((doc) => {
            batch.delete(doc.ref);
            count++;
        });

        // 2. Delete the User Profile
        const userRef = doc(db, 'users', uid);
        batch.delete(userRef);

        // 3. Delete Subcollections (History)
        // Firestore requires deleting docs within subcollections manually
        const historyRef = collection(db, 'users', uid, 'history');
        const historySnap = await getDocs(historyRef);
        historySnap.forEach(doc => {
            batch.delete(doc.ref);
            count++;
        });

        await batch.commit();

        console.log(`Successfully deleted user profile, history, and ${count} associated wishes.`);
        console.log("Please refresh the page to see changes.");

    } catch (error) {
        console.error("Force deletion failed:", error);
    }
};

/**
 * Scans for traces of users in transactions and invites to find ghost UIDs.
 */
export const findGhosts = async () => {
    if (!db) return;
    console.log("Scanning for ghosts...");
    
    try {
        const knownUids = new Set<string>();
        const usersSnap = await getDocs(collection(db, 'users'));
        usersSnap.forEach(d => knownUids.add(d.id));
        
        console.log(`Live Users: ${knownUids.size}`, Array.from(knownUids));

        const ghosts = new Set<string>();

        // Check Transactions
        const txSnap = await getDocs(collection(db, 'transactions'));
        txSnap.forEach(d => {
            const data = d.data();
            if (data.sender_id && !knownUids.has(data.sender_id)) ghosts.add(data.sender_id);
            if (data.receiver_id && !knownUids.has(data.receiver_id)) ghosts.add(data.receiver_id);
        });

        // Check Invitations
        const invSnap = await getDocs(collection(db, 'invitation_codes'));
        invSnap.forEach(d => {
            const data = d.data();
            if (data.used_by && !knownUids.has(data.used_by)) ghosts.add(data.used_by);
        });

        console.log("Ghost UIDs found (in traces but no profile):", Array.from(ghosts));
        
    } catch (e) {
        console.error("Ghost hunt failed", e);
    }
};

/**
 * Lists all users in the database to help identify ghosts.
 */
export const listUsers = async () => {
    if (!db) return;
    console.log("Fetching user list...");
    try {
        const usersRef = collection(db, 'users');
        const snap = await getDocs(usersRef);
        console.log(`Found ${snap.size} users:`);
        snap.forEach(doc => {
            const d = doc.data();
            console.log(`- Name: ${d.name}, UID: ${doc.id}, Updated: ${d.last_updated?.toDate?.() || 'unknown'}`);
        });
    } catch (e) {
        console.error("Failed to list users", e);
    }
};

/**
 * Lists used invitation codes to find UIDs of past users.
 */
export const listInvitations = async () => {
    if (!db) return;
    console.log("Fetching invitation codes...");
    try {
        const invRef = collection(db, 'invitation_codes');
        const snap = await getDocs(invRef);
        console.log(`Found ${snap.size} codes:`);
        snap.forEach(doc => {
            const d = doc.data();
            if (d.is_used) {
                console.log(`- Code: ${doc.id}, Used By UID: ${d.used_by}, At: ${d.used_at?.toDate?.() || 'unknown'}`);
            } else {
                console.log(`- Code: ${doc.id} (Unused)`);
            }
        });
    } catch (e) {
        console.error("Failed to list invitations", e);
    }
};

/**
 * Lists all wishes to identify the requester UID of "ghost" cards.
 */
export const listWishes = async () => {
    if (!db) return;
    console.log("Fetching wishes...");
    try {
        const wishesRef = collection(db, 'wishes');
        const snap = await getDocs(wishesRef);
        console.log(`Found ${snap.size} wishes:`);
        
        for (const docSnap of snap.docs) {
            const w = docSnap.data();
            const uid = w.requester_id;
            
             console.log(`- Wish: "${w.content}", RequesterUID: ${uid}, Status: ${w.status}, ID: ${docSnap.id}`);
        }
    } catch (e) {
        console.error("Failed to list wishes", e);
    }
};
