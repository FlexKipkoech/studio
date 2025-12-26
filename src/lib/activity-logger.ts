
import { collection, addDoc, serverTimestamp, Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

type LogActivityInput = {
  firestore: Firestore;
  auth: Auth;
  action: string;
  details: string;
};

/**
 * Logs a significant user activity to the 'activityLogs' collection in Firestore.
 * This is a fire-and-forget function that does not block execution.
 * @param {LogActivityInput} input - The input object for logging activity.
 */
export function logActivity({ firestore, auth, action, details }: LogActivityInput): void {
  const user = auth.currentUser;

  if (!user) {
    console.warn('logActivity was called but user is not authenticated.');
    return;
  }

  const logEntry = {
    userId: user.uid,
    userName: user.displayName || user.email || 'Unknown User',
    action: action,
    timestamp: serverTimestamp(),
    details: details,
  };

  const activityLogsCollection = collection(firestore, 'activityLogs');
  
  addDoc(activityLogsCollection, logEntry)
    .catch(error => {
       errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: activityLogsCollection.path,
          operation: 'create',
          requestResourceData: logEntry,
        })
      )
    });
}
