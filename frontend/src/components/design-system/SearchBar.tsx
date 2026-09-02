type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  "aria-label"?: string;
  className?: string;
};

export function SearchBar({
  value,
  onChange,
  placeholder = "Search…",
  "aria-label": ariaLabel,
  className = "",
}: SearchBarProps) {
  return (
    <div className={`ds-search-bar ${className}`.trim()}>
      <span className="ds-search-bar__icon" aria-hidden>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </span>
      <input
        className="ds-search-bar__input"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel || placeholder}
      />
    </div>
  );
}
