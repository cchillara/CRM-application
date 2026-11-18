import { initializeApp } from "firebase/app";
import {
    browserSessionPersistence,
    getAuth,
    initializeAuth,
} from "firebase/auth";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const hasFirebaseConfig = Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
);

// Keep public pages renderable when local Firebase settings have not been added.
const app = hasFirebaseConfig ? initializeApp(firebaseConfig) : null;
export const auth = app
    ? (() => {
        try {
            return initializeAuth(app, { persistence: browserSessionPersistence });
        } catch (error) {
            // Vite can re-evaluate this module during HMR after Auth is initialized.
            if (error.code === "auth/already-initialized") return getAuth(app);
            throw error;
        }
    })()
    : null;

window.auth = auth;
