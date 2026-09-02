import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { frappeGetList, visitorApi } from "@/api/vms";
import { PhotoPreviewModal } from "@/components/common/PhotoPreviewModal";
import { DetailGrid, DetailHero, DetailSection } from "@/components/design-system/DetailHero";
import { EmptyState } from "@/components/design-system/EmptyState";
import { extractError } from "@/lib/format";
import { parseAdditionalGuestsFromRemarks } from "@/lib/additionalGuests";
import { usePageChrome } from "@/context/PageChromeContext";
import { useAuth } from "@/context/AuthContext";
import { canPerformCheckout } from "@/lib/roles";
import { VisitorStageTimeline } from "@/components/visitors/VisitorStageTimeline";
import { translateVisitorStatus } from "@/i18n/uiChrome";
import { useAppLanguage } from "@/context/AppLanguageContext";
import { localizePersonName } from "@/lib/transliterate";
import { usePageRefresh } from "@/hooks/usePageRefresh";
import { ViewGatePassModal } from "@/components/approvals/ViewGatePassModal";
import type { VisitorListRow } from "@/api/vms";

type VisitorDoc = {
  name?: string;
  full_name?: string;
  mobile?: string;
  photo?: string;
  email?: string;
  status?: string;
  visitor_company?: string;
  visitor_location?: string;
  vehicle_number?: string;
  id_proof_type?: string;
  person_to_meet?: string;
  person_to_meet_name?: string;
  visit_purpose_type?: string;
  floor?: string;
  check_in?: string;
  checked_in_on?: string;
  check_out?: string;
  checked_out_on?: string;
  approved_on?: string;
  rejected_on?: string;
  checked_in_by?: string;
  checked_out_by?: string;
  meeting_done_on?: string;
  creation?: string;
  modified?: string;
  number_of_visitors?: number | string;
  approval_remarks?: string;
};

type UserRow = { name: string; full_name?: string };

async function resolveUserFullName(userId?: string | null): Promise<string | undefined> {
  if (!userId) return undefined;
  try {
    const rows = await frappeGetList<UserRow>({
      doctype: "User",
      fields: ["name", "full_name"],
      filters: { name: userId },
      limit_page_length: 1,
    });
    const row = rows[0];
    return row?.full_name || row?.name || userId;
  } catch {
    return userId;
  }
}

