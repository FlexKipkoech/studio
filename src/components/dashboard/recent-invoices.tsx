'use client';
import { ArrowUpRight } from 'lucide-react';
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
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import type { Invoice } from '@/app/dashboard/invoices/page';

export function RecentInvoices() {
  const { user } = useUser();
  const firestore = useFirestore();

  const recentInvoicesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'invoices'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
  }, [firestore, user]);

  const { data: recentInvoices, isLoading } = useCollection<Invoice>(recentInvoicesQuery);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center">
        <div className="grid gap-2">
          <CardTitle>Recent Invoices</CardTitle>
          <CardDescription>A list of the most recent invoices.</CardDescription>
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
              <TableHead>Vendor</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  Loading recent invoices...
                </TableCell>
              </TableRow>
            )}
            {!isLoading && recentInvoices?.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>
                  <div className="font-medium">{invoice.vendorName}</div>
                  <div className="hidden text-sm text-muted-foreground md:inline">
                    Invoice #{invoice.invoiceNumber}
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge
                    className={cn(
                      'text-xs capitalize',
                      invoice.status === 'paid' &&
                        'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
                      invoice.status === 'pending' &&
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
                      invoice.status === 'overdue' &&
                        'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                    )}
                    variant="outline"
                  >
                    {invoice.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  ${invoice.amountDue?.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
             {!isLoading && recentInvoices?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    No recent invoices found.
                  </TableCell>
                </TableRow>
              )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
