export type PinterestFormat = "Brand identity" | "Typography" | "Packaging" | "Editorial" | "Interiors" | "Digital";
export type PinterestMood = "Quiet luxury" | "Warm minimalism" | "Bold editorial" | "Craft" | "Contemporary";

export interface PinterestPin {
  id: string;
  title: string;
  creator: string;
  imageUrl: string;
  format: PinterestFormat;
  mood: PinterestMood;
  colors: string[];
  tags: string[];
  sourceQuery: string;
}

// V1 discovery seed. Replace this module's data source with an authenticated
// Pinterest API adapter once the product has secure OAuth credentials.
export const pinterestFeed: PinterestPin[] = [
  { id: "pin-quiet-forms", title: "Quiet forms for a considered identity", creator: "Studio Norr", imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=900&q=85", format: "Brand identity", mood: "Quiet luxury", colors: ["Neutral", "Black"], tags: ["identity", "wordmark", "restraint"], sourceQuery: "quiet luxury branding" },
  { id: "pin-editorial-type", title: "Editorial type in a small-batch journal", creator: "Aurelia Press", imageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=900&q=85", format: "Typography", mood: "Bold editorial", colors: ["Cream", "Black"], tags: ["serif", "editorial", "print"], sourceQuery: "editorial typography" },
  { id: "pin-tactile-packaging", title: "Tactile packaging, warm and unhurried", creator: "Olive Workshop", imageUrl: "https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?auto=format&fit=crop&w=900&q=85", format: "Packaging", mood: "Craft", colors: ["Earth", "Cream"], tags: ["packaging", "paper", "material"], sourceQuery: "tactile packaging design" },
  { id: "pin-soft-grid", title: "A soft grid for modern hospitality", creator: "Morrow Studio", imageUrl: "https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&w=900&q=85", format: "Brand identity", mood: "Warm minimalism", colors: ["Neutral", "Blue"], tags: ["hospitality", "grid", "minimal"], sourceQuery: "minimal hospitality branding" },
  { id: "pin-color-rhythm", title: "Color rhythm for a playful cultural space", creator: "Good People", imageUrl: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=900&q=85", format: "Editorial", mood: "Contemporary", colors: ["Blue", "Red"], tags: ["color", "culture", "art"], sourceQuery: "contemporary editorial color" },
  { id: "pin-typographic-stillness", title: "Typographic stillness and sculptural contrast", creator: "Atelier Monday", imageUrl: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=900&q=85", format: "Typography", mood: "Quiet luxury", colors: ["Cream", "Brown"], tags: ["type", "serif", "quiet luxury"], sourceQuery: "luxury serif typography" },
  { id: "pin-architectural-retail", title: "Architectural cues for an independent retailer", creator: "Form & Field", imageUrl: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=85", format: "Interiors", mood: "Contemporary", colors: ["White", "Black"], tags: ["interior", "retail", "architecture"], sourceQuery: "minimal retail interior" },
  { id: "pin-digital-ritual", title: "A digital ritual with generous space", creator: "Objects Office", imageUrl: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?auto=format&fit=crop&w=900&q=85", format: "Digital", mood: "Warm minimalism", colors: ["Neutral", "Blue"], tags: ["web", "digital", "interface"], sourceQuery: "minimal website design" },
  { id: "pin-ink-paper", title: "Ink, paper, and a confident restraint", creator: "Eastline", imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=85", format: "Packaging", mood: "Bold editorial", colors: ["Black", "White"], tags: ["print", "packaging", "black"], sourceQuery: "black white packaging design" },
];

export const pinterestFormats: PinterestFormat[] = ["Brand identity", "Typography", "Packaging", "Editorial", "Interiors", "Digital"];
export const pinterestMoods: PinterestMood[] = ["Quiet luxury", "Warm minimalism", "Bold editorial", "Craft", "Contemporary"];
export const pinterestColors = ["Black", "White", "Cream", "Neutral", "Earth", "Blue", "Red", "Brown"];
