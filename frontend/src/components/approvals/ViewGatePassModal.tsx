import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { apiClient } from "@/api/client";
import { passApi, type VisitorListRow } from "@/api/vms";
import { VisitorGatePassCard } from "@/components/pass/VisitorGatePassCard";
import { formatTime } from "@/lib/format";
import { parseAdditionalGuestsFromRemarks } from "@/lib/additionalGuests";

type PassPayload = {
  visitor_entry?: string;
  name?: string;
  full_name?: string;
  photo?: string;
  mobile?: string;
  company?: string;
  visitor_company?: string;
  person_to_meet_name?: string;
  host_name?: string;
  floor?: string;
  status?: string;
  qr_expires_on?: string;
  checked_in_on?: string;
  pass_url?: string;
  number_of_visitors?: number | string;
  approval_remarks?: string;
};

type Props = {
  visitor: VisitorListRow | null;
  open: boolean;
  onClose: () => void;
};

async function fetchDefaultCompany(): Promise<string> {
  try {
    const { data } = await apiClient.post(`/api/method/frappe.client.get_single_value`, {
      doctype: "Global Defaults",
      field: "default_company",
    });
    return String(data?.message || "").trim();
  } catch {
    return "";
  }
}

/**
 * Display-only gate pass popup.
 * Pass URL / QR must come from Python (`visitor_pass.get_pass` → `ve.generate_pass`).
 * React never invents pass_url.
 */
export function ViewGatePassModal({ visitor, open, onClose }: Props) {
  const [pass, setPass] = useState<PassPayload | null>(null);
  const [defaultCompany, setDefaultCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !visitor) {
      setPass(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    void Promise.all([passApi.get(visitor.name), fetchDefaultCompany()])
      .then(([data, companyFromDefaults]) => {
        if (cancelled) return;
        const payload = (data || {}) as PassPayload;
        if (!payload.pass_url) {
          setPass(null);
          setError("Gate pass not found. Pass is created by server when Visitor Entry is saved.");
          return;
        }
        setPass(payload);
        setDefaultCompany(companyFromDefaults);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setPass(null);
          setError(err instanceof Error ? err.message : "Could not load gate pass");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, visitor]);

  const additionalGuests = useMemo(
    () =>
      parseAdditionalGuestsFromRemarks(
        pass?.approval_remarks || visitor?.approval_remarks,
      ),
    [pass?.approval_remarks, visitor?.approval_remarks],
  );

  if (!open || !visitor) return null;

  const visitorName = pass?.full_name || visitor.full_name || visitor.name;
  const passCode = pass?.visitor_entry || pass?.name || visitor.name;
  const status = pass?.status || visitor.status || "—";
  const hostName = pass?.person_to_meet_name || pass?.host_name || visitor.person_to_meet_name || "—";
  const floor = pass?.floor || visitor.floor || "—";
  const company =
    (pass?.company || visitor.company || defaultCompany || "").trim() || "Exacuer Global";
  const visitorCompany =
    (pass?.visitor_company || visitor.visitor_company || "").trim() || "—";
  const passUrl = pass?.pass_url;
  const validUntil = pass?.qr_expires_on ? formatTime(pass.qr_expires_on) : undefined;
  const visitorCount = Number(
    pass?.number_of_visitors ?? visitor.number_of_visitors ?? 1,
  ) || 1;
  const gateReady = status === "Checked In" || status === "Meeting Done";
  const noticeMessage = gateReady
    ? undefined
    : status === "Approved"
      ? "Ready for gate — valid after check-in"
      : status
        ? `Pass status: ${status}`
        : undefined;

  const modalNode = (
    <div
      className="ds-gatepass-modal-root"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vm-view-gate-pass-title"
    >
      <button type="button" className="ds-gatepass-modal-backdrop ds-no-print" onClick={onClose} aria-label="Close modal" />

      <div className="ds-gatepass-modal-panel">
        <button
          type="button"
          className="ds-gatepass-modal-close ds-no-print"
          onClick={onClose}
          aria-label="Close gate pass"
        >
          ✕
        </button>

        {loading ? (
          <div className="ds-gatepass-loading">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="9" strokeDasharray="24 32" />
            </svg>
            <p>Loading digital pass…</p>
          </div>
        ) : null}

        {error && !loading ? (
          <div className="ds-gatepass-error">
            <p>{error}</p>
            <button type="button" className="ds-btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        ) : null}

        {!loading && !error && pass ? (
          <VisitorGatePassCard
            passCode={passCode}
            visitorName={visitorName}
            company={company}
            visitorCompany={visitorCompany}
            hostName={hostName}
            floor={floor}
            status={status}
            noticeMessage={noticeMessage}
            validUntil={validUntil}
            photoUrl={pass?.photo || visitor.photo}
            qrPayload={passUrl || `${window.location.origin}/vms/pass/${encodeURIComponent(passCode)}`}
            visitorCount={visitorCount}
            additionalGuests={additionalGuests}
            hideActions
          />
        ) : null}
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalNode, document.body) : modalNode;
}
