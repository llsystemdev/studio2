
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, MoreHorizontal, Edit, Trash2, Search, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import type { Customer } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';

type NewCustomer = Omit<Customer, 'id' | 'createdAt'>;

const emptyCustomer: NewCustomer = {
    name: '',
    email: '',
    phone: '',
    idOrPassport: '',
    license: '',
    address: '',
};

export default function CustomersPage() {
    const { db, logActivity } = useAuth();
    const { toast } = useToast();
    
    const [customers, setCustomers] = React.useState<Customer[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [open, setOpen] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [editingCustomer, setEditingCustomer] = React.useState<Customer | null>(null);
    const [customerData, setCustomerData] = React.useState<NewCustomer>(emptyCustomer);
    const [searchTerm, setSearchTerm] = React.useState('');

    const isEditing = editingCustomer !== null;

    React.useEffect(() => {
        if (!db) return;
        const unsubscribe = onSnapshot(collection(db, 'customers'), (snapshot) => {
            const customersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
            setCustomers(customersData);
            setLoading(false);
        }, (error) => {
            console.error("Failed to fetch customers:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch customers.' });
            setLoading(false);
        });

        return () => unsubscribe();
    }, [db, toast]);

    const handleOpenDialog = (customer: Customer | null = null) => {
        if (customer) {
            setEditingCustomer(customer);
            setCustomerData(customer);
        } else {
            setEditingCustomer(null);
            setCustomerData(emptyCustomer);
        }
        setOpen(true);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setCustomerData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!db) return;
        setIsSubmitting(true);

        try {
            if (isEditing && editingCustomer) {
                const customerRef = doc(db, 'customers', editingCustomer.id);
                await updateDoc(customerRef, customerData);
                await logActivity('Update', 'Customer', editingCustomer.id, `Updated customer profile for ${customerData.name}`);
                toast({ title: 'Customer Updated', description: 'The customer details have been updated.' });
            } else {
                const customerToAdd = {
                    ...customerData,
                    createdAt: new Date().toISOString(),
                }
                const newDocRef = await addDoc(collection(db, 'customers'), customerToAdd);
                await logActivity('Create', 'Customer', newDocRef.id, `Created new customer: ${customerData.name}`);
                toast({ title: 'Customer Added', description: 'The new customer has been saved.' });
            }
            setOpen(false);
        } catch (error) {
            console.error("Error saving customer:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to save customer data.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (customerId: string) => {
        if (!db) return;
        try {
            await deleteDoc(doc(db, 'customers', customerId));
            await logActivity('Delete', 'Customer', customerId, `Deleted customer`);
            toast({ title: 'Customer Deleted' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete customer.' });
        }
    };
    
    React.useEffect(() => {
        if (!open) {
            setEditingCustomer(null);
            setCustomerData(emptyCustomer);
            setIsSubmitting(false);
        }
    }, [open]);
    
    const filteredCustomers = customers.filter(c => {
        const lowercasedTerm = searchTerm.toLowerCase();
        const nameMatch = c.name ? c.name.toLowerCase().includes(lowercasedTerm) : false;
        const emailMatch = c.email ? c.email.toLowerCase().includes(lowercasedTerm) : false;
        const phoneMatch = c.phone ? c.phone.toLowerCase().includes(lowercasedTerm) : false;
        return nameMatch || emailMatch || phoneMatch;
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Customers</h1>
                <Button onClick={() => handleOpenDialog()}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Customer
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Customer List</CardTitle>
                    <CardDescription>Manage your customer profiles and contact information.</CardDescription>
                     <div className="relative pt-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search by name, email, or phone..." 
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
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
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>License No.</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCustomers.map((customer) => (
                                <TableRow key={customer.id}>
                                    <TableCell className="font-medium">{customer.name}</TableCell>
                                    <TableCell>{customer.email}</TableCell>
                                    <TableCell>{customer.phone}</TableCell>
                                    <TableCell>{customer.license}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleOpenDialog(customer)}>
                                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                                </DropdownMenuItem>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <DropdownMenuItem
                                                            onSelect={(e) => e.preventDefault()}
                                                            className="text-destructive focus:text-destructive"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete Customer
                                                        </DropdownMenuItem>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This will permanently delete the profile for <span className="font-semibold">{customer.name}</span>. This action cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Back</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(customer.id)} className="bg-destructive hover:bg-destructive/90">
                                                                Yes, Delete Customer
                                                            </AlertDialogAction>
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
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="name">Full Name</Label>
                                <Input id="name" value={customerData.name} onChange={handleInputChange} required disabled={isSubmitting}/>
                            </div>
                             <div>
                                <Label htmlFor="email">Email Address</Label>
                                <Input id="email" type="email" value={customerData.email} onChange={handleInputChange} required disabled={isSubmitting}/>
                            </div>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input id="phone" value={customerData.phone} onChange={handleInputChange} required disabled={isSubmitting}/>
                            </div>
                            <div>
                                <Label htmlFor="address">Address</Label>
                                <Input id="address" value={customerData.address} onChange={handleInputChange} disabled={isSubmitting}/>
                            </div>
                       </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="idOrPassport">ID / Passport Number</Label>
                                <Input id="idOrPassport" value={customerData.idOrPassport} onChange={handleInputChange} required disabled={isSubmitting}/>
                            </div>
                            <div>
                                <Label htmlFor="license">Driver's License Number</Label>
                                <Input id="license" value={customerData.license} onChange={handleInputChange} required disabled={isSubmitting}/>
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary" disabled={isSubmitting}>Cancel</Button>
                            </DialogClose>
                            <Button type="submit" disabled={isSubmitting}>
                                 {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                {isEditing ? 'Save Changes' : 'Add Customer'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
