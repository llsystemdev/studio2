
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Gauge, Users, GitBranch } from 'lucide-react';
import type { Vehicle } from '@/lib/types';

export default function VehicleCard({ vehicle, priority }: { vehicle: Vehicle, priority: boolean }) {
    const displayPrice = typeof vehicle.pricePerDay === 'number' 
        ? `$${vehicle.pricePerDay.toFixed(2)}` 
        : 'Consultar';

    return (
        <Link href={`/vehiculo/${vehicle.id}`} className="block h-full group">
            <Card className="overflow-hidden transition-all duration-300 h-full flex flex-col group-hover:scale-105 group-hover:shadow-xl">
                <div className="relative w-full h-48 overflow-hidden">
                    <Image
                        src={vehicle.imageUrls?.[0] || 'https://placehold.co/600x400.png'}
                        alt={`${vehicle.make} ${vehicle.model}`}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover w-full h-full"
                        data-ai-hint={vehicle.dataAiHint}
                        priority={priority}
                    />
                </div>
                <CardContent className="p-4 flex flex-col flex-grow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-muted-foreground">{vehicle.category}</p>
                            <h3 className="text-lg font-bold">{vehicle.make} {vehicle.model}</h3>
                        </div>
                    </div>
                    <div className="flex-grow"></div>
                    <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
                        <div className="flex items-center gap-1"><Users className="h-4 w-4" /><span>{vehicle.specs.seats}</span></div>
                        <div className="flex items-center gap-1"><Gauge className="h-4 w-4" /><span>{vehicle.specs.engine}</span></div>
                        <div className="flex items-center gap-1"><GitBranch className="h-4 w-4" /><span>{vehicle.specs.transmission}</span></div>
                    </div>
                    <div className="mt-4 text-right">
                        <span className="text-xl font-bold text-primary">{displayPrice}</span>
                        {typeof vehicle.pricePerDay === 'number' && <span className="text-sm text-muted-foreground">/día</span>}
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
