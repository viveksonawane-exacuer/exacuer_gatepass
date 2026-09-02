import { createPortal } from "react-dom";
import type { ReactNode } from "react";

type SheetModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  ariaLabel?: string;
};

export function SheetModal({ open, onClose, title, icon, children, ariaLabel }: SheetModalProps) {
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="ds-sheet-modal-root" role="dialog" aria-modal="true" aria-label={ariaLabel || title}>
      <div className="ds-sheet-modal-backdrop" onClick={onClose} aria-hidden />
      <div className="ds-sheet-modal">
        <div className="ds-sheet-modal__header">
          <div className="ds-sheet-modal__title">
            {icon}
            <strong>{title}</strong>
          </div>
          <button type="button" className="ds-sheet-modal__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
