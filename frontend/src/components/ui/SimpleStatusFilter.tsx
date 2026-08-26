import type { StatusFilterOption } from "@/components/ui/SlidingStatusFilter";
import { useAppLanguage } from "@/context/AppLanguageContext";
import { formatCount } from "@/lib/format";

type SimpleStatusFilterProps = {
  options: StatusFilterOption[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
  pinAllFilter?: boolean;
};

function statusDotColor(tone?: string) {
  switch (tone) {
    case "green":
      return "#10b981";
    case "amber":
      return "#f59e0b";
    case "blue":
      return "#3b82f6";
    case "indigo":
      return "#6366f1";
    case "red":
      return "#ef4444";
    default:
      return "#94a3b8";
  }
}

export function SimpleStatusFilter({
  options,
  value,
  onChange,
  className = "",
}: SimpleStatusFilterProps) {
  const { lang } = useAppLanguage();

  return (
    <div
      className={`vm-status-chips-scroll ${className}`.trim()}
      role="tablist"
      aria-label="Visitor status filter"
    >
      {options.map((opt) => {
        const isActive = value === opt.id;
        const countLabel =
          typeof opt.count === "number" ? formatCount(opt.count, lang) : undefined;
        const dot = statusDotColor(opt.tone);

        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`vm-status-chip-btn${isActive ? " is-active" : ""}`}
            onClick={() => onChange(opt.id)}
          >
            {opt.id !== "all" && (
              <span
                className="vm-status-chip-dot"
                style={{ background: dot }}
                aria-hidden
              />
            )}
            <span className="vm-status-chip-label">{opt.label}</span>
            {countLabel != null ? (
              <span className={`vm-status-chip-count${isActive ? " is-active" : ""}`}>
                {countLabel}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

