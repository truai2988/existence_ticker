/**
 * Phase 1: Migration Script
 * 全ユーザーに committed_lm フィールドを追加し、
 * 現在のアクティブな願いから正しい値を算出する。
 */

import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { calculateDecayedValue, toMilli, fromMilli, getMillis } from '../logic/worldPhysics';

const db = getFirestore();

interface Wish {
  requester_id: string;
  status: string;
  cost: number;
  created_at: Timestamp | { toDate: () => Date };
}

async function migrateCommittedLm() {
  console.log('🔄 Phase 1: committed_lm フィールドの移行を開始します...\n');

  try {
    // 1. 全てのアクティブな願いを取得
    const wishesSnapshot = await db.collection('wishes')
      .where('status', 'in', ['open', 'in_progress'])
      .get();

    console.log(`📊 アクティブな願い総数: ${wishesSnapshot.size}\n`);

    // 2. ユーザーごとに予約額を集計
    const userCommitments = new Map<string, number>();

    wishesSnapshot.forEach((wishDoc) => {
      const wish = wishDoc.data() as Wish;
      const requesterId = wish.requester_id;
      const initialCost = wish.cost || 0;
      const createdAt = wish.created_at;

      // 減価適用
      const startMs = getMillis(createdAt);
      const elapsedSec = ((Date.now() - startMs) / 1000) | 0;
      const currentValueMilli = calculateDecayedValue(toMilli(initialCost), elapsedSec);
      const currentValue = fromMilli(currentValueMilli);

      const current = userCommitments.get(requesterId) || 0;
      userCommitments.set(requesterId, current + currentValue);
    });

    console.log(`💡 予約を持つユーザー数: ${userCommitments.size}\n`);

    // 3. 全ユーザーを取得
    const usersSnapshot = await db.collection('users').get();
    console.log(`📋 全ユーザー数: ${usersSnapshot.size}\n`);

    // 4. Batch 更新（500件ごと）
    let batch = db.batch();
    let batchCount = 0;
    let totalUpdated = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const committedLm = userCommitments.get(userId) || 0;

      batch.update(userDoc.ref, {
        committed_lm: committedLm
      });

      batchCount++;
      totalUpdated++;

      // Firestore の batch は 500 件まで
      if (batchCount >= 500) {
        await batch.commit();
        console.log(`✅ ${totalUpdated} ユーザー更新完了...`);
        batch = db.batch();
        batchCount = 0;
      }
    }

    // 残りを commit
    if (batchCount > 0) {
      await batch.commit();
      console.log(`✅ ${totalUpdated} ユーザー更新完了`);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 移行結果サマリー');
    console.log('━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ 更新ユーザー数: ${totalUpdated}`);
    console.log(`💡 予約を持つユーザー: ${userCommitments.size}`);
    console.log(`💡 予約が0のユーザー: ${totalUpdated - userCommitments.size}`);
    console.log('\n🎉 Phase 1 完了: committed_lm フィールドが全ユーザーに追加されました。');

  } catch (error) {
    console.error('❌ 移行スクリプト失敗:', error);
    throw error;
  }
}

// 実行
migrateCommittedLm().then(() => {
  console.log('\n✨ 幽霊予約の除霊が完了しました。');
  process.exit(0);
}).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
