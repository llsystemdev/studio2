
'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import VehicleImageCarousel from '@/components/vehicle-image-carousel';
import VehicleBookingForm from './vehicle-booking-form';
import type { Vehicle } from '@/lib/types';
import { Users, Gauge, GitBranch } from 'lucide-react';

// This component is no longer used and is kept as a placeholder to avoid breaking imports.
// The logic has been merged into `src/app/vehiculo/[id]/page.tsx` to fix the hook error.
export default function VehicleDetailClient({ vehicle }: { vehicle: Vehicle }) {
  return (
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
  );
}
