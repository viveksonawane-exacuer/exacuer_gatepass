import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { securityApi, visitorApi, type VisitorListRow } from "@/api/vms";
import { CheckoutPendingReport } from "@/components/reports/CheckoutPendingReport";
import { extractError } from "@/lib/format";
import { filterRowsByLiveRange } from "@/lib/visitorFlow";
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
import { canPerformCheckout, visitorScopeFilters } from "@/lib/roles";
import { useVmsRealtime } from "@/hooks/useVmsRealtime";
import { usePageRefresh } from "@/hooks/usePageRefresh";
import { ut, type UiCopyKey } from "@/i18n/uiChrome";

const INSIDE_STATUSES = new Set(["Checked In", "Meeting Done"]);
const CHECKOUT_PENDING_STATUS = "Meeting Done";

type FilterId =
  | "all"
  | "pending"
  | "inside"
  | "checkout_pending"
  | "approved"
  | "checked_in"
  | "checked_out"
  | "rejected"
  | "transferred";

const FILTER_DEFS: Array<{
  id: FilterId;
  labelKey: UiCopyKey;
  tone: StatusFilterOption["tone"];
  match: (row: VisitorListRow) => boolean;
}> = [
  { id: "all", labelKey: "tab_all", tone: "slate", match: () => true },
  { id: "inside", labelKey: "tab_inside", tone: "green", match: (row) => !!row.status && INSIDE_STATUSES.has(row.status) },
  { id: "pending", labelKey: "tab_pending", tone: "amber", match: (row) => row.status === "Pending Approval" },
  { id: "checkout_pending", labelKey: "status_checkout_pending", tone: "indigo", match: (row) => row.status === CHECKOUT_PENDING_STATUS },
  { id: "checked_in", labelKey: "status_checked_in", tone: "blue", match: (row) => row.status === "Checked In" },
  { id: "approved", labelKey: "tab_approved", tone: "blue", match: (row) => row.status === "Approved" },
  { id: "checked_out", labelKey: "status_checkout", tone: "slate", match: (row) => row.status === "Checked Out" },
  { id: "transferred", labelKey: "status_transferred", tone: "slate", match: (row) => Boolean(row.transfer_to_user) },
  { id: "rejected", labelKey: "status_rejected", tone: "red", match: (row) => row.status === "Rejected" },
];

function parseFilter(raw: string | null): FilterId {
  if (raw === "meeting_done") return "checkout_pending";
  const found = FILTER_DEFS.find((f) => f.id === raw);
  return found?.id ?? "inside";
}

function parseRange(raw: string | null): LiveRangeMode {
  return raw === "last_7_days" ? "last_7_days" : "overall";
}

// Fast in-memory cache for instant 0ms tab navigation
let cachedInsideRows: VisitorListRow[] | null = null;

