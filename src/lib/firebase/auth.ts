import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./client";

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  role: "designer" | "client" | "admin";
  createdAt?: any;
  updatedAt?: any;
}

/**
 * Ensures a user's profile document exists in Firestore (users/{userId}).
 */
export async function syncUserProfile(user: FirebaseUser): Promise<UserProfile> {
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    const data = snap.data() as UserProfile;
    // Update last seen
    await setDoc(userRef, { updatedAt: serverTimestamp() }, { merge: true });
    return { ...data, id: user.uid };
  }

  const email = user.email || "";
  const namePart = email.split("@")[0] || "Designer";
  const fullName = user.displayName || `${namePart.charAt(0).toUpperCase() + namePart.slice(1)} Roy`;

  const newProfile: UserProfile = {
    id: user.uid,
    fullName,
    email,
    avatarUrl: user.photoURL || null,
    role: "designer",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(userRef, newProfile);
  return newProfile;
}

/**
 * Sign in with Google Pop-up.
 */
export async function signInWithGoogle(): Promise<{ user: FirebaseUser; profile: UserProfile }> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const result = await signInWithPopup(auth, provider);
  const profile = await syncUserProfile(result.user);
  return { user: result.user, profile };
}

/**
 * Sign in or sign up with email.
 */
export async function signInWithEmail(email: string, password = "DefaultOpalitePassword2026!"): Promise<{ user: FirebaseUser; profile: UserProfile }> {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const profile = await syncUserProfile(result.user);
    return { user: result.user, profile };
  } catch (err: any) {
    // If account doesn't exist, create it automatically
    if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
      try {
        const createResult = await createUserWithEmailAndPassword(auth, email, password);
        const profile = await syncUserProfile(createResult.user);
        return { user: createResult.user, profile };
      } catch (createErr) {
        throw createErr;
      }
    }
    throw err;
  }
}

/**
 * Sign out.
 */
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}
