"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.monitorBalances = exports.resetCycle = exports.checkConnectivity = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
__exportStar(require("./locationStats"), exports);
__exportStar(require("./ai"), exports);
__exportStar(require("./deleteAccount"), exports);
exports.checkConnectivity = functions.https.onCall(async () => {
    console.log("[checkConnectivity] Function hit!");
    return { success: true, message: "Local emulator is reachable", timestamp: Date.now() };
});
if (!admin.apps.length) {
    admin.initializeApp();
}
exports.resetCycle = functions.https.onCall(async (data, context) => {
    // 1. Security Check
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    // 将来的にはここでAdmin UIDチェックを行う推奨
    // const ADMIN_UID = '...';
    // if (context.auth.uid !== ADMIN_UID) ...
    const newCapacity = data.capacity || 2400; // デフォルトは2400
    const batchLimit = 500; // Firestoreのバッチ書き込み上限
    const db = admin.firestore(); // Lazy Init
    let batch = db.batch();
    let operationCount = 0;
    try {
        // 2. Fetch all profiles
        // TODO: ユーザー数が増えた場合はCollectionGroupクエリやページネーションを検討
        const profilesSnapshot = await db.collection('users').get();
        const totalUsers = profilesSnapshot.size;
        console.log(`Starting World Reset for ${totalUsers} souls to ${newCapacity} Lm.`);
        for (const doc of profilesSnapshot.docs) {
            const ref = doc.ref;
            // 3. Reset Logic
            batch.update(ref, {
                balance: newCapacity, // 'lumen_balance' -> 'balance' (Current Schema)
                last_updated: admin.firestore.FieldValue.serverTimestamp(), // 'last_synced_at' -> 'last_updated' (Current Schema)
            });
            operationCount++;
            // バッチ上限チェック
            if (operationCount >= batchLimit) {
                await batch.commit();
                batch = db.batch();
                operationCount = 0;
            }
        }
        // 残りのバッチをコミット
        if (operationCount > 0) {
            await batch.commit();
        }
        console.log(`World Reset Completed. Cycles updated.`);
        return {
            success: true,
            message: `World Reset Completed. ${totalUsers} souls have been renewed to ${newCapacity} Lm.`,
            timestamp: Date.now()
        };
    }
    catch (error) {
        console.error('World Reset Failed:', error);
        throw new functions.https.HttpsError('internal', 'Failed to reset the world.', error);
    }
});
/**
 * 2. Balance Monitor: The Silent Watcher
 * ユーザー残高が更新されるたびに、0未満になっていないか監視する。
 * もし負の残高が発生した場合、それは「物理法則の崩壊」を意味するため、
 * 直ちに異常ログ（anomalies collection）に記録する。
 */
exports.monitorBalances = functions.firestore
    .document('users/{userId}')
    .onUpdate(async (change, context) => {
    const db = admin.firestore(); // Lazy Init
    const newValue = change.after.data();
    const balance = newValue.balance;
    // 負の不渡りを検知
    if (typeof balance === 'number' && balance < 0) {
        console.error(`[CRITICAL] Negative Balance Detected! User: ${context.params.userId}, Balance: ${balance}`);
        // 異常事態を記録
        await db.collection('anomalies').add({
            type: 'negative_balance',
            userId: context.params.userId,
            userName: newValue.name || 'Unknown',
            balance: balance,
            detectedAt: admin.firestore.FieldValue.serverTimestamp(),
            severity: 'CRITICAL',
            snapshot: newValue
        });
    }
});
//# sourceMappingURL=index.js.map