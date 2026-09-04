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
import { GateFlowBuildingCard } from "@/components/dashboard/GateFlowBuildingCard";
import { RecentVisitorsList, type RecentVisitorItem } from "@/components/dashboard/RecentVisitorsList";
import { QuickActionsGrid } from "@/components/dashboard/QuickActionsGrid";
import { MetricCard, MetricCardSkeletonGrid } from "@/components/design-system/MetricCard";
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

let cachedHomeKpis: DashboardKpiData | null = null;
let cachedHomeRows: VisitorListRow[] | null = null;

function IconUsers() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconBuilding() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

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

  const checkedInCount = useMemo(
    () => recentRows.filter((r) => r.status === "Checked In").length,
    [recentRows],
  );

  const meetingDoneCount = useMemo(
    () => recentRows.filter((r) => r.status === "Meeting Done").length,
    [recentRows],
  );

  const insideCount = useMemo(
    () => checkedInCount + meetingDoneCount,
    [checkedInCount, meetingDoneCount],
  );

  const pendingCount = useMemo(
    () =>
      recentRows.filter((r) => r.status === "Pending Approval" || r.status === "Pending").length,
    [recentRows],
  );

  const approvedCount = useMemo(
    () => recentRows.filter((r) => r.status === "Approved").length,
    [recentRows],
  );

  const todayVisitors = useMemo(() => {
    const fromKpi =
      Number(kpis["Checked In"] ?? 0) +
      Number(kpis["Meeting Done"] ?? 0) +
      Number(kpis.Approved ?? 0) +
      Number(kpis["Pending Approval"] ?? kpis.pending ?? 0);
    if (fromKpi > 0) return fromKpi;
    return recentRows.length;
  }, [kpis, recentRows.length]);

  return (
    <div className="ds-page ds-page--home">
      {/* 1. Status Overview */}
      <div className="vm-home-overview-head ds-animate-in">
        <h2>{ut(lang, "status_overview")}</h2>
        <p>{ut(lang, "status_overview_sub")}</p>
      </div>

      <section className="vm-overview-section" aria-label="Today's overview">
        {loading && !cachedHomeKpis ? (
          <MetricCardSkeletonGrid />
        ) : (
          <div className="ds-metric-grid ds-stagger">
            <MetricCard
              value={formatCount(insideCount, lang)}
              label="Inside"
              meta={`${checkedInCount} checked in · ${meetingDoneCount} meeting done`}
              icon={<IconBuilding />}
              tone="blue"
              loading={loading}
              onClick={() => navigate("/inside?status=inside")}
              aria-label={`Inside: ${insideCount}`}
            />
            <MetricCard
              value={formatCount(pendingCount, lang)}
              label="Pending"
              meta={pendingCount > 0 ? "Needs host action" : "Queue clear"}
              icon={<IconClock />}
              tone="amber"
              loading={loading}
              onClick={() => navigate("/approvals")}
              aria-label={`Pending: ${pendingCount}`}
            />
            <MetricCard
              value={formatCount(approvedCount, lang)}
              label="Approved"
              meta="Ready for check-in"
              icon={<IconCheck />}
              tone="green"
              loading={loading}
              onClick={() => navigate("/approvals?tab=approved")}
              aria-label={`Approved: ${approvedCount}`}
            />
            <MetricCard
              value={formatCount(todayVisitors, lang)}
              label="Today's Activity"
              meta={`${recentRows.length} in recent list`}
              icon={<IconUsers />}
              tone="indigo"
              loading={loading}
              onClick={() => navigate("/inside?status=all")}
              aria-label={`Today's activity: ${todayVisitors}`}
            />
          </div>
        )}
      </section>

      {/* 3. Main Body Stack */}
      <div className="vm-home-stack ds-stagger" style={{ paddingTop: 16 }}>
        {error ? (
          <p className="login-error" style={{ textAlign: "center" }}>
            {error}
          </p>
        ) : null}

        {/* Gate flow (Live floor-wise occupancy — 3D building view) */}
        <GateFlowBuildingCard
          lang={lang}
          kpis={kpis}
          rows={recentRows}
          loading={loading}
          onNavigateInside={() => navigate("/inside?status=inside")}
          onNavigatePending={() => navigate("/approvals")}
          onNavigateApproved={() => navigate("/approvals?tab=approved")}
        />

        {/* Recent Visitors */}
        <RecentVisitorsList visitors={recentVisitors} loading={loading} />

        {/* Quick Action Cards (Add Visitor, Schedule Meeting, Generate Gate Pass, View Reports) */}
        <QuickActionsGrid />
      </div>
    </div>
  );
}
