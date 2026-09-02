import { useState } from "react";
import type { VisitorListRow } from "@/api/vms";
import { ConfirmModal } from "@/components/design-system/ConfirmModal";
import { StatusPill } from "@/components/design-system/StatusPill";
import { initials } from "@/lib/format";
import { formatStageTimestamp, getCurrentStageTimestamp } from "@/lib/visitStages";

type Props = {
  visitor: VisitorListRow | null;
  open: boolean;
  onClose: () => void;
  onGeneratePass: (visitor: VisitorListRow) => Promise<void> | void;
  onSendPassToMobile: (visitor: VisitorListRow) => Promise<void> | void;
};

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export function VisitorCheckInConfirmModal({
  visitor,
  open,
  onClose,
  onGeneratePass,
  onSendPassToMobile,
}: Props) {
  const [busyGen, setBusyGen] = useState(false);
  const [busySend, setBusySend] = useState(false);

  if (!visitor) return null;

  const visitorName = visitor.full_name || visitor.name;
  const mobile = visitor.mobile || "—";
  const host = visitor.person_to_meet_name || "—";
  const purpose = visitor.visit_purpose_type || "—";
  const time = formatStageTimestamp(
    visitor.approved_on || getCurrentStageTimestamp(visitor),
    true,
  );

  async function handleGenerate() {
    if (!visitor) return;
    setBusyGen(true);
    try {
      await onGeneratePass(visitor);
    } finally {
      setBusyGen(false);
    }
  }

  async function handleSend() {
    if (!visitor) return;
    setBusySend(true);
    try {
      await onSendPassToMobile(visitor);
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
      title="Visitor Check-In Confirmed"
      subtitle={
        <>
          Check-in for <strong>{visitorName}</strong> has been successfully confirmed.
        </>
      }
      icon={
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      }
      iconTone="success"
      actionsClassName="is-stack"
      footer={
        <>
          <button
            type="button"
            className="ds-btn-primary"
            disabled={busyGen || busySend}
            onClick={() => void handleGenerate()}
          >
            {busyGen ? "Opening Gate Pass…" : "View Gate Pass"}
          </button>
          <button
            type="button"
            className="ds-btn-secondary"
            disabled={busyGen || busySend}
            onClick={() => void handleSend()}
          >
            {busySend ? "Sending Gate Pass…" : `Send Gate Pass to Visitor (${mobile})`}
          </button>
          <button type="button" className="ds-btn-link" onClick={onClose}>
            Done
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
          <StatusPill label="Confirmed" variant="checked-in" />
        </div>

        <div className="ds-confirm-modal__detail-grid">
          <div className="ds-confirm-modal__detail-item">
            <span className="ds-confirm-modal__detail-label">
              <IconUser />
              Host
            </span>
            <strong className="ds-confirm-modal__detail-value">{host}</strong>
          </div>
          <div className="ds-confirm-modal__detail-item">
            <span className="ds-confirm-modal__detail-label">
              <IconCalendar />
              Purpose
            </span>
            <strong className="ds-confirm-modal__detail-value">{purpose}</strong>
          </div>
          <div className="ds-confirm-modal__detail-item" style={{ gridColumn: "1 / -1" }}>
            <span className="ds-confirm-modal__detail-label">
              <IconClock />
              Time
            </span>
            <strong className="ds-confirm-modal__detail-value">{time}</strong>
          </div>
        </div>
      </div>
    </ConfirmModal>
  );
}
