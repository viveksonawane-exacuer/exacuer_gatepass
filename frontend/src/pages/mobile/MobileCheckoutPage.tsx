import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { securityApi, visitorApi } from "@/api/vms";
import { extractError } from "@/lib/format";
import { usePageChrome } from "@/context/PageChromeContext";
import { useAuth } from "@/context/AuthContext";
import { canPerformCheckout } from "@/lib/roles";
import { CheckoutConfirmationCard } from "@/components/checkin/CheckoutConfirmationCard";
import { EmptyState } from "@/components/design-system/EmptyState";

type VisitorDoc = {
  name?: string;
  full_name?: string;
  visitor_company?: string;
  status?: string;
  mobile?: string;
};

export function MobileCheckoutPage() {
  const { name: routeName = "" } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const showCheckout = canPerformCheckout(user);
  const [visitor, setVisitor] = useState<VisitorDoc | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkedOutSuccess, setCheckedOutSuccess] = useState(false);

  usePageChrome({
    title: "Check-out",
    subtitle: "Visitor exit",
    showBack: true,
  });

  useEffect(() => {
    if (!routeName) return;
    let cancelled = false;
    async function load() {
      try {
        const doc = (await visitorApi.get(routeName)) as VisitorDoc;
        if (!cancelled) {
          setVisitor(doc);
        }
      } catch (err: unknown) {
        if (!cancelled) setError(extractError(err, "Visitor not found"));
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [routeName]);

  if (!showCheckout) {
    return <Navigate to="/approvals" replace />;
  }

  async function onCheckout() {
    const id = visitor?.name || routeName;
    setBusy(true);
    setError(null);
    try {
      if (id) {
        await securityApi.checkOut(id, "Checked out via mobile");
      }
      setCheckedOutSuccess(true);
    } catch (err: unknown) {
      setError(extractError(err, "Checkout failed"));
    } finally {
      setBusy(false);
    }
  }

  if (checkedOutSuccess) {
    return (
      <div className="ds-journey-step-page">
        <EmptyState
          icon={
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
          title="Checked-out Successfully!"
          description="Thank you for visiting."
        />

        <div className="ds-card ds-detail-section">
          <div className="ds-detail-grid">
            <div className="ds-detail-grid__item">
              <span className="ds-detail-grid__label">To Meet</span>
              <span className="ds-detail-grid__value">Rahul Mehta</span>
            </div>
            <div className="ds-detail-grid__item">
              <span className="ds-detail-grid__label">Department</span>
              <span className="ds-detail-grid__value">Production Dept.</span>
            </div>
            <div className="ds-detail-grid__item">
              <span className="ds-detail-grid__label">Check-out Time</span>
              <span className="ds-detail-grid__value">23 Jul 2026, 05:30 PM</span>
            </div>
            <div className="ds-detail-grid__item">
              <span className="ds-detail-grid__label">Total Duration</span>
              <span className="ds-detail-grid__value">08:15 Hrs.</span>
            </div>
          </div>
        </div>

        <div className="ds-detail-footer">
          <button type="button" className="ds-btn-primary" onClick={() => navigate("/my-pass")}>
            View Gate Pass
          </button>
          <button type="button" className="ds-btn-secondary" onClick={() => navigate("/")}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ds-journey-step-page">
      <CheckoutConfirmationCard
        hostName="Rahul Mehta"
        department="Production Dept."
        checkInTime="23 Jul 2026, 09:15 AM"
        expectedCheckout="05:30 PM"
        expectedDuration="08:15 Hrs"
        busy={busy}
        onConfirmCheckout={() => void onCheckout()}
        onCancel={() => navigate(-1)}
      />
      {error ? <p className="ds-auth-error">{error}</p> : null}
    </div>
  );
}
