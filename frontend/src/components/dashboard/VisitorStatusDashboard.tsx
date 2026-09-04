import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { resolveStatusCounts } from "@/lib/visitorStatusDashboard";
import type { DashboardKpis, VisitorListRow } from "@/api/vms";
import { useAppLanguage } from "@/context/AppLanguageContext";
import { formatCount } from "@/lib/format";
import { ut } from "@/i18n/uiChrome";
import { GateFlowBuilding2D } from "@/components/dashboard/GateFlowBuilding2D";

interface VisitorStatusDashboardProps {
  kpis?: DashboardKpis;
  rows?: VisitorListRow[];
  loading?: boolean;
  title?: string;
  subtitle?: string;
  className?: string;
  defaultOpen?: boolean;
}

export function VisitorStatusDashboard({
  kpis = {},
  rows = [],
  loading = false,
  title,
  subtitle,
  className = "",
  defaultOpen = false,
}: VisitorStatusDashboardProps) {
  const navigate = useNavigate();
  const { lang } = useAppLanguage();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const counts = resolveStatusCounts(kpis, rows);
  const heading = title ?? ut(lang, "status_overview");
  const sub = subtitle ?? "Live visitor occupancy & gate status";

  const totalActive =
    (counts["Pending Approval"] || 0) +
    (counts["Checked In"] || 0) +
    (counts["Checkout Pending"] || 0);

  return (
    <section className={`vm-status-accordion-card ${className}`.trim()} aria-label={heading}>
      <button
        type="button"
        className={`vm-status-accordion-header${isOpen ? " is-open" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        <div className="vm-status-accordion-left">
          <div className="vm-status-accordion-icon">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M3 3v18h18" />
              <path d="M18 9l-5 5-4-4-3 3" />
            </svg>
          </div>
          <div className="vm-status-accordion-titles">
            <div className="vm-status-accordion-title-row">
              <h2 className="vm-status-accordion-title">{heading}</h2>
              {totalActive > 0 ? (
                <span className="vm-status-accordion-badge">
                  {formatCount(totalActive, lang)} Active
                </span>
              ) : null}
            </div>
            {sub ? <p className="vm-status-accordion-sub">{sub}</p> : null}
          </div>
        </div>

        <div className="vm-status-accordion-right">
          <span className="vm-status-accordion-toggle-text">
            {isOpen ? "Hide" : "Show"}
          </span>
          <div className={`vm-status-accordion-chevron${isOpen ? " is-open" : ""}`}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      </button>

      {isOpen ? (
        <div className="vm-status-accordion-body">
          <GateFlowBuilding2D
            lang={lang}
            kpis={kpis}
            rows={rows}
            loading={loading}
            onGateNavigate={() => navigate("/approvals?tab=pending")}
            onInsideNavigate={() => navigate("/inside?status=inside")}
          />
        </div>
      ) : null}
    </section>
  );
}
