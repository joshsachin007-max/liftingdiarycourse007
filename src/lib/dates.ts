export const DEFAULT_TIME_ZONE = "UTC";

export function isValidTimeZone(tz: string | undefined): tz is string {
  if (!tz) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

// Offset (ms) of `tz` from UTC at the given instant.
function offsetAt(instant: number, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  }).formatToParts(new Date(instant));
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)!.value);
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
  return asUtc - Math.floor(instant / 1000) * 1000;
}

// UTC instant at which local midnight of `date` (YYYY-MM-DD) occurs in `tz`.
function localMidnight(date: string, tz: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const guess = Date.UTC(y, m - 1, d);
  const first = guess - offsetAt(guess, tz);
  // Re-evaluate at the candidate to handle DST transitions.
  return new Date(guess - offsetAt(first, tz));
}

// [start, end) of the local calendar day `date` in `tz`.
export function dayRange(date: string, tz: string) {
  const [y, m, d] = date.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
  return { start: localMidnight(date, tz), end: localMidnight(next, tz) };
}

// Today's date as YYYY-MM-DD in `tz`.
export function todayIn(tz: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
