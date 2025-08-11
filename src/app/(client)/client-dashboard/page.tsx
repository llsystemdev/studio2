
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Loader2, Star, CalendarClock, History } from 'lucide-react';
import type { Reservation, Review } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import ReviewModal from '@/components/review-modal';
import Link from 'next/link';

interface ClientData {
    reservations: Reservation[];
    reviews: Review[];
}

const ReservationCard = ({ reservation, onReviewClick }: { reservation: Reservation, onReviewClick: (res: Reservation) => void }) => {
    const isCompleted = reservation.status === 'Completed';

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>{reservation.vehicle}</CardTitle>
                        <CardDescription>ID: {reservation.id}</CardDescription>
                    </div>
                     <Badge variant={reservation.status === 'Completed' || reservation.status === 'Cancelled' ? 'outline' : 'default'}
                           className={reservation.status === 'Active' || reservation.status === 'Upcoming' ? 'bg-green-600' : ''}>
                        {reservation.status}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>Recogida:</strong> {reservation.pickupDate}</p>
                    <p><strong>Devolución:</strong> {reservation.dropoffDate}</p>
                    <p><strong>Costo Total:</strong> ${reservation.totalCost?.toFixed(2)}</p>
                </div>
            </CardContent>
            {isCompleted && (
                 <CardFooter>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => onReviewClick(reservation)}>
                        <Star className="mr-2 h-4 w-4" /> Dejar una reseña
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
};

export default function ClientDashboardPage() {
    const { user, userProfile } = useAuth();
    const { toast } = useToast();
    const [data, setData] = React.useState<ClientData | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [isReviewModalOpen, setIsReviewModalOpen] = React.useState(false);
    const [selectedReservation, setSelectedReservation] = React.useState<Reservation | null>(null);

    React.useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const response = await fetch('/api/client-data');
                if (!response.ok) throw new Error('Failed to fetch client data');
                const clientData: ClientData = await response.json();
                setData(clientData);
            } catch (error) {
                console.error("Error fetching client data:", error);
                toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar tus datos.' });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user, toast]);

    const handleReviewClick = (reservation: Reservation) => {
        const hasReviewed = data?.reviews.some(r => r.reservationId === reservation.id);
        if (hasReviewed) {
            toast({ title: "Reseña ya enviada", description: "Ya has enviado una reseña para esta reservación."});
            return;
        }
        setSelectedReservation(reservation);
        setIsReviewModalOpen(true);
    };

    const handleReviewSubmit = async (rating: number, comment: string) => {
        if (!selectedReservation || !user || !userProfile) return;

        try {
            const response = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reservationId: selectedReservation.id,
                    vehicleId: selectedReservation.vehicleId,
                    customerId: user.uid,
                    customerName: userProfile.name,
                    rating,
                    comment,
                }),
            });
            if (!response.ok) {
                 const errorData = await response.json();
                 throw new Error(errorData.error || 'Failed to submit review.');
            }
            
            toast({ title: '¡Gracias por tu reseña!', description: 'Tu opinión ha sido enviada para su aprobación.' });
            
            const newReview: Review = await response.json();
            setData(prev => prev ? ({ ...prev, reviews: [...prev.reviews, newReview] }) : null);

        } catch (error: any) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsReviewModalOpen(false);
            setSelectedReservation(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }
    
    if (!data) {
        return <p className="text-center">No se pudieron cargar tus datos.</p>;
    }

    const upcomingReservations = data.reservations.filter(r => r.status === 'Upcoming' || r.status === 'Active');
    const pastReservations = data.reservations.filter(r => r.status === 'Completed' || r.status === 'Cancelled');


    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Bienvenido, {userProfile?.name?.split(' ')[0]}</h1>
                <p className="text-muted-foreground">Administra tus reservaciones y comparte tu experiencia.</p>
            </div>
            
            <div className="space-y-6">
                <div className="flex items-center gap-2">
                    <CalendarClock className="h-6 w-6 text-primary"/>
                    <h2 className="text-2xl font-semibold">Próximas y Activas</h2>
                </div>
                 {upcomingReservations.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {upcomingReservations.map(res => <ReservationCard key={res.id} reservation={res} onReviewClick={handleReviewClick} />)}
                    </div>
                ) : (
                    <p className="text-muted-foreground pl-8">No tienes reservaciones próximas o activas. <Button variant="link" asChild className="p-0"><Link href="/#fleet-section">¡Reserva un vehículo!</Link></Button></p>
                )}
            </div>

            <div className="space-y-6">
                 <div className="flex items-center gap-2">
                    <History className="h-6 w-6 text-primary"/>
                    <h2 className="text-2xl font-semibold">Historial</h2>
                </div>
                {pastReservations.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pastReservations.map(res => <ReservationCard key={res.id} reservation={res} onReviewClick={handleReviewClick} />)}
                    </div>
                 ) : (
                    <p className="text-muted-foreground pl-8">Aún no tienes un historial de reservaciones.</p>
                )}
            </div>

            {selectedReservation && (
                <ReviewModal 
                    isOpen={isReviewModalOpen}
                    onClose={() => setIsReviewModalOpen(false)}
                    onSubmit={handleReviewSubmit}
                    vehicleName={selectedReservation.vehicle}
                />
            )}
        </div>
    );
}
