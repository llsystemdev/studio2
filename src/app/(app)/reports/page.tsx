
'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from 'lucide-react';

// Dynamically import the report components to split the code and reduce initial bundle size.
const FinancialSummaryReport = dynamic(() => import('@/components/financial-summary-report'), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>,
});

const VehicleProfitabilityReport = dynamic(() => import('@/components/vehicle-profitability-report'), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>,
});


export default function ReportsPage() {
    // This state will be used to ensure the printable area is rendered for printing
    // without being tied to the active tab. We default to financial for printing.
    const [reportToPrint, setReportToPrint] = React.useState('summary');

    return (
        <div className="space-y-6">
             <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .printable-area, .printable-area * {
                        visibility: visible;
                    }
                    .printable-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    .non-printable {
                        display: none;
                    }
                }
            `}</style>

            <div className="non-printable">
                <h1 className="text-3xl font-bold font-headline">Reports</h1>
            </div>
            
            <Tabs defaultValue="summary" className="w-full non-printable" onValueChange={setReportToPrint}>
                <TabsList>
                    <TabsTrigger value="summary">Financial Summary</TabsTrigger>
                    <TabsTrigger value="profitability">Vehicle Profitability</TabsTrigger>
                </TabsList>
                <TabsContent value="summary">
                    <Card><CardHeader><CardTitle>Financial Summary</CardTitle><CardDescription>Select a period to see a summary of revenue, expenses, and profitability.</CardDescription></CardHeader></Card>
                    <FinancialSummaryReport />
                </TabsContent>
                <TabsContent value="profitability">
                     <Card><CardHeader><CardTitle>Vehicle Profitability Analysis</CardTitle><CardDescription>Analyze the financial performance of individual vehicles in your fleet.</CardDescription></CardHeader></Card>
                    <VehicleProfitabilityReport />
                </TabsContent>
            </Tabs>
            
            {/* This div is only for printing, it renders the selected report component */}
            <div className="hidden print:block">
                 {reportToPrint === 'summary' && <FinancialSummaryReport />}
                 {reportToPrint === 'profitability' && <VehicleProfitabilityReport />}
            </div>

        </div>
    );
}
