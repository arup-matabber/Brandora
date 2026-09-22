# Opalite Backend Documentation — Chunk 1

This document provides a comprehensive guide for the **Firebase Foundation + Auth + Clients + Projects** backend setup for Opalite.

---

## 1. Firebase Project Setup

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Create a project** (or add to an existing Google Cloud project) and name it (e.g., `opalite-app`).
3. Under **Build** in the left sidebar:
   - **Authentication**: Enable the **Email/Password** and **Google** sign-in providers.
   - **Cloud Firestore**: Click **Create database**, select a production location (e.g. `nam5` or `us-central1`), and start in **production mode** (security rules are defined below).
   - **Firebase Storage**: Click **Get started**, choose a default bucket location, and finish.
4. Go to **Project Settings** > **General** > **Your apps** > Add a **Web app** (`</>`).
5. Copy the configuration credentials into your local environment file (`.env.local`).

---

## 2. Environment Variables

Create a `.env.local` file in the root of the project with the following keys (see [.env.example](file:///c:/Users/roysu/OneDrive/Desktop/opalite/.env.example)):

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=opalite-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=opalite-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=opalite-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

> **Safety Guarantee**: In local development without configured credentials, `src/lib/firebase/client.ts` automatically uses demo keys with graceful fallbacks so the app runs smoothly offline or in demo mode without crashing.

---

## 3. Firestore Structure

### 3.1 Users Collection
**Collection**: `users/{userId}`

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Matches Firebase Auth UID |
| `fullName` | `string` | Full display name (e.g. "Elena Ramos") |
| `email` | `string` | User's verified email address |
| `avatarUrl` | `string \| null` | URL to user's avatar image |
| `role` | `"designer" \| "client" \| "admin"` | Role permissions (default: `"designer"`) |
| `createdAt` | `timestamp` | Server timestamp when created |
| `updatedAt` | `timestamp` | Server timestamp when last updated |

---

### 3.2 Clients Collection
**Collection**: `clients/{clientId}`

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Client document ID |
| `ownerId` | `string` | UID of the designer who owns this client |
| `name` | `string` | Client name (e.g. "Orblinn") |
| `company` | `string` | Company or organization name |
| `email` | `string` | Contact email |
| `phone` | `string` | Contact phone number |
| `status` | `"lead" \| "active" \| "inactive"` | Client status (default: `"active"`) |
| `notes` | `string` | Designer's private CRM notes |
| `projectsCount` | `number` | Total projects associated with this client |
| `createdAt` | `timestamp` | Server timestamp |
| `updatedAt` | `timestamp` | Server timestamp |

> **Privacy Rule**: A designer can only read, update, or delete their own client records where `ownerId == request.auth.uid`.

---

### 3.3 Projects Collection
**Collection**: `projects/{projectId}`

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Slug-based or auto-generated ID (e.g. `orblinn`) |
| `ownerId` | `string` | UID of the project owner / designer |
| `clientId` | `string` | Associated client document ID |
| `clientName` | `string` | Client display name |
| `name` | `string` | Project name (e.g. "ORBLINN") |
| `description` | `string` | Project description or core statement |
| `projectType` | `string` | `"brand_identity" \| "rebrand" \| "logo" \| "packaging" \| "visual_identity" \| "other"` |
| `status` | `string` | Project status (e.g. `"Active"`) |
| `lastOpenedAt` | `timestamp` | Timestamp when project was last opened |
| `lastOpenedLocation` | `string` | Route path (e.g. `/project/orblinn`) |
| `createdAt` | `timestamp` | Server timestamp |
| `updatedAt` | `timestamp` | Server timestamp |
| `canvasObjects` | `array` | Initial canvas elements (Brand Brain, notes) |
| `brandBrain` | `map` | Strategic brand discovery data |
| `materials` | `array` | Uploaded reference materials metadata |
| `visualPreview` | `map` | Typographic and palette preview specs |

---

### 3.4 Project Members Subcollection
**Collection**: `projects/{projectId}/members/{userId}`

| Field | Type | Description |
|---|---|---|
| `userId` | `string` | UID of the member |
| `role` | `"owner" \| "editor" \| "viewer"` | Role within this specific project |
| `createdAt` | `timestamp` | Server timestamp |

Designed for seamless team collaboration and client access control.

---

### 3.5 Project Materials Subcollection
**Collection**: `projects/{projectId}/materials/{materialId}`

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Material document ID |
| `fileName` | `string` | Original file name (e.g. `brand-brief.pdf`) |
| `fileType` | `string` | High-level type (e.g. `"pdf"`, `"image"`) |
| `fileSize` | `number` | Size in bytes |
| `mimeType` | `string` | MIME type (e.g. `application/pdf`) |
| `storagePath` | `string` | Cloud Storage path: `projects/{projectId}/materials/{file}` |
| `uploadedBy` | `string` | UID of the user who uploaded the material |
| `status` | `string` | Status (e.g. `"ready"`) |
| `createdAt` | `timestamp` | Server timestamp |

---

## 4. Firebase Storage Structure

Actual assets and uploads are stored under:
```
projects/{projectId}/materials/{timestamp}_{sanitizedFileName}
```

Files are kept **private** and can only be uploaded and retrieved by authorized project members.

---

## 5. Security Rules

### 5.1 Firestore Rules (`firestore.rules`)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    function isProjectMember(projectId) {
      return isAuthenticated() && (
        request.auth.uid == resource.data.ownerId ||
        exists(/databases/$(database)/documents/projects/$(projectId)/members/$(request.auth.uid))
      );
    }

    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId);
    }

    match /clients/{clientId} {
      allow read, write: if isAuthenticated() && (
        resource == null || resource.data.ownerId == request.auth.uid
      );
    }

    match /projects/{projectId} {
      allow create: if isAuthenticated() && request.resource.data.ownerId == request.auth.uid;
      allow read, update, delete: if isProjectMember(projectId);

      match /members/{memberId} {
        allow read, write: if isProjectMember(projectId);
      }

      match /materials/{materialId} {
        allow read, write: if isProjectMember(projectId);
      }
    }
  }
}
```

### 5.2 Storage Rules (`storage.rules`)
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /projects/{projectId}/materials/{fileName} {
      allow read, write: if request.auth != null
        && request.resource.size < 50 * 1024 * 1024; // 50MB max file limit
    }
  }
}
```

