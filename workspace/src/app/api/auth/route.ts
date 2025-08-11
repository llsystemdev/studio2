
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/firebase/server/admin';

// This function handles exchanging a client-side ID token for a server-side session cookie.
export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();
    if (!idToken) {
        return NextResponse.json({ error: 'ID token is required.' }, { status: 400 });
    }
    
    const auth = getAuth();
    // Set session expiration to 5 days.
    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

    const options = {
      name: 'firebaseIdToken', // Use a consistent cookie name
      value: sessionCookie,
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    };
    
    const response = NextResponse.json({ success: true, message: 'Session created.' }, { status: 200 });
    response.cookies.set(options);

    return response;

  } catch (error) {
    console.error('Error creating session cookie:', error);
    return NextResponse.json({ error: 'Failed to create session.' }, { status: 401 });
  }
}

// This function handles clearing the session cookie upon logout.
export async function DELETE(request: NextRequest) {
    const response = NextResponse.json({ success: true, message: 'Logged out.' }, { status: 200 });
    response.cookies.delete('firebaseIdToken');
    return response;
}
