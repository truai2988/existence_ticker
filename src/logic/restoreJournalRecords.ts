import { Firestore, collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';

/**
 * restoreJournalRecords: 過去の「ID欠落トランザクション」を修復する
 * 
 * 1. sender_id が存在しない WISH_FULFILLMENT を検索
 * 2. 同一の金額・時間帯の WISH_CANCELLED または他のヒントから sender_id を推測
 *    (今回は wish_id が残っていればそれを利用、ない場合は context から特定)
 */
export const restoreJournalRecords = async (db: Firestore) => {
    console.log("=== 🛠️ JOURNAL RESTORATION INITIATED ===");
    
    try {
        const txRef = collection(db, 'transactions');
        const snap = await getDocs(txRef);
        
        let patchedCount = 0;
        console.log(`Scanning ${snap.docs.length} records...`);

        for (const d of snap.docs) {
            const data = d.data();
            const id = d.id;

            // Target: WISH_FULFILLMENT or COMPENSATION missing sender_id
            if ((data.type === 'WISH_FULFILLMENT' || data.type === 'COMPENSATION') && !data.sender_id) {
                console.log(`[${id}] Missing sender_id in ${data.type}. Attempting recovery...`);

                let recoveredSenderId = null;

                // Recovery Logic A: Use wish_id to find the requester (if still exists)
                if (data.wish_id) {
                    const wishSnap = await getDocs(query(collection(db, 'wishes'), where('__name__', '==', data.wish_id)));
                    if (!wishSnap.empty) {
                        recoveredSenderId = wishSnap.docs[0].data().requester_id;
                    }
                }

                // Recovery Logic B: If it's a COMPENSATION induced by a CANCEL, 
                // look for the corresponding WISH_CANCELLED at the same timestamp
                if (!recoveredSenderId) {
                    // Find a match by wish_id and related actions
                    const related = snap.docs.find(other => 
                        other.id !== id && 
                        other.data().wish_id === data.wish_id && 
                        other.data().sender_id
                    );
                    if (related) {
                        recoveredSenderId = related.data().sender_id;
                    }
                }

                if (recoveredSenderId) {
                    console.log(`[${id}] Recovered sender_id: ${recoveredSenderId}. Patching...`);
                    await updateDoc(doc(db, 'transactions', id), {
                        sender_id: recoveredSenderId,
                        recipient_id: data.recipient_id || null // Ensure recipient_id also exists
                    });
                    patchedCount++;
                } else {
                    console.warn(`[${id}] Could not recover sender_id. Wish might have been crystallized already.`);
                }
            }
        }

        console.log(`=== ✅ RESTORATION COMPLETE. Patched ${patchedCount} records. ===`);
        return patchedCount;
    } catch (e) {
        console.error("Restoration failed:", e);
        throw e;
    }
};