---

## 6. Service Layer Architecture

The Firebase integration is encapsulated inside dedicated service modules to prevent raw Firestore/Storage calls in React components:

- [`src/lib/firebase/client.ts`](file:///c:/Users/roysu/OneDrive/Desktop/opalite/src/lib/firebase/client.ts): Initializes Firebase app, Auth, Firestore, and Storage with fallback keys.
- [`src/lib/firebase/auth.ts`](file:///c:/Users/roysu/OneDrive/Desktop/opalite/src/lib/firebase/auth.ts): Authentication methods (`signInWithGoogle`, `signInWithEmail`, `signOut`, `syncUserProfile`).
- [`src/lib/firebase/firestore.ts`](file:///c:/Users/roysu/OneDrive/Desktop/opalite/src/lib/firebase/firestore.ts): Centralized re-exports of Firestore primitives.
- [`src/lib/firebase/storage.ts`](file:///c:/Users/roysu/OneDrive/Desktop/opalite/src/lib/firebase/storage.ts): Centralized re-exports of Storage primitives.
- [`src/services/users.ts`](file:///c:/Users/roysu/OneDrive/Desktop/opalite/src/services/users.ts): `getUserProfile`, `upsertUserProfile`.
- [`src/services/clients.ts`](file:///c:/Users/roysu/OneDrive/Desktop/opalite/src/services/clients.ts): `getClients`, `getClientById`, `createClient`, `updateClient`, `deleteClient`.
- [`src/services/projects.ts`](file:///c:/Users/roysu/OneDrive/Desktop/opalite/src/services/projects.ts): `getProjects`, `getProjectById`, `createProject`, `updateProject`, `deleteProject`.
- [`src/services/projectMembers.ts`](file:///c:/Users/roysu/OneDrive/Desktop/opalite/src/services/projectMembers.ts): `addProjectMember`, `getProjectMembers`, `removeProjectMember`.
- [`src/services/projectMaterials.ts`](file:///c:/Users/roysu/OneDrive/Desktop/opalite/src/services/projectMaterials.ts): `uploadProjectMaterial`, `getProjectMaterials`, `deleteProjectMaterial`.

---

## 7. Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set up `.env.local` with your Firebase project keys.
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
4. Verify TypeScript compilation:
   ```bash
   npx tsc --noEmit
   ```

---

## 8. Deployment Notes (Vercel)

1. In the Vercel Dashboard, navigate to **Settings** > **Environment Variables**.
2. Add all `NEXT_PUBLIC_FIREBASE_*` variables from your `.env.local`.
3. Deploy Firestore and Storage rules to Firebase:
   ```bash
   firebase login
   firebase deploy --only firestore:rules,storage
   ```
4. Ensure your Vercel deployment domain (e.g. `opalite.vercel.app`) is added to **Authorized Domains** in the Firebase Console under **Authentication** > **Settings** > **Authorized domains**.
