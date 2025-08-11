
'use client';

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Loader2, LogOut, Car, User } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';


const Logo = () => (
    <div className="flex items-center gap-2 text-primary">
        <span className="text-2xl font-bold tracking-wider">VIRTUS</span>
        <span className="text-lg font-semibold tracking-wide text-foreground">CAR RENTAL</span>
    </div>
);

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userProfile, loading, role, logout } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (loading) return; // Wait until loading is false

    if (!user) {
      router.replace('/client-login');
      return;
    }

    // This is the primary role-based guard for the client section.
    // If the authenticated user is NOT a 'Client', redirect them away.
    if (role && role !== 'Client') {
        router.replace('/dashboard');
    }
  }, [user, loading, role, router]);
  
  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'C';
    return name.split(' ').map((n) => n[0]).join('');
  };

  // Show a loading screen while authentication status is being determined.
  // Also covers the brief moment a staff member might be here before redirecting.
  if (loading || !user || !role || role !== 'Client') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
            <div className="container mx-auto flex h-16 items-center px-4">
            <Link href="/client-dashboard" className="flex items-center gap-2">
                <Logo />
            </Link>
            <nav className="ml-auto flex items-center gap-4">
                <Button variant="ghost" asChild>
                    <Link href="/#fleet-section">
                        <Car className="mr-2 h-4 w-4"/>
                        Ver Flota
                    </Link>
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="secondary" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={userProfile?.photoURL || ''} alt={userProfile?.name || ''} />
                            <AvatarFallback>{getInitials(userProfile?.name)}</AvatarFallback>
                        </Avatar>
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                         <DropdownMenuItem asChild>
                           <Link href="/profile">
                             <User className="mr-2 h-4 w-4" />
                             <span>Mi Perfil</span>
                           </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Cerrar Sesión</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </nav>
            </div>
      </header>
      <main className="flex-grow container mx-auto py-8 px-4">
          {children}
      </main>
    </div>
  )
}
