'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="font-body antialiased">
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                The app hit an unexpected error. If this happened right after a save, it may be a Firebase
                Security Rules permission issue.
              </p>
              <pre className="max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs">
                {String(error?.message || error)}
              </pre>
              <div className="flex gap-2">
                <Button onClick={() => reset()}>Try again</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  );
}
