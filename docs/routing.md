# Routing Coding Standards

> **ALWAYS first refer to the relevant documentation files within the `/docs` directory to understand existing patterns, conventions, and best practices before implementation:**
>
> - `/docs/auth.md`
> - `/docs/server-components.md`
> - `/docs/ui.md`

## 1. Everything Lives Under `/dashboard` (CRITICAL)

**All app routes are accessed via `/dashboard`.** Every feature page is `/dashboard` or a sub-route of it.

- New pages go in `src/app/dashboard/...` (e.g. `/dashboard/workout/new`, `/dashboard/workout/[workoutId]`).
- Do **NOT** create top-level feature routes such as `/workouts` or `/settings`. Nest them under `/dashboard`.
- The only routes outside `/dashboard` are the public entry points: `/` (landing), `/sign-in`, and `/sign-up` (see `/docs/auth.md`).

## 2. `/dashboard` Is Protected (CRITICAL)

- `/dashboard` **and every sub-route** are accessible **only to logged-in users**.
- Unauthenticated visitors are redirected to `/sign-in`.
- Protection is applied to the whole subtree via a route matcher — never per-page as the only line of defence, and never by listing individual sub-routes.

## 3. Route Protection Is Done in the Next.js Proxy (Middleware)

Route protection is done in **Next.js middleware**. In this Next.js version the middleware file is **`src/proxy.ts`** (not `middleware.ts`) — keep it there and do not add a second `middleware.ts`.

Use Clerk's `createRouteMatcher` with `clerkMiddleware` and `auth.protect()`:

```ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
```

- `"/dashboard(.*)"` covers `/dashboard` and all nested routes. Do not narrow it.
- Do not hand-roll redirects or cookie/session checks in the proxy. Use `auth.protect()`.
- Keep the proxy limited to auth/route protection. No data fetching or business logic.

## 4. Defence in Depth

The proxy is the primary gate, but it does **not** replace server-side checks:

- Every protected page and Server Action still calls `await auth()` and checks `userId` (see `/docs/auth.md`).
- Never trust a `userId` from the URL (e.g. `[workoutId]` params must be verified as belonging to the current user in the `/src/data` helper).

## 5. Linking and Navigation

- Link to routes with `next/link`; use `redirect()` from `next/navigation` on the server.
- Post-auth redirects land on `/dashboard`.
- Dynamic `params` / `searchParams` must be awaited (see `/docs/server-components.md`).

## Checklist

- [ ] New page lives under `src/app/dashboard/`
- [ ] No new top-level feature routes
- [ ] `src/proxy.ts` protects `/dashboard(.*)` via `createRouteMatcher` + `auth.protect()`
- [ ] No `middleware.ts` exists alongside `proxy.ts`
- [ ] Page/action still checks `userId` itself
