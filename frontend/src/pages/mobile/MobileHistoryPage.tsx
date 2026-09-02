import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { visitorApi, type VisitorListRow } from "@/api/vms";
import { SimpleStatusFilter } from "@/components/ui/SimpleStatusFilter";
import type { StatusFilterOption } from "@/components/ui/SlidingStatusFilter";
import {
  WaterDropRangeToggle,
  type LiveRangeMode,
} from "@/components/ui/WaterDropRangeToggle";
import { LiveVisitorsCalendarButton } from "@/components/ui/LiveVisitorsCalendarButton";
import { VisitorListRowCard } from "@/components/visitors/VisitorListRowCard";
import { SearchBar } from "@/components/design-system/SearchBar";
import { EmptyState } from "@/components/design-system/EmptyState";
import { usePageChrome } from "@/context/PageChromeContext";
import { useAppLanguage } from "@/context/AppLanguageContext";
import { useAuth } from "@/context/AuthContext";
import { visitorScopeFilters } from "@/lib/roles";
import { filterRowsByLiveRange } from "@/lib/visitorFlow";
import { useVmsRealtime } from "@/hooks/useVmsRealtime";
import { usePageRefresh } from "@/hooks/usePageRefresh";
import { ut, type UiCopyKey } from "@/i18n/uiChrome";

const CHECK_IN_STATUSES = new Set(["Checked In", "Meeting Done"]);
const HISTORY_STATUSES = new Set([
  "Checked Out",
  "Rejected",
  "Meeting Done",
  "Approved",
  "Checked In",
  "Cancelled",
]);

type HistoryTab = "all" | "in" | "out";

const TAB_DEFS: Array<{
  id: HistoryTab;
  labelKey: UiCopyKey;
  tone: StatusFilterOption["tone"];
  match: (row: VisitorListRow) => boolean;
}> = [
  {
    id: "all",
    labelKey: "tab_all",
    tone: "slate",
    match: (row) => !!row.status && HISTORY_STATUSES.has(row.status),
  },
  {
    id: "in",
    labelKey: "status_checked_in",
    tone: "blue",
    match: (row) => !!row.status && CHECK_IN_STATUSES.has(row.status),
  },
  {
    id: "out",
    labelKey: "status_checkout",
    tone: "slate",
    match: (row) => row.status === "Checked Out",
  },
];

function parseTab(raw: string | null): HistoryTab {
  if (raw === "in" || raw === "out" || raw === "all") return raw;
  return "all";
}

function parseRange(raw: string | null): LiveRangeMode {
  return raw === "last_7_days" ? "last_7_days" : "overall";
}

export function MobileHistoryPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { lang } = useAppLanguage();
  const { user } = useAuth();

  usePageChrome({
    title: ut(lang, "history"),
    subtitle: "Visitor log",
    showBack: true,
    backTo: "/inside",
    showNotification: false,
    showProfile: true,
  });

  const tab = parseTab(params.get("tab"));
  const rangeMode = parseRange(params.get("range"));

  const [rows, setRows] = useState<VisitorListRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDateTime, setSelectedDateTime] = useState("");

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await visitorApi.listDetailed(200, visitorScopeFilters(user));
      setRows((list || []).filter((row) => row.status && HISTORY_STATUSES.has(row.status)));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not load history");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  usePageRefresh(loadHistory);

  useVmsRealtime(() => {
    void loadHistory();
  }, true);

  const rangedRows = useMemo(
    () => filterRowsByLiveRange(rows, rangeMode, selectedDateTime),
    [rows, rangeMode, selectedDateTime],
  );

  const searchedRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rangedRows;
    return rangedRows.filter((item) => {
      const hay =
        `${item.full_name || ""} ${item.person_to_meet_name || ""} ${item.mobile || ""} ${item.name || ""} ${item.visitor_company || ""} ${item.status || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rangedRows, query]);

  const counts = useMemo(() => {
    const result = Object.fromEntries(TAB_DEFS.map((def) => [def.id, 0])) as Record<HistoryTab, number>;
    for (const row of rangedRows) {
      for (const def of TAB_DEFS) {
        if (def.match(row)) result[def.id] += 1;
      }
    }
    return result;
  }, [rangedRows]);

  const filterOptions: StatusFilterOption[] = TAB_DEFS.map((def) => ({
    id: def.id,
    label: ut(lang, def.labelKey),
    tone: def.tone,
    count: counts[def.id],
  }));

  const displayList = useMemo(() => {
    const def = TAB_DEFS.find((f) => f.id === tab) || TAB_DEFS[0];
    return searchedRows.filter((r) => def.match(r));
  }, [searchedRows, tab]);

  function setTab(id: string) {
    const next = parseTab(id);
    const nextParams = new URLSearchParams(params);
    if (next === "all") nextParams.delete("tab");
    else nextParams.set("tab", next);
    setParams(nextParams, { replace: true });
  }

  function setRangeMode(next: LiveRangeMode) {
    const nextParams = new URLSearchParams(params);
    if (next === "overall") nextParams.delete("range");
    else nextParams.set("range", next);
    setParams(nextParams, { replace: true });
    setSelectedDateTime("");
  }

  return (
    <div className="ds-page ds-page--visitors vm-history-page">
      <header className="ds-page-header ds-animate-in">
        <div className="ds-page-header__row">
          <h1 className="ds-page-header__title">{ut(lang, "history")}</h1>
          <div className="ds-page-header__controls">
            <WaterDropRangeToggle value={rangeMode} onChange={setRangeMode} lang={lang} />
            <LiveVisitorsCalendarButton
              value={selectedDateTime}
              onChange={setSelectedDateTime}
              lang={lang}
            />
          </div>
        </div>
      </header>

      <SimpleStatusFilter options={filterOptions} value={tab} onChange={setTab} pinAllFilter />

      <SearchBar
        value={query}
        onChange={setQuery}
        placeholder={ut(lang, "search_visitor_or_host")}
        aria-label={ut(lang, "search_visitor_or_host")}
      />

      {error ? (
        <p className="login-error" style={{ textAlign: "center", margin: "0 1rem" }}>
          {error}
        </p>
      ) : null}

      <div className="ds-visitor-list ds-stagger">
        {loading ? (
          <>
            <div className="ds-skeleton" style={{ height: 120, borderRadius: 24 }} />
            <div className="ds-skeleton" style={{ height: 120, borderRadius: 24 }} />
          </>
        ) : displayList.length === 0 ? (
          <div className="ds-card">
            <EmptyState title="No history yet" description="Past visitor records will appear here." />
          </div>
        ) : (
          displayList.map((item) => (
            <VisitorListRowCard
              key={item.name}
              item={item}
              showEntryId
              timelineFilledOnly
              onOpen={(row) => navigate(`/visitor/${encodeURIComponent(row.name)}`)}
            />
          ))
        )}
      </div>
    </div>
  );
}
