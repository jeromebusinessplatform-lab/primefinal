import { signInWithCustomToken, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase.ts";

let firebaseAuthPromise: Promise<void> | null = null;

export function ensureFirebaseSession(): Promise<void> {
  if (!firebaseAuthPromise) {
    firebaseAuthPromise = fetch("/api/auth/firebase-token", { credentials: "same-origin" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Authenticated Firebase session is unavailable");
        const data = await response.json() as { token?: string };
        if (!data.token) throw new Error("Firebase token was not returned");
        await signInWithCustomToken(auth, data.token);
      })
      .catch((error) => {
        firebaseAuthPromise = null;
        throw error;
      });
  }
  return firebaseAuthPromise;
}

export async function clearFirebaseSession(): Promise<void> {
  firebaseAuthPromise = null;
  await signOut(auth);
}
