import admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.resolve(__dirname, "serviceAccountKey.json");

if (!fs.existsSync(serviceAccountPath)) {
  console.error("Error: serviceAccountKey.json not found.");
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function migrate() {
  console.log("--- notices フラット → サブコレクション 移行開始 ---\n");

  try {
    const noticesSnap = await db.collection("notices").get();

    if (noticesSnap.empty) {
      console.log("移行対象のドキュメントはありません。完了。");
      process.exit(0);
    }

    console.log(`${noticesSnap.size} 件を移行します...\n`);

    let migrated = 0;
    let skipped = 0;

    for (const docSnap of noticesSnap.docs) {
      const data = docSnap.data();
      const userId = data.userId;

      if (!userId) {
        console.warn(`  SKIP: ${docSnap.id} — userId フィールドなし`);
        skipped++;
        continue;
      }

      // サブコレクションに書き込み
      await db
        .collection("users")
        .doc(userId)
        .collection("notices")
        .doc(docSnap.id)
        .set(data);

      // 旧フラットコレクションから削除
      await db.collection("notices").doc(docSnap.id).delete();

      console.log(`  ✔ ${docSnap.id} → users/${userId}/notices/${docSnap.id}`);
      migrated++;
    }

    console.log(`\n--- 完了: ${migrated}件移行、${skipped}件スキップ ---`);
  } catch (error) {
    console.error("移行失敗:", error);
  } finally {
    process.exit();
  }
}

migrate();
