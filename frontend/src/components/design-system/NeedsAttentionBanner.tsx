type NeedsAttentionBannerProps = {
  count: number;
  title: string;
  description?: string;
  className?: string;
};

export function NeedsAttentionBanner({
  count,
  title,
  description,
  className = "",
}: NeedsAttentionBannerProps) {
  if (count <= 0) return null;

  return (
    <div className={`ds-attention-banner ${className}`.trim()} role="status">
      <div className="ds-attention-banner__icon" aria-hidden>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>
      <div className="ds-attention-banner__copy">
        <strong className="ds-attention-banner__title">{title}</strong>
        {description ? <span className="ds-attention-banner__desc">{description}</span> : null}
      </div>
      <span className="ds-attention-banner__count">{count}</span>
    </div>
  );
}
