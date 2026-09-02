type JourneyStepHeaderProps = {
  currentStep: number;
  totalSteps: number;
  stepLabel: string;
  tone?: "default" | "success" | "info" | "warning";
  onBack?: () => void;
  backLabel?: string;
};

export function JourneyStepHeader({
  currentStep,
  totalSteps,
  stepLabel,
  tone = "default",
  onBack,
  backLabel = "Back",
}: JourneyStepHeaderProps) {
  return (
    <div className="ds-journey-header">
      <header className="ds-journey-header__top">
        {onBack ? (
          <button type="button" className="ds-journey-header__back" onClick={onBack} aria-label={backLabel}>
            ‹
          </button>
        ) : (
          <span className="ds-journey-header__spacer" aria-hidden />
        )}
        <span className={`ds-journey-header__pill is-${tone}`}>{stepLabel}</span>
        <span className="ds-journey-header__spacer" aria-hidden />
      </header>

      <div className="ds-journey-progress" aria-hidden>
        {Array.from({ length: totalSteps }, (_, i) => (
          <span
            key={i}
            className={`ds-journey-progress__seg${i < currentStep ? " is-filled" : ""}`}
          />
        ))}
      </div>
    </div>
  );
}
