import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getFunctions, Functions } from 'firebase/functions';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Only initialize if env vars are present to mock safe behavior
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;

let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let auth: Auth | undefined;
let functions: Functions | undefined;
let storage: FirebaseStorage | undefined;

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
  console.log('Auth Language Code set to:', auth.languageCode); // Verification log

  functions = getFunctions(app);
  storage = getStorage(app);

  // Connect to Emulators if running locally
  /* 
  if (location.hostname === "localhost") {
      console.log("Connecting to Firebase Emulators...");
      connectFirestoreEmulator(db, 'localhost', 8080);
      connectAuthEmulator(auth, 'http://localhost:9099');
      connectFunctionsEmulator(functions, 'localhost', 5001);
      connectStorageEmulator(storage, 'localhost', 9199);
  }
  */


} else {
  console.warn('Firebase config missing. Running in offline/demo mode.');
}

export { db, auth, functions, storage };
