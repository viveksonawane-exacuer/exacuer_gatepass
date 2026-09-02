import type { ReactNode } from "react";

export type MetricCardTone = "blue" | "amber" | "green" | "indigo";

type MetricCardProps = {
  value: string | number;
  label: string;
  meta?: string;
  icon?: ReactNode;
  tone?: MetricCardTone;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
  "aria-label"?: string;
};

export function MetricCard({
  value,
  label,
  meta,
  icon,
  tone = "blue",
  loading = false,
  onClick,
  className = "",
  "aria-label": ariaLabel,
}: MetricCardProps) {
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      type={onClick ? "button" : undefined}
      className={`ds-metric-card ${className}`.trim()}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      <div className="ds-metric-card__top">
        {icon ? (
          <div className={`ds-metric-card__icon ds-metric-card__icon--${tone}`}>{icon}</div>
        ) : (
          <span />
        )}
        <span className="ds-metric-card__value">{loading ? "—" : value}</span>
      </div>
      <span className="ds-metric-card__label">{label}</span>
      {meta ? <span className="ds-metric-card__meta">{meta}</span> : null}
    </Tag>
  );
}

export function MetricCardSkeletonGrid() {
  return (
    <div className="ds-skeleton-metric-grid" aria-hidden>
      <div className="ds-skeleton ds-skeleton-metric" />
      <div className="ds-skeleton ds-skeleton-metric" />
      <div className="ds-skeleton ds-skeleton-metric" />
      <div className="ds-skeleton ds-skeleton-metric" />
    </div>
  );
}
