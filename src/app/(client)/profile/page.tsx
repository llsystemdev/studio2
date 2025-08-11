
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Loader2, Edit, Save } from 'lucide-react';
import type { Customer } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';


export default function ClientProfilePage() {
    const { user, userProfile } = useAuth();
    const { toast } = useToast();
    const [customer, setCustomer] = React.useState<Customer | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [isEditing, setIsEditing] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    React.useEffect(() => {
        const fetchCustomerData = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const docRef = doc(db, "customers", user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setCustomer({ id: docSnap.id, ...docSnap.data() } as Customer);
                } else {
                    // If no customer doc, create one to avoid errors on save.
                    const newCustomerData: Customer = {
                        id: user.uid,
                        name: userProfile?.name || 'Nuevo Cliente',
                        email: userProfile?.email || '',
                        phone: '',
                        address: '',
                        idOrPassport: '',
                        license: '',
                        createdAt: new Date().toISOString()
                    };
                    await setDoc(docRef, newCustomerData);
                    setCustomer(newCustomerData);
                    toast({ title: "Perfil Creado", description: "Completa tus datos para agilizar futuras reservas." });
                }
            } catch (error) {
                console.error("Error fetching/creating customer data:", error);
                toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cargar tu perfil.' });
            } finally {
                setLoading(false);
            }
        };
        fetchCustomerData();
    }, [user, userProfile, toast]);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!customer) return;
        const { id, value } = e.target;
        setCustomer({ ...customer, [id]: value });
    };
    
    const handleSave = async () => {
        if (!user || !customer) return;
        setIsSubmitting(true);
        try {
            const customerRef = doc(db, 'customers', user.uid);
            await updateDoc(customerRef, {
                name: customer.name,
                phone: customer.phone,
                address: customer.address,
                license: customer.license,
                idOrPassport: customer.idOrPassport
            });
            toast({ title: 'Perfil Actualizado', description: 'Tus datos han sido guardados.' });
            setIsEditing(false);
        } catch (error) {
             console.error("Error updating profile:", error);
             toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar tu perfil.' });
        } finally {
            setIsSubmitting(false);
        }
    };


    if (loading) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }
    
    if (!customer) {
        return <p className="text-center">No se pudo cargar tu perfil.</p>;
    }


    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Mi Perfil</h1>
                <p className="text-muted-foreground">Administra tu información personal y documentos.</p>
            </div>
            
            <Card>
                <CardHeader className="flex flex-row justify-between items-center">
                    <div>
                        <CardTitle>Información Personal</CardTitle>
                        <CardDescription>Estos son tus datos de contacto y de identificación.</CardDescription>
                    </div>
                    {isEditing ? (
                        <Button onClick={handleSave} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />} Guardar
                        </Button>
                    ) : (
                        <Button variant="outline" onClick={() => setIsEditing(true)}>
                            <Edit className="mr-2 h-4 w-4" /> Editar
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre Completo</Label>
                            <Input id="name" value={customer.name} onChange={handleInputChange} disabled={!isEditing || isSubmitting}/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Correo Electrónico</Label>
                            <Input id="email" value={customer.email} disabled />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <Label htmlFor="phone">Teléfono</Label>
                            <Input id="phone" value={customer.phone} onChange={handleInputChange} disabled={!isEditing || isSubmitting}/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Dirección</Label>
                            <Input id="address" value={customer.address} onChange={handleInputChange} disabled={!isEditing || isSubmitting}/>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <Label htmlFor="license">Licencia de Conducir</Label>
                            <Input id="license" value={customer.license} onChange={handleInputChange} disabled={!isEditing || isSubmitting}/>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="idOrPassport">Cédula o Pasaporte</Label>
                            <Input id="idOrPassport" value={customer.idOrPassport} onChange={handleInputChange} disabled={!isEditing || isSubmitting}/>
                        </div>
                    </div>
                </CardContent>
            </Card>

        </div>
    );
}
