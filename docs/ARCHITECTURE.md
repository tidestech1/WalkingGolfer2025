# Project Architecture Overview

This document provides a high-level overview of the Walking Golfer application's architecture. It should be consulted before making significant structural changes or adding new features.

## 1. Core Technologies

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript 5 (with strict settings)
- **UI:** React 18, Tailwind CSS, shadcn/ui
- **Backend & Database:** Firebase (Firestore, Authentication, Cloud Functions)
- **Deployment:** Replit with secrets managed via Replit Secrets Manager.

## 2. Key Architectural Concepts

### Strict Client/Server Separation

The most critical architectural principle is the strict separation of client and server code.

- **Client-Side (`firebase` SDK):** Standard client components use the regular Firebase JS SDK. This is used for tasks like managing user authentication state (`useAuth`) and reading public data.
- **Server-Side (`firebase-admin` SDK):** All privileged database operations (writes, complex queries, admin tasks) **must** occur on the server.
    - The `firebase-admin` package is explicitly blocked from the client-side bundle via `next.config.mjs`.
    - This server-side logic resides in three places:
        1.  **Next.js Server Components** (`'use server'`)
        2.  **Next.js API Routes** (`src/app/api/...`)
        3.  **Firebase Cloud Functions** (`functions/src/index.ts`)

### Database (Firestore)

- **Source of Truth:** Data models are strictly defined in `src/types/*.ts`. These types must be adhered to.
- **Data Access Utilities:** Most Firestore interaction logic is centralized in utility files within `src/lib/firebase/`. For example, `courseUtils.ts` contains all logic for fetching and filtering golf course data.
- **Geospatial Queries:** For performance and scalability, the application does **not** fetch all courses and filter on the client. Instead, the `getCoursesForMap` Cloud Function uses the `geofire-common` library to perform efficient geospatial queries directly against the database based on the map's current viewport.

## 3. Important File Locations

- **Global Layout & Providers:** `src/app/layout.tsx` (wraps the app in `AuthProvider`, etc.)
- **Core Data Types:** `src/types/`
- **Firebase Utilities (isomorphic):** `src/lib/firebase/`
- **Cloud Functions Backend Logic:** `functions/src/index.ts`
- **Project Rules & Guidelines:** `.cursorrules`

## 4. Development Workflow

- Always run `npm run validate` to check for linting and type errors before committing.
- Adhere to the rules specified in `.cursorrules`. 