const admin = require("firebase-admin");
const path = require("path");

// Function to run the restore
async function restoreAdmin() {
  try {
    // 1. Initialize Firebase Admin
    const serviceAccountPath = path.resolve("./serviceAccountKey.json");
    
    // Check if serviceAccountKey.json exists
    try {
      require("fs").accessSync(serviceAccountPath);
    } catch (e) {
      console.log("❌ serviceAccountKey.json not found in the root directory.");
      process.exit(1);
    }

    const serviceAccount = require(serviceAccountPath);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    const db = admin.firestore();

    // 2. Find the user. We'll search for the first user (usually the developer) or a specific email if needed.
    // For this script, we'll try to find any user that was previously an admin or just pick the oldest account.
    console.log("🔍 Finding your user account...");
    const usersSnapshot = await db.collection("users").orderBy("created_at", "asc").limit(3).get();
    
    if (usersSnapshot.empty) {
      console.log("❌ No users found in the database. Please log in to the app first.");
      process.exit(1);
    }

    // Usually the developer is the first user
    const targetUser = usersSnapshot.docs[0];
    const uid = targetUser.id;
    const userData = targetUser.data();
    
    console.log(`✅ Found target user: ${userData.name || uid} (${userData.email || "No email"})`);

    // 3. Update the global system_settings
    console.log("⚙️  Updating global system settings...");
    const settingsRef = db.collection("system_settings").doc("global");
    const settingsDoc = await settingsRef.get();
    
    let currentSuperIds = [];
    if (settingsDoc.exists) {
      currentSuperIds = settingsDoc.data().super_admin_ids || [];
    }
    
    if (!currentSuperIds.includes(uid)) {
      currentSuperIds.push(uid);
      await settingsRef.set({ super_admin_ids: currentSuperIds }, { merge: true });
    }

    // 4. Update the super_admins collection (for security rules)
    console.log("🛡️  Granting SUPER ADMIN privileges...");
    await db.collection("super_admins").doc(uid).set({
      uid: uid,
      email: userData.email || "",
      is_super: true,
      granted_at: admin.firestore.FieldValue.serverTimestamp()
    });

    // 5. Update the users collection role
    console.log("👤 Setting role to 'admin'...");
    await db.collection("users").doc(uid).update({
      role: "admin"
    });

    console.log("\n🎉 EMERGENCY RESTORE COMPLETE! \nRefresh your browser to access the Admin Dashboard (GOD MODE).");
    process.exit(0);

  } catch (error) {
    console.error("❌ Error during restoration:", error);
    process.exit(1);
  }
}

restoreAdmin();
