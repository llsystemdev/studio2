
import { NextRequest, NextResponse } from 'next/server';
import { getAuth, getDb } from '@/lib/firebase/server/admin';
import type { UserRole } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const auth = getAuth();
    const db = getDb();
    
    // 1. Verify Authentication & Authorization
    const token = request.cookies.get('firebaseIdToken')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: No token provided.' }, { status: 401 });
    }
    
    const decodedToken = await auth.verifyIdToken(token);
    const requestingUid = decodedToken.uid;
    
    const userDoc = await db.collection('users').doc(requestingUid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'Admin') {
         return NextResponse.json({ error: 'Forbidden: You do not have permission to create users.' }, { status: 403 });
    }

    // 2. Validate Input
    const { email, displayName, role } = (await request.json()) as { email: string; displayName: string, role: UserRole };
    if (!email || !displayName || !role) {
      return NextResponse.json({ error: 'Missing required fields: email, displayName, role.' }, { status: 400 });
    }

    // 3. Create User in Firebase Auth
    const userRecord = await auth.createUser({
      email: email,
      displayName: displayName,
      emailVerified: false, // User will verify when they set their password
    });

    // 4. Create User Profile in Firestore
    const userDocRef = db.collection("users").doc(userRecord.uid);
    await userDocRef.set({
      name: displayName,
      email: email,
      role: role,
      photoURL: "",
    });

    // 5. Generate Password Reset Link (acts as an invite)
    const link = await auth.generatePasswordResetLink(email);
    
    // 6. (Optional but Recommended) Send an invitation email using a service like SendGrid
    // Example: await sendInviteEmail(email, displayName, link);
    
    // 7. Log the activity
    await db.collection('activityLogs').add({
        timestamp: new Date().toISOString(),
        user: userDoc.data()?.name || 'Admin',
        action: 'Create',
        entityType: 'User',
        entityId: userRecord.uid,
        details: `Invited new user: ${displayName} with role ${role}`
    });


    return NextResponse.json({ 
        success: true, 
        message: `User ${displayName} created. An invitation/password reset link could be sent to ${email}.`,
        uid: userRecord.uid,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error creating new user:', error);

    let errorMessage = "An internal error occurred.";
    let statusCode = 500;

    if (error.code === 'auth/email-already-exists') {
      errorMessage = "This email address is already in use by another account.";
      statusCode = 409; // Conflict
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = "The email address provided is not valid.";
      statusCode = 400;
    } else if (error.code === 'auth-argument-error') {
       errorMessage = "Authentication token is invalid or expired. Please log in again.";
       statusCode = 401;
    }

    return NextResponse.json({ error: errorMessage, details: error.message }, { status: statusCode });
  }
}
