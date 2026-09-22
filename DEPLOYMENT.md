# Opalite — Vercel Deployment Guide

This document outlines the deployment process, runtime architecture, environment variable specifications, and standalone mock capabilities for deploying Opalite to Vercel.

---

## 1. Project Stack

- **Framework**: [Next.js 15.1.0](https://nextjs.org/) (App Router, Server & Client Components)
- **UI & React Engine**: React 19.0.0, React DOM 19.0.0
- **Styling**: Tailwind CSS 3.4.17 with custom typography and design system tokens
- **Gesture & Interaction Engine**: `@use-gesture/react` for infinite canvas pan/zoom/drag
- **Icons**: `lucide-react`
- **Data Persistence**: 
  - **Standalone / Mock Mode**: Resilient client-side `safeStorage` (browser `localStorage`) with full zero-latency hydration
  - **ORM & Local DB**: Prisma ORM with `@prisma/client`
  - **Future Cloud Backend**: Firebase (Auth, Firestore, Cloud Storage)
- **External Integrations**:
  - Google Fonts Webfonts Catalogue API (with 2-tier public metadata & local curated fallback)
  - Pixabay Image Search API (with local curated design imagery fallback)

---

## 2. Local Development Command

```bash
npm run dev
```

Runs the Next.js development server at `http://localhost:3000`.

---

## 3. Production Build Command

```bash
npm run build
```

This triggers:
1. `postinstall`: Automatically generates the Prisma Client (`prisma generate`)
2. `next build`: Type checks, validates route configurations, and compiles static & dynamic serverless bundles.

To test the production build locally before deploying:
```bash
npm run build
npm run start -- -p 3001
```

---

## 4. Vercel Deployment Steps

### Method A: Deploy via Vercel Dashboard (GitHub / GitLab / Bitbucket)

1. Push the repository to your Git provider (GitHub, GitLab, or Bitbucket).
2. Go to [vercel.com/new](https://vercel.com/new).
3. Import the Opalite repository.
4. **Project Settings**:
   - **Framework Preset**: Next.js (automatically detected)
   - **Root Directory**: `./`
   - **Build Command**: `next build` (or leave default `npm run build`)
   - **Output Directory**: `.next` (automatically detected)
   - **Install Command**: `npm install` (automatically executes `postinstall` to generate Prisma client)
5. **Environment Variables**:
   - For standalone mock deployment, **no environment variables are required**. Opalite will deploy and run immediately in Standalone Mode.
   - If you have an external API key (e.g. `NEXT_PUBLIC_PIXABAY_API_KEY` or `GOOGLE_FONTS_API_KEY`), add them in the "Environment Variables" section.
6. Click **Deploy**.

### Method B: Deploy via Vercel CLI

1. Install the Vercel CLI globally (if not already installed):
   ```bash
   npm install -g vercel
   ```
2. Log in to Vercel:
   ```bash
   vercel login
   ```
3. Deploy preview:
   ```bash
   vercel
   ```
4. Deploy to production:
   ```bash
   vercel --prod
   ```

---

## 5. Environment Variables Specification

All environment variables are optional. When omitted, the app gracefully degrades to standalone mock mode with local fallbacks.

| Variable | Scope | Required? | Purpose & Fallback Behavior |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_PIXABAY_API_KEY` | Public (Client) | Optional | Live image search in Explore. If omitted, uses curated design imagery. |
| `GOOGLE_FONTS_API_KEY` | Secret (Server) | Optional | Developer API key for `/api/fonts`. If omitted, falls back to Google's public directory and local specimens. |
| `DATABASE_URL` | Secret (Server) | Optional | Database connection string for Prisma. If omitted, defaults safely to `file:./dev.db` without failing serverless functions. |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Public (Client) | Optional | Firebase Web API key. If omitted or demo key, app runs in Standalone Mock Mode. |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Public (Client) | Optional | Firebase Auth domain. |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Public (Client) | Optional | Firebase Project ID. |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Public (Client) | Optional | Firebase Storage bucket. |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Public (Client) | Optional | Firebase Cloud Messaging ID. |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Public (Client) | Optional | Firebase Application ID. |
| `NEXT_PUBLIC_APP_URL` | Public (Client) | Optional | Base URL for server-side link generation. Defaults to relative URL in browser. |

---

## 6. Public vs Secret Variables

- **Public variables (`NEXT_PUBLIC_*`)**:
  - Inlined into client JavaScript bundles at build time by Next.js.
  - Safe for public keys (e.g. Firebase Client API key, Pixabay client key).
  - **Never** place private server credentials (database passwords, Firebase service accounts, private API secrets) under `NEXT_PUBLIC_*`.
- **Secret variables**:
  - Accessible only within Next.js API route handlers and server components.
  - Examples: `GOOGLE_FONTS_API_KEY`, `DATABASE_URL`.

---

## 7. Current Mock / Local Functionality (Works 100% on Vercel)

The following features operate completely without requiring an external backend:

1. **Authentication Experience**:
   - One-click login as "Elena Ramos" (Creative Director).
   - Custom email entry (derives profile and initializes designer workspace).
   - Session persistence via `safeStorage` across page refreshes.
2. **Project Management**:
   - Project dashboard (`/home`, `/projects`).
   - Project creation modal with custom client, project type, brief, and material tags.
   - Project switching and deletion.
   - Default seeded brand projects (*Noctaris*, *Lumina Skincare*, *Kroma Studio*).
3. **Brand Brain**:
   - Strategy synthesis engine (core idea, mission, tone of voice, visual principles, palette, keywords).
   - Brand Brain canvas card with live strategy inspector.
4. **Infinite Canvas Engine**:
   - Pan (Space + drag or middle mouse) and smooth Zoom (scroll wheel, zoom toolbar).
   - Object creation: Text, Brand Brain cards, Color Swatches, Sticky notes, Direction frames, Images.
   - Selection, multi-selection, dragging, and resizing.
   - Duplicate (`Ctrl+D`), Delete (`Delete` / `Backspace`), Copy/Paste (`Ctrl+C` / `Ctrl+V`).
   - History engine: Undo (`Ctrl+Z`) and Redo (`Ctrl+Shift+Z`).
   - Canvas state persistence: edits survive browser refresh via `safeStorage`.
5. **Explore & Inspiration**:
   - Curated high-resolution design specimens, moodboards, and branding materials.
   - Filter by topic, tone, format, and layout.
   - One-click "Add to Canvas" and "Save to Library".
   - Pixabay integration (with automatic fallback if API key is not supplied).
6. **Typography Studio**:
   - Google Fonts catalog browser with live specimen rendering.
   - Search by font family, category (Serif, Sans-serif, Display, Monospace), and sorting.
   - Dynamic stylesheet injection for real-time font preview.
7. **Client CRM**:
   - Client directory (`/clients`) with status filters (Active, Lead, Inactive).
   - Client detail view with linked projects, contact info, and activity history.
   - Client creation modal.
8. **Client Review & Approvals UI**:
   - Direction publishing flow.
   - Share link generation (`/client/[token]/review/[directionId]`).
   - Full client review interface: interactive direction view, version comparison, feedback notes, and approval status submission.

---

## 8. Backend Functionality Pending Live Cloud Integration

When the backend team finishes the cloud infrastructure, the following features will transition from local/mock to live cloud services:

1. **Real Multi-user Authentication**: Live Google OAuth popup via production Firebase Auth.
2. **Global Firestore Persistence**: Real-time cross-device sync of project canvas objects.
3. **Firebase Cloud Storage**: Permanent binary storage for user-uploaded logo files and high-resolution assets (currently stored in browser memory/object URLs).
4. **Secure Multi-tenant Review Links**: Server-signed cryptographic review tokens verified against Firestore database.
5. **Real-time Collaborative Comments**: WebSockets / Firestore snapshot listeners for live multi-user cursor and comment threads.

---

## 9. How to Verify the Deployment

1. **Visit the deployed URL** (e.g., `https://your-opalite-app.vercel.app`).
2. **Auth Flow**: Click "Continue with Google" or enter an email. Verify instant redirection to `/home`.
3. **Project Flow**:
   - Click "New Project", fill in Name ("Aura Aesthetics") and Client ("Aura Co").
   - Click "Create Project" and verify canvas loads with the Brand Brain card.
4. **Canvas Interactions**:
   - Add a Text block, change font size/color, drag it around.
   - Add a Color Palette object, test Zoom In / Zoom Out.
   - Hit **F5** (hard refresh). Verify the newly added objects remain on the canvas.
5. **Explore & Library**:
   - Navigate to `/explore`, browse inspiration cards, click "Add to Canvas".
   - Navigate to `/library`, verify saved items appear.
6. **Client Review**:
   - Open a project, click "Share & Review", copy the client link.
   - Open the link in a private/incognito window. Verify the client review page renders correctly.

---

## 10. Known Limitations

- **Browser-Local Storage**: In Standalone Mode, projects and canvas modifications are stored in the client's browser `localStorage`. They do not synchronize between different physical devices or incognito sessions until live Firebase credentials are provided.
- **Serverless SQLite**: Next.js API routes on Vercel run as ephemeral serverless functions. SQLite writes to `./dev.db` in serverless instances are non-persistent between cold starts; all state persistence relies on browser `localStorage` as designed for mock mode.
