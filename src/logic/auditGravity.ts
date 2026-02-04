import { Firestore, DocumentData } from 'firebase/firestore';

// Core Physics Simulation Engine
const simulateAndCorrect = async (db: Firestore, user: DocumentData, userTxs: DocumentData[]) => {
    const userId = user.id;
    const userData = user.data();
    const currentBalance = userData.balance || 0;
    // const lastUpdated = userData.last_updated; // Unused 
    
    // Sort transactions descending to find origin
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    userTxs.sort((a: any, b: any) => (b.created_at?.toMillis() || 0) - (a.created_at?.toMillis() || 0));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const originTx = userTxs.find((tx: any) => ['BIRTH', 'REBIRTH'].includes(tx.type));
    
    let originTime: any;
    let originBalance = 0;
    let fallbackMode = false;

    if (originTx) {
        originTime = originTx.created_at;
        originBalance = originTx.amount || 2400;
        // console.log(`[${userId}] Origin: ${originTx.type} at ${originTime.toDate().toISOString()}`);
    } else {
        // Fallback: Use oldest transaction
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const oldestTx: any = userTxs[userTxs.length - 1];
        if (!oldestTx) {
             // No history at all, skip audit or assume 0?
             // If balance is > 0 but no history, that's also a leak (phantom money).
             if (currentBalance > 0) {
                 console.warn(`[${userId}] ⚠️ Non-zero balance (${currentBalance}) but NO history. Clearing phantom balance.`);
                 const { doc, updateDoc, Timestamp } = await import('firebase/firestore');
                 await updateDoc(doc(db, 'users', userId), {
                     balance: 0,
                     last_updated: Timestamp.now()
                 });
             }
             return;
        }
        originTime = oldestTx.created_at;
        originBalance = 0; 
        fallbackMode = true;
        // console.warn(`[${userId}] ⚠️ No Origin. Using Void Fallback from ${originTime.toDate().toISOString()}`);
    }

    // Filter Inflows
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inflows = userTxs.filter((tx: any) => 
        fallbackMode 
            ? (tx.created_at?.toMillis() || 0) >= originTime.toMillis()
            : (tx.created_at?.toMillis() || 0) > originTime.toMillis()
    );
    // Sort ASC for replay
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    inflows.sort((a: any, b: any) => (a.created_at?.toMillis() || 0) - (b.created_at?.toMillis() || 0));

    // Simulate
    let simulatedBalance = originBalance;
    let lastSimTime = originTime.toMillis();
    const decayRatePerHour = 10;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    inflows.forEach((tx: any) => {
        const txTime = tx.created_at.toMillis();
        const elapsed = txTime - lastSimTime;
        const hoursPassed = elapsed / (1000 * 60 * 60);
        const decayAmount = Math.floor(hoursPassed * decayRatePerHour);
        
        simulatedBalance = Math.max(0, simulatedBalance - decayAmount);
        
        if (tx.amount && tx.amount > 0) {
             simulatedBalance += tx.amount;
        }
        lastSimTime = txTime;
    });

    // Final Decay
    const now = Date.now();
    const elapsedSinceLast = now - lastSimTime;
    const hoursFinal = elapsedSinceLast / (1000 * 60 * 60);
    const finalDecay = Math.floor(hoursFinal * decayRatePerHour);
    simulatedBalance = Math.max(0, simulatedBalance - finalDecay);

    const diff = currentBalance - simulatedBalance;
    
    if (Math.abs(diff) > 5) {
        console.warn(`[${userId}] 🚨 LEAK DETECTED! Current: ${currentBalance}, True: ${simulatedBalance} (Diff: ${diff})`);
        
        const { doc, updateDoc, Timestamp } = await import('firebase/firestore');
        await updateDoc(doc(db, 'users', userId), {
            balance: simulatedBalance,
            last_updated: Timestamp.fromMillis(now)
        });
        console.log(`[${userId}] ✅ FIXED.`);
    } else {
        console.log(`[${userId}] ✨ Clean. (Bal: ${currentBalance})`);
    }
};

// Single User Audit
export const auditGravity = async (db: Firestore, userId: string) => {
    if (!db || !userId) return;
    console.log(`=== 🍎 AUDIT: User ${userId} ===`);
    
    const { collection, getDocs, doc, getDoc } = await import('firebase/firestore');
    
    // Fetch User
    const userSnap = await getDoc(doc(db, 'users', userId));
    if (!userSnap.exists()) return;

    // Fetch All Txs (Brute force per previous fix)
    const txSnap = await getDocs(collection(db, 'transactions'));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allTxs = txSnap.docs.map(d => ({id: d.id, ...d.data()}));
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userTxs = allTxs.filter((tx: any) => tx.recipient_id === userId);
    
    await simulateAndCorrect(db, userSnap, userTxs);
};

// Global Audit
export const auditAllGravity = async (db: Firestore) => {
    if (!db) return;
    console.log(`=== 🌍 GLOBAL GRAVITY RESTORATION INITIATED ===`);
    
    const { collection, getDocs } = await import('firebase/firestore');

    // 1. Fetch ALL Users
    const usersSnap = await getDocs(collection(db, 'users'));
    const users = usersSnap.docs;
    console.log(`loaded ${users.length} vessels.`);

    // 2. Fetch ALL Txs
    console.log("Fetching history of the world...");
    const txSnap = await getDocs(collection(db, 'transactions'));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allTxs = txSnap.docs.map(d => ({id: d.id, ...d.data()}));
    console.log(`Loaded ${allTxs.length} historical events.`);

    // 3. Group Txs by Recipient
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const txsByUser: Record<string, any[]> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    allTxs.forEach((tx: any) => {
        const uid = tx.recipient_id;
        if (uid) {
            if (!txsByUser[uid]) txsByUser[uid] = [];
            txsByUser[uid].push(tx);
        }
    });

    // 4. Run Parallel Audit
    console.log("Simulating physics for all users...");
    let processed = 0;
    
    // Serial execution to avoid rate limits? Or Promise.all? 
    // Small world -> Promise.all ok.
    await Promise.all(users.map(async (userDoc) => {
        const uid = userDoc.id;
        const userTxs = txsByUser[uid] || [];
        await simulateAndCorrect(db, userDoc, userTxs);
        processed++;
    }));

    console.log(`=== 🌎 RESTORATION COMPLETE. Scanned ${processed} vessels. ===`);
};
