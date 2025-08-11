
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import type { Vehicle, Invoice, Expense } from '@/lib/types';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { cn } from '@/lib/utils';

const StatCard = ({ title, value, icon: Icon, colorClass }: { title: string, value: string, icon: React.ElementType, colorClass?: string }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className={cn("h-4 w-4 text-muted-foreground", colorClass)} />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(value);
};

export default function VehicleProfitabilityReport() {
    const { db } = useAuth();
    const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
    const [selectedVehicleId, setSelectedVehicleId] = React.useState<string>('');
    const [loading, setLoading] = React.useState(true);
    const [reportData, setReportData] = React.useState<{
        totalRevenue: number;
        totalExpenses: number;
        netProfit: number;
        invoices: Invoice[];
        expenses: Expense[];
    } | null>(null);
    const [isCalculating, setIsCalculating] = React.useState(false);

    React.useEffect(() => {
        const fetchVehicles = async () => {
            if (!db) return;
            try {
                const vehiclesSnapshot = await getDocs(collection(db, 'vehicles'));
                const vehiclesData = vehiclesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
                setVehicles(vehiclesData);
            } catch (error) {
                console.error("Error fetching vehicles:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchVehicles();
    }, [db]);

    const handleGenerateReport = async () => {
        if (!selectedVehicleId || !db) return;
        setIsCalculating(true);
        setReportData(null);

        try {
            const reservationsQuery = query(collection(db, 'reservations'), where('vehicleId', '==', selectedVehicleId));
            const reservationsSnapshot = await getDocs(reservationsQuery);
            const reservationIds = reservationsSnapshot.docs.map(doc => doc.id);

            let totalRevenue = 0;
            let fetchedInvoices: Invoice[] = [];

            if (reservationIds.length > 0) {
                const invoicesQuery = query(collection(db, 'invoices'), where('reservationId', 'in', reservationIds));
                const invoicesSnapshot = await getDocs(invoicesQuery);
                fetchedInvoices = invoicesSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()} as Invoice));
                totalRevenue = fetchedInvoices.reduce((acc, inv) => acc + parseFloat(inv.amount), 0);
            }

            const expensesQuery = query(collection(db, 'expenses'), where('vehicleId', '==', selectedVehicleId));
            const expensesSnapshot = await getDocs(expensesQuery);
            const fetchedExpenses = expensesSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()} as Expense));
            const totalExpenses = fetchedExpenses.reduce((acc, exp) => acc + parseFloat(exp.amount), 0);
            
            setReportData({
                totalRevenue,
                totalExpenses,
                netProfit: totalRevenue - totalExpenses,
                invoices: fetchedInvoices,
                expenses: fetchedExpenses
            });

        } catch (error) {
            console.error("Error generating report:", error);
        } finally {
            setIsCalculating(false);
        }
    };
    
    return (
         <div className="space-y-6 mt-6">
            <Card className="non-printable">
                <CardContent className="space-y-4 pt-6">
                    <div className="flex items-end gap-4">
                        <div className="flex-grow">
                            <label htmlFor="vehicle-select" className="text-sm font-medium">Select a Vehicle</label>
                            <Select onValueChange={setSelectedVehicleId} value={selectedVehicleId}>
                                <SelectTrigger id="vehicle-select" disabled={loading}>
                                    <SelectValue placeholder={loading ? "Loading vehicles..." : "Choose a vehicle"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {vehicles.map(v => (
                                        <SelectItem key={v.id} value={v.id}>
                                            {v.make} {v.model} ({v.plate})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={handleGenerateReport} disabled={!selectedVehicleId || isCalculating}>
                            {isCalculating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Generate Report
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {isCalculating && (
                 <div className="flex justify-center items-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                 </div>
            )}
            
            {reportData && (
                <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-3">
                         <StatCard title="Total Revenue" value={formatCurrency(reportData.totalRevenue)} icon={TrendingUp} colorClass="text-green-500"/>
                         <StatCard title="Total Expenses" value={formatCurrency(reportData.totalExpenses)} icon={TrendingDown} colorClass="text-red-500"/>
                         <StatCard title="Net Profit" value={formatCurrency(reportData.netProfit)} icon={DollarSign} colorClass={reportData.netProfit >= 0 ? "text-green-500" : "text-red-500"}/>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader><CardTitle>Revenue Breakdown (Invoices)</CardTitle></CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Customer</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {reportData.invoices.length > 0 ? reportData.invoices.map(inv => (
                                            <TableRow key={inv.id}><TableCell>{inv.date}</TableCell><TableCell>{inv.customer}</TableCell><TableCell className="text-right">{formatCurrency(parseFloat(inv.amount))}</TableCell></TableRow>
                                        )) : <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No invoices found for this vehicle.</TableCell></TableRow>}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Expense Breakdown</CardTitle></CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {reportData.expenses.length > 0 ? reportData.expenses.map(exp => (
                                            <TableRow key={exp.id}><TableCell>{exp.date}</TableCell><TableCell>{exp.description}</TableCell><TableCell className="text-right">{formatCurrency(parseFloat(exp.amount))}</TableCell></TableRow>
                                        )) : <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No expenses found for this vehicle.</TableCell></TableRow>}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    )
}
