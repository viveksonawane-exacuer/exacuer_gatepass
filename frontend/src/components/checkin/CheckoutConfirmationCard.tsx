interface CheckoutConfirmationCardProps {
  hostName?: string;
  department?: string;
  checkInTime?: string;
  expectedCheckout?: string;
  expectedDuration?: string;
  busy?: boolean;
  onConfirmCheckout: () => void;
  onCancel?: () => void;
}

export function CheckoutConfirmationCard({
  hostName = "—",
  department = "—",
  checkInTime = "—",
  expectedCheckout = "—",
  expectedDuration = "—",
  busy = false,
  onConfirmCheckout,
  onCancel,
}: CheckoutConfirmationCardProps) {
  return (
    <div className="ds-journey-success">
      <div className="ds-journey-success__icon ds-journey-success__icon--checkout" aria-hidden>
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </div>
      <h1 className="ds-journey-success__title">Check-out</h1>
      <p className="ds-journey-success__sub">Confirm you are leaving the premises.</p>

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
            <span className="ds-journey-info-row__label">Expected check-out</span>
            <span className="ds-journey-info-row__value">{expectedCheckout}</span>
            <span className="ds-journey-info-row__meta">Duration: {expectedDuration}</span>
          </div>
        </div>
      </div>

      <div className="ds-journey-notice" role="status">
        <span aria-hidden>ℹ</span>
        <span>After check-out, your visit will be completed and recorded.</span>
      </div>

      <div className="ds-detail-footer">
        <button type="button" className="ds-btn-primary" style={{ width: "100%" }} disabled={busy} onClick={onConfirmCheckout}>
          {busy ? "Checking out…" : "Confirm check-out"}
        </button>
        {onCancel ? (
          <button type="button" className="ds-btn-secondary" style={{ width: "100%" }} onClick={onCancel}>
            Cancel
          </button>
        ) : null}
      </div>
    </div>
  );
}
