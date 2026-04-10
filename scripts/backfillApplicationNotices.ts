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

async function backfill() {
  console.log("--- 立候補通知のバックフィル開始 ---\n");

  try {
    // applicants が存在する open の wish を取得
    const wishesSnap = await db
      .collection("wishes")
      .where("status", "==", "open")
      .get();

    let total = 0;

    for (const wishDoc of wishesSnap.docs) {
      const wishData = wishDoc.data();
      const applicants: { id: string; name?: string }[] =
        wishData.applicants || [];

      if (applicants.length === 0) continue;

      console.log(
        `Wish: ${wishDoc.id} (requester: ${wishData.requester_id}) — 立候補者: ${applicants.length}名`
      );

      for (const applicant of applicants) {
        const noticeId = `notice_${wishData.requester_id}_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 6)}`;

        const applicantName = applicant.name || "奏者";
        const message = `${applicantName}さんが寄り添おうとしています。`;

        await db.collection("notices").doc(noticeId).set({
          userId: wishData.requester_id,
          fromId: applicant.id,
          message,
          messageKey: "NOTICE_APPLICATION",
          params: { name: applicantName },
          type: "application_received",
          createdAt: Date.now(),
          read: false,
        });

        console.log(
          `  ✔ 通知作成: ${applicantName} → requester(${wishData.requester_id})`
        );
        total++;

        // 同じIDにならないよう少し待機
        await new Promise((r) => setTimeout(r, 10));
      }
    }

    console.log(`\n--- 完了: ${total}件の通知を作成しました ---`);
  } catch (error) {
    console.error("バックフィル失敗:", error);
  } finally {
    process.exit();
  }
}

backfill();
