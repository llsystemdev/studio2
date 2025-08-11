
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuth } from '@/lib/firebase/server/admin';

async function verifyToken(token: string) {
    try {
        const auth = getAuth();
        const decodedToken = await auth.verifyIdToken(token);
        return decodedToken;
    } catch (error) {
        // This can happen if the token is expired or invalid
        console.error('Token verification error in middleware:', error);
        return null;
    }
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const tokenCookie = request.cookies.get('firebaseIdToken');
    const token = tokenCookie?.value;

    const isPublicPage = ['/', '/login', '/vehiculo'].some(p => pathname.startsWith(p));
    
    // Allow public pages to be accessed without a token
    if (isPublicPage) {
        return NextResponse.next();
    }
    
    const loginUrl = new URL('/login', request.url);
    
    // If there's no token and the path is protected, redirect to login
    if (!token) {
        loginUrl.searchParams.set('redirectedFrom', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // If there is a token, verify it
    const decodedToken = await verifyToken(token);

    // If token is invalid, redirect to login and clear the cookie
    if (!decodedToken) {
        loginUrl.searchParams.set('redirectedFrom', pathname);
        const response = NextResponse.redirect(loginUrl);
        response.cookies.delete('firebaseIdToken');
        return response;
    }

    // Token is valid, check roles for protected routes
    const userRole = decodedToken.role;

    // If a staff member tries to access a client page, redirect to dashboard
    if (pathname.startsWith('/client-dashboard') && (userRole === 'Admin' || userRole === 'Supervisor' || userRole === 'Secretary')) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // If a client tries to access an admin page, redirect them to their dashboard
    const isAdminRoute = !pathname.startsWith('/client-dashboard'); // Any non-client route is considered admin
    if (isAdminRoute && userRole === 'Client') {
         return NextResponse.redirect(new URL('/client-dashboard', request.url));
    }

    // All checks passed, allow the request to proceed
    return NextResponse.next();
}

// Matcher to apply the middleware to all paths except for static assets and API routes
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
};
