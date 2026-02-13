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
                    const wishRef = collection(db, 'wishes');
                    
                    // Strategy: Search transactions (sent/received) AND wishes (requested/helped)
                    const [sentSnap, receivedSnap, requestedSnap, helpedSnap] = await Promise.all([
                        getDocs(query(txRef, where('sender_id', '==', uid), limit(10))),
                        getDocs(query(txRef, where('recipient_id', '==', uid), limit(10))),
                        getDocs(query(wishRef, where('requester_id', '==', uid), limit(5))),
                        getDocs(query(wishRef, where('helper_id', '==', uid), limit(5)))
                    ]);

                    const allTxDocs = [...sentSnap.docs, ...receivedSnap.docs];
                    console.log(`[DeepRecovery] Found ${allTxDocs.length} transaction records for ${uid}`);
                    
                    for (const doc of allTxDocs) {
                        const data = doc.data();
                        const sName = data.sender_name;
                        const rName = data.recipient_name;
                        const sId = data.sender_id;
                        const rId = data.recipient_id;

                        if (sId === uid && sName && !mechanicalLabels.includes(sName)) {
                            console.log(`[DeepRecovery] Recovered name "${sName}" from transaction ${doc.id}`);
                            recoveryCache[uid] = sName;
                            return sName;
                        }
                        if (rId === uid && rName && !mechanicalLabels.includes(rName)) {
                            console.log(`[DeepRecovery] Recovered name "${rName}" from transaction ${doc.id}`);
                            recoveryCache[uid] = rName;
                            return rName;
                        }
                    }

                    // Search Wishes (Requester/Helper)
                    const allWishDocs = [...requestedSnap.docs, ...helpedSnap.docs];
                    
                    // Also search for Applicant status as a last resort
                    const applicantSnap = await getDocs(query(wishRef, where('applicant_ids', 'array-contains', uid), limit(5)));
                    const allInvolvedWishes = [...allWishDocs, ...applicantSnap.docs];
                    
                    console.log(`[DeepRecovery] Scanning names in ${allInvolvedWishes.length} involved wishes for ${uid}`);
                    for (const doc of allInvolvedWishes) {
                        const data = doc.data();
                        const rName = data.requester_name;
                        const hName = data.helper_name;
                        const rId = data.requester_id;
                        const hId = data.helper_id;
                        const applicants = data.applicants || [];

                        if (rId === uid && rName && !mechanicalLabels.includes(rName)) {
                            console.log(`[DeepRecovery] Recovered name "${rName}" from wish ${doc.id} (Requester)`);
                            recoveryCache[uid] = rName;
                            return rName;
                        }
                        if (hId === uid && hName && !mechanicalLabels.includes(hName)) {
                            console.log(`[DeepRecovery] Recovered name "${hName}" from wish ${doc.id} (Helper)`);
                            recoveryCache[uid] = hName;
                            return hName;
                        }
                        
                        // Check applicants array
                        const me = applicants.find((a: { id: string, name: string }) => a.id === uid);
                        if (me && me.name && !mechanicalLabels.includes(me.name)) {
                            console.log(`[DeepRecovery] Recovered name "${me.name}" from wish ${doc.id} (Applicant)`);
                            recoveryCache[uid] = me.name;
                            return me.name;
                        }
                    }

                    console.log(`[DeepRecovery] No valid name found for ${uid} after scanning all collections.`);
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
