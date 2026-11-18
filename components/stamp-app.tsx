"use client";

import Script from "next/script";
import Image from "next/image";
import { StampPwa } from "@/components/stamp-pwa";
import { StampDashboard, type ManualTimeEntry } from "@/components/stamp-dashboard";
import { FileSpreadsheet, LoaderCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const TARGET_SHEET_NAME = "Triglav_Delovne_Ure";
const SESSION_STORAGE_KEY = "stamp-google-session-v1";
const GOOGLE_SCOPE =
  "openid email https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/spreadsheets";
const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";
const DAY_MS = 86_400_000;
const subscribeToMount = () => () => {};
const getMountedSnapshot = () => true;
const getServerMountedSnapshot = () => false;
const SHEETS_EPOCH = Date.UTC(1899, 11, 30);

function clearSavedSession() {
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Browser storage can be unavailable in privacy-restricted contexts.
  }
}

type GoogleTokenResponse = {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

type GoogleTokenClient = {
  requestAccessToken: (options?: { prompt?: string }) => void;
};

type GoogleTokenClientConfig = {
  client_id: string;
  scope: string;
  callback: (response: GoogleTokenResponse) => void;
  error_callback?: (error: { type: string; message?: string }) => void;
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: GoogleTokenClientConfig) => GoogleTokenClient;
        };
      };
    };
  }
}

type DriveSheet = {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
};

type SheetTab = { properties: { sheetId: number; title: string } };
type SheetValues = { values?: unknown[][] };
type SheetData = {
  file: DriveSheet;
  tab: SheetTab["properties"];
  rows: unknown[][];
};
type SearchState = "signed-out" | "searching" | "ready" | "not-found" | "error";
type ClockAction = "arrival" | "departure" | "manual" | null;

function sheetRange(tabTitle: string, range: string) {
  const escapedTitle = tabTitle.replace(/'/g, "''");
  return `'${escapedTitle}'!${range}`;
}

async function googleFetch<T>(url: string, token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  const body = (await response.json().catch(() => ({}))) as {
    error?: { message?: string };
  };
  if (!response.ok) {
    if (response.status === 401)
      throw new Error("Your Google session expired. Sign in again to continue.");
    throw new Error(
      body.error?.message ?? "Google could not complete that request. Please try again.",
    );
  }
  return body as T;
}

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function dateSerial(date: Date) {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS) + 25569;
}

function rowDateKey(value: unknown): string | null {
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

function timeMinutes(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round((((value % 1) + 1) % 1) * 1440) % 1440;
  }
  if (typeof value === "string") {
    const match = value.trim().match(/^(\d{1,2}):(\d{2})/);
    if (match) return Number(match[1]) * 60 + Number(match[2]);
  }
  return null;
}

function decimalHours(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.trim().replace(",", "."));
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function dayHours(row: unknown[] | undefined) {
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

function weekday(date: Date) {
  return new Intl.DateTimeFormat("sl-SI", { weekday: "long", timeZone: "UTC" }).format(date);
}

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Google Sheets could not be reached. Please try again.";
}

export function StampApp() {
  const mounted = useSyncExternalStore(
    subscribeToMount,
    getMountedSnapshot,
    getServerMountedSnapshot,
  );

  if (!mounted) {
    return (
      <div className="stamp-app stamp-app-loading" role="status" aria-live="polite">
        <span className="stamp-loading-mark" aria-hidden="true">
          stamp
          <span className="stamp-wordmark-dot" aria-hidden="true" />
        </span>
        <span>Loading your timecard…</span>
      </div>
    );
  }

  return <StampAppRuntime />;
}

