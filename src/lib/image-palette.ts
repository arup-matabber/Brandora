// Client-side "Image → Palette" extraction.
//
// Runs entirely in the browser with no network calls:
//   1. Downsample the image onto a small <canvas>.
//   2. Quantize the pixel cloud with a median-cut algorithm.
//   3. Average each bucket + de-duplicate near-identical colors.
//   4. Name each color and derive a visual analysis (mood / keywords / copy).
//
// The visual-analysis step is isolated in `generateVisualAnalysis()` so a
// vision-AI endpoint can be connected later without touching the UI.

export interface ExtractedColor {
  hex: string;
  r: number;
  g: number;
  b: number;
  name: string;
  /** Approximate share of the image this color occupies (0–100). */
  percentage: number;
}

export interface VisualAnalysis {
  mood: string;
  keywords: string[];
  description: string;
}

export interface ExtractedPalette {
  colors: ExtractedColor[];
  analysis: VisualAnalysis;
  sourceName: string;
  width: number;
  height: number;
  generatedAt: string;
}

const MAX_SWATCHES = 6;
const DEDUP_DISTANCE = 46;

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function rgbToHex(r: number, g: number, b: number): string {
  const h = (n: number) =>
    Math.round(clamp(n, 0, 255)).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`.toUpperCase();
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h *= 60;
  }
  return { h, s: s * 100, l: l * 100 };
}

function colorDistance(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }) {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

// ── Median-cut quantization ──────────────────────────────────────────────────

type Pixel = [number, number, number];
type Box = Pixel[];

function channelRanges(box: Box): [number, number, number] {
  let rMin = 255,
    rMax = 0,
    gMin = 255,
    gMax = 0,
    bMin = 255,
    bMax = 0;
  for (const p of box) {
    if (p[0] < rMin) rMin = p[0];
    if (p[0] > rMax) rMax = p[0];
    if (p[1] < gMin) gMin = p[1];
    if (p[1] > gMax) gMax = p[1];
    if (p[2] < bMin) bMin = p[2];
    if (p[2] > bMax) bMax = p[2];
  }
  return [rMax - rMin, gMax - gMin, bMax - bMin];
}

function splitBox(box: Box): [Box, Box] {
  const ranges = channelRanges(box);
  const axis =
    ranges[0] >= ranges[1] && ranges[0] >= ranges[2] ? 0 : ranges[1] >= ranges[2] ? 1 : 2;
  const sorted = [...box].sort((a, b) => a[axis] - b[axis]);
  const mid = Math.floor(sorted.length / 2);
  return [sorted.slice(0, mid), sorted.slice(mid)];
}

interface Dominant {
  hex: string;
  r: number;
  g: number;
  b: number;
  count: number;
}

function dominantColors(pixels: Pixel[]) {
  let boxes: Box[] = [pixels];
  const target = 8;
  let guard = 0;
  while (boxes.length < target && guard++ < 500) {
    let bestIdx = -1;
    let bestScore = -1;
    for (let i = 0; i < boxes.length; i++) {
      const box = boxes[i];
      if (box.length < 2) continue;
      const ranges = channelRanges(box);
      const score = Math.max(ranges[0], ranges[1], ranges[2]) * box.length;
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }
    if (bestIdx === -1) break;
    const [left, right] = splitBox(boxes.splice(bestIdx, 1)[0]);
    if (left.length === 0 || right.length === 0) break;
    boxes.push(left, right);
  }

  const results: Dominant[] = boxes
    .map((box) => {
      let r = 0,
        g = 0,
        b = 0;
      for (const p of box) {
        r += p[0];
        g += p[1];
        b += p[2];
      }
      const n = box.length || 1;
      return {
        hex: rgbToHex(r / n, g / n, b / n),
        r: Math.round(r / n),
        g: Math.round(g / n),
        b: Math.round(b / n),
        count: box.length,
      };
    })
    .sort((a, b) => b.count - a.count);

  const deduped: Dominant[] = [];
  for (const c of results) {
    if (deduped.every((o) => colorDistance(o, c) >= DEDUP_DISTANCE)) deduped.push(c);
    if (deduped.length >= MAX_SWATCHES) break;
  }
  const selected = deduped.slice(0, MAX_SWATCHES);
  // Normalize prominence across the swatches we actually show, so the
  // percentages read as a relative share of the palette and sum to ~100.
  const selectedSum = selected.reduce((s, c) => s + c.count, 0) || 1;
  return selected.map((c) => ({
    ...c,
    percentage: +((c.count / selectedSum) * 100).toFixed(1),
  }));
}

// ── Color naming ─────────────────────────────────────────────────────────────

function nameColor(r: number, g: number, b: number): string {
  const { h, s, l } = rgbToHsl(r, g, b);
  const warm = h < 75 || h >= 320;

  if (l < 7) return "Black";
  if (l > 97) return "White";
  if (l < 16) return "Charcoal";
  if (l > 90) return s < 18 ? "Off-White" : "Ivory";

  // Neutral / low-saturation family
  if (s < 13) {
    if (l < 32) return "Charcoal";
    if (l < 52) return warm ? "Taupe" : "Slate";
    if (l < 74) return warm ? "Warm Grey" : "Cool Grey";
    return warm ? "Stone" : "Silver";
  }

  // Warm brown / beige / tan / gold family
  if (h >= 18 && h < 55) {
    if (l > 72) return s > 55 ? "Amber" : "Warm Beige";
    if (l < 36) return s > 60 ? "Rust" : "Brown";
    if (s > 50) return "Gold";
    if (s > 34) return "Tan";
    return "Taupe";
  }

  // Hue-based base names
  let base: string;
  if (h < 15 || h >= 345) base = l < 45 ? "Crimson" : "Red";
  else if (h < 40) base = "Orange";
  else if (h < 70) base = "Mustard";
  else if (h < 95) base = "Chartreuse";
  else if (h < 150) base = l < 40 ? "Forest" : "Green";
  else if (h < 185) base = l < 40 ? "Teal" : "Emerald";
  else if (h < 210) base = "Cyan";
  else if (h < 245) base = l < 40 ? "Navy" : "Blue";
  else if (h < 280) base = "Indigo";
  else if (h < 320) base = "Violet";
  else base = l < 45 ? "Magenta" : "Pink";

  let mod = "";
  if (s < 30) mod = "Muted ";
  else if (l < 32) mod = "Deep ";
  else if (l > 74) mod = "Pale ";
  return mod + base;
}

// ── Visual analysis (local heuristic, AI-ready) ─────────────────────────────

function hueFamily(h: number): string | null {
  if (h < 15 || h >= 345) return "Reds";
  if (h < 45) return "Earthy";
  if (h < 70) return "Gold";
  if (h < 150) return "Greens";
  if (h < 200) return "Teals";
  if (h < 250) return "Blues";
  if (h < 290) return "Indigos";
  if (h < 325) return "Violets";
  return "Pinks";
}

function analyzePaletteLocal(colors: ExtractedColor[]): VisualAnalysis {
  const totalPct = colors.reduce((s, c) => s + c.percentage, 0) || 1;
  let warmShare = 0;
  let coolShare = 0;
  let satWeighted = 0;
  let lightWeighted = 0;
  const distinctHues = new Set<string>();

  for (const c of colors) {
    const w = c.percentage / totalPct;
    const { h, s, l } = rgbToHsl(c.r, c.g, c.b);
    satWeighted += s * w;
    lightWeighted += l * w;
    if (l < 8 || l > 96) continue; // skip pure black/white for mood
    if (h < 75 || h >= 320) warmShare += w;
    else coolShare += w;
    const fam = hueFamily(h);
    if (fam) distinctHues.add(fam);
  }

  const warm = warmShare >= coolShare;
  const satLevel = satWeighted < 18 ? "muted" : satWeighted < 38 ? "soft" : "vibrant";
  const lightLevel = lightWeighted > 70 ? "light" : lightWeighted < 38 ? "deep" : "balanced";
  const tone =
    distinctHues.size <= 1
      ? "monochromatic"
      : distinctHues.size <= 2
      ? "two-tone"
      : "layered";

  const moodBits: string[] = [];
  moodBits.push(satLevel === "muted" ? "Refined" : satLevel === "soft" ? "Warm" : "Bold");
  moodBits.push(warm ? "Warm" : "Cool");
  moodBits.push(lightLevel === "light" ? "Airy" : lightLevel === "deep" ? "Grounded" : "Contemporary");
  const mood = Array.from(new Set(moodBits)).slice(0, 3).join(" · ");

  const keywords = Array.from(
    new Set([
      ...distinctHues,
      warm ? "Earthy neutrals" : "Cool neutrals",
      satLevel === "muted" ? "Low contrast" : satLevel === "soft" ? "Soft contrast" : "High energy",
      lightLevel,
    ])
  ).slice(0, 5);

  const top = colors[0];
  const accent = colors.find((c) => c !== top && c.percentage > 3);
  const description = `A ${satLevel}, ${warm ? "warm" : "cool"} palette led by ${
    top ? top.name.toLowerCase() : "a neutral"
  } with ${accent ? accent.name.toLowerCase() + " as a supporting tone" : "a restrained range"} — ${tone} and ${lightLevel}.`;

  return { mood, keywords, description };
}

/**
 * Produces the visual analysis for a palette.
 *
 * ── AI SEAM ──────────────────────────────────────────────────────────────
 * To connect a vision model later, POST the source image + extracted colors
 * to an endpoint and return its analysis, e.g.:
 *
 *   const endpoint = process.env.NEXT_PUBLIC_OPALITE_VISION_ENDPOINT;
 *   if (endpoint && imageUrl) {
 *     const res = await fetch(endpoint, {
 *       method: "POST",
 *       headers: { "Content-Type": "application/json" },
 *       body: JSON.stringify({
 *         imageUrl,
 *         colors: colors.map((c) => ({ hex: c.hex, name: c.name, percentage: c.percentage })),
 *       }),
 *     });
 *     if (res.ok) return (await res.json()) as VisualAnalysis;
 *   }
 * ─────────────────────────────────────────────────────────────────────────
 */
export async function generateVisualAnalysis(
  colors: ExtractedColor[],
  imageUrl?: string
): Promise<VisualAnalysis> {
  void imageUrl;
  return analyzePaletteLocal(colors);
}

// ── Public entry point ───────────────────────────────────────────────────────

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not decode image"));
    img.src = src;
  });
}

export async function extractPaletteFromImage(
  src: string,
  sourceName: string
): Promise<ExtractedPalette> {
  if (typeof document === "undefined") {
    throw new Error("Image extraction is browser-only");
  }

  const img = await loadImage(src);

  // Downsample so quantization stays fast regardless of source resolution.
  const scale = Math.min(1, 140 / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas is unavailable in this environment");
  ctx.drawImage(img, 0, 0, w, h);

  const { data } = ctx.getImageData(0, 0, w, h);
  const pixels: Pixel[] = [];
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 125) continue; // skip transparent pixels
    pixels.push([data[i], data[i + 1], data[i + 2]]);
  }
  if (pixels.length < 16) throw new Error("Not enough image data to analyze");

  const dom = dominantColors(pixels);
  const colors: ExtractedColor[] = dom.map((c) => ({
    hex: c.hex,
    r: c.r,
    g: c.g,
    b: c.b,
    name: nameColor(c.r, c.g, c.b),
    percentage: c.percentage,
  }));

  const analysis = await generateVisualAnalysis(colors, src);

  return {
    colors,
    analysis,
    sourceName,
    width: img.naturalWidth,
    height: img.naturalHeight,
    generatedAt: new Date().toISOString(),
  };
}
