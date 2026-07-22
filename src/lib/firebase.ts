import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getFunctions, Functions } from 'firebase/functions';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaV3Provider, AppCheck } from 'firebase/app-check';

// Only initialize if env vars are present to mock safe behavior
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;

let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let auth: Auth | undefined;
let functions: Functions | undefined;
let storage: FirebaseStorage | undefined;
let appCheck: AppCheck | undefined;

if (apiKey) {
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  };

  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  
  // 物理法則の調律：認証メールの言語を日本語に固定
  auth.languageCode = 'ja';

  functions = getFunctions(app);
  storage = getStorage(app);

  // === Firebase App Check ===
  // ローカル開発時はデバッグモードを使用（本番reCAPTCHAを使わない）
  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    // デバッグトークンを自動生成してコンソールに出力
    // 初回起動時にコンソールに表示されるトークンをFirebase Consoleに登録する
    (self as unknown as Record<string, unknown>).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }

  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  if (recaptchaSiteKey) {
    try {
      appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(recaptchaSiteKey),
        isTokenAutoRefreshEnabled: true,
      });
      console.log('[App Check] Initialized successfully with key:', recaptchaSiteKey.substring(0, 6) + '...');
    } catch (err) {
      console.error('[App Check] Initialization error:', err);
    }
  } else {
    console.warn('[App Check] VITE_RECAPTCHA_SITE_KEY not found in env. App Check is disabled.');
  }

} else {
  console.warn('Firebase config missing. Running in offline/demo mode.');
}

export { db, auth, functions, storage, appCheck };
