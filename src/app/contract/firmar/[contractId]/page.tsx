
'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import type { Contract } from '@/lib/types';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, FileSignature, UploadCloud, Eraser, AlertCircle, CheckCircle } from 'lucide-react';
import SignaturePad from '@/components/signature-pad';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

type SignaturePadRef = {
    clear: () => void;
    getSignature: () => Blob | null;
};

export default function SignContractPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { user, signInWithGoogle, setPostAuthAction } = useAuth();
    
    const [contract, setContract] = React.useState<Contract | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const [idPhoto, setIdPhoto] = React.useState<File | null>(null);
    const [idPhotoPreview, setIdPhotoPreview] = React.useState<string | null>(null);
    const signaturePadRef = React.useRef<SignaturePadRef>(null);

    const contractId = params.contractId as string;

    React.useEffect(() => {
        const fetchContract = async () => {
            if (!contractId) return;
            try {
                const contractRef = doc(db, 'contracts', contractId);
                const docSnap = await getDoc(contractRef);
                if (docSnap.exists()) {
                    setContract({ id: docSnap.id, ...docSnap.data() } as Contract);
                } else {
                    toast({ variant: 'destructive', title: 'Error', description: 'El contrato no fue encontrado.' });
                    router.push('/');
                }
            } catch (error) {
                console.error("Error fetching contract:", error);
                toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cargar el contrato.' });
            } finally {
                setLoading(false);
            }
        };
        fetchContract();
    }, [contractId, router, toast]);

    const handleIdPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIdPhoto(file);
            setIdPhotoPreview(URL.createObjectURL(file));
        }
    };

    const finalizeReservation = async (authToken: string) => {
        setIsSubmitting(true);
        const signatureBlob = signaturePadRef.current?.getSignature();

        if (!idPhoto || !signatureBlob) {
            toast({ variant: 'destructive', title: 'Faltan Datos', description: 'Por favor, suba su ID y firme el contrato.' });
            setIsSubmitting(false);
            return;
        }

        const formData = new FormData();
        formData.append('contractId', contractId);
        formData.append('idPhoto', idPhoto);
        formData.append('signature', signatureBlob, 'signature.png');

        try {
            const response = await fetch('/api/contract/finalize', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'No se pudo finalizar la reserva.');
            }

            const { reservationId } = await response.json();
            toast({
                title: '¡Reserva Confirmada!',
                description: `Tu reserva ${reservationId} ha sido creada. Serás redirigido a tu panel de cliente.`,
                duration: 5000,
            });
            router.push('/client-dashboard');

        } catch (error: any) {
            console.error("Finalization error:", error);
            toast({ variant: 'destructive', title: 'Error al Finalizar', description: error.message });
            setIsSubmitting(false);
        }
    };
    
    const handleLoginAndFinalize = async () => {
        const signatureBlob = signaturePadRef.current?.getSignature();
        if (!idPhoto || !signatureBlob) {
            toast({ variant: 'destructive', title: 'Faltan Datos', description: 'Por favor, suba su ID y firme el contrato.' });
            return;
        }

        if (user) {
            const token = await user.getIdToken();
            finalizeReservation(token);
        } else {
            setPostAuthAction({
                callback: (user) => {
                    user.getIdToken().then(token => finalizeReservation(token));
                },
                redirectUrl: `/contract/firmar/${contractId}`
            });
            // Trigger Google sign-in
            await signInWithGoogle();
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="space-y-4">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-96 w-full max-w-2xl" />
                    <Skeleton className="h-48 w-full max-w-2xl" />
                </div>
            </div>
        );
    }
    
    if (!contract) {
        return <p className="text-center mt-10">Contrato no encontrado.</p>;
    }


    return (
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <Card className="shadow-lg">
           <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-3xl font-bold">Revisión y Firma del Pre-Contrato</CardTitle>
                        <CardDescription>Por favor, lea el contrato y complete los pasos para confirmar su reserva.</CardDescription>
                    </div>
                     <FileSignature className="h-10 w-10 text-primary" />
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Contrato de Alquiler</h3>
                     <ScrollArea className="h-72 w-full rounded-md border p-4 bg-muted/20">
                        <pre className="whitespace-pre-wrap text-sm font-mono">
                            {contract.content}
                        </pre>
                    </ScrollArea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="idPhoto" className="font-semibold flex items-center gap-2"><UploadCloud className="h-5 w-5"/>1. Subir Foto de Cédula o Pasaporte</Label>
                        <Input id="idPhoto" type="file" accept="image/*" onChange={handleIdPhotoChange} className="file:text-primary file:font-semibold" disabled={isSubmitting}/>
                        {idPhotoPreview && (
                            <div className="mt-2 p-2 border rounded-md relative aspect-video">
                                <img src={idPhotoPreview} alt="Vista previa de ID" className="w-full h-full object-contain" />
                            </div>
                        )}
                    </div>
                    <div className="space-y-2">
                         <div className="flex justify-between items-center">
                            <Label htmlFor="signature" className="font-semibold flex items-center gap-2"><FileSignature className="h-5 w-5"/>2. Firme en el recuadro</Label>
                            <Button variant="ghost" size="sm" onClick={() => signaturePadRef.current?.clear()} disabled={isSubmitting}>
                                <Eraser className="mr-2 h-4 w-4"/> Limpiar
                            </Button>
                         </div>
                        <SignaturePad ref={signaturePadRef} />
                    </div>
                </div>

                 <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Paso Final: Autenticación</AlertTitle>
                    <AlertDescription>
                       Para proteger su reserva, al hacer clic en "Finalizar Reserva", se le pedirá que inicie sesión de forma segura con su cuenta de Google.
                    </AlertDescription>
                </Alert>

            </CardContent>
            <CardFooter>
                <Button size="lg" className="w-full text-lg h-12" onClick={handleLoginAndFinalize} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle className="mr-2 h-5 w-5" />}
                    {user ? 'Finalizar Reserva' : 'Iniciar Sesión y Finalizar Reserva'}
                </Button>
            </CardFooter>
        </Card>
      </div>
    );
}
