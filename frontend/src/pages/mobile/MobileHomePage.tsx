import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  dashboardApi,
  visitorApi,
  type DashboardKpis as DashboardKpiData,
  type VisitorListRow,
} from "@/api/vms";
import { formatCount, formatTime } from "@/lib/format";
import { getCurrentStageTimestamp } from "@/lib/visitStages";
import { useAppLanguage } from "@/context/AppLanguageContext";
import { usePageChrome } from "@/context/PageChromeContext";
import { VisitorStatusDashboard } from "@/components/dashboard/VisitorStatusDashboard";
import { RecentVisitorsList, type RecentVisitorItem } from "@/components/dashboard/RecentVisitorsList";
import { useVmsRealtime } from "@/hooks/useVmsRealtime";
import { usePageRefresh } from "@/hooks/usePageRefresh";
import { translateVisitorStatus, ut } from "@/i18n/uiChrome";
import type { VisitorLang } from "@/i18n/visitorJourney";
import { useAuth } from "@/context/AuthContext";
import { visitorScopeFilters } from "@/lib/roles";
import { localizePersonName } from "@/lib/transliterate";

function toRecent(rows: VisitorListRow[], lang: VisitorLang): RecentVisitorItem[] {
  return rows.slice(0, 5).map((r) => ({
    name: r.name,
    full_name: localizePersonName(r.full_name || r.name, lang),
    purpose: r.visit_purpose_type
      ? localizePersonName(r.visit_purpose_type, lang)
      : localizePersonName(r.person_to_meet_name || "—", lang),
    time: formatTime(getCurrentStageTimestamp(r), lang) || "—",
    status: translateVisitorStatus(lang, r.status, { short: true }),
    statusRaw: r.status,
    photo: r.photo,
  }));
}

// Fast in-memory cache for instant 0ms tab switching
let cachedHomeKpis: DashboardKpiData | null = null;
let cachedHomeRows: VisitorListRow[] | null = null;

