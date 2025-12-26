import { Badge } from '@/components/ui/badge';
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
import { reminders } from '@/lib/data';
import { cn } from '@/lib/utils';

export default function RemindersPage() {
  return (
    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Reminder History</CardTitle>
          <CardDescription>
            A log of all automated reminders sent for overdue invoices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Date Sent</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reminders.map((reminder) => (
                <TableRow key={reminder.id}>
                  <TableCell className="font-medium">
                    {reminder.invoiceNumber}
                  </TableCell>
                  <TableCell>{reminder.clientName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{reminder.method}</Badge>
                  </TableCell>
                  <TableCell>{reminder.sentDate}</TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={reminder.status === 'Sent' ? 'default' : 'destructive'}
                      className={cn(
                        reminder.status === 'Sent' && 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-200 dark:border-green-800',
                        reminder.status === 'Failed' && 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 border-red-200 dark:border-red-800'
                      )}
                    >
                      {reminder.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
