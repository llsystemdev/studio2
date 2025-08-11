
import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogIn, Users } from 'lucide-react';
import { Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import FleetList from '@/components/fleet-list';
import SafeImage from '@/components/safe-image';

const Logo = () => (
    <div className="flex items-center gap-2 text-primary">
        <span className="text-2xl font-bold tracking-wider">VIRTUS</span>
        <span className="text-lg font-semibold tracking-wide text-foreground">CAR RENTAL</span>
    </div>
);

export default function HomePage() {
  const coverImageUrl = "https://firebasestorage.googleapis.com/v0/b/virtus-version-ok.appspot.com/o/portada_virtual_car_rental.jpg?alt=media&token=b76315f5-04db-42a7-8fba-cf90f17d9530";
  
  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
          </Link>
          <nav className="ml-auto flex items-center gap-2 sm:gap-4">
             <Button variant="ghost" asChild>
                <Link href="/client-login">
                    <Users className="mr-2 h-4 w-4"/>
                    Acceso Clientes
                </Link>
             </Button>
            <Button variant="outline" asChild>
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4"/>
                Acceso Admin
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative w-full py-24 md:py-32 flex items-center justify-center text-center">
            <div className="absolute inset-0 z-0">
                <SafeImage
                    src={coverImageUrl}
                    fallbackSrc="https://placehold.co/1200x800.png"
                    alt="Portada de vehículos de lujo de Virtus Car Rental"
                    imageClassName="brightness-50"
                    priority
                />
            </div>
            <div className="relative z-10 w-full max-w-4xl mx-auto px-4 text-white">
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
                    Alquiler de Vehículos de Lujo y Confianza
                </h1>
                <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-200">
                    La flota más exclusiva para una experiencia de conducción inigualable en la República Dominicana.
                </p>
                <Button asChild size="lg" className="mt-8">
                    <a href="#fleet-section">Ver Flota Ahora</a>
                </Button>
            </div>
        </section>


        <section id="fleet-section" className="container mx-auto py-16 px-4">
            <h2 className="text-3xl font-bold text-center mb-8">Nuestra Flota</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Suspense fallback={
                    <>
                        {[...Array(3)].map((_, i) => (
                             <Card key={i} className="animate-pulse">
                                <div className="h-48 bg-muted rounded-t-lg"></div>
                                <CardContent className="p-4 space-y-3">
                                    <div className="h-4 bg-muted rounded w-1/4"></div>
                                    <div className="h-6 bg-muted rounded w-3/4"></div>
                                    <div className="flex justify-between border-t pt-3 mt-4">
                                        <div className="h-4 bg-muted rounded w-1/6"></div>
                                        <div className="h-4 bg-muted rounded w-1/6"></div>
                                        <div className="h-4 bg-muted rounded w-1/6"></div>
                                    </div>
                                    <div className="flex justify-end mt-4">
                                        <div className="h-8 bg-muted rounded w-1/3"></div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </>
                }>
                    <FleetList />
                </Suspense>
            </div>
        </section>
      </main>

      <footer id="contact-section" className="border-t bg-muted/50 mt-12">
          <div className="container mx-auto py-6 text-center text-muted-foreground text-sm space-y-2">
            <p>© {new Date().getFullYear()} Virtus Car Rental S.R.L. Todos los derechos reservados.</p>
            <p className="font-semibold">© L&amp;L DEV Systems – Todos los derechos reservados. Desarrollado por el Ing. Luis Alfredo Mañon Zapata</p>
          </div>
      </footer>
    </div>
  );
}
