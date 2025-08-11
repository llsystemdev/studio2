
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, MoreHorizontal, Edit, Trash2, Loader2, Database } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import type { Vehicle } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Image from 'next/image';

export const dynamic = 'force-dynamic';

type NewVehicle = Omit<Vehicle, 'id' | 'imageUrls' | 'dataAiHint'>;

const emptyVehicle: NewVehicle = {
    make: '', model: '', plate: '', category: 'Economy', status: 'Available', pricePerDay: 0,
    insuranceCost: 0, deductible: 0, specs: { seats: 4, transmission: 'Automatic', engine: '1.6L' }, lastServiceDate: '',
};

export default function VehiclesPage() {
    const { db, storage, role, logActivity } = useAuth();
    const { toast } = useToast();

    const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [open, setOpen] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isSeeding, setIsSeeding] = React.useState(false);
    const [editingVehicle, setEditingVehicle] = React.useState<Vehicle | null>(null);
    const [vehicleData, setVehicleData] = React.useState<NewVehicle>(emptyVehicle);
    const [imageFiles, setImageFiles] = React.useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = React.useState<string[]>([]);
    
    const isEditing = editingVehicle !== null;
    const canManageVehicles = role === 'Admin' || role === 'Supervisor';

    React.useEffect(() => {
        if (!db) return;
        setLoading(true);
        const unsubscribe = onSnapshot(collection(db, 'vehicles'), (snapshot) => {
            const vehiclesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
            setVehicles(vehiclesData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching vehicles:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [db]);

    const handleSeedDatabase = async () => {
        setIsSeeding(true);
        try {
            const response = await fetch('/api/seed', { method: 'POST' });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to seed database.');
            }
            toast({
                title: 'Database Populated!',
                description: 'The sample data has been added to your database.',
            });
        } catch (error: any) {
            console.error("Seeding error:", error);
            toast({
                variant: 'destructive',
                title: 'Seeding Failed',
                description: error.message || 'Could not populate the database. Check console for errors.',
            });
        } finally {
            setIsSeeding(false);
        }
    };


    const handleOpenDialog = (vehicle: Vehicle | null = null) => {
        if (vehicle) {
            setEditingVehicle(vehicle);
            setVehicleData(vehicle);
            setImagePreviews(vehicle.imageUrls || []);
        } else {
            setEditingVehicle(null);
            setVehicleData(emptyVehicle);
            setImagePreviews([]);
        }
        setImageFiles([]);
        setOpen(true);
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setImageFiles(files);
            const previews = files.map(file => URL.createObjectURL(file));
            setImagePreviews(previews);
        }
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value, type } = e.target;
        const processedValue = type === 'number' ? parseFloat(value) || 0 : value;

        if (id.startsWith('spec-')) {
            const specKey = id.split('-')[1] as keyof Vehicle['specs'];
            const specValue = id === 'spec-seats' ? parseInt(value, 10) || 0 : value;
            setVehicleData(prev => ({ ...prev, specs: { ...prev.specs, [specKey]: specValue }}));
        } else {
            setVehicleData(prev => ({ ...prev, [id]: processedValue }));
        }
    };
    
    const handleSelectChange = (id: 'category' | 'status') => (value: string) => {
        setVehicleData(prev => ({ ...prev, [id]: value as any }));
    };
    
    const uploadImages = async (): Promise<string[]> => {
        if (!storage || imageFiles.length === 0) return [];
        
        const uploadPromises = imageFiles.map(async (file) => {
            const storageRef = ref(storage, `vehicles/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            return await getDownloadURL(storageRef);
        });

        try {
            return await Promise.all(uploadPromises);
        } catch (error) {
            console.error("handleSubmit ERROR:", error);
            toast({
                variant: "destructive",
                title: "Image Upload Failed",
                description: "Could not upload images. Please check storage rules and try again.",
            });
            throw error; // Propagate error to stop form submission
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!db) return;
        setIsSubmitting(true);
        
        try {
            let uploadedImageUrls: string[] = isEditing ? editingVehicle?.imageUrls || [] : [];
            if (imageFiles.length > 0) {
                 uploadedImageUrls = await uploadImages();
            }

            const dataAiHint = `${vehicleData.make} ${vehicleData.category}`.toLowerCase();

            if (isEditing && editingVehicle) {
                const vehicleRef = doc(db, 'vehicles', editingVehicle.id);
                await updateDoc(vehicleRef, { 
                    ...vehicleData,
                    imageUrls: uploadedImageUrls,
                    dataAiHint,
                });
                await logActivity('Update', 'Vehicle', editingVehicle.id, `Updated vehicle: ${vehicleData.make} ${vehicleData.model}`);
                toast({ title: 'Vehicle Updated', description: `${vehicleData.make} ${vehicleData.model} has been updated.` });
            } else {
                const finalVehicleData = { 
                    ...vehicleData, 
                    imageUrls: uploadedImageUrls,
                    dataAiHint,
                };
                const newDocRef = await addDoc(collection(db, 'vehicles'), finalVehicleData);
                await logActivity('Create', 'Vehicle', newDocRef.id, `Created vehicle: ${finalVehicleData.make} ${finalVehicleData.model}`);
                toast({ title: 'Vehicle Added', description: `${vehicleData.make} ${vehicleData.model} has been added to the fleet.` });
            }
            
            setOpen(false);
        } catch (error) {
            console.error("Failed to save vehicle", error);
             toast({
                variant: "destructive",
                title: "Save Failed",
                description: "An error occurred while saving the vehicle. This may be due to a permissions issue.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleDeleteVehicle = async (vehicleId: string) => {
        if (!db) return;
        await deleteDoc(doc(db, "vehicles", vehicleId));
        await logActivity('Delete', 'Vehicle', vehicleId, 'Deleted vehicle');
        toast({ title: "Vehicle Deleted" });
    };
    
    React.useEffect(() => {
        if (!open) {
            setEditingVehicle(null);
            setVehicleData(emptyVehicle);
            setImageFiles([]);
            setImagePreviews([]);
            setIsSubmitting(false);
        }
    }, [open]);

    const getStatusVariant = (status: 'Available' | 'Rented' | 'Maintenance') => {
        switch(status) {
            case 'Available': return 'default';
            case 'Rented': return 'secondary';
            case 'Maintenance': return 'destructive';
            default: return 'outline';
        }
    }
    const getStatusClass = (status: 'Available' | 'Rented' | 'Maintenance') => {
        if (status === 'Available') return 'bg-green-600 hover:bg-green-700';
        return '';
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Vehicles</h1>
                <Button onClick={() => handleOpenDialog()} disabled={!canManageVehicles}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Vehicle
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Vehicle Fleet</CardTitle>
                    <CardDescription>Manage your entire vehicle fleet from here.</CardDescription>
                </CardHeader>
                <CardContent>
                     {loading ? (
                         <div className="flex justify-center items-center h-48">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                         </div>
                    ) : vehicles.length === 0 ? (
                        <div className="text-center py-10">
                            <h3 className="text-lg font-semibold">Your Fleet is Empty</h3>
                            <p className="text-muted-foreground mt-2">Get started by populating the database with sample data or add your first vehicle.</p>
                            <Button onClick={handleSeedDatabase} className="mt-4" disabled={isSeeding}>
                                {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
                                Populate with Sample Data
                            </Button>
                        </div>
                    ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Make & Model</TableHead>
                                <TableHead>Plate</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Price/Day</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {vehicles.map((vehicle) => (
                                <TableRow key={vehicle.id}>
                                    <TableCell className="font-medium">{vehicle.make} {vehicle.model}</TableCell>
                                    <TableCell>{vehicle.plate}</TableCell>
                                    <TableCell>{vehicle.category}</TableCell>
                                    <TableCell>${vehicle.pricePerDay.toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(vehicle.status)} className={getStatusClass(vehicle.status)}>
                                            {vehicle.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button aria-haspopup="true" size="icon" variant="ghost" disabled={!canManageVehicles}>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleOpenDialog(vehicle)}>
                                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                                </DropdownMenuItem>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                        </DropdownMenuItem>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>This action cannot be undone. This will permanently delete the vehicle.</AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteVehicle(vehicle.id)} className="bg-destructive hover:bg-destructive/90">Yes, delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Edit Vehicle' : 'Add New Vehicle'}</DialogTitle>
                        <DialogDescription>{isEditing ? 'Update the details below.' : 'Fill in the details below to add a new vehicle to the fleet.'}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div><Label htmlFor="make">Make</Label><Input id="make" value={vehicleData.make} onChange={handleInputChange} required /></div>
                            <div><Label htmlFor="model">Model</Label><Input id="model" value={vehicleData.model} onChange={handleInputChange} required /></div>
                            <div><Label htmlFor="plate">Plate</Label><Input id="plate" value={vehicleData.plate} onChange={handleInputChange} required /></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div><Label htmlFor="pricePerDay">Price per Day ($)</Label><Input id="pricePerDay" type="number" value={vehicleData.pricePerDay} onChange={handleInputChange} required /></div>
                            <div><Label htmlFor="insuranceCost">Insurance per Day ($)</Label><Input id="insuranceCost" type="number" value={vehicleData.insuranceCost} onChange={handleInputChange} required /></div>
                            <div><Label htmlFor="deductible">Deductible ($)</Label><Input id="deductible" type="number" value={vehicleData.deductible} onChange={handleInputChange} required /></div>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <div>
                                <Label htmlFor="category">Category</Label>
                                <Select onValueChange={handleSelectChange('category')} value={vehicleData.category} required>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Economy">Economy</SelectItem>
                                        <SelectItem value="Sedan">Sedan</SelectItem>
                                        <SelectItem value="SUV">SUV</SelectItem>
                                        <SelectItem value="Luxury">Luxury</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="status">Status</Label>
                                <Select onValueChange={handleSelectChange('status')} value={vehicleData.status} required>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Available">Available</SelectItem>
                                        <SelectItem value="Rented">Rented</SelectItem>
                                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                             <div>
                                <Label htmlFor="lastServiceDate">Last Service Date</Label>
                                <Input id="lastServiceDate" type="date" value={vehicleData.lastServiceDate} onChange={handleInputChange} required />
                            </div>
                        </div>

                        <div>
                            <Label>Specifications</Label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2 border p-4 rounded-md">
                                <div><Label htmlFor="spec-seats">Seats</Label><Input id="spec-seats" type="number" value={vehicleData.specs.seats} onChange={handleInputChange} /></div>
                                <div><Label htmlFor="spec-transmission">Transmission</Label><Input id="spec-transmission" value={vehicleData.specs.transmission} onChange={handleInputChange} /></div>
                                <div><Label htmlFor="spec-engine">Engine</Label><Input id="spec-engine" value={vehicleData.specs.engine} onChange={handleInputChange} /></div>
                            </div>
                        </div>
                        
                        <div>
                             <Label htmlFor="images">Vehicle Images (first image is the primary)</Label>
                             <Input id="images" type="file" multiple onChange={handleFileChange} accept="image/*" />
                             <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                                {imagePreviews.map((preview, index) => (
                                    <div key={index} className="relative aspect-video">
                                        <Image src={preview} alt={`Preview ${index + 1}`} fill className="rounded-md object-cover" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="secondary" disabled={isSubmitting}>Cancel</Button></DialogClose>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEditing ? 'Save Changes' : 'Add Vehicle'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
