import { createPortal } from "react-dom";
import type { ReactNode } from "react";

type ConfirmModalProps = {
  open: boolean;
  onClose?: () => void;
  title: string;
  subtitle?: ReactNode;
  icon?: ReactNode;
  iconTone?: "default" | "danger" | "success" | "info";
  children?: ReactNode;
  footer: ReactNode;
  closeOnBackdrop?: boolean;
  showClose?: boolean;
  titleId?: string;
  actionsClassName?: string;
};

export function ConfirmModal({
  open,
  onClose,
  title,
  subtitle,
  icon,
  iconTone = "default",
  children,
  footer,
  closeOnBackdrop = true,
  showClose = false,
  titleId,
  actionsClassName,
}: ConfirmModalProps) {
  if (!open || typeof document === "undefined") return null;

  const resolvedTitleId = titleId || "ds-confirm-modal-title";

  return createPortal(
    <div className="ds-confirm-modal-root" role="dialog" aria-modal="true" aria-labelledby={resolvedTitleId}>
      <button
        type="button"
        className="ds-confirm-modal-backdrop"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-label={closeOnBackdrop ? "Close dialog" : undefined}
      />

      <div className="ds-confirm-modal-card">
        {showClose && onClose ? (
          <button type="button" className="ds-confirm-modal__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        ) : null}

        <div className="ds-confirm-modal__head">
          {icon ? (
            <div className={`ds-confirm-modal__icon is-${iconTone}`} aria-hidden>
              {icon}
            </div>
          ) : null}
          <h2 id={resolvedTitleId} className="ds-confirm-modal__title">
            {title}
          </h2>
          {subtitle ? <p className="ds-confirm-modal__sub">{subtitle}</p> : null}
        </div>

        {children}

        <div className={`ds-confirm-modal__actions${actionsClassName ? ` ${actionsClassName}` : ""}`}>{footer}</div>
      </div>
    </div>,
    document.body,
  );
}
