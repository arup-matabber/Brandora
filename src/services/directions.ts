import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
} from "@/lib/firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { PublishedDirectionSnapshot } from "@/lib/data";

export type DirectionStatus =
  | "draft"
  | "published"
  | "changes_requested"
  | "approved"
  | "archived";

export interface FirestoreDirection {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  status: DirectionStatus;
  currentVersionNumber?: number;
  latestVersionId?: string;
  createdBy: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface FirestoreDirectionVersion {
  id: string;
  directionId: string;
  versionNumber: number;
  status: string;
  snapshot: PublishedDirectionSnapshot;
  createdBy: string;
  createdAt?: any;
  publishedAt?: any;
}

export async function getProjectDirections(projectId: string): Promise<FirestoreDirection[]> {
  try {
    const directionsRef = collection(db, "projects", projectId, "directions");
    const q = query(directionsRef, orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    return snap.docs.map((d) => ({
      id: d.id,
      projectId,
      ...d.data(),
    })) as FirestoreDirection[];
  } catch (error) {
    console.error("Error fetching directions from Firestore:", error);
    return [];
  }
}

export async function getDirectionById(
  projectId: string,
  directionId: string
): Promise<FirestoreDirection | null> {
  try {
    const dirRef = doc(db, "projects", projectId, "directions", directionId);
    const snap = await getDoc(dirRef);
    if (!snap.exists()) return null;
    return { id: snap.id, projectId, ...snap.data() } as FirestoreDirection;
  } catch (error) {
    console.error("Error fetching direction by ID:", error);
    return null;
  }
}

export async function createOrUpdateDirection(
  projectId: string,
  directionId: string,
  data: Partial<FirestoreDirection>
): Promise<FirestoreDirection> {
  const dirRef = doc(db, "projects", projectId, "directions", directionId);
  const snap = await getDoc(dirRef);

  if (snap.exists()) {
    await updateDoc(dirRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    return { id: directionId, projectId, ...(snap.data() as any), ...data };
  }

  const newDirection: FirestoreDirection = {
    id: directionId,
    projectId,
    name: data.name || "Creative Direction",
    description: data.description || "",
    status: data.status || "draft",
    currentVersionNumber: 1,
    createdBy: data.createdBy || "designer",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...data,
  };

  await setDoc(dirRef, newDirection);
  return newDirection;
}

export async function createDirectionVersion(
  projectId: string,
  directionId: string,
  snapshot: PublishedDirectionSnapshot,
  createdBy: string
): Promise<FirestoreDirectionVersion> {
  const versionsRef = collection(db, "projects", projectId, "directions", directionId, "versions");
  
  // Calculate next version number
  const q = query(versionsRef, orderBy("versionNumber", "desc"));
  const snap = await getDocs(q);
  const latestNum = snap.empty ? 0 : snap.docs[0].data().versionNumber || 0;
  const nextVersionNumber = latestNum + 1;

  const versionId = `ver-${directionId}-${nextVersionNumber}-${Date.now()}`;
  const versionRef = doc(versionsRef, versionId);

  const versionDoc: FirestoreDirectionVersion = {
    id: versionId,
    directionId,
    versionNumber: nextVersionNumber,
    status: "PUBLISHED",
    snapshot,
    createdBy,
    createdAt: serverTimestamp(),
    publishedAt: serverTimestamp(),
  };

  await setDoc(versionRef, versionDoc);

  // Update direction header document
  await createOrUpdateDirection(projectId, directionId, {
    name: snapshot.name,
    description: snapshot.description,
    status: "published",
    currentVersionNumber: nextVersionNumber,
    latestVersionId: versionId,
  });

  return versionDoc;
}

export async function getDirectionVersions(
  projectId: string,
  directionId: string
): Promise<FirestoreDirectionVersion[]> {
  try {
    const versionsRef = collection(db, "projects", projectId, "directions", directionId, "versions");
    const q = query(versionsRef, orderBy("versionNumber", "desc"));
    const snap = await getDocs(q);

    return snap.docs.map((d) => ({
      id: d.id,
      directionId,
      ...d.data(),
    })) as FirestoreDirectionVersion[];
  } catch (error) {
    console.error("Error fetching direction versions from Firestore:", error);
    return [];
  }
}

export async function updateDirectionStatus(
  projectId: string,
  directionId: string,
  status: DirectionStatus
): Promise<void> {
  const dirRef = doc(db, "projects", projectId, "directions", directionId);
  await updateDoc(dirRef, {
    status,
    updatedAt: serverTimestamp(),
  });
}
