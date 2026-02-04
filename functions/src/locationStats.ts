import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * Updates the location_stats collection when a user's location changes.
 * This ensures we have a real-time counter of users in each city without
 * querying the entire users collection.
 */
// Helper to clean up wishes (requests)
const cleanupUserWishes = async (userId: string) => {
  const requestsRef = db.collection("requests");
  
  // 1. Close "Open" requests (Natural Expiration)
  const openSnapshot = await requestsRef
    .where("author_id", "==", userId)
    .where("status", "==", "open")
    .get();

  const batch = db.batch();
  let opCount = 0;

  openSnapshot.docs.forEach((doc) => {
    batch.update(doc.ref, { 
      status: "expired",
      archived: true,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
    opCount++;
  });

  // 2. Handle "In Progress" requests (Preserve Integrity? Or Interrupt?)
  // Prompt: "Avoid one-sided disappearance... notify or system interruption"
  // We will mark them as "interrupted" or "cancelled" so the other party isn't stuck.
  const progressSnapshot = await requestsRef
    .where("author_id", "==", userId)
    .where("status", "==", "in_progress")
    .get();

  progressSnapshot.docs.forEach((doc) => {
    batch.update(doc.ref, {
      status: "interrupted", // Custom status for withdrawal
      helper_note: "The wisher has withdrawn from the world.",
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
    opCount++;
  });

  if (opCount > 0) {
    await batch.commit();
    console.log(`Cleaned up ${opCount} wishes for deleted user ${userId}`);
  }
};

/**
 * Updates the location_stats collection when a user's location changes.
 * Enforces strict synchronization and safety against negative counts using Transactions.
 */
export const updateLocationStats = functions.firestore
  .document("users/{userId}")
  .onWrite(async (change, context) => {
    const userId = context.params.userId;
    const beforeData = change.before.exists ? change.before.data() : null;
    const afterData = change.after.exists ? change.after.data() : null;

    // 1. DETECT DELETION & CLEANUP TRACES
    if (beforeData && !afterData) {
        console.log(`User ${userId} deleted. Initiating Trace Cleanup.`);
        await cleanupUserWishes(userId);
    }

    // 2. DETECT LOCATION CHANGES (Stats Sync)
    const oldLoc = beforeData?.location;
    const newLoc = afterData?.location;

    const oldKey = oldLoc?.prefecture && oldLoc?.city ? `${oldLoc.prefecture}_${oldLoc.city}` : null;
    const newKey = newLoc?.prefecture && newLoc?.city ? `${newLoc.prefecture}_${newLoc.city}` : null;

    // Logic:
    // If oldKey exists AND (User deleted OR key changed) -> Decrement Old
    // If newKey exists AND (User created OR key changed) -> Increment New

    const shouldDecrement = oldKey && (!afterData || oldKey !== newKey);
    const shouldIncrement = newKey && (!beforeData || oldKey !== newKey);

    if (!shouldDecrement && !shouldIncrement) return;

    // STRICT SYNC: Run in Transaction to enforce "No Negative" rule
    await db.runTransaction(async (t) => {
        // Reads
        let oldDoc: admin.firestore.DocumentSnapshot | null = null;
        let newDoc: admin.firestore.DocumentSnapshot | null = null;
        const oldRef = oldKey ? db.collection("location_stats").doc(oldKey) : null;
        const newRef = newKey ? db.collection("location_stats").doc(newKey) : null;

        if (shouldDecrement && oldRef) {
            oldDoc = await t.get(oldRef);
        }
        if (shouldIncrement && newRef) {
            newDoc = await t.get(newRef);
        }

        // Writes
        if (shouldDecrement && oldRef) {
            const current = oldDoc && oldDoc.exists ? (oldDoc.data()?.count || 0) : 0;
            // SAFETY DEVICE: Prevent negative count
            const next = Math.max(0, current - 1);
            
            t.set(oldRef, {
                count: next,
                prefecture: oldLoc.prefecture,
                city: oldLoc.city,
                last_updated: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        }

        if (shouldIncrement && newRef) {
            // For increment, we can just use atomic increment usually, but since we are in transaction:
            const current = newDoc && newDoc.exists ? (newDoc.data()?.count || 0) : 0;
            const next = current + 1;
            
            t.set(newRef, {
                count: next,
                prefecture: newLoc.prefecture,
                city: newLoc.city,
                last_updated: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        }
    });
    
    console.log(`Synced location stats for user ${userId}.`);
  });

/**
 * One-time initialization script to count all existing users a populate location_stats.
 * Can be called from the client app by an admin.
 */
export const initializeLocationStats = functions.https.onCall(
  async (data, context) => {
    // Basic auth check
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be logged in.",
      );
    }

    // In a real app, you might want to check for admin role here
    // if (context.auth.token.role !== 'admin') ...

    console.log("Starting Location Stats Initialization...");

    const stats: Record<
      string,
      { count: number; prefecture: string; city: string }
    > = {};
    const usersSnapshot = await db.collection("users").get();

    let processedCount = 0;

    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.location?.prefecture && userData.location?.city) {
        const key = `${userData.location.prefecture}_${userData.location.city}`;
        if (!stats[key]) {
          stats[key] = {
            count: 0,
            prefecture: userData.location.prefecture,
            city: userData.location.city,
          };
        }
        stats[key].count++;
      }
      processedCount++;
    });

    // Write to Firestore in batches
    const BATCH_SIZE = 400;
    let batch = db.batch();
    let batchCount = 0;
    const entries = Object.entries(stats);

    console.log(
      `Calculated stats for ${processedCount} users. Updating ${entries.length} locations.`,
    );

    for (const [docId, data] of entries) {
      const ref = db.collection("location_stats").doc(docId);
      batch.set(ref, {
        count: data.count,
        prefecture: data.prefecture,
        city: data.city,
        last_updated: admin.firestore.FieldValue.serverTimestamp(),
      });
      batchCount++;

      if (batchCount >= BATCH_SIZE) {
        await batch.commit();
        batch = db.batch();
        batchCount = 0;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }

    return {
      success: true,
      message: `Processed ${processedCount} users. Updated ${entries.length} locations.`,
    };
  },
);