export function MobileHomePage() {
  const navigate = useNavigate();
  const { lang } = useAppLanguage();
  const { user } = useAuth();

  usePageChrome({
    title: ut(lang, "brand_title"),
    subtitle: ut(lang, "main_gate_desk"),
    showBack: false,
    showNotification: true,
    showProfile: true,
  });

  const [kpis, setKpis] = useState<DashboardKpiData>(() => cachedHomeKpis || {});
  const [recentRows, setRecentRows] = useState<VisitorListRow[]>(() => cachedHomeRows || []);
  const [loading, setLoading] = useState<boolean>(() => !cachedHomeKpis);
  const [error, setError] = useState<string | null>(null);
  const [activeFilterTab, setActiveFilterTab] = useState<"all" | "inside" | "pending" | null>(null);

  const load = useCallback(async (isSilent = false) => {
    if (!isSilent && !cachedHomeKpis) {
      setLoading(true);
    }
    setError(null);
    try {
      const [kpi, detailed] = await Promise.all([
        dashboardApi.getKpis(),
        visitorApi.listDetailed(40, visitorScopeFilters(user)),
      ]);
      const nextKpi = kpi || {};
      const nextRows = detailed || [];
      cachedHomeKpis = nextKpi;
      cachedHomeRows = nextRows;
      setKpis(nextKpi);
      setRecentRows(nextRows);
    } catch (err: unknown) {
      if (!cachedHomeKpis) {
        setError(err instanceof Error ? err.message : "Could not load gate desk");
        setKpis({});
        setRecentRows([]);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  usePageRefresh(load);

  useVmsRealtime(() => {
    void load();
  }, true);

  const recentVisitors = useMemo(() => toRecent(recentRows, lang), [recentRows, lang]);

  const checkedInCount = useMemo(() => {
    return recentRows.filter((r) => r.status === "Checked In").length;
  }, [recentRows]);

  const meetingDoneCount = useMemo(() => {
    return recentRows.filter((r) => r.status === "Meeting Done").length;
  }, [recentRows]);

  const insideCount = useMemo(() => {
    return checkedInCount + meetingDoneCount;
  }, [checkedInCount, meetingDoneCount]);

  const pendingCount = useMemo(() => {
    return recentRows.filter((r) => r.status === "Pending Approval" || r.status === "Pending").length;
  }, [recentRows]);

  const approvedCount = useMemo(() => {
    return recentRows.filter((r) => r.status === "Approved").length;
  }, [recentRows]);

  const handleTabClick = (tab: "all" | "inside" | "pending") => {
    setActiveFilterTab((prev) => (prev === tab ? null : tab));
  };

  const [flippedCard, setFlippedCard] = useState<"inside" | "pending" | null>(null);

  return (
    <div className="vm-home-page vm-ios-theme">
      {/* Dual Gradient Overview Cards with 3D Flip */}
      <section className="vm-overview-section" aria-label="Gate Overview">
        <div className="vm-gradient-cards-grid">
          {/* Card 1: Ocean Gradient Flipcard (Active Inside) */}
          <div className="vm-kpi-flip-container">
            <div className={`vm-kpi-flip-card${flippedCard === "inside" ? " is-flipped" : ""}`}>
              {/* FRONT SIDE */}
              <div
                className="vm-kpi-card-face vm-kpi-card-front vm-gradient-card--ocean"
                role="button"
                tabIndex={0}
                onClick={() => setFlippedCard((prev) => (prev === "inside" ? null : "inside"))}
              >
                <div className="vm-gcard-top-row">
                  <div className="vm-gcard-icon-wrap">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 2a14.5 14.5 0 0 0 0 20M12 2a14.5 14.5 0 0 1 0 20M2 12h20" />
                    </svg>
                  </div>
                  <span className="vm-gcard-flip-badge" title="Tap to flip">
                    Details ↻
                  </span>
                </div>
                <div className="vm-gcard-body">
                  <span className="vm-gcard-count">{loading ? "—" : formatCount(insideCount, lang)}</span>
                  <span className="vm-gcard-label">Active Inside</span>
                </div>
              </div>

              {/* BACK SIDE (Clean & Minimal) */}
              <div
                className="vm-kpi-card-face vm-kpi-card-back vm-gradient-card--ocean-back"
                role="button"
                tabIndex={0}
                onClick={() => navigate("/inside")}
              >
                <div className="vm-kpi-back-top">
                  <span className="vm-kpi-back-tag">On Campus</span>
                  <button
                    type="button"
                    className="vm-kpi-back-x"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFlippedCard(null);
                    }}
                    aria-label="Flip back"
                  >
                    ✕
                  </button>
                </div>
                <div className="vm-kpi-back-body">
                  <span className="vm-kpi-back-main-stat">{insideCount} Total Inside</span>
                  <span className="vm-kpi-back-link">
                    Open List <span aria-hidden>→</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Sunset Coral Gradient Flipcard (Pending Action) */}
          <div className="vm-kpi-flip-container">
            <div className={`vm-kpi-flip-card${flippedCard === "pending" ? " is-flipped" : ""}`}>
              {/* FRONT SIDE */}
              <div
                className="vm-kpi-card-face vm-kpi-card-front vm-gradient-card--sunset"
                role="button"
                tabIndex={0}
                onClick={() => setFlippedCard((prev) => (prev === "pending" ? null : "pending"))}
              >
                <div className="vm-gcard-top-row">
                  <div className="vm-gcard-icon-wrap">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  <span className="vm-gcard-flip-badge" title="Tap to flip">
                    Details ↻
                  </span>
                </div>
                <div className="vm-gcard-body">
                  <span className="vm-gcard-count">{loading ? "—" : formatCount(pendingCount, lang)}</span>
                  <span className="vm-gcard-label">Action Needed</span>
                </div>
              </div>

              {/* BACK SIDE (Clean & Minimal) */}
              <div
                className="vm-kpi-card-face vm-kpi-card-back vm-gradient-card--sunset-back"
                role="button"
                tabIndex={0}
                onClick={() => navigate("/approvals")}
              >
                <div className="vm-kpi-back-top">
                  <span className="vm-kpi-back-tag">Pending Queue</span>
                  <button
                    type="button"
                    className="vm-kpi-back-x"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFlippedCard(null);
                    }}
                    aria-label="Flip back"
                  >
                    ✕
                  </button>
                </div>
                <div className="vm-kpi-back-body">
                  <span className="vm-kpi-back-main-stat">{pendingCount} Awaiting Host</span>
                  <span className="vm-kpi-back-link">
                    Review Queue <span aria-hidden>→</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Segmented Filter Pills */}
      <div className="vm-pill-tabs-wrap" role="tablist" aria-label="Gate navigation filters">
        <button
          type="button"
          role="tab"
          aria-selected={activeFilterTab === "all"}
          className={`vm-pill-tab${activeFilterTab === "all" ? " is-active" : ""}`}
          onClick={() => handleTabClick("all")}
        >
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a14.5 14.5 0 0 0 0 20M12 2a14.5 14.5 0 0 1 0 20M2 12h20" />
          </svg>
          <span>All Visitors</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeFilterTab === "inside"}
          className={`vm-pill-tab${activeFilterTab === "inside" ? " is-active" : ""}`}
          onClick={() => handleTabClick("inside")}
        >
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          </svg>
          <span>On Premises</span>
          {insideCount > 0 && <span className="vm-pill-tab-counter">{insideCount}</span>}
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeFilterTab === "pending"}
          className={`vm-pill-tab${activeFilterTab === "pending" ? " is-active" : ""}`}
          onClick={() => handleTabClick("pending")}
        >
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 3v4M8 3v4M3 11h18" />
            <rect x="3" y="5" width="18" height="16" rx="2" />
          </svg>
          <span>Pending</span>
          {pendingCount > 0 && <span className="vm-pill-tab-counter is-warn">{pendingCount}</span>}
        </button>
      </div>

      {/* Animated Dropdown Accordion Panel */}
      {activeFilterTab !== null && (
        <div className="vm-home-dropdown-panel" key={activeFilterTab}>
          {activeFilterTab === "inside" && (
            <div className="vm-dropdown-content">
              <div className="vm-dropdown-head">
                <div className="vm-dropdown-title-wrap">
                  <span className="vm-dropdown-badge is-green">● Live Campus Status</span>
                  <strong className="vm-dropdown-main-title">{insideCount} Visitors On Premises</strong>
                </div>
                <button
                  type="button"
                  className="vm-dropdown-close"
                  onClick={() => setActiveFilterTab(null)}
                  aria-label="Close details"
                >
                  ✕
                </button>
              </div>

              <div className="vm-dropdown-grid">
                <div className="vm-dropdown-stat-box">
                  <span className="vm-stat-box-label">Checked In (Active)</span>
                  <strong className="vm-stat-box-val text-blue">{checkedInCount}</strong>
                </div>
                <div className="vm-dropdown-stat-box">
                  <span className="vm-stat-box-label">Meeting Done</span>
                  <strong className="vm-stat-box-val text-purple">{meetingDoneCount}</strong>
                </div>
              </div>

              <button
                type="button"
                className="vm-dropdown-cta-btn is-ocean"
                onClick={() => navigate("/inside?status=inside")}
              >
                <span>View Full On Premises List</span>
                <span>›</span>
              </button>
            </div>
          )}

          {activeFilterTab === "pending" && (
            <div className="vm-dropdown-content">
              <div className="vm-dropdown-head">
                <div className="vm-dropdown-title-wrap">
                  <span className="vm-dropdown-badge is-amber">● Pending Host Actions</span>
                  <strong className="vm-dropdown-main-title">{pendingCount} Requests Awaiting Host</strong>
                </div>
                <button
                  type="button"
                  className="vm-dropdown-close"
                  onClick={() => setActiveFilterTab(null)}
                  aria-label="Close details"
                >
                  ✕
                </button>
              </div>

              <div className="vm-dropdown-grid">
                <div className="vm-dropdown-stat-box">
                  <span className="vm-stat-box-label">Awaiting Approval</span>
                  <strong className="vm-stat-box-val text-orange">{pendingCount}</strong>
                </div>
                <div className="vm-dropdown-stat-box">
                  <span className="vm-stat-box-label">Already Approved</span>
                  <strong className="vm-stat-box-val text-emerald">{approvedCount}</strong>
                </div>
              </div>

              <button
                type="button"
                className="vm-dropdown-cta-btn is-sunset"
                onClick={() => navigate("/approvals")}
              >
                <span>Review Pending Gate Passes</span>
                <span>›</span>
              </button>
            </div>
          )}

          {activeFilterTab === "all" && (
            <div className="vm-dropdown-content">
              <div className="vm-dropdown-head">
                <div className="vm-dropdown-title-wrap">
                  <span className="vm-dropdown-badge is-slate">● Total Registered Visitors</span>
                  <strong className="vm-dropdown-main-title">{recentRows.length} Total Registrations</strong>
                </div>
                <button
                  type="button"
                  className="vm-dropdown-close"
                  onClick={() => setActiveFilterTab(null)}
                  aria-label="Close details"
                >
                  ✕
                </button>
              </div>

              <div className="vm-dropdown-grid">
                <div className="vm-dropdown-stat-box">
                  <span className="vm-stat-box-label">On Premises</span>
                  <strong className="vm-stat-box-val text-emerald">{insideCount}</strong>
                </div>
                <div className="vm-dropdown-stat-box">
                  <span className="vm-stat-box-label">Pending Host</span>
                  <strong className="vm-stat-box-val text-orange">{pendingCount}</strong>
                </div>
              </div>

              <button
                type="button"
                className="vm-dropdown-cta-btn is-slate"
                onClick={() => navigate("/inside?status=all")}
              >
                <span>Open All Visitors Directory</span>
                <span>›</span>
              </button>
            </div>
          )}
        </div>
      )}

      {error ? <p className="login-error" style={{ textAlign: "center" }}>{error}</p> : null}

      <main className="vm-main-body vm-home-stack">
        {/* Status Dashboard Grid */}
        <VisitorStatusDashboard
          kpis={kpis}
          rows={recentRows}
          loading={loading}
          title={ut(lang, "status_overview")}
          subtitle={ut(lang, "status_overview_sub")}
        />

        {/* Trending / Recent Visitors list */}
        <RecentVisitorsList visitors={recentVisitors} loading={loading} />
      </main>
    </div>
  );
}


