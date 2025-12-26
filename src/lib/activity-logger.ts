
import { collection, addDoc, serverTimestamp, Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';

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
    console.error('logActivity failed: User is not authenticated.');
    return;
  }

  const logEntry = {
    userId: user.uid,
    userName: user.displayName || user.email || 'Unknown User',
    action: action,
    timestamp: serverTimestamp(), // Use server timestamp for accuracy
    details: details,
  };

  const activityLogsCollection = collection(firestore, 'activityLogs');
  
  // Fire-and-forget: Add the document but don't wait for it to complete.
  // Errors are logged to the console if they occur.
  addDoc(activityLogsCollection, logEntry)
    .catch(error => {
      console.error('Failed to write activity log:', error);
    });
}
