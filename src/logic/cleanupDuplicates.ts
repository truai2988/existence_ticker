import { Firestore } from 'firebase/firestore';

export const cleanupDuplicates = async (db: Firestore) => {
    if (!db) return;
    console.log("=== 🧹 WORLD PURIFICATION: Starting Global Transaction Scan ===");
    
    const { collection, getDocs, deleteDoc, doc } = await import('firebase/firestore');

    const txRef = collection(db, 'transactions');
    
    // Fetch ALL transactions (World Scan)
    // Note: If dataset is huge, this might need pagination or cloud function.
    // For now, we assume manageable size or at least sufficient for recent duplicates.
    const snapshot = await getDocs(txRef);
    const allDocs = snapshot.docs;
    
    // Deduplicate docs by ID first (in case of self-send)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const uniqueDocsMap = new Map<string, any>();
    allDocs.forEach(d => uniqueDocsMap.set(d.id, d));
    const uniqueDocs = Array.from(uniqueDocsMap.values());
    
    console.log(`Scanned ${uniqueDocs.length} transactions.`);
    
    // Grouping for Deduplication
    // Key: requester_helper_amount_title
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const groups: Record<string, any[]> = {};
    
    allDocs.forEach(d => {
        const data = d.data();
        const wishId = data.wish_id || data.related_wish_id;
        const type = data.type || 'unknown';
        const sender = data.sender_id || data.requester_id || 'unknown';
        const recipient = data.recipient_id || data.helper_id || 'unknown';
        const amount = data.amount || 0;
        const title = data.wish_title || data.title || '';

        // STRICT MODE: If this transaction is tied to a specific Wish ID and is a Final State,
        // it must happen ONLY ONCE in the history of the universe.
        const isStrictType = ['WISH_EXPIRED', 'WISH_FULFILLMENT', 'compensation_received'].includes(type);

        let key = "";
        
        if (wishId && isStrictType) {
             // Strict Unique Key: One event per wish per type
             key = `STRICT_${wishId}_${type}`;
        } else {
             // Fuzzy Logic (Legacy/Gift/Other): Check for exact content match within time window
             key = `FUZZY_${type}_${sender}_${recipient}_${amount}_${title}`;
        }
        
        if (!groups[key]) groups[key] = [];
        groups[key].push({ id: d.id, ...data, _ref: d.ref, _millis: data.created_at?.toMillis?.() || 0 });
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const deleteCandidates: any[] = [];

    // Analyze Groups
    Object.entries(groups).forEach(([key, group]) => {
        if (group.length < 2) return;

        // Sort by time ASC (Oldest first)
        group.sort((a, b) => a._millis - b._millis);

        if (key.startsWith("STRICT_")) {
            // STRICT MODE: Delete ALL except the first one (Oldest)
            // Even if they are 10 minutes or 10 days apart.
            // A wish expires once. A wish is fulfilled once.
            for (let i = 1; i < group.length; i++) {
                deleteCandidates.push(group[i]);
            }
        } else {
            // FUZZY MODE: Time Window Logic (2 mins)
            let lastKept = group[0];
            
            for (let i = 1; i < group.length; i++) {
                const current = group[i];
                const diff = Math.abs(current._millis - lastKept._millis);
                
                if (diff < 120000) { // 2 mins
                    deleteCandidates.push(current);
                } else {
                    lastKept = current;
                }
            }
        }
    });
    
    if (deleteCandidates.length === 0) {
        console.log("No impurities found. The world is clean.");
        return;
    }

    console.warn(`FOUND ${deleteCandidates.length} DUPLICATE TRACES.`);
    console.warn("Initiating purification...");

    let deletedCount = 0;
    const batchSize = 10; // Simple buffering not valid for deleteDoc, run mostly sequential or Promise.all
    
    // Execute Deletion
    const chunks = [];
    for (let i = 0; i < deleteCandidates.length; i += batchSize) {
        chunks.push(deleteCandidates.slice(i, i + batchSize));
    }

    for (const chunk of chunks) {
        await Promise.all(chunk.map(async (item) => {
            console.log(`[DELETE] ${item.id} (${item.wish_title || item.type}) - ${new Date(item._millis).toISOString()}`);
            await deleteDoc(doc(db, 'transactions', item.id));
            deletedCount++;
        }));
    }

    console.log(`=== PURIFICATION COMPLETE. Eliminated ${deletedCount} impurities from the world. ===`);
};
