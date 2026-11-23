const dayMs = 86400000;

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

export function dateKey(v: unknown): string | null {
  if (typeof v === "number" && Number.isFinite(v)) {
    const d = new Date(Date.UTC(1899, 11, 30) + Math.floor(v) * dayMs);
    return keyOfUtc(d);
  }
  if (typeof v !== "string") return null;
  const s = v.trim(),
    sl = s.match(/^(\d{1,2})\.\s*(\d{1,2})\.(\d{4})/),
    iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  return sl
    ? sl[3] + "-" + sl[2].padStart(2, "0") + "-" + sl[1].padStart(2, "0")
    : iso
      ? iso[1] + "-" + iso[2].padStart(2, "0") + "-" + iso[3].padStart(2, "0")
      : null;
}

export function keyOfUtc(d: Date) {
  return (
    d.getUTCFullYear() +
    "-" +
    String(d.getUTCMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getUTCDate()).padStart(2, "0")
  );
}

export function minutes(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v))
    return Math.round((((v % 1) + 1) % 1) * 1440) % 1440;
  if (typeof v === "string") {
    const m = v.trim().match(/^(\d{1,2}):(\d{2})/);
    if (m) return Number(m[1]) * 60 + Number(m[2]);
  }
  return null;
}

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
