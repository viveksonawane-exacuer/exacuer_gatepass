import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  STATUS_DASHBOARD_TILES,
  resolveStatusCounts,
  type VisitorStatusKey,
} from "@/lib/visitorStatusDashboard";
import type { DashboardKpis, VisitorListRow } from "@/api/vms";
import { useAppLanguage } from "@/context/AppLanguageContext";
import { formatCount } from "@/lib/format";
import { translateVisitorStatus, ut, type UiCopyKey } from "@/i18n/uiChrome";

interface VisitorStatusDashboardProps {
  kpis?: DashboardKpis;
  rows?: VisitorListRow[];
  loading?: boolean;
  title?: string;
  subtitle?: string;
  className?: string;
  defaultOpen?: boolean;
}

const STATUS_FOOT_KEYS: Partial<Record<VisitorStatusKey, UiCopyKey>> = {
  "Pending Approval": "needs_action",
  "Checkout Pending": "awaiting_gate",
};

function statusIconAndColors(key: VisitorStatusKey) {
  switch (key) {
    case "Pending Approval":
      return {
        bg: "rgba(245, 158, 11, 0.12)",
        color: "#f59e0b",
        icon: (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        ),
      };
    case "Approved":
      return {
        bg: "rgba(16, 185, 129, 0.12)",
        color: "#10b981",
        icon: (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        ),
      };
    case "Checked In":
      return {
        bg: "rgba(59, 130, 246, 0.12)",
        color: "#3b82f6",
        icon: (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
          </svg>
        ),
      };
    case "Meeting Done":
    case "Checkout Pending":
      return {
        bg: "rgba(139, 92, 246, 0.12)",
        color: "#8b5cf6",
        icon: (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 14 14" />
          </svg>
        ),
      };
    case "Checked Out":
    case "Rejected":
    case "Transferred":
      return {
        bg: "rgba(100, 116, 139, 0.12)",
        color: "#64748b",
        icon: (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
        ),
      };
    default: {
      const _exhaustive: never = key;
      return _exhaustive;
    }
  }
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
  const sub = subtitle ?? ut(lang, "status_overview_sub");

  const totalActive =
    (counts["Pending Approval"] || 0) +
    (counts["Checked In"] || 0) +
    (counts["Checkout Pending"] || 0);

  return (
    <section className={`vm-status-accordion-card ${className}`.trim()} aria-label={heading}>
      {/* Collapsible Dropdown Header Toggle */}
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

      {/* Accordion Body */}
      {isOpen ? (
        <div className="vm-status-accordion-body">
          <div className="vm-status-list-stack">
            {STATUS_DASHBOARD_TILES.map((tile) => {
              const value = counts[tile.key];
              const showWarn = tile.key === "Pending Approval" && !loading && value > 0;
              const showCheckout = tile.key === "Checkout Pending" && !loading && value > 0;
              const label = translateVisitorStatus(lang, tile.key);
              const footKey = STATUS_FOOT_KEYS[tile.key];
              const footWarn = footKey ? ut(lang, footKey) : undefined;
              const { bg, color, icon } = statusIconAndColors(tile.key);

              return (
                <button
                  key={tile.key}
                  type="button"
                  className="vm-status-list-row"
                  onClick={() => navigate(tile.to)}
                  aria-label={`${label}: ${loading ? "loading" : value}`}
                >
                  <div className="vm-status-list-left">
                    <div className="vm-status-list-icon" style={{ background: bg, color }}>
                      {icon}
                    </div>
                    <div className="vm-status-list-info">
                      <span className="vm-status-list-name">{label}</span>
                      {showWarn || showCheckout ? (
                        <span className="vm-status-list-pill is-warn">{footWarn}</span>
                      ) : null}
                    </div>
                  </div>

                  <div className="vm-status-list-right">
                    <span className={`vm-status-list-count${value > 0 ? " has-count" : ""}`}>
                      {loading ? "—" : formatCount(value, lang)}
                    </span>
                    <span className="vm-status-list-arrow" aria-hidden>›</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}


