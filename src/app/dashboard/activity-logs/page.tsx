
'use client';

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
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { format } from 'date-fns';

type ActivityLog = {
  id: string;
  userName: string;
  action: string;
  timestamp: {
    seconds: number;
    nanoseconds: number;
  } | null;
  details: string;
};

export default function ActivityLogsPage() {
  const firestore = useFirestore();

  const activityLogsQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, 'activityLogs'), orderBy('timestamp', 'desc'))
        : null,
    [firestore]
  );

  const { data: activityLogs, isLoading } = useCollection<ActivityLog>(activityLogsQuery);

  const formatTimestamp = (timestamp: ActivityLog['timestamp']) => {
    if (timestamp && timestamp.seconds) {
      return format(new Date(timestamp.seconds * 1000), 'yyyy-MM-dd HH:mm:ss');
    }
    return 'Pending...';
  };

  return (
    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Activity Audit Logs</CardTitle>
          <CardDescription>
            A log of all significant activities performed in the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Loading activity logs...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && activityLogs?.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">
                    {log.userName}
                  </TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell>{formatTimestamp(log.timestamp)}</TableCell>
                  <TableCell>{log.details}</TableCell>
                </TableRow>
              ))}
               {!isLoading && activityLogs?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No activity logs found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
