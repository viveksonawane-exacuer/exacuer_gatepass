import { ConfirmModal } from "@/components/design-system/ConfirmModal";

type Props = {
  open: boolean;
  onContinue: () => void;
  onStartNew: () => void;
};

/** After refresh: keep unfinished entry or clear it. */
export function ResumeEntryModal({ open, onContinue, onStartNew }: Props) {
  return (
    <ConfirmModal
      open={open}
      onClose={onContinue}
      title="Continue this entry?"
      subtitle="Your visitor details were saved when the page refreshed. Keep editing, or clear and start a new entry?"
      titleId="vm-resume-entry-title"
      icon={
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.4">
          <path d="M12 3v10" />
          <path d="M8 9l4 4 4-4" />
          <path d="M5 17h14" />
          <path d="M7 21h10" />
        </svg>
      }
      iconTone="info"
      footer={
        <>
          <button type="button" className="ds-btn-primary" onClick={onContinue}>
            Keep editing
          </button>
          <button type="button" className="ds-btn-secondary" onClick={onStartNew}>
            Clear and start new
          </button>
        </>
      }
    />
  );
}
