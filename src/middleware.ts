
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Exit early if the request is for an API route, a static file, or a public file.
    if (pathname.startsWith('/api') || pathname.startsWith('/_next') || /\.(.*)$/.test(pathname)) {
        return NextResponse.next();
    }

    const tokenCookie = request.cookies.get('firebaseIdToken');
    const hasSession = !!tokenCookie;

    const isPublicPage = ['/login', '/client-login', '/contract'].some(p => pathname.startsWith(p)) || pathname.startsWith('/vehiculo') || pathname === '/';
    
    // If it's a public page, let the request through, regardless of session status.
    if (isPublicPage) {
        return NextResponse.next();
    }
    
    // If it's a protected page and there's no session, redirect to the main staff login page.
    // The specific client/admin login redirect will be handled by the user's choice on the public pages.
    if (!hasSession) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirectedFrom', pathname);
        return NextResponse.redirect(loginUrl);
    }
    
    // The user has a session. The layouts will now be responsible for role-based authorization.
    return NextResponse.next();
}

// A simplified matcher to run on most paths.
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
