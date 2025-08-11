
import { NextRequest, NextResponse } from 'next/server';
import { getAuth, getDb } from '@/lib/firebase/server/admin';
import type { UserRecord } from 'firebase-admin/auth';

const ADMIN_EMAIL = 'soypromord@gmail.com';
const ADMIN_NAME = 'Admin User';

export async function POST(request: NextRequest) {
  try {
    const auth = getAuth();
    const db = getDb();
    
    let userRecord: UserRecord;
    let wasUserCreated = false;

    try {
      // Check if the user already exists in Firebase Auth
      userRecord = await auth.getUserByEmail(ADMIN_EMAIL);
      console.log('Admin user already exists in Auth.');
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // If user does not exist, create them
        console.log('Admin user not found, creating...');
        wasUserCreated = true;
        userRecord = await auth.createUser({
          email: ADMIN_EMAIL,
          displayName: ADMIN_NAME,
          emailVerified: true, // Let's trust this email for now
        });
        
        // Send a password reset email which acts as an invitation
        const link = await auth.generatePasswordResetLink(ADMIN_EMAIL);
        // In a real app, you would email this link to the user.
        console.log(`Password reset link for ${ADMIN_EMAIL}: ${link}`);

      } else {
        // For other errors, re-throw
        throw error;
      }
    }
    
    // Now, ensure the user has the 'Admin' role in Firestore and custom claims
    const userDocRef = db.collection('users').doc(userRecord.uid);
    const userDoc = await userDocRef.get();

    let needsUpdate = false;
    if (!userDoc.exists) {
        needsUpdate = true;
    } else {
        const userData = userDoc.data();
        if (userData?.role !== 'Admin') {
            needsUpdate = true;
        }
    }
    
    if (needsUpdate) {
        console.log(`Setting/updating role to 'Admin' for ${ADMIN_EMAIL} in Firestore.`);
        await userDocRef.set({
            name: ADMIN_NAME,
            email: ADMIN_EMAIL,
            role: 'Admin',
        }, { merge: true });
    }

    // Set custom claim for the user's role
    const currentClaims = userRecord.customClaims || {};
    if (currentClaims.role !== 'Admin') {
        console.log(`Setting custom claim 'role: Admin' for ${ADMIN_EMAIL}.`);
        await auth.setCustomUserClaims(userRecord.uid, { ...currentClaims, role: 'Admin' });
    }

    if (wasUserCreated) {
      return NextResponse.json({ success: true, message: `Admin user ${ADMIN_EMAIL} created.`, action: 'created' }, { status: 201 });
    }
    return NextResponse.json({ success: true, message: `Admin user ${ADMIN_EMAIL} verified.`, action: 'verified' }, { status: 200 });

  } catch (error: any) {
    console.error('Error ensuring admin user exists:', error);
    return NextResponse.json({ error: 'Failed to ensure admin user exists.', details: error.message }, { status: 500 });
  }
}
