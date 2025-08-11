"use client";

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import LoginForm from '@/components/login-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

const Logo = () => (
    <div className="flex flex-col items-center justify-center p-2 text-center">
        <span className="text-5xl font-bold tracking-wider text-primary">VIRTUS</span>
        <span className="text-lg tracking-widest text-muted-foreground">CAR RENTAL</span>
    </div>
);

export default function LoginClient() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && user) {
      if (role === 'Client') {
        router.replace('/client-dashboard');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [user, role, loading, router]);

  if (loading || user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4 relative">
       <Button asChild variant="ghost" className="absolute top-4 left-4">
            <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a la página principal
            </Link>
        </Button>
      <div className="w-full max-w-md">
        <Card className="shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <Logo />
            <CardTitle className="text-2xl font-bold tracking-tight">Acceso de Personal</CardTitle>
            <CardDescription>
                Inicia sesión para administrar el sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
         <div className="mt-8 text-center text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} Virtus Car Rental S.R.L. | Todos los derechos reservados.</p>
        </div>
      </div>
    </main>
  );
}
