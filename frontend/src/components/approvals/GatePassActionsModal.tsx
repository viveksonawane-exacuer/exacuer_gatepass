import { useState } from "react";
import type { VisitorListRow } from "@/api/vms";
import { ConfirmModal } from "@/components/design-system/ConfirmModal";
import { StatusPill } from "@/components/design-system/StatusPill";
import { initials } from "@/lib/format";

type Props = {
  visitor: VisitorListRow | null;
  open: boolean;
  busy?: boolean;
  onClose: () => void;
  onDownload: (visitor: VisitorListRow) => Promise<void> | void;
  onSend: (visitor: VisitorListRow) => Promise<void> | void;
};

export function GatePassActionsModal({
  visitor,
  open,
  busy = false,
  onClose,
  onDownload,
  onSend,
}: Props) {
  const [busyDownload, setBusyDownload] = useState(false);
  const [busySend, setBusySend] = useState(false);

  if (!visitor) return null;

  const visitorName = visitor.full_name || visitor.name;
  const mobile = visitor.mobile || "—";
  const locked = busy || busyDownload || busySend;

  async function handleDownload() {
    if (!visitor) return;
    setBusyDownload(true);
    try {
      await onDownload(visitor);
    } finally {
      setBusyDownload(false);
    }
  }

  async function handleSend() {
    if (!visitor) return;
    setBusySend(true);
    try {
      await onSend(visitor);
    } finally {
      setBusySend(false);
    }
  }

  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      showClose
      closeOnBackdrop
      title="Generate Gate Pass"
      subtitle={
        <>
          Download or send the gate pass for <strong>{visitorName}</strong>.
        </>
      }
      titleId="vm-gate-pass-title"
      icon={
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M7 9h4M7 13h10" />
          <circle cx="16.5" cy="9.5" r="1.5" />
        </svg>
      }
      iconTone="success"
      actionsClassName="is-row"
      footer={
        <>
          <button type="button" className="ds-btn-secondary" disabled={locked} onClick={() => void handleDownload()}>
            {busyDownload ? "Downloading…" : "Download"}
          </button>
          <button type="button" className="ds-btn-primary" disabled={locked} onClick={() => void handleSend()}>
            {busySend ? "Sending…" : "Send"}
          </button>
        </>
      }
    >
      <div className="ds-confirm-modal__body">
        <div className="ds-confirm-modal__visitor">
          <div className="ds-schedule-card__avatar">{initials(visitorName)}</div>
          <div className="ds-confirm-modal__visitor-copy">
            <strong>{visitorName}</strong>
            <span>Mobile: {mobile}</span>
          </div>
          <StatusPill label="Approved" variant="approved" />
        </div>
      </div>
    </ConfirmModal>
  );
}
