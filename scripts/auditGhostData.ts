import admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.resolve(__dirname, "serviceAccountKey.json");

if (!fs.existsSync(serviceAccountPath)) {
  console.error(`Error: serviceAccountKey.json not found.`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function audit() {
  console.log("--- Database Audit Started ---");
  const now = new Date().toISOString();
  console.log(`Time: ${now}\n`);

  try {
    // 1. Live Users
    const usersSnap = await db.collection("users").get();
    const liveUids = new Set(usersSnap.docs.map((d) => d.id));
    console.log(`[users] Count: ${usersSnap.size}`);
    usersSnap.forEach((d) => {
      console.log(`  - UID: ${d.id}, Name: ${d.data().name}`);
    });

    // 2. Wishes
    const wishesSnap = await db.collection("wishes").get();
    console.log(`\n[wishes] Count: ${wishesSnap.size}`);
    wishesSnap.forEach((d) => {
      const data = d.data();
      const isGhost = !liveUids.has(data.requester_id);
      console.log(
        `  - ID: ${d.id}, Requester: ${data.requester_id} ${isGhost ? "(GHOST!)" : ""}, Status: ${data.status}`,
      );
    });

    // 3. Transactions (Full Detail)
    const txSnap = await db.collection("transactions").get();
    console.log(`\n[transactions] Count: ${txSnap.size}`);
    txSnap.forEach((d) => {
      const data = d.data();
      const sId = data.sender_id;
      const rId = data.recipient_id;
      const sGhost = sId && !liveUids.has(sId);
      const rGhost = rId && !liveUids.has(rId);
      
      console.log(`  - TX: ${d.id}, Type: ${data.type}, Amount: ${data.amount}`);
      console.log(`    Sender: ${sId || 'None'} ${sGhost ? '(GHOST!)' : ''}`);
      console.log(`    Recipient: ${rId || 'None'} ${rGhost ? '(GHOST!)' : ''}`);
    });

    // 4. Balance Logs
    const logSnap = await db.collection("balance_logs").get();
    const orpanLogs = logSnap.docs.filter((d) => !liveUids.has(d.data().user_id));
    console.log(`\n[balance_logs] Total: ${logSnap.size}, Orphan: ${orpanLogs.length}`);

    // 5. Location Stats
    const locSnap = await db.collection("location_stats").get();
    console.log(`\n[location_stats] Count: ${locSnap.size}`);
    locSnap.forEach((d) => {
      const data = d.data();
      if (data.count === 0) {
        console.log(`  - ${d.id}: Count 0 (Stale)`);
      } else {
        console.log(`  - ${d.id}: Count ${data.count}`);
      }
    });

    // 6. Invitation Codes
    const invSnap = await db.collection("invitation_codes").get();
    console.log(`\n[invitation_codes] Count: ${invSnap.size}`);
    invSnap.forEach((d) => {
      const data = d.data();
      const isUsed = data.is_used;
      const usedBy = data.used_by;
      const usedByGhost = usedBy && !liveUids.has(usedBy);
      console.log(`  - Code: ${d.id}, Used: ${isUsed}, UsedBy: ${usedBy || 'None'} ${usedByGhost ? '(GHOST!)' : ''}`);
    });

    // 7. System Settings & Daily Stats
    const sysSnap = await db.collection("system_settings").get();
    const dailySnap = await db.collection("daily_stats").get();
    console.log(`\n[system_settings] Count: ${sysSnap.size}`);
    console.log(`[daily_stats] Count: ${dailySnap.size}`);

    console.log("\n--- Audit Finished ---");
  } catch (error) {
    console.error("Audit failed:", error);
  } finally {
    process.exit();
  }
}

audit();
