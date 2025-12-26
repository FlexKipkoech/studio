import {
  ArrowUpRight,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Link from 'next/link';
import { invoices } from '@/lib/data';
import { cn } from '@/lib/utils';

export function RecentInvoices() {
    const recentInvoices = invoices.slice(0, 5);
  return (
    <Card>
      <CardHeader className="flex flex-row items-center">
        <div className="grid gap-2">
          <CardTitle>Recent Invoices</CardTitle>
          <CardDescription>
            A list of the most recent invoices.
          </CardDescription>
        </div>
        <Button asChild size="sm" className="ml-auto gap-1">
          <Link href="/dashboard/invoices">
            View All
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentInvoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>
                  <div className="font-medium">{invoice.clientName}</div>
                  <div className="hidden text-sm text-muted-foreground md:inline">
                    {invoice.clientEmail}
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge
                    className={cn(
                      'text-xs',
                      invoice.status === 'Paid' && 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
                      invoice.status === 'Due' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
                      invoice.status === 'Overdue' && 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
                    )}
                    variant="outline"
                  >
                    {invoice.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  ${invoice.amount.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
