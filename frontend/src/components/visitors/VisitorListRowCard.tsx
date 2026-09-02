import type { VisitorListRow } from "@/api/vms";
import { formatTime } from "@/lib/format";
import { extractRejectionReason } from "@/lib/rejectionReason";
import { getCurrentStageTimestamp } from "@/lib/visitStages";
import { localizeHostDisplay, localizePersonName } from "@/lib/transliterate";
import { VisitorAvatar } from "@/components/ui/VisitorAvatar";
import { VisitorStageTimeline } from "@/components/visitors/VisitorStageTimeline";
import { StatusPill, resolveStatusPillVariant } from "@/components/design-system/StatusPill";
import { useAppLanguage } from "@/context/AppLanguageContext";
import { translateListBadge, ut } from "@/i18n/uiChrome";

type VisitorListRowCardProps = {
  item: VisitorListRow;
  onOpen: (item: VisitorListRow) => void;
  timelineFilledOnly?: boolean;
  showEntryId?: boolean;
};

export function VisitorListRowCard({
  item,
  onOpen,
  timelineFilledOnly = true,
  showEntryId = false,
}: VisitorListRowCardProps) {
  const { lang } = useAppLanguage();
  const time = formatTime(getCurrentStageTimestamp(item), lang) || "—";
  const name = localizePersonName((item.full_name || item.name || "—").trim(), lang);
  const company = (item.visitor_company || "").trim();
  const hostLine = localizeHostDisplay(item.person_to_meet_name, item.floor, lang);
  const purpose = item.visit_purpose_type
    ? localizePersonName(item.visit_purpose_type, lang)
    : null;
  const rejectionReason =
    item.status === "Rejected" ? extractRejectionReason(item.approval_remarks) : null;
  const statusLabel = translateListBadge(lang, item.status, Boolean(item.transfer_to_user));

  return (
    <article
      className="ds-visitor-card"
      onClick={() => onOpen(item)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onOpen(item)}
    >
      <div className="ds-visitor-card__head">
        <VisitorAvatar name={name} photo={item.photo} size={48} />

        <div className="ds-visitor-card__body">
          <div className="ds-visitor-card__title-row">
            <span className="ds-visitor-card__name">{name}</span>
            {company ? <span className="ds-visitor-card__company">{company}</span> : null}
          </div>

          {showEntryId && item.name ? (
            <span className="ds-visitor-card__entry-id">{item.name}</span>
          ) : null}

          <span className="ds-visitor-card__subline">
            {purpose ? `${purpose} · ` : null}
            {ut(lang, "host_prefix")} <strong>{hostLine}</strong>
          </span>

          {rejectionReason ? (
            <p className="ds-visitor-card__reject" title={rejectionReason}>
              {ut(lang, "reason_prefix")} {rejectionReason}
            </p>
          ) : null}
        </div>

        <div className="ds-visitor-card__meta">
          <span className="ds-visitor-card__time">{time}</span>
          <StatusPill
            label={statusLabel}
            variant={resolveStatusPillVariant(item.status)}
          />
        </div>
      </div>

      <div className="ds-visitor-card__divider" />

      <div className="ds-visitor-card__timeline">
        <VisitorStageTimeline visitor={item} compact filledOnly={timelineFilledOnly} />
      </div>
    </article>
  );
}
