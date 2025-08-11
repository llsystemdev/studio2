
'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { ChartData } from '@/app/(app)/dashboard/dashboard-client';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--primary))",
  },
};

export default function RevenueChart({ data }: { data: ChartData[] }) {
    return (
        <>
            <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>Monthly revenue for the last 7 months.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                    <BarChart accessibilityLayer data={data}>
                         <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="month"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={10}
                            minTickGap={32}
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickFormatter={(value) => `$${Number(value) / 1000}k`}
                        />
                        <ChartTooltip 
                            cursor={{fill: 'hsl(var(--accent))', radius: 4}} 
                            content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)} />}
                        />
                        <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </>
    )
}
