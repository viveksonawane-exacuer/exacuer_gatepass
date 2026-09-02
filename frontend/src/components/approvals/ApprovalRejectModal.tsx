import { useEffect, useState } from "react";
import { approvalApi, type VisitorListRow } from "@/api/vms";
import { initials } from "@/lib/format";
import { ConfirmModal } from "@/components/design-system/ConfirmModal";
import { StatusPill } from "@/components/design-system/StatusPill";

type Props = {
  visitor: VisitorListRow | null;
  open: boolean;
  busy?: boolean;
  onClose: () => void;
  onDone: (visitor: VisitorListRow, remarks: string) => void;
};

export function ApprovalRejectModal({ visitor, open, busy = false, onClose, onDone }: Props) {
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !visitor) return;
    setRemarks("");
    setError(null);
    setSubmitting(false);
  }, [open, visitor]);

  if (!visitor) return null;

  const visitorName = visitor.full_name || visitor.name;
  const isBusy = busy || submitting;

  async function handleReject() {
    if (!visitor) return;
    if (!remarks.trim()) {
      setError("Remarks are required to reject.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await approvalApi.reject(visitor.name, remarks.trim());
      onDone(visitor, remarks.trim());
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Reject failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      showClose
      title="Reject Visitor"
      subtitle={
        <>
          Add a reason for rejecting <strong>{visitorName}</strong>.
        </>
      }
      titleId="vm-approval-reject-title"
      icon={
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <circle cx="12" cy="12" r="9" />
          <path d="m15 9-6 6M9 9l6 6" />
        </svg>
      }
      iconTone="danger"
      footer={
        <>
          <button type="button" className="ds-btn-secondary" disabled={isBusy} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="ds-btn-primary"
            style={{ background: "var(--vms-danger)", borderColor: "var(--vms-danger)" }}
            disabled={isBusy}
            onClick={() => void handleReject()}
          >
            {isBusy ? "Rejecting…" : "Reject"}
          </button>
        </>
      }
    >
      <div className="ds-confirm-modal__body">
        <div className="ds-confirm-modal__visitor">
          <div className="ds-schedule-card__avatar">{initials(visitorName)}</div>
          <div className="ds-confirm-modal__visitor-copy">
            <strong>{visitorName}</strong>
            <span>{visitor.name}</span>
          </div>
          <StatusPill label="Pending" variant="pending" />
        </div>

        <div className="ds-form-field">
          <label className="ds-form-field__label" htmlFor="approval-reject-remarks">
            Remarks (required)
          </label>
          <textarea
            id="approval-reject-remarks"
            className="ds-input"
            style={{ minHeight: 88, paddingTop: 10, paddingBottom: 10 }}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Reason for rejection"
            rows={3}
            disabled={isBusy}
          />
          {error ? <p className="ds-auth-error">{error}</p> : null}
        </div>
      </div>
    </ConfirmModal>
  );
}
