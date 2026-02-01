import { db } from './src/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

async function checkWish() {
    if (!db) {
        console.error("No DB");
        return;
    }
    const q = query(collection(db, 'wishes'), where('content', '==', 'TESUTO'));
    const snapshot = await getDocs(q);
    snapshot.forEach(doc => {
        console.log('--- WISH DATA ---');
        console.log('ID:', doc.id);
        console.log(JSON.stringify(doc.data(), null, 2));
    });
}

checkWish();
