import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as fs from 'fs';
import { initializeApp, cert, getApps } from 'firebase-admin/app';

const serviceAccount = JSON.parse(fs.readFileSync('./scripts/serviceAccountKey.json', 'utf8'));

if (getApps().length === 0) {
    initializeApp({
        credential: cert(serviceAccount)
    });
}

const db = getFirestore();

async function main() {
    try {
        console.log("Looking for in_progress wishes...");
        
        const wishesRef = db.collection("wishes");
        const querySnapshot = await wishesRef.where("status", "==", "in_progress").get();
        
        if (querySnapshot.empty) {
            console.log("No in_progress wishes found.");
            return;
        }

        console.log(`Found ${querySnapshot.size} in_progress wishes.`);
        
        for (const doc of querySnapshot.docs) {
            const data = doc.data();
            console.log(`Reverting wish: ${doc.id} (Title: ${data.title})`);
            
            await doc.ref.update({
                status: "open",
                helper_id: FieldValue.delete(),
                helper_name: FieldValue.delete(),
                contact_note: FieldValue.delete(),
                updated_at: FieldValue.serverTimestamp()
            });
            console.log(`Successfully reverted wish ${doc.id} back to 'open' state!`);
            // Only do one for safety
            break;
        }
        
    } catch (e) {
        console.error("Error:", e);
    }
}

main();
