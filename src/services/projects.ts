import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "@/lib/firebase/firestore";
import { db } from "@/lib/firebase/client";
import { addProjectMember } from "./projectMembers";

export type ProjectType =
  | "brand_identity"
  | "rebrand"
  | "logo"
  | "packaging"
  | "visual_identity"
  | "other";

export interface FirestoreProject {
  id: string;
  ownerId: string;
  clientId: string;
  clientName: string;
  name: string;
  description?: string;
  projectType: ProjectType;
  status: string;
  lastOpenedAt?: any;
  lastOpenedLocation?: string;
  createdAt?: any;
  updatedAt?: any;
  // Canvas & Identity State
  canvasObjects?: any[];
  brandBrain?: any;
  materials?: any[];
  visualPreview?: any;
  notes?: string;
}

export interface CreateProjectDTO {
  id?: string;
  ownerId: string;
  clientId?: string;
  clientName: string;
  name: string;
  description?: string;
  projectType?: string;
  status?: string;
  brandBrain?: any;
  canvasObjects?: any[];
  materials?: any[];
  notes?: string;
}

function normalizeProjectType(input?: string): ProjectType {
  const clean = (input || "").toLowerCase().trim().replace(/[\s-]+/g, "_");
  if (clean.includes("rebrand")) return "rebrand";
  if (clean.includes("logo")) return "logo";
  if (clean.includes("packaging")) return "packaging";
  if (clean.includes("visual")) return "visual_identity";
  if (clean.includes("brand")) return "brand_identity";
  return "brand_identity";
}

export async function getProjects(ownerId: string): Promise<FirestoreProject[]> {
  try {
    const projectsRef = collection(db, "projects");
    const q = query(projectsRef, where("ownerId", "==", ownerId), orderBy("updatedAt", "desc"));
    const snap = await getDocs(q);

    return snap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as FirestoreProject[];
  } catch (error) {
    console.error("Error fetching projects from Firestore:", error);
    return [];
  }
}

export async function getProjectById(projectId: string): Promise<FirestoreProject | null> {
  try {
    const projectRef = doc(db, "projects", projectId);
    const snap = await getDoc(projectRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as FirestoreProject;
  } catch (error) {
    console.error("Error fetching project by ID:", error);
    return null;
  }
}

export async function createProject(dto: CreateProjectDTO): Promise<FirestoreProject> {
  const baseSlug =
    (dto.id || dto.name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || `proj-${Date.now()}`;

  let slug = baseSlug;
  let counter = 1;
  while ((await getDoc(doc(db, "projects", slug))).exists()) {
    counter++;
    slug = `${baseSlug}-${counter}`;
  }

  const projectRef = doc(db, "projects", slug);

  // Default canvas items if not provided
  const initialCanvas = dto.canvasObjects && dto.canvasObjects.length > 0
    ? dto.canvasObjects
    : [
        {
          id: `bb-${Date.now()}`,
          type: "brand_brain",
          x: 80,
          y: 60,
          width: 320,
          height: 380,
          zIndex: 1,
          content: {
            title: dto.name,
            client: dto.clientName,
            type: dto.projectType || "Brand Identity",
            brain: dto.brandBrain,
          },
        },
      ];

  const projectData: FirestoreProject = {
    id: slug,
    ownerId: dto.ownerId,
    clientId: dto.clientId || `client-${Date.now()}`,
    clientName: dto.clientName || "Independent",
    name: dto.name,
    description: dto.description || "",
    projectType: normalizeProjectType(dto.projectType),
    status: dto.status || "Active",
    lastOpenedAt: serverTimestamp(),
    lastOpenedLocation: `/project/${slug}`,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    canvasObjects: initialCanvas,
    brandBrain: dto.brandBrain || null,
    materials: dto.materials || [],
    visualPreview: {
      fontSpecimen: dto.name,
      secondaryFont: "Geometric Grotesque & Editorial Serif",
      monogram: dto.name.slice(0, 2).toUpperCase(),
      palette: ["#191918", "#5A5A55", "#E4E4DE", "#F7F7F4"],
      gridAccent: "12-col / 8pt baseline",
    },
    notes: dto.notes || "",
  };

  await setDoc(projectRef, projectData);

  // Initialize owner membership in projects/{projectId}/members/{userId}
  await addProjectMember(slug, dto.ownerId, "owner");

  return projectData;
}

export async function updateProject(
  projectId: string,
  patch: Partial<Omit<FirestoreProject, "id" | "ownerId">>
): Promise<void> {
  const projectRef = doc(db, "projects", projectId);
  await updateDoc(projectRef, {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteProject(projectId: string): Promise<void> {
  const projectRef = doc(db, "projects", projectId);
  await deleteDoc(projectRef);
}
