import admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";

/**
 * setAdminClaim.ts
 * 
 * 指定したユーザーUIDに「admin: true」のカスタムクレームを付与するためのローカルスクリプトです。
 * 
 * 使い方:
 * 1. Firebaseコンソールの「プロジェクトの設定 > サービス アカウント」から
 *    新しい秘密鍵を生成し、JSONファイルをダウンロードします。
 * 2. そのファイルを scripts/serviceAccountKey.json として保存してください。
 * 3. 以下のUIDを付与したいユーザーのUIDに書き換えます。
 * 4. npx ts-node scripts/setAdminClaim.ts を実行します。
 */

const UID_TO_GRANT = "INSERT_USER_UID_HERE"; 

// サービスアカウントキーの読み込み
const serviceAccountPath = path.resolve(__dirname, "serviceAccountKey.json");

if (!fs.existsSync(serviceAccountPath)) {
  console.error("Error: serviceAccountKey.json not found in scripts/ directory.");
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function setAdminClaim(uid: string) {
  try {
    // ユーザーが存在するか確認
    const user = await admin.auth().getUser(uid);
    console.log(`User found: ${user.displayName || user.email || uid}`);

    // カスタムクレーム（admin: true）を付与
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    
    console.log(`Success: Custom claim 'admin: true' set for user ${uid}`);
    
    // 検証
    const updatedUser = await admin.auth().getUser(uid);
    console.log("Current Claims:", updatedUser.customClaims);
    
    console.log("\nNote: The user must sign out and sign back in (or refresh their ID token) to see the changes.");
    
  } catch (error) {
    console.error("Error setting custom claims:", error);
  } finally {
    process.exit();
  }
}

setAdminClaim(UID_TO_GRANT);
