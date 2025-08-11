
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth as getAdminAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage as getAdminStorage, Storage } from 'firebase-admin/storage';

let adminApp: App | null = null;

function initializeAdminApp() {
    if (getApps().some(app => app.name === 'firebase-admin-app')) {
        return getApps().find(app => app.name === 'firebase-admin-app')!;
    }

    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (privateKey && clientEmail && projectId) {
        try {
            const serviceAccount = {
                projectId,
                clientEmail,
                privateKey: privateKey.replace(/\\n/g, '\n'),
            };
            return initializeApp({
                credential: cert(serviceAccount),
                storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
            }, 'firebase-admin-app');
        } catch (error) {
            console.error("Failed to initialize Firebase Admin SDK:", error);
            throw new Error("Failed to initialize Firebase Admin SDK.");
        }
    } else {
         console.warn("Firebase Admin credentials are not fully set. Server-side functionality will be limited.");
         throw new Error("Firebase Admin credentials are not fully set.");
    }
}

function getAdminApp(): App {
    if (!adminApp) {
        adminApp = initializeAdminApp();
    }
    return adminApp;
}

export function getDb(): Firestore {
    return getFirestore(getAdminApp());
}

export function getAuth(): Auth {
    return getAdminAuth(getAdminApp());
}

export function getStorage(): Storage {
    return getAdminStorage(getAdminApp());
}
