"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./auth-context";
import {
  createProject as createFirestoreProject,
  updateProject as updateFirestoreProject,
  deleteProject as deleteFirestoreProject,
  getProjects as getFirestoreProjects,
} from "@/services/projects";
import {
  createClient as createFirestoreClient,
  updateClient as updateFirestoreClient,
  deleteClient as deleteFirestoreClient,
  getClients as getFirestoreClients,
} from "@/services/clients";
import {
  getUserLibrary as getFirestoreLibrary,
  saveLibraryItem as saveFirestoreLibraryItem,
  deleteLibraryItem as deleteFirestoreLibraryItem,
} from "@/services/library";
import {
  addProjectItem as addFirestoreProjectItem,
} from "@/services/projectItems";
import {
  saveCanvasObjects as saveFirestoreCanvasObjects,
  getCanvasObjects as getFirestoreCanvasObjects,
} from "@/services/canvas";
import {
  updateProjectBrandBrain as updateFirestoreBrandBrain,
} from "@/services/brandBrain";
import {
  createDirectionVersion as createFirestoreDirectionVersion,
} from "@/services/directions";
import {
  createReviewAndShare as createFirestoreReviewAndShare,
} from "@/services/reviews";
import {
  addReviewComment as addFirestoreReviewComment,
  toggleCommentResolved as toggleFirestoreCommentResolved,
} from "@/services/comments";
import {
  submitApproval as submitFirestoreApproval,
} from "@/services/approvals";
import type {
  BrandProject,
  ClientRecord,
  ActivityItemData,
  BrandBrain,
  CanvasItem,
  LibraryItem,
  UploadedMaterial,
  DirectionVersion,
  ClientReview,
  PublishedDirectionSnapshot,
  Comment,
  Approval,
  ApprovalStatus,
  ReviewShare,
  AccessLevel,
} from "./data";
import { generateMockBrandBrain, initialClients, recentProjects } from "./data";
import { safeStorage } from "./safe-storage";
import { isFirebaseConfigured } from "./data-mode";

export interface CreateProjectPayload {
  name: string;
  client: string;
  type: string;
  description?: string;
  notes?: string;
  materials?: UploadedMaterial[];
  brandBrain?: BrandBrain;
}

export interface PalettePayload {
  name: string;
  colors: { hex: string; label: string }[];
}

