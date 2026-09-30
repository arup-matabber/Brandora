export interface BrandBrain {
  story: {
    overview: string;
    mission: string;
    coreIdea: string;
  };
  whatTheyDo?: string;
  mission?: string;
  audience: {
    description: string;
    needs: string;
    problems: string;
    motivations: string;
  };
  customerNeeds?: string;
  positioning: {
    statement: string;
    differentiator: string;
    competitiveContext: string;
    opportunity: string;
  };
  differentiator?: string;
  competitors?: string;
  values?: string[];
  personality: {
    traits: string[];
    voice: string;
  };
  tone?: string;
  voice?: string;
  visualDirection: {
    shouldFeelLike: string[];
    shouldNotFeelLike: string[];
  };
  shouldFeelLike?: string[];
  shouldNotFeelLike?: string[];
  opportunities?: string;
}

export interface UploadedMaterial {
  id: string;
  name: string;
  size: string;
  type: string;
}

export type CanvasObjectType =
  | "text"
  | "note"
  | "image"
  | "font"
  | "color"
  | "palette"
  | "reference"
  | "brand_brain"
  | "section"
  | "direction";

export interface CanvasItem {
  id: string;
  type: CanvasObjectType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  zIndex?: number;
  groupId?: string;
  locked?: boolean;
  archived?: boolean;
  parentId?: string | null;
  sectionId?: string | null;
  metadata?: Record<string, any>;
  content: Record<string, any>;
}

export interface LibraryItem {
  id: string;
  type: "font" | "color" | "palette" | "reference" | "direction";
  name: string;
  savedAt: string;
  content: Record<string, any>;
  projectIds?: string[];
  notes?: string;
  source?: string;
  sourceUrl?: string;
  tags?: string[];
  imageUrl?: string;
}

export interface ClientRecord {
  id: string;
  name: string;
  contact?: string;
  company?: string;
  email?: string;
  phone?: string;
  status: "Lead" | "Active" | "Inactive";
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  projectsCount?: number;
}

export interface BrandProject {
  id: string;
  name: string;
  client: string;
  type: string;
  status: "Active" | "Draft" | "In Review";
  lastEdited: string;
  currentFocus: string;
  tagline: string;
  description?: string;
  notes?: string;
  materials?: UploadedMaterial[];
  brandBrain?: BrandBrain;
  canvasObjects?: CanvasItem[];
  visualPreview: {
    fontSpecimen: string;
    secondaryFont: string;
    monogram: string;
    palette: string[];
    gridAccent: string;
    aspectRatio?: string;
  };
}

export type DirectionVersionStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "CHANGES_REQUESTED"
  | "APPROVED";

export interface PublishedDirectionSnapshot {
  name: string;
  description: string;
  memberIds?: string[];
  members: {
    id: string;
    type: CanvasObjectType;
    content: Record<string, any>;
  }[];
}

export interface DirectionVersion {
  id: string;
  directionId: string;
  version: number;
  versionNumber?: number;
  publishedBy?: string;
  notes?: string;
  status: DirectionVersionStatus;
  createdAt: string;
  snapshot: PublishedDirectionSnapshot;
}

export interface ClientReview {
  id: string;
  projectId: string;
  directionId: string;
  versionId: string;
  status: DirectionVersionStatus;
  publishedAt: string;
  createdAt?: string;
  updatedAt?: string;
}

// ── Comment ────────────────────────────────────────────────────────────────
export interface Comment {
  id: string;
  projectId: string;
  directionId: string;
  versionId: string;
  /** "designer" or a client identifier */
  authorId: string;
  authorName: string;
  body: string;
  /** undefined = top-level, set = reply */
  parentId?: string;
  targetObjectId?: string | null;
  x?: number | null;
  y?: number | null;
  positionX?: number | null;
  positionY?: number | null;
  createdAt: string;
  resolved: boolean;
}

// ── Approval ───────────────────────────────────────────────────────────────
export type ApprovalStatus = "PENDING" | "CHANGES_REQUESTED" | "APPROVED";

export interface Approval {
  id: string;
  directionId: string;
  versionId: string;
  clientId: string;
  clientName: string;
  status: ApprovalStatus;
  /** Optional change-request note */
  comment?: string;
  createdAt: string;
}

