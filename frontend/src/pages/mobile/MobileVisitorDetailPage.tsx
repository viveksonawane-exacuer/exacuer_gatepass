import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { frappeGetList, visitorApi } from "@/api/vms";
import { PhotoPreviewModal } from "@/components/common/PhotoPreviewModal";
import { ClickablePhotoPreview } from "@/components/ui/ClickablePhotoPreview";
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

  const statusToneClass = (() => {
    if (status === "Checked In") return "is-blue";
    if (status === "Meeting Done") return "is-purple";
    if (status === "Approved") return "is-green";
    if (status === "Pending Approval" || status === "Pending") return "is-orange";
    if (status === "Checked Out") return "is-slate";
    if (status === "Rejected") return "is-red";
    return "is-slate";
  })();

  return (
    <div className="vm-visitor-detail-page vm-ios-theme">
      {loading ? <p className="vm-empty-hint">Loading visitor profile...</p> : null}
      {error ? <p className="login-error" style={{ textAlign: "center" }}>{error}</p> : null}

      {!loading && visitor ? (
        <main className="vm-detail-container">
          {/* Header Profile Glass Card */}
          <div className="vm-visitor-hero-card">
            <div className="vm-hero-top-row">
              <span className="vm-hero-pass-code">{visitor.name}</span>
              <span className={`vm-hero-status-pill ${statusToneClass}`}>
                ● {translateVisitorStatus(lang, status, { short: true })}
              </span>
            </div>

            <div className="vm-hero-profile-row">
              <ClickablePhotoPreview
                src={visitor.photo}
                name={displayName}
                emptyLabel="No photo"
                alt={`${displayName} photo`}
                className="vm-hero-avatar-frame"
                onPreview={setPreviewSrc}
              />
              <div className="vm-hero-profile-info">
                <h1 className="vm-hero-visitor-name">{displayName}</h1>
                <p className="vm-hero-visitor-sub">
                  {visitor.visitor_company || "Individual Guest"} {visitor.visitor_location ? `• ${visitor.visitor_location}` : ""}
                </p>
                {visitor.mobile && (
                  <a href={`tel:${visitor.mobile}`} className="vm-hero-phone-link">
                    📞 {visitor.mobile}
                  </a>
                )}
              </div>
            </div>

            {/* Quick Action Pills */}
            <div className="vm-hero-quick-actions">
              {visitor.mobile && (
                <a href={`tel:${visitor.mobile}`} className="vm-hero-action-btn">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <span>Call Visitor</span>
                </a>
              )}
              {visitor.email && (
                <a href={`mailto:${visitor.email}`} className="vm-hero-action-btn">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  <span>Email</span>
                </a>
              )}
              <button
                type="button"
                className="vm-hero-action-btn is-pass"
                onClick={() => setPassModalOpen(true)}
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>View Gate Pass</span>
              </button>
            </div>
          </div>

          {/* 2-Column Visit Information Grid Card */}
          <div className="vm-overview-card vm-detail-section-card">
            <div className="vm-detail-sec-head">
              <span className="vm-detail-sec-icon is-purple">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
              </span>
              <h2 className="vm-detail-sec-title">Visit Details</h2>
            </div>

            <div className="vm-detail-2col-grid">
              <div className="vm-detail-item">
                <span className="vm-dlabel">Host Person</span>
                <strong className="vm-dvalue">{hostName}</strong>
              </div>
              <div className="vm-detail-item">
                <span className="vm-dlabel">Visit Purpose</span>
                <strong className="vm-dvalue">{visitor.visit_purpose_type || "—"}</strong>
              </div>
              <div className="vm-detail-item">
                <span className="vm-dlabel">Floor / Department</span>
                <strong className="vm-dvalue">{visitor.floor || "—"}</strong>
              </div>
              <div className="vm-detail-item">
                <span className="vm-dlabel">Total Visitors</span>
                <strong className="vm-dvalue">{visitorCount}</strong>
              </div>
              <div className="vm-detail-item">
                <span className="vm-dlabel">Company</span>
                <strong className="vm-dvalue">{visitor.visitor_company || "—"}</strong>
              </div>
              <div className="vm-detail-item">
                <span className="vm-dlabel">Location / City</span>
                <strong className="vm-dvalue">{visitor.visitor_location || "—"}</strong>
              </div>
              {visitor.vehicle_number && (
                <div className="vm-detail-item">
                  <span className="vm-dlabel">Vehicle Number</span>
                  <strong className="vm-dvalue">{visitor.vehicle_number}</strong>
                </div>
              )}
              {visitor.id_proof_type && (
                <div className="vm-detail-item">
                  <span className="vm-dlabel">ID Proof Type</span>
                  <strong className="vm-dvalue">{visitor.id_proof_type}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Visit Stage Progress Card */}
          <div className="vm-overview-card vm-detail-section-card">
            <div className="vm-detail-sec-head">
              <span className="vm-detail-sec-icon is-blue">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </span>
              <h2 className="vm-detail-sec-title">Visit Timeline & Journey</h2>
            </div>
            <VisitorStageTimeline visitor={visitor} />
          </div>

          {/* Multi-Person Guests List if any */}
          {showMultiPersonRemark && (
            <div className="vm-overview-card vm-detail-section-card">
              <div className="vm-detail-sec-head">
                <span className="vm-detail-sec-icon is-orange">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </span>
                <h2 className="vm-detail-sec-title">Accompanying Guests</h2>
              </div>
              <div className="vm-guests-pill-list">
                <div className="vm-guest-pill-item is-primary">
                  <strong>1. {displayName}</strong>
                  <span>Primary Guest</span>
                </div>
                {additionalGuests.map((guest, idx) => (
                  <div key={idx} className="vm-guest-pill-item">
                    <strong>{idx + 2}. {guest.name}</strong>
                    {guest.mobile && <span>{guest.mobile}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Operations & Verification Log */}
          <div className="vm-overview-card vm-detail-section-card">
            <div className="vm-detail-sec-head">
              <span className="vm-detail-sec-icon is-slate">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </span>
              <h2 className="vm-detail-sec-title">Gate Operations & Security</h2>
            </div>
            <div className="vm-detail-2col-grid">
              <div className="vm-detail-item">
                <span className="vm-dlabel">Gate Operator</span>
                <strong className="vm-dvalue">{gateOperator || "—"}</strong>
              </div>
              <div className="vm-detail-item">
                <span className="vm-dlabel">Exit Verified By</span>
                <strong className="vm-dvalue">{exitVerifiedBy || "—"}</strong>
              </div>
              <div className="vm-detail-item">
                <span className="vm-dlabel">Meeting Finished By</span>
                <strong className="vm-dvalue">{hostCompleted || "—"}</strong>
              </div>
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div className="vm-detail-bottom-actions">
            {canCheckout && (
              <button
                type="button"
                className="vm-btn-primary vm-btn-full"
                onClick={() => navigate(`/checkout/${encodeURIComponent(visitor.name || routeName)}`)}
              >
                Proceed to Check-out
              </button>
            )}
            <button
              type="button"
              className="vm-btn-outline vm-btn-full"
              onClick={() => navigate(-1)}
            >
              Back
            </button>
          </div>
        </main>
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
