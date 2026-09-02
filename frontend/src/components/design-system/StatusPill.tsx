export type StatusPillVariant =
  | "pending"
  | "approved"
  | "checked-in"
  | "meeting"
  | "out"
  | "rejected"
  | "cancelled"
  | "danger"
  | "info";

type StatusPillProps = {
  label: string;
  variant?: StatusPillVariant;
  showDot?: boolean;
  className?: string;
};

export function resolveStatusPillVariant(raw?: string | null): StatusPillVariant {
  const s = (raw || "").toLowerCase();
  if (s.includes("pending")) return "pending";
  if (s.includes("approved")) return "approved";
  if (s.includes("checked in") || s.includes("check-in")) return "checked-in";
  if (s.includes("meeting")) return "meeting";
  if (s.includes("reject")) return "rejected";
  if (s.includes("cancel")) return "cancelled";
  if (s.includes("out") || s.includes("expired")) return "out";
  return "info";
}

export function StatusPill({
  label,
  variant = "info",
  showDot = true,
  className = "",
}: StatusPillProps) {
  return (
    <span className={`ds-status-pill ds-status-pill--${variant} ${className}`.trim()}>
      {showDot ? <span className="ds-status-pill__dot" aria-hidden /> : null}
      {label}
    </span>
  );
}
