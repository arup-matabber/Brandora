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
} from "@/lib/firebase/firestore";
import { db } from "@/lib/firebase/client";

export type LibraryItemType =
  | "font"
  | "color"
  | "palette"
  | "image"
  | "reference"
  | "template"
  | "idea";

export type LibraryProvider = "google" | "pixabay" | "internal" | "upload";

export interface FirestoreLibraryItem {
  id: string;
  userId: string;
  type: LibraryItemType;
  title: string;
  description?: string;
  provider: LibraryProvider;
  externalId?: string;
  sourceUrl?: string;
  previewUrl?: string;
  storagePath?: string;
  metadata: Record<string, any>;
  createdAt?: any;
  updatedAt?: any;
}

export interface SaveLibraryItemDTO {
  id?: string;
  type: LibraryItemType;
  title: string;
  description?: string;
  provider?: LibraryProvider;
  externalId?: string;
  sourceUrl?: string;
  previewUrl?: string;
  storagePath?: string;
  metadata?: Record<string, any>;
}

export async function getUserLibrary(userId: string): Promise<FirestoreLibraryItem[]> {
  try {
    const libraryRef = collection(db, "users", userId, "library");
    const q = query(libraryRef, orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    return snap.docs.map((docSnap) => ({
      id: docSnap.id,
      userId,
      ...docSnap.data(),
    })) as FirestoreLibraryItem[];
  } catch (error) {
    console.error("Error fetching user library from Firestore:", error);
    return [];
  }
}

export async function saveLibraryItem(
  userId: string,
  dto: SaveLibraryItemDTO
): Promise<FirestoreLibraryItem> {
  const libraryRef = collection(db, "users", userId, "library");
  const docId = dto.id || `${dto.type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const itemRef = doc(libraryRef, docId);

  const libraryItem: FirestoreLibraryItem = {
    id: docId,
    userId,
    type: dto.type,
    title: dto.title.trim(),
    description: dto.description || "",
    provider: dto.provider || "internal",
    externalId: dto.externalId || "",
    sourceUrl: dto.sourceUrl || "",
    previewUrl: dto.previewUrl || "",
    storagePath: dto.storagePath || "",
    metadata: dto.metadata || {},
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(itemRef, libraryItem, { merge: true });
  return libraryItem;
}

export async function deleteLibraryItem(userId: string, itemId: string): Promise<void> {
  const itemRef = doc(db, "users", userId, "library", itemId);
  await deleteDoc(itemRef);
}

// ── Specialized Helpers for Typography, Colors, and References ──

export async function saveFontToLibrary(
  userId: string,
  family: string,
  provider: LibraryProvider = "google",
  variant: string = "regular",
  metadata: Record<string, any> = {}
): Promise<FirestoreLibraryItem> {
  return saveLibraryItem(userId, {
    type: "font",
    title: family,
    description: `${variant} Google Font specimen`,
    provider,
    externalId: family.toLowerCase().replace(/\s+/g, "-"),
    metadata: {
      family,
      variant,
      ...metadata,
    },
  });
}

export async function saveColorToLibrary(
  userId: string,
  hex: string,
  name?: string,
  metadata: Record<string, any> = {}
): Promise<FirestoreLibraryItem> {
  // Convert hex to rgb
  const cleanHex = hex.replace("#", "");
  const num = parseInt(cleanHex, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  const rgb = `rgb(${r}, ${g}, ${b})`;

  return saveLibraryItem(userId, {
    type: "color",
    title: name || hex.toUpperCase(),
    provider: "internal",
    metadata: {
      hex: hex.startsWith("#") ? hex : `#${hex}`,
      rgb,
      ...metadata,
    },
  });
}

export async function savePaletteToLibrary(
  userId: string,
  name: string,
  colors: Array<{ hex: string; label?: string }>,
  metadata: Record<string, any> = {}
): Promise<FirestoreLibraryItem> {
  return saveLibraryItem(userId, {
    type: "palette",
    title: name || "Color Harmony Palette",
    provider: "internal",
    metadata: {
      colors,
      count: colors.length,
      ...metadata,
    },
  });
}

export async function saveReferenceToLibrary(
  userId: string,
  title: string,
  sourceUrl: string,
  previewUrl: string,
  provider: LibraryProvider = "internal",
  externalId?: string,
  metadata: Record<string, any> = {}
): Promise<FirestoreLibraryItem> {
  return saveLibraryItem(userId, {
    type: "reference",
    title,
    sourceUrl,
    previewUrl,
    provider,
    externalId,
    metadata,
  });
}
