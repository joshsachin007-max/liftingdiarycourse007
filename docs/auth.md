# Auth Coding Standards

> **ALWAYS first refer to the relevant documentation files within the `/docs` directory to understand existing patterns, conventions, and best practices before implementation:**
>
> - `/docs/ui.md`
> - `/docs/data-fetching.md`
> - `/docs/auth.md`

## 1. Clerk ONLY (CRITICAL)

**All authentication in this app is handled by [Clerk](https://clerk.com/) via `@clerk/nextjs`.** This is incredibly important.

- Do **NOT** build custom auth: no hand-rolled sessions, JWTs, cookies, password handling, or login/registration forms.
- Do **NOT** introduce other auth libraries (NextAuth/Auth.js, Lucia, Better Auth, Neon Auth, etc.).
- Do **NOT** store passwords or credentials in our own database. Clerk owns identity; our database only stores the Clerk `userId` as a foreign-key-style string on user-owned rows (e.g. `workouts.userId`).
- Clerk keys live in `.env.local` (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`). Never commit them or hard-code them.

## 2. How Auth Is Wired Up

| Piece                  | Location                                                      |
| ---------------------- | ------------------------------------------------------------- |
| Middleware (Next 16)   | `src/proxy.ts` — `clerkMiddleware()`                          |
| Provider + header UI   | `src/app/layout.tsx` — `<ClerkProvider>`                      |
| Sign-in page           | `src/app/sign-in/[[...sign-in]]/page.tsx` — `<SignIn />`      |
| Sign-up page           | `src/app/sign-up/[[...sign-up]]/page.tsx` — `<SignUp />`      |

- This Next.js version uses **`proxy.ts`** (not `middleware.ts`). Keep `clerkMiddleware()` there and do not add a second `middleware.ts`.
- `<ClerkProvider>` wraps the app in the root layout. Do not add additional providers.
- Use Clerk's prebuilt components (`<SignIn />`, `<SignUp />`, `<SignInButton />`, `<SignUpButton />`, `<UserButton />`) for all auth UI. These are Clerk components, not custom ones, and are consistent with the shadcn-only rule in `/docs/ui.md`.

## 3. Getting the Current User (Server-Side)

- In Server Components and Server Actions, get the user with `auth()` from `@clerk/nextjs/server`. It is **async** — always `await` it.
- Use `userId` from `auth()` as the single source of truth for who the user is.
- **Never** accept a `userId` from URL params, search params, form data, request bodies, or any client-supplied input.
- Pass `userId` to `/src/data` helpers; every query must be scoped to it (see `/docs/data-fetching.md`).
- Do not use `useAuth()` / `useUser()` in client components to make data or security decisions. Client-side Clerk hooks are for display only.

```tsx
// Server Component
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Page() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // fetch via a /src/data helper, passing userId
}
```

```ts
// Server Action
"use server";

import { auth } from "@clerk/nextjs/server";

export async function createWorkoutAction(input: unknown) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // validate input, then call a /src/data helper with userId
}
```

## 4. Protecting Routes and Actions

- **Every protected page and every Server Action MUST check `userId` itself.** Do not rely on the proxy alone — it is not a substitute for checking inside the page/action.
- Unauthenticated users hitting a protected **page** are redirected to `/sign-in`.
- Unauthenticated calls to a Server Action must fail (throw or return an error) — never fall back to unscoped behaviour.
- Protected pages live under `/dashboard`. Public pages are `/`, `/sign-in`, and `/sign-up`.

## 5. Showing Signed-In / Signed-Out UI

- Use Clerk's `<Show when="signed-in">` / `<Show when="signed-out">` (as in `src/app/layout.tsx`) to toggle UI based on auth state.
- Sign-in / sign-up buttons use `mode="modal"` in the header; the dedicated `/sign-in` and `/sign-up` routes remain as fallbacks and redirect targets.
- Hiding UI is cosmetic only. Authorization is always enforced on the server (section 3 and 4).

## Checklist

- [ ] Auth uses Clerk (`@clerk/nextjs`) — no custom or alternative auth
- [ ] `userId` comes from `await auth()` on the server, never from client input
- [ ] Protected pages redirect to `/sign-in` when there is no `userId`
- [ ] Server Actions check `userId` and fail when unauthenticated
- [ ] `userId` is passed to `/src/data` helpers and every query is scoped to it
- [ ] Secrets stay in `.env.local` and are not committed
