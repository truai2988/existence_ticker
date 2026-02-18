import admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.resolve(__dirname, "serviceAccountKey.json");

if (!fs.existsSync(serviceAccountPath)) {
  console.error(`Error: serviceAccountKey.json not found.`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function cleanup() {
  console.log("--- Database Cleanup Started ---");

  try {
    const batch = db.batch();
    let deleteCount = 0;

    // 1. Delete Expired Wishes
    const wishesSnap = await db.collection('wishes').where('status', '==', 'expired').get();
    console.log(`Found ${wishesSnap.size} expired wishes to delete.`);
    wishesSnap.forEach(doc => {
        batch.delete(doc.ref);
        deleteCount++;
    });

    // 2. Cleanup Location Stats (Count 0)
    const locSnap = await db.collection('location_stats').get();
    locSnap.forEach(doc => {
        const data = doc.data();
        if (data.count === 0) {
            console.log(`Deleting stale location_stats: ${doc.id}`);
            batch.delete(doc.ref);
            deleteCount++;
        }
    });

    // 3. Correct Discrepancy (Hashimoto City)
    // We know there's only 1 user, and they are in 和歌山県_橋本市 (since count was 2)
    // OR the user might be elsewhere. Let's check the user's actual location first.
    const usersSnap = await db.collection('users').get();
    const user = usersSnap.docs[0]?.data();
    const correctLocKey = user?.location ? `${user.location.prefecture}_${user.location.city}` : null;
    
    console.log(`Live User Location: ${correctLocKey}`);

    if (correctLocKey) {
        const hashimotoRef = db.collection('location_stats').doc('和歌山県_橋本市');
        if (correctLocKey === '和歌山県_橋本市') {
            console.log("Setting 和歌山県_橋本市 count to 1.");
            batch.set(hashimotoRef, { count: 1 }, { merge: true });
        } else {
            console.log("Correct user location is NOT Hashimoto. Deleting Hashimoto if 0 (handled above) or resetting if wrong.");
            // If the user moved, the old doc might still have 2. 
            // In our case, count was 2, so we reset Hashimoto to 0 or delete if no one is there.
             batch.delete(hashimotoRef);
        }
    }

    if (deleteCount > 0 || correctLocKey) {
        await batch.commit();
        console.log(`Successfully completed cleanup. Operations performed: ${deleteCount + (correctLocKey ? 1 : 0)}`);
    } else {
        console.log("No cleanup needed.");
    }

    console.log("\n--- Cleanup Finished ---");
  } catch (error) {
    console.error("Cleanup failed:", error);
  } finally {
    process.exit();
  }
}

cleanup();
