'use client';

import { useRef, useState, useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

/**
 * An invisible component that listens for globally emitted 'permission-error' events.
 * It throws any received error to be caught by Next.js's global-error.tsx.
 */
export function FirebaseErrorListener() {
  // Use the specific error type for the state for type safety.
  const [error, setError] = useState<FirestorePermissionError | null>(null);
  const shouldThrow =
    process.env.NEXT_PUBLIC_THROW_FIREBASE_PERMISSION_ERRORS === 'true';
  const { toast } = useToast();
  const lastMessageRef = useRef<string | null>(null);

  useEffect(() => {
    // The callback now expects a strongly-typed error, matching the event payload.
    const handleError = (error: FirestorePermissionError) => {
      if (shouldThrow) {
        // Set error in state to trigger a re-render and throw.
        setError(error);
        return;
      }

      // Default behavior: don't crash the whole app.
      // Log the structured error so it's still debuggable.
      // eslint-disable-next-line no-console
      console.error(error);

      const message = String(error?.message || error);
      if (lastMessageRef.current === message) {
        return;
      }
      lastMessageRef.current = message;

      toast({
        variant: 'destructive',
        title: 'Permission denied',
        description: message,
      });
    };

    // The typed emitter will enforce that the callback for 'permission-error'
    // matches the expected payload type (FirestorePermissionError).
    errorEmitter.on('permission-error', handleError);

    // Unsubscribe on unmount to prevent memory leaks.
    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  // On re-render, if an error exists in state, throw it.
  if (shouldThrow && error) {
    throw error;
  }

  // This component renders nothing.
  return null;
}
