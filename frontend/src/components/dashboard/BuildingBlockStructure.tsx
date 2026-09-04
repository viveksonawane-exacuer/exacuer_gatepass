import { formatCount } from "@/lib/format";
import type { VisitorLang } from "@/i18n/visitorJourney";
import buildingImg from "@/assets/basic-building-facade-v2.jpg";

export interface FloorBlockData {
  label: string;
  shortLabel: string;
  count: number;
  isGate?: boolean;
}

interface BuildingBlockStructureProps {
  floors: FloorBlockData[];
  hoveredFloor: string | null;
  onHoverFloor: (label: string | null) => void;
  onSelectFloor: (label: string) => void;
  loading?: boolean;
  lang?: VisitorLang;
}

interface BandConfig {
  topPercent: number;
  leftPercent: number;
  widthPercent: number;
  heightPercent: number;
  themeClass: string;
  glowColor: string;
  neonBorder: string;
}

const BAND_CONFIGS: Record<string, BandConfig> = {
  "2nd Floor": {
    topPercent: 20.6,
    leftPercent: 28.5,
    widthPercent: 43,
    heightPercent: 7.8,
    themeClass: "vm-band--2f",
    glowColor: "rgba(37, 99, 235, 0.65)",
    neonBorder: "#38bdf8",
  },
  "1st Floor": {
    topPercent: 34.6,
    leftPercent: 28.5,
    widthPercent: 43,
    heightPercent: 7.8,
    themeClass: "vm-band--1f",
    glowColor: "rgba(139, 92, 246, 0.65)",
    neonBorder: "#c084fc",
  },
  "Ground Floor": {
    topPercent: 48.6,
    leftPercent: 28.5,
    widthPercent: 43,
    heightPercent: 7.8,
    themeClass: "vm-band--gf",
    glowColor: "rgba(22, 163, 74, 0.65)",
    neonBorder: "#4ade80",
  },
  Gate: {
    topPercent: 62.4,
    leftPercent: 28.5,
    widthPercent: 43,
    heightPercent: 7.8,
    themeClass: "vm-band--gate",
    glowColor: "rgba(245, 158, 11, 0.65)",
    neonBorder: "#fde047",
  },
};

const BUILDING_SRC = `${buildingImg}?v=${Date.now()}`;

export function BuildingBlockStructure({
  floors,
  hoveredFloor,
  onHoverFloor,
  onSelectFloor,
  loading = false,
  lang = "en",
}: BuildingBlockStructureProps) {
  return (
    <div className="vm-building-structure-stage" aria-label="Building Structure View">
      {/* Basic Front-Facing 2.5D Building Elevation */}
      <img
        src={BUILDING_SRC}
        alt="Building facade structure"
        className="vm-building-structure-img"
        loading="eager"
        onError={(e) => {
          const fallback = `/assets/visitor_management/frontend/brand/basic-building-facade-v2.jpg?v=${Date.now()}`;
          if (e.currentTarget.src !== fallback) {
            e.currentTarget.src = fallback;
          }
        }}
      />

      {/* Interactive Floor Band Overlays with Live Counts */}
      <div className="vm-building-bands-overlay" aria-hidden="false">
        {floors.map((floor) => {
          const config = BAND_CONFIGS[floor.label] ?? BAND_CONFIGS["2nd Floor"];
          const isHovered = hoveredFloor === floor.label;

          return (
            <button
              key={floor.label}
              type="button"
              className={`vm-building-band-btn ${config.themeClass}${isHovered ? " is-hovered" : ""}`}
              style={{
                top: `${config.topPercent}%`,
                left: `${config.leftPercent}%`,
                width: `${config.widthPercent}%`,
                height: `${config.heightPercent}%`,
                boxShadow: isHovered
                  ? `0 0 14px ${config.glowColor}, inset 0 0 8px rgba(255,255,255,0.4)`
                  : undefined,
              }}
              onClick={() => onSelectFloor(floor.label)}
              onMouseEnter={() => onHoverFloor(floor.label)}
              onMouseLeave={() => onHoverFloor(null)}
              title={`${floor.label}: ${floor.count} occupants`}
              aria-label={`${floor.label}, ${floor.count} occupants`}
            >
              <span className="vm-band-label">{floor.shortLabel}</span>
              <span className="vm-band-divider" aria-hidden>|</span>
              <span className="vm-band-icon" aria-hidden>
                <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                </svg>
              </span>
              <strong className="vm-band-count">
                {loading ? "—" : formatCount(floor.count, lang)}
              </strong>

              {/* Neon Glow Underline */}
              <span
                className="vm-band-neon-line"
                style={{
                  background: config.neonBorder,
                  boxShadow: `0 0 8px ${config.neonBorder}`,
                }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
