import { useNavigate } from "react-router-dom";
import { VisitorAvatar } from "@/components/ui/VisitorAvatar";
import { useAppLanguage } from "@/context/AppLanguageContext";
import { ut } from "@/i18n/uiChrome";

export type RecentVisitorItem = {
  name: string;
  full_name: string;
  purpose?: string;
  time: string;
  status: string;
  /** Raw ERP status for tone styling (optional). */
  statusRaw?: string;
  photo?: string | null;
};

type RecentVisitorsListProps = {
  visitors?: RecentVisitorItem[];
  loading?: boolean;
};

function statusTone(status: string) {
  const s = status.toLowerCase();
  if (s.includes("out") || s.includes("चेक-आउट") || s.includes("नाकार") || s.includes("अस्वीकृत")) {
    return { color: "#ea580c", bg: "rgba(234, 88, 12, 0.08)", dot: "#ea580c" };
  }
  if (
    s.includes("pending") ||
    s.includes("reject") ||
    s.includes("प्रलंबित") ||
    s.includes("पेंडिंग") ||
    s.includes("नाकार") ||
    s.includes("अस्वीकृत")
  ) {
    return { color: "#d97706", bg: "rgba(217, 119, 6, 0.08)", dot: "#f59e0b" };
  }
  return { color: "#10b981", bg: "rgba(16, 185, 129, 0.08)", dot: "#10b981" };
}

function toneFromRaw(raw?: string, fallbackStatus?: string) {
  if (raw) {
    const s = raw.toLowerCase();
    if (s.includes("out") || s.includes("reject")) return { color: "#ea580c", bg: "rgba(234, 88, 12, 0.08)", dot: "#ea580c" };
    if (s.includes("pending")) return { color: "#d97706", bg: "rgba(217, 119, 6, 0.08)", dot: "#f59e0b" };
    return { color: "#10b981", bg: "rgba(16, 185, 129, 0.08)", dot: "#10b981" };
  }
  return statusTone(fallbackStatus || "");
}

export function RecentVisitorsList({ visitors = [], loading = false }: RecentVisitorsListProps) {
  const navigate = useNavigate();
  const { lang } = useAppLanguage();
  const displayVisitors = visitors;

  return (
    <div className="vm-overview-card vm-recent-card vm-trending-style">
      <div className="vm-trending-head">
        <div className="vm-trending-head-left">
          <div className="vm-trending-head-icon">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="vm-trending-head-titles">
            <h3 className="vm-trending-title">{ut(lang, "recent_visitors")}</h3>
            {!loading && displayVisitors.length > 0 ? (
              <span className="vm-trending-count-badge">
                {displayVisitors.length} Recent
              </span>
            ) : null}
          </div>
        </div>

        <button type="button" className="vm-trending-viewall-btn" onClick={() => navigate("/inside")}>
          {ut(lang, "view_all")} ›
        </button>
      </div>

      <div className="vm-trending-list">
        {loading ? (
          <div className="vm-empty-hint-box">
            <span className="vm-empty-hint">{ut(lang, "loading_visitors")}</span>
          </div>
        ) : displayVisitors.length === 0 ? (
          <div className="vm-empty-hint-box">
            <span className="vm-empty-hint">No recent visitors logged today</span>
          </div>
        ) : (
          displayVisitors.map((v) => {
            const tone = toneFromRaw(v.statusRaw, v.status);
            return (
              <button
                key={v.name}
                type="button"
                className="vm-trending-row"
                onClick={() => navigate(`/visitor/${encodeURIComponent(v.name)}`)}
              >
                <div className="vm-trending-avatar-col">
                  <div className="vm-trending-avatar-wrap">
                    <VisitorAvatar
                      name={v.full_name}
                      photo={v.photo}
                      className="vm-trending-avatar-img"
                    />
                  </div>
                </div>

                <div className="vm-trending-info-col">
                  <div className="vm-trending-name-row">
                    <strong className="vm-trending-name">{v.full_name}</strong>
                    <span className="vm-trending-type-tag">.pass</span>
                  </div>
                  <div className="vm-trending-status-row">
                    <span
                      className="vm-trending-status-pill"
                      style={{ backgroundColor: tone.bg, color: tone.color }}
                    >
                      <span className="vm-trending-dot" style={{ backgroundColor: tone.dot }} />
                      {v.status}
                    </span>
                    {v.purpose ? (
                      <span className="vm-trending-purpose" title={v.purpose}>
                        · {v.purpose}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="vm-trending-meta-col">
                  <span className="vm-trending-time-pill">{v.time}</span>
                  <span className="vm-trending-row-arrow" aria-hidden>›</span>
                </div>
              </button>
            );
          })
        )}
      </div>

      <button
        type="button"
        className="vm-history-cta-btn"
        onClick={() => navigate("/history")}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span>{ut(lang, "view_visitor_history")}</span>
        <span className="vm-cta-arrow">›</span>
      </button>
    </div>
  );
}
