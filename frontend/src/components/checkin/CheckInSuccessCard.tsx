interface CheckInSuccessCardProps {
  hostName?: string;
  department?: string;
  checkInTime?: string;
  duration?: string;
  busy?: boolean;
  onGeneratePass?: () => void;
}

export function CheckInSuccessCard({
  hostName = "—",
  department = "—",
  checkInTime = "—",
  duration = "—",
  busy = false,
  onGeneratePass,
}: CheckInSuccessCardProps) {
  return (
    <div className="ds-journey-success">
      <div className="ds-journey-success__icon" aria-hidden>
        ✓
      </div>
      <h1 className="ds-journey-success__title">Checked in successfully</h1>
      <p className="ds-journey-success__sub">Your visit has been recorded at the gate.</p>

      <div className="ds-journey-info-card">
        <div className="ds-journey-info-row">
          <span className="ds-journey-info-row__icon" aria-hidden>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="4" />
              <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
            </svg>
          </span>
          <div>
            <span className="ds-journey-info-row__label">To meet</span>
            <span className="ds-journey-info-row__value">{hostName}</span>
            <span className="ds-journey-info-row__meta">{department}</span>
          </div>
        </div>
        <div className="ds-journey-info-row">
          <span className="ds-journey-info-row__icon" aria-hidden>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </span>
          <div>
            <span className="ds-journey-info-row__label">Check-in time</span>
            <span className="ds-journey-info-row__value">{checkInTime}</span>
          </div>
        </div>
        <div className="ds-journey-info-row">
          <span className="ds-journey-info-row__icon" aria-hidden>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </span>
          <div>
            <span className="ds-journey-info-row__label">Expected duration</span>
            <span className="ds-journey-info-row__value">{duration}</span>
          </div>
        </div>
      </div>

      <div className="ds-journey-notice" role="status">
        <span aria-hidden>ℹ</span>
        <span>You will be notified once your gate pass is ready.</span>
      </div>

      <button type="button" className="ds-btn-primary" style={{ width: "100%" }} disabled={busy} onClick={onGeneratePass}>
        {busy ? "Loading…" : "Generate gate pass"}
      </button>
    </div>
  );
}
