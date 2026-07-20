// ─────────────────────────────────────────────────────────────────────────
// Date helpers. The app is calibrated to a fixed "today" (2026-07-12) so the
// seeded due-dates, calendar and timeline read exactly as designed.
// ─────────────────────────────────────────────────────────────────────────

/** The app's reference "today". All due-date maths is relative to this. */
export const TODAY = new Date("2026-07-12T00:00:00");

const MS_PER_DAY = 86400000;

/** Format a Date as an ISO yyyy-mm-dd string (local). */
export function iso(d: Date): string {
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

/** Parse an ISO yyyy-mm-dd string into a local midnight Date. */
export function parse(s: string): Date {
  return new Date(s + "T00:00:00");
}

/** Whole-day difference between an ISO date and today (negative = past). */
export function diffDays(s: string): number {
  return Math.round((parse(s).getTime() - TODAY.getTime()) / MS_PER_DAY);
}

/** e.g. "12 ก.ค." — short day + localized month. */
export function fmtShort(s: string, months: string[]): string {
  const d = parse(s);
  return d.getDate() + " " + months[d.getMonth()];
}
