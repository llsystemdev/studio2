
import { NextRequest, NextResponse } from 'next/server';
import { getAuth, getDb } from '@/lib/firebase/server/admin';
import type { Reservation, Review, Customer } from '@/lib/types';
import { FieldPath } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = getAuth();
    const db = getDb();
    
    // 1. Verify Authentication from session cookie
    const token = request.cookies.get('firebaseIdToken')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: No session cookie.' }, { status: 401 });
    }
    
    const decodedToken = await auth.verifySessionCookie(token, true);
    const uid = decodedToken.uid;

    // 2. Fetch data in parallel
    const reservationsQuery = db.collection('reservations').where('customerId', '==', uid).orderBy('pickupDate', 'desc');
    const reviewsQuery = db.collection('reviews').where('customerId', '==', uid);
    const customerDoc = db.collection('customers').doc(uid).get();


    const [reservationsSnapshot, reviewsSnapshot, customerSnapshot] = await Promise.all([
        reservationsQuery.get(),
        reviewsQuery.get(),
        customerDoc
    ]);
    
    const reservations = reservationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reservation));
    const reviews = reviewsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
    const customer = customerSnapshot.exists ? { id: customerSnapshot.id, ...customerSnapshot.data() } as Customer : null;

    // 3. Return the data
    return NextResponse.json({ reservations, reviews, customer });

  } catch (error: any) {
    console.error('Error fetching client data:', error);
    if (error.code === 'auth/session-cookie-expired' || error.code === 'auth/session-cookie-revoked') {
         return NextResponse.json({ error: 'Session expired. Please log in again.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to fetch client data' }, { status: 500 });
  }
}
