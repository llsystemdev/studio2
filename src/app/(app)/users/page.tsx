
'use client';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, MoreHorizontal, Trash2, KeyRound, Search, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import type { UserProfile, UserRole } from '@/lib/types';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


type NewUser = Omit<UserProfile, 'id' | 'photoURL'>;

const emptyUser: NewUser = {
    name: '',
    email: '',
    role: 'Secretary',
}

export default function UsersPage() {
    const [users, setUsers] = React.useState<UserProfile[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [open, setOpen] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [editingUser, setEditingUser] = React.useState<UserProfile | null>(null);
    const [userData, setUserData] = React.useState<NewUser>(emptyUser);
    const { toast } = useToast();
    const { user: currentUser, role: currentUserRole, sendPasswordReset, db, logActivity } = useAuth();
    const [searchTerm, setSearchTerm] = React.useState('');

    React.useEffect(() => {
        if (!db) return;
        const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile))
                .filter(user => user.name && user.email);
            setUsers(usersData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching users: ", error);
            setLoading(false);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch user data.' });
        });
        return () => unsubscribe();
    }, [db, toast]);

    const isCurrentUserAdmin = currentUserRole === 'Admin';
    const isEditing = editingUser !== null;

    const handleOpenDialog = (user: UserProfile | null = null) => {
        if (user) {
            setEditingUser(user);
            setUserData(user);
        } else {
            setEditingUser(null);
            setUserData(emptyUser);
        }
        setOpen(true);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setUserData(prev => ({ ...prev, [id]: value }));
    }

    const handleSelectChange = (value: UserRole) => {
        setUserData(prev => ({ ...prev, role: value }));
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!db) return;
        setIsSubmitting(true);
        
        if (!isCurrentUserAdmin) {
            toast({ variant: "destructive", title: "Permission Denied", description: "You do not have permission to perform this action." });
            setIsSubmitting(false);
            return;
        }

        if (isEditing && editingUser) {
            const userRef = doc(db, 'users', editingUser.id);
            await updateDoc(userRef, {
                name: userData.name,
                email: userData.email,
                role: userData.role,
            });
            await logActivity('Update', 'User', editingUser.id, `Updated user profile for ${userData.name}`);
            toast({ title: "User Updated", description: `Details for ${userData.name} have been updated.` });
        } else {
            // New user creation is now handled by a secure API route
            try {
                const response = await fetch('/api/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: userData.email,
                        displayName: userData.name,
                        role: userData.role
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to create user.');
                }
                const { uid } = await response.json();
                await logActivity('Create', 'User', uid, `Created new user: ${userData.name}`);
                toast({ title: "User Created", description: `An invitation will be sent to ${userData.email}.` });
            } catch (error: any) {
                console.error("Error creating user:", error);
                toast({ variant: 'destructive', title: 'Creation Failed', description: error.message });
            }
        }
        setIsSubmitting(false);
        setOpen(false);
    }
    
    const handleDelete = async (userId: string) => {
        if (!isCurrentUserAdmin) {
            toast({ variant: "destructive", title: "Permission Denied" });
            return;
        }
        if (userId === currentUser?.uid) {
             toast({ variant: "destructive", title: "Action Forbidden", description: "You cannot delete your own account." });
             return;
        }
        if (!db) return;
        const userToDelete = users.find(u => u.id === userId);
        
        // This is a simulation for now. A real implementation requires a Cloud Function.
        console.log(`Simulating deletion of user ${userToDelete?.name}...`);
        // In a real app, you'd call a Cloud Function here to delete the Auth user and the Firestore doc.
        // For example: await deleteUserFunction({ userId });
        await deleteDoc(doc(db, "users", userId));
        await logActivity('Delete', 'User', userId, `Deleted user ${userToDelete?.name}`);
        
        toast({ title: "User Deleted (Firestore Only)", description: `The user ${userToDelete?.name} has been deleted from Firestore. Auth record still exists.` });
    }

    const handleResetPassword = async (user: UserProfile) => {
        if (!isCurrentUserAdmin) {
            toast({ variant: "destructive", title: "Permission Denied" });
            return;
        }
        if (!user?.email) {
            toast({ variant: "destructive", title: "Error", description: "User email is not available." });
            return;
        }
        try {
            await sendPasswordReset(user.email);
            toast({
                title: "Password Reset Sent",
                description: `A link to reset your password has been sent to ${user.email}.`
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message,
            });
        }
    }
    
    const filteredUsers = users.filter(user => {
        const lowercasedTerm = searchTerm.toLowerCase();
        const nameMatch = user.name ? user.name.toLowerCase().includes(lowercasedTerm) : false;
        const emailMatch = user.email ? user.email.toLowerCase().includes(lowercasedTerm) : false;
        return nameMatch || emailMatch;
    });

    React.useEffect(() => {
        if (!open) {
            setEditingUser(null);
            setUserData(emptyUser);
            setIsSubmitting(false);
        }
    }, [open]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold font-headline">User Management</h1>
                <Button onClick={() => handleOpenDialog()} disabled={!isCurrentUserAdmin}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add User
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>User List</CardTitle>
                    <CardDescription>
                        Manage employee accounts and roles. Data is live from Firestore.
                    </CardDescription>
                    <div className="relative pt-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search by name or email..." 
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
                                <TableHead>Role</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.name || 'N/A'}</TableCell>
                                    <TableCell>{user.email || 'N/A'}</TableCell>
                                    <TableCell>
                                        <Badge variant={user.role === 'Admin' ? 'destructive' : 'secondary'}>
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                         <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button aria-haspopup="true" size="icon" variant="ghost" disabled={!isCurrentUserAdmin}>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Toggle menu</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleOpenDialog(user)}>Edit Details</DropdownMenuItem>
                                                 <DropdownMenuItem onClick={() => handleResetPassword(user)}>
                                                    <KeyRound className="mr-2 h-4 w-4" />
                                                    Reset Password
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <DropdownMenuItem 
                                                            className="gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive" 
                                                            onSelect={(e) => e.preventDefault()}
                                                            disabled={user.id === currentUser?.uid}>
                                                          <Trash2 className="h-4 w-4" />
                                                          Delete User
                                                        </DropdownMenuItem>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                         <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action cannot be undone. This will permanently delete the user account for <span className='font-bold'>{user.name}</span>.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(user.id)} className="bg-destructive hover:bg-destructive/90">Yes, delete user</AlertDialogAction>
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
                <DialogContent className="sm:max-w-[425px]">
                     <DialogHeader>
                        <DialogTitle>{isEditing ? 'Edit User' : 'Add New User'}</DialogTitle>
                        <DialogDescription>
                            {isEditing ? 'Update the details for this user.' : 'Fill in the details to add a new user.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">Full Name</Label>
                                <Input id="name" name="name" value={userData.name} onChange={handleInputChange} className="col-span-3" required disabled={isSubmitting} autoComplete="name"/>
                            </div>
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="email" className="text-right">Email</Label>
                                <Input id="email" name="email" type="email" value={userData.email} onChange={handleInputChange} className="col-span-3" required disabled={isSubmitting || isEditing} autoComplete="email"/>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="role" className="text-right">Role</Label>
                                 <Select onValueChange={(value: UserRole) => handleSelectChange(value)} value={userData.role} required disabled={isSubmitting}>
                                    <SelectTrigger id="role" className="col-span-3">
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Admin">Admin</SelectItem>
                                        <SelectItem value="Supervisor">Supervisor</SelectItem>
                                        <SelectItem value="Secretary">Secretary</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary" disabled={isSubmitting}>Cancel</Button>
                            </DialogClose>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                {isEditing ? 'Save Changes' : 'Add User'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
