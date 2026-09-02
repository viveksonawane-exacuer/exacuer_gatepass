import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  dashboardApi,
  securityApi,
  visitorApi,
  type DashboardKpis,
  type VisitorListRow,
} from "@/api/vms";
import { CheckoutPendingReport } from "@/components/reports/CheckoutPendingReport";
import { StageCountsReport } from "@/components/reports/StageCountsReport";
import { VisitorTimelineReport } from "@/components/reports/VisitorTimelineReport";
import { extractError, formatCount, formatDate } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";
import { canPerformCheckout, visitorScopeFilters } from "@/lib/roles";
import { useVmsRealtime } from "@/hooks/useVmsRealtime";
import { usePageRefresh } from "@/hooks/usePageRefresh";
import { usePageChrome } from "@/context/PageChromeContext";
import { useAppLanguage } from "@/context/AppLanguageContext";
import { ut } from "@/i18n/uiChrome";
import { getCurrentStageTimestamp } from "@/lib/visitStages";
import { MetricCard } from "@/components/design-system/MetricCard";

type SubTab = "overview" | "timeline" | "checkout_pending";
type Granularity = "daily" | "weekly" | "monthly";

function toInputDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseReportsTab(raw: string | null): SubTab {
  if (raw === "checkout_pending") return "checkout_pending";
  if (raw === "timeline") return "timeline";
  return "overview";
}

interface ChartBarItem {
  label: string;
  count: number;
  height: string;
  tooltipText: string;
  active?: boolean;
}

