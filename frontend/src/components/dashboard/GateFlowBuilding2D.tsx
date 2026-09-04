import { useEffect, useMemo, useState } from "react";
import { apiClient } from "@/api/client";
import type { DashboardKpis, VisitorListRow } from "@/api/vms";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { COMPANY_NAME } from "@/config/env";
import { buildGateFlowSceneData } from "@/lib/gateFlowBuildingData";
import { formatCount } from "@/lib/format";
import type { VisitorLang } from "@/i18n/visitorJourney";

type Props = {
  lang: VisitorLang;
  kpis?: DashboardKpis;
  rows?: VisitorListRow[];
  loading?: boolean;
  onGateNavigate?: () => void;
  onInsideNavigate?: () => void;
};

async function fetchCompanyName(): Promise<string> {
  try {
    const { data } = await apiClient.post(`/api/method/frappe.client.get_single_value`, {
      doctype: "Global Defaults",
      field: "default_company",
    });
    return String(data?.message || "").trim();
  } catch {
    return "";
  }
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

export function GateFlowBuilding2D({
  lang,
  kpis = {},
  rows = [],
  loading = false,
  onGateNavigate,
  onInsideNavigate,
}: Props) {
  const [companyName, setCompanyName] = useState("");

  const sceneData = useMemo(() => buildGateFlowSceneData(kpis, rows), [kpis, rows]);
  const { occupancy, gate } = sceneData;
  const todayTotal = occupancy.pending + occupancy.inTransit + occupancy.completed;
  const displayCompany = (companyName || COMPANY_NAME).trim() || "Exacuer Global";

  useEffect(() => {
    let cancelled = false;
    void fetchCompanyName().then((name) => {
      if (!cancelled) setCompanyName(name);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="ds-gateflow">
      <header className="ds-gateflow__header">
        <div className="ds-gateflow__brand">
          <BrandLogo variant="icon" className="ds-gateflow__logo" alt={displayCompany} />
          <div className="ds-gateflow__brand-copy">
            <strong className="ds-gateflow__company">{displayCompany}</strong>
            <span className="ds-gateflow__company-sub">
              {loading ? "Syncing live status…" : "Visitor management"}
            </span>
          </div>
        </div>
      </header>

      <button
        type="button"
        className="ds-gateflow__site-card"
        onClick={onInsideNavigate}
        aria-label={`Today's visitors: ${todayTotal}`}
      >
        <div className="ds-gateflow__site-head">
          <div className="ds-gateflow__site-title">
            <span className="ds-gateflow__site-icon" aria-hidden>
              <UsersIcon />
            </span>
            <span>Today's visitors</span>
          </div>
          <span className="ds-gateflow__site-trail">
            <b>{formatCount(todayTotal, lang)}</b> today ›
          </span>
        </div>

        <div className="ds-gateflow__metrics" role="list">
          <div className="ds-gateflow__metric" role="listitem">
            <span className="ds-gateflow__metric-num ds-gateflow__metric-num--pending">
              {occupancy.pending}
            </span>
            <span className="ds-gateflow__metric-label">Pending</span>
          </div>
          <div className="ds-gateflow__metric" role="listitem">
            <span className="ds-gateflow__metric-num ds-gateflow__metric-num--transit">
              {occupancy.inTransit}
            </span>
            <span className="ds-gateflow__metric-label">In-transit</span>
          </div>
          <div className="ds-gateflow__metric" role="listitem">
            <span className="ds-gateflow__metric-num ds-gateflow__metric-num--done">
              {occupancy.completed}
            </span>
            <span className="ds-gateflow__metric-label">Completed</span>
          </div>
        </div>
      </button>

      <button
        type="button"
        className="ds-gateflow__gate-card"
        onClick={onGateNavigate}
        aria-label={`Security gate: ${gate.pendingApproval} pending approval`}
      >
        <div className="ds-gateflow__gate-left">
          <span className="ds-gateflow__gate-icon" aria-hidden>
            <ShieldIcon />
          </span>
          <div className="ds-gateflow__gate-copy">
            <div className="ds-gateflow__gate-title-row">
              <strong className="ds-gateflow__gate-title">Security Gate Station</strong>
              <span className="ds-gateflow__gate-tag">Gate desk</span>
            </div>
            <p className="ds-gateflow__gate-sub">Visitor entrance & approval desk</p>
            <span className="ds-gateflow__gate-approved">
              {formatCount(gate.approved, lang)} approved passes
            </span>
          </div>
        </div>
        <div className="ds-gateflow__gate-pending">
          <span className="ds-gateflow__gate-pending-num">{gate.pendingApproval}</span>
          <span className="ds-gateflow__gate-pending-label">Pending approval</span>
        </div>
      </button>
    </div>
  );
}
