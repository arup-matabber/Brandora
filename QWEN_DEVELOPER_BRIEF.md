# OPALITE — AI DEVELOPER BRIEF & ARCHITECTURAL RULES (FOR QWEN)

> **CRITICAL**: Read this document thoroughly before writing, modifying, or creating any files in Opalite. Adhere strictly to these rules to avoid breaking the application, causing Webpack compilation failures, or corrupting state.

---

## 1. TECH STACK & NEXT.JS 15 RUNTIME CONSTRAINTS

Opalite is built on **Next.js 15.5.x (App Router)** with **Webpack** and **Tailwind CSS**.

### 1.1. Always Use `"use client"` on Client Files
- Any component that uses React hooks (`useState`, `useEffect`, `useMemo`, `useCallback`, `useContext`), browser events (`onClick`, `onChange`), or client contexts **MUST** have `"use client";` as the **first line** of the file.
- Any component imported by a client component that renders interactive elements or links should also include `"use client";`.

### 1.2. Strict TypeScript Type Imports
- **NEVER** import TypeScript `type` or `interface` definitions as runtime values.
- **Always** use `import type { ... }`:
  ```ts
  // ❌ BAD - Breaks Webpack module resolution at runtime!
  import { ClientStatus, ClientRecord } from "./ClientStatusBadge";

  // ✅ GOOD
  import type { ClientStatus, ClientRecord } from "./ClientStatusBadge";
  ```

### 1.3. Next.js 15 `useSearchParams()` Rule
- Any page or component calling `useSearchParams()` **MUST** be wrapped in `<React.Suspense>`:
  ```tsx
  export default function MyPage() {
    return (
      <React.Suspense fallback={<div className="p-8 text-xs text-ink-tertiary">Loading...</div>}>
        <MyPageContent />
      </React.Suspense>
    );
  }
  function MyPageContent() {
    const searchParams = useSearchParams();
    // ...
  }
  ```

---

## 2. OPALITE DESIGN SYSTEM & VISUAL RULES

Opalite is a **quiet, editorial, spatial workspace** for brand designers (think Cosmos, Are.na, Notion, Milanote). It is **NOT** an enterprise dashboard or a generic AI SaaS tool.

### 2.1. Shapes & Radii (Squircle & Pill Language)
- **Large Cards & Panels**: Use generous squircle corners (`rounded-[28px]`, `rounded-[26px]`, `rounded-[24px]`).
- **Buttons, Tabs, Badges, Search Inputs**: Always use capsules (`rounded-full`).
- **Interactive Secondary Actions**: Use floating circular buttons (`w-8 h-8`, `w-9 h-9`, or `w-10 h-10 rounded-full`).
- **Borders & Shadows**: Keep borders ultra-fine (`border border-black/[0.06]`), and shadows soft (`shadow-sm` or `shadow-subtle`).

### 2.2. Strict Color Palette (DO NOT Deviate)
| Token | Hex / Class | Usage |
|---|---|---|
| **Ink Black** | `#111827` (`text-ink`, `bg-ink`) | Primary text, primary CTA buttons |
| **Twilight Indigo** | `#1E1B4B` | Primary button hover / active states |
| **Strong Cyan** | `#4DD4CD` | Accent marks, active progress fills |
| **Azure Mist** | `#EAF5F8` | Subtle active highlights, badge backgrounds |
| **Icy Blue** | `#D0EBF2` | Accent borders |
| **Paper Surfaces** | `#FBFBFA` / `#FFFFFF` | Canvas and card backgrounds |
| **Muted Tone** | `#F4F8FA` / `stone-100` | Icon trays, thumbnail panels |

> **STRICT BAN**:
> - ❌ NO chartreuse, lime green, or olive tones.
> - ❌ NO glassmorphism, heavy backdrop blurs, or glowing border gradients.
> - ❌ NO oversized enterprise dashboard charts or loud badges.

---

## 3. DATA ARCHITECTURE & CONTEXT RULES

All application state is managed centrally in [`src/lib/projects-context.tsx`](file:///c:/Users/roysu/OneDrive/Desktop/opalite/src/lib/projects-context.tsx) and synchronized with `localStorage`:
- `opalite_projects`: Active brand projects and canvas objects.
- `opalite_clients`: Client directory records.
- `opalite_library`: Saved workspace memory (fonts, colors, palettes, references).
- `opalite_activity`: Recent action logs.

### 3.1. Golden Rule for Context Additions
If you add a function or state to `ProjectsContext`:
1. Declare the type signature in `interface ProjectsContextType`.
2. Implement the actual function inside `ProjectsProvider`.
3. Export the function in `value={{ ... }}` in `ProjectsContext.Provider`.
**NEVER** declare a method in the interface without implementing and exporting it in the provider.

---

## 4. CANVAS V2 & REAL-TIME INTERACTION RULES

The Project Canvas (`/project/[id]`) is an infinite spatial workspace.

### 4.1. Reactive Prop Syncing in Canvas Objects
Every canvas object ([`ColorObject.tsx`](file:///c:/Users/roysu/OneDrive/Desktop/opalite/src/canvas/objects/ColorObject.tsx), [`FontObject.tsx`](file:///c:/Users/roysu/OneDrive/Desktop/opalite/src/canvas/objects/FontObject.tsx), [`PaletteObject.tsx`](file:///c:/Users/roysu/OneDrive/Desktop/opalite/src/canvas/objects/PaletteObject.tsx), [`SectionObject.tsx`](file:///c:/Users/roysu/OneDrive/Desktop/opalite/src/canvas/objects/SectionObject.tsx), [`DirectionObject.tsx`](file:///c:/Users/roysu/OneDrive/Desktop/opalite/src/canvas/objects/DirectionObject.tsx)) **MUST** retain its `useEffect` synchronization hook:
```tsx
React.useEffect(() => {
  if (content.property && content.property !== localState) {
    setLocalState(content.property);
  }
}, [content.property]);
```
*Failure to include this causes canvas changes to only appear after a browser refresh!*

### 4.2. Drag Delegation
Any button, input, or interactive link placed inside a canvas object **MUST** have the attribute:
```tsx
data-no-drag="true"
```
This prevents dragging the canvas item when the user tries to click or interact with internal controls.

---

## 5. EXTERNAL ASSETS & DEFENSIVE CODING

### 5.1. External Images (Pixabay / Unsplash / CDNs)
- Always add `referrerPolicy="no-referrer"` to `<img>` tags.
- For Pixabay, never use temporary `pixabay.com/get/...` URLs (which trigger `429 Too Many Requests`). Always derive the permanent CDN URL: `previewURL.replace(/_150\./, '_640.')`.

### 5.2. Defensive Null-Safety
- **Never** do direct property lookups on dynamic content:
  - ❌ `item.content.hex`
  - ✅ `item.content?.hex ?? "#191918"`
- **Never** parse dates without a fallback:
  ```ts
  export function formatDate(iso?: string): string {
    if (!iso) return "Recently";
    const d = new Date(iso);
    return isNaN(d.getTime()) ? "Recently" : d.toLocaleDateString();
  }
  ```

---

## 6. MANDATORY VERIFICATION BEFORE FINISHING WORK

Whenever you write or edit code, **always run the following two commands**:

```bash
# 1. Type verification
npx tsc --noEmit

# 2. Production build verification
npm run build
```

Both commands **MUST exit with code 0**. If any error is reported, fix it immediately before concluding your response.