// ── ReviewShare ────────────────────────────────────────────────────────────
export type AccessLevel = "VIEW" | "COMMENT" | "EDIT";

export interface ReviewShare {
  id: string;
  projectId: string;
  /** Optional — linked CRM client record */
  clientId?: string;
  directionId?: string;
  accessLevel: AccessLevel;
  /** Random token used in the share URL */
  token: string;
  createdAt: string;
  expiresAt?: string;
  active: boolean;
}

export interface CreativeLibraryCategory {
  id: string;
  title: string;
  count: number;
  unit: string;
  previewNote: string;
}

export interface ActivityItemData {
  id: string;
  action: string;
  project: string;
  timeAgo: string;
}

export const activeUser = {
  name: "Subhajit",
  fullName: "Subhajit Roy",
  role: "Independent Brand Designer",
  initials: "SR",
  studio: "Studio Opalite",
};

export const continueWorkingProject: BrandProject | null = null;
export const recentProjects: BrandProject[] = [
  {
    id: "orblinn",
    name: "ORBLINN",
    client: "Orblinn",
    type: "Brand Identity",
    status: "Active",
    lastEdited: "2 days ago",
    currentFocus: "Typography exploration",
    tagline: "A quiet, editorial identity for a considered lifestyle brand.",
    brandBrain: generateMockBrandBrain("ORBLINN", "Brand Identity", "Orblinn"),
    canvasObjects: [
      {
        id: "bb-orblinn",
        type: "brand_brain",
        x: 80,
        y: 60,
        width: 320,
        height: 380,
        zIndex: 1,
        content: {
          title: "ORBLINN",
          client: "Orblinn",
          brain: generateMockBrandBrain("ORBLINN", "Brand Identity", "Orblinn"),
        },
      },
    ],
    visualPreview: {
      fontSpecimen: "ORBLINN",
      secondaryFont: "Satoshi & Editorial Serif",
      monogram: "O",
      palette: ["#191918", "#5A5A55", "#D6C7B0", "#F7F7F4"],
      gridAccent: "12-col / 8pt baseline",
    },
  },
  {
    id: "nova",
    name: "NOVA",
    client: "Nova",
    type: "Rebrand",
    status: "In Review",
    lastEdited: "5 days ago",
    currentFocus: "Client review",
    tagline: "A contemporary rebrand for a calm wellness studio.",
    brandBrain: generateMockBrandBrain("NOVA", "Rebrand", "Nova"),
    canvasObjects: [
      {
        id: "bb-nova",
        type: "brand_brain",
        x: 80,
        y: 60,
        width: 320,
        height: 380,
        zIndex: 1,
        content: {
          title: "NOVA",
          client: "Nova",
          brain: generateMockBrandBrain("NOVA", "Rebrand", "Nova"),
        },
      },
    ],
    visualPreview: {
      fontSpecimen: "NOVA",
      secondaryFont: "Geometric Grotesque",
      monogram: "N",
      palette: ["#001B29", "#4DD4CD", "#E2F5F3", "#FBFBFA"],
      gridAccent: "8-col / 6pt baseline",
    },
  },
];
export const recentActivityItems: ActivityItemData[] = [];

export const initialClients: ClientRecord[] = [
  {
    id: "client-orblinn",
    name: "Orblinn",
    contact: "Lena Voss",
    company: "Orblinn",
    email: "studio@orblinn.com",
    phone: "+31 20 1234 567",
    status: "Active",
    notes:
      "Lifestyle brand. Prefers a quiet, editorial direction. Weekly check-ins on Thursdays.",
    createdAt: "2026-08-04T09:00:00.000Z",
    updatedAt: "2026-09-10T14:30:00.000Z",
    projectsCount: 1,
  },
  {
    id: "client-nova",
    name: "Nova",
    contact: "Marcus Reid",
    company: "Nova Wellness",
    email: "hello@novawellness.co",
    phone: "+44 20 7946 0018",
    status: "Active",
    notes: "Rebrand for a wellness studio. Marcus is the decision-maker. Tight timeline.",
    createdAt: "2026-07-22T10:00:00.000Z",
    updatedAt: "2026-09-07T11:15:00.000Z",
    projectsCount: 1,
  },
  {
    id: "client-marlow",
    name: "Marlow & Co.",
    contact: "Priya Nair",
    company: "Marlow & Co.",
    email: "inquiries@marlowco.com",
    phone: "+1 415 555 0142",
    status: "Lead",
    notes: "Inbound from the website. Packaging identity inquiry. Not yet started.",
    createdAt: "2026-09-01T08:00:00.000Z",
    updatedAt: "2026-09-08T09:00:00.000Z",
  },
];