function StampAppRuntime() {
  const tokenClient = useRef<GoogleTokenClient | null>(null);
  const restoredSession = useRef(false);
  const [state, setState] = useState<SearchState>("signed-out");
  const [accessToken, setAccessToken] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [data, setData] = useState<SheetData | null>(null);
  const [now, setNow] = useState<Date | null>(null);
  const [action, setAction] = useState<ClockAction>(null);
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [needsReload, setNeedsReload] = useState(false);
  const [breakLog, setBreakLog] = useState<{ startedAt: number | null; totalMs: number }>({
    startedAt: null,
    totalMs: 0,
  });
  const [breakLogReady, setBreakLogReady] = useState(false);

  useEffect(() => {
    const update = () => setNow(new Date());
    update();
    const timer = window.setInterval(update, 1_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 4_000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const loadSheet = useCallback(async (token: string, file: DriveSheet) => {
    const details = await googleFetch<{
      properties?: { title?: string };
      sheets?: SheetTab[];
    }>(
      `${SHEETS_API}/${encodeURIComponent(file.id)}?fields=properties(title),sheets(properties(sheetId,title,index))`,
      token,
    );
    const tabs = details.sheets?.map((entry) => entry.properties) ?? [];
    const headers = ["DATE", "DAY", "START", "END", "HOURS WORKED", "NOTE"];
    let tab: SheetTab["properties"] | undefined;
    for (const candidate of tabs) {
      const headerValues = await googleFetch<SheetValues>(
        `${SHEETS_API}/${encodeURIComponent(file.id)}/values/${encodeURIComponent(sheetRange(candidate.title, "A1:F1"))}?valueRenderOption=FORMATTED_VALUE`,
        token,
      );
      const row =
        headerValues.values?.[0]?.map((value) => String(value).trim().toUpperCase()) ?? [];
      if (headers.every((header, index) => row[index] === header)) {
        tab = candidate;
        break;
      }
    }
    if (!tab)
      throw new Error(
        "I found the spreadsheet, but couldn’t find a tab with the DATE, DAY, START, END, HOURS WORKED, NOTE columns.",
      );
    const values = await googleFetch<SheetValues>(
      `${SHEETS_API}/${encodeURIComponent(file.id)}/values/${encodeURIComponent(sheetRange(tab.title, "A:F"))}?valueRenderOption=UNFORMATTED_VALUE`,
      token,
    );
    setData({ file, tab, rows: values.values ?? [] });
    setState("ready");
  }, []);

  const searchDrive = useCallback(
    async (token: string) => {
      setAccessToken(token);
      setState("searching");
      setMessage("");
      setNotice("");
      setNeedsReload(false);
      setData(null);
      setAccountEmail("");

      try {
        const profile = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (profile.ok) {
          const user = (await profile.json()) as { email?: string };
          setAccountEmail(user.email ?? "");
        }

        const query = `name = '${TARGET_SHEET_NAME}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`;
        const params = new URLSearchParams({
          q: query,
          fields: "files(id,name,mimeType,webViewLink)",
          pageSize: "100",
          spaces: "drive",
          includeItemsFromAllDrives: "true",
          supportsAllDrives: "true",
        });
        const result = await googleFetch<{ files?: DriveSheet[] }>(
          `https://www.googleapis.com/drive/v3/files?${params}`,
          token,
        );
        const file = result.files?.[0];
        if (!file) {
          setState("not-found");
          return;
        }
        await loadSheet(token, file);
      } catch (error) {
        setState("error");
        setMessage(errorMessage(error));
        if (error instanceof Error && error.message.includes("session expired")) {
          clearSavedSession();
          setAccessToken("");
        }
      }
    },
    [loadSheet],
  );

  useEffect(() => {
    if (restoredSession.current) return;
    restoredSession.current = true;
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (!stored) return;
      const session = JSON.parse(stored) as { accessToken?: string; expiresAt?: number };
      if (!session.accessToken || !session.expiresAt || session.expiresAt <= Date.now() + 30_000) {
        clearSavedSession();
        return;
      }
      void searchDrive(session.accessToken);
    } catch {
      clearSavedSession();
    }
  }, [searchDrive]);

  const initializeGoogle = useCallback(() => {
    if (!GOOGLE_CLIENT_ID || !window.google?.accounts?.oauth2 || tokenClient.current) return;
    tokenClient.current = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: GOOGLE_SCOPE,
      callback: (response) => {
        if (response.error || !response.access_token) {
          clearSavedSession();
          setState("error");
          setMessage(
            response.error_description ?? response.error ?? "Google sign-in did not complete.",
          );
          return;
        }
        try {
          sessionStorage.setItem(
            SESSION_STORAGE_KEY,
            JSON.stringify({
              accessToken: response.access_token,
              expiresAt: Date.now() + (response.expires_in ?? 3600) * 1000,
            }),
          );
        } catch {
          // Keep the live session working if browser storage is unavailable.
        }
        void searchDrive(response.access_token);
      },
      error_callback: (error) => {
        setState("error");
        setMessage(error.message ?? "Google sign-in was closed before it finished.");
      },
    });
  }, [searchDrive]);

  function signIn() {
    setMessage("");
    if (!tokenClient.current) {
      setState("error");
      setMessage(
        GOOGLE_CLIENT_ID
          ? "Google sign-in is still loading. Please try again in a moment."
          : "Google sign-in needs setup: add NEXT_PUBLIC_GOOGLE_CLIENT_ID to your .env.local file.",
      );
      return;
    }
    tokenClient.current.requestAccessToken({ prompt: "select_account" });
  }

  function signOut() {
    clearSavedSession();
    tokenClient.current = null;
    setAccessToken("");
    setAccountEmail("");
    setData(null);
    setMessage("");
    setNotice("");
    setNeedsReload(false);
    setState("signed-out");
    initializeGoogle();
  }

  const today = now;
  const todayKey = today ? localDateKey(today) : "";
  const breakStorageKey =
    accountEmail && todayKey ? "stamp-break-v1:" + accountEmail + ":" + todayKey : "";
  useEffect(() => {
    if (state !== "ready" || !data || !breakStorageKey) return;
    setBreakLogReady(false);
    try {
      const saved = localStorage.getItem(breakStorageKey);
      const parsed = saved
        ? (JSON.parse(saved) as { startedAt?: number | null; totalMs?: number })
        : {};
      setBreakLog({
        startedAt: typeof parsed.startedAt === "number" ? parsed.startedAt : null,
        totalMs: typeof parsed.totalMs === "number" ? parsed.totalMs : 0,
      });
    } catch {
      setBreakLog({ startedAt: null, totalMs: 0 });
    }
    setBreakLogReady(true);
  }, [breakStorageKey, data, state]);
  useEffect(() => {
    if (!breakLogReady || !breakStorageKey) return;
    try {
      localStorage.setItem(breakStorageKey, JSON.stringify(breakLog));
    } catch {
      /* Keep this break in memory if storage is unavailable. */
    }
  }, [breakLog, breakLogReady, breakStorageKey]);
  const activeBreakMs =
    breakLog.totalMs +
    (breakLog.startedAt && now ? Math.max(0, now.getTime() - breakLog.startedAt) : 0);
  const isOnBreak = breakLog.startedAt !== null;
  const todayIndex =
    data && todayKey
      ? data.rows.findIndex((row, index) => index > 0 && rowDateKey(row[0]) === todayKey)
      : -1;
  const todayRow = todayIndex >= 1 ? data?.rows[todayIndex] : undefined;
  const todayRowNumber = todayIndex >= 1 ? todayIndex + 1 : null;
  const arrivalMinutes = timeMinutes(todayRow?.[2]);
  const departureMinutes = timeMinutes(todayRow?.[3]);
  const hasArrived = arrivalMinutes !== null;
  const hasDeparted = departureMinutes !== null;
  const isWorking = hasArrived && !hasDeparted;
  const completedToday = hasArrived && hasDeparted;

  const liveTodayHours = useMemo(() => {
    if (!isWorking || arrivalMinutes === null || !now) return dayHours(todayRow);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return (
      Math.round(
        (Math.max(0, currentMinutes - arrivalMinutes - activeBreakMs / 60_000) / 60) * 10,
      ) / 10
    );
  }, [activeBreakMs, arrivalMinutes, isWorking, now, todayRow]);

  const workedSeconds =
    isWorking && arrivalMinutes !== null && now
      ? Math.max(
          0,
          Math.floor(
            now.getHours() * 3600 +
              now.getMinutes() * 60 +
              now.getSeconds() -
              arrivalMinutes * 60 -
              activeBreakMs / 1000,
          ),
        )
      : Math.round(dayHours(todayRow) * 3600);

  const writeValue = useCallback(
    async (range: string, values: unknown[][]) => {
      if (!data || !accessToken) throw new Error("Sign in to Google before recording your time.");
      const fullRange = sheetRange(data.tab.title, range);
      await googleFetch(
        `${SHEETS_API}/${encodeURIComponent(data.file.id)}/values/${encodeURIComponent(fullRange)}?valueInputOption=RAW`,
        accessToken,
        {
          method: "PUT",
          body: JSON.stringify({ range: fullRange, majorDimension: "ROWS", values }),
        },
      );
    },
    [accessToken, data],
  );

  const refreshRows = useCallback(async () => {
    if (!data || !accessToken) return;
    const fullRange = sheetRange(data.tab.title, "A:F");
    const values = await googleFetch<SheetValues>(
      `${SHEETS_API}/${encodeURIComponent(data.file.id)}/values/${encodeURIComponent(fullRange)}?valueRenderOption=UNFORMATTED_VALUE`,
      accessToken,
    );
    setData({ ...data, rows: values.values ?? [] });
  }, [accessToken, data]);

  async function recordTime() {
    if (!data || !accessToken || !now || action || completedToday || needsReload) return;
    const nextAction: ClockAction = isWorking ? "departure" : "arrival";
    const timeValue = (now.getHours() * 60 + now.getMinutes()) / 1440;
    setAction(nextAction);
    setMessage("");
    setNotice("");
    setNeedsReload(false);

    try {
      let rowNumber = todayRowNumber;
      if (rowNumber === null) {
        const dayDateSerial = dateSerial(now);
        const newRow = [
          dayDateSerial,
          weekday(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))),
          timeValue,
          "",
          0,
          "",
        ];
        const appendRange = sheetRange(data.tab.title, "A:F");
        const appendResult = await googleFetch<{
          updates?: { updatedRange?: string };
        }>(
          `${SHEETS_API}/${encodeURIComponent(data.file.id)}/values/${encodeURIComponent(appendRange)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
          accessToken,
          {
            method: "POST",
            body: JSON.stringify({ range: appendRange, majorDimension: "ROWS", values: [newRow] }),
          },
        );
        const updatedRange = appendResult.updates?.updatedRange ?? "";
        const rowMatch = updatedRange.match(/!A(\d+):/);
        rowNumber = rowMatch ? Number(rowMatch[1]) : null;
        if (rowNumber === null)
          throw new Error(
            "Stamp saved your arrival but could not identify its row. Refresh the page to reload your timecard.",
          );
        const formatRequests = [
          { startColumnIndex: 0, endColumnIndex: 1, type: "DATE", pattern: "dd.MM.yyyy" },
          { startColumnIndex: 2, endColumnIndex: 4, type: "TIME", pattern: "HH:mm" },
          { startColumnIndex: 4, endColumnIndex: 5, type: "NUMBER", pattern: "0.0" },
        ].map((format) => ({
          repeatCell: {
            range: {
              sheetId: data.tab.sheetId,
              startRowIndex: rowNumber! - 1,
              endRowIndex: rowNumber,
              startColumnIndex: format.startColumnIndex,
              endColumnIndex: format.endColumnIndex,
            },
            cell: {
              userEnteredFormat: { numberFormat: { type: format.type, pattern: format.pattern } },
            },
            fields: "userEnteredFormat.numberFormat",
          },
        }));
        await googleFetch(
          `${SHEETS_API}/${encodeURIComponent(data.file.id)}:batchUpdate`,
          accessToken,
          { method: "POST", body: JSON.stringify({ requests: formatRequests }) },
        );
      } else if (nextAction === "arrival") {
        await writeValue(`C${rowNumber}`, [[timeValue]]);
      } else {
        const start = arrivalMinutes ?? timeValue;
        const hours =
          Math.round((Math.max(0, timeValue * 1440 - start - activeBreakMs / 60_000) / 60) * 10) /
          10;
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        if (now.getDate() === lastDay) {
          const monthKey = localDateKey(now).slice(0, 7);
          const previousMonthHours = data.rows.reduce((total, row, index) => {
            if (
              index === 0 ||
              rowDateKey(row[0])?.slice(0, 7) !== monthKey ||
              rowDateKey(row[0]) === todayKey
            )
              return total;
            return total + dayHours(row);
          }, 0);
          const monthTotal = Math.round((previousMonthHours + hours) * 10) / 10;
          const rowIndex = rowNumber - 1;
          await googleFetch(
            `${SHEETS_API}/${encodeURIComponent(data.file.id)}:batchUpdate`,
            accessToken,
            {
              method: "POST",
              body: JSON.stringify({
                requests: [
                  {
                    updateCells: {
                      range: {
                        sheetId: data.tab.sheetId,
                        startRowIndex: rowIndex,
                        endRowIndex: rowNumber,
                        startColumnIndex: 3,
                        endColumnIndex: 6,
                      },
                      rows: [
                        {
                          values: [
                            { userEnteredValue: { numberValue: timeValue } },
                            { userEnteredValue: { numberValue: hours } },
                            { userEnteredValue: { numberValue: monthTotal } },
                          ],
                        },
                      ],
                      fields: "userEnteredValue",
                    },
                  },
                  {
                    repeatCell: {
                      range: {
                        sheetId: data.tab.sheetId,
                        startRowIndex: rowIndex,
                        endRowIndex: rowNumber,
                        startColumnIndex: 0,
                        endColumnIndex: 6,
                      },
                      cell: {
                        userEnteredFormat: {
                          backgroundColor: { red: 0.651, green: 0.106, blue: 0.271 },
                          textFormat: {
                            foregroundColor: { red: 1, green: 1, blue: 1 },
                            bold: true,
                          },
                        },
                      },
                      fields: "userEnteredFormat.backgroundColor,userEnteredFormat.textFormat",
                    },
                  },
                ],
              }),
            },
          );
        } else {
          await writeValue(`D${rowNumber}:E${rowNumber}`, [[timeValue, hours]]);
        }
      }

      await refreshRows();
      if (nextAction === "departure") {
        setBreakLog({ startedAt: null, totalMs: 0 });
        if (breakStorageKey) localStorage.removeItem(breakStorageKey);
      }
      setNotice(
        nextAction === "arrival"
          ? "Arrival saved to your timecard."
          : onLastDay
            ? "Departure saved. Your month total is recorded."
            : "Departure saved. Your hours are updated.",
      );
    } catch (error) {
      setMessage(errorMessage(error));
      setNeedsReload(true);
      if (error instanceof Error && error.message.includes("session expired")) {
        clearSavedSession();
        setAccessToken("");
      }
    } finally {
      setAction(null);
    }
  }

  const busy = state === "searching";
  const onLastDay = today
    ? today.getDate() === new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
    : false;

  function toggleBreak() {
    if (!now || !isWorking) return;
    setBreakLog((current) =>
      current.startedAt === null
        ? { ...current, startedAt: now.getTime() }
        : {
            startedAt: null,
            totalMs: current.totalMs + Math.max(0, now.getTime() - current.startedAt),
          },
    );
  }

  async function saveManualEntry(entry: ManualTimeEntry) {
    if (!now || !data || !accessToken) throw new Error("Sign in before adding a time entry.");
    const [year, month, day] = entry.date.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    const [startHour, startMinute] = entry.start.split(":").map(Number);
    const [endHour, endMinute] = entry.end.split(":").map(Number);
    const startMinutes = startHour * 60 + startMinute;
    let endMinutes = endHour * 60 + endMinute;
    if (endMinutes <= startMinutes) endMinutes += 1440;
    const workedHours = Math.round(((endMinutes - startMinutes) / 60) * 10) / 10;
    const dateKey = localDateKey(date);
    const rowIndex = entry.originalDate
      ? data.rows.findIndex((row, index) => index > 0 && rowDateKey(row[0]) === entry.originalDate)
      : -1;
    const conflictingRow = data.rows.findIndex(
      (row, index) => index > 0 && rowDateKey(row[0]) === dateKey && index !== rowIndex,
    );
    if (conflictingRow >= 1)
      throw new Error(
        "A time entry already exists for that date. Open it from the list to edit it.",
      );
    const rowNumber = rowIndex >= 1 ? rowIndex + 1 : null;
    const values = [
      [
        weekday(new Date(Date.UTC(year, month - 1, day))),
        startMinutes / 1440,
        (endMinutes % 1440) / 1440,
        workedHours,
        entry.note.trim(),
      ],
    ];
    setAction("manual");
    setMessage("");
    try {
      if (rowNumber !== null) {
        await writeValue("A" + rowNumber + ":F" + rowNumber, [[dateSerial(date), ...values[0]]]);
      } else {
        const range = sheetRange(data.tab.title, "A:F");
        const url =
          SHEETS_API +
          "/" +
          encodeURIComponent(data.file.id) +
          "/values/" +
          encodeURIComponent(range) +
          ":append?valueInputOption=RAW&insertDataOption=INSERT_ROWS";
        const result = await googleFetch<{ updates?: { updatedRange?: string } }>(
          url,
          accessToken,
          {
            method: "POST",
            body: JSON.stringify({
              range,
              majorDimension: "ROWS",
              values: [[dateSerial(date), ...values[0]]],
            }),
          },
        );
        const match = result.updates?.updatedRange?.match(/!A(\d+):/);
        if (match) {
          const addedRow = Number(match[1]);
          const formats = [
            { startColumnIndex: 0, endColumnIndex: 1, type: "DATE", pattern: "dd.MM.yyyy" },
            { startColumnIndex: 2, endColumnIndex: 4, type: "TIME", pattern: "HH:mm" },
            { startColumnIndex: 4, endColumnIndex: 5, type: "NUMBER", pattern: "0.0" },
          ].map((format) => ({
            repeatCell: {
              range: {
                sheetId: data.tab.sheetId,
                startRowIndex: addedRow - 1,
                endRowIndex: addedRow,
                startColumnIndex: format.startColumnIndex,
                endColumnIndex: format.endColumnIndex,
              },
              cell: {
                userEnteredFormat: { numberFormat: { type: format.type, pattern: format.pattern } },
              },
              fields: "userEnteredFormat.numberFormat",
            },
          }));
          await googleFetch(
            SHEETS_API + "/" + encodeURIComponent(data.file.id) + ":batchUpdate",
            accessToken,
            {
              method: "POST",
              body: JSON.stringify({ requests: formats }),
            },
          );
        }
      }
      await refreshRows();
      setNotice("Time entry saved to your timecard.");
    } catch (error) {
      setMessage(errorMessage(error));
      throw error;
    } finally {
      setAction(null);
    }
  }

  return (
    <div className="stamp-app">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={initializeGoogle}
      />
      {state === "ready" && data && now ? (
        <StampDashboard
          data={data}
          accountEmail={accountEmail}
          now={now}
          isWorking={isWorking}
          completedToday={completedToday}
          isOnBreak={isOnBreak}
          workedSeconds={workedSeconds}
          action={action}
          clockBlocked={needsReload}
          liveTodayHours={liveTodayHours}
          notice={notice}
          error={message}
          onClock={recordTime}
          onToggleBreak={toggleBreak}
          onSaveManual={saveManualEntry}
          onSignOut={signOut}
          onRefresh={() => {
            if (!accessToken) {
              signOut();
              return;
            }
            setNeedsReload(false);
            setMessage("");
            void refreshRows().catch((error) => setMessage(errorMessage(error)));
          }}
        />
      ) : (
        <div className="stamp-connect-page">
          <header className="stamp-connect-top">
            <a className="stamp-mobile-brand" href="/stamp">
              <Image src="/stamp/logo-master.svg" alt="" width={32} height={30} />
              <strong>
                stamp
                <span className="stamp-wordmark-dot" aria-hidden="true" />
              </strong>
            </a>
            <StampPwa />
          </header>
          <main className="stamp-connect-content">
            <a className="stamp-connect-brand" href="/stamp" aria-label="Stamp home">
              <Image src="/stamp/logo-master.svg" alt="" width={58} height={56} priority />
              <strong>
                stamp
                <span className="stamp-wordmark-dot" aria-hidden="true" />
              </strong>
            </a>
            <h1>Make time count.</h1>
            <p className="stamp-connect-lead">
              Track work hours and save them to your Google Sheet.
            </p>
            <section className="stamp-connect-panel">
              <div className="stamp-connect-heading">
                <div className="stamp-connect-icon">
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <h2>
                    {state === "not-found" ? "Sheet not found" : "Connect your work-hours sheet"}
                  </h2>
                  <p>
                    Stamp looks for <strong>{TARGET_SHEET_NAME}</strong> in your Google Drive.
                  </p>
                </div>
              </div>
              {busy && (
                <div className="stamp-searching">
                  <LoaderCircle size={19} className="stamp-spinner" /> Connecting to your timecard…
                </div>
              )}
              {state === "not-found" && (
                <div className="stamp-message" role="status">
                  No Google Sheets file named <strong>{TARGET_SHEET_NAME}</strong> was found in this
                  account.
                </div>
              )}
              {state === "error" && message && (
                <div className="stamp-message is-error" role="alert">
                  {message}
                </div>
              )}
              {!GOOGLE_CLIENT_ID && (
                <p className="stamp-setup-note">
                  Add a Google OAuth web client ID to <code>.env.local</code> to enable sign-in.
                </p>
              )}
              <button
                className="stamp-signin-button"
                type="button"
                onClick={signIn}
                disabled={busy}
              >
                <GoogleGlyph />
                {state === "not-found" || state === "error" ? "Try again" : "Continue with Google"}
              </button>
              <p className="stamp-privacy-note">
                Sign in to let Stamp update this timecard in Google Sheets.
              </p>
            </section>
          </main>
        </div>
      )}
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" width="19" height="19">
      <path
        fill="#4285F4"
        d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.7c3.9-3.6 6-8.8 6-15Z"
      />
      <path
        fill="#34A853"
        d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.7-5.1c-1.8 1.2-4 2-6.8 2-5.2 0-9.7-3.5-11.3-8.2H5.8v5.3A20 20 0 0 0 24 44Z"
      />
      <path fill="#FBBC05" d="M12.7 27.8a12 12 0 0 1 0-7.6v-5.3H5.8a20 20 0 0 0 0 18.2l6.9-5.3Z" />
      <path
        fill="#EA4335"
        d="M24 12c3 0 5.7 1 7.8 3.1l5.8-5.8C34.1 5.9 29.5 4 24 4A20 20 0 0 0 5.8 14.9l6.9 5.3C14.3 15.5 18.8 12 24 12Z"
      />
    </svg>
  );
}
