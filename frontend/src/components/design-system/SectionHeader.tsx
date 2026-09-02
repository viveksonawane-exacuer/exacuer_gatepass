import type { ReactNode } from "react";

type SectionHeaderProps = {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  trailing?: ReactNode;
  className?: string;
};

export function SectionHeader({
  title,
  actionLabel,
  onAction,
  trailing,
  className = "",
}: SectionHeaderProps) {
  return (
    <div className={`ds-section-header ${className}`.trim()}>
      <h2 className="ds-section-header__title">{title}</h2>
      {trailing}
      {actionLabel && onAction ? (
        <button type="button" className="ds-section-header__action" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
