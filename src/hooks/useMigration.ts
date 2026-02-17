import { useState } from 'react';
import { functions } from '../lib/firebase';
import { httpsCallable } from 'firebase/functions';

export const useMigration = () => {
    const [isMigrating, setIsMigrating] = useState(false);
    const [migrationLog, setMigrationLog] = useState<string[]>([]);

    const migrateToPerUserJournal = async (scopeUserId?: string) => {
        if (!functions) return { success: false, error: 'Functions not initialized' };
        setIsMigrating(true);
        setMigrationLog([`[移行] ${scopeUserId ? '個人的な' : '全住民の'}記録を修復プログラムへ送信中...`]);

        try {
            // NOTE: Currently we only provide a 'Migrate All Residents' function for robustness.
            // Individual migration can be added if needed, but the current Cloud Function
            // handles all active residents safely.
            const migrateFn = httpsCallable(functions, 'migrateResidentJournals');
            const result = await migrateFn({ scopeUserId });
            const data = result.data as { success: boolean, createdCount: number, message: string };

            setMigrationLog(prev => [...prev, data.message || "処理が完了しました。"]);
            return { success: data.success, createdCount: data.createdCount };
        } catch (e) {
            console.error("Migration failed:", e);
            const errorMsg = String(e);
            setMigrationLog(prev => [...prev, `[エラー] ${errorMsg}`]);
            return { success: false, error: errorMsg };
        } finally {
            setIsMigrating(false);
        }
    };

    const purgeGhostTransactions = async () => {
        if (!functions) return { success: false, error: 'Functions not initialized' };
        setIsMigrating(true);
        setMigrationLog(["[浄化] 世界に溜まった幽霊記録の抹消を開始します..."]);

        try {
            const purgeFn = httpsCallable(functions, 'purgeGhostJournals');
            const result = await purgeFn();
            const data = result.data as { success: boolean, deletedCount: number, message: string };

            setMigrationLog(prev => [...prev, data.message || "浄化が完了しました。"]);
            return { success: data.success, deletedCount: data.deletedCount };
        } catch (e) {
            console.error("Purge failed:", e);
            setMigrationLog(prev => [...prev, `[エラー] ${String(e)}`]);
            return { success: false, error: String(e) };
        } finally {
            setIsMigrating(false);
        }
    };

    return {
        migrateToPerUserJournal,
        purgeGhostTransactions,
        isMigrating,
        migrationLog
    };
};
