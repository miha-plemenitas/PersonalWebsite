"use client";

import Image from "next/image";
import { StampPwa } from "@/components/stamp-pwa";
import {
  ArrowUpRight,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Home,
  LoaderCircle,
  LogOut,
  Moon,
  Pause,
  Play,
  Plus,
  Settings,
  Sun,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type SheetData = {
  file: { id: string; name: string; mimeType: string; webViewLink?: string };
  tab: { sheetId: number; title: string };
  rows: unknown[][];
};
export type ManualTimeEntry = {
  date: string;
  originalDate?: string;
  start: string;
  end: string;
  note: string;
};
type View = "overview" | "timecard" | "insights" | "settings";
type GoalKey = "dailyGoal" | "weeklyGoal" | "monthlyGoal";
type Props = {
  data: SheetData;
  accountEmail: string;
  now: Date;
  isWorking: boolean;
  completedToday: boolean;
  isOnBreak: boolean;
  action: "arrival" | "departure" | "manual" | null;
  clockBlocked: boolean;
  liveTodayHours: number;
  workedSeconds: number;
  notice: string;
  error: string;
  onClock: () => void;
  onToggleBreak: () => void;
  onSaveManual: (entry: ManualTimeEntry) => Promise<void>;
  onSignOut: () => void;
  onRefresh: () => void;
};
const views: { id: View; label: string; Icon: typeof Home }[] = [
  { id: "overview", label: "Overview", Icon: Home },
  { id: "timecard", label: "Timecard", Icon: CalendarDays },
  { id: "insights", label: "Insights", Icon: ChartNoAxesColumnIncreasing },
  { id: "settings", label: "Settings", Icon: Settings },
];
const prefsKey = "stamp-dashboard-preferences-v1";
const dayMs = 86400000;
function storedGoal(value: unknown, fallback: number, max: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0
    ? Math.max(1, Math.min(max, Math.round(parsed)))
    : fallback;
}
const keyOf = (d: Date) =>
  d.getFullYear() +
  "-" +
  String(d.getMonth() + 1).padStart(2, "0") +
  "-" +
  String(d.getDate()).padStart(2, "0");
function dateKey(v: unknown): string | null {
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
function keyOfUtc(d: Date) {
  return (
    d.getUTCFullYear() +
    "-" +
    String(d.getUTCMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getUTCDate()).padStart(2, "0")
  );
}
function minutes(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v))
    return Math.round((((v % 1) + 1) % 1) * 1440) % 1440;
  if (typeof v === "string") {
    const m = v.trim().match(/^(\d{1,2}):(\d{2})/);
    if (m) return Number(m[1]) * 60 + Number(m[2]);
  }
  return null;
}
function hours(row: unknown[] | undefined) {
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
function duration(value: number) {
  const m = Math.max(0, Math.round(value * 60));
  return Math.floor(m / 60) + "h " + String(m % 60).padStart(2, "0") + "m";
}
function fmt(d: Date, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-GB", options).format(d);
}
function monthName(d: Date) {
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(d);
}

export function StampDashboard(p: Props) {
  const [view, setView] = useState<View>("overview");
  const [offset, setOffset] = useState(0);
  const [dialog, setDialog] = useState(false);
  const [entry, setEntry] = useState<ManualTimeEntry>({
    date: keyOf(p.now),
    start: "09:00",
    end: "17:00",
    note: "",
  });
  const [entryError, setEntryError] = useState("");
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [dailyGoal, setDailyGoal] = useState(8);
  const [weeklyGoal, setWeeklyGoal] = useState(40);
  const [monthlyGoal, setMonthlyGoal] = useState(80);
  const [goalDrafts, setGoalDrafts] = useState<Record<GoalKey, string>>({
    dailyGoal: "8",
    weeklyGoal: "40",
    monthlyGoal: "80",
  });
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem(prefsKey) || "{}");
      if (v.theme === "dark" || v.theme === "light") setTheme(v.theme);
      else setTheme(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      const daily = storedGoal(v.dailyGoal, 8, 24);
      const weekly = storedGoal(v.weeklyGoal, 40, 168);
      const monthly = storedGoal(v.monthlyGoal, 80, 744);
      setDailyGoal(daily);
      setWeeklyGoal(weekly);
      setMonthlyGoal(monthly);
      setGoalDrafts({
        dailyGoal: String(daily),
        weeklyGoal: String(weekly),
        monthlyGoal: String(monthly),
      });
    } catch {
      /* keep defaults */
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded)
      try {
        localStorage.setItem(
          prefsKey,
          JSON.stringify({ theme, dailyGoal, weeklyGoal, monthlyGoal }),
        );
      } catch {
        /* settings remain active for this visit */
      }
  }, [dailyGoal, loaded, monthlyGoal, theme, weeklyGoal]);

  const todayKey = keyOf(p.now),
    month = useMemo(
      () => new Date(p.now.getFullYear(), p.now.getMonth() + offset, 1),
      [offset, p.now],
    );
  const rows = useMemo(
    () =>
      p.data.rows
        .map((row, index) => ({ row, index, key: dateKey(row[0]) }))
        .filter((x) => x.index > 0 && x.key)
        .sort((a, b) => (b.key || "").localeCompare(a.key || "")),
    [p.data.rows],
  );
  const monthRows = rows.filter((x) =>
    (x.key || "").startsWith(
      month.getFullYear() + "-" + String(month.getMonth() + 1).padStart(2, "0"),
    ),
  );
  const todayRow = rows.find((x) => x.key === todayKey)?.row;
  const monthTotal =
    monthRows.reduce((sum, x) => sum + hours(x.row), 0) +
    (month.getFullYear() === p.now.getFullYear() &&
    month.getMonth() === p.now.getMonth() &&
    p.isWorking
      ? p.liveTodayHours
      : 0);
  const weekStart = new Date(p.now.getFullYear(), p.now.getMonth(), p.now.getDate());
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    const key = keyOf(date),
      r = rows.find((x) => x.key === key);
    return {
      date,
      key,
      hours: key === todayKey && p.isWorking ? p.liveTodayHours : r ? hours(r.row) : 0,
    };
  });
  const weekTotal = weekDays.reduce((n, d) => n + d.hours, 0);
  const percent = Math.min(100, Math.round((p.liveTodayHours / dailyGoal) * 100));
  const monthPercent = monthlyGoal
    ? Math.min(100, Math.round((monthTotal / monthlyGoal) * 100))
    : 0;
  const weekend = p.now.getDay() === 0 || p.now.getDay() === 6;
  const dayOff = weekend && !todayRow;
  const tone = dayOff
    ? p.now.getDay() === 6
      ? "orange"
      : "yellow"
    : p.isWorking || p.completedToday
      ? "crimson"
      : "yellow";
  const viewLabel = views.find((x) => x.id === view)?.label || "Overview";

  function openEntry(date = todayKey, row?: unknown[]) {
    const existing = row ? { key: date, row } : rows.find((x) => x.key === date);
    const values = existing?.row;
    setEntry({
      date,
      originalDate: existing ? date : undefined,
      start: values ? timeInput(values[2]) : "09:00",
      end: values ? timeInput(values[3]) : "17:00",
      note: values ? String(values[5] || "") : "",
    });
    setEntryError("");
    setDialog(true);
  }
  async function saveEntry(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setEntryError("");
    if (rows.some((x) => x.key === entry.date && x.key !== entry.originalDate)) {
      setEntryError("An entry already exists for that date. Open it from the list to edit it.");
      setSaving(false);
      return;
    }
    try {
      await p.onSaveManual(entry);
      setDialog(false);
    } catch (err) {
      setEntryError(err instanceof Error ? err.message : "Unable to save this entry.");
    } finally {
      setSaving(false);
    }
  }
  function changeMonth(n: number) {
    setOffset((x) => x + n);
  }
  function Nav({ mobile = false }: { mobile?: boolean }) {
    return (
      <nav className={mobile ? "stamp-bottom-nav" : "stamp-side-nav"} aria-label="Stamp sections">
        {views.map(({ id, label, Icon }) => (
          <button
            type="button"
            key={id}
            className={"stamp-nav-item " + (view === id ? "is-active" : "")}
            onClick={() => setView(id)}
            aria-current={view === id ? "page" : undefined}
          >
            <Icon size={20} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    );
  }
  function DailyCard() {
    return (
      <section className={"stamp-daily-card tone-" + tone}>
        <div className="stamp-daily-top">
          <div className="stamp-card-title">
            <Clock3 size={21} />
            <h2>{dayOff ? fmt(p.now, { weekday: "long" }) : "Today’s time"}</h2>
          </div>
          <span className={"stamp-session-pill " + (p.isWorking ? "is-live" : "")}>
            {dayOff ? (
              "DAY OFF"
            ) : p.isWorking ? (
              <>
                <i /> LIVE
              </>
            ) : p.completedToday ? (
              "SAVED"
            ) : (
              "READY"
            )}
          </span>
        </div>
        {dayOff ? (
          <div className="stamp-day-off-copy">
            <h3>{p.now.getDay() === 6 ? "Hello, Saturday." : "Slow Sunday."}</h3>
            <p>No work scheduled. Your time is yours.</p>
            <div className="stamp-next-workday">
              <span>NEXT WORKDAY</span>
              <strong>
                {fmt(
                  new Date(
                    p.now.getFullYear(),
                    p.now.getMonth(),
                    p.now.getDate() + (p.now.getDay() === 6 ? 2 : 1),
                  ),
                  { weekday: "short", day: "numeric", month: "short" },
                )}
              </strong>
              <b>{dailyGoal}h planned</b>
            </div>
            <p className="stamp-weekend-reassurance">No clock-in needed</p>
          </div>
        ) : (
          <>
            <div className="stamp-clock-display">
              {clockDisplay(p.workedSeconds)}
              {p.isOnBreak ? " · BREAK" : ""}
            </div>
            <div className="stamp-goal-summary">
              <span>
                {p.completedToday
                  ? duration(Math.max(0, dailyGoal - p.liveTodayHours)) + " below daily goal"
                  : "of " + dailyGoal + "h daily goal"}
              </span>
              <b>{percent}%</b>
            </div>
            <div className="stamp-goal-track">
              <i style={{ width: percent + "%" }} />
            </div>
            <div className="stamp-goal-caption">
              <span>Daily goal · {dailyGoal}h</span>
              <span>
                {p.isWorking
                  ? duration(Math.max(0, dailyGoal - p.liveTodayHours)) + " to goal"
                  : p.completedToday
                    ? "Session saved"
                    : dailyGoal + "h planned"}
              </span>
            </div>
            {p.isWorking ? (
              <div className="stamp-daily-actions">
                <button
                  className="stamp-break-button"
                  type="button"
                  onClick={p.onToggleBreak}
                  disabled={Boolean(p.action) || p.clockBlocked}
                >
                  {p.isOnBreak ? <Play size={17} /> : <Pause size={17} />}
                  {p.isOnBreak ? "End break" : "Take a break"}
                </button>
                <button
                  className="stamp-clock-out-button"
                  type="button"
                  onClick={p.onClock}
                  disabled={Boolean(p.action) || p.clockBlocked}
                >
                  {p.action === "departure" ? (
                    <LoaderCircle className="stamp-spinner" size={17} />
                  ) : (
                    <span className="stamp-stop-icon" />
                  )}
                  Clock out
                </button>
              </div>
            ) : p.completedToday ? (
              <div className="stamp-saved-state">
                <Check size={16} /> Saved to Google Sheets
              </div>
            ) : (
              <button
                className="stamp-clock-in-button"
                type="button"
                onClick={p.onClock}
                disabled={Boolean(p.action) || p.clockBlocked}
              >
                {p.action === "arrival" && <LoaderCircle className="stamp-spinner" size={17} />}
                Clock in
              </button>
            )}
          </>
        )}
      </section>
    );
  }
  function WeeklyCard() {
    return (
      <section className="stamp-week-card">
        <div className="stamp-section-head">
          <h2>Your week</h2>
          <button
            className="stamp-icon-link"
            type="button"
            onClick={() => setView("timecard")}
            aria-label="Open timecard"
          >
            <ArrowUpRight size={22} />
          </button>
        </div>
        <div className="stamp-week-total">
          <strong>{duration(weekTotal)}</strong>
          <span>/ {weeklyGoal}h goal</span>
          <span className="stamp-week-range">
            {fmt(weekStart, { day: "numeric", month: "short" })}–
            {fmt(new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6), {
              day: "numeric",
              month: "long",
            })}
          </span>
        </div>
        <div
          className="stamp-week-chart"
          role="img"
          aria-label={"This week: " + duration(weekTotal) + " of " + weeklyGoal + " hours"}
        >
          {weekDays.map((d, i) => (
            <button
              type="button"
              key={d.key}
              className={"stamp-week-day " + (d.key === todayKey ? "is-today" : "")}
              aria-label={
                fmt(d.date, { weekday: "long", day: "numeric" }) + ", " + duration(d.hours)
              }
              onClick={() => {
                setOffset(
                  (d.date.getFullYear() - p.now.getFullYear()) * 12 +
                    d.date.getMonth() -
                    p.now.getMonth(),
                );
                setView("timecard");
              }}
            >
              <span className="stamp-bar-track">
                <i
                  className={d.hours ? (i === 0 ? "is-complete" : "is-today-fill") : ""}
                  style={{
                    height:
                      Math.max(
                        d.hours ? 10 : 0,
                        Math.min(100, (d.hours / Math.max(1, weeklyGoal / 5)) * 100),
                      ) + "%",
                  }}
                />
                {d.hours > 0 && <b>{d.hours.toFixed(d.hours % 1 ? 1 : 0)}h</b>}
              </span>
              <span className="stamp-week-day-label">{fmt(d.date, { weekday: "short" })}</span>
              {d.key === todayKey && <i className="stamp-current-day-dot" />}
            </button>
          ))}
        </div>
      </section>
    );
  }
  function Metrics() {
    const extra = Math.max(0, monthTotal - monthlyGoal);
    return (
      <div className="stamp-insight-cards">
        <button className="stamp-insight-card tone-black" onClick={() => setView("timecard")}>
          <span>
            <CalendarDays size={19} /> This month <ArrowUpRight size={19} />
          </span>
          <strong>{duration(monthTotal)}</strong>
          <small>
            of {monthlyGoal}h monthly goal · {monthPercent}%
          </small>
          <i style={{ width: Math.min(100, monthPercent) + "%" }} />
        </button>
        <button className="stamp-insight-card tone-yellow" onClick={() => setView("insights")}>
          <span>
            <ChartNoAxesColumnIncreasing size={19} /> Extra hours <ArrowUpRight size={19} />
          </span>
          <strong>+{duration(extra)}</strong>
          <small>
            {extra
              ? "Above your " + monthlyGoal + "h monthly goal"
              : "Keep building your monthly total"}
          </small>
        </button>
        <button className="stamp-insight-card tone-orange" onClick={() => setView("insights")}>
          <span>
            <Clock3 size={19} /> Goal completion <ArrowUpRight size={19} />
          </span>
          <strong>{monthPercent}%</strong>
          <small>
            {monthPercent >= 100
              ? "Goal reached · keep tracking"
              : duration(monthlyGoal - monthTotal) + " to monthly goal"}
          </small>
        </button>
      </div>
    );
  }
  function Activity({ full = false }: { full?: boolean }) {
    const list = full ? monthRows : rows.slice(0, 4);
    return (
      <section className="stamp-recent-card">
        <div className="stamp-recent-head">
          <h2>{full ? "Entries" : "Recent activity"}</h2>
          {!full && (
            <button className="stamp-text-link" type="button" onClick={() => setView("timecard")}>
              View timecard <ArrowUpRight size={18} />
            </button>
          )}
        </div>
        <div className="stamp-recent-table">
          <div className="stamp-table-head">
            <span>DATE</span>
            <span>DAILY GOAL</span>
            <span>GOAL PROGRESS</span>
            <span>TOTAL</span>
            <span>STATUS</span>
          </div>
          {list.length ? (
            list.map(({ row, key }) => {
              const d = key ? new Date(key + "T12:00:00") : p.now,
                h = key === todayKey && p.isWorking ? p.liveTodayHours : hours(row),
                end = minutes(row[3]) !== null,
                active = key === todayKey && p.isWorking;
              return (
                <button
                  type="button"
                  key={key}
                  className="stamp-recent-row"
                  onClick={() => openEntry(key || todayKey, row)}
                >
                  <span className="stamp-recent-date-cell">
                    <span className="stamp-date-tile">
                      <b>{d.getDate()}</b>
                    </span>
                    <span className="stamp-recent-date">
                      <strong>{key === todayKey ? "Today" : fmt(d, { weekday: "short" })}</strong>
                      <small>{fmt(d, { weekday: "short", day: "numeric", month: "short" })}</small>
                    </span>
                  </span>
                  <span>{dailyGoal}h</span>
                  <span>{Math.min(100, Math.round((h / dailyGoal) * 100))}%</span>
                  <strong>{duration(h)}</strong>
                  <span
                    className={"stamp-row-status " + (active ? "is-live" : end ? "is-synced" : "")}
                  >
                    {active ? (
                      "In progress"
                    ) : end ? (
                      <>
                        <Check size={14} /> Synced
                      </>
                    ) : (
                      "In progress"
                    )}
                  </span>
                </button>
              );
            })
          ) : (
            <p className="stamp-empty-state">Saved time entries will appear here.</p>
          )}
        </div>
        <p className="stamp-data-caption">Google Sheets · {p.accountEmail}</p>
      </section>
    );
  }
  const heading = (label: string, title: string) => (
    <div className="stamp-view-heading">
      <div>
        <p className="stamp-eyebrow">{label}</p>
        <h1>{title}</h1>
      </div>
    </div>
  );
  function Timecard() {
    return (
      <section className="stamp-page-view">
        {heading("YOUR WORK TIMECARD", "Timecard")}
        <div className="stamp-month-switch">
          <button onClick={() => changeMonth(-1)} aria-label="Previous month">
            <ChevronLeft size={19} />
          </button>
          <strong>{monthName(month)}</strong>
          <button onClick={() => changeMonth(1)} aria-label="Next month">
            <ChevronRight size={19} />
          </button>
          <button className="stamp-primary-button" onClick={() => openEntry()}>
            <Plus size={18} /> Add entry
          </button>
        </div>
        <section className="stamp-recent-card stamp-timecard-table">
          <div className="stamp-table-head">
            <span>DATE</span>
            <span>ARRIVAL</span>
            <span>DEPARTURE</span>
            <span>HOURS</span>
            <span>NOTE</span>
          </div>
          {monthRows.length ? (
            monthRows.map(({ row, key }) => {
              const d = key ? new Date(key + "T12:00:00") : p.now;
              return (
                <button
                  className="stamp-timecard-row"
                  key={key}
                  type="button"
                  onClick={() => openEntry(key || todayKey, row)}
                >
                  <span>{fmt(d, { weekday: "short", day: "numeric", month: "short" })}</span>
                  <span>{formatSheetTime(row[2])}</span>
                  <span>{formatSheetTime(row[3])}</span>
                  <strong>{duration(hours(row))}</strong>
                  <span>{String(row[5] || "") || "—"}</span>
                </button>
              );
            })
          ) : (
            <p className="stamp-empty-state">No entries for {monthName(month)} yet.</p>
          )}
        </section>
        <p className="stamp-view-footnote">Select an entry to edit its date, time, and note.</p>
      </section>
    );
  }
  function Insights() {
    const max = Math.max(8, ...monthRows.map((x) => hours(x.row)));
    const avg = monthRows.length ? monthTotal / monthRows.length : 0;
    return (
      <section className="stamp-page-view">
        {heading("MONTHLY OVERVIEW", "Insights")}
        <Metrics />
        <section className="stamp-recent-card stamp-insights-chart">
          <div className="stamp-section-head">
            <h2>Daily hours</h2>
            <span>{monthRows.length} recorded days</span>
          </div>
          {monthRows
            .slice()
            .reverse()
            .map(({ row, key }) => (
              <div className="stamp-month-bar-row" key={key}>
                <span>{key}</span>
                <div>
                  <i style={{ width: Math.min(100, (hours(row) / max) * 100) + "%" }} />
                </div>
                <strong>{duration(hours(row))}</strong>
              </div>
            ))}
        </section>
        <div className="stamp-summary-cards">
          <div>
            <span>MONTH TOTAL</span>
            <strong>{duration(monthTotal)}</strong>
          </div>
          <div>
            <span>DAILY AVERAGE</span>
            <strong>{duration(avg)}</strong>
          </div>
          <div>
            <span>GOAL PROGRESS</span>
            <strong>{monthPercent}%</strong>
          </div>
        </div>
      </section>
    );
  }
  function Settings() {
    const setting = (
      key: GoalKey,
      label: string,
      value: number,
      set: (n: number) => void,
      max: number,
    ) => (
      <label className="stamp-setting-row">
        {label}
        <span>
          <input
            type="number"
            min="1"
            max={max}
            step="1"
            inputMode="numeric"
            aria-label={label}
            value={goalDrafts[key]}
            onChange={(e) => setGoalDrafts((current) => ({ ...current, [key]: e.target.value }))}
            onBlur={() => {
              const parsed = Number(goalDrafts[key]);
              const next =
                Number.isFinite(parsed) && parsed > 0 ? Math.min(max, Math.round(parsed)) : value;
              set(next);
              setGoalDrafts((current) => ({ ...current, [key]: String(next) }));
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
          />{" "}
          hours
        </span>
      </label>
    );
    return (
      <section className="stamp-page-view">
        {heading("MAKE STAMP YOURS", "Settings")}
        <section className="stamp-settings-card">
          <div className="stamp-settings-title">
            <div>
              <h2>Appearance</h2>
              <p>Choose how Stamp looks on this device.</p>
            </div>
            <button
              className="stamp-theme-button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              {theme}
            </button>
          </div>
          <div className="stamp-settings-title">
            <div>
              <h2>Work goals</h2>
              <p>Applied to your dashboard and saved on this device.</p>
            </div>
          </div>
          {setting("dailyGoal", "Daily goal", dailyGoal, setDailyGoal, 24)}
          {setting("weeklyGoal", "Weekly goal", weeklyGoal, setWeeklyGoal, 168)}
          {setting("monthlyGoal", "Monthly goal", monthlyGoal, setMonthlyGoal, 744)}
        </section>
        <section className="stamp-settings-card stamp-account-card">
          <div>
            <h2>Google Sheets</h2>
            <p>{p.accountEmail}</p>
            <p className="stamp-save-state">
              <Check size={15} /> All changes saved
            </p>
          </div>
          <button className="stamp-secondary-button" onClick={p.onRefresh}>
            Refresh timecard
          </button>
        </section>
        <section className="stamp-settings-card stamp-account-card stamp-install-card">
          <div>
            <h2>Install Stamp</h2>
            <p>Add Stamp to your Home Screen for a focused, app-like timecard.</p>
          </div>
          <StampPwa />
        </section>
        <section className="stamp-settings-card stamp-account-card">
          <div>
            <h2>Personal workspace</h2>
            <p>{p.accountEmail}</p>
          </div>
          <button className="stamp-secondary-button" onClick={p.onSignOut}>
            <LogOut size={15} /> Sign out
          </button>
        </section>
      </section>
    );
  }

  return (
    <div className="stamp-dashboard" data-theme={theme}>
      <aside className="stamp-sidebar">
        <a href="/stamp" className="stamp-dashboard-brand">
          <Image src="/stamp/logo-master.svg" alt="" width={34} height={32} priority />
          <strong>
            stamp<span>.</span>
          </strong>
          <small>YOUR WORK TIMECARD</small>
        </a>
        <Nav />
        <div className="stamp-sidebar-bottom">
          <div className="stamp-connection-card">
            <CalendarDays size={19} />
            <strong>Google Sheets</strong>
            <small>
              <Check size={13} /> All changes saved
            </small>
          </div>
          <div className="stamp-user">
            <strong>{p.accountEmail || "Stamp user"}</strong>
            <span>Personal workspace</span>
          </div>
        </div>
      </aside>
      <main className="stamp-dashboard-main">
        <header className="stamp-dashboard-topbar">
          <div className="stamp-breadcrumb">
            <span>Workspace</span>
            <i>/</i>
            <strong>{viewLabel}</strong>
          </div>
          <div className="stamp-topbar-tools">
            <span className="stamp-sync-label">
              <Check size={15} /> Sheet synced just now
            </span>
            <button
              className="stamp-theme-button round"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Switch appearance"
            >
              {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <button className="stamp-top-signout" onClick={p.onSignOut} aria-label="Sign out">
              <LogOut size={17} />
            </button>
          </div>
        </header>
        <div className="stamp-mobile-header">
          <a className="stamp-mobile-brand" href="/stamp">
            <Image src="/stamp/logo-master.svg" alt="" width={36} height={34} />
            <strong>
              stamp<span>.</span>
            </strong>
          </a>
          <div className="stamp-mobile-actions">
            <StampPwa />
            <button
              className="stamp-theme-button round"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Switch appearance"
            >
              {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
            </button>
          </div>
        </div>
        <div className="stamp-content">
          {view === "overview" && (
            <section className="stamp-overview-view">
              <div className="stamp-page-heading">
                <div>
                  <p className="stamp-eyebrow">
                    {fmt(p.now, {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }).toUpperCase()}
                  </p>
                  <h1>Make time count.</h1>
                </div>
                <div className="stamp-heading-actions">
                  <div className="stamp-month-select">
                    <button
                      type="button"
                      aria-label="Previous month"
                      onClick={() => changeMonth(-1)}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <CalendarDays size={18} />
                    <span>{monthName(month)}</span>
                    <button type="button" aria-label="Next month" onClick={() => changeMonth(1)}>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                  <button className="stamp-primary-button" onClick={() => openEntry()}>
                    <Plus size={19} /> Add entry
                  </button>
                </div>
              </div>
              <div className="stamp-overview-grid">
                <DailyCard />
                <WeeklyCard />
              </div>
              <Metrics />
              <Activity />
            </section>
          )}
          {view === "timecard" && <Timecard />}
          {view === "insights" && <Insights />}
          {view === "settings" && <Settings />}
          <footer className="stamp-dashboard-footer">
            <span>Stamp · A little clarity for your working day.</span>
            <span>Google Sheets connected</span>
          </footer>
          {(p.notice || p.error) && (
            <div
              role={p.error ? "alert" : "status"}
              className={"stamp-toast " + (p.error ? "is-error" : "")}
            >
              <span>{p.error || p.notice}</span>
              {p.error && (
                <button type="button" onClick={p.clockBlocked ? p.onRefresh : p.onSignOut}>
                  {p.clockBlocked ? "Refresh timecard" : "Reconnect Google"}
                </button>
              )}
            </div>
          )}
        </div>
      </main>
      <Nav mobile />
      {dialog && (
        <div
          className="stamp-modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDialog(false);
          }}
        >
          <section
            className="stamp-entry-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="stamp-entry-title"
          >
            <div className="stamp-modal-heading">
              <div>
                <p className="stamp-eyebrow">GOOGLE SHEETS</p>
                <h2 id="stamp-entry-title">Add time entry</h2>
              </div>
              <button onClick={() => setDialog(false)} aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={saveEntry}>
              <label>
                Date
                <input
                  type="date"
                  required
                  value={entry.date}
                  onChange={(e) => setEntry({ ...entry, date: e.target.value })}
                />
              </label>
              <div className="stamp-entry-time-fields">
                <label>
                  Arrival
                  <input
                    type="time"
                    required
                    value={entry.start}
                    onChange={(e) => setEntry({ ...entry, start: e.target.value })}
                  />
                </label>
                <label>
                  Departure
                  <input
                    type="time"
                    required
                    value={entry.end}
                    onChange={(e) => setEntry({ ...entry, end: e.target.value })}
                  />
                </label>
              </div>
              <label>
                Note <span className="stamp-optional">Optional</span>
                <input
                  value={entry.note}
                  maxLength={120}
                  placeholder="Add a note"
                  onChange={(e) => setEntry({ ...entry, note: e.target.value })}
                />
              </label>
              {entryError && (
                <p className="stamp-entry-error" role="alert">
                  {entryError}
                </p>
              )}
              <div className="stamp-modal-actions">
                <button
                  type="button"
                  className="stamp-secondary-button"
                  onClick={() => setDialog(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="stamp-primary-button" disabled={saving}>
                  {saving ? (
                    <LoaderCircle className="stamp-spinner" size={17} />
                  ) : (
                    <Check size={17} />
                  )}
                  Save entry
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
function timeInput(v: unknown) {
  const m = minutes(v);
  return m === null
    ? "09:00"
    : String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
}
function formatSheetTime(v: unknown) {
  const m = minutes(v);
  return m === null
    ? "—"
    : String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
}
function clockDisplay(seconds: number) {
  return (
    String(Math.floor(seconds / 3600)).padStart(2, "0") +
    ":" +
    String(Math.floor((seconds % 3600) / 60)).padStart(2, "0") +
    ":" +
    String(seconds % 60).padStart(2, "0")
  );
}
