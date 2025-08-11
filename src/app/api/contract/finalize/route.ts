
import { NextRequest, NextResponse } from 'next/server';
import { getAuth, getDb, getStorage } from '@/lib/firebase/server/admin';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import type { Contract } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const auth = getAuth();
    const db = getDb();
    const storage = getStorage();

    // 1. Verify Authentication
    const authToken = request.headers.get('Authorization')?.split('Bearer ')[1];
    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized: No token provided.' }, { status: 401 });
    }
    const decodedToken = await auth.verifyIdToken(authToken);
    const uid = decodedToken.uid;

    // 2. Process FormData
    const formData = await request.formData();
    const contractId = formData.get('contractId') as string;
    const idPhoto = formData.get('idPhoto') as File;
    const signature = formData.get('signature') as File;

    if (!contractId || !idPhoto || !signature) {
        return NextResponse.json({ error: 'Missing contractId, idPhoto, or signature.' }, { status: 400 });
    }

    // 3. Get Contract and Vehicle
    const contractRef = db.collection('contracts').doc(contractId);
    const contractDoc = await contractRef.get();
    if (!contractDoc.exists) {
        return NextResponse.json({ error: 'Contract not found.' }, { status: 404 });
    }
    const contract = contractDoc.data() as Contract;

    const vehicleRef = db.collection('vehicles').doc(contract.vehicleId);

    // 4. Upload Files to Storage
    const bucket = storage.bucket();
    const uploadFile = async (file: File, path: string) => {
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileRef = bucket.file(path);
      const token = uuidv4();
      await fileRef.save(buffer, {
        metadata: {
          contentType: file.type,
          metadata: { firebaseStorageDownloadTokens: token }
        },
      });
      return fileRef.publicUrl() + `?alt=media&token=${token}`;
    };

    const [idPhotoUrl, signatureUrl] = await Promise.all([
        uploadFile(idPhoto, `documents/${uid}/${contractId}-id.jpg`),
        uploadFile(signature, `signatures/${uid}/${contractId}-sig.png`),
    ]);

    // 5. Create Reservation and Update Vehicle in a Transaction
    const reservationsCollection = db.collection('reservations');
    const snapshot = await reservationsCollection.orderBy('id', 'desc').limit(1).get();
    let newIdNum = 1;
    if (!snapshot.empty) {
        const lastId = snapshot.docs[0].id;
        const lastNum = parseInt(lastId.split('-')[1]);
        if (!isNaN(lastNum)) newIdNum = lastNum + 1;
    }
    const newReservationId = `RES-${String(newIdNum).padStart(3, '0')}`;
    const reservationRef = reservationsCollection.doc(newReservationId);

    await db.runTransaction(async (transaction) => {
        const vehicleDoc = await transaction.get(vehicleRef);
        if (!vehicleDoc.exists || vehicleDoc.data()?.status !== 'Available') {
            throw new Error('Vehicle is no longer available.');
        }
        
        transaction.set(reservationRef, {
            id: newReservationId,
            customerId: uid,
            customerName: contract.customerName,
            vehicleId: contract.vehicleId,
            vehicle: contract.vehicleName,
            pickupDate: contract.pickupDate,
            dropoffDate: contract.dropoffDate,
            status: 'Upcoming',
            agent: 'Online System',
            insuranceCost: contract.totalCost - (vehicleDoc.data()?.pricePerDay * (differenceInCalendarDays(parseISO(contract.dropoffDate), parseISO(contract.pickupDate)) || 1)),
            totalCost: contract.totalCost,
            contractId: contractId,
        });

        transaction.update(vehicleRef, { status: 'Rented' });
    });
    
    // 6. Update Contract
    await contractRef.update({
        status: 'signed_by_client',
        customerId: uid,
        clientSignatureUrl: signatureUrl,
        clientIdPhotoUrl: idPhotoUrl,
        signedAt: new Date().toISOString(),
        reservationId: newReservationId,
    });

    return NextResponse.json({ success: true, reservationId: newReservationId });
  } catch (error: any) {
    console.error('Error in /api/contract/finalize:', error);
    return NextResponse.json({ error: error.message || 'Failed to finalize reservation.' }, { status: 500 });
  }
}