interface ProjectsContextType {
  projects: BrandProject[];
  clients: ClientRecord[];
  activity: ActivityItemData[];
  library: LibraryItem[];
  directionVersions: DirectionVersion[];
  clientReviews: ClientReview[];
  comments: Comment[];
  approvals: Approval[];
  reviewShares: ReviewShare[];
  createProject: (payload: CreateProjectPayload) => BrandProject;
  createClient: (data: {
    name: string;
    contact?: string;
    company?: string;
    email?: string;
    phone?: string;
    status?: ClientRecord["status"];
    notes?: string;
  }) => ClientRecord;
  deleteProject: (id: string) => void;
  deleteClient: (id: string) => void;
  getClient: (id: string) => ClientRecord | undefined;
  updateClient: (id: string, patch: Partial<ClientRecord>) => void;
  getProject: (id: string) => BrandProject | undefined;
  updateProjectCanvas: (id: string, objects: CanvasItem[]) => void;
  updateBrandBrain: (id: string, brain: BrandBrain) => void;
  saveToLibrary: (item: Omit<LibraryItem, "id" | "savedAt">) => void;
  removeFromLibrary: (id: string) => void;
  addInspirationToCanvas: (projectId: string, item: any) => void;
  linkItemToProject: (libraryItemId: string, projectId: string) => void;
  applyPaletteToProject: (id: string, palette: PalettePayload) => void;
  attachPaletteToDirection: (id: string, directionId: string, palette: PalettePayload) => void;
  publishDirection: (
    projectId: string,
    directionItem: CanvasItem,
    currentCanvasItems?: CanvasItem[]
  ) => { version: DirectionVersion; review: ClientReview; share: ReviewShare };
  getReviewsForClient: (clientNameOrId: string) => { review: ClientReview; version: DirectionVersion; project?: BrandProject }[];
  getDirectionVersions: (directionId: string) => DirectionVersion[];
  getReviewDetails: (reviewId: string) => { review: ClientReview; version: DirectionVersion; project?: BrandProject } | undefined;
  // Comments
  addComment: (data: Omit<Comment, "id" | "createdAt" | "resolved">) => Comment;
  resolveComment: (id: string) => void;
  deleteComment: (id: string) => void;
  getComments: (directionId: string, versionId: string) => Comment[];
  // Approvals
  submitApproval: (data: Omit<Approval, "id" | "createdAt">) => Approval;
  getApproval: (directionId: string, versionId: string) => Approval | undefined;
  // ReviewShares
  createReviewShare: (data: Omit<ReviewShare, "id" | "token" | "createdAt" | "active">) => ReviewShare;
  getShareByToken: (token: string) => ReviewShare | undefined;
  deactivateShare: (id: string) => void;
  updateShareAccess: (id: string, accessLevel: AccessLevel) => void;
  getSharesForProject: (projectId: string) => ReviewShare[];
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<BrandProject[]>(recentProjects);
  const [clients, setClients] = useState<ClientRecord[]>(initialClients);
  const [activity, setActivity] = useState<ActivityItemData[]>([]);
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [directionVersions, setDirectionVersions] = useState<DirectionVersion[]>([]);
  const [clientReviews, setClientReviews] = useState<ClientReview[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [reviewShares, setReviewShares] = useState<ReviewShare[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on client mount
  useEffect(() => {
    // 1. Initial instant load from safeStorage for zero-latency paint
    try {
      const storedProjects = safeStorage.get<BrandProject[]>("opalite_projects", []);
      if (Array.isArray(storedProjects) && storedProjects.length > 0) {
        const seenIds = new Set<string>();
        const sanitized: BrandProject[] = [];
        for (const p of storedProjects) {
          let id = p.id || `proj-${Date.now()}`;
          if (seenIds.has(id)) {
            let c = 2;
            while (seenIds.has(`${id}-${c}`)) {
              c++;
            }
            id = `${id}-${c}`;
          }
          seenIds.add(id);

          const defaultMatch = recentProjects.find((dp) => dp.id === p.id);
          sanitized.push({
            ...defaultMatch,
            ...p,
            id,
            client: p.client || (p as any).clientName || defaultMatch?.client || "Studio Orblinn",
            canvasObjects:
              Array.isArray(p.canvasObjects) && p.canvasObjects.length > 0
                ? p.canvasObjects
                : defaultMatch?.canvasObjects || [],
            visualPreview: p.visualPreview || defaultMatch?.visualPreview || {
              fontSpecimen: p.name || "Satoshi",
              secondaryFont: "Inter",
              monogram: (p.name || "OP").slice(0, 2).toUpperCase(),
              palette: ["#191918", "#EBEBE7", "#F7F7F5"],
              gridAccent: "#191918",
            },
          });
        }
        setProjects(sanitized);
      }

      const storedClients = safeStorage.get<ClientRecord[]>("opalite_clients", []);
      if (storedClients.length > 0) {
        setClients(storedClients);
      }

      const storedActivity = safeStorage.get<ActivityItemData[]>("opalite_activity", []);
      if (storedActivity.length > 0) {
        setActivity(storedActivity);
      }

      const storedLibrary = safeStorage.get<LibraryItem[]>("opalite_library", []);
      if (storedLibrary.length > 0) {
        setLibrary(storedLibrary);
      }

      const storedVersions = safeStorage.get<DirectionVersion[]>("opalite_direction_versions", []);
      if (storedVersions.length > 0) {
        setDirectionVersions(storedVersions);
      }

      const storedReviews = safeStorage.get<ClientReview[]>("opalite_client_reviews", []);
      if (storedReviews.length > 0) {
        setClientReviews(storedReviews);
      }

      const storedComments = safeStorage.get<Comment[]>("opalite_comments", []);
      if (storedComments.length > 0) {
        setComments(storedComments);
      }

      const storedApprovals = safeStorage.get<Approval[]>("opalite_approvals", []);
      if (storedApprovals.length > 0) {
        setApprovals(storedApprovals);
      }

      const storedShares = safeStorage.get<ReviewShare[]>("opalite_review_shares", []);
      if (storedShares.length > 0) {
        setReviewShares(storedShares);
      }
    } catch (e) {
      console.error("Failed to load Opalite data from safeStorage", e);
    } finally {
      setIsInitialized(true);
    }

    // 2. Hydrate from backend API (Prisma SQLite database)
    async function hydrateFromBackend() {
      try {
        const [projRes, clientRes, libRes] = await Promise.all([
          fetch("/api/projects").then((r) => (r.ok ? r.json() : null)),
          fetch("/api/clients").then((r) => (r.ok ? r.json() : null)),
          fetch("/api/library").then((r) => (r.ok ? r.json() : null)),
        ]);

        if (projRes?.success && Array.isArray(projRes.projects) && projRes.projects.length > 0) {
          setProjects((prev) => {
            // Merge backend projects, preserving any in-memory active edits
            const map = new Map<string, BrandProject>();
            projRes.projects.forEach((bp: BrandProject) => map.set(bp.id, bp));
            prev.forEach((lp) => {
              if (!map.has(lp.id)) map.set(lp.id, lp);
            });
            return Array.from(map.values());
          });
        }

        if (clientRes?.success && Array.isArray(clientRes.clients) && clientRes.clients.length > 0) {
          setClients(clientRes.clients);
        }

        if (libRes?.success && Array.isArray(libRes.items) && libRes.items.length > 0) {
          setLibrary(libRes.items.map((i: any) => ({
            id: i.id,
            type: i.type,
            name: i.name,
            content: i.data || {},
            savedAt: i.savedAt,
            source: i.source,
          })));
        }
      } catch (err) {
        console.warn("Backend hydration skipped (offline/fallback mode)", err);
      }
    }

    hydrateFromBackend();
  }, []);

  // Hydrate user-owned data from Firestore when authenticated and configured
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const currentUid = user?.uid;
    if (!currentUid) return;
    async function syncFirestore(userId: string) {
      try {
        const [fProjects, fClients, fLibrary] = await Promise.all([
          getFirestoreProjects(userId),
          getFirestoreClients(userId),
          getFirestoreLibrary(userId),
        ]);

        if (fProjects && fProjects.length > 0) {
          const loadedProjects: BrandProject[] = await Promise.all(
            fProjects.map(async (fp) => {
              try {
                const subObjects = await getFirestoreCanvasObjects(fp.id);
                const objects = subObjects && subObjects.length > 0 ? subObjects : fp.canvasObjects || [];
                return {
                  id: fp.id,
                  name: fp.name,
                  client: fp.clientName,
                  type: fp.projectType,
                  status: (fp.status as any) || "Active",
                  lastEdited: "Recently",
                  currentFocus: "Brand Identity",
                  tagline: fp.description || "Design system and brand workspace",
                  description: fp.description,
                  notes: fp.notes,
                  materials: fp.materials || [],
                  brandBrain: fp.brandBrain,
                  canvasObjects: objects,
                  visualPreview: fp.visualPreview || {
                    fontSpecimen: fp.name,
                    secondaryFont: "Geometric Grotesque & Editorial Serif",
                    monogram: fp.name.slice(0, 2).toUpperCase(),
                    palette: ["#191918", "#5A5A55", "#E4E4DE", "#F7F7F4"],
                    gridAccent: "12-col / 8pt baseline",
                  },
                };
              } catch (e) {
                return {
                  id: fp.id,
                  name: fp.name,
                  client: fp.clientName,
                  type: fp.projectType,
                  status: (fp.status as any) || "Active",
                  lastEdited: "Recently",
                  currentFocus: "Brand Identity",
                  tagline: fp.description || "Design system and brand workspace",
                  description: fp.description,
                  notes: fp.notes,
                  materials: fp.materials || [],
                  brandBrain: fp.brandBrain,
                  canvasObjects: fp.canvasObjects || [],
                  visualPreview: fp.visualPreview || {
                    fontSpecimen: fp.name,
                    secondaryFont: "Geometric Grotesque & Editorial Serif",
                    monogram: fp.name.slice(0, 2).toUpperCase(),
                    palette: ["#191918", "#5A5A55", "#E4E4DE", "#F7F7F4"],
                    gridAccent: "12-col / 8pt baseline",
                  },
                };
              }
            })
          );

          setProjects((prev) => {
            const map = new Map<string, BrandProject>();
            loadedProjects.forEach((lp) => map.set(lp.id, lp));
            prev.forEach((p) => {
              if (!map.has(p.id)) map.set(p.id, p);
            });
            return Array.from(map.values());
          });
        }

        if (fClients && fClients.length > 0) {
          setClients((prev) => {
            const map = new Map<string, ClientRecord>();
            fClients.forEach((fc) => {
              map.set(fc.id, {
                id: fc.id,
                name: fc.name,
                contact: fc.name,
                company: fc.company || fc.name,
                email: fc.email,
                phone: fc.phone,
                status: fc.status === "active" ? "Active" : fc.status === "inactive" ? "Inactive" : "Lead",
                notes: fc.notes,
                projectsCount: fc.projectsCount || 0,
              });
            });
            prev.forEach((c) => {
              if (!map.has(c.id)) map.set(c.id, c);
            });
            return Array.from(map.values());
          });
        }

        if (fLibrary && fLibrary.length > 0) {
          setLibrary((prev) => {
            const map = new Map<string, LibraryItem>();
            fLibrary.forEach((fl) => {
              map.set(fl.id, {
                id: fl.id,
                type: (fl.type as any) || "reference",
                name: fl.title,
                savedAt: fl.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                content: fl.metadata || {},
                source: fl.provider,
                sourceUrl: fl.sourceUrl,
                imageUrl: fl.previewUrl,
              });
            });
            prev.forEach((l) => {
              if (!map.has(l.id)) map.set(l.id, l);
            });
            return Array.from(map.values());
          });
        }
      } catch (err) {
        console.warn("Firestore user sync error:", err);
      }
    }
    syncFirestore(currentUid);
  }, [user?.uid]);

