import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "@/lib/firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "@/lib/firebase/storage";
import { db, storage } from "@/lib/firebase/client";

export interface ProjectMaterialRecord {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: string;
  mimeType: string;
  storagePath: string;
  downloadUrl: string;
  uploadedBy: string;
  status: "ready" | "processing";
  createdAt?: any;
}

export async function uploadProjectMaterial(
  projectId: string,
  file: File,
  uploadedBy: string
): Promise<ProjectMaterialRecord> {
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const uniqueName = `${Date.now()}_${sanitizedName}`;
  const storagePath = `projects/${projectId}/materials/${uniqueName}`;

  // 1. Upload to Firebase Storage
  const storageReference = ref(storage, storagePath);
  await uploadBytes(storageReference, file);
  const downloadUrl = await getDownloadURL(storageReference);

  // 2. Create metadata record in Firestore subcollection
  const materialsCollRef = collection(db, "projects", projectId, "materials");
  const docRef = doc(materialsCollRef);

  const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
  const extension = file.name.split(".").pop()?.toUpperCase() || "FILE";

  const record: ProjectMaterialRecord = {
    id: docRef.id,
    fileName: file.name,
    fileType: extension,
    fileSize: `${sizeMb} MB`,
    mimeType: file.type || "application/octet-stream",
    storagePath,
    downloadUrl,
    uploadedBy,
    status: "ready",
    createdAt: serverTimestamp(),
  };

  await setDoc(docRef, record);
  return record;
}

export async function getProjectMaterials(projectId: string): Promise<ProjectMaterialRecord[]> {
  try {
    const materialsCollRef = collection(db, "projects", projectId, "materials");
    const snap = await getDocs(materialsCollRef);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ProjectMaterialRecord));
  } catch (error) {
    console.error("Error fetching project materials:", error);
    return [];
  }
}

export async function deleteProjectMaterial(
  projectId: string,
  materialId: string,
  storagePath: string
): Promise<void> {
  try {
    // 1. Delete from Storage
    const storageReference = ref(storage, storagePath);
    await deleteObject(storageReference).catch((e) => console.warn("Storage delete non-fatal:", e));

    // 2. Delete document from Firestore
    const docRef = doc(db, "projects", projectId, "materials", materialId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting project material:", error);
    throw error;
  }
}
