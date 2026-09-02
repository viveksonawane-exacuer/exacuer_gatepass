import { BrandLogo } from "@/components/ui/BrandLogo";
import { JourneyLangSwitcher } from "@/components/checkin/JourneyLangSwitcher";
import { type VisitorLang, vt } from "@/i18n/visitorJourney";
import { formatTime } from "@/lib/format";

type TimelineItemProps = {
  title: string;
  sub: string;
  done?: boolean;
  active?: boolean;
  muted?: boolean;
};

function TimelineItem({ title, sub, done, active, muted }: TimelineItemProps) {
  return (
    <div className={`ds-journey-timeline__item${muted ? " is-muted" : ""}`}>
      <div className="ds-journey-timeline__rail">
        <span className={`ds-journey-timeline__dot${done ? " is-done" : ""}${active ? " is-active" : ""}`} />
        <span className="ds-journey-timeline__line" />
      </div>
      <div className="ds-journey-timeline__copy">
        <strong>{title}</strong>
        <span>{sub}</span>
      </div>
    </div>
  );
}

type JourneyAwaitingPanelProps = {
  lang: VisitorLang;
  hostName: string;
  submittedAt: string | null;
  busy: boolean;
  error: string | null;
  onProceed: () => void;
  onLangChange: (lang: VisitorLang) => void;
};

export function JourneyAwaitingPanel({
  lang,
  hostName,
  submittedAt,
  busy,
  error,
  onProceed,
  onLangChange,
}: JourneyAwaitingPanelProps) {
  return (
    <div className="ds-journey-screen" lang={lang}>
      <div className="ds-journey-screen__topbar">
        <BrandLogo variant="mark" className="ds-journey-screen__logo" />
        <div className="ds-journey-screen__brand-copy">
          {vt(lang, "request_status")}
          <span>{vt(lang, "live")}</span>
        </div>
        <JourneyLangSwitcher lang={lang} compact onChange={onLangChange} />
      </div>

      <span className="ds-journey-tag is-warn">{vt(lang, "awaiting_gate")}</span>

      <div className="ds-journey-timeline">
        <TimelineItem done title={vt(lang, "details_submitted")} sub={formatTime(submittedAt || undefined) || "—"} />
        <TimelineItem done title={vt(lang, "host_notified")} sub={hostName} />
        <TimelineItem active title={vt(lang, "awaiting_checkin")} sub={vt(lang, "proceed_gate_desk")} />
        <TimelineItem muted title={vt(lang, "inside")} sub={vt(lang, "pending")} />
      </div>

      <p className="ds-journey-screen__note">{vt(lang, "security_will_checkin")}</p>

      {error ? <p className="ds-form-error">{error}</p> : null}

      <button type="button" className="ds-btn-primary" disabled={busy} onClick={onProceed}>
        {busy ? vt(lang, "checking_in") : vt(lang, "proceed_to_gate")}
      </button>
    </div>
  );
}
