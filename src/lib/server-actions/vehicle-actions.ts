
'use server';

import { getDb } from '@/lib/firebase/server/admin';
import type { Vehicle } from '@/lib/types';
import { notFound } from 'next/navigation';

export async function getVehiclesForHomePage(): Promise<{ vehicles: Vehicle[], error?: string }> {
    try {
        const db = getDb();
        // Fetch all vehicles that are available, ordering might be added later.
        const vehiclesSnapshot = await db.collection('vehicles')
            .where('status', '==', 'Available')
            .get();
        
        if (vehiclesSnapshot.empty) {
            console.log("No available vehicles found in the database.");
            // This is not an error, just an empty state.
            return { vehicles: [] };
        }
        
        const vehiclesData = vehiclesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
        
        return { vehicles: vehiclesData };

    } catch (err: any) {
        let errorMessage = `Could not connect to the database to load the fleet. Please check your Firebase credentials and server configuration. Details: ${err.message}`;
        if (err.code === 'UNAUTHENTICATED' || err.code === 16 || err.code === 7) {
             errorMessage = "Could not authenticate with Firebase. Please ensure your FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, and NEXT_PUBLIC_FIREBASE_PROJECT_ID environment variables are set correctly and that the service account has permissions.";
        } else if (err.message.includes('Failed to initialize Firebase')) {
            errorMessage = "Firebase Admin SDK failed to initialize. Make sure all required Firebase environment variables are present.";
        }
        
        console.error("Critical Error in getVehiclesForHomePage:", errorMessage);
        
        // Return an explicit error to be handled by the UI
        return { 
            vehicles: [], 
            error: errorMessage
        };
    }
}


export async function getVehicleData(id: string): Promise<Vehicle | null> {
    if (!id) {
        notFound();
    }
    try {
        const db = getDb();
        const vehicleDoc = await db.collection('vehicles').doc(id).get();

        if (!vehicleDoc.exists) {
            return null; // Let the client component handle the notFound() case
        }
        
        return { id: vehicleDoc.id, ...vehicleDoc.data() } as Vehicle;

    } catch (error) {
        console.error(`Error fetching vehicle ${id}:`, error);
        // In case of a database connection error, we can also treat it as not found.
        return null;
    }
}
