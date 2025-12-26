import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DollarSign, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { invoices } from '@/lib/data';

export function StatsCards() {
  const totalOutstanding = invoices
    .filter((inv) => inv.status === 'Due' || inv.status === 'Overdue')
    .reduce((acc, inv) => acc + inv.amount, 0);

  const totalOverdue = invoices
    .filter((inv) => inv.status === 'Overdue')
    .reduce((acc, inv) => acc + inv.amount, 0);

  const dueSoonCount = invoices.filter(
    (inv) => inv.status === 'Due'
  ).length;

  const paidThisMonth = invoices
    .filter(
      (inv) =>
        inv.status === 'Paid'
    )
    .reduce((acc, inv) => acc + inv.amount, 0);


  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Outstanding
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${totalOutstanding.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">+2.1% from last month</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overdue Amount</CardTitle>
          <AlertTriangle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">
            ${totalOverdue.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Total from overdue invoices
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Invoices Due</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+{dueSoonCount}</div>
          <p className="text-xs text-muted-foreground">
            Invoices approaching due date
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Paid (Month)</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${paidThisMonth.toLocaleString()}
          </div>
           <p className="text-xs text-muted-foreground">
            +12% since last month
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
