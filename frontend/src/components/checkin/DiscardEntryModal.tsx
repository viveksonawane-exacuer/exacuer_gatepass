import { ConfirmModal } from "@/components/design-system/ConfirmModal";

type Props = {
  open: boolean;
  onStay: () => void;
  onLeave: () => void;
};

/** Confirm leaving Add Entry mid-flow. */
export function DiscardEntryModal({ open, onStay, onLeave }: Props) {
  return (
    <ConfirmModal
      open={open}
      onClose={onStay}
      title="Remove this entry?"
      subtitle="You have an unfinished visitor entry. Leave this screen and discard the details you entered?"
      titleId="vm-discard-entry-title"
      icon={
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.4">
          <path d="M3 6h18" />
          <path d="M8 6V4h8v2" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
          <path d="M10 11v6M14 11v6" />
        </svg>
      }
      iconTone="danger"
      footer={
        <>
          <button type="button" className="ds-btn-primary" style={{ background: "var(--vms-danger)", borderColor: "var(--vms-danger)" }} onClick={onLeave}>
            Yes, remove entry
          </button>
          <button type="button" className="ds-btn-secondary" onClick={onStay}>
            Keep editing
          </button>
        </>
      }
    />
  );
}
