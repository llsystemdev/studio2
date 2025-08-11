
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Eye, FileSignature, Loader2, Info } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import type { Contract } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ContractsPage() {
    const { db } = useAuth();
    const { toast } = useToast();

    const [contracts, setContracts] = React.useState<Contract[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [viewingContract, setViewingContract] = React.useState<Contract | null>(null);

    React.useEffect(() => {
        if (!db) return;
        setLoading(true);

        const q = query(collection(db, 'contracts'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const contractsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contract));
            setContracts(contractsData);
            setLoading(false);
        }, (error) => {
            console.error("Failed to fetch contracts:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch contracts.' });
            setLoading(false);
        });

        return () => unsubscribe();
    }, [db, toast]);

    const getStatusVariant = (status: Contract['status']): "default" | "secondary" | "destructive" | "outline" => {
        switch (status) {
            case 'completed':
            case 'signed':
                return 'default';
            case 'pending':
            case 'pending_signature':
            case 'signed_by_client':
                 return 'secondary';
            case 'cancelled': 
                return 'destructive';
            default: 
                return 'outline';
        }
    };
    
    const getStatusClass = (status: Contract['status']) => {
        switch (status) {
            case 'completed':
            case 'signed':
                return 'bg-green-600 hover:bg-green-700';
            case 'pending_signature':
            case 'signed_by_client':
                 return 'bg-yellow-500 hover:bg-yellow-600';
            default:
                return '';
        }
    };
    

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Contracts</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Contract Management</CardTitle>
                    <CardDescription>View and manage all generated rental contracts.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                         <div className="flex justify-center items-center h-48">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                         </div>
                    ) : contracts.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                            <Info className="mx-auto h-12 w-12" />
                            <h3 className="mt-4 text-lg font-semibold">No Contracts Found</h3>
                            <p className="mt-2 text-sm">Generate a new contract from the Reservations page to see it here.</p>
                        </div>
                    ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Contract ID</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Vehicle</TableHead>
                                <TableHead>Date Created</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {contracts.map((contract) => (
                                <TableRow key={contract.id}>
                                    <TableCell className="font-medium">{contract.id}</TableCell>
                                    <TableCell>{contract.customerName}</TableCell>
                                    <TableCell>{contract.vehicleName}</TableCell>
                                    <TableCell>{new Date(contract.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={getStatusVariant(contract.status)}
                                            className={getStatusClass(contract.status)}
                                        >
                                            {contract.status.replace(/_/g, ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => setViewingContract(contract)}>
                                                    <Eye className="mr-2 h-4 w-4" /> View Content
                                                </DropdownMenuItem>
                                                <DropdownMenuItem disabled>
                                                    <FileSignature className="mr-2 h-4 w-4" /> Sign as Agent
                                                </DropdownMenuItem>
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

            <Dialog open={!!viewingContract} onOpenChange={(isOpen) => !isOpen && setViewingContract(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Contract Content: {viewingContract?.id}</DialogTitle>
                        <DialogDescription>
                           Customer: {viewingContract?.customerName}
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-96 w-full rounded-md border p-4">
                        <pre className="whitespace-pre-wrap text-sm">
                            {viewingContract?.content}
                        </pre>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div>
    );
}