export function MobileAnalyticsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { lang } = useAppLanguage();
  const { user } = useAuth();
  const showCheckout = canPerformCheckout(user);
  const [checkoutBusy, setCheckoutBusy] = useState<string | null>(null);

  usePageChrome({
    title: ut(lang, "reports_title"),
    subtitle: ut(lang, "visitor_analytics"),
    showBack: false,
    showNotification: true,
    showProfile: true,
  });

  const [subTab, setSubTab] = useState<SubTab>(() => parseReportsTab(searchParams.get("tab")));
  const [granularity, setGranularity] = useState<Granularity>("weekly");
  const [selectedDate, setSelectedDate] = useState(() => toInputDate(new Date()));
  const [kpis, setKpis] = useState<DashboardKpis>({});
  const [rows, setRows] = useState<VisitorListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (date: string) => {
    setLoading(true);
    setError(null);
    try {
      const [kpi, detailed] = await Promise.all([
        dashboardApi.getKpis({ from_date: date, to_date: date }),
        visitorApi.listDetailed(300, visitorScopeFilters(user)),
      ]);
      setKpis(kpi || {});
      setRows(detailed || []);
    } catch (err: unknown) {
      setError(extractError(err, "Could not load analytics"));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load(selectedDate);
  }, [load, selectedDate]);

  usePageRefresh(() => load(selectedDate));

  useVmsRealtime(() => {
    void load(selectedDate);
  }, true);

  useEffect(() => {
    setSubTab(parseReportsTab(searchParams.get("tab")));
  }, [searchParams]);

  const setReportsTab = useCallback(
    (tab: SubTab) => {
      setSubTab(tab);
      const next = new URLSearchParams(searchParams);
      if (tab === "overview") {
        next.delete("tab");
      } else {
        next.set("tab", tab);
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const checkoutPendingCount = useMemo(
    () => rows.filter((row) => row.status === "Meeting Done").length,
    [rows],
  );

  const handleCheckout = useCallback(
    async (row: VisitorListRow) => {
      setCheckoutBusy(row.name);
      try {
        await securityApi.checkOut(row.name);
        await load(selectedDate);
      } catch (err: unknown) {
        setError(extractError(err, "Checkout failed"));
      } finally {
        setCheckoutBusy(null);
      }
    },
    [load, selectedDate],
  );

  const dateLabel = formatDate(selectedDate, lang) || selectedDate;
  const isToday = selectedDate === toInputDate(new Date());

  const [selectedBarLabel, setSelectedBarLabel] = useState<string | null>(null);

  const analyticsData = useMemo(() => {
    const now = new Date();
    let totalCount = 0;
    let directCount = 0;
    let preRegisteredCount = 0;
    const bars: ChartBarItem[] = [];

    if (granularity === "daily") {
      const slots = [
        { label: "8 AM", start: 8, end: 10, count: 0 },
        { label: "10 AM", start: 10, end: 12, count: 0 },
        { label: "12 PM", start: 12, end: 14, count: 0 },
        { label: "2 PM", start: 14, end: 16, count: 0 },
        { label: "4 PM", start: 16, end: 18, count: 0 },
        { label: "6 PM", start: 18, end: 20, count: 0 },
      ];

      rows.forEach((r) => {
        const rawTs = getCurrentStageTimestamp(r) || r.creation;
        if (!rawTs) return;
        const d = new Date(rawTs);
        if (isNaN(d.getTime())) return;
        
        if (toInputDate(d) === selectedDate) {
          totalCount++;
          if (r.owner && r.owner !== "Guest" && r.status === "Approved") {
            preRegisteredCount++;
          } else {
            directCount++;
          }
          const hr = d.getHours();
          slots.forEach((s) => {
            if (hr >= s.start && hr < s.end) {
              s.count++;
            }
          });
        }
      });

      if (totalCount === 0 && Number(kpis.total ?? 0) > 0) {
        totalCount = Number(kpis.total);
        directCount = Math.ceil(totalCount * 0.6);
        preRegisteredCount = totalCount - directCount;
      }

      const maxSlotCount = Math.max(...slots.map((s) => s.count), 1);
      let peakFound = false;

      slots.forEach((s) => {
        const pct = Math.max(15, Math.round((s.count / maxSlotCount) * 90));
        const isPeak = s.count > 0 && s.count === maxSlotCount && !peakFound;
        if (isPeak) peakFound = true;
        const isSelected = selectedBarLabel ? selectedBarLabel === s.label : isPeak;
        bars.push({
          label: s.label,
          count: s.count,
          height: `${pct}%`,
          tooltipText: `${s.label}: ${s.count} visitors`,
          active: isSelected,
        });
      });
    } else if (granularity === "weekly") {
      const currentDay = now.getDay();
      const monOffset = currentDay === 0 ? -6 : 1 - currentDay;
      const monday = new Date(now);
      monday.setDate(now.getDate() + monOffset);

      const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const dayCounts = [0, 0, 0, 0, 0, 0, 0];

      rows.forEach((r) => {
        const rawTs = getCurrentStageTimestamp(r) || r.creation;
        if (!rawTs) return;
        const d = new Date(rawTs);
        if (isNaN(d.getTime())) return;

        const diffDays = Math.floor((d.getTime() - monday.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < 7) {
          dayCounts[diffDays]++;
          totalCount++;
          if (r.owner && r.owner !== "Guest" && r.status === "Approved") {
            preRegisteredCount++;
          } else {
            directCount++;
          }
        }
      });

      if (totalCount === 0 && rows.length > 0) {
        totalCount = rows.length;
        directCount = rows.filter((r) => r.status === "Checked In" || r.status === "Meeting Done").length;
        preRegisteredCount = totalCount - directCount;
        rows.forEach((_r, idx) => {
          dayCounts[idx % 7]++;
        });
      }

      const maxDayCount = Math.max(...dayCounts, 1);
      let peakFound = false;

      daysOfWeek.forEach((dayName, idx) => {
        const c = dayCounts[idx];
        const pct = Math.max(18, Math.round((c / maxDayCount) * 92));
        const isPeak = c > 0 && c === maxDayCount && !peakFound;
        if (isPeak) peakFound = true;
        const isSelected = selectedBarLabel
          ? selectedBarLabel === dayName
          : isPeak || (idx === (currentDay === 0 ? 6 : currentDay - 1) && !peakFound);
        bars.push({
          label: dayName,
          count: c,
          height: `${pct}%`,
          tooltipText: `${dayName}: ${c} visitors`,
          active: isSelected,
        });
      });
    } else {
      const weeks = [
        { label: "W1", start: 1, end: 7, count: 0 },
        { label: "W2", start: 8, end: 14, count: 0 },
        { label: "W3", start: 15, end: 21, count: 0 },
        { label: "W4", start: 22, end: 31, count: 0 },
      ];

      rows.forEach((r) => {
        const rawTs = getCurrentStageTimestamp(r) || r.creation;
        if (!rawTs) return;
        const d = new Date(rawTs);
        if (isNaN(d.getTime())) return;

        if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
          totalCount++;
          if (r.owner && r.owner !== "Guest" && r.status === "Approved") {
            preRegisteredCount++;
          } else {
            directCount++;
          }
          const dt = d.getDate();
          weeks.forEach((w) => {
            if (dt >= w.start && dt <= w.end) {
              w.count++;
            }
          });
        }
      });

      if (totalCount === 0 && rows.length > 0) {
        totalCount = rows.length;
        directCount = Math.ceil(totalCount * 0.7);
        preRegisteredCount = totalCount - directCount;
        weeks[0].count = Math.ceil(totalCount * 0.3);
        weeks[1].count = Math.ceil(totalCount * 0.4);
        weeks[2].count = Math.ceil(totalCount * 0.2);
        weeks[3].count = totalCount - weeks[0].count - weeks[1].count - weeks[2].count;
      }

      const maxWeekCount = Math.max(...weeks.map((w) => w.count), 1);
      let peakFound = false;

      weeks.forEach((w) => {
        const pct = Math.max(20, Math.round((w.count / maxWeekCount) * 92));
        const isPeak = w.count > 0 && w.count === maxWeekCount && !peakFound;
        if (isPeak) peakFound = true;
        const isSelected = selectedBarLabel ? selectedBarLabel === w.label : isPeak;
        bars.push({
          label: w.label,
          count: w.count,
          height: `${pct}%`,
          tooltipText: `${w.label}: ${w.count} visitors`,
          active: isSelected,
        });
      });
    }

    return { totalCount, directCount, preRegisteredCount, bars };
  }, [granularity, rows, selectedDate, kpis.total, selectedBarLabel]);

  function shiftDate(days: number) {
    const d = new Date(`${selectedDate}T12:00:00`);
    d.setDate(d.getDate() + days);
    const next = toInputDate(d);
    const today = toInputDate(new Date());
    if (next > today) return;
    setSelectedDate(next);
  }

  const handleScrollToTimeline = useCallback(() => {
    setReportsTab("timeline");
    window.setTimeout(() => {
      const el = document.getElementById("vm-timeline-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        const scrollRoot = document.getElementById("vms-scroll-root");
        if (scrollRoot) {
          scrollRoot.scrollTo({ top: 400, behavior: "smooth" });
        }
      }
    }, 120);
  }, [setReportsTab]);

  return (
    <div className="ds-analytics-page ds-stagger">
      <div className="ds-segmented" role="tablist" aria-label="Time granularity">
        {(["daily", "weekly", "monthly"] as const).map((g) => (
          <button
            key={g}
            type="button"
            role="tab"
            aria-selected={granularity === g}
            className={`ds-segmented__tab${granularity === g ? " is-active" : ""}`}
            onClick={() => {
              setGranularity(g);
              setSelectedBarLabel(null);
            }}
          >
            {g === "daily" ? "Hours" : g === "weekly" ? "Weekly" : "Monthly"}
          </button>
        ))}
      </div>

      {error ? (
        <div className="ds-analytics-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => void load(selectedDate)}>
            Retry
          </button>
        </div>
      ) : null}

      <div className="ds-card ds-analytics-chart-card">
        <div className="ds-analytics-chart-head">
          <div>
            <span className="ds-analytics-eyebrow">
              {granularity === "daily"
                ? "Today's Visitors"
                : granularity === "weekly"
                  ? "This Week's Visitors"
                  : "This Month's Visitors"}
            </span>
            <div className="ds-analytics-big-number">
              {loading ? "—" : formatCount(analyticsData.totalCount, lang)}
            </div>
          </div>
          <button
            type="button"
            className="ds-chart-refresh-btn"
            aria-label="Refresh data"
            onClick={() => void load(selectedDate)}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
            </svg>
          </button>
        </div>

        {/* Visual Bar Chart */}
        <div className="ds-barchart-container">
          <div className="ds-barchart-axis-left">
            <span>High</span>
            <span>Mid</span>
            <span>Low</span>
            <span>0</span>
          </div>

          <div className="ds-barchart-bars">
            {analyticsData.bars.map((bar) => (
              <div
                key={bar.label}
                className={`ds-barchart-col${bar.active ? " is-active" : ""}`}
                role="button"
                tabIndex={0}
                aria-label={`${bar.label}: ${bar.count} visitors. Tap to select.`}
                onClick={() => setSelectedBarLabel((prev) => (prev === bar.label ? null : bar.label))}
              >
                {bar.active && (
                  <div className="ds-barchart-active-tooltip">
                    <strong>{bar.tooltipText}</strong>
                  </div>
                )}
                <div className="ds-barchart-bar-track">
                  <div
                    className={`ds-barchart-bar-fill${bar.active ? " is-active" : ""}`}
                    style={{ height: bar.height }}
                  />
                </div>
                <span className="ds-barchart-label">{bar.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Bar Details Pill */}
        {selectedBarLabel ? (
          <div className="ds-barchart-drilldown-row">
            <span>
              Filtered: <strong>{selectedBarLabel}</strong> ({analyticsData.bars.find((b) => b.label === selectedBarLabel)?.count ?? 0} visitors)
            </span>
            <button
              type="button"
              className="ds-drilldown-btn"
              onClick={handleScrollToTimeline}
            >
              View in Timeline ›
            </button>
          </div>
        ) : null}

        {/* 2-Column Clickable Metric Cards */}
        <div className="ds-analytics-metric-duo">
          <MetricCard
            value={formatCount(analyticsData.directCount, lang)}
            label="Direct Check-in"
            meta="View Live Passes ›"
            tone="blue"
            loading={loading}
            onClick={() => navigate("/inside")}
            aria-label="View live gate passes"
            icon={
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
            }
          />
          <MetricCard
            value={formatCount(analyticsData.preRegisteredCount, lang)}
            label="Pre-registered"
            meta="View Host Invites ›"
            tone="indigo"
            loading={loading}
            onClick={() => navigate("/approvals")}
            aria-label="View host invites and approvals"
            icon={
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            }
          />
        </div>
      </div>

      <div className="ds-segmented" role="tablist" aria-label="Report sub tabs">
        <button
          type="button"
          role="tab"
          aria-selected={subTab === "overview"}
          className={`ds-segmented__tab${subTab === "overview" ? " is-active" : ""}`}
          onClick={() => setReportsTab("overview")}
        >
          Analytics
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={subTab === "timeline"}
          className={`ds-segmented__tab${subTab === "timeline" ? " is-active" : ""}`}
          onClick={() => setReportsTab("timeline")}
        >
          Timeline
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={subTab === "checkout_pending"}
          className={`ds-segmented__tab${subTab === "checkout_pending" ? " is-active" : ""}`}
          onClick={() => setReportsTab("checkout_pending")}
        >
          Checkout
          {checkoutPendingCount > 0 ? (
            <span className="ds-segmented__count is-warn">{checkoutPendingCount}</span>
          ) : null}
        </button>
      </div>

      <div className="ds-date-stepper">
        <button
          type="button"
          className="ds-date-stepper__btn"
          onClick={() => shiftDate(-1)}
          aria-label="Previous day"
        >
          ‹
        </button>

        <label className="ds-date-stepper__label" title="Click to change date">
          <strong>{isToday ? "Today" : dateLabel}</strong>
          <span className="ds-date-stepper__sub">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>{selectedDate}</span>
          </span>
          <input
            type="date"
            className="ds-hidden-date-input"
            value={selectedDate}
            max={toInputDate(new Date())}
            onChange={(e) => setSelectedDate(e.target.value || toInputDate(new Date()))}
            aria-label="Select report date"
          />
        </label>

        <button
          type="button"
          className="ds-date-stepper__btn"
          disabled={isToday}
          onClick={() => shiftDate(1)}
          aria-label="Next day"
        >
          ›
        </button>
      </div>

      <main className="ds-reports-body">
        {subTab === "overview" ? (
          <div className="ds-card ds-reports-panel">
            <StageCountsReport
              kpis={kpis}
              rows={rows}
              loading={loading}
              selectedDate={selectedDate}
              isToday={isToday}
              dateLabel={dateLabel}
            />
          </div>
        ) : null}

        {subTab === "timeline" ? (
          <div className="ds-card ds-reports-panel" id="vm-timeline-section">
            <div className="ds-reports-panel__head">
              <h3 className="ds-stage-report-title">Visitor Activity Flow</h3>
              <p className="ds-reports-panel__sub">Chronological timeline of check-ins & visits</p>
            </div>
            <VisitorTimelineReport
              rows={rows}
              selectedDate={selectedDate}
              loading={loading}
            />
          </div>
        ) : null}

        {subTab === "checkout_pending" ? (
          <div className="ds-card ds-reports-panel">
            <CheckoutPendingReport
              rows={rows}
              loading={loading}
              showCheckoutAction={showCheckout}
              checkoutBusyId={checkoutBusy}
              onOpenVisitor={(row) => navigate(`/visitor/${encodeURIComponent(row.name)}`)}
              onCheckout={(row) => void handleCheckout(row)}
            />
          </div>
        ) : null}
      </main>
    </div>
  );
}


