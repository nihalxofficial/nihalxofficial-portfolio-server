import admin from "firebase-admin";
import { env } from "./env";

let app: admin.app.App | null = null;

/**
 * Firebase Admin is initialised lazily: the public site must keep working even
 * when admin credentials have not been provisioned yet.
 */
export function isFirebaseConfigured(): boolean {
  return Boolean(
    env.GOOGLE_APPLICATION_CREDENTIALS ||
      (env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.firebasePrivateKey),
  );
}

export function getFirebaseApp(): admin.app.App {
  if (!isFirebaseConfigured()) {
    throw new Error(
      "Firebase Admin is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY.",
    );
  }

  if (!app) {
    app = admin.apps.length
      ? admin.app()
      : admin.initializeApp({
          credential: env.GOOGLE_APPLICATION_CREDENTIALS
            ? admin.credential.applicationDefault()
            : admin.credential.cert({
                projectId: env.FIREBASE_PROJECT_ID,
                clientEmail: env.FIREBASE_CLIENT_EMAIL,
                privateKey: env.firebasePrivateKey,
              }),
        });
  }

  return app;
}

export async function verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
  return getFirebaseApp().auth().verifyIdToken(idToken, true);
}
