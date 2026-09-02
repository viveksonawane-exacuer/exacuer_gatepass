import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { passApi, type PublicPassResult } from "@/api/vms";
import { formatTime } from "@/lib/format";
import { VisitorGatePassCard } from "@/components/pass/VisitorGatePassCard";
import { EmptyState } from "@/components/design-system/EmptyState";

export function PublicPassPage() {
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState<PublicPassResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await passApi.getPublicPass(token);
        if (!cancelled) setResult(data);
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load pass");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (token) void load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) {
    return (
      <div className="pass-public">
        <EmptyState title="Loading gate pass…" />
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="pass-public">
        <div className="ds-card" style={{ maxWidth: 420, padding: 24, textAlign: "center" }}>
          <p className="ds-auth-error">{error || "Pass not found"}</p>
          <button type="button" className="ds-btn-secondary" onClick={() => navigate("/")}>
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  const pass = result.pass;
  const qrTarget = pass?.pass_url || `${window.location.origin}/vms/pass/${token}`;
  const noticeMsg = result.valid
    ? undefined
    : result.reason || `Pass not valid for status: ${pass?.status || "Unknown"}`;

  return (
    <div className="pass-public">
      <VisitorGatePassCard
        passCode={pass?.visitor_entry || token}
        visitorName={pass?.full_name || "Visitor"}
        company={pass?.company || "—"}
        visitorCompany={pass?.visitor_company || "—"}
        hostName={pass?.person_to_meet_name || pass?.host_name || "Administrator"}
        floor={pass?.floor || "—"}
        status={pass?.status || (result.valid ? "Approved" : "Invalid")}
        noticeMessage={noticeMsg}
        validUntil={pass?.qr_expires_on ? formatTime(pass.qr_expires_on) : "11:30 AM"}
        photoUrl={pass?.photo}
        qrPayload={qrTarget}
        onDownload={() => window.print()}
      />
    </div>
  );
}
