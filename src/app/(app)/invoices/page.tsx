
'use client';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, MoreHorizontal, Download, CreditCard, Banknote, Search } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { onSnapshot, collection, doc, setDoc, updateDoc } from 'firebase/firestore';
import type { Invoice } from '@/lib/types';

type NewInvoice = Omit<Invoice, 'id' | 'createdBy'>;

export default function InvoicesPage() {
    const { user, db, logActivity } = useAuth();
    const [invoices, setInvoices] = React.useState<Invoice[]>([]);
    const [open, setOpen] = React.useState(false);
    const [editingInvoice, setEditingInvoice] = React.useState<Invoice | null>(null);
    const [invoiceData, setInvoiceData] = React.useState<NewInvoice>({
        customer: '',
        date: new Date().toISOString().split('T')[0],
        amount: '',
        status: 'Draft',
        paymentMethod: 'Credit Card'
    });
    const [isViewing, setIsViewing] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState('');

    React.useEffect(() => {
        if (!db) return;
        const unsubscribe = onSnapshot(collection(db, 'invoices'), (snapshot) => {
            const invoicesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
            setInvoices(invoicesData);
        });
        return () => unsubscribe();
    }, [db]);

    const isEditing = editingInvoice !== null;

    const handleOpenDialog = (invoice: Invoice | null = null, viewMode = false) => {
        setIsViewing(viewMode);
        if (invoice) {
            setEditingInvoice(invoice);
            const amountString = String(invoice.amount).replace('$', '');
            setInvoiceData({ ...invoice, amount: amountString });
        } else {
            setEditingInvoice(null);
            setInvoiceData({
                customer: '',
                date: new Date().toISOString().split('T')[0],
                amount: '',
                status: 'Draft',
                paymentMethod: 'Credit Card'
            });
        }
        setOpen(true);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setInvoiceData(prev => ({ ...prev, [id]: value }));
    }

    const handleSelectChange = (id: 'status' | 'paymentMethod') => (value: string) => {
        setInvoiceData(prev => ({ ...prev, [id]: value as any }));
    }

    const generateNewInvoiceId = () => {
         const maxId = invoices.reduce((max, inv) => {
            const idNum = parseInt(inv.id.split('-')[2]);
            return idNum > max ? idNum : max;
        }, 0);
        return `INV-2024-${String(maxId > 0 ? maxId + 1 : Date.now().toString().slice(-4)).padStart(4, '0')}`;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!db) return;
        const agentName = user?.displayName ?? 'System';

        if (isEditing && editingInvoice) {
            const invoiceRef = doc(db, 'invoices', editingInvoice.id);
            await updateDoc(invoiceRef, {
                 ...invoiceData,
                 amount: `${parseFloat(invoiceData.amount).toFixed(2)}`,
                 createdBy: agentName
            });
            await logActivity('Update', 'Invoice', editingInvoice.id, `Updated invoice for ${invoiceData.customer}`);
        } else {
            const newId = generateNewInvoiceId();
            const invoiceToAdd = {
                ...invoiceData,
                amount: `${parseFloat(invoiceData.amount).toFixed(2)}`,
                createdBy: agentName,
            };
            await setDoc(doc(db, 'invoices', newId), invoiceToAdd);
            await logActivity('Create', 'Invoice', newId, `Created invoice for ${invoiceData.customer} for $${invoiceData.amount}`);
        }
        setOpen(false);
    }
    
    const filteredInvoices = invoices.filter(invoice => {
        const lowercasedTerm = searchTerm.toLowerCase();
        const customerMatch = invoice.customer ? invoice.customer.toLowerCase().includes(lowercasedTerm) : false;
        const idMatch = invoice.id ? invoice.id.toLowerCase().includes(lowercasedTerm) : false;
        return customerMatch || idMatch;
    });

    // Reset state when dialog closes
    React.useEffect(() => {
        if (!open) {
            setEditingInvoice(null);
            setInvoiceData({
                customer: '',
                date: new Date().toISOString().split('T')[0],
                amount: '',
                status: 'Draft',
                paymentMethod: 'Credit Card'
            });
            setIsViewing(false);
        }
    }, [open]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-3xl font-bold font-headline">Invoices</h1>
                <Button onClick={() => handleOpenDialog()}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Invoice
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Invoice History</CardTitle>
                    <CardDescription>View and manage all customer invoices.</CardDescription>
                    <div className="relative pt-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search by customer or invoice ID..." 
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Invoice ID</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Payment Method</TableHead>
                                <TableHead>Created By</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredInvoices.map((invoice) => (
                                <TableRow key={invoice.id}>
                                    <TableCell>
                                        <div className="font-medium">{invoice.id}</div>
                                        <div className="text-xs text-muted-foreground">{invoice.date}</div>
                                    </TableCell>
                                    <TableCell>{invoice.customer}</TableCell>
                                    <TableCell>${invoice.amount}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                invoice.status === 'Paid' ? 'default' :
                                                invoice.status === 'Pending' ? 'secondary' :
                                                invoice.status === 'Overdue' ? 'destructive' :
                                                'outline'
                                            }
                                            className={
                                                invoice.status === 'Paid' ? 'bg-green-600 hover:bg-green-700' : ''
                                            }
                                        >
                                            {invoice.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className='flex items-center gap-2'>
                                            {invoice.paymentMethod === 'Credit Card' && <CreditCard className="h-4 w-4 text-muted-foreground" />}
                                            {invoice.paymentMethod === 'Bank Transfer' && <Banknote className="h-4 w-4 text-muted-foreground" />}
                                            {invoice.paymentMethod === 'Cash' && <Banknote className="h-4 w-4 text-muted-foreground" />}
                                            {invoice.paymentMethod}
                                        </div>
                                    </TableCell>
                                    <TableCell>{invoice.createdBy}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Toggle menu</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleOpenDialog(invoice, true)}>View Details</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleOpenDialog(invoice)}>Edit</DropdownMenuItem>
                                                <DropdownMenuItem className="gap-2">
                                                    <Download className="h-4 w-4" />
                                                    Download PDF
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[425px]">
                     <DialogHeader>
                        <DialogTitle>{isViewing ? 'Invoice Details' : isEditing ? 'Edit Invoice' : 'Create New Invoice'}</DialogTitle>
                        <DialogDescription>
                             {isViewing ? `Viewing invoice ${editingInvoice?.id}.` : isEditing ? 'Update the details of the invoice.' : 'Fill in the details below to create a new invoice.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="customer" className="text-right">Customer</Label>
                                <Input id="customer" value={invoiceData.customer} onChange={handleInputChange} className="col-span-3" placeholder="e.g. John Doe" required disabled={isViewing}/>
                            </div>
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="date" className="text-right">Date</Label>
                                <Input id="date" type="date" value={invoiceData.date} onChange={handleInputChange} className="col-span-3" required disabled={isViewing}/>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="amount" className="text-right">Amount ($)</Label>
                                <Input id="amount" type="number" step="0.01" value={invoiceData.amount} onChange={handleInputChange} className="col-span-3" placeholder="e.g. 250.00" required disabled={isViewing}/>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="status" className="text-right">Status</Label>
                                 <Select onValueChange={handleSelectChange('status')} value={invoiceData.status} required disabled={isViewing}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select a status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Draft">Draft</SelectItem>
                                        <SelectItem value="Pending">Pending</SelectItem>
                                        <SelectItem value="Paid">Paid</SelectItem>
                                        <SelectItem value="Overdue">Overdue</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="paymentMethod" className="text-right">Payment</Label>
                                 <Select onValueChange={handleSelectChange('paymentMethod')} value={invoiceData.paymentMethod} required disabled={isViewing}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select a method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Credit Card">Credit Card</SelectItem>
                                        <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                        <SelectItem value="Cash">Cash</SelectItem>
                                        <SelectItem value="N/A">N/A</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary">
                                    {isViewing ? 'Close' : 'Cancel'}
                                </Button>
                            </DialogClose>
                            {!isViewing && <Button type="submit">{isEditing ? 'Save Changes' : 'Create Invoice'}</Button>}
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
