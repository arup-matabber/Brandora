import { doc, getDoc, setDoc, serverTimestamp } from "@/lib/firebase/firestore";
import { db } from "@/lib/firebase/client";
import { UserProfile } from "@/lib/firebase/auth";

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as UserProfile;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

export async function upsertUserProfile(
  userId: string,
  data: Partial<UserProfile>
): Promise<UserProfile> {
  const userRef = doc(db, "users", userId);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    await setDoc(userRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
    return { ...(snap.data() as UserProfile), ...data, id: userId };
  }

  const profile: UserProfile = {
    fullName: data.fullName || "Designer",
    email: data.email || "",
    avatarUrl: data.avatarUrl || null,
    role: data.role || "designer",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...data,
    id: userId,
  };

  await setDoc(userRef, profile);
  return profile;
}
