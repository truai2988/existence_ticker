import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

/**
 * Migrate legacy transactions to per-user perspective records for active residents.
 */
export const migrateResidentJournals = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    const db = admin.firestore();
    const batchLimit = 500;
    let batch = db.batch();
    let opCount = 0;
    let createdCount = 0;

    try {
        console.log("[Migration] Starting Resident Journal Migration via Cloud Function...");
        
        // 1. Fetch active residents
        const userSnap = await db.collection('users').get();
        const activeUserIds = userSnap.docs.map(d => d.id);
        const userMap = new Map(userSnap.docs.map(d => [d.id, d.data()]));
        
        console.log(`[Migration] Found ${activeUserIds.length} active residents.`);

        // 2. Fetch legacy transactions
        const txSnap = await db.collection('transactions').where('owner_id', '==', null).get();
        // Note: where('owner_id', '==', null) might skip fields that don't exist. 
        // Better fetch and filter in memory if size is manageable, or handle both.
        let legacyDocs = txSnap.docs;
        if (legacyDocs.length === 0) {
            // Fallback for fields that are missing entirely
            const allTx = await db.collection('transactions').get();
            legacyDocs = allTx.docs.filter(d => !d.data().owner_id);
        }

        console.log(`[Migration] Analyzing ${legacyDocs.length} potential legacy records.`);

        // 3. Filter and Process
        for (const txDoc of legacyDocs) {
            const txData = txDoc.data();
            const txId = txDoc.id;

            // Check if any active resident is involved
            const involvedResidents = activeUserIds.filter(uid => 
                txData.sender_id === uid || txData.recipient_id === uid || txData.user_id === uid
            );

            if (involvedResidents.length === 0) continue;

            const createRecord = (ownerId: string, desc: string) => {
                const newId = `${txId}_${ownerId}`;
                const newRef = db.collection('transactions').doc(newId);
                batch.set(newRef, {
                    ...txData,
                    owner_id: ownerId,
                    description: desc,
                    migration_source: txId,
                    migrated_at: admin.firestore.FieldValue.serverTimestamp()
                });
                createdCount++;
                opCount++;
            };

            if (txData.type === 'WISH_FULFILLMENT' || txData.type === 'COMPENSATION') {
                const isBankruptcy = txData.description?.includes('余力不足') || txData.description?.includes('Bankruptcy');
                const sId = txData.sender_id;
                const rId = txData.recipient_id;

                if (sId && userMap.has(sId)) {
                    const desc = txData.type === 'COMPENSATION' 
                        ? "中断に伴い、誠実のしるしをお渡ししました"
                        : (isBankruptcy ? "感謝を贈りましたが、余力が足りず一部のみが結晶になりました" : "願いを叶えてくれた感謝を、源気（Lm）に込めて贈りました");
                    createRecord(sId, desc);
                }
                if (rId && userMap.has(rId)) {
                    const desc = txData.type === 'COMPENSATION'
                        ? "依頼主の中断に伴い、誠実のしるしが届きました"
                        : (isBankruptcy ? "感謝が届きましたが、余力が足りず一部のみが結晶になりました" : "感謝が結晶（Lm）になって届きました");
                    createRecord(rId, desc);
                }
            } else {
                const targetUId = txData.sender_id || txData.user_id;
                if (targetUId && userMap.has(targetUId)) {
                    createRecord(targetUId, txData.description || "記録が刻まれました");
                }
            }

            // Mark legacy as migrated
            batch.update(txDoc.ref, { owner_id: "__MIGRATED__" });
            opCount++;

            if (opCount >= batchLimit - 5) {
                await batch.commit();
                batch = db.batch();
                opCount = 0;
            }
        }

        if (opCount > 0) {
            await batch.commit();
        }

        return { success: true, createdCount, message: `${createdCount}件の正規住民ジャーナルを生成しました。` };
    } catch (e) {
        console.error("Migration failed:", e);
        throw new functions.https.HttpsError('internal', String(e));
    }
});

/**
 * Purge ghost transactions (those not involving any active resident).
 */
export const purgeGhostJournals = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    const db = admin.firestore();
    const batchLimit = 500;
    let batch = db.batch();
    let opCount = 0;
    let deletedCount = 0;

    try {
        const userSnap = await db.collection('users').get();
        const activeUserIds = new Set(userSnap.docs.map(d => d.id));

        const txSnap = await db.collection('transactions').get();
        
        for (const txDoc of txSnap.docs) {
            const txData = txDoc.data();
            if (txData.owner_id === '__MIGRATED__' || txData.owner_id?.startsWith('__')) continue;

            const isOrphan = !activeUserIds.has(txData.sender_id) && 
                             !activeUserIds.has(txData.recipient_id) && 
                             !activeUserIds.has(txData.user_id) &&
                             !activeUserIds.has(txData.owner_id);

            if (isOrphan) {
                batch.delete(txDoc.ref);
                deletedCount++;
                opCount++;

                if (opCount >= batchLimit) {
                    await batch.commit();
                    batch = db.batch();
                    opCount = 0;
                }
            }
        }

        if (opCount > 0) {
            await batch.commit();
        }

        return { success: true, deletedCount, message: `${deletedCount}件の幽霊記録を浄化しました。` };
    } catch (e) {
        console.error("Purge failed:", e);
        throw new functions.https.HttpsError('internal', String(e));
    }
});
