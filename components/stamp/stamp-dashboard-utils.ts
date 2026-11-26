import { timeMinutes as minutes } from "./stamp-sheet-utils";

export const DEFAULT_HOURLY_RATE_CENTS = 773;

const euro = new Intl.NumberFormat("sl-SI", { style: "currency", currency: "EUR" });

export function parseHourlyRate(value: string): number | null {
  const match = /^(\d+)(?:[,.](\d{1,2}))?$/.exec(value.trim());
  if (!match) return null;
  const cents = Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"));
  return Number.isSafeInteger(cents) ? cents : null;
}

export function hourlyRateDraft(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",");
}

export function formatEarnings(workedHours: number, rateCents: number) {
  return euro.format((workedHours * rateCents) / 100);
}

export function storedGoal(value: unknown, fallback: number, max: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0
    ? Math.max(1, Math.min(max, Math.round(parsed)))
    : fallback;
}

export const keyOf = (d: Date) =>
  d.getFullYear() +
  "-" +
  String(d.getMonth() + 1).padStart(2, "0") +
  "-" +
  String(d.getDate()).padStart(2, "0");

export function hours(row: unknown[] | undefined) {
  if (!row) return 0;
  const savedValue = row[4];
  const saved =
    typeof savedValue === "number"
      ? savedValue
      : typeof savedValue === "string" && savedValue.trim() !== ""
        ? Number(savedValue.trim().replace(",", "."))
        : NaN;
  if (Number.isFinite(saved)) return saved;
  const a = minutes(row[2]),
    b = minutes(row[3]);
  return a !== null && b !== null ? Math.max(0, b - a) / 60 : 0;
}

export function monthlyHours(
  rows: { key: string | null; row: unknown[] }[],
  todayKey: string,
  activeHours: number | null,
) {
  return rows.reduce((total, { key, row }) => {
    if (!key || key > todayKey || (key === todayKey && activeHours !== null)) return total;
    return total + hours(row);
  }, activeHours ?? 0);
}

export function recentMonthHours(
  rows: { key: string | null; row: unknown[] }[],
  now: Date,
  activeHours: number | null,
) {
  const today = keyOf(now);
  const currentMonth = today.slice(0, 7);
  const earliestMonth = rows.reduce((earliest, { key }) => {
    const month = key?.slice(0, 7);
    return month && month < earliest ? month : earliest;
  }, currentMonth);

  return Array.from({ length: 5 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() + index - 4, 1);
    const key = keyOf(date).slice(0, 7);
    return {
      date,
      key,
      hours: monthlyHours(
        rows.filter((row) => row.key?.slice(0, 7) === key),
        today,
        key === currentMonth ? activeHours : null,
      ),
    };
  }).filter(({ key }) => key >= earliestMonth);
}

export function duration(value: number) {
  const m = Math.max(0, Math.round(value * 60));
  return Math.floor(m / 60) + "h " + String(m % 60).padStart(2, "0") + "m";
}

export function fmt(d: Date, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-GB", options).format(d);
}

export function monthName(d: Date) {
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(d);
}

export function timeInput(v: unknown) {
  const m = minutes(v);
  return m === null
    ? "09:00"
    : String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
}

export function formatSheetTime(v: unknown) {
  const m = minutes(v);
  return m === null
    ? "—"
    : String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
}

export function clockDisplay(seconds: number) {
  return (
    String(Math.floor(seconds / 3600)).padStart(2, "0") +
    ":" +
    String(Math.floor((seconds % 3600) / 60)).padStart(2, "0") +
    ":" +
    String(seconds % 60).padStart(2, "0")
  );
}
