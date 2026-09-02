import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { securityApi } from "@/api/vms";
import { useAuth } from "@/context/AuthContext";
import { extractError } from "@/lib/format";
import { canPerformCheckout } from "@/lib/roles";
import { VisitorGatePassCard } from "@/components/pass/VisitorGatePassCard";
import { usePageChrome } from "@/context/PageChromeContext";

export function MobileScanPage() {
  const { user } = useAuth();
  const showCheckout = canPerformCheckout(user);

  usePageChrome({
    title: "Scan QR",
    subtitle: "Gate verification",
    showBack: true,
    backTo: "/",
    showNotification: false,
    showProfile: false,
  });

  const [token, setToken] = useState("");
  const [remarks, setRemarks] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null);

  async function onScan(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    setPreview(null);
    const cleaned = token.trim().replace(/^.*\/pass\//, "").replace(/\?.*$/, "");
    try {
      const res = (await securityApi.scanQr(cleaned)) as Record<string, unknown>;
      setToken(cleaned);
      setPreview(res);
      setMessage(String(res.message || (res.valid ? "QR valid" : "QR invalid")));
    } catch (err: unknown) {
      setError(extractError(err, "Scan failed"));
    } finally {
      setBusy(false);
    }
  }

  async function checkIn() {
    setBusy(true);
    setError(null);
    try {
      const res = (await securityApi.checkInByToken(token.trim())) as { message?: string };
      setMessage(res.message || "Checked in");
      setPreview(null);
    } catch (err: unknown) {
      setError(extractError(err, "Check-in failed"));
    } finally {
      setBusy(false);
    }
  }

  async function checkOut() {
    setBusy(true);
    setError(null);
    try {
      const res = (await securityApi.checkOutByToken(token.trim(), remarks || undefined)) as {
        message?: string;
      };
      setMessage(res.message || "Checked out");
      setPreview(null);
    } catch (err: unknown) {
      setError(extractError(err, "Check-out failed"));
    } finally {
      setBusy(false);
    }
  }

  const pass = (preview?.pass || null) as Record<string, unknown> | null;
  const entryName = String(pass?.visitor_entry || token || "");

  return (
    <section className="ds-desk-page">
      <p className="ds-desk-page__intro">Validate a gate pass, then check in or check out at the desk.</p>

      <form className="ds-form" style={{ padding: 0 }} onSubmit={(e) => void onScan(e)}>
        <div className="ds-card ds-form-section">
          <div className="ds-form-field ds-form-field--full">
            <label className="ds-form-field__label">Pass token / QR</label>
            <input
              className="ds-input"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Pass no. or /vms/pass/…"
              required
            />
          </div>
          <div className="ds-form-field ds-form-field--full">
            <label className="ds-form-field__label">Checkout remarks</label>
            <input
              className="ds-input"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <button type="submit" className="ds-btn-primary" disabled={busy}>
            {busy ? "Scanning…" : "Validate QR"}
          </button>
        </div>
      </form>

      {message ? <p className="ds-auth-msg">{message}</p> : null}
      {error ? <p className="ds-auth-error">{error}</p> : null}

      {pass ? (
        <>
          <VisitorGatePassCard
            passCode={entryName || "—"}
            visitorName={String(pass.full_name || "Visitor")}
            company={String(pass.company || "Exacuer Global")}
            visitorCompany={String(pass.visitor_company || "—")}
            hostName={String(pass.person_to_meet_name || pass.host_name || "—")}
            floor={String(pass.floor || "—")}
            status={String(pass.status || "Approved")}
            checkInLocation="Main Gate"
            hideActions
          />
          <div className="ds-gatepass-actions">
            <button type="button" className="ds-gatepass-action-btn is-primary" disabled={busy} onClick={() => void checkIn()}>
              Check in
            </button>
            {showCheckout ? (
              <button type="button" className="ds-gatepass-action-btn" disabled={busy} onClick={() => void checkOut()}>
                Check out
              </button>
            ) : null}
          </div>
          {entryName ? (
            <Link className="ds-drilldown-btn" to={`/pass/${encodeURIComponent(entryName)}`}>
              Open full pass ›
            </Link>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
