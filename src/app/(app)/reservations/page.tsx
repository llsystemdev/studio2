
import * as React from 'react';
import { Suspense } from 'react';
import ReservationsClient from './reservations-client';
import { Loader2 } from 'lucide-react';

export default function ReservationsPage() {
  return (
    <Suspense fallback={
        <div className="flex h-full w-full items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-lg font-semibold">Cargando Módulo de Reservas...</p>
                <p className="text-sm text-muted-foreground">Por favor espere.</p>
            </div>
        </div>
    }>
      <ReservationsClient />
    </Suspense>
  );
}