export function MobileVisitorDetailPage() {
  const { name: routeName = "" } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lang } = useAppLanguage();
  const showCheckout = canPerformCheckout(user);
  const [visitor, setVisitor] = useState<VisitorDoc | null>(null);
  const [gateOperator, setGateOperator] = useState<string | undefined>();
  const [exitVerifiedBy, setExitVerifiedBy] = useState<string | undefined>();
  const [hostCompleted, setHostCompleted] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [passModalOpen, setPassModalOpen] = useState(false);

  usePageChrome({
    title: "Visitor Details",
    subtitle: routeName || "Gate Pass Record",
    showBack: true,
    showNotification: false,
    showProfile: false,
  });

  const load = useCallback(async () => {
    if (!routeName) return;
    setLoading(true);
    setError(null);
    try {
      const doc = (await visitorApi.get(routeName)) as VisitorDoc;
      setVisitor(doc);

      const [inBy, outBy] = await Promise.all([
        resolveUserFullName(doc.checked_in_by),
        resolveUserFullName(doc.checked_out_by),
      ]);
      setGateOperator(inBy);
      setExitVerifiedBy(outBy);

      if (doc.meeting_done_on) {
        setHostCompleted(
          doc.person_to_meet_name ||
            (await resolveUserFullName(doc.person_to_meet)) ||
            undefined,
        );
      } else {
        setHostCompleted(undefined);
      }
    } catch (err: unknown) {
      setError(extractError(err, "Visitor not found"));
    } finally {
      setLoading(false);
    }
  }, [routeName]);

  usePageRefresh(load);

  useEffect(() => {
    void load();
  }, [load]);

  const status = visitor?.status || "";
  const canCheckout = showCheckout && status === "Meeting Done";
  const displayName = localizePersonName(visitor?.full_name || visitor?.name || "", lang);
  const hostName = localizePersonName(visitor?.person_to_meet_name || "—", lang);
  const visitorCount = visitor?.number_of_visitors ? Number(visitor.number_of_visitors) : 1;
  const additionalGuests = useMemo(
    () => parseAdditionalGuestsFromRemarks(visitor?.approval_remarks),
    [visitor?.approval_remarks],
  );
  const showMultiPersonRemark = visitorCount > 1 || additionalGuests.length > 0;

  const subtitleParts = [
    visitor?.visitor_company || "Individual Guest",
    visitor?.visitor_location || null,
  ].filter(Boolean);

  const visitDetails = [
    { label: "Host Person", value: hostName },
    { label: "Visit Purpose", value: visitor?.visit_purpose_type || "—" },
    { label: "Floor / Department", value: visitor?.floor || "—" },
    { label: "Total Visitors", value: visitorCount },
    { label: "Company", value: visitor?.visitor_company || "—" },
    { label: "Location / City", value: visitor?.visitor_location || "—" },
    ...(visitor?.vehicle_number
      ? [{ label: "Vehicle Number", value: visitor.vehicle_number }]
      : []),
    ...(visitor?.id_proof_type
      ? [{ label: "ID Proof Type", value: visitor.id_proof_type }]
      : []),
  ];

  const opsDetails = [
    { label: "Gate Operator", value: gateOperator || "—" },
    { label: "Exit Verified By", value: exitVerifiedBy || "—" },
    { label: "Meeting Finished By", value: hostCompleted || "—" },
  ];

  return (
    <div className="vm-visitor-detail-page">
      {loading ? (
        <div className="ds-detail-page">
          <div className="ds-skeleton" style={{ height: 180, borderRadius: 24 }} />
          <div className="ds-skeleton" style={{ height: 140, borderRadius: 24 }} />
        </div>
      ) : null}

      {error ? (
        <p className="login-error" style={{ textAlign: "center", padding: "0 1rem" }}>
          {error}
        </p>
      ) : null}

      {!loading && visitor ? (
        <main className="ds-detail-page">
          <DetailHero
            entryId={visitor.name}
            name={displayName}
            status={status}
            statusLabel={translateVisitorStatus(lang, status, { short: true })}
            subtitle={subtitleParts.join(" · ")}
            photo={visitor.photo}
            phone={visitor.mobile}
            email={visitor.email}
            actions={
              <>
                {visitor.mobile ? (
                  <a href={`tel:${visitor.mobile}`} className="ds-detail-action-chip">
                    Call visitor
                  </a>
                ) : null}
                {visitor.email ? (
                  <a href={`mailto:${visitor.email}`} className="ds-detail-action-chip">
                    Email
                  </a>
                ) : null}
                <button
                  type="button"
                  className="ds-detail-action-chip ds-detail-action-chip--primary"
                  onClick={() => setPassModalOpen(true)}
                >
                  View gate pass
                </button>
              </>
            }
          />

          <DetailSection
            title="Visit Details"
            icon={
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
              </svg>
            }
          >
            <DetailGrid items={visitDetails} />
          </DetailSection>

          <DetailSection
            title="Visit Timeline"
            icon={
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            }
          >
            <VisitorStageTimeline visitor={visitor} />
          </DetailSection>

          {showMultiPersonRemark ? (
            <DetailSection
              title="Accompanying Guests"
              icon={
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
              }
            >
              <div className="ds-guest-list">
                <div className="ds-guest-chip is-primary">
                  <strong>1. {displayName}</strong>
                  <span>Primary guest</span>
                </div>
                {additionalGuests.map((guest, idx) => (
                  <div key={idx} className="ds-guest-chip">
                    <strong>
                      {idx + 2}. {guest.name}
                    </strong>
                    {guest.mobile ? <span>{guest.mobile}</span> : null}
                  </div>
                ))}
              </div>
            </DetailSection>
          ) : null}

          <DetailSection
            title="Gate Operations"
            icon={
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            }
          >
            <DetailGrid items={opsDetails} />
          </DetailSection>

          <div className="ds-detail-footer">
            {canCheckout ? (
              <button
                type="button"
                className="ds-btn-primary"
                style={{ width: "100%" }}
                onClick={() => navigate(`/checkout/${encodeURIComponent(visitor.name || routeName)}`)}
              >
                Proceed to check-out
              </button>
            ) : null}
            <button type="button" className="ds-btn-secondary" style={{ width: "100%" }} onClick={() => navigate(-1)}>
              Back
            </button>
          </div>
        </main>
      ) : null}

      {!loading && !visitor && !error ? (
        <div className="ds-detail-page">
          <div className="ds-card">
            <EmptyState title="Visitor not found" description="This record may have been removed or you may not have access." />
          </div>
        </div>
      ) : null}

      <PhotoPreviewModal
        src={previewSrc}
        alt={`${displayName} photo`}
        onClose={() => setPreviewSrc(null)}
      />

      <ViewGatePassModal
        open={passModalOpen}
        visitor={visitor as unknown as VisitorListRow}
        onClose={() => setPassModalOpen(false)}
      />
    </div>
  );
}
