
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase/server/admin';
import {
    initialVehiclesData,
    initialCustomers,
    initialReservations,
    initialInvoices,
    initialExpenses,
    initialMaintenanceLogs,
    initialReviews
} from '@/lib/data';
import type { Vehicle, Customer, Reservation, Invoice, Expense, MaintenanceLog, Review } from '@/lib/types';


async function seedCollection<T extends { id?: string }>(
    db: FirebaseFirestore.Firestore,
    collectionName: string,
    data: (Omit<T, 'id'> | (T & { id: string }))[],
    generateImages: boolean = false
) {
    const collectionRef = db.collection(collectionName);
    
    const snapshot = await collectionRef.get();
    if (!snapshot.empty) {
        console.log(`Collection '${collectionName}' is already populated. Skipping seed.`);
        return;
    }

    console.log(`Seeding collection '${collectionName}'...`);
    const batch = db.batch();
    let seededCount = 0;

    for (const item of data) {
        const docRef = 'id' in item && typeof item.id === 'string'
            ? collectionRef.doc(item.id)
            : collectionRef.doc();
        
        let finalItem: any = { ...item }; 

        if (generateImages && collectionName === 'vehicles') {
            // AI Image generation is disabled for stability.
            // This can be re-enabled in the future.
            finalItem.imageUrls = ['https://placehold.co/600x400.png'];
        }

        batch.set(docRef, finalItem);
        seededCount++;
    }

    await batch.commit();
    console.log(`Successfully seeded ${seededCount} documents into '${collectionName}'.`);
}


export async function POST() {
  try {
    console.log("Starting database seed process...");
    const db = getDb();

    // Set generateImages to false to prevent slow seeding process.
    await seedCollection<Vehicle>(db, 'vehicles', initialVehiclesData, false);
    await seedCollection<Customer>(db, 'customers', initialCustomers);
    await seedCollection<Reservation>(db, 'reservations', initialReservations);
    await seedCollection<Invoice>(db, 'invoices', initialInvoices);
    await seedCollection<Expense>(db, 'expenses', initialExpenses);
    await seedCollection<MaintenanceLog>(db, 'maintenanceLogs', initialMaintenanceLogs);
    await seedCollection<Review>(db, 'reviews', initialReviews);
    
    return NextResponse.json({ success: true, message: 'Database seeded successfully!' });
  } catch (error: any) {
    console.error("Error seeding database:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
