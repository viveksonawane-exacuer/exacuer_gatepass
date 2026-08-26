import type { VisitorListRow } from "@/api/vms";
import { formatTime } from "@/lib/format";
import { extractRejectionReason } from "@/lib/rejectionReason";
import { getCurrentStageTimestamp } from "@/lib/visitStages";
import { localizeHostDisplay, localizePersonName } from "@/lib/transliterate";
import { VisitorAvatar } from "@/components/ui/VisitorAvatar";
import { VisitorStageTimeline } from "@/components/visitors/VisitorStageTimeline";
import { useAppLanguage } from "@/context/AppLanguageContext";
import { translateListBadge, ut } from "@/i18n/uiChrome";

type VisitorListRowCardProps = {
  item: VisitorListRow;
  index?: number;
  onOpen: (item: VisitorListRow) => void;
  timelineFilledOnly?: boolean;
  showEntryId?: boolean;
};

function statusToneClass(status?: string) {
  if (status === "Pending Approval") return "is-pending";
  if (status === "Approved") return "is-approved";
  if (status === "Checked In") return "is-in";
  if (status === "Meeting Done") return "is-checkout";
  if (status === "Checked Out") return "is-out";
  if (status === "Rejected") return "is-rejected";
  return "is-default";
}

export function VisitorListRowCard({
  item,
  index = 0,
  onOpen,
  timelineFilledOnly = true,
  showEntryId = false,
}: VisitorListRowCardProps) {
  const { lang } = useAppLanguage();
  const time = formatTime(getCurrentStageTimestamp(item), lang) || "—";
  const name = localizePersonName((item.full_name || item.name || "—").trim(), lang);
  const company = (item.visitor_company || "").trim();
  const hostLine = localizeHostDisplay(item.person_to_meet_name, item.floor, lang);
  const rejectionReason =
    item.status === "Rejected" ? extractRejectionReason(item.approval_remarks) : null;
  const statusLabel = translateListBadge(lang, item.status, Boolean(item.transfer_to_user));
  const toneClass = statusToneClass(item.status);

  return (
    <div
      className="vm-live-card-modern"
      style={{ animationDelay: `${Math.min(index, 10) * 25}ms` }}
      onClick={() => onOpen(item)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onOpen(item)}
    >
      <div className="vm-live-card-head">
        <VisitorAvatar
          name={name}
          photo={item.photo}
          className={`vm-live-avatar ${toneClass}`}
        />

        <div className="vm-live-body">
          <div className="vm-live-title-row">
            <span className="vm-live-name">{name}</span>
            {company ? (
              <span className="vm-live-company-pill">
                <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="7" width="18" height="14" rx="2" />
                  <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                <span>{company}</span>
              </span>
            ) : null}
          </div>

          {showEntryId && item.name ? (
            <span className="vm-live-entry-id">{item.name}</span>
          ) : null}

          <p className="vm-live-host-row">
            <span className="vm-live-host-prefix">{ut(lang, "host_prefix")}</span>
            <strong className="vm-live-host-name">{hostLine}</strong>
          </p>

          {rejectionReason ? (
            <p className="vm-live-reject-reason" title={rejectionReason}>
              {ut(lang, "reason_prefix")} <span>{rejectionReason}</span>
            </p>
          ) : null}
        </div>

        <div className="vm-live-meta-side">
          <span className="vm-live-time">{time}</span>
          <span className={`vm-live-status-badge ${toneClass}`}>
            <span className="vm-live-badge-dot" aria-hidden />
            <span>{statusLabel}</span>
          </span>
        </div>
      </div>

      <div className="vm-live-divider" />

      <div className="vm-live-timeline-wrap">
        <VisitorStageTimeline visitor={item} compact filledOnly={timelineFilledOnly} />
      </div>
    </div>
  );
}

