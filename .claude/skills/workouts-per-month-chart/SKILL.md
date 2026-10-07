---
name: workouts-per-month-chart
description: Query the lifting diary database for the past year of workouts and export a bar chart image (months on the x axis, number of workouts on the y axis). Use whenever the user asks for a workout history chart, workouts per month, yearly training volume/frequency, a workout activity graph or plot, or wants workout data exported as an image, even if they don't name this skill.
---

# Workouts per month chart

Reads `DATABASE_URL` from the project's `.env`, counts rows in the `workouts` table
(by `started_at`) for each of the last 12 months, and saves a bar chart PNG.

## Run

```bash
pip install "psycopg[binary]" matplotlib   # only if missing
python .claude/skills/workouts-per-month-chart/scripts/workouts_chart.py
```

Options:
- `--env <path>`: .env file location (default: `.env` in the current directory)
- `--out <path>`: output image (default: `workouts-per-month.png` in the current directory)
- `--user-id <clerk id>`: restrict to one user. Without it, all users' workouts are counted.

## Notes
- Months with zero workouts are still shown (as empty bars) so gaps in training are visible.
- The window is the current month plus the previous 11 months.
- Never print the connection string; the script only reads it from `.env`.
- After running, tell the user the output path and the total workout count.
