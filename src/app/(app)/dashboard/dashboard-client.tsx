
'use client';

import * as React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Car, User, DollarSign, Wrench, Loader2, FileSignature } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import type { Reservation, Contract } from '@/lib/types';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

const RevenueChart = dynamic(() => import('@/components/revenue-chart'), {
    ssr: false,
    loading: () => (
        <div className="h-[350px] w-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    ),
});

type Invoice = {
  id: string;
  customer: string;
  date: string;
  amount: string;
  status: 'Paid' | 'Pending' | 'Overdue' | 'Draft';
  createdBy: string;
  paymentMethod: 'Credit Card' | 'Bank Transfer' | 'Cash' | 'N/A';
};

export type ChartData = {
    month: string;
    revenue: number;
}

export type InitialData = {
   stats: {
        totalRevenue: number;
        activeRentals: number;
        availableVehicles: number;
        vehiclesInMaintenance: number;
    };
    recentReservations: Reservation[];
    recentInvoices: Invoice[];
    recentContracts: Contract[];
    chartData: ChartData[];
}

function StatCard({ title, value, icon: Icon, description }: { title: string, value: string, icon: React.ElementType, description: string }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    );
}

function RecentReservations({ reservations }: { reservations: Reservation[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Reservations</CardTitle>
                 <CardDescription>A quick look at the 5 most recent bookings.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Customer</TableHead>
                            <TableHead>Vehicle</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reservations.map(res => (
                            <TableRow key={res.id}>
                                <TableCell>
                                    <div className="font-medium">{res.customerName}</div>
                                    <div className="text-sm text-muted-foreground">{res.pickupDate}</div>
                                </TableCell>
                                <TableCell>{res.vehicle}</TableCell>
                                <TableCell>
                                     <Badge variant={
                                        res.status === 'Active' ? 'default' :
                                        res.status === 'Upcoming' ? 'secondary' :
                                        res.status === 'Completed' ? 'outline' :
                                        'destructive'
                                    } className={res.status === 'Active' ? 'bg-green-600' : ''}>
                                        {res.status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
            <CardFooter>
                <Button asChild size="sm" className="ml-auto gap-1">
                  <Link href="/reservations">
                    View All
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}

function RecentInvoices({ invoices }: { invoices: Invoice[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Invoices</CardTitle>
                <CardDescription>The last 5 invoices generated.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Customer</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                         {invoices.map(invoice => (
                            <TableRow key={invoice.id}>
                                <TableCell>
                                    <div className="font-medium">{invoice.customer}</div>
                                    <div className="text-sm text-muted-foreground">{invoice.date}</div>
                                </TableCell>
                                <TableCell className="text-right">{formatCurrency(parseFloat(invoice.amount))}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
             <CardFooter>
                <Button asChild size="sm" className="ml-auto gap-1">
                  <Link href="/invoices">
                    View All
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}

function RecentContracts({ contracts }: { contracts: Contract[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Contracts</CardTitle>
                <CardDescription>The last 5 contracts generated.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Customer</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                         {contracts.map(contract => (
                            <TableRow key={contract.id}>
                                <TableCell>
                                    <div className="font-medium">{contract.customerName}</div>
                                    <div className="text-sm text-muted-foreground">{new Date(contract.createdAt).toLocaleDateString()}</div>
                                </TableCell>
                                 <TableCell>
                                     <Badge variant={
                                        contract.status === 'signed' || contract.status === 'completed' ? 'default' :
                                        contract.status === 'pending' ? 'secondary' :
                                        'destructive'
                                    } className={contract.status === 'signed' || contract.status === 'completed' ? 'bg-green-600' : ''}>
                                        {contract.status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
             <CardFooter>
                <Button asChild size="sm" className="ml-auto gap-1">
                  <Link href="/contracts">
                    View All
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}

export default function DashboardClient({ initialData }: { initialData: InitialData }) {
    const { userProfile } = useAuth();
    
    const { stats, recentInvoices, recentReservations, chartData, recentContracts } = initialData;

    if (!stats) {
        return (
            <div className="flex items-center justify-center h-full">
                <p>Could not load dashboard data. Please try again later.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Welcome back, {userProfile?.name?.split(' ')[0] || 'Admin'}!</h1>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard 
                    title="Total Revenue" 
                    value={formatCurrency(stats.totalRevenue)}
                    icon={DollarSign}
                    description="+20.1% from last month"
                />
                 <StatCard 
                    title="Active Rentals" 
                    value={`+${stats.activeRentals}`}
                    icon={User}
                    description="Currently on the road"
                />
                 <StatCard 
                    title="Vehicles Available" 
                    value={`${stats.availableVehicles}`}
                    icon={Car}
                    description="Ready for new rentals"
                />
                 <StatCard 
                    title="In Maintenance" 
                    value={`${stats.vehiclesInMaintenance}`}
                    icon={Wrench}
                    description="Temporarily unavailable"
                />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                     <RevenueChart data={chartData}/>
                </Card>
                 <div className="lg:col-span-3 grid grid-cols-1 gap-6">
                    <RecentContracts contracts={recentContracts} />
                    <RecentInvoices invoices={recentInvoices} />
                </div>
            </div>
             <div className="grid gap-6 md:grid-cols-1">
                <RecentReservations reservations={recentReservations} />
            </div>
        </div>
    );
}
