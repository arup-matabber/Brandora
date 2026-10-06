import { doc, getDoc, updateDoc, serverTimestamp } from "@/lib/firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { BrandBrain } from "@/lib/data";

export interface StructuredBrandBrain {
  story: {
    overview: string;
    mission: string;
    coreIdea: string;
  };
  whatTheyDo: string;
  mission: string;
  audience: {
    description: string;
    needs: string;
    problems: string;
    motivations: string;
  };
  customerNeeds: string;
  positioning: {
    statement: string;
    differentiator: string;
    competitiveContext: string;
    opportunity: string;
  };
  differentiator: string;
  competitors: string;
  values: string[];
  personality: {
    traits: string[];
    voice: string;
  };
  tone: string;
  voice: string;
  visualDirection: {
    shouldFeelLike: string[];
    shouldNotFeelLike: string[];
  };
  shouldFeelLike: string[];
  shouldNotFeelLike: string[];
  opportunities: string;
}

export function normalizeBrandBrain(input?: any): StructuredBrandBrain {
  const storyObj = input?.story || {};
  const audienceObj = input?.audience || {};
  const posObj = input?.positioning || {};
  const persObj = input?.personality || {};
  const vdObj = input?.visualDirection || {};

  const traits = Array.isArray(persObj.traits)
    ? persObj.traits
    : Array.isArray(input?.personality)
    ? input.personality
    : ["Bold", "Warm", "Intelligent", "Contemporary"];

  const shouldFeelLike = Array.isArray(vdObj.shouldFeelLike)
    ? vdObj.shouldFeelLike
    : Array.isArray(input?.shouldFeelLike)
    ? input.shouldFeelLike
    : ["Editorial", "Confident", "Human"];

  const shouldNotFeelLike = Array.isArray(vdObj.shouldNotFeelLike)
    ? vdObj.shouldNotFeelLike
    : Array.isArray(input?.shouldNotFeelLike)
    ? input.shouldNotFeelLike
    : ["Generic", "Cold", "Corporate"];

  const mission = input?.mission || storyObj.mission || "To bring intentional clarity to the space.";
  const voice = input?.voice || persObj.voice || "Clear, confident, and measured.";
  const differentiator = input?.differentiator || posObj.differentiator || "Radical simplicity and deliberate finish.";
  const customerNeeds = input?.customerNeeds || audienceObj.needs || "Clarity of purpose and elevated craftsmanship.";
  const opportunities = input?.opportunities || posObj.opportunity || "Establishing a distinct cultural niche.";

  return {
    story: {
      overview: storyObj.overview || input?.story || "Design-led brand crafted with intentional simplicity.",
      mission,
      coreIdea: storyObj.coreIdea || "Restrained materiality meets modern utility.",
    },
    whatTheyDo: input?.whatTheyDo || storyObj.overview || "High-craft brand and visual system design.",
    mission,
    audience: {
      description: audienceObj.description || input?.audience || "Discerning design-conscious professionals.",
      needs: customerNeeds,
      problems: audienceObj.problems || "Excessive ornamentation and generic noise.",
      motivations: audienceObj.motivations || "Authenticity and considered aesthetics.",
    },
    customerNeeds,
    positioning: {
      statement: posObj.statement || input?.positioning || "The definitive brand identity pairing discipline with warmth.",
      differentiator,
      competitiveContext: posObj.competitiveContext || "Stands apart from loud mass brands.",
      opportunity: opportunities,
    },
    differentiator,
    competitors: input?.competitors || posObj.competitiveContext || "Mass corporate labels.",
    values: Array.isArray(input?.values) ? input.values : ["Craftsmanship", "Restraint", "Authenticity"],
    personality: {
      traits,
      voice,
    },
    tone: input?.tone || "Thoughtful, articulate, and elevated",
    voice,
    visualDirection: {
      shouldFeelLike,
      shouldNotFeelLike,
    },
    shouldFeelLike,
    shouldNotFeelLike,
    opportunities,
  };
}

export async function getProjectBrandBrain(projectId: string): Promise<StructuredBrandBrain | null> {
  try {
    const projectRef = doc(db, "projects", projectId);
    const snap = await getDoc(projectRef);
    if (!snap.exists()) return null;
    const data = snap.data();
    return normalizeBrandBrain(data.brandBrain);
  } catch (error) {
    console.error("Error fetching project Brand Brain:", error);
    return null;
  }
}

export async function updateProjectBrandBrain(
  projectId: string,
  brain: Partial<StructuredBrandBrain> | BrandBrain
): Promise<void> {
  const projectRef = doc(db, "projects", projectId);
  const normalized = normalizeBrandBrain(brain);
  await updateDoc(projectRef, {
    brandBrain: normalized,
    updatedAt: serverTimestamp(),
  });
}
