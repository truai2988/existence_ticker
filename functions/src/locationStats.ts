import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * Updates the location_stats collection when a user's location changes.
 * This ensures we have a real-time counter of users in each city without
 * querying the entire users collection.
 */
export const updateLocationStats = functions.firestore
  .document("users/{userId}")
  .onWrite(async (change, context) => {
    const beforeData = change.before.exists ? change.before.data() : null;
    const afterData = change.after.exists ? change.after.data() : null;

    const batch = db.batch();
    let isModified = false;

    // Helper to get doc ID from location
    const getDocId = (prefecture: string, city: string) =>
      `${prefecture}_${city}`;

    // 1. User Deleted or Location Removed
    if (beforeData?.location?.prefecture && beforeData?.location?.city) {
      // If user was deleted OR location changed/removed
      if (
        !afterData ||
        afterData.location?.prefecture !== beforeData.location.prefecture ||
        afterData.location?.city !== beforeData.location.city
      ) {
        const oldDocId = getDocId(
          beforeData.location.prefecture,
          beforeData.location.city,
        );
        const oldRef = db.collection("location_stats").doc(oldDocId);

        batch.set(
          oldRef,
          {
            count: admin.firestore.FieldValue.increment(-1),
            prefecture: beforeData.location.prefecture,
            city: beforeData.location.city,
          },
          { merge: true },
        );
        isModified = true;
      }
    }

    // 2. User Created or Location Added/Changed
    if (afterData?.location?.prefecture && afterData?.location?.city) {
      // If user is new OR location changed/added
      if (
        !beforeData ||
        beforeData.location?.prefecture !== afterData.location.prefecture ||
        beforeData.location?.city !== afterData.location.city
      ) {
        const newDocId = getDocId(
          afterData.location.prefecture,
          afterData.location.city,
        );
        const newRef = db.collection("location_stats").doc(newDocId);

        batch.set(
          newRef,
          {
            count: admin.firestore.FieldValue.increment(1),
            prefecture: afterData.location.prefecture,
            city: afterData.location.city,
          },
          { merge: true },
        );
        isModified = true;
      }
    }

    if (isModified) {
      await batch.commit();
      console.log(`Updated location stats for user ${context.params.userId}`);
    }
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
