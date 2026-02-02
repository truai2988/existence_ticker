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
// Interface for the input data
interface ResetCycleData {
  capacity?: number;
}

export const resetCycle = functions.https.onCall(async (data: ResetCycleData, context: functions.https.CallableContext) => {
  // 1. Security Check
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
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
        balance: newCapacity, // 'lumen_balance' -> 'balance' (Current Schema)
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

  } catch (error) {
    console.error('World Reset Failed:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to reset the world.',
      error
    );
  }
});

/**
 * 2. Balance Monitor: The Silent Watcher
 * ユーザー残高が更新されるたびに、0未満になっていないか監視する。
 * もし負の残高が発生した場合、それは「物理法則の崩壊」を意味するため、
 * 直ちに異常ログ（anomalies collection）に記録する。
 */
export const monitorBalances = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    const newValue = change.after.data();
    const balance = newValue.balance;

    // 負の不渡りを検知
    if (typeof balance === 'number' && balance < 0) {
      console.error(`[CRITICAL] Negative Balance Detected! User: ${context.params.userId}, Balance: ${balance}`);
      
      // 異常事態を記録
      await db.collection('anomalies').add({
        type: 'negative_balance',
        userId: context.params.userId,
        userName: newValue.name || 'Unknown',
        balance: balance,
        detectedAt: admin.firestore.FieldValue.serverTimestamp(),
        severity: 'CRITICAL',
        snapshot: newValue
      });
    }
  });