export function MobileInsidePage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { lang } = useAppLanguage();
  const { user } = useAuth();
  const showCheckout = canPerformCheckout(user);

  usePageChrome({
    title: ut(lang, "live_visitors"),
    subtitle: ut(lang, "on_premises"),
    showBack: false,
    showNotification: true,
    showProfile: true,
  });

  const filter = parseFilter(params.get("status"));
  const rangeMode = parseRange(params.get("range"));

  const [rows, setRows] = useState<VisitorListRow[]>(() => cachedInsideRows || []);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState<boolean>(() => !cachedInsideRows);
  const [error, setError] = useState<string | null>(null);
  const [checkoutBusy, setCheckoutBusy] = useState<string | null>(null);
  const [selectedDateTime, setSelectedDateTime] = useState("");

  const loadVisitors = useCallback(async (isSilent = false) => {
    if (!isSilent && !cachedInsideRows) {
      setLoading(true);
    }
    setError(null);
    try {
      const list = await visitorApi.listDetailed(100, visitorScopeFilters(user));
      const nextList = list || [];
      cachedInsideRows = nextList;
      setRows(nextList);
    } catch (err: unknown) {
      if (!cachedInsideRows) {
        setError(err instanceof Error ? err.message : "Could not load visitors");
        setRows([]);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadVisitors();
  }, [loadVisitors]);

  usePageRefresh(loadVisitors);

  useVmsRealtime(() => {
    void loadVisitors();
  }, true);

  const handleCheckout = useCallback(
    async (row: VisitorListRow) => {
      setCheckoutBusy(row.name);
      setError(null);
      try {
        await securityApi.checkOut(row.name);
        await loadVisitors();
      } catch (err: unknown) {
        setError(extractError(err, "Checkout failed"));
      } finally {
        setCheckoutBusy(null);
      }
    },
    [loadVisitors],
  );

  const rangedRows = useMemo(
    () => filterRowsByLiveRange(rows, rangeMode, selectedDateTime),
    [rows, rangeMode, selectedDateTime],
  );

  const searchedRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rangedRows;
    return rangedRows.filter((item) => {
      const hay = `${item.full_name || ""} ${item.person_to_meet_name || ""} ${item.mobile || ""} ${item.status || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rangedRows, query]);

  const counts = useMemo(() => {
    const result = Object.fromEntries(FILTER_DEFS.map((def) => [def.id, 0])) as Record<FilterId, number>;
    result.all = rangedRows.length;
    for (const row of rangedRows) {
      for (const def of FILTER_DEFS) {
        if (def.id === "all") continue;
        if (def.match(row)) result[def.id] += 1;
      }
    }
    return result;
  }, [rangedRows]);

  const filterOptions: StatusFilterOption[] = FILTER_DEFS.map((def) => ({
    id: def.id,
    label: ut(lang, def.labelKey),
    tone: def.tone,
    count: counts[def.id],
  }));

  const displayList = useMemo(() => {
    const def = FILTER_DEFS.find((f) => f.id === filter) || FILTER_DEFS[0];
    return searchedRows.filter((r) => def.match(r));
  }, [searchedRows, filter]);

  function setFilter(id: string) {
    const next = parseFilter(id);
    const nextParams = new URLSearchParams(params);
    nextParams.set("status", next);
    setParams(nextParams, { replace: true });
  }

  function setRangeMode(next: LiveRangeMode) {
    const nextParams = new URLSearchParams(params);
    if (next === "overall") nextParams.delete("range");
    else nextParams.set("range", next);
    setParams(nextParams, { replace: true });
    // Range toggle clears calendar pick so modes stay clear
    setSelectedDateTime("");
  }

  return (
    <div className="ds-page ds-page--visitors">

      <header className="ds-page-header ds-animate-in">
        <div className="ds-page-header__row">
          <h1 className="ds-page-header__title">{ut(lang, "live_visitors")}</h1>
          <div className="ds-page-header__controls">
            <WaterDropRangeToggle
              value={rangeMode}
              onChange={setRangeMode}
              lang={lang}
            />
            <LiveVisitorsCalendarButton
              value={selectedDateTime}
              onChange={setSelectedDateTime}
              lang={lang}
            />
          </div>
        </div>
      </header>

      <SimpleStatusFilter options={filterOptions} value={filter} onChange={setFilter} pinAllFilter />

      <SearchBar
        value={query}
        onChange={setQuery}
        placeholder={ut(lang, "search_visitor_or_host")}
        aria-label={ut(lang, "search_visitor_or_host")}
      />

      {error ? <p className="login-error" style={{ textAlign: "center", margin: "0 1rem" }}>{error}</p> : null}

      {filter === "checkout_pending" ? (
        <CheckoutPendingReport
          rows={searchedRows}
          loading={loading}
          showCheckoutAction={showCheckout}
          checkoutBusyId={checkoutBusy}
          onOpenVisitor={(row) => navigate(`/visitor/${encodeURIComponent(row.name)}`)}
          onCheckout={handleCheckout}
        />
      ) : (
        <div className="ds-visitor-list ds-stagger">
          {loading ? (
            <>
              <div className="ds-skeleton" style={{ height: 120, borderRadius: 24 }} />
              <div className="ds-skeleton" style={{ height: 120, borderRadius: 24 }} />
            </>
          ) : displayList.length === 0 ? (
            <div className="ds-card">
              <EmptyState
                title="No visitors found"
                description="No visitors match this filter. Try another status or search term."
              />
            </div>
          ) : (
            displayList.map((item) => (
              <VisitorListRowCard
                key={item.name}
                item={item}
                onOpen={(row) => navigate(`/visitor/${encodeURIComponent(row.name)}`)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
