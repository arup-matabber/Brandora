import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from "@/lib/firebase/firestore";
import { db } from "@/lib/firebase/client";

export interface FirestoreProjectItem {
  id: string;
  projectId: string;
  libraryItemId?: string;
  type: string;
  title: string;
  provider: string;
  previewUrl?: string;
  sourceUrl?: string;
  metadata?: Record<string, any>;
  addedBy: string;
  addedAt?: any;
}

export interface AddProjectItemDTO {
  id?: string;
  libraryItemId?: string;
  type: string;
  title: string;
  provider?: string;
  previewUrl?: string;
  sourceUrl?: string;
  metadata?: Record<string, any>;
  addedBy: string;
}

export async function getProjectItems(projectId: string): Promise<FirestoreProjectItem[]> {
  try {
    const itemsRef = collection(db, "projects", projectId, "items");
    const q = query(itemsRef, orderBy("addedAt", "desc"));
    const snap = await getDocs(q);

    return snap.docs.map((docSnap) => ({
      id: docSnap.id,
      projectId,
      ...docSnap.data(),
    })) as FirestoreProjectItem[];
  } catch (error) {
    console.error("Error fetching project items from Firestore:", error);
    return [];
  }
}

export async function addProjectItem(
  projectId: string,
  dto: AddProjectItemDTO
): Promise<FirestoreProjectItem> {
  const itemsRef = collection(db, "projects", projectId, "items");
  const docId = dto.id || `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const itemRef = doc(itemsRef, docId);

  const projectItem: FirestoreProjectItem = {
    id: docId,
    projectId,
    libraryItemId: dto.libraryItemId || "",
    type: dto.type,
    title: dto.title,
    provider: dto.provider || "internal",
    previewUrl: dto.previewUrl || "",
    sourceUrl: dto.sourceUrl || "",
    metadata: dto.metadata || {},
    addedBy: dto.addedBy,
    addedAt: serverTimestamp(),
  };

  await setDoc(itemRef, projectItem);
  return projectItem;
}

export async function removeProjectItem(projectId: string, itemId: string): Promise<void> {
  const itemRef = doc(db, "projects", projectId, "items", itemId);
  await deleteDoc(itemRef);
}
