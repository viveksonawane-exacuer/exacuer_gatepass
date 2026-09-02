import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { PwaInstallButton } from "@/components/ui/PwaInstallButton";
import { JourneyLangSwitcher } from "@/components/checkin/JourneyLangSwitcher";
import { type VisitorLang, vt } from "@/i18n/visitorJourney";

type VisitorWelcomePanelProps = {
  lang: VisitorLang;
  onLangChange: (lang: VisitorLang) => void;
  onGetStarted: () => void;
};

/** Add Visitor flow — welcome splash inside check-in. */
export function VisitorWelcomePanel({ lang, onLangChange, onGetStarted }: VisitorWelcomePanelProps) {
  const navigate = useNavigate();
  const [activePoint, setActivePoint] = useState<"verify" | "host" | "pass">("verify");

  const securityPoints = useMemo(
    () =>
      [
        { id: "verify" as const, title: vt(lang, "sec_verify") },
        { id: "host" as const, title: vt(lang, "sec_host") },
        { id: "pass" as const, title: vt(lang, "sec_pass") },
      ] as const,
    [lang],
  );

  return (
    <div className="ds-welcome-page" lang={lang}>
      <button
        type="button"
        className="ds-welcome-back"
        onClick={() => navigate("/")}
        aria-label={vt(lang, "back_home")}
      >
        ‹ {vt(lang, "back_home")}
      </button>

      <header className="ds-welcome-brand">
        <BrandLogo variant="full" className="welcome-wordmark" />
        <p className="ds-welcome-brand__tag">{vt(lang, "brand_tag")}</p>
      </header>

      <h1 className="ds-welcome-title">{vt(lang, "welcome_title")}</h1>

      <section aria-label="Check-in steps">
        <div className="ds-welcome-tabs" role="tablist" aria-label="Check-in steps">
          {securityPoints.map((point) => {
            const selected = point.id === activePoint;
            return (
              <button
                key={point.id}
                type="button"
                role="tab"
                aria-selected={selected}
                className={`ds-welcome-tab${selected ? " is-active" : ""}`}
                onClick={() => setActivePoint(point.id)}
              >
                {point.title}
              </button>
            );
          })}
        </div>
      </section>

      <div className="ds-welcome-actions">
        <button type="button" className="ds-btn-primary" onClick={onGetStarted}>
          {vt(lang, "get_started")}
        </button>
        <PwaInstallButton variant="welcome" />
      </div>

      <JourneyLangSwitcher lang={lang} onChange={onLangChange} />
    </div>
  );
}
