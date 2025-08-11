
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import type { Reservation, Vehicle } from '@/lib/types';
import { onSnapshot, collection, query, where } from 'firebase/firestore';
import { Loader2, Sparkles, Wand2, Info } from 'lucide-react';
import { runSmartReply } from '@/lib/server-actions/ai-actions';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

export default function SmartReplyPage() {
    const { toast } = useToast();
    const { db } = useAuth();
    
    const [reservations, setReservations] = React.useState<Reservation[]>([]);
    const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [isGenerating, setIsGenerating] = React.useState(false);
    
    const [selectedReservationId, setSelectedReservationId] = React.useState<string>('');
    const [customerQuery, setCustomerQuery] = React.useState('');
    const [generatedReply, setGeneratedReply] = React.useState('');

    React.useEffect(() => {
        if (!db) return;
        setLoading(true);
        // Query for ALL reservations to provide context for any customer query.
        const q = query(collection(db, 'reservations'), where('status', 'in', ['Active', 'Upcoming', 'Completed', 'Cancelled']));
        const unsub = onSnapshot(q, (snapshot) => {
            setReservations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reservation)));
            if(loading) setLoading(false);
        }, (error) => {
            console.error("Failed to fetch relevant reservations:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch active reservations.' });
            if(loading) setLoading(false);
        });

        const unsubVehicles = onSnapshot(collection(db, 'vehicles'), (snapshot) => {
             setVehicles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle)));
        });

        return () => {
            unsub();
            unsubVehicles();
        };
    }, [db, loading, toast]);

    const handleGenerateReply = async () => {
        if (!selectedReservationId || !customerQuery) {
            toast({ variant: 'destructive', title: 'Datos incompletos', description: 'Por favor, seleccione una reserva y escriba la consulta del cliente.' });
            return;
        }

        const reservation = reservations.find(r => r.id === selectedReservationId);
        const vehicle = vehicles.find(v => v.id === reservation?.vehicleId);

        if (!reservation || !vehicle) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron encontrar los detalles de la reserva.' });
            return;
        }

        setIsGenerating(true);
        setGeneratedReply('');
        try {
            const reply = await runSmartReply(reservation, vehicle, customerQuery);
            setGeneratedReply(reply);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error de IA', description: error.message });
        } finally {
            setIsGenerating(false);
        }
    };

    const selectedReservation = reservations.find(r => r.id === selectedReservationId);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                        <Wand2 className="h-8 w-8 text-primary" />
                        Asistente de Respuestas Inteligentes
                    </h1>
                    <p className="text-muted-foreground">Genere respuestas profesionales y contextuales a las consultas de los clientes con el poder de la IA.</p>
                </div>
            </div>
            
            <Alert className="bg-primary/10 border-primary/20">
                <Sparkles className="h-4 w-4 text-primary" />
                <AlertTitle className="text-primary font-bold">Base de Conocimiento</AlertTitle>
                <AlertDescription>
                    La IA tiene acceso a la información de la reserva seleccionada, los detalles del vehículo y las políticas de alquiler generales de la empresa para formular la respuesta más precisa.
                </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <Card>
                    <CardHeader>
                        <CardTitle>1. Contexto de la Reserva</CardTitle>
                        <CardDescription>Seleccione la reserva activa o próxima sobre la que consulta el cliente.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                       {loading ? (
                             <div className="space-y-2">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-24 w-full" />
                             </div>
                        ) : reservations.length > 0 ? (
                            <Select onValueChange={setSelectedReservationId} value={selectedReservationId} disabled={isGenerating}>
                                <SelectTrigger>
                                    <SelectValue placeholder={"Seleccione una reserva"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {reservations.map(res => (
                                        <SelectItem key={res.id} value={res.id}>
                                            {res.id} - {res.customerName} ({res.vehicle})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                             <div className="text-center py-4 text-muted-foreground bg-muted/50 rounded-md">
                                <Info className="mx-auto h-8 w-8 mb-2" />
                                <h3 className="font-semibold">No se encontraron reservas</h3>
                                <p className="text-sm">No hay datos de reservas en el sistema.</p>
                            </div>
                        )}
                        {selectedReservation && (
                            <Card className="bg-muted/50 p-4 text-sm space-y-2">
                                <p><strong>Cliente:</strong> {selectedReservation.customerName}</p>
                                <p><strong>Vehículo:</strong> {selectedReservation.vehicle}</p>
                                <p><strong>Periodo:</strong> {selectedReservation.pickupDate} al {selectedReservation.dropoffDate}</p>
                                <p><strong>Estado:</strong> {selectedReservation.status}</p>
                            </Card>
                        )}
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>2. Consulta del Cliente</CardTitle>
                        <CardDescription>Escriba o pegue la pregunta o comentario del cliente aquí.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            placeholder="Ej: 'Hola, quisiera saber si puedo extender mi alquiler por dos días más. ¿Cuánto costaría?'"
                            rows={6}
                            value={customerQuery}
                            onChange={(e) => setCustomerQuery(e.target.value)}
                            disabled={isGenerating}
                        />
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-center">
                 <Button size="lg" onClick={handleGenerateReply} disabled={!selectedReservationId || !customerQuery || isGenerating || loading}>
                    {isGenerating ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Generando...
                        </>
                    ) : (
                        <>
                            <Sparkles className="mr-2 h-5 w-5" />
                            Generar Respuesta Inteligente
                        </>
                    )}
                </Button>
            </div>

            {generatedReply && (
                 <Card>
                    <CardHeader>
                        <CardTitle>3. Respuesta Sugerida</CardTitle>
                        <CardDescription>Revise y copie la respuesta generada por la IA.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            readOnly
                            value={generatedReply}
                            rows={8}
                            className="bg-background text-base"
                        />
                         <Button variant="outline" size="sm" className="mt-2" onClick={() => {
                            navigator.clipboard.writeText(generatedReply);
                            toast({ title: "Copiado", description: "La respuesta ha sido copiada al portapapeles." });
                         }}>
                            Copiar Respuesta
                        </Button>
                    </CardContent>
                </Card>
            )}

        </div>
    );
}