  // Sync to safeStorage
  useEffect(() => {
    if (!isInitialized) return;
    safeStorage.set("opalite_projects", projects);
    safeStorage.set("opalite_clients", clients);
    safeStorage.set("opalite_activity", activity);
    safeStorage.set("opalite_library", library);
    safeStorage.set("opalite_direction_versions", directionVersions);
    safeStorage.set("opalite_client_reviews", clientReviews);
    safeStorage.set("opalite_comments", comments);
    safeStorage.set("opalite_approvals", approvals);
    safeStorage.set("opalite_review_shares", reviewShares);
  }, [projects, clients, activity, library, directionVersions, clientReviews, comments, approvals, reviewShares, isInitialized]);

  const createClient = (data: {
    name: string;
    contact?: string;
    company?: string;
    email?: string;
    phone?: string;
    status?: ClientRecord["status"];
    notes?: string;
  }) => {
    const now = new Date().toISOString();
    const newClient: ClientRecord = {
      id: `client-${Date.now()}`,
      name: data.name,
      contact: data.contact || data.name,
      company: data.company || data.name,
      email: data.email,
      phone: data.phone,
      status: data.status || "Active",
      notes: data.notes,
      createdAt: now,
      updatedAt: now,
      projectsCount: 1,
    };
    setClients((prev) => {
      // Avoid duplicate client names
      const existing = prev.find((c) => c.name.toLowerCase() === data.name.toLowerCase());
      if (existing) return prev;
      return [newClient, ...prev];
    });
    // Background Firestore & REST API sync
    if (isFirebaseConfigured) {
      createFirestoreClient({
        ownerId: user.uid || "designer-1",
        name: data.name,
        company: data.company,
        email: data.email,
        phone: data.phone,
        notes: data.notes,
      }).catch((err) => console.warn("Firestore client create fallback:", err));
    }

    fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).catch((err) => console.warn("API client create sync error:", err));

