// Explicitly load environment variables from .env file FIRST.
// This is the crucial fix to ensure server-side code has access to credentials.
import * as dotenv from 'dotenv';
dotenv.config();

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth as getAdminAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage as getAdminStorage, Storage } from 'firebase-admin/storage';


// This holds the initialized admin app instance.
let adminApp: App | null = null;

/**
 * Initializes the Firebase Admin SDK, but only if it hasn't been initialized already.
 * This singleton pattern is crucial for Next.js environments to prevent re-initialization errors.
 */
function initializeAdminApp(): App {
    // If an app named 'firebase-admin-app' already exists, return it.
    const existingApp = getApps().find(app => app.name === 'firebase-admin-app');
    if (existingApp) {
        return existingApp;
    }

    // Retrieve credentials from environment variables that are now loaded by dotenv.
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    
    // This is a more robust check to ensure all required variables are not only present but are valid strings.
    if (!privateKey || !clientEmail || !projectId) {
        const missingVars: string[] = [];
        if (!privateKey) missingVars.push('FIREBASE_PRIVATE_KEY');
        if (!clientEmail) missingVars.push('FIREBASE_CLIENT_EMAIL');
        if (!projectId) missingVars.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
        
        const errorMessage = `Firebase Admin credentials are not fully set in environment variables. Server-side Firebase services will fail. Missing or invalid variables: ${missingVars.join(', ')}`;
        console.error(errorMessage);
        throw new Error(errorMessage);
    }

    try {
        // Format the service account object.
        const serviceAccount = {
            projectId,
            clientEmail,
            // The private key from environment variables needs newlines to be correctly formatted.
            privateKey: privateKey.replace(/\\n/g, '\n'),
        };

        // Initialize the app with a specific name.
        return initializeApp({
            credential: cert(serviceAccount),
            storageBucket: `${projectId}.appspot.com`,
        }, 'firebase-admin-app');
        
    } catch (error: any) {
        const detailedMessage = `Failed to initialize Firebase Admin SDK. Please check if your credentials in .env are correct. Details: ${error.message}`;
        console.error("Firebase Admin SDK Initialization Error:", detailedMessage);
        throw new Error(detailedMessage);
    }
}


/**
 * Returns the initialized Firebase Admin App instance, creating it if necessary.
 * This is the function that should be used by other server-side modules.
 */
function getAdminApp(): App {
    if (!adminApp) {
        adminApp = initializeAdminApp();
    }
    return adminApp;
}

// Export functions that provide the initialized services.
export function getDb(): Firestore {
    return getFirestore(getAdminApp());
}

export function getAuth(): Auth {
    return getAdminAuth(getAdminApp());
}

export function getStorage(): Storage {
    return getAdminStorage(getAdminApp());
}
