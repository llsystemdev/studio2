
import { NextRequest, NextResponse } from 'next/server';
import { getAuth, getDb } from '@/lib/firebase/server/admin';

export async function POST(request: NextRequest) {
  try {
    const auth = getAuth();
    const db = getDb();
    
    // 1. Verify Authentication
    const token = request.headers.get('Authorization')?.split('Bearer ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;
    
    // 2. Get and validate reservation data
    const reservationData = await request.json();
    if (!reservationData || reservationData.customerId !== uid) {
        return NextResponse.json({ error: 'Forbidden: Mismatched user ID.' }, { status: 403 });
    }

    // 3. Generate a new reservation ID
    const reservationsCollection = db.collection('reservations');
    const snapshot = await reservationsCollection.orderBy('id', 'desc').limit(1).get();
    let newIdNum = 1;
    if (!snapshot.empty) {
        const lastId = snapshot.docs[0].id;
        const lastNum = parseInt(lastId.split('-')[1]);
        if (!isNaN(lastNum)) {
            newIdNum = lastNum + 1;
        }
    }
    const newReservationId = `RES-${String(newIdNum).padStart(3, '0')}`;

    // 4. Use a transaction to ensure atomicity
    await db.runTransaction(async (transaction) => {
        const vehicleRef = db.collection('vehicles').doc(reservationData.vehicleId);
        const reservationRef = reservationsCollection.doc(newReservationId);

        // Check vehicle status within the transaction to prevent race conditions
        const vehicleDoc = await transaction.get(vehicleRef);
        if (!vehicleDoc.exists || vehicleDoc.data()?.status !== 'Available') {
            throw new Error('Vehicle is not available for booking.');
        }

        // Set the reservation document
        transaction.set(reservationRef, {
            ...reservationData,
            id: newReservationId, // Add the generated ID to the document data
            createdAt: new Date().toISOString(),
        });
        
        // Update the vehicle's status to 'Rented'
        transaction.update(vehicleRef, { status: 'Rented' });
    });
    
    // 5. Log activity
    await db.collection('activityLogs').add({
        timestamp: new Date().toISOString(),
        user: reservationData.customerName,
        action: 'Create',
        entityType: 'Reservation',
        entityId: newReservationId,
        details: `Online reservation for ${reservationData.vehicle} created.`
    });

    return NextResponse.json({ success: true, reservationId: newReservationId }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating reservation:', error);
    return NextResponse.json({ error: error.message || 'Failed to create reservation' }, { status: 500 });
  }
}