    return newClient;
  };

  const createProject = (payload: CreateProjectPayload): BrandProject => {
    const baseSlug =
      payload.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || `proj-${Date.now()}`;

    // Guarantee unique slug/id so two projects never collide
    let slug = baseSlug;
    let counter = 1;
    while (projects.some((p) => p.id === slug)) {
      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    // Generate or use BrandBrain
    const brain = payload.brandBrain || generateMockBrandBrain(payload.name, payload.type, payload.client, payload.notes);

    // Default initial canvas object: Brand Brain object on mostly blank canvas
    const initialCanvas: CanvasItem[] = [
      {
        id: `bb-${Date.now()}`,
        type: "brand_brain",
        x: 80,
        y: 60,
        width: 320,
        height: 380,
        zIndex: 1,
        content: {
          title: payload.name,
          client: payload.client,
          type: payload.type,
          brain,
        },
      },
    ];

    const newProject: BrandProject = {
      id: slug,
      name: payload.name,
      client: payload.client,
      type: payload.type,
      status: "Active",
      lastEdited: "Just now",
      currentFocus: "Brand Brain Exploration",
      tagline: brain.story.coreIdea || "Design system and brand workspace",
      description: payload.description,
      notes: payload.notes,
      materials: payload.materials || [],
      brandBrain: brain,
      canvasObjects: initialCanvas,
      visualPreview: {
        fontSpecimen: payload.name,
        secondaryFont: "Geometric Grotesque & Editorial Serif",
        monogram: payload.name.slice(0, 2).toUpperCase(),
        palette: ["#191918", "#5A5A55", "#E4E4DE", "#F7F7F4"],
        gridAccent: "12-col / 8pt baseline",
      },
    };

    setProjects((prev) => {
      const filtered = prev.filter((p) => p.id !== slug);
      return [newProject, ...filtered];
    });

    // Update or add client record
    if (payload.client) {
      setClients((prev) => {
        const index = prev.findIndex((c) => c.name.toLowerCase() === payload.client.toLowerCase());
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            projectsCount: (updated[index].projectsCount || 0) + 1,
          };
          return updated;
        } else {
          return [
            {
              id: `client-${Date.now()}`,
              name: payload.client,
              contact: payload.client,
              company: payload.client,
              status: "Active",
              projectsCount: 1,
            },
            ...prev,
          ];
        }
      });
    }

    // Add activity
    const newActivity: ActivityItemData = {
      id: `act-${Date.now()}`,
      action: "You created a new project",
      project: payload.name,
      timeAgo: "Just now",
    };
    setActivity((prev) => [newActivity, ...prev]);

    // Background Firestore & REST API sync
    if (isFirebaseConfigured) {
      createFirestoreProject({
        id: slug,
        ownerId: user.uid || "designer-1",
        name: payload.name,
        clientName: payload.client,
        projectType: payload.type,
        description: payload.description,
        notes: payload.notes,
        materials: payload.materials,
        brandBrain: brain,
        canvasObjects: initialCanvas,
      }).catch((err) => console.warn("Firestore project create fallback:", err));
    }

    fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: payload.name,
        client: payload.client,
        type: payload.type,
        description: payload.description,
        notes: payload.notes,
        materials: payload.materials,
        brandBrain: brain,
      }),
    }).catch((err) => console.warn("API project create sync error:", err));

    return newProject;
  };

  const getProject = (id: string): BrandProject | undefined => {
    return projects.find((p) => p.id === id);
  };

  const updateProjectCanvas = (id: string, objects: CanvasItem[]) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, canvasObjects: objects, lastEdited: "Just now" } : p))
    );

    // Background Firestore & REST sync
    updateFirestoreProject(id, {
      canvasObjects: objects,
    }).catch((err) => console.warn("Firestore canvas sync error:", err));

    saveFirestoreCanvasObjects(id, objects, user?.uid).catch((err) =>
      console.warn("Firestore canvas objects subcollection sync error:", err)
    );

    fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ canvasObjects: objects }),
    }).catch((err) => console.warn("API canvas sync error:", err));
  };

  const updateBrandBrain = (id: string, brain: BrandBrain) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const updatedCanvas = p.canvasObjects?.map((item) =>
          item.type === "brand_brain"
            ? { ...item, content: { ...item.content, brain } }
            : item
        );
        return {
          ...p,
          brandBrain: brain,
          canvasObjects: updatedCanvas,
          lastEdited: "Just now",
        };
      })
    );

    // Background Firestore & REST sync
    updateFirestoreProject(id, {
      brandBrain: brain,
    }).catch((err) => console.warn("Firestore brain sync error:", err));

    updateFirestoreBrandBrain(id, brain).catch((err) =>
      console.warn("Firestore normalized brain sync error:", err)
    );

    fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brandBrain: brain }),
    }).catch((err) => console.warn("API brain sync error:", err));
  };

  const deleteProject = (id: string) => {
    const projectToDelete = projects.find((p) => p.id === id);
    setProjects((prev) => prev.filter((p) => p.id !== id));

    if (projectToDelete?.client) {
      setClients((prev) =>
        prev.map((c) => {
          if (c.name.toLowerCase() === projectToDelete.client.toLowerCase()) {
            return {
              ...c,
              projectsCount: Math.max(0, (c.projectsCount || 1) - 1),
            };
          }
          return c;
        })
      );
    }

    if (projectToDelete) {
      setActivity((prev) => [
        {
          id: `act-${Date.now()}`,
          action: "You deleted project",
          project: projectToDelete.name,
          timeAgo: "Just now",
        },
        ...prev,
      ]);
    }

    // Background Firestore & REST sync
    deleteFirestoreProject(id).catch((err) => console.warn("Firestore delete project error:", err));

    fetch(`/api/projects/${id}`, {
      method: "DELETE",
    }).catch((err) => console.warn("API delete project error:", err));
  };

  const deleteClient = (id: string) => {
    const clientToDelete = clients.find((c) => c.id === id);
    setClients((prev) => prev.filter((c) => c.id !== id));
    if (clientToDelete) {
      setActivity((prev) => [
        {
          id: `act-${Date.now()}`,
          action: "You deleted client",
          project: clientToDelete.name,
          timeAgo: "Just now",
        },
        ...prev,
      ]);
    }

    // Background Firestore & REST sync
    deleteFirestoreClient(id).catch((err) => console.warn("Firestore delete client error:", err));

    fetch(`/api/clients/${id}`, {
      method: "DELETE",
    }).catch((err) => console.warn("API delete client error:", err));
  };

  const getClient = (id: string): ClientRecord | undefined => {
    return clients.find((c) => c.id === id);
  };

  const updateClient = (id: string, patch: Partial<ClientRecord>) => {
    setClients((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, ...patch, id: c.id, updatedAt: new Date().toISOString() } : c
      )
    );

    // Background Firestore & REST sync
    updateFirestoreClient(id, {
      name: patch.name,
      company: patch.company,
      email: patch.email,
      phone: patch.phone,
      notes: patch.notes,
      status: patch.status ? (patch.status.toLowerCase() as any) : undefined,
    }).catch((err) => console.warn("Firestore update client error:", err));
  };

  const saveToLibrary = (item: Omit<LibraryItem, "id" | "savedAt">) => {
    const newItem: LibraryItem = {
      ...item,
      id: `lib-${Date.now()}`,
      savedAt: new Date().toISOString(),
    };
    setLibrary((prev) => {
      // Avoid duplicates by name+type
      const exists = prev.some((l) => l.type === item.type && l.name === item.name);
      if (exists) return prev;
      return [newItem, ...prev];
    });

    // Background Firestore & REST sync
    if (user?.uid) {
      saveFirestoreLibraryItem(user.uid, {
        id: newItem.id,
        type: item.type as any,
        title: item.name,
        provider: (item.source as any) || "internal",
        sourceUrl: item.sourceUrl,
        previewUrl: item.imageUrl,
        metadata: item.content,
      }).catch((err) => console.warn("Firestore save library fallback:", err));
    }

    fetch("/api/library", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: item.type,
        name: item.name,
        data: item.content,
        source: item.source,
      }),
    }).catch((err) => console.warn("API save to library error:", err));
  };

  const removeFromLibrary = (id: string) => {
    setLibrary((prev) => prev.filter((l) => l.id !== id));

    // Background Firestore & REST sync
    if (user?.uid) {
      deleteFirestoreLibraryItem(user.uid, id).catch((err) =>
        console.warn("Firestore delete library fallback:", err)
      );
    }

    fetch(`/api/library?id=${id}`, {
      method: "DELETE",
    }).catch((err) => console.warn("API delete from library error:", err));
  };

  const addInspirationToCanvas = (projectId: string, item: any) => {
    setProjects((prev) => {
      const project = prev.find((p) => p.id === projectId);
      if (!project) return prev;

      const existingObjects = project.canvasObjects || [];
      const offset = (existingObjects.length % 8) * 32;
      const maxZ = existingObjects.reduce((m, o) => Math.max(m, o.zIndex ?? 0), 0);

      let canvasItem: CanvasItem;
      const type = item.type || "reference";

      if (type === "font") {
        const fontName = item.content?.fontName ?? item.metadata?.fontName ?? item.title ?? item.name ?? "Font";
        const fontFamily = item.content?.fontFamily ?? item.metadata?.fontFamily ?? item.title ?? fontName;
        const provider = item.content?.provider ?? item.metadata?.provider ?? "google";
        const category = item.content?.category ?? item.metadata?.category ?? item.metadata?.categoryType ?? "sans-serif";
        const variant = item.content?.variant ?? item.metadata?.variant ?? "regular";
        const variants = item.content?.variants ?? item.metadata?.variants ?? ["400", "700"];
        const files = item.content?.files ?? item.metadata?.files ?? {};
        const previewText = item.content?.previewText ?? item.metadata?.previewText ?? "ORBLINN";

        canvasItem = {
          id: `font-${Date.now()}`,
          type: "font",
          x: 200 + offset,
          y: 160 + offset,
          width: 320,
          height: 220,
          zIndex: maxZ + 1,
          content: {
            fontName,
            fontFamily,
            provider,
            category,
            variant,
            variants,
            files,
            previewText,
            metadata: {
              ...(item.metadata || {}),
              fontFamily,
              provider,
              category,
              variants,
              files,
              version: item.metadata?.version,
              lastModified: item.metadata?.lastModified,
            },
          },
          metadata: {
            ...(item.metadata || {}),
            fontFamily,
            provider,
            category,
            variants,
            files,
            version: item.metadata?.version,
            lastModified: item.metadata?.lastModified,
          },
        };
      } else if (type === "color") {
        canvasItem = {
          id: `color-${Date.now()}`,
          type: "color",
          x: 200 + offset,
          y: 160 + offset,
          width: 180,
          height: 220,
          zIndex: maxZ + 1,
          content: {
            hex: item.metadata?.hex ?? item.content?.hex ?? "#191918",
            name: item.metadata?.colorName ?? item.content?.name ?? item.title ?? item.name ?? "Color",
          },
        };
      } else if (type === "palette") {
        canvasItem = {
          id: `palette-${Date.now()}`,
          type: "palette",
          x: 200 + offset,
          y: 160 + offset,
          width: 320,
          height: 160,
          zIndex: maxZ + 1,
          content: {
            name: item.metadata?.paletteName ?? item.content?.name ?? item.title ?? item.name ?? "Palette",
            colors: item.metadata?.colors ?? item.content?.colors ?? [
              { hex: "#191918", label: "Primary" },
              { hex: "#5A5A55", label: "Secondary" },
              { hex: "#BCBCB6", label: "Accent" },
              { hex: "#FBFBFA", label: "Background" },
            ],
          },
        };
      } else {
        // reference / visual image
        canvasItem = {
          id: `ref-${Date.now()}`,
          type: "reference",
          x: 200 + offset,
          y: 160 + offset,
          width: 260,
          height: 320,
          zIndex: maxZ + 1,
          content: {
            title: item.title ?? item.name ?? "Reference",
            source: item.creator ?? item.source ?? "Curated",
            url: item.imageUrl ?? item.content?.url ?? "",
            sourceUrl: item.sourceUrl ?? item.content?.sourceUrl ?? "",
            tags: item.tags ?? item.content?.tags ?? [],
            note: item.notes ?? item.content?.note ?? "",
          },
        };
      }

      const updatedObjects = [...existingObjects, canvasItem];

      // Background Firestore & REST sync
      updateFirestoreProject(projectId, { canvasObjects: updatedObjects }).catch((err) =>
        console.warn("Firestore canvas sync error:", err)
      );
      saveFirestoreCanvasObjects(projectId, updatedObjects, user?.uid).catch((err) =>
        console.warn("Firestore canvas objects subcollection sync error:", err)
      );
      if (user?.uid) {
        addFirestoreProjectItem(projectId, {
          libraryItemId: item.id,
          type: item.type || "reference",
          title: item.title ?? item.name ?? "Creative Item",
          provider: item.provider || item.source || "internal",
          previewUrl: item.imageUrl || item.content?.url || "",
          sourceUrl: item.sourceUrl || item.content?.sourceUrl || "",
          metadata: item.metadata || item.content || {},
          addedBy: user.uid,
        }).catch((err) => console.warn("Firestore add project item fallback:", err));
      }

      return prev.map((p) =>
        p.id === projectId
          ? {
            ...p,
            canvasObjects: updatedObjects,
            lastEdited: "Just now",
          }
          : p
      );
    });
  };

  const linkItemToProject = (libraryItemId: string, projectId: string) => {
    setLibrary((prev) =>
      prev.map((item) => {
        if (item.id !== libraryItemId) return item;
        const currentProjects = item.projectIds || [];
        if (currentProjects.includes(projectId)) return item;
        return { ...item, projectIds: [...currentProjects, projectId] };
      })
    );

    if (user?.uid) {
      const libItem = library.find((l) => l.id === libraryItemId);
      if (libItem) {
        addFirestoreProjectItem(projectId, {
          libraryItemId: libItem.id,
          type: libItem.type,
          title: libItem.name,
          provider: libItem.source || "internal",
          previewUrl: libItem.imageUrl,
          sourceUrl: libItem.sourceUrl,
          metadata: libItem.content,
          addedBy: user.uid,
        }).catch((err) => console.warn("Firestore link item fallback:", err));
      }
    }
  };

  // Set a palette as the project's current color exploration: updates the
  // visual preview and upserts a single "applied" palette object on the canvas.
  const applyPaletteToProject = (id: string, palette: PalettePayload) => {
    const project = projects.find((p) => p.id === id);
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const objects = p.canvasObjects || [];
        const paletteId = `palette-applied-${id}`;
        const existing = objects.find((o) => o.id === paletteId);
        const maxZ = objects.reduce((m, o) => Math.max(m, o.zIndex ?? 0), 0);
        const paletteItem: CanvasItem = {
          id: paletteId,
          type: "palette",
          x: existing?.x ?? 460,
          y: existing?.y ?? 60,
          width: existing?.width ?? 320,
          height: existing?.height ?? 160,
          zIndex: maxZ + 1,
          content: { name: palette.name, colors: palette.colors },
        };
        const canvasObjects = existing
          ? objects.map((o) => (o.id === paletteId ? paletteItem : o))
          : [...objects, paletteItem];
        return {
          ...p,
          canvasObjects,
          visualPreview: { ...p.visualPreview, palette: palette.colors.map((c) => c.hex) },
          currentFocus: "Color Exploration",
          lastEdited: "Just now",
        };
      })
    );
    if (project) {
      setActivity((prev) => [
        {
          id: `act-${Date.now()}`,
          action: "You applied a new color palette",
          project: project.name,
          timeAgo: "Just now",
        },
        ...prev,
      ]);
    }
  };

  // Add a palette object to the canvas and link it into a direction's members.
  const attachPaletteToDirection = (id: string, directionId: string, palette: PalettePayload) => {
    const project = projects.find((p) => p.id === id);
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const objects = p.canvasObjects || [];
        const dir = objects.find((o) => o.id === directionId);
        if (!dir) return p;
        const paletteId = `palette-${Date.now()}`;
        const maxZ = objects.reduce((m, o) => Math.max(m, o.zIndex ?? 0), 0);
        const paletteItem: CanvasItem = {
          id: paletteId,
          type: "palette",
          x: dir.x + 24,
          y: dir.y + dir.height + 24,
          width: 320,
          height: 160,
          zIndex: maxZ + 1,
          content: { name: palette.name, colors: palette.colors },
        };
        const updated = objects.map((o) =>
          o.id === directionId
            ? {
                ...o,
                content: {
                  ...o.content,
                  memberIds: [...(o.content?.memberIds || []), paletteId],
                },
              }
            : o
        );
        return { ...p, canvasObjects: [...updated, paletteItem], lastEdited: "Just now" };
      })
    );
    if (project) {
      setActivity((prev) => [
        {
          id: `act-${Date.now()}`,
          action: "You added a palette to a direction",
          project: project.name,
          timeAgo: "Just now",
        },
        ...prev,
      ]);
    }
  };

  // ── Publish Direction to Client Review ─────────────────────────────────
  const publishDirection = (
    projectId: string,
    directionItem: CanvasItem,
    currentCanvasItems?: CanvasItem[]
  ) => {
    const project = projects.find((p) => p.id === projectId);
    const canvasObjects =
      currentCanvasItems && currentCanvasItems.length > 0
        ? currentCanvasItems
        : project?.canvasObjects || [];

    // 1. Resolve members safely from canvasObjects (snapshot only public data)
    const explicitMemberIds: string[] = directionItem.content?.memberIds || [];
    const dirX = directionItem.x ?? 0;
    const dirY = directionItem.y ?? 0;
    const dirW = directionItem.width || 600;
    const dirH = directionItem.height || 450;

    const childObjects = canvasObjects.filter((obj) => {
      if (obj.id === directionItem.id) return false;
      if (explicitMemberIds.includes(obj.id)) return true;
      if (obj.parentId === directionItem.id || obj.sectionId === directionItem.id) return true;

      // Check geometric containment or overlap inside direction/section boundaries
      const objX = obj.x ?? 0;
      const objY = obj.y ?? 0;
      const objW = obj.width || 100;
      const objH = obj.height || 80;
      const objCenterX = objX + objW / 2;
      const objCenterY = objY + objH / 2;

      const isInside =
        objCenterX >= dirX &&
        objCenterX <= dirX + dirW &&
        objCenterY >= dirY &&
        objCenterY <= dirY + dirH;

      const overlaps =
        objX < dirX + dirW &&
        objX + objW > dirX &&
        objY < dirY + dirH &&
        objY + objH > dirY;

      return isInside || overlaps;
    });

    let effectiveObjects =
      childObjects.length > 0
        ? childObjects
        : canvasObjects.filter(
            (o) =>
              o.id !== directionItem.id &&
              ["font", "color", "palette", "reference", "image", "note", "text"].includes(o.type)
          );

    // If direction does not yet include a color palette, automatically include any palette or color objects on canvas
    const hasPalette = effectiveObjects.some((o) => o.type === "palette" || o.type === "color");
    if (!hasPalette) {
      const canvasPalettes = canvasObjects.filter(
        (o) => o.id !== directionItem.id && (o.type === "palette" || o.type === "color")
      );
      if (canvasPalettes.length > 0) {
        effectiveObjects = [...effectiveObjects, ...canvasPalettes];
      } else if (project?.visualPreview?.palette && project.visualPreview.palette.length > 0) {
        effectiveObjects.push({
          id: `palette-proj-${projectId}`,
          type: "palette",
          x: dirX + 20,
          y: dirY + 20,
          width: 320,
          height: 160,
          zIndex: 1,
          content: {
            name: `${project.name || "Brand"} Palette`,
            colors: project.visualPreview.palette,
          },
        });
      }
    }

    const memberIds = Array.from(
      new Set([...explicitMemberIds, ...effectiveObjects.map((o) => o.id)])
    );
    const members = effectiveObjects.map((obj) => ({
      id: obj.id,
      type: obj.type,
      content: obj.content ? JSON.parse(JSON.stringify(obj.content)) : {},
    }));

    // 2. Compute next sequential version for this direction
    const existingVersions = directionVersions.filter((v) => v.directionId === directionItem.id);
    const nextVersionNum =
      existingVersions.length > 0
        ? Math.max(...existingVersions.map((v) => v.version)) + 1
        : 1;

    // 3. Create frozen immutable snapshot of the direction
    const snapshot: PublishedDirectionSnapshot = {
      name:
        directionItem.content?.name ||
        directionItem.content?.label ||
        directionItem.content?.title ||
        `Direction ${nextVersionNum}`,
      description: directionItem.content?.description || "",
      memberIds,
      members,
    };

    const newVersion: DirectionVersion = {
      id: `ver-${directionItem.id}-${nextVersionNum}-${Date.now()}`,
      directionId: directionItem.id,
      version: nextVersionNum,
      status: "PUBLISHED",
      createdAt: new Date().toISOString(),
      snapshot,
    };

    // 4. Create or update ClientReview for this project + direction
    const existingReviewIndex = clientReviews.findIndex(
      (r) => r.projectId === projectId && r.directionId === directionItem.id
    );

    let updatedReview: ClientReview;
    if (existingReviewIndex >= 0) {
      updatedReview = {
        ...clientReviews[existingReviewIndex],
        versionId: newVersion.id,
        status: "PUBLISHED",
        publishedAt: new Date().toISOString(),
      };
      setClientReviews((prev) => {
        const next = [...prev];
        next[existingReviewIndex] = updatedReview;
        return next;
      });
    } else {
      updatedReview = {
        id: `rev-${Date.now()}`,
        projectId,
        directionId: directionItem.id,
        versionId: newVersion.id,
        status: "PUBLISHED",
        publishedAt: new Date().toISOString(),
      };
      setClientReviews((prev) => [updatedReview, ...prev]);
    }

    setDirectionVersions((prev) => [newVersion, ...prev]);

    // 5. Ensure an active ReviewShare exists for this project so the Client Portal is immediately accessible
    let share = reviewShares.find((s) => s.projectId === projectId && s.active);
    if (!share) {
      const token = Array.from(crypto.getRandomValues(new Uint8Array(12)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      share = {
        id: `share-${Date.now()}`,
        token,
        projectId,
        directionId: directionItem.id,
        accessLevel: "COMMENT",
        createdAt: new Date().toISOString(),
        active: true,
      };
      setReviewShares((prev) => [share!, ...prev]);
    } else if (!share.directionId) {
      share = { ...share, directionId: directionItem.id };
      setReviewShares((prev) => prev.map((s) => (s.id === share!.id ? share! : s)));
    }

    // 6. Update direction canvas item with published version info
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const baseCanvas =
          currentCanvasItems && currentCanvasItems.length > 0
            ? currentCanvasItems
            : p.canvasObjects || [];
        const updatedCanvas = baseCanvas.map((obj) => {
          if (obj.id !== directionItem.id) return obj;
          return {
            ...obj,
            content: {
              ...obj.content,
              published: true,
              publishedVersion: nextVersionNum,
              lastPublishedAt: newVersion.createdAt,
            },
          };
        });
        return { ...p, canvasObjects: updatedCanvas, lastEdited: "Just now" };
      })
    );

    // 7. Record activity
    setActivity((prev) => [
      {
        id: `act-${Date.now()}`,
        action: `You published ${snapshot.name} (v${nextVersionNum}) for client review`,
        project: project?.name || "Project",
        timeAgo: "Just now",
      },
      ...prev,
    ]);

    // Background Firestore & REST sync
    createFirestoreDirectionVersion(
      projectId,
      directionItem.id,
      snapshot,
      user?.uid || "designer"
    ).catch((err) => console.warn("Firestore direction version fallback:", err));

    createFirestoreReviewAndShare(
      projectId,
      directionItem.id,
      newVersion.id,
      snapshot,
      project?.name || "Project",
      project?.client || "Client",
      share.accessLevel
    ).catch((err) => console.warn("Firestore review share fallback:", err));

    fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        projectName: project?.name,
        clientName: project?.client,
        directionId: directionItem.id,
        token: share.token,
        accessLevel: share.accessLevel || "COMMENT",
        name: snapshot.name,
        description: snapshot.description,
        canvasItems: effectiveObjects,
      }),
    }).catch((err) => console.warn("API publish direction error:", err));

    return { version: newVersion, review: updatedReview, share };
  };

  const getReviewsForClient = (clientNameOrId: string) => {
    const targetClient = clients.find(
      (c) => c.id === clientNameOrId || c.name.toLowerCase() === clientNameOrId.toLowerCase()
    );
    const clientName = targetClient ? targetClient.name.toLowerCase() : clientNameOrId.toLowerCase();

    const clientProjectIds = new Set(
      projects
        .filter((p) => (p.client || "").toLowerCase() === clientName)
        .map((p) => p.id)
    );

    const publishedReviews = clientReviews.filter(
      (r) => clientProjectIds.has(r.projectId) && r.status === "PUBLISHED"
    );

    return publishedReviews
      .map((review) => {
        const version = directionVersions.find((v) => v.id === review.versionId);
        const project = projects.find((p) => p.id === review.projectId);
        return {
          review,
          version: version!,
          project,
        };
      })
      .filter((item) => !!item.version);
  };

  const getDirectionVersions = (directionId: string) => {
    return directionVersions
      .filter((v) => v.directionId === directionId)
      .sort((a, b) => b.version - a.version);
  };

  const getReviewDetails = (reviewId: string) => {
    const review = clientReviews.find((r) => r.id === reviewId);
    if (!review) return undefined;
    const version = directionVersions.find((v) => v.id === review.versionId);
    if (!version) return undefined;
    const project = projects.find((p) => p.id === review.projectId);
    return { review, version, project };
  };

  // ── Comments ──────────────────────────────────────────────────────────────
  const addComment = (data: Omit<Comment, "id" | "createdAt" | "resolved">): Comment => {
    const newComment: Comment = {
      ...data,
      id: `cmt-${Date.now()}`,
      createdAt: new Date().toISOString(),
      resolved: false,
    };
    setComments((prev) => [newComment, ...prev]);

    // Background Firestore sync
    const rev = clientReviews.find(
      (r) => r.directionId === data.directionId && (r.versionId === data.versionId || !data.versionId)
    );
    if (rev) {
      addFirestoreReviewComment(data.projectId, rev.id, {
        id: newComment.id,
        reviewId: rev.id,
        directionId: data.directionId,
        versionId: data.versionId,
        authorId: data.authorId,
        authorName: data.authorName,
        parentCommentId: data.parentId,
        body: data.body,
        targetObjectId: data.targetObjectId,
        x: data.positionX,
        y: data.positionY,
      }).catch((err) => console.warn("Firestore add comment fallback:", err));
    }

    // Log activity when client comments
    if (data.authorId !== "designer") {
      const project = projects.find((p) => p.id === data.projectId);
      setActivity((prev) => [
        {
          id: `act-${Date.now()}`,
          action: `${data.authorName} commented on a direction`,
          project: project?.name || "Project",
          timeAgo: "Just now",
        },
        ...prev,
      ]);
    }
    return newComment;
  };

  const resolveComment = (id: string) => {
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, resolved: true } : c))
    );

    // Background Firestore sync
    const c = comments.find((cmt) => cmt.id === id);
    const rev = c ? clientReviews.find((r) => r.directionId === c.directionId) : null;
    if (c && rev) {
      toggleFirestoreCommentResolved(c.projectId, rev.id, id, true).catch((err) =>
        console.warn("Firestore resolve comment fallback:", err)
      );
    }
  };

  const deleteComment = (id: string) => {
    setComments((prev) => prev.filter((c) => c.id !== id));
  };

  const getComments = (directionId: string, versionId: string): Comment[] => {
    return comments
      .filter((c) => c.directionId === directionId && c.versionId === versionId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  };

  // ── Approvals ─────────────────────────────────────────────────────────────
  const submitApproval = (data: Omit<Approval, "id" | "createdAt">): Approval => {
    const newApproval: Approval = {
      ...data,
      id: `apr-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    // Upsert (one approval per direction+version)
    setApprovals((prev) => {
      const idx = prev.findIndex(
        (a) => a.directionId === data.directionId && a.versionId === data.versionId
      );
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = newApproval;
        return updated;
      }
      return [newApproval, ...prev];
    });
    // Update clientReview status
    setClientReviews((prev) =>
      prev.map((r) =>
        r.directionId === data.directionId && r.versionId === data.versionId
          ? { ...r, status: data.status as any }
          : r
      )
    );

    // Also update direction item in projects' canvasObjects so canvas reflects decision immediately
    setProjects((prev) =>
      prev.map((p) => {
        if (!p.canvasObjects || p.canvasObjects.length === 0) return p;
        const hasDir = p.canvasObjects.some((o) => o.id === data.directionId);
        if (!hasDir) return p;
        const updated = p.canvasObjects.map((obj) => {
          if (obj.id === data.directionId) {
            return {
              ...obj,
              content: {
                ...obj.content,
                reviewStatus: data.status,
                approvedBy: data.clientName,
                approvedAt: newApproval.createdAt,
              },
            };
          }
          return obj;
        });
        return { ...p, canvasObjects: updated };
      })
    );

    // Log activity
    const project = projects.find((p) =>
      clientReviews.some(
        (r) => r.directionId === data.directionId && r.projectId === p.id
      )
    );

    // Background Firestore sync
    const rev = clientReviews.find(
      (r) => r.directionId === data.directionId && r.versionId === data.versionId
    );
    if (rev && project) {
      submitFirestoreApproval({
        id: newApproval.id,
        reviewId: rev.id,
        projectId: project.id,
        directionId: data.directionId,
        directionVersionId: data.versionId,
        approvedBy: data.clientName,
        approvalType: data.status === "APPROVED" ? "APPROVED" : "CHANGES_REQUESTED",
        comment: data.comment,
      }).catch((err) => console.warn("Firestore submit approval fallback:", err));
    }

    const actionLabel =
      data.status === "APPROVED"
        ? `${data.clientName} approved a direction`
        : `${data.clientName} requested changes on a direction`;
    setActivity((prev) => [
      {
        id: `act-${Date.now()}`,
        action: actionLabel,
        project: project?.name || "Project",
        timeAgo: "Just now",
      },
      ...prev,
    ]);
    return newApproval;
  };

  const getApproval = (directionId: string, versionId: string): Approval | undefined => {
    return approvals.find(
      (a) => a.directionId === directionId && a.versionId === versionId
    );
  };

  // ── ReviewShares ──────────────────────────────────────────────────────────
  const createReviewShare = (
    data: Omit<ReviewShare, "id" | "token" | "createdAt" | "active">
  ): ReviewShare => {
    const token = Array.from(crypto.getRandomValues(new Uint8Array(12)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const newShare: ReviewShare = {
      ...data,
      id: `share-${Date.now()}`,
      token,
      createdAt: new Date().toISOString(),
      active: true,
    };
    setReviewShares((prev) => [newShare, ...prev]);

    // Persist to database immediately so share link is active
    fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: data.projectId,
        directionId: data.directionId || "direction-default",
        token,
        accessLevel: data.accessLevel || "COMMENT",
        name: "Creative Direction Review",
        canvasItems: [],
      }),
    }).catch((err) => console.warn("Failed to persist created share to API:", err));

    return newShare;
  };

  const getShareByToken = (token: string): ReviewShare | undefined => {
    return reviewShares.find((s) => s.token === token && s.active);
  };

  const deactivateShare = (id: string) => {
    setReviewShares((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: false } : s))
    );
  };

  const updateShareAccess = (id: string, accessLevel: AccessLevel) => {
    setReviewShares((prev) =>
      prev.map((s) => (s.id === id ? { ...s, accessLevel } : s))
    );
  };

  const getSharesForProject = (projectId: string): ReviewShare[] => {
    return reviewShares.filter((s) => s.projectId === projectId);
  };

  return (
    <ProjectsContext.Provider
      value={{
        projects,
        clients,
        activity,
        library,
        directionVersions,
        clientReviews,
        comments,
        approvals,
        reviewShares,
        createProject,
        createClient,
        deleteProject,
        deleteClient,
        getClient,
        updateClient,
        getProject,
        updateProjectCanvas,
        updateBrandBrain,
        saveToLibrary,
        removeFromLibrary,
        addInspirationToCanvas,
        linkItemToProject,
        applyPaletteToProject,
        attachPaletteToDirection,
        publishDirection,
        getReviewsForClient,
        getDirectionVersions,
        getReviewDetails,
        addComment,
        resolveComment,
        deleteComment,
        getComments,
        submitApproval,
        getApproval,
        createReviewShare,
        getShareByToken,
        deactivateShare,
        updateShareAccess,
        getSharesForProject,
      }}
    >
      {children}
    </ProjectsContext.Provider>
  );
}

export function useProjects() {
  const context = useContext(ProjectsContext);
  if (!context) {
    throw new Error("useProjects must be used within a ProjectsProvider");
  }
  return context;
}
