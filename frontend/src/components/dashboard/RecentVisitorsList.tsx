import { useNavigate } from "react-router-dom";
import { VisitorAvatar } from "@/components/ui/VisitorAvatar";
import { useAppLanguage } from "@/context/AppLanguageContext";
import { SectionHeader } from "@/components/design-system/SectionHeader";
import { StatusPill, resolveStatusPillVariant } from "@/components/design-system/StatusPill";
import { EmptyState } from "@/components/design-system/EmptyState";
import { ut } from "@/i18n/uiChrome";

export type RecentVisitorItem = {
  name: string;
  full_name: string;
  purpose?: string;
  time: string;
  status: string;
  statusRaw?: string;
  photo?: string | null;
};

type RecentVisitorsListProps = {
  visitors?: RecentVisitorItem[];
  loading?: boolean;
};

function IconUsersEmpty() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
    </svg>
  );
}

export function RecentVisitorsList({ visitors = [], loading = false }: RecentVisitorsListProps) {
  const navigate = useNavigate();
  const { lang } = useAppLanguage();

  return (
    <div className="ds-card vm-recent-card">
      <SectionHeader
        title={ut(lang, "recent_visitors")}
        actionLabel={`${ut(lang, "view_all")} ›`}
        onAction={() => navigate("/inside")}
      />

      <div className="ds-activity-list ds-stagger">
        {loading ? (
          <>
            <div className="ds-skeleton" style={{ height: 72, borderRadius: 20 }} />
            <div className="ds-skeleton" style={{ height: 72, borderRadius: 20 }} />
            <div className="ds-skeleton" style={{ height: 72, borderRadius: 20 }} />
          </>
        ) : visitors.length === 0 ? (
          <EmptyState
            icon={<IconUsersEmpty />}
            title="No recent visitors"
            description="Visitor activity will appear here once someone checks in."
          />
        ) : (
          visitors.map((v) => (
            <button
              key={v.name}
              type="button"
              className="ds-activity-card"
              onClick={() => navigate(`/visitor/${encodeURIComponent(v.name)}`)}
            >
              <VisitorAvatar name={v.full_name} photo={v.photo} size={44} />
              <div className="ds-activity-card__body">
                <span className="ds-activity-card__title">{v.full_name}</span>
                {v.purpose ? (
                  <span className="ds-activity-card__desc">{v.purpose}</span>
                ) : null}
                <div style={{ marginTop: 6 }}>
                  <StatusPill
                    label={v.status}
                    variant={resolveStatusPillVariant(v.statusRaw || v.status)}
                  />
                </div>
              </div>
              <div className="ds-activity-card__meta">
                <span className="ds-activity-card__time">{v.time}</span>
                <span aria-hidden style={{ color: "var(--vms-placeholder)", fontSize: 18 }}>
                  ›
                </span>
              </div>
            </button>
          ))
        )}
      </div>

      <button
        type="button"
        className="ds-btn-secondary"
        style={{ width: "100%", marginTop: 14 }}
        onClick={() => navigate("/history")}
      >
        {ut(lang, "view_visitor_history")}
      </button>
    </div>
  );
}
