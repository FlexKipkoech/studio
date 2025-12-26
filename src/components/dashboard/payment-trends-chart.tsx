'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';

const chartData = [
  { month: 'January', paid: 1860, overdue: 800 },
  { month: 'February', paid: 3050, overdue: 2000 },
  { month: 'March', paid: 2370, overdue: 1200 },
  { month: 'April', paid: 2780, overdue: 1900 },
  { month: 'May', paid: 1890, overdue: 1000 },
  { month: 'June', paid: 2390, overdue: 1500 },
];

const chartConfig = {
  paid: {
    label: 'Paid',
    color: 'hsl(var(--chart-1))',
  },
  overdue: {
    label: 'Overdue',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

export function PaymentTrendsChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Trends</CardTitle>
        <CardDescription>Paid vs. Overdue - Last 6 Months</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={chartData} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis
              tickFormatter={(value) => `$${Number(value) / 1000}k`}
              tickLine={false}
              axisLine={false}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="paid" fill="var(--color-paid)" radius={4} />
            <Bar dataKey="overdue" fill="var(--color-overdue)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
