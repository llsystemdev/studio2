
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar as CalendarIcon, Phone, User, Mail, Loader2, FileSignature } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { addDays, format, differenceInCalendarDays } from "date-fns"
import { es } from 'date-fns/locale';
import type { DateRange } from "react-day-picker"
import { insuranceOptions } from '@/lib/data';
import type { Vehicle } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function VehicleBookingForm({ vehicle }: { vehicle: Vehicle }) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [customerData, setCustomerData] = React.useState({ name: '', email: '', phone: '' });
  
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 5),
  });
  const [selectedInsuranceId, setSelectedInsuranceId] = React.useState<string>(insuranceOptions[0].id);

  const selectedInsurance = insuranceOptions.find(opt => opt.id === selectedInsuranceId) || insuranceOptions[0];
  const rentalDays = date?.from && date?.to ? (differenceInCalendarDays(date.to, date.from) || 1) : 0;
  const vehicleTotal = rentalDays * vehicle.pricePerDay;
  const insuranceTotal = rentalDays * selectedInsurance.pricePerDay;
  const totalCost = vehicleTotal + insuranceTotal;
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setCustomerData(prev => ({ ...prev, [id]: value }));
  };

  const handleReserveClick = async () => {
    if (!customerData.name || !customerData.email || !customerData.phone || !date?.from || !date?.to) {
        toast({
            variant: 'destructive',
            title: 'Información Incompleta',
            description: 'Por favor, complete su nombre, correo, teléfono y seleccione las fechas.',
        });
        return;
    }
    
    setIsSubmitting(true);
    
    try {
        const response = await fetch('/api/contract/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                vehicle,
                customerData,
                dateRange: { from: date.from.toISOString(), to: date.to.toISOString() },
                insuranceCost: selectedInsurance.pricePerDay,
                totalCost,
            }),
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create pre-contract.');
        }

        const { contractId } = await response.json();
        
        // Redirect to the new signing page
        router.push(`/contract/firmar/${contractId}`);

    } catch (error: any) {
        console.error(error);
        toast({
            variant: 'destructive',
            title: 'Error al Iniciar Reserva',
            description: error.message,
        });
        setIsSubmitting(false);
    }
  };

  return (
      <Card className="mt-8 bg-card border">
        <CardHeader>
          <CardTitle>Estimar y Reservar</CardTitle>
          <CardDescription>Complete los datos para iniciar el proceso de reserva.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
                <Label htmlFor="name" className="flex items-center gap-2"><User className="h-4 w-4"/> Nombre Completo</Label>
                <Input id="name" placeholder="John Doe" value={customerData.name} onChange={handleInputChange} required />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="email" className="flex items-center gap-2"><Mail className="h-4 w-4"/> Correo Electrónico</Label>
                <Input id="email" type="email" placeholder="john.doe@example.com" value={customerData.email} onChange={handleInputChange} required/>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="phone" className="flex items-center gap-2"><Phone className="h-4 w-4"/> Teléfono</Label>
                <Input id="phone" placeholder="809-555-1234" value={customerData.phone} onChange={handleInputChange} required/>
            </div>
             <div className="grid gap-2">
                <Label className="flex items-center gap-2"><CalendarIcon className="h-4 w-4"/> Fechas de Alquiler</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant={"outline"}
                      className="w-full justify-start text-left font-normal bg-background"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date?.from ? (
                        date.to ? (
                          <>
                            {format(date.from, "LLL dd, y", { locale: es })} -{" "}
                            {format(date.to, "LLL dd, y", { locale: es })}
                          </>
                        ) : (
                          format(date.from, "LLL dd, y", { locale: es })
                        )
                      ) : (
                        <span>Seleccione un rango</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={date?.from}
                      selected={date}
                      onSelect={setDate}
                      numberOfMonths={2}
                      locale={es}
                      disabled={{ before: new Date() }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
          </div>
  
          <div>
            <Label className="text-sm font-medium">Opciones de Seguro</Label>
            <RadioGroup value={selectedInsuranceId} onValueChange={setSelectedInsuranceId} className="mt-2 space-y-3">
              {insuranceOptions.map(opt => (
                <Label key={opt.id} className="flex items-start gap-3 rounded-md border p-4 cursor-pointer hover:bg-accent has-[[data-state=checked]]:border-primary">
                  <RadioGroupItem value={opt.id} id={opt.id} />
                  <div className="grid gap-1.5">
                    <div className="font-semibold flex justify-between items-center">
                      <span>{opt.title.es}</span>
                      <span className="text-primary">+${opt.pricePerDay.toFixed(2)}/día</span>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {opt.description.es}
                    </p>
                  </div>
                </Label>
              ))}
            </RadioGroup>
          </div>
  
          <Separator />
  
          <div className="space-y-2">
            <div className="flex justify-between items-center text-muted-foreground">
              <span>Vehículo (${vehicle.pricePerDay.toFixed(2)} x {rentalDays} {rentalDays === 1 ? 'día' : 'días'})</span>
              <span>${vehicleTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-muted-foreground">
              <span>Seguro (${selectedInsurance.pricePerDay.toFixed(2)} x {rentalDays} {rentalDays === 1 ? 'día' : 'días'})</span>
              <span>${insuranceTotal.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center font-bold text-xl pt-2">
              <span>Total Estimado</span>
              <span>${totalCost.toFixed(2)} USD</span>
            </div>
          </div>
  
          <Button size="lg" className="w-full text-lg h-12" onClick={handleReserveClick} disabled={isSubmitting}>
             {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <FileSignature className="mr-2 h-5 w-5"/>}
             Continuar a la Firma del Pre-Contrato
          </Button>
            <p className="text-xs text-center text-muted-foreground">
                Será redirigido para revisar y aceptar los términos antes de finalizar.
            </p>
        </CardContent>
      </Card>
  );
}
