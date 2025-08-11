
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import ClientLoginForm from '@/components/client-login-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const Logo = () => (
    <div className="flex flex-col items-center justify-center p-2 text-center">
        <span className="text-5xl font-bold tracking-wider text-primary">VIRTUS</span>
        <span className="text-lg tracking-widest text-muted-foreground">CAR RENTAL</span>
    </div>
);

export default function ClientLoginPage() {
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
            <CardTitle className="text-2xl font-bold tracking-tight">Portal de Clientes</CardTitle>
            <CardDescription>
                Inicia sesión o regístrate para ver tus reservaciones.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ClientLoginForm />
          </CardContent>
        </Card>
         <footer className="mt-8 text-center text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} Virtus Car Rental S.R.L. | Todos los derechos reservados.</p>
        </footer>
      </div>
    </main>
  );
}
