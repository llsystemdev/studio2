
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2, User, Car, FileText, CreditCard, Fuel, Wrench, KeyRound, LogOut, FileSignature } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import type { ActivityLog } from '@/lib/types';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const iconMap: { [key: string]: React.ElementType } = {
    Reservation: FileSignature,
    Vehicle: Car,
    User: User,
    Invoice: CreditCard,
    Expense: Fuel,
    Contract: FileText,
    Maintenance: Wrench,
    Auth: KeyRound,
    Customer: User,
};

const actionColorMap: { [key: string]: string } = {
    Create: 'bg-green-600 hover:bg-green-700',
    Update: 'bg-blue-600 hover:bg-blue-700',
    Delete: 'bg-red-600 hover:bg-red-700',
    Cancel: 'bg-yellow-500 hover:bg-yellow-600',
    Login: 'bg-sky-600 hover:bg-sky-700',
    Logout: 'bg-gray-500 hover:bg-gray-600',
};


export default function LogsPage() {
    const { db } = useAuth();
    const [logs, setLogs] = React.useState<ActivityLog[]>([]);
    const [loading, setLoading] = React.useState(true);
    
    const fetchLogs = React.useCallback(() => {
        if (!db) return;
        setLoading(true);
        const q = query(collection(db, 'activityLogs'), orderBy('timestamp', 'desc'), limit(50));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const logsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLog));
            setLogs(logsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching activity logs:", error);
            setLoading(false);
        });

        return unsubscribe;
    }, [db]);

    React.useEffect(() => {
        const unsubscribe = fetchLogs();
        return () => unsubscribe && unsubscribe();
    }, [fetchLogs]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Activity Log</h1>
                    <p className="text-muted-foreground">A stream of recent activities within the system.</p>
                </div>
                 <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Recent Events</CardTitle>
                    <CardDescription>Displaying the last 50 events recorded.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                         <div className="flex justify-center items-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                         </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                            <p>No activity logs found.</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {logs.map(log => {
                                const Icon = iconMap[log.entityType] || FileText;
                                return (
                                <div key={log.id} className="relative flex items-start gap-4">
                                     <div className="absolute left-0 top-0 flex h-full w-6 justify-center">
                                        <div className="w-px bg-border"></div>
                                    </div>
                                    <div className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-background ring-2 ring-primary">
                                       <Icon className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium">
                                                <span className="font-bold">{log.user}</span> {log.details}
                                            </p>
                                            <time className="flex-shrink-0 text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true, locale: es })}
                                            </time>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="default" className={actionColorMap[log.action]}>{log.action}</Badge>
                                            <Badge variant="secondary">{log.entityType}: {log.entityId}</Badge>
                                        </div>
                                    </div>
                                </div>
                            )})}
                        </div>
                    )}
                </CardContent>
            </Card>

        </div>
    )
}
