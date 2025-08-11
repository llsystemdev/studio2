
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, TrendingDown, Loader2, Printer, Calendar as CalendarIcon } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import type { Invoice, Expense } from '@/lib/types';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { DateRange } from "react-day-picker";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

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

const chartConfig = {
    Ingresos: {
      label: "Ingresos",
      color: "hsl(var(--chart-1))",
    },
    Gastos: {
      label: "Gastos",
      color: "hsl(var(--chart-2))",
    },
};

export default function FinancialSummaryReport() {
    const { db } = useAuth();
    const [date, setDate] = React.useState<DateRange | undefined>(undefined);
    const [reportData, setReportData] = React.useState<{
        totalRevenue: number;
        totalExpenses: number;
        netProfit: number;
        invoices: Invoice[];
        expenses: Expense[];
        chartData: { name: string; Ingresos: number; Gastos: number }[];
    } | null>(null);
    const [isCalculating, setIsCalculating] = React.useState(true);
    
    React.useEffect(() => {
        if (!db) return;
        
        const findLastActivityMonth = async () => {
             const lastInvoiceQuery = query(collection(db, "invoices"), orderBy("date", "desc"), limit(1));
             const snapshot = await getDocs(lastInvoiceQuery);
             let lastActivityDate = new Date();

             if (!snapshot.empty) {
                 lastActivityDate = new Date(snapshot.docs[0].data().date);
             }
             
             setDate({
                 from: startOfMonth(lastActivityDate),
                 to: endOfMonth(lastActivityDate)
             });
        };
        findLastActivityMonth();
    }, [db]);

    const handleGenerateReport = React.useCallback(async (range: DateRange | undefined) => {
        if (!range?.from || !range?.to || !db) return;
        setIsCalculating(true);
        setReportData(null);

        const fromDateStr = format(range.from, 'yyyy-MM-dd');
        const toDateStr = format(range.to, 'yyyy-MM-dd');

        try {
            const invoicesQuery = query(collection(db, 'invoices'), where('date', '>=', fromDateStr), where('date', '<=', toDateStr));
            const expensesQuery = query(collection(db, 'expenses'), where('date', '>=', fromDateStr), where('date', '<=', toDateStr));

            const [invoicesSnapshot, expensesSnapshot] = await Promise.all([
                getDocs(invoicesQuery),
                getDocs(expensesQuery)
            ]);

            const fetchedInvoices = invoicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
            const fetchedExpenses = expensesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));

            const totalRevenue = fetchedInvoices.reduce((acc, inv) => acc + parseFloat(inv.amount), 0);
            const totalExpenses = fetchedExpenses.reduce((acc, exp) => acc + parseFloat(exp.amount), 0);

            const chartData = [{ name: 'Summary', Ingresos: totalRevenue, Gastos: totalExpenses }];
            
            setReportData({
                totalRevenue,
                totalExpenses,
                netProfit: totalRevenue - totalExpenses,
                invoices: fetchedInvoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
                expenses: fetchedExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
                chartData
            });

        } catch (error) {
            console.error("Error generating report:", error);
        } finally {
            setIsCalculating(false);
        }
    }, [db]);
    
    React.useEffect(() => {
        if (date) {
            handleGenerateReport(date);
        }
    }, [date, handleGenerateReport]);

    return (
        <div className="space-y-6 mt-6">
            <Card className="non-printable">
                <CardContent className="flex items-center justify-between pt-6">
                     <div className="flex items-center gap-2">
                        <Select onValueChange={(value) => {
                            const now = new Date();
                            if(value === "this_month") setDate({from: startOfMonth(now), to: endOfMonth(now)})
                            else if (value === "last_month") {
                                const lastMonth = subMonths(now, 1);
                                setDate({from: startOfMonth(lastMonth), to: endOfMonth(lastMonth)})
                            }
                        }}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Quick Ranges" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="this_month">This Month</SelectItem>
                            <SelectItem value="last_month">Last Month</SelectItem>
                        </SelectContent>
                        </Select>

                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                id="date"
                                variant={"outline"}
                                className={cn(
                                    "w-[300px] justify-start text-left font-normal",
                                    !date && "text-muted-foreground"
                                )}
                                >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date?.from ? (
                                    date.to ? (
                                    <>
                                        {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                                    </>
                                    ) : (
                                    format(date.from, "LLL dd, y")
                                    )
                                ) : (
                                    <span>Pick a date</span>
                                )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={date?.from}
                                    selected={date}
                                    onSelect={setDate}
                                    numberOfMonths={2}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                     <Button variant="outline" onClick={() => window.print()} disabled={!reportData}>
                        <Printer className="mr-2 h-4 w-4" /> Print
                    </Button>
                </CardContent>
            </Card>

            {isCalculating && (
                 <div className="flex justify-center items-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                 </div>
            )}

            {reportData && (
                 <div className="printable-area space-y-6">
                     <div className="grid gap-4 md:grid-cols-3">
                         <StatCard title="Total Revenue" value={formatCurrency(reportData.totalRevenue)} icon={TrendingUp} colorClass="text-green-500"/>
                         <StatCard title="Total Expenses" value={formatCurrency(reportData.totalExpenses)} icon={TrendingDown} colorClass="text-red-500"/>
                         <StatCard title="Net Profit" value={formatCurrency(reportData.netProfit)} icon={DollarSign} colorClass={reportData.netProfit >= 0 ? "text-green-500" : "text-red-500"}/>
                    </div>
                    
                    <Card>
                        <CardHeader>
                            <CardTitle>Revenue vs. Expenses Chart</CardTitle>
                        </CardHeader>
                        <CardContent className="h-64">
                             <ChartContainer config={chartConfig} className="w-full h-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={reportData.chartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                        <YAxis tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => formatCurrency(value as number)} />
                                        <ChartTooltip
                                            cursor={{ fill: 'hsl(var(--accent))' }}
                                            content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)} />}
                                        />
                                        <Legend />
                                        <Bar dataKey="Ingresos" fill="hsl(var(--chart-1))" radius={4} />
                                        <Bar dataKey="Gastos" fill="hsl(var(--chart-2))" radius={4} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        </CardContent>
                    </Card>

                    <div className="grid md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader><CardTitle>Revenue Breakdown</CardTitle></CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Customer</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {reportData.invoices.length > 0 ? reportData.invoices.map(inv => (
                                            <TableRow key={inv.id}><TableCell>{inv.date}</TableCell><TableCell>{inv.customer}</TableCell><TableCell className="text-right">{formatCurrency(parseFloat(inv.amount))}</TableCell></TableRow>
                                        )) : <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No revenue found in this period.</TableCell></TableRow>}
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
                                        )) : <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No expenses found in this period.</TableCell></TableRow>}
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
