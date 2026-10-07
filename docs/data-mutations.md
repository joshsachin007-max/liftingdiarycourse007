# Data Mutations

> **ALWAYS first refer to the relevant documentation files within the `/docs` directory to understand existing patterns, conventions, and best practices before implementation:**
>
> - `/docs/ui.md`
> - `/docs/data-fetching.md`
> - `/docs/data-mutations.md`

## 1. Mutations Go Through `/src/data` Helpers (CRITICAL)

ALL data mutations (insert, update, delete) MUST be done via helper functions in the `/src/data` directory (e.g. `src/data/workouts.ts`).

- Helpers MUST wrap database calls using **Drizzle ORM** (`db` from `@/db`, tables from `@/db/schema`).
- **DO NOT USE RAW SQL.** No `sql` template strings for whole statements, no `db.execute()` with raw SQL, no string-built queries.
- Do not touch the database directly from pages, components, or server actions. Always call a `/src/data` helper.
- Every mutation helper takes the current `userId` as a parameter and MUST scope the write to it (e.g. `and(eq(workouts.id, id), eq(workouts.userId, userId))` on update/delete; set `userId` on insert). See `/docs/data-fetching.md` for the per-user access rules, which apply equally to mutations.

## 2. Mutations Are Done ONLY via Server Actions

ALL data mutations MUST be done via **Server Actions**.

- Server actions MUST live in a file named `actions.ts`, **colocated** with the route/feature that uses them (e.g. `src/app/dashboard/actions.ts`).
- `actions.ts` MUST start with `"use server"`.
- Do NOT mutate data from route handlers (`route.ts` / `app/api/*`), client components, or any other mechanism.
- Server actions call `/src/data` helpers for the actual database work.

## 3. Server Action Parameters

- All server action parameters MUST be explicitly typed.
- Parameters MUST **NOT** use the `FormData` type. Pass plain, typed objects/values instead.
- Derive the parameter type from the zod schema (`z.infer<typeof schema>`) so the type and validation never drift apart.

## 4. Validate ALL Arguments with Zod (CRITICAL)

EVERY server action MUST validate the arguments passed to it using **zod**, before doing anything else.

- Define a zod schema for the action's arguments and parse the input at the top of the action (`safeParse` or `parse`).
- Never trust the typed signature alone — types are erased at runtime and clients can send anything.
- Do not call a `/src/data` helper with unvalidated input.
- The `userId` MUST come from the authenticated session (Clerk `auth()`), never from the action's arguments. If there is no authenticated user, return an error — do not proceed (and do not `redirect()`, see section 5).

## 5. No `redirect()` in Server Actions

Server actions MUST NOT call `redirect()` from `next/navigation`.

- Redirects are done **client side**, after the call to the server action resolves (e.g. `router.push(...)` in the calling client component once the action returns `{ success: true }`).
- Server actions return a result object (`{ success: true }` / `{ success: false, error }`) and the client decides where to navigate based on it.
- This also applies to the unauthenticated case: return an error from the action instead of redirecting.

### Example

```ts
// src/data/workouts.ts
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { workouts } from "@/db/schema";

export async function createWorkout(
  userId: string,
  data: { name: string; startedAt: Date },
) {
  const [workout] = await db
    .insert(workouts)
    .values({ ...data, userId })
    .returning();
  return workout;
}

export async function deleteWorkout(userId: string, workoutId: string) {
  await db
    .delete(workouts)
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)));
}
```

```ts
// src/app/dashboard/actions.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createWorkout } from "@/data/workouts";

const createWorkoutSchema = z.object({
  name: z.string().min(1).max(100),
  startedAt: z.coerce.date(),
});

export async function createWorkoutAction(
  params: z.infer<typeof createWorkoutSchema>,
) {
  const parsed = createWorkoutSchema.safeParse(params);
  if (!parsed.success) {
    return { success: false, error: "Invalid input" } as const;
  }

  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" } as const;
  }

  await createWorkout(userId, parsed.data);
  revalidatePath("/dashboard");
  return { success: true } as const;
}
```

## Checklist

- [ ] Mutation lives in a `/src/data` helper that uses Drizzle (no raw SQL)
- [ ] Helper is scoped to the authenticated `userId`
- [ ] Mutation is triggered via a server action in a colocated `actions.ts`
- [ ] Server action params are explicitly typed and do NOT use `FormData`
- [ ] Server action validates its arguments with zod before any other work
- [ ] `userId` comes from the authenticated session, not client input
- [ ] Server action does NOT call `redirect()`; the client redirects after the action resolves
