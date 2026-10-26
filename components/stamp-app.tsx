"use client";

import Script from "next/script";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowUpRight,
  Check,
  Clock3,
  FileSpreadsheet,
  LoaderCircle,
  LogOut,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const TARGET_SHEET_NAME = "Triglav_Delovne_Ure";
const SESSION_STORAGE_KEY = "stamp-google-session-v1";
const GOOGLE_SCOPE =
  "openid email https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/spreadsheets";
const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";
const DAY_MS = 86_400_000;
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
type ClockAction = "arrival" | "departure" | null;

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
  const start = timeMinutes(row[2]);
  const end = timeMinutes(row[3]);
  if (start !== null && end !== null) {
    return Math.round((Math.max(0, end - start) / 60) * 10) / 10;
  }
  return decimalHours(row[4]);
}

function formatTime(minutes: number | null) {
  if (minutes === null) return "— — : — —";
  const normalized = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`;
}

function formatHours(hours: number) {
  if (Math.abs(hours) < 0.05) return "0 h";
  return `${new Intl.NumberFormat("en-GB", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(hours)} h`;
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

  useEffect(() => {
    const update = () => setNow(new Date());
    update();
    const timer = window.setInterval(update, 30_000);
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

  const monthHours = useMemo(() => {
    if (!data || !today) return 0;
    const month = todayKey.slice(0, 7);
    return data.rows.reduce((total, row, index) => {
      if (index === 0 || rowDateKey(row[0])?.slice(0, 7) !== month) return total;
      return total + dayHours(row);
    }, 0);
  }, [data, today, todayKey]);

  const liveTodayHours = useMemo(() => {
    if (!isWorking || arrivalMinutes === null || !now) return dayHours(todayRow);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return Math.round((Math.max(0, currentMinutes - arrivalMinutes) / 60) * 10) / 10;
  }, [arrivalMinutes, isWorking, now, todayRow]);

  const monthlyTotal = monthHours + (isWorking ? liveTodayHours : 0);

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
    if (!data || !accessToken || !now || action || completedToday) return;
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
        const hours = Math.round((Math.max(0, timeValue * 1440 - start) / 60) * 10) / 10;
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

  return (
    <div className="stamp-app">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={initializeGoogle}
      />
      <header className="stamp-topbar">
        <a className="stamp-wordmark" href="/stamp" aria-label="Stamp home">
          <span className="stamp-mark">S</span>
          <span>stamp</span>
        </a>
        <span className="stamp-local-label">
          <span /> Timecard
        </span>
      </header>

      <div className="stamp-main">
        <section className="stamp-intro" aria-labelledby="stamp-title">
          <p className="stamp-eyebrow">STAMP · TIME TRACKER</p>
          <h1 id="stamp-title">A gde je pečat?</h1>
          <p className="stamp-date">
            {today
              ? new Intl.DateTimeFormat("en-GB", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                }).format(today)
              : "Your simple work timecard."}
          </p>
        </section>

        <section className="stamp-card" aria-live="polite">
          {state === "ready" && data ? (
            <>
              <div className="stamp-card-top">
                <span className="stamp-status is-connected">
                  <i /> Signed in{accountEmail ? ` · ${accountEmail}` : " with Google"}
                </span>
                <button
                  className="stamp-signout"
                  type="button"
                  onClick={signOut}
                  aria-label="Sign out"
                >
                  <LogOut size={16} />
                </button>
              </div>

              <div className="stamp-timecard">
                <div className="stamp-today-line">
                  <div>
                    <span className="stamp-eyebrow">TODAY</span>
                    <strong>
                      {today
                        ? new Intl.DateTimeFormat("en-GB", {
                            weekday: "long",
                            timeZone: "UTC",
                          }).format(
                            new Date(
                              Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()),
                            ),
                          )
                        : "—"}
                    </strong>
                  </div>
                  <div className="stamp-live-clock">
                    <Clock3 size={15} />
                    {today ? formatTime(today.getHours() * 60 + today.getMinutes()) : "— — : — —"}
                  </div>
                  <span
                    className={`stamp-status-dot ${isWorking ? "is-working" : completedToday ? "is-done" : ""}`}
                  >
                    <i />
                    {isWorking ? "At work" : completedToday ? "Done" : "Not started"}
                  </span>
                </div>

                <div
                  className={`stamp-action-panel ${isWorking ? "is-working" : completedToday ? "is-complete" : ""}`}
                >
                  <div
                    className="stamp-action-icon"
                    key={isWorking ? "departure" : completedToday ? "complete" : "arrival"}
                  >
                    {completedToday ? (
                      <Check size={23} />
                    ) : isWorking ? (
                      <ArrowUpFromLine size={23} />
                    ) : (
                      <ArrowDownToLine size={23} />
                    )}
                  </div>
                  <h2>
                    {completedToday
                      ? "You’re all set."
                      : isWorking
                        ? "Wrapping up?"
                        : "Ready to start?"}
                  </h2>
                  <p>
                    {completedToday
                      ? "Your workday has been saved."
                      : isWorking
                        ? "Tap once more when you leave."
                        : "Tap when you arrive at work."}
                  </p>
                  <button
                    className={`stamp-clock-button ${isWorking ? "is-out" : ""} ${completedToday ? "is-complete" : ""}`}
                    type="button"
                    onClick={recordTime}
                    disabled={Boolean(action) || completedToday || needsReload}
                  >
                    {action ? (
                      <LoaderCircle size={18} className="stamp-spinner" />
                    ) : completedToday ? (
                      <Check size={18} />
                    ) : isWorking ? (
                      <ArrowUpFromLine size={18} />
                    ) : (
                      <ArrowDownToLine size={18} />
                    )}
                    {action === "arrival"
                      ? "Saving arrival…"
                      : action === "departure"
                        ? "Saving departure…"
                        : completedToday
                          ? "Completed today"
                          : isWorking
                            ? "Mark departure"
                            : "Mark arrival"}
                  </button>
                </div>

                <div className="stamp-day-summary">
                  <div>
                    <span>ARRIVAL</span>
                    <strong>{formatTime(arrivalMinutes)}</strong>
                  </div>
                  <div>
                    <span>DEPARTURE</span>
                    <strong>{formatTime(departureMinutes)}</strong>
                  </div>
                  <div>
                    <span>HOURS TODAY</span>
                    <strong>{formatHours(liveTodayHours)}</strong>
                  </div>
                </div>
              </div>

              <div className="stamp-month-card">
                <div className="stamp-month-icon">
                  <FileSpreadsheet size={17} />
                </div>
                <div className="stamp-month-copy">
                  <span>
                    {today
                      ? new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(
                          today,
                        )
                      : "This month"}
                  </span>
                  <strong>Hours worked</strong>
                </div>
                <div className="stamp-month-total">{formatHours(monthlyTotal)}</div>
              </div>

              {data.file.webViewLink ? (
                <div className="stamp-sheet-link-row">
                  <a
                    className="stamp-open-sheet-button"
                    href={data.file.webViewLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open spreadsheet <ArrowUpRight size={15} />
                  </a>
                </div>
              ) : null}
              {onLastDay ? (
                <p className="stamp-month-end-note">
                  <Check size={14} /> Month total is added to NOTE when you clock out.
                </p>
              ) : null}
              {notice ? (
                <p className="stamp-success-message" role="status">
                  <Check size={15} />
                  {notice}
                </p>
              ) : null}
              {message ? (
                <div className="stamp-message is-error" role="alert">
                  <p>{message}</p>
                  {needsReload ? (
                    <button type="button" onClick={signOut}>
                      Reconnect to reload sheet
                    </button>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : (
            <>
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
              {busy ? (
                <div className="stamp-searching">
                  <LoaderCircle size={19} className="stamp-spinner" /> Connecting to your timecard…
                </div>
              ) : null}
              {state === "not-found" ? (
                <div className="stamp-message" role="status">
                  No Google Sheets file named <strong>{TARGET_SHEET_NAME}</strong> was found in this
                  account.
                </div>
              ) : null}
              {state === "error" && message ? (
                <div className="stamp-message is-error" role="alert">
                  {message}
                </div>
              ) : null}
              {!GOOGLE_CLIENT_ID ? (
                <p className="stamp-setup-note">
                  Add a Google OAuth web client ID to <code>.env.local</code> to enable sign-in.
                </p>
              ) : null}
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
            </>
          )}
        </section>
      </div>
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
