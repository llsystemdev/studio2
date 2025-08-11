
import { NextRequest, NextResponse } from 'next/server';
import { getAuth, getDb } from '@/lib/firebase/server/admin';
import type { UserRole } from '@/lib/types';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const auth = getAuth();
    const db = getDb();
    
    // 1. Verify Authentication & Authorization from cookie
    const token = request.cookies.get('firebaseIdToken')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: No token provided.' }, { status: 401 });
    }
    
    // Verify the token and check the custom claim for the role
    const decodedToken = await auth.verifySessionCookie(token, true);
    if (decodedToken.role !== 'Admin') {
         return NextResponse.json({ error: 'Forbidden: You do not have permission to create users.' }, { status: 403 });
    }
    const requestingUser = decodedToken;

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
    
    // 4. Set custom claim for the user's role
    await auth.setCustomUserClaims(userRecord.uid, { role: role });

    // 5. Create User Profile in Firestore
    const userDocRef = db.collection("users").doc(userRecord.uid);
    await userDocRef.set({
      name: displayName,
      email: email,
      role: role,
      photoURL: "",
    });

    // 6. Generate Password Reset Link (acts as an invite)
    const link = await auth.generatePasswordResetLink(email);
    
    // 7. (Optional but Recommended) Send an invitation email using a service like SendGrid
    // Example: await sendInviteEmail(email, displayName, link);
    
    // 8. Log the activity securely on the server
    await db.collection('activityLogs').add({
        timestamp: new Date().toISOString(),
        user: requestingUser.name || requestingUser.email,
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
    } else if (error.code === 'auth/session-cookie-expired' || error.code === 'auth/internal-error') {
       errorMessage = "Authentication session error. Please log out and log in again.";
       statusCode = 401;
    }

    return NextResponse.json({ error: errorMessage, details: error.message }, { status: statusCode });
  }
}
