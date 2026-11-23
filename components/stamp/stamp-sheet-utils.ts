const DAY_MS = 86_400_000;

const SHEETS_EPOCH = Date.UTC(1899, 11, 30);

export function sheetRange(tabTitle: string, range: string) {
  const escapedTitle = tabTitle.replace(/'/g, "''");
  return `'${escapedTitle}'!${range}`;
}

export function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function dateSerial(date: Date) {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS) + 25569;
}

export function rowDateKey(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    const utcDate = new Date(SHEETS_EPOCH + Math.floor(value) * DAY_MS);
    return `${utcDate.getUTCFullYear()}-${String(utcDate.getUTCMonth() + 1).padStart(2, "0")}-${String(utcDate.getUTCDate()).padStart(2, "0")}`;
  }
  if (typeof value !== "string") return null;
  const text = value.trim();
  const slovenianDate = text.match(/^(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})/);
  if (slovenianDate)
    return `${slovenianDate[3]}-${slovenianDate[2].padStart(2, "0")}-${slovenianDate[1].padStart(2, "0")}`;
  const isoDate = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  return isoDate
    ? `${isoDate[1]}-${isoDate[2].padStart(2, "0")}-${isoDate[3].padStart(2, "0")}`
    : null;
}

export function timeMinutes(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round((((value % 1) + 1) % 1) * 1440) % 1440;
  }
  if (typeof value === "string") {
    const match = value.trim().match(/^(\d{1,2}):(\d{2})/);
    if (match) return Number(match[1]) * 60 + Number(match[2]);
  }
  return null;
}

export function decimalHours(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.trim().replace(",", "."));
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

export function dayHours(row: unknown[] | undefined) {
  if (!row) return 0;
  const savedValue = row[4];
  const hasSavedHours =
    (typeof savedValue === "number" && Number.isFinite(savedValue)) ||
    (typeof savedValue === "string" &&
      savedValue.trim() !== "" &&
      Number.isFinite(Number(savedValue.trim().replace(",", "."))));
  if (hasSavedHours) return decimalHours(savedValue);
  const start = timeMinutes(row[2]);
  const end = timeMinutes(row[3]);
  if (start !== null && end !== null) {
    return Math.round((Math.max(0, end - start) / 60) * 10) / 10;
  }
  return decimalHours(row[4]);
}

export function weekday(date: Date) {
  return new Intl.DateTimeFormat("sl-SI", { weekday: "long", timeZone: "UTC" }).format(date);
}

export function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Google Sheets could not be reached. Please try again.";
}
