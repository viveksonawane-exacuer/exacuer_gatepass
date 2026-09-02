import { formatStageTimestamp, getVisitStatusStages, type VisitStageTimestamps } from "@/lib/visitStages";
import { useAppLanguage } from "@/context/AppLanguageContext";
import { translateVisitStage } from "@/i18n/uiChrome";

type VisitorStageTimelineProps = {
  visitor: VisitStageTimestamps;
  compact?: boolean;
  filledOnly?: boolean;
  className?: string;
};

export function VisitorStageTimeline({
  visitor,
  compact = false,
  filledOnly = compact,
  className = "",
}: VisitorStageTimelineProps) {
  const { lang } = useAppLanguage();
  const stages = getVisitStatusStages(visitor).filter((stage) => !filledOnly || Boolean(stage.at));

  if (!stages.length) return null;

  return (
    <div
      className={`ds-visit-stage-timeline${compact ? " is-compact" : ""} ${className}`.trim()}
    >
      {stages.map((stage) => (
        <span key={stage.key} className="ds-visit-stage-chip">
          <strong>{translateVisitStage(lang, stage.key, stage.label)}</strong>
          {formatStageTimestamp(stage.at, compact, lang)}
        </span>
      ))}
    </div>
  );
}
