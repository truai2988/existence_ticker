import { useState } from 'react';
import { db } from '../lib/firebase';
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    writeBatch, 
    doc,
    Timestamp 
} from 'firebase/firestore';

export const useMigration = () => {
    const [isMigrating, setIsMigrating] = useState(false);
    const [migrationLog, setMigrationLog] = useState<string[]>([]);

    const migrateJournal = async () => {
        if (!db) return { success: false, error: 'Database not initialized' };
        setIsMigrating(true);
        setMigrationLog(["[Migration] Starting Journal Backfill..."]);

        try {
            const wishesRef = collection(db, 'wishes');
            const txRef = collection(db, 'transactions');

            // 1. Fetch all cancelled/expired wishes
            const qWishes = query(wishesRef, where('status', 'in', ['cancelled', 'expired']));
            const wishSnap = await getDocs(qWishes);

            if (wishSnap.empty) {
                setMigrationLog(prev => [...prev, "No wishes found for migration."]);
                return { success: true, totalProcessed: 0, createdCount: 0 };
            }

            setMigrationLog(prev => [...prev, `Found ${wishSnap.size} wishes to analyze.`]);

            let createdCount = 0;
            let skippedCount = 0;
            const batch = writeBatch(db);

            for (const wishDoc of wishSnap.docs) {
                const wishId = wishDoc.id;
                const wishData = wishDoc.data();

                // 2. Check if a transaction exists for this wish ID
                const qTx = query(txRef, where('wish_id', '==', wishId));
                const txSnap = await getDocs(qTx);

                if (txSnap.empty) {
                    // Create transaction
                    const txId = `${wishData.status}_migration_${wishId}`;
                    const targetTxRef = doc(txRef, txId);
                    
                    const timestamp = wishData.cancelled_at || wishData.updated_at || wishData.created_at || Timestamp.now();

                    batch.set(targetTxRef, {
                        type: wishData.status === 'cancelled' ? 'WISH_CANCELLED' : 'WISH_EXPIRED',
                        amount: 0,
                        created_at: timestamp,
                        sender_id: wishData.requester_id,
                        sender_name: wishData.requester_name || "Anonymous",
                        recipient_id: wishData.helper_id || null,
                        recipient_name: wishData.helper_name || null,
                        wish_title: wishData.content,
                        wish_id: wishId,
                        description: "data_migration_backfill"
                    });
                    createdCount++;
                } else {
                    skippedCount++;
                }
            }

            if (createdCount > 0) {
                await batch.commit();
            }

            setMigrationLog(prev => [
                ...prev, 
                `Migration Complete: Created ${createdCount}, Skipped ${skippedCount}.`
            ]);
            
            return { success: true, createdCount, totalProcessed: wishSnap.size };

        } catch (e) {
            console.error("Migration failed:", e);
            const errorMsg = String(e);
            setMigrationLog(prev => [...prev, `[Error] ${errorMsg}`]);
            return { success: false, error: errorMsg };
        } finally {
            setIsMigrating(false);
        }
    };

    return {
        migrateJournal,
        isMigrating,
        migrationLog
    };
};
