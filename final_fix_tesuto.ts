import { db } from './src/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

async function finalFix() {
    if (!db) {
        console.error("No DB");
        return;
    }

    console.log('--- Final Fix: Moving "TESUTO" to Past Records ---');
    const wishQ = query(collection(db, 'wishes'), where('content', '==', 'TESUTO'));
    const wishSnapshot = await getDocs(wishQ);
    
    for (const wishDoc of wishSnapshot.docs) {
        const wishRef = doc(db, 'wishes', wishDoc.id);
        console.log(`Setting wish ${wishDoc.id} to "expired"...`);
        await updateDoc(wishRef, {
            status: 'expired',
            updated_at: serverTimestamp()
        });
    }
    console.log('Done.');
}

finalFix();
