
import * as admin from 'firebase-admin';

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.GCLOUD_PROJECT = 'existence-ticker-dev';

if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'existence-ticker-dev'
    });
}

const db = admin.firestore();

async function checkAdminStatus() {
  try {
    console.log("Checking system_settings/global...");
    const globalSettings = await db.collection('system_settings').doc('global').get();
    if (globalSettings.exists) {
        console.log("Global Settings:", JSON.stringify(globalSettings.data(), null, 2));
    } else {
        console.log("Global Settings: NOT FOUND");
    }

    console.log("\nChecking all users for admin role...");
    const users = await db.collection('users').get();
    let adminCount = 0;
    users.forEach(doc => {
        const data = doc.data();
        if (data.role === 'admin') {
            console.log(`[ADMIN USER FOUND] ID: ${doc.id}, Name: ${data.name}`);
            adminCount++;
        }
    });
    if (adminCount === 0) console.log("No users with role: 'admin' found.");

    // Check for specific super admins collection if it exists
    console.log("\nChecking super_admins collection...");
    const superAdmins = await db.collection('super_admins').get();
    if (superAdmins.empty) {
        console.log("No super_admins documents found.");
    } else {
        superAdmins.forEach(doc => {
            console.log(`[SUPER ADMIN DOC] ID: ${doc.id}`);
        });
    }

  } catch (error) {
    console.error("Error checking status:", error);
  }
}

checkAdminStatus();
