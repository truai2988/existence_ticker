import { db } from './src/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

async function diagnose() {
    if (!db) {
        console.error("No DB");
        return;
    }

    console.log('--- Searching for User "SHIRO TAMAKI" ---');
    const userQ = query(collection(db, 'users'), where('name', '==', 'SHIRO TAMAKI'));
    const userSnapshot = await getDocs(userQ);
    let helperIdFound = null;
    userSnapshot.forEach(doc => {
        console.log('User found:', doc.id, doc.data());
        helperIdFound = doc.id;
    });

    if (helperIdFound) {
        console.log('Found Helper ID:', helperIdFound);
    }

    console.log('\n--- Searching for Wish "TESUTO" ---');
    const wishQ = query(collection(db, 'wishes'), where('content', '==', 'TESUTO'));
    const wishSnapshot = await getDocs(wishQ);
    wishSnapshot.forEach(doc => {
        const data = doc.data();
        console.log('Wish found:', doc.id, {
            status: data.status,
            helper_id: data.helper_id,
            applicants: data.applicants?.map((a: { name: string }) => a.name) || []
        });
    });
}

diagnose();
