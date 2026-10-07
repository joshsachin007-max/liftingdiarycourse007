"""Plot workouts per month for the past year from the lifting diary database."""
import argparse
import sys
from datetime import date
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import psycopg


def read_database_url(env_path: Path) -> str:
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line.startswith("DATABASE_URL="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    sys.exit(f"DATABASE_URL not found in {env_path}")


def month_starts(today: date, n: int = 12) -> list[date]:
    y, m = today.year, today.month
    out = []
    for _ in range(n):
        out.append(date(y, m, 1))
        m -= 1
        if m == 0:
            y, m = y - 1, 12
    return out[::-1]


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--env", default=".env")
    p.add_argument("--out", default="workouts-per-month.png")
    p.add_argument("--user-id")
    args = p.parse_args()

    months = month_starts(date.today())
    sql = (
        "SELECT date_trunc('month', started_at)::date AS m, count(*) "
        "FROM workouts WHERE started_at >= %s"
    )
    params: list = [months[0]]
    if args.user_id:
        sql += " AND user_id = %s"
        params.append(args.user_id)
    sql += " GROUP BY m"

    with psycopg.connect(read_database_url(Path(args.env))) as conn:
        counts = {row[0]: row[1] for row in conn.execute(sql, params)}

    values = [counts.get(m, 0) for m in months]
    labels = [m.strftime("%b\n%Y") if m.month == 1 or i == 0 else m.strftime("%b")
              for i, m in enumerate(months)]

    fig, ax = plt.subplots(figsize=(10, 5), dpi=150)
    bars = ax.bar(range(len(months)), values, color="#2563eb")
    ax.set_xticks(range(len(months)), labels)
    ax.set_xlabel("Month")
    ax.set_ylabel("Number of workouts")
    ax.set_title("Workouts per month (past year)")
    ax.yaxis.get_major_locator().set_params(integer=True)
    ax.spines[["top", "right"]].set_visible(False)
    ax.bar_label(bars, padding=2)
    fig.tight_layout()
    fig.savefig(args.out)
    print(f"Saved {args.out} ({sum(values)} workouts)")


if __name__ == "__main__":
    main()
