
'use client';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UploadCloud, MoreHorizontal, Trash2, Download, FileText, Loader2, Eye } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

type Document = {
    id: string;
    customer: string;
    type: "Driver's License" | "ID Card (Cédula)" | "Passport" | "Other" | "Rental Agreement" | "Departure Checklist";
    date: string;
    fileUrl: string;
    fileName: string;
    status: 'Verified' | 'Pending' | 'Rejected' | 'Signed' | 'Generated';
    reservationId?: string;
    content?: string | object; // Can be string or object
}

type NewDocument = Omit<Document, 'id' | 'date' | 'fileUrl' | 'fileName' | 'status' | 'reservationId' | 'content'> & {
    file: File | null;
}

const emptyDocument: Omit<NewDocument, 'type'> & { type: "Driver's License" | "ID Card (Cédula)" | "Passport" | "Other" } = {
    customer: '',
    type: "Driver's License",
    file: null,
};


export default function DocumentsPage() {
    const { db, storage } = useAuth();
    const [documents, setDocuments] = React.useState<Document[]>([]);
    const [newDocument, setNewDocument] = React.useState(emptyDocument);
    const { toast } = useToast();
    const [loading, setLoading] = React.useState(true);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [viewingDocument, setViewingDocument] = React.useState<Document | null>(null);

    React.useEffect(() => {
        if (!db) return;
        setLoading(true);

        const q = query(collection(db, "documents"), orderBy("date", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Document));
            setDocuments(docsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching documents:", error);
            setLoading(false)
        });

        // Cleanup function to unsubscribe from the listener
        return () => unsubscribe();
    }, [db]);


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setNewDocument(prev => ({...prev, [id]: value}));
    }
    
    const handleSelectChange = (value: string) => {
        setNewDocument(prev => ({...prev, type: value as any}));
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setNewDocument(prev => ({ ...prev, file }));
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!newDocument.customer || !newDocument.type || !newDocument.file || !db || !storage) {
             toast({
                variant: "destructive",
                title: "Incomplete form",
                description: "Please fill out all fields and select a file.",
            })
            return;
        }
        setIsSubmitting(true);
        
        try {
            // Upload file to storage
            const fileRef = ref(storage, `documents/${Date.now()}_${newDocument.file.name}`);
            await uploadBytes(fileRef, newDocument.file);
            const fileUrl = await getDownloadURL(fileRef);

            // Add document metadata to Firestore
            const documentToAdd = {
                customer: newDocument.customer,
                type: newDocument.type,
                fileUrl: fileUrl,
                fileName: newDocument.file.name,
                date: new Date().toISOString().split('T')[0],
                status: 'Pending' as const,
            }
            await addDoc(collection(db, 'documents'), documentToAdd);

            toast({
                title: "Document uploaded!",
                description: `${newDocument.file.name} for ${newDocument.customer} has been added for verification.`,
            })

            setNewDocument(emptyDocument);
            const fileInput = document.getElementById('file') as HTMLInputElement;
            if(fileInput) fileInput.value = '';

        } catch (error) {
            console.error("Error uploading document:", error);
            toast({ variant: 'destructive', title: "Upload Error", description: "Failed to upload document."});
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleDelete = async (docId: string) => {
        if(!db) return;
        
        try {
            await deleteDoc(doc(db, 'documents', docId));
            toast({
                title: "Document deleted",
                description: "The document has been removed from the list.",
            })
        } catch (error) {
             console.error("Error deleting document:", error);
             toast({ variant: 'destructive', title: "Delete Error", description: "Failed to delete document."});
        }
    }
    
     const getStatusVariant = (status: Document['status']) => {
        switch (status) {
            case 'Verified':
            case 'Signed':
            case 'Generated':
                return 'default';
            case 'Pending':
                return 'secondary';
            case 'Rejected':
                return 'destructive';
            default:
                return 'outline';
        }
    };

    const getStatusClass = (status: Document['status']) => {
        if (status === 'Verified' || status === 'Signed' || status === 'Generated') return 'bg-green-600 hover:bg-green-700';
        return '';
    };

    const getDisplayContent = (content: Document['content']): string => {
        if (typeof content === 'string') {
            return content;
        }
        if (typeof content === 'object' && content !== null) {
            return JSON.stringify(content, null, 2);
        }
        return 'No content available.';
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold font-headline">Document Management</h1>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Upload Document</CardTitle>
                        <CardDescription>Upload customer documents like driver's license or passport for verification.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-4" onSubmit={handleSubmit}>
                            <div>
                                <Label htmlFor="customer">Customer Name</Label>
                                <Input id="customer" placeholder="John Doe" value={newDocument.customer} onChange={handleInputChange} required disabled={isSubmitting}/>
                            </div>
                            <div>
                                <Label htmlFor="type">Document Type</Label>
                                <Select onValueChange={handleSelectChange} value={newDocument.type} required disabled={isSubmitting}>
                                    <SelectTrigger id="type">
                                        <SelectValue placeholder="Select document type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Driver's License">Driver's License</SelectItem>
                                        <SelectItem value="ID Card (Cédula)">ID Card (Cédula)</SelectItem>
                                        <SelectItem value="Passport">Passport</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="file">File</Label>
                                <Input id="file" type="file" onChange={handleFileChange} required disabled={isSubmitting}/>
                            </div>
                            <Button className="w-full" type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                                Upload for Verification
                            </Button>
                        </form>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>All Documents</CardTitle>
                        <CardDescription>Browse, verify, and manage all customer documents and signed contracts.</CardDescription>
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
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Document Type</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {documents.map((doc) => (
                                    <TableRow key={doc.id}>
                                        <TableCell className="font-medium">{doc.customer}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {(doc.type === 'Rental Agreement' || doc.type === 'Departure Checklist') && <FileText className="h-4 w-4 text-muted-foreground" />}
                                                <span>{doc.type}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{doc.date}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={getStatusVariant(doc.status)}
                                                className={getStatusClass(doc.status)}
                                            >
                                                {doc.status}
                                            </Badge>
                                        </TableCell>
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
                                                    {doc.content && (
                                                        <DropdownMenuItem className="gap-2" onClick={() => setViewingDocument(doc)}>
                                                            <Eye className="h-4 w-4" /> View Content
                                                        </DropdownMenuItem>
                                                    )}
                                                    {doc.fileUrl && (
                                                        <DropdownMenuItem className="gap-2" asChild>
                                                            <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                                                                <Download className="h-4 w-4" /> Download
                                                            </a>
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem className="gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={() => handleDelete(doc.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                        Delete
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
            </div>
             <Dialog open={!!viewingDocument} onOpenChange={(isOpen) => !isOpen && setViewingDocument(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Document Content: {viewingDocument?.fileName}</DialogTitle>
                        <DialogDescription>
                           Viewing content for document ID: {viewingDocument?.id}
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-96 w-full rounded-md border p-4">
                        <pre className="whitespace-pre-wrap text-sm">
                            {viewingDocument?.content ? getDisplayContent(viewingDocument.content) : 'No content available.'}
                        </pre>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div>
    );
}
