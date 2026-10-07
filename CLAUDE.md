# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Docs First (REQUIRED)

**ALWAYS first refer to the relevant documentation files within the `/docs` directory to understand existing patterns, conventions, and best practices before implementation.** Refer to the relevant documentation file(s) in the `/docs` directory BEFORE generating any code. This applies to every code change, no matter how small. Read the matching doc first, follow its conventions exactly, and do not write code until you have done so. If no relevant doc exists, say so before proceeding.

Available docs:

- `/docs/ui.md` — UI conventions
- `/docs/data-fetching.md` — Data fetching rules (Server Components only, `/src/data` helpers, Drizzle, per-user access)
- `/docs/auth.md` — Auth conventions (Clerk only, `auth()` on the server, protecting routes/actions)
- `/docs/data-mutations.md` — Data mutation rules (`/src/data` helpers, server actions in colocated `actions.ts`, zod validation, no `FormData`)
- `/docs/server-components.md` — Server Component standards (async `params`/`searchParams` must be awaited, `PageProps` helpers)
- `/docs/routing.md` — Routing rules (all routes under `/dashboard`, protected via `src/proxy.ts` middleware)

## Commands

- `npm run dev` — start the dev server
- `npm run build` / `npm start` — production build and serve
- `npm run lint` — ESLint (flat config in `eslint.config.mjs`, uses `eslint-config-next`)
- No test runner is configured yet.

## Architecture

Freshly scaffolded Next.js 16 (App Router) app with React 19, TypeScript (strict), and Tailwind CSS v4 (via `@tailwindcss/postcss`). There is no backend, database, or auth yet.

- All code lives in `src/app/` (App Router). `layout.tsx` is the root layout (Geist fonts via `next/font/google`); `page.tsx` is the home page; styles are in `globals.css`.
- Path alias: `@/*` → `./src/*`.
- Root layout uses the globally generated `LayoutProps<"/">` type (no import needed) — this is a Next 16 typed-routes feature.
- Metadata is still the create-next-app default and should be updated.

Per `AGENTS.md`, this Next.js version has breaking changes from what you may know: consult `node_modules/next/dist/docs/` before writing Next-specific code.
