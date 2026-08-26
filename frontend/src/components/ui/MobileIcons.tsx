import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function baseProps({ size = 22, className, ...rest }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true as const,
    ...rest,
  };
}

export function IconHome(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M3 10.5L12 3l9 7.5V20a2 2 0 0 1-2 2h-4a1 1 0 0 1-1-1v-5a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v5a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2v-9.5z" />
    </svg>
  );
}

export function IconCheckIn(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="12" cy="8" r="4" />
      <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
      <circle cx="18" cy="18" r="3" fill="#6366f1" stroke="none" />
      <path d="M18 16.5v3M16.5 18h3" stroke="#fff" strokeWidth="1.5" />
    </svg>
  );
}

export function IconScan(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" />
      <rect x="7" y="7" width="10" height="10" rx="2" />
    </svg>
  );
}

export function IconInside(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20M12 2a14.5 14.5 0 0 1 0 20M2 12h20" />
    </svg>
  );
}

export function IconHistory(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 15" />
    </svg>
  );
}

export function IconApprovals(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M16 3v4M8 3v4M3 11h18" />
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="m9 16 2 2 4-4" />
    </svg>
  );
}

export function IconPass(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="M3 10h18M7 15h4" />
      <circle cx="16.5" cy="15" r="1.5" />
    </svg>
  );
}

export function IconProfile(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="12" cy="8" r="4" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
    </svg>
  );
}

export function IconChevron(props: IconProps) {
  return (
    <svg {...baseProps({ size: 18, ...props })}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function IconLogin(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M10 17v2a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v2" />
      <path d="M15 12H3m0 0 3-3m-3 3 3 3" />
    </svg>
  );
}

export function IconBell(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

export function IconUser(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="12" cy="8" r="3.25" />
      <path d="M5.5 19.5a6.5 6.5 0 0 1 13 0" />
    </svg>
  );
}

export function IconUserInside(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <rect x="5" y="4" width="14" height="16" rx="3" strokeWidth="1.75" />
      <circle cx="12" cy="10" r="2.5" />
      <path d="M8 17a4 4 0 0 1 8 0" />
    </svg>
  );
}

export function IconExit(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M13 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
    </svg>
  );
}

export function IconAlertShield(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2.5" />
    </svg>
  );
}

export function IconReports(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

export function IconMenuMore(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}

export function IconMic(props: IconProps) {
  return (
    <svg {...baseProps({ ...props, strokeWidth: 2 })}>
      <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z" />
      <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
    </svg>
  );
}

export type MobileTabIcon = "home" | "checkin" | "scan" | "inside" | "history" | "pass" | "reports" | "more" | "approvals";

export function MobileTabIconView({ name, size = 22 }: { name: MobileTabIcon; size?: number }) {
  switch (name) {
    case "home":
      return <IconHome size={size} />;
    case "checkin":
      return <IconCheckIn size={size} />;
    case "scan":
      return <IconScan size={size} />;
    case "inside":
      return <IconInside size={size} />;
    case "history":
      return <IconHistory size={size} />;
    case "pass":
      return <IconPass size={size} />;
    case "reports":
      return <IconReports size={size} />;
    case "more":
      return <IconMenuMore size={size} />;
    case "approvals":
      return <IconApprovals size={size} />;
    default: {
      const _exhaustive: never = name;
      return _exhaustive;
    }
  }
}
