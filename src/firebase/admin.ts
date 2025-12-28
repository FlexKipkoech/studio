import 'server-only';

import { getApps, initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

/**
 * Initializes firebase-admin using Application Default Credentials.
 *
 * On Firebase App Hosting / Cloud environments, ADC should be available.
 * For local development, you may need to provide credentials via GOOGLE_APPLICATION_CREDENTIALS.
 */
export function getAdminApp() {
  if (!getApps().length) {
    try {
      initializeApp({
        credential: applicationDefault(),
      });
    } catch (error) {
      console.error('Failed to initialize Firebase Admin:', error);
      throw new Error('Firebase Admin initialization failed. Ensure GOOGLE_APPLICATION_CREDENTIALS is set for local development.');
    }
  }

  return getApps()[0]!;
}

export function getAdminFirestore() {
  getAdminApp();
  return getFirestore();
}

export function getAdminStorage() {
  getAdminApp();
  return getStorage();
}
