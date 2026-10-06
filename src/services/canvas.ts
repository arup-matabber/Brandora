import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
} from "@/lib/firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { CanvasItem, CanvasObjectType } from "@/lib/data";

export interface FirestoreCanvasDoc {
  id: string;
  projectId: string;
  name: string;
  viewportX: number;
  viewportY: number;
  zoom: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface FirestoreCanvasObject {
  id: string;
  type: CanvasObjectType | string;
  parentId?: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  zIndex?: number;
  content: Record<string, any>;
  metadata?: Record<string, any>;
  locked: boolean;
  hidden: boolean;
  createdBy?: string;
  createdAt?: any;
  updatedAt?: any;
}

export async function getCanvasMetadata(
  projectId: string,
  canvasId: string = "main"
): Promise<FirestoreCanvasDoc | null> {
  try {
    const canvasRef = doc(db, "projects", projectId, "canvas", canvasId);
    const snap = await getDoc(canvasRef);
    if (!snap.exists()) return null;
    return { id: snap.id, projectId, ...snap.data() } as FirestoreCanvasDoc;
  } catch (error) {
    console.error("Error fetching canvas metadata from Firestore:", error);
    return null;
  }
}

export async function saveCanvasViewport(
  projectId: string,
  viewport: { viewportX: number; viewportY: number; zoom: number },
  canvasId: string = "main"
): Promise<void> {
  const canvasRef = doc(db, "projects", projectId, "canvas", canvasId);
  await setDoc(
    canvasRef,
    {
      name: "Main Canvas",
      viewportX: viewport.viewportX,
      viewportY: viewport.viewportY,
      zoom: viewport.zoom,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function getCanvasObjects(
  projectId: string,
  canvasId: string = "main"
): Promise<CanvasItem[]> {
  try {
    const objectsRef = collection(db, "projects", projectId, "canvas", canvasId, "objects");
    const q = query(objectsRef, orderBy("zIndex", "asc"));
    const snap = await getDocs(q);

    if (snap.empty) return [];

    return snap.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        type: data.type as any,
        parentId: data.parentId || null,
        sectionId: data.parentId || null,
        x: Number(data.x) || 0,
        y: Number(data.y) || 0,
        width: Number(data.width) || 200,
        height: Number(data.height) || 150,
        rotation: Number(data.rotation) || 0,
        zIndex: Number(data.zIndex) || 1,
        content: data.content || {},
        metadata: data.metadata || {},
        locked: !!data.locked,
        archived: !!data.hidden,
      } as CanvasItem;
    });
  } catch (error) {
    console.error("Error fetching canvas objects from Firestore:", error);
    return [];
  }
}

export async function saveCanvasObjects(
  projectId: string,
  objects: CanvasItem[],
  userId?: string,
  canvasId: string = "main"
): Promise<void> {
  try {
    // Ensure canvas doc exists
    const canvasRef = doc(db, "projects", projectId, "canvas", canvasId);
    await setDoc(
      canvasRef,
      {
        name: "Main Workspace",
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    const objectsRef = collection(db, "projects", projectId, "canvas", canvasId, "objects");

    // Persist each object in the objects subcollection
    const promises = objects.map((item) => {
      const objRef = doc(objectsRef, item.id);
      const payload: FirestoreCanvasObject = {
        id: item.id,
        type: item.type,
        parentId: item.parentId || item.sectionId || null,
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height,
        rotation: item.rotation || 0,
        zIndex: item.zIndex || 1,
        content: item.content || {},
        metadata: item.metadata || {},
        locked: !!item.locked,
        hidden: !!item.archived,
        createdBy: userId || "designer",
        updatedAt: serverTimestamp(),
      };
      return setDoc(objRef, payload, { merge: true });
    });

    await Promise.all(promises);
  } catch (error) {
    console.error("Error saving canvas objects to Firestore subcollection:", error);
  }
}

export async function saveSingleCanvasObject(
  projectId: string,
  item: CanvasItem,
  userId?: string,
  canvasId: string = "main"
): Promise<void> {
  const objRef = doc(db, "projects", projectId, "canvas", canvasId, "objects", item.id);
  const payload: FirestoreCanvasObject = {
    id: item.id,
    type: item.type,
    parentId: item.parentId || item.sectionId || null,
    x: item.x,
    y: item.y,
    width: item.width,
    height: item.height,
    rotation: item.rotation || 0,
    zIndex: item.zIndex || 1,
    content: item.content || {},
    metadata: item.metadata || {},
    locked: !!item.locked,
    hidden: !!item.archived,
    createdBy: userId || "designer",
    updatedAt: serverTimestamp(),
  };
  await setDoc(objRef, payload, { merge: true });
}

export async function deleteCanvasObject(
  projectId: string,
  objectId: string,
  canvasId: string = "main"
): Promise<void> {
  const objRef = doc(db, "projects", projectId, "canvas", canvasId, "objects", objectId);
  await deleteDoc(objRef);
}