export const creativeLibraryCategories: CreativeLibraryCategory[] = [
  {
    id: "fonts",
    title: "Fonts",
    count: 0,
    unit: "families",
    previewNote: "Archived font families and variable typefaces",
  },
  {
    id: "colors",
    title: "Colors",
    count: 0,
    unit: "systems",
    previewNote: "Curated brand swatches and palette systems",
  },
  {
    id: "references",
    title: "References",
    count: 0,
    unit: "curations",
    previewNote: "Saved tactile scans and visual references",
  },
  {
    id: "saved-ideas",
    title: "Saved Ideas",
    count: 0,
    unit: "boards",
    previewNote: "Mood directions and preliminary concept boards",
  },
];

export function generateMockBrandBrain(
  name: string,
  type: string,
  client: string,
  notes?: string
): BrandBrain {
  const cleanName = name || "Brand";
  const cleanClient = client || "Client Studio";

  return {
    story: {
      overview: `${cleanName} is established as an intentional, design-led brand created in partnership with ${cleanClient}. It bridges functional craftsmanship with understated sensory experiences.`,
      mission: `To bring clarity, quiet elegance, and sustainable enduring value to the ${type.toLowerCase()} space.`,
      coreIdea: `Restrained materiality meets uncompromising modern utility.`,
    },
    whatTheyDo: `${cleanName} designs and crafts refined experiences bridging functional utility with sculptural presence.`,
    mission: `To bring clarity, quiet elegance, and sustainable enduring value to the ${type.toLowerCase()} space.`,
    audience: {
      description: `Discerning design-conscious consumers and cultural professionals who appreciate quiet luxury and enduring quality.`,
      needs: `Clarity of purpose, tactile quality, and products that enrich their daily ritual without visual noise.`,
      problems: `Over-complicated brand narratives, excessive ornamentation, and lack of genuine craftsmanship.`,
      motivations: `Seeking authenticity, considered details, and brands that align with an architectural, calm lifestyle.`,
    },
    customerNeeds: `Clarity of purpose, tactile quality, and products that enrich their daily ritual without visual noise.`,
    positioning: {
      statement: `For thoughtful individuals who reject fleeting trends, ${cleanName} is the definitive brand identity that pairs timeless minimalist discipline with human warmth.`,
      differentiator: `Radical simplicity, deliberate proportions, and uncompromising finish.`,
      competitiveContext: `Stands apart from loud, hyper-commercialized mass brands and cold sterile corporate identities.`,
      opportunity: `Establishing a distinct cultural niche that commands reverence through subtle, high-craft touchpoints.`,
    },
    differentiator: `Radical simplicity, deliberate proportions, and uncompromising finish.`,
    competitors: `Loud, hyper-commercialized mass brands and cold sterile corporate identities.`,
    values: ["Radical Simplicity", "Tactile Craftsmanship", "Enduring Quality", "Sensory Restraint"],
    personality: {
      traits: ["Bold", "Warm", "Intelligent", "Playful"],
      voice: `Clear, measured, and confident. Avoids corporate jargon; speaks like an architect conversing with a craftsman.`,
    },
    tone: "Articulate, measured, and effortlessly elevated.",
    voice: `Clear, measured, and confident. Avoids corporate jargon; speaks like an architect conversing with a craftsman.`,
    visualDirection: {
      shouldFeelLike: ["Editorial", "Confident", "Human", "Contemporary"],
      shouldNotFeelLike: ["Generic", "Corporate", "Cold", "Over-designed"],
    },
    shouldFeelLike: ["Editorial", "Confident", "Human", "Contemporary"],
    shouldNotFeelLike: ["Generic", "Corporate", "Cold", "Over-designed"],
    opportunities: `Establishing a distinct cultural niche that commands reverence through subtle, high-craft touchpoints.`,
  };
}
