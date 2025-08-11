
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Loader2, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { collection, doc, updateDoc, onSnapshot, addDoc, query, orderBy } from 'firebase/firestore';
import type { Vehicle, MaintenanceLog, Expense } from '@/lib/types';

type NewMaintenanceLog = Omit<MaintenanceLog, 'id' | 'vehicleName' | 'createdBy'>;

const emptyLog: NewMaintenanceLog = {
    vehicleId: '',
    date: new Date().toISOString().split('T')[0],
    serviceType: 'General Inspection',
    cost: '',
    notes: '',
};

export default function MaintenancePage() {
    const { toast } = useToast();
    const { db, user, logActivity } = useAuth();
    const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
    const [logs, setLogs] = React.useState<MaintenanceLog[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [open, setOpen] = React.useState(false);
    const [logData, setLogData] = React.useState<NewMaintenanceLog>(emptyLog);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    React.useEffect(() => {
        if (!db) return;
        
        const unsubVehicles = onSnapshot(query(collection(db, 'vehicles'), orderBy('make')), (snapshot) => {
            const vehiclesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
            setVehicles(vehiclesData);
            if (loading) setLoading(false);
        }, (error) => {
            console.error("Error fetching vehicles:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch vehicles.' });
            if (loading) setLoading(false);
        });
        
        const unsubLogs = onSnapshot(query(collection(db, 'maintenanceLogs'), orderBy('date', 'desc')), (snapshot) => {
            const logsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MaintenanceLog));
            setLogs(logsData);
        }, (error) => {
            console.error("Error fetching logs:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch maintenance logs.' });
        });

        return () => {
            unsubVehicles();
            unsubLogs();
        };
    }, [toast, db, loading]);


    const handleOpenDialog = () => {
        setLogData(emptyLog);
        setOpen(true);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setLogData(prev => ({ ...prev, [id]: value }));
    };

    const handleSelectChange = (id: keyof NewMaintenanceLog) => (value: string) => {
        setLogData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!db || !user) {
            toast({ variant: 'destructive', title: 'Error', description: 'Database not available or user not logged in.' });
            return;
        }
        setIsSubmitting(true);
        const selectedVehicle = vehicles.find(v => v.id === logData.vehicleId);

        if (!selectedVehicle) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select a vehicle.' });
            setIsSubmitting(false);
            return;
        }

        const newLog: Omit<MaintenanceLog, 'id'> = {
            ...logData,
            vehicleName: `${selectedVehicle.make} ${selectedVehicle.model}`,
            createdBy: user.displayName || 'System Admin',
        };
        
        try {
            // Add the new log to the maintenanceLogs collection
            const logDocRef = await addDoc(collection(db, 'maintenanceLogs'), newLog);
            await logActivity('Create', 'Maintenance', logDocRef.id, `Logged ${newLog.serviceType} for ${newLog.vehicleName}`);
            
            // If there's a cost, create an expense automatically
            if (parseFloat(newLog.cost) > 0) {
                const newExpense: Omit<Expense, 'id'> = {
                    description: `Maintenance: ${newLog.serviceType} for ${newLog.vehicleName}`,
                    category: 'Maintenance',
                    amount: newLog.cost,
                    date: newLog.date,
                    status: 'Paid', // Assuming maintenance is paid immediately
                    createdBy: user.displayName || 'System Admin',
                    vehicleId: selectedVehicle.id,
                };
                const expenseDocRef = await addDoc(collection(db, 'expenses'), newExpense);
                await logActivity('Create', 'Expense', expenseDocRef.id, `Auto-created expense for maintenance log ${logDocRef.id}`);
            }

            // Update the vehicle's status to 'Maintenance' and its last service date
            const vehicleRef = doc(db, 'vehicles', selectedVehicle.id);
            await updateDoc(vehicleRef, { 
                status: 'Maintenance',
                lastServiceDate: newLog.date 
            });
            await logActivity('Update', 'Vehicle', selectedVehicle.id, `Status set to Maintenance (new log).`);

            toast({ title: 'Maintenance Logged', description: `Service for ${newLog.vehicleName} has been recorded and status updated.` });
            setOpen(false);
            // Data will refresh automatically due to onSnapshot
        } catch (error) {
            console.error("Error logging maintenance: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to log maintenance record.' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    React.useEffect(() => {
        if (!open) {
            setLogData(emptyLog);
        }
    }, [open]);

    const handleCompleteMaintenance = async (vehicleId: string) => {
        if (!db) return;
        const vehicleRef = doc(db, 'vehicles', vehicleId);
        try {
            await updateDoc(vehicleRef, { status: 'Available' });
            await logActivity('Update', 'Vehicle', vehicleId, 'Status set to Available after maintenance.');
            toast({ title: 'Maintenance Completed', description: 'Vehicle is now available for rent.' });
        } catch (error) {
            console.error('Error completing maintenance:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update vehicle status.' });
        }
    };


    const getStatusForVehicle = (vehicle: Vehicle) => {
        if (!vehicle || !vehicle.lastServiceDate) {
            return { text: 'Unknown', variant: 'secondary' as const };
        }
        const lastService = new Date(vehicle.lastServiceDate);
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        if (lastService < sixMonthsAgo) {
            return { text: 'Service Due', variant: 'destructive' as const };
        }
        return { text: 'OK', variant: 'default' as const };
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Vehicle Maintenance</h1>
                <Button onClick={handleOpenDialog}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Log Maintenance
                </Button>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Fleet Status</CardTitle>
                    <CardDescription>Overview of vehicle maintenance status. Service is recommended every 6 months.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center items-center h-48">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Vehicle</TableHead>
                                <TableHead>Plate</TableHead>
                                <TableHead>Current Status</TableHead>
                                <TableHead>Last Service</TableHead>
                                <TableHead>Service Health</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {vehicles.map((vehicle) => {
                                const status = getStatusForVehicle(vehicle);
                                return (
                                <TableRow key={vehicle.id}>
                                    <TableCell className="font-medium">{vehicle.make} {vehicle.model}</TableCell>
                                    <TableCell>{vehicle.plate}</TableCell>
                                    <TableCell>
                                        <Badge variant={vehicle.status === 'Maintenance' ? 'destructive' : 'secondary'}>{vehicle.status}</Badge>
                                    </TableCell>
                                    <TableCell>{vehicle.lastServiceDate || 'N/A'}</TableCell>
                                    <TableCell>
                                        <Badge variant={status.variant} className={status.variant === 'default' ? 'bg-green-600' : ''}>
                                            {status.text}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {vehicle.status === 'Maintenance' && (
                                            <Button size="sm" variant="outline" onClick={() => handleCompleteMaintenance(vehicle.id)}>
                                                <CheckCircle className="mr-2 h-4 w-4 text-green-600"/>
                                                Complete Maintenance
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )})}
                        </TableBody>
                    </Table>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Maintenance History</CardTitle>
                    <CardDescription>A log of all recorded maintenance and repair activities.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Vehicle</TableHead>
                                <TableHead>Service Type</TableHead>
                                <TableHead>Cost</TableHead>
                                <TableHead>Created By</TableHead>
                                <TableHead>Notes</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell>{log.date}</TableCell>
                                    <TableCell className="font-medium">{log.vehicleName}</TableCell>
                                    <TableCell>{log.serviceType}</TableCell>
                                    <TableCell>${log.cost}</TableCell>
                                    <TableCell>{log.createdBy}</TableCell>
                                    <TableCell className="max-w-[300px] truncate">{log.notes}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Log New Maintenance Record</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="vehicleId">Vehicle</Label>
                            <Select onValueChange={(value) => handleSelectChange('vehicleId')(value)} required disabled={isSubmitting}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a vehicle" />
                                </SelectTrigger>
                                <SelectContent>
                                    {vehicles.map(v => (
                                        <SelectItem key={v.id} value={String(v.id)}>{v.make} {v.model} ({v.plate})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                         <div>
                            <Label htmlFor="serviceType">Service Type</Label>
                            <Select onValueChange={(value) => handleSelectChange('serviceType')(value)} defaultValue="General Inspection" required disabled={isSubmitting}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select service type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="General Inspection">General Inspection</SelectItem>
                                    <SelectItem value="Oil Change">Oil Change</SelectItem>
                                    <SelectItem value="Tire Rotation">Tire Rotation</SelectItem>
                                    <SelectItem value="Brake Service">Brake Service</SelectItem>
                                    <SelectItem value="Battery Check">Battery Check</SelectItem>
                                    <SelectItem value="Repair">Repair</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="date">Service Date</Label>
                                <Input id="date" type="date" value={logData.date} onChange={handleInputChange} required disabled={isSubmitting}/>
                            </div>
                            <div>
                                <Label htmlFor="cost">Cost ($)</Label>
                                <Input id="cost" type="number" step="0.01" value={logData.cost} onChange={handleInputChange} required placeholder="150.00" disabled={isSubmitting}/>
                            </div>
                        </div>
                         <div>
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea id="notes" value={logData.notes} onChange={handleInputChange} placeholder="Describe the work performed..." disabled={isSubmitting}/>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary" disabled={isSubmitting}>Cancel</Button>
                            </DialogClose>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Log Record
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
