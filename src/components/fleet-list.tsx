
import * as React from 'react';
import VehicleCard from './vehicle-card';
import { getVehiclesForHomePage } from '@/lib/server-actions/vehicle-actions';
import { Card } from './ui/card';

export default async function FleetList() {
    const { vehicles, error } = await getVehiclesForHomePage();

    if (error) {
        return (
            <Card className="bg-destructive/10 border-destructive text-destructive-foreground p-4 text-center col-span-1 md:col-span-2 lg:col-span-3">
                <p className="font-semibold">Error al Cargar la Flota</p>
                <p className="text-sm">{error}</p>
                <p className="text-xs mt-2">Por favor, contacte al administrador del sistema.</p>
            </Card>
        );
    }
    
    if (vehicles.length === 0) {
       return <p className="text-center text-muted-foreground col-span-1 md:col-span-2 lg:col-span-3">No hay vehículos disponibles en este momento.</p>;
    }

    return (
        <>
            {vehicles.map((vehicle, index) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} priority={index < 3}/>
            ))}
        </>
    );
}
