import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
/**
 * World Reset: The Turning of the Wheel
 * 管理者権限を持つユーザーのみが呼び出し可能。
 * 全生存ユーザーのLumenを指定された容量(capacity)にリセットする。
 */
export const resetCycle = functions.https.onCall(async (data, context) => {
    // 1. Security Check
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    // 将来的にはここでAdmin UIDチェックを行う推奨
    // const ADMIN_UID = '...';
    // if (context.auth.uid !== ADMIN_UID) ...
    const newCapacity = data.capacity || 2400; // デフォルトは2400
    const batchLimit = 500; // Firestoreのバッチ書き込み上限
    let batch = db.batch();
    let operationCount = 0;
    try {
        // 2. Fetch all profiles
        // TODO: ユーザー数が増えた場合はCollectionGroupクエリやページネーションを検討
        const profilesSnapshot = await db.collection('users').get();
        const totalUsers = profilesSnapshot.size;
        console.log(`Starting World Reset for ${totalUsers} souls to ${newCapacity} Lm.`);
        for (const doc of profilesSnapshot.docs) {
            const ref = doc.ref;
            // 3. Reset Logic
            batch.update(ref, {
                balance: newCapacity,
                last_updated: admin.firestore.FieldValue.serverTimestamp(), // 'last_synced_at' -> 'last_updated' (Current Schema)
            });
            operationCount++;
            // バッチ上限チェック
            if (operationCount >= batchLimit) {
                await batch.commit();
                batch = db.batch();
                operationCount = 0;
            }
        }
        // 残りのバッチをコミット
        if (operationCount > 0) {
            await batch.commit();
        }
        console.log(`World Reset Completed. Cycles updated.`);
        return {
            success: true,
            message: `World Reset Completed. ${totalUsers} souls have been renewed to ${newCapacity} Lm.`,
            timestamp: Date.now()
        };
    }
    catch (error) {
        console.error('World Reset Failed:', error);
        throw new functions.https.HttpsError('internal', 'Failed to reset the world.', error);
    }
});
//# sourceMappingURL=index.js.map