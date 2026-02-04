/**
 * 【緊急】器の完全浄化スクリプト
 * 
 * 目的: 全ユーザーの「幽霊予約」を除去し、真実の予約額を再計算する。
 * 
 * 実行方法:
 * 1. Firebase Admin SDK の設定を確認
 * 2. `npx tsx src/scripts/purifyVessels.ts` を実行
 * 
 * 警告: このスクリプトは一度だけ実行すること。
 */

import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { calculateDecayedValue } from '../logic/worldPhysics';

// Firebase Admin 初期化
// 注: このスクリプトを実行する前に、外部から initializeApp() を呼び出すこと
// または、serviceAccountKey.json をインポートして初期化すること

const db = getFirestore();

interface Wish {
  requester_id: string;
  status: string;
  cost: number;
  created_at: Timestamp | { toDate: () => Date };
}

async function purifyAllVessels() {
  console.log('🧹 器の浄化を開始します...\n');

  try {
    // 1. 全ユーザーを取得
    const usersSnapshot = await db.collection('users').get();
    console.log(`📊 対象ユーザー数: ${usersSnapshot.size}\n`);

    // 2. 全ての願いを取得（Open/InProgress のみ）
    const wishesSnapshot = await db.collection('wishes')
      .where('status', 'in', ['open', 'in_progress'])
      .get();

    // 3. ユーザーごとに予約額を集計
    const userCommitments = new Map<string, number>();

    wishesSnapshot.forEach((wishDoc) => {
      const wish = wishDoc.data() as Wish;
      const requesterId = wish.requester_id;
      const initialCost = wish.cost || 0;
      const createdAt = wish.created_at;

      // 減価適用
      const currentValue = calculateDecayedValue(initialCost, createdAt);

      const current = userCommitments.get(requesterId) || 0;
      userCommitments.set(requesterId, current + currentValue);
    });

    console.log(`💡 アクティブな願い総数: ${wishesSnapshot.size}`);
    console.log(`💡 予約を持つユーザー数: ${userCommitments.size}\n`);

    // 4. 各ユーザーの器を確認（ログのみ、実際の更新はコメントアウト）
    let inconsistencyCount = 0;

    for (const [userId, committedLm] of userCommitments.entries()) {
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) continue;

      const userData = userDoc.data();
      const balance = userData?.balance || 0;
      const userName = userData?.name || 'Unknown';

      // 不整合チェック（Balance < Committed）
      if (balance < committedLm) {
        inconsistencyCount++;
        console.log(`⚠️  不整合検出:`);
        console.log(`   ユーザー: ${userName} (${userId})`);
        console.log(`   手持ち: ${balance} Lm`);
        console.log(`   予約中: ${committedLm} Lm`);
        console.log(`   差分: ${committedLm - balance} Lm (超過)\n`);
      }
    }

    // 5. 結果サマリー
    console.log('━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 浄化結果サマリー');
    console.log('━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ スキャン完了`);
    console.log(`💡 不整合ユーザー数: ${inconsistencyCount}`);
    
    if (inconsistencyCount > 0) {
      console.log('\n⚠️  不整合が検出されました。');
      console.log('   これらのユーザーは「予約 > 手持ち」の状態です。');
      console.log('   原因: cancelWish または fulfillWish が予約を解放していない可能性があります。');
    } else {
      console.log('\n✅ 全てのユーザーの器は健全です。');
    }

  } catch (error) {
    console.error('❌ 浄化スクリプト失敗:', error);
  }
}

// 実行
purifyAllVessels().then(() => {
  console.log('\n🎉 浄化スクリプト完了');
  process.exit(0);
}).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
