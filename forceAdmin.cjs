const admin = require('firebase-admin');

if (!admin.apps.length) {
  try {
    const serviceAccount = require('./serviceAccountKey.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (err) {
    admin.initializeApp();
  }
}

const db = admin.firestore();

async function forceAdmin() {
  const targetUid = 'ibtvyHP1dMcgfo6RFm403dXMXDu1'; // User UID from screenshot
  console.log(`Forcing admin role for user: ${targetUid}`);
  
  try {
    const userRef = db.collection('users').doc(targetUid);
    await userRef.update({ role: 'admin' });
    console.log(`Successfully updated role to 'admin' for ${targetUid}`);
  } catch (error) {
    console.error('Update failed:', error);
  }
}

forceAdmin();
