import { Button } from '@/components/ui/button';
import {
  File,
  PlusCircle,
} from 'lucide-react';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { PaymentTrendsChart } from '@/components/dashboard/payment-trends-chart';
import { RecentInvoices } from '@/components/dashboard/recent-invoices';

export default function DashboardPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 bg-muted/40">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
            <Button size="sm" variant="outline" className="h-8 gap-1">
              <File className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Export Report
              </span>
            </Button>
            <Button size="sm" className="h-8 gap-1">
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                New Invoice
              </span>
            </Button>
        </div>
      </div>
      <StatsCards />
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
        <PaymentTrendsChart />
        <RecentInvoices />
      </div>
    </main>
  );
}
