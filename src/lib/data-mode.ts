/**
 * Data Mode Configuration for Opalite.
 *
 * Separates frontend-only / local mock operation from live backend integrations:
 * - "mock": All project, client, review, canvas, and auth operations run safely in
 *   browser memory and localStorage without requiring external Firebase or database credentials.
 * - "firebase": Live Firebase Auth, Firestore persistence, and Cloud Storage are active.
 */

const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "";

/**
 * Returns true if real Firebase production credentials are provided in the environment.
 * If unset or left as the local demo key, the app runs in local mock mode.
 */
export const isFirebaseConfigured: boolean = Boolean(
  firebaseApiKey.trim().length > 0 &&
  !firebaseApiKey.includes("DemoKey") &&
  !firebaseApiKey.includes("your_firebase_api_key")
);

export type DataMode = "mock" | "firebase";

export const currentDataMode: DataMode = isFirebaseConfigured ? "firebase" : "mock";

/**
 * Human-readable description of the current data runtime state.
 */
export function getDataModeInfo() {
  return {
    mode: currentDataMode,
    isMock: currentDataMode === "mock",
    isFirebase: currentDataMode === "firebase",
    description:
      currentDataMode === "mock"
        ? "Running in standalone local/mock mode (browser persistence active, zero backend required)"
        : "Connected to Firebase backend services",
  };
}
