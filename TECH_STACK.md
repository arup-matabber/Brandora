# Opalite — Technology Stack & System Architecture

A comprehensive breakdown of the core technologies, architecture, libraries, and design choices powering **Opalite** (Creative Workspace for Brand Designers).

---

## 1. Core Architecture Overview

Opalite is architected as a modern, high-performance, hybrid web application built on **Next.js 15 (App Router)** and **React 19**. It features an infinite brand design canvas, a client review portal, a Brand Brain AI reasoning layer, and resilient offline-first persistence.

```
┌───────────────────────────────────────────────────────────────┐
│                      Client Layer                             │
│  React 19 · Next.js 15 App Router · Tailwind CSS · Satoshi    │
│  Infinite Canvas Workspace (@use-gesture/react)               │
└──────────────┬───────────────────────────────┬────────────────┘
               │                               │
┌──────────────▼───────────────┐ ┌─────────────▼────────────────┐
│   Local / Offline Cache      │ │      API & Service Layer     │
│   SafeStorage (localStorage) │ │  Next.js Route Handlers      │
│   In-Memory React Context    │ │  Prisma ORM (SQLite)         │
└──────────────────────────────┘ └─────────────┬────────────────┘
                                               │
                                 ┌─────────────▼────────────────┐
                                 │   External Integrations      │
                                 │   Pixabay API (Inspiration) │
                                 │   Google Web Fonts API       │
                                 │   Firebase Auth & Firestore  │
                                 └──────────────────────────────┘
```

---

## 2. Technology Stack Breakdown

### Frontend & UI Layer
| Category | Technology | Version | Description & Role |
| :--- | :--- | :--- | :--- |
| **Framework** | **Next.js** | `^15.1.0` | React framework using App Router, React Server Components, client boundaries, dynamic routing (`/project/[id]`, `/client/[token]/review`), and static page generation. |
| **UI Library** | **React** | `^19.0.0` | State-driven UI with modern hooks (`useCallback`, `useMemo`, `useRef`), concurrent features, and suspense wrappers. |
| **Language** | **TypeScript** | `^5.0.0` | Strict type safety across canvas objects, review versions, user auth, and API responses. |
| **Styling** | **Tailwind CSS** | `^3.4.17` | Utility-first styling supplemented with curated luxury aesthetic tokens (`ink`, `paper`, `surface-muted`, subtle borders, and smooth micro-interactions). |
| **Gestures** | **@use-gesture/react** | `^10.3.1` | Native drag, pan, zoom, and multi-touch interactions powering the infinite brand canvas. |
| **Iconography** | **Lucide React** | `^0.468.0` | Clean, minimalist SVG icons for tools, navigation, and badges. |
| **Typography** | **Satoshi & Google Fonts** | — | Primary system-native Grotesque typography with dynamic runtime loading of Google Fonts for brand specimens. |

---

### Backend, Database & Storage Layer
| Category | Technology | Version | Description & Role |
| :--- | :--- | :--- | :--- |
| **API Layer** | **Next.js Route Handlers** | `15.x` | RESTful JSON endpoints (`/api/projects`, `/api/reviews`, `/api/clients`, `/api/library`, `/api/activity`, `/api/fonts`). |
| **ORM** | **Prisma** | `^6.4.0` | Type-safe schema definition and query builder (`@prisma/client`). |
| **Database** | **SQLite** | — | File-based database (`prisma/dev.db`) providing zero-latency local setup and persistent server storage without third-party database overhead. |
| **Cloud Services** | **Firebase** | `^12.19.0` | Hybrid cloud synchronization supporting Firebase Authentication (Google & Email) and Firestore persistence for user-owned projects. |
| **Client Storage** | **SafeStorage Wrapper** | Custom | Browser `localStorage` abstraction with automatic JSON serialization, error boundary fallback, and quota management. |

---

### External Integrations & APIs
- **Pixabay REST API**: Powering the Explore Inspiration engine for finding curated, high-resolution design and architectural photography. Includes automatic fallback keys for zero-config Vercel deployments.
- **Google Fonts API**: Real-time font catalog search and programmatic stylesheet injection (`loadGoogleFontPreview`) for typography specimens.
- **Client Review Engine**: Token-based secure link generation (`/client/[token]/review/[directionId]`) with version snapshots, interactive client approvals, and comment threads.

---

## 3. Directory Structure

```
├── prisma/
│   ├── schema.prisma          # Database schema (User, Project, DirectionVersion, ReviewShare, etc.)
│   ├── dev.db                 # SQLite database file
│   └── seed.ts                # Database seed script
├── src/
│   ├── app/
│   │   ├── (app)/             # Authenticated studio routes (home, projects, explore, library, clients, settings)
│   │   ├── api/               # Server API Route Handlers (projects, reviews, clients, activity)
│   │   ├── client/            # Public Client Review Portal routes ([token]/review/...)
│   │   ├── project/[id]/      # Core Canvas Workspace route
│   │   ├── layout.tsx         # Root layout with font and context providers
│   │   └── globals.css        # Global CSS & Tailwind design tokens
│   ├── canvas/
│   │   ├── CanvasWorkspace.tsx# Infinite canvas canvas engine
│   │   ├── use-canvas.ts      # Canvas items state and viewport transformations
│   │   └── objects/           # Canvas object components (Direction, Palette, Font, Image, Section, Note)
│   ├── components/
│   │   ├── ui/                # Reusable UI primitives (Button, Modal, Sidebar, NavigationItem, Avatar)
│   │   └── clients/           # Client share & review modals
│   ├── lib/
│   │   ├── auth-context.tsx   # User authentication & session state
│   │   ├── projects-context.tsx# Projects, directions, and reviews data provider
│   │   ├── pixabay-config.ts  # Pixabay API integration & fallback configuration
│   │   └── safe-storage.ts    # Resilient local storage abstraction
│   └── services/              # Firestore & Prisma service abstractions
├── package.json               # Dependencies & scripts
└── tailwind.config.ts         # Tailwind CSS theme configuration
```

---

## 4. Key Architectural Highlights

1. **Zero-Configuration Standalone Execution**:
   - The application runs fully on localhost without requiring external database servers or third-party cloud credentials.
   - Built-in fallback keys enable instant preview deployments on Vercel.

2. **Hybrid Multi-Tier Data Resolution**:
   - Data flows seamlessly through a resilient cascade:
     $$\text{SafeStorage (Instant)} \longrightarrow \text{REST API / SQLite (Server)} \longrightarrow \text{Firestore (Cloud)}$$

3. **Immutably Versioned Client Review Snapshots**:
   - Publishing a creative direction takes an immutable snapshot of all enclosed canvas elements (fonts, colors, palettes, references, and notes) and binds it to a unique token for client feedback.
