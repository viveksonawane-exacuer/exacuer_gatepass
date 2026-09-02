import type { ReactNode } from "react";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  className?: string;
};

export function EmptyState({ icon, title, description, className = "" }: EmptyStateProps) {
  return (
    <div className={`ds-empty-state ${className}`.trim()}>
      {icon ? <div className="ds-empty-state__icon">{icon}</div> : null}
      <p className="ds-empty-state__title">{title}</p>
      {description ? <p className="ds-empty-state__desc">{description}</p> : null}
    </div>
  );
}
