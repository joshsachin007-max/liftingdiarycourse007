# UI Coding Standards

These standards apply to all UI code throughout this project.

## Components: shadcn/ui ONLY

**Only shadcn/ui components may be used for the UI in this project.**

- **ABSOLUTELY NO custom components may be created.** Do not write bespoke React components for buttons, cards, inputs, dialogs, tables, or any other UI element.
- Every piece of UI must be composed from shadcn/ui components, which live in `src/components/ui/`.
- If a UI element is needed that is not yet installed, add it with the shadcn CLI (for example `npx shadcn@latest add dialog`) rather than building it by hand.
- Do not wrap, re-skin, or re-implement shadcn/ui components in new component files. Compose them directly in pages and layouts, and customize through their props, variants, and Tailwind `className`.
- Do not introduce other UI component libraries.

## Date Formatting

All date formatting must be done with [date-fns](https://date-fns.org/). Do not use `toLocaleDateString`, `Intl.DateTimeFormat`, Moment, or manual string building.

Dates must be displayed with an ordinal day, abbreviated month, and full year, using the format string `do MMM yyyy`:

```ts
import { format } from "date-fns";

format(date, "do MMM yyyy");
```

Examples:

| Date             | Output       |
| ---------------- | ------------ |
| 1 September 2025 | 1st Sep 2025 |
| 2 August 2025    | 2nd Aug 2025 |
| 3 January 2026   | 3rd Jan 2026 |
| 4 January 2024   | 4th Jan 2024 |
