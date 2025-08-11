
import { NextRequest, NextResponse } from 'next/server';
import { getAuth, getDb } from '@/lib/firebase/server/admin';
import type { Review } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const auth = getAuth();
    const db = getDb();
    
    // 1. Verify Authentication from session cookie
    const token = request.cookies.get('firebaseIdToken')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: No session cookie.' }, { status: 401 });
    }
    const decodedToken = await auth.verifySessionCookie(token, true);
    
    // 2. Get and validate review data
    const { reservationId, vehicleId, customerId, customerName, rating, comment } = await request.json();

    if (decodedToken.uid !== customerId) {
        return NextResponse.json({ error: 'Forbidden: You can only submit reviews for yourself.' }, { status: 403 });
    }
    if (!reservationId || !vehicleId || !rating || !comment) {
        return NextResponse.json({ error: 'Missing required review fields.' }, { status: 400 });
    }
    
    // 3. Check if a review for this reservation already exists
    const reviewsRef = db.collection('reviews');
    const existingReviewQuery = await reviewsRef.where('reservationId', '==', reservationId).limit(1).get();
    if (!existingReviewQuery.empty) {
        return NextResponse.json({ error: 'A review for this reservation has already been submitted.' }, { status: 409 });
    }

    // 4. Create the new review document
    const newReview: Omit<Review, 'id'> = {
        reservationId,
        vehicleId,
        customerId,
        customerName,
        rating,
        comment,
        timestamp: new Date().toISOString(),
        status: 'Pending',
    };
    
    const docRef = await reviewsRef.add(newReview);
    
    const finalReview = { id: docRef.id, ...newReview };

    return NextResponse.json(finalReview, { status: 201 });

  } catch (error: any) {
    console.error('Error creating review:', error);
     if (error.code === 'auth/session-cookie-expired' || error.code === 'auth/session-cookie-revoked') {
         return NextResponse.json({ error: 'Session expired. Please log in again.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to create review.' }, { status: 500 });
  }
}
