# Data Fetching

> **ALWAYS first refer to the relevant documentation files within the `/docs` directory to understand existing patterns, conventions, and best practices before implementation:**
>
> - `/docs/ui.md`
> - '/docs/data-fetching.md'

## 1. Server Components ONLY (CRITICAL)

**ALL data fetching in this app MUST be done via Server Components.** This is incredibly important.

Data must **NOT** be fetched by:

- Route handlers (`route.ts` / `app/api/*`)
- Client components (`"use client"`), including `useEffect`, SWR, React Query, or `fetch` calls from the browser
- Any other mechanism

If a page needs data, the Server Component fetches it (by calling a helper from `/src/data`) and passes it down to child components as props.

> Mutations are a separate concern and belong in Server Actions (e.g. `actions.ts` next to the route). Server Actions must also go through `/src/data` helpers for any database access and must follow the same security rules below.

## 2. Database Queries Go Through `/src/data` Helpers

All database queries MUST be done via helper functions in the `/src/data` directory (e.g. `src/data/workouts.ts`).

- Helpers MUST use **Drizzle ORM** (`db` from `@/db`, tables from `@/db/schema`).
- **DO NOT USE RAW SQL.** No `sql` template strings for whole queries, no `db.execute()` with raw SQL, no string-built queries.
- Do not query the database directly from pages, components, or actions. Always call a `/src/data` helper.

## 3. Users Can ONLY Access Their Own Data (CRITICAL)

A logged-in user MUST only be able to access their own data. They MUST NOT be able to read or modify any other user's data. This is incredibly important.

Rules for every helper in `/src/data`:

- Every helper takes the current `userId` as a parameter and **every query MUST filter by it** (e.g. `eq(workouts.userId, userId)`). For child tables (exercises, sets, etc.), join back to the parent and filter on the owning `userId`.
- The `userId` MUST come from the authenticated session (Clerk `auth()` on the server), resolved in the Server Component / Server Action. **Never** accept a `userId` from URL params, search params, form data, or any client-supplied input.
- If there is no authenticated user, redirect to sign-in or return nothing — never fall back to unfiltered queries.
- Fetching by ID (e.g. a single workout) must still include the `userId` condition, so guessing another user's ID returns nothing.

### Example

```ts
// src/data/workouts.ts
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { workouts } from "@/db/schema";

export async function getWorkout(userId: string, workoutId: string) {
  return db.query.workouts.findFirst({
    where: and(eq(workouts.id, workoutId), eq(workouts.userId, userId)),
  });
}
```

```tsx
// src/app/dashboard/page.tsx (Server Component)
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getWorkoutsForDate } from "@/data/workouts";

export default async function Page() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const workouts = await getWorkoutsForDate(userId, "2026-01-01", "UTC");
  // ...render, passing data to children as props
}
```

## Checklist

- [ ] Data is fetched in a Server Component — not a route handler or client component
- [ ] Query lives in a `/src/data` helper and uses Drizzle (no raw SQL)
- [ ] `userId` comes from the authenticated session, not client input
- [ ] Every query is scoped to that `userId`
