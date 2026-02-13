import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

// Global cache to prevent redundant deep searches for the same entity in a session
const recoveryCache: Record<string, string> = {};
const pendingSearches: Record<string, Promise<string | null>> = {};

const mechanicalLabels = ["退会された方", "退会した奏者", "Anonymous Soul", "Anonymous Helper", "Anonymous", "Unknown", "Helper", "Requester"];

export function useDeepMemoryRecovery(uid: string | null) {
    const [recoveredName, setRecoveredName] = useState<string | null>( recoveryCache[uid || ''] || null);
    const [isRecovering, setIsRecovering] = useState(false);

    useEffect(() => {
        if (!uid || recoveryCache[uid] || !db) return;

        // If a search is already in progress for this UID, wait for it
        if (uid in pendingSearches) {
            setIsRecovering(true);
            pendingSearches[uid]!.then(name => {
                if (name) setRecoveredName(name);
                setIsRecovering(false);
            });
            return;
        }

        const runRecovery = async () => {
            if (!db) return;
            setIsRecovering(true);
            const searchPromise = (async () => {
                try {
                    const txRef = collection(db, 'transactions');
                    
                    // Strategy: Search sent and received records for ANY valid snapshot
                    // We don't bother with ordering, we just want ONE good name
                    const [sentSnap, receivedSnap] = await Promise.all([
                        getDocs(query(txRef, where('sender_id', '==', uid), limit(5))),
                        getDocs(query(txRef, where('recipient_id', '==', uid), limit(5)))
                    ]);

                    const allDocs = [...sentSnap.docs, ...receivedSnap.docs];
                    console.log(`[DeepRecovery] Found ${allDocs.length} potential records for ${uid}`);
                    
                    for (const doc of allDocs) {
                        const data = doc.data();
                        const sName = data.sender_name;
                        const rName = data.recipient_name;
                        const sId = data.sender_id;
                        const rId = data.recipient_id;

                        if (sId === uid && sName && !mechanicalLabels.includes(sName)) {
                            console.log(`[DeepRecovery] Recovered name "${sName}" from log ${doc.id}`);
                            recoveryCache[uid] = sName;
                            return sName;
                        }
                        if (rId === uid && rName && !mechanicalLabels.includes(rName)) {
                            console.log(`[DeepRecovery] Recovered name "${rName}" from log ${doc.id}`);
                            recoveryCache[uid] = rName;
                            return rName;
                        }
                    }
                    console.log(`[DeepRecovery] No valid name found for ${uid} in samples.`);
                } catch (e) {
                    console.error("Deep recovery failed for", uid, e);
                }
                return null;
            })();

            pendingSearches[uid] = searchPromise;
            const name = await searchPromise;
            if (name) setRecoveredName(name);
            setIsRecovering(false);
            delete pendingSearches[uid]; // Cleanup once resolved
        };

        runRecovery();
    }, [uid]);

    return { recoveredName, isRecovering };
}
