
'use client'

import * as React from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { getVehicleData } from '@/lib/server-actions/vehicle-actions';
import type { Vehicle } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Car, LogIn, Users, Gauge, GitBranch } from 'lucide-react';
import VehicleImageCarousel from '@/components/vehicle-image-carousel';
import VehicleBookingForm from './vehicle-booking-form';

const Logo = () => (
    <div className="flex items-center gap-2 text-primary">
        <span className="text-2xl font-bold tracking-wider">VIRTUS</span>
        <span className="text-lg font-semibold tracking-wide text-foreground">CAR RENTAL</span>
    </div>
);

export default function VehicleDetailPage() {
  const params = useParams();
  const [vehicle, setVehicle] = React.useState<Vehicle | null>(null);
  const [loading, setLoading] = React.useState(true);
  const id = params.id as string;

  React.useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    const fetchVehicle = async () => {
      setLoading(true);
      const vehicleData = await getVehicleData(id);
      setVehicle(vehicleData);
      setLoading(false);
    };
    fetchVehicle();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!vehicle) {
    notFound();
  }

  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col font-sans">
       <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
          </Link>
          <nav className="ml-auto flex items-center gap-2 sm:gap-4">
             <Button asChild>
              <Link href="/#fleet-section">
                <Car className="mr-2 h-4 w-4" />
                Ver Flota
              </Link>
            </Button>
            <Button variant="outline" asChild>
                <Link href="/client-login">
                  <LogIn className="mr-2 h-4 w-4"/>
                  Acceso Clientes
                </Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto py-12 px-4 flex-grow">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
              <div>
                   <VehicleImageCarousel 
                      imageUrls={vehicle.imageUrls}
                      altText={`${vehicle.make} ${vehicle.model}`}
                      dataAiHint={vehicle.dataAiHint}
                   />
              </div>
              <div>
                  <Badge variant="secondary">{vehicle.category}</Badge>
                  <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter mt-2">{vehicle.make} {vehicle.model}</h1>
                  <div className="mt-4 flex items-center gap-6 text-muted-foreground">
                      <div className="flex items-center gap-2"><Users className="h-5 w-5" /><span>{vehicle.specs.seats} Asientos</span></div>
                      <div className="flex items-center gap-2"><Gauge className="h-5 w-5" /><span>{vehicle.specs.engine}</span></div>
                      <div className="flex items-center gap-2"><GitBranch className="h-5 w-5" /><span>{vehicle.specs.transmission}</span></div>
                  </div>

                  <VehicleBookingForm vehicle={vehicle} />
              </div>
          </div>
      </main>

      <footer id="contact-section" className="border-t bg-muted/50 mt-12">
          <div className="container mx-auto py-6 text-center text-muted-foreground text-sm">
            © {new Date().getFullYear()} Virtus Car Rental S.R.L. Todos los derechos reservados.
          </div>
      </footer>
    </div>
  );
}
