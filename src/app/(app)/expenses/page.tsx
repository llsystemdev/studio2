
'use client';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, MoreHorizontal, Edit, CheckCircle, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { collection, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';

type Expense = {
    id: string;
    description: string;
    category: 'Maintenance' | 'Fuel' | 'Insurance' | 'Salaries' | 'Office Supplies' | 'Utilities' | 'Other';
    amount: string;
    date: string;
    status: 'Pending' | 'Paid' | 'Overdue';
    createdBy: string;
}
type NewExpense = Omit<Expense, 'id'>;

const emptyExpense: Omit<Expense, 'id' | 'createdBy'> = {
    description: '',
    category: 'Maintenance',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    status: 'Pending',
};

export default function ExpensesPage() {
    const { toast } = useToast();
    const { db, user, role, logActivity } = useAuth();
    const [expenses, setExpenses] = React.useState<Expense[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [open, setOpen] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [editingExpense, setEditingExpense] = React.useState<Expense | null>(null);
    const [expenseData, setExpenseData] = React.useState<Omit<NewExpense, 'createdBy'>>(emptyExpense);

    const isEditing = editingExpense !== null;
    const canEdit = role === 'Admin' || role === 'Supervisor';

    React.useEffect(() => {
        if (!db) return;
        const unsubscribe = onSnapshot(collection(db, 'expenses'), (snapshot) => {
            const expensesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
            setExpenses(expensesData);
            setLoading(false);
        }, (error) => {
            console.error("Failed to fetch expenses:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch expenses.' });
            setLoading(false);
        });
        return () => unsubscribe();
    }, [db, toast]);

    const handleOpenDialog = (expense: Expense | null = null) => {
        if (expense) {
            if (!canEdit) {
                toast({ variant: 'destructive', title: 'Permission Denied', description: 'You do not have permission to edit expenses.' });
                return;
            }
            setEditingExpense(expense);
            setExpenseData(expense);
        } else {
            setEditingExpense(null);
            setExpenseData(emptyExpense);
        }
        setOpen(true);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setExpenseData(prev => ({ ...prev, [id]: value }));
    };

    const handleSelectChange = (id: keyof Omit<NewExpense, 'createdBy' | 'description' | 'amount' | 'date'>) => (value: string) => {
        setExpenseData(prev => ({ ...prev, [id]: value as any }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!db || !user) return;
        setIsSubmitting(true);

        const dataToSave = {
            ...expenseData,
            amount: parseFloat(expenseData.amount).toFixed(2),
            createdBy: user.displayName || 'System Admin',
        };

        try {
            if (isEditing && editingExpense) {
                const expenseRef = doc(db, 'expenses', editingExpense.id);
                await updateDoc(expenseRef, dataToSave);
                await logActivity('Update', 'Expense', editingExpense.id, `Updated expense: ${dataToSave.description}`);
                toast({ title: 'Expense Updated', description: 'The expense has been successfully updated.' });
            } else {
                const newDocRef = await addDoc(collection(db, 'expenses'), dataToSave);
                await logActivity('Create', 'Expense', newDocRef.id, `Created expense: ${dataToSave.description} for $${dataToSave.amount}`);
                toast({ title: 'Expense Added', description: 'The new expense has been recorded.' });
            }
            setOpen(false);
        } catch (error) {
            console.error("Error saving expense:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to save expense record.' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleMarkAsPaid = async (expenseId: string) => {
        if(!db) return;
        const expenseRef = doc(db, 'expenses', expenseId);
        try {
            await updateDoc(expenseRef, { status: 'Paid' });
            await logActivity('Update', 'Expense', expenseId, `Marked expense as Paid.`);
            toast({
                title: "Expense Paid",
                description: `Expense has been marked as paid.`,
            });
        } catch (error) {
             toast({ variant: 'destructive', title: 'Error', description: 'Failed to update expense status.' });
        }
    };

    React.useEffect(() => {
        if (!open) {
            setEditingExpense(null);
            setExpenseData(emptyExpense);
            setIsSubmitting(false);
        }
    }, [open]);

    const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
        switch (status) {
            case 'Paid': return 'default';
            case 'Pending': return 'secondary';
            case 'Overdue': return 'destructive';
            default: return 'outline';
        }
    };
    
    const getStatusClass = (status: string) => {
        if (status === 'Paid') return 'bg-green-600 hover:bg-green-700';
        return '';
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Expenses</h1>
                <Button onClick={() => handleOpenDialog()}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Expense
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Expense Records</CardTitle>
                    <CardDescription>Track and manage all company expenditures.</CardDescription>
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
                                <TableHead>Description</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created By</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {expenses.map((expense) => (
                                <TableRow key={expense.id}>
                                    <TableCell className="font-medium">{expense.description}</TableCell>
                                    <TableCell>{expense.category}</TableCell>
                                    <TableCell>${expense.amount}</TableCell>
                                    <TableCell>{expense.date}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={getStatusVariant(expense.status)}
                                            className={getStatusClass(expense.status)}
                                        >
                                            {expense.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{expense.createdBy}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleOpenDialog(expense)} disabled={!canEdit}>
                                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                                </DropdownMenuItem>
                                                {expense.status !== 'Paid' && (
                                                    <DropdownMenuItem onClick={() => handleMarkAsPaid(expense.id)}>
                                                        <CheckCircle className="mr-2 h-4 w-4" /> Mark as Paid
                                                    </DropdownMenuItem>
                                                )}
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
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Input id="description" value={expenseData.description} onChange={handleInputChange} required disabled={isSubmitting}/>
                        </div>
                        <div>
                            <Label htmlFor="category">Category</Label>
                            <Select onValueChange={handleSelectChange('category')} value={expenseData.category} required disabled={isSubmitting}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                                    <SelectItem value="Fuel">Fuel</SelectItem>
                                    <SelectItem value="Insurance">Insurance</SelectItem>
                                    <SelectItem value="Salaries">Salaries</SelectItem>
                                    <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                                    <SelectItem value="Utilities">Utilities</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="amount">Amount ($)</Label>
                                <Input id="amount" type="number" step="0.01" value={expenseData.amount} onChange={handleInputChange} required disabled={isSubmitting}/>
                            </div>
                            <div>
                                <Label htmlFor="date">Date</Label>
                                <Input id="date" type="date" value={expenseData.date} onChange={handleInputChange} required disabled={isSubmitting}/>
                            </div>
                        </div>
                         <div>
                            <Label htmlFor="status">Status</Label>
                            <Select onValueChange={handleSelectChange('status')} value={expenseData.status} required disabled={isSubmitting}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Pending">Pending</SelectItem>
                                    <SelectItem value="Paid">Paid</SelectItem>
                                    <SelectItem value="Overdue">Overdue</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary" disabled={isSubmitting}>Cancel</Button>
                            </DialogClose>
                            <Button type="submit" disabled={isSubmitting}>
                                 {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                {isEditing ? 'Save Changes' : 'Add Expense'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
