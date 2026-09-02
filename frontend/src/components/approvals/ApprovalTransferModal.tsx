import { useEffect, useMemo, useState } from "react";
import { approvalApi, settingsApi, type VisitorListRow } from "@/api/vms";
import { SearchSelect } from "@/components/ui/SearchSelect";
import { ConfirmModal } from "@/components/design-system/ConfirmModal";
import { StatusPill } from "@/components/design-system/StatusPill";
import { initials } from "@/lib/format";

type Props = {
  visitor: VisitorListRow | null;
  open: boolean;
  busy?: boolean;
  onClose: () => void;
  onDone: (visitor: VisitorListRow) => void;
};

export function ApprovalTransferModal({ visitor, open, busy = false, onClose, onDone }: Props) {
  const [remarks, setRemarks] = useState("");
  const [transferToUser, setTransferToUser] = useState("");
  const [hosts, setHosts] = useState<Array<{ value: string; label: string; email?: string }>>([]);
  const [loadingHosts, setLoadingHosts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !visitor) return;
    setRemarks("");
    setTransferToUser("");
    setError(null);
    setSubmitting(false);
    setLoadingHosts(true);
    let cancelled = false;
    void settingsApi
      .getHosts()
      .then((list) => {
        if (!cancelled) setHosts(list || []);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load people");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingHosts(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, visitor]);

  const transferHostOptions = useMemo(
    () =>
      hosts
        .filter((h) => {
          const current = (visitor?.person_to_meet || "").trim();
          if (!current) return true;
          return h.value !== current && (h.email || "") !== current;
        })
        .map((h) => ({
          value: h.value,
          label: h.label,
          sublabel: h.email || h.value,
        })),
    [hosts, visitor?.person_to_meet],
  );

  if (!visitor) return null;

  const visitorName = visitor.full_name || visitor.name;
  const isBusy = busy || submitting;

  async function handleTransfer() {
    if (!visitor) return;
    if (!transferToUser) {
      setError("Select a person to transfer to.");
      return;
    }
    if (!remarks.trim()) {
      setError("Reason / remarks are required to transfer.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await approvalApi.transfer(visitor.name, transferToUser, remarks.trim());
      onDone(visitor);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transfer failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      showClose
      title="Transfer Visitor"
      subtitle={
        <>
          Reassign <strong>{visitorName}</strong> to another host.
        </>
      }
      titleId="vm-approval-transfer-title"
      icon={
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M16 3h5v5M8 21H3v-5M21 3l-7 7M3 21l7-7" />
        </svg>
      }
      iconTone="info"
      actionsClassName="is-row"
      footer={
        <>
          <button type="button" className="ds-btn-secondary" disabled={isBusy} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="ds-btn-primary"
            disabled={isBusy || loadingHosts}
            onClick={() => void handleTransfer()}
          >
            {isBusy ? "Transferring…" : "Transfer"}
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
          <label className="ds-form-field__label" htmlFor="approval-transfer-host">
            Transfer to
          </label>
          <SearchSelect
            id="approval-transfer-host"
            value={transferToUser}
            options={transferHostOptions}
            onChange={(val) => {
              setTransferToUser(val);
              setError(null);
            }}
            placeholder="Select"
            searchPlaceholder="Search person to meet"
            loading={loadingHosts}
            loadingText="Loading hosts…"
            required
            allowEmpty
            disabled={isBusy}
            menuPlacement="top"
            aria-label="Transfer to"
          />
        </div>

        <div className="ds-form-field">
          <label className="ds-form-field__label" htmlFor="approval-transfer-remarks">
            Reason / Remarks (required)
          </label>
          <textarea
            id="approval-transfer-remarks"
            className="vm-input-field vm-sheet-textarea"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Why are you transferring?"
            rows={2}
            disabled={isBusy}
          />
          {error ? <p className="ds-auth-error">{error}</p> : null}
        </div>
      </div>
    </ConfirmModal>
  );
}
