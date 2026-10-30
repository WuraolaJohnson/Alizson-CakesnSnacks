import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID
};

const configured = !!(firebaseConfig.apiKey && firebaseConfig.projectId);

if (!configured) {
  console.warn(
    '[Firebase] Missing env vars VITE_FIREBASE_API_KEY or VITE_FIREBASE_PROJECT_ID. ' +
    'Running in offline/localStorage mode.'
  );
}

const app = configured ? initializeApp(firebaseConfig) : null;

export const auth      = app ? getAuth(app) : null;
export const db        = app ? getFirestore(app) : null;
export const functions = app ? getFunctions(app) : null;

export const isFirebaseReady = () => !!app;
