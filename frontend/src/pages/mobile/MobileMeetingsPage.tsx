import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { visitorApi, type VisitorListRow } from "@/api/vms";
import { extractError, formatTime, initials } from "@/lib/format";
import { getCurrentStageTimestamp } from "@/lib/visitStages";
import { VisitorStageTimeline } from "@/components/visitors/VisitorStageTimeline";
import { SearchBar } from "@/components/design-system/SearchBar";
import { EmptyState } from "@/components/design-system/EmptyState";
import { StatusPill, resolveStatusPillVariant } from "@/components/design-system/StatusPill";
import { usePageChrome } from "@/context/PageChromeContext";
import { useAuth } from "@/context/AuthContext";
import { visitorScopeFilters } from "@/lib/roles";
import { translateVisitorStatus } from "@/i18n/uiChrome";
import { useAppLanguage } from "@/context/AppLanguageContext";

function toInputDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(base: string, delta: number) {
  const d = new Date(`${base}T12:00:00`);
  d.setDate(d.getDate() + delta);
  return toInputDate(d);
}

function monthYearLabel(dateStr: string) {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString([], { month: "short", year: "numeric" });
}

function fullDateLabel(dateStr: string) {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString([], {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function headerDateSub(dateStr: string) {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString([], {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function weekdayShort(dateStr: string) {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString([], { weekday: "short" });
}

function dayNum(dateStr: string) {
  return new Date(`${dateStr}T12:00:00`).getDate();
}

function rowStamp(r: VisitorListRow) {
  return getCurrentStageTimestamp(r) || "";
}

function rowDay(r: VisitorListRow) {
  return rowStamp(r).slice(0, 10);
}

export function MobileMeetingsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { lang } = useAppLanguage();

  usePageChrome({
    title: "Meetings",
    subtitle: "Scheduled visits",
    showBack: true,
    backTo: "/",
    showNotification: false,
    showProfile: false,
  });

  const paramDate = searchParams.get("date");
  const today = toInputDate(new Date());

  const [selectedDate, setSelectedDate] = useState(() => paramDate || today);
  const [query, setQuery] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [rows, setRows] = useState<VisitorListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (paramDate) setSelectedDate(paramDate);
  }, [paramDate]);

  const week = useMemo(() => {
    const start = addDays(selectedDate, -3);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [selectedDate]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await visitorApi.listDetailed(200, visitorScopeFilters(user));
      setRows(list || []);
    } catch (err: unknown) {
      setError(extractError(err, "Could not load schedule"));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const dayMeetings = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((r) => rowDay(r) === selectedDate || (!r.creation && selectedDate === today))
      .filter((r) => {
        if (filterStatus === "all") return true;
        const s = (r.status || "").toLowerCase();
        if (filterStatus === "pending") return s.includes("pending");
        if (filterStatus === "approved") return s.includes("approved");
        if (filterStatus === "checked_in") return s.includes("check");
        return true;
      })
      .filter((r) => {
        if (!q) return true;
        const hay = `${r.full_name || ""} ${r.person_to_meet_name || ""} ${r.visit_purpose_type || ""} ${r.status || ""}`.toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => rowStamp(a).localeCompare(rowStamp(b)));
  }, [rows, selectedDate, query, filterStatus, today]);

  return (
    <div className="ds-meetings-page">
      <div className="ds-meetings-sticky">
        <header className="ds-meetings-head">
          <div className="ds-meetings-head__copy">
            <h1 className="ds-meetings-head__title">Today&apos;s Schedule</h1>
            <span className="ds-meetings-head__sub">{headerDateSub(selectedDate)}</span>
          </div>

          <label className="ds-meetings-month-pill">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            <span>{monthYearLabel(selectedDate)}</span>
            <input
              type="month"
              className="ds-meetings-month-input"
              value={selectedDate.slice(0, 7)}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedDate(`${e.target.value}-01`);
                }
              }}
            />
          </label>
        </header>

        <div className="ds-meetings-toolbar">
          <SearchBar value={query} onChange={setQuery} placeholder="Search schedule..." aria-label="Search schedule" />
          <button
            type="button"
            className={`ds-sort-btn${filterStatus !== "all" ? " is-active" : ""}`}
            onClick={() => setShowFilter((v) => !v)}
            aria-label="Filter schedule"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
          </button>
        </div>

        {showFilter ? (
          <div className="ds-meetings-filter-menu">
            <span className="ds-meetings-filter-menu__label">Filter by status</span>
            <div className="ds-meetings-filter-chips">
              {[
                { code: "all", label: "All" },
                { code: "pending", label: "Pending" },
                { code: "approved", label: "Approved" },
                { code: "checked_in", label: "Checked In" },
              ].map((st) => (
                <button
                  key={st.code}
                  type="button"
                  className={`ds-filter-pill${filterStatus === st.code ? " is-active" : ""}`}
                  onClick={() => {
                    setFilterStatus(st.code);
                    setShowFilter(false);
                  }}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="ds-meetings-date-ribbon" role="listbox" aria-label="Select day">
          {week.map((date) => {
            const active = date === selectedDate;
            return (
              <button
                key={date}
                type="button"
                role="option"
                aria-selected={active}
                className={`ds-meetings-date-chip${active ? " is-active" : ""}`}
                onClick={() => setSelectedDate(date)}
              >
                <span className="ds-meetings-date-chip__day">{weekdayShort(date)}</span>
                <span className="ds-meetings-date-chip__num">{dayNum(date)}</span>
              </button>
            );
          })}
        </div>
      </div>

      <main className="ds-meetings-body">
        <div className="ds-meetings-summary">
          <h2 className="ds-meetings-summary__title">
            Schedule for <span>{fullDateLabel(selectedDate)}</span>
          </h2>
          <div className="ds-meetings-count">
            <strong>{String(dayMeetings.length).padStart(2, "0")}</strong>
            <span>Entries</span>
          </div>
        </div>

        {error ? <p className="ds-auth-error">{error}</p> : null}
        {loading ? <EmptyState title="Loading schedule…" /> : null}

        {!loading && dayMeetings.length === 0 ? (
          <EmptyState
            title="No schedule found"
            description={`No visitor entries recorded for ${selectedDate}`}
          />
        ) : null}

        <div className="ds-meetings-list">
          {dayMeetings.map((item) => {
            const time = formatTime(rowStamp(item)) || "—";
            const visitorName = item.full_name || item.name;
            const hostName = item.person_to_meet_name || "Administrator";
            const purpose = item.visit_purpose_type || "Visit";
            const statusLabel = translateVisitorStatus(lang, item.status, { short: true });

            return (
              <div key={item.name} className="ds-schedule-item">
                <div className="ds-schedule-item__time-col">
                  <span className="ds-schedule-item__time">{time}</span>
                  <span className="ds-schedule-item__dot" />
                  <span className="ds-schedule-item__line" />
                </div>

                <article
                  className="ds-schedule-card"
                  onClick={() => navigate(`/visitor/${encodeURIComponent(item.name)}`)}
                >
                  <div className="ds-schedule-card__top">
                    <div className="ds-schedule-card__identity">
                      <div className="ds-schedule-card__avatar">{initials(visitorName)}</div>
                      <strong className="ds-schedule-card__name">{visitorName}</strong>
                    </div>
                    <StatusPill label={time} variant="info" showDot={false} />
                  </div>

                  <div className="ds-schedule-card__meta">
                    <div className="ds-schedule-card__meta-row">
                      <span>Host</span>
                      <strong>{hostName}</strong>
                    </div>
                    <div className="ds-schedule-card__meta-row">
                      <span>Purpose</span>
                      <strong>{purpose}</strong>
                    </div>
                  </div>

                  <VisitorStageTimeline visitor={item} compact />

                  <div className="ds-schedule-card__foot">
                    <div className="ds-schedule-card__avatar" style={{ width: 32, height: 32, fontSize: 11 }}>
                      {initials(hostName)}
                    </div>
                    <StatusPill label={statusLabel} variant={resolveStatusPillVariant(item.status)} />
                  </div>
                </article>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
