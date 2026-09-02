import { useEffect, useMemo, useState } from "react";
import { settingsApi, type DashboardKpis, type VisitorListRow } from "@/api/vms";
import { buildFloorOptions } from "@/lib/floorOptions";
import {
  buildGateFlowSceneData,
  type BuildingOccupancy,
  type FloorOccupancy,
} from "@/lib/gateFlowBuildingData";
import { formatCount } from "@/lib/format";
import type { VisitorLang } from "@/i18n/visitorJourney";

type Props = {
  lang: VisitorLang;
  kpis?: DashboardKpis;
  rows?: VisitorListRow[];
  loading?: boolean;
  onGateNavigate?: () => void;
  onFloorNavigate?: (building: BuildingOccupancy, floor: FloorOccupancy) => void;
};

function CubeLogo() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#60a5fa" strokeWidth="2.2">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#818cf8" strokeWidth="2.2">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#ea580c" strokeWidth="2.2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function HeadquartersIcon() {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#93c5fd" strokeWidth="2">
      <path d="M3 21h18M5 21V7l8-4v18M13 21V11l6 3v7" />
    </svg>
  );
}

export function GateFlowBuilding2D({
  lang,
  kpis = {},
  rows = [],
  loading = false,
  onGateNavigate,
  onFloorNavigate,
}: Props) {
  const [floorOptions, setFloorOptions] = useState<ReturnType<typeof buildFloorOptions>>([]);

  const sceneData = useMemo(
    () => buildGateFlowSceneData(kpis, rows, floorOptions),
    [kpis, rows, floorOptions],
  );

  const mainBuilding = sceneData.buildings[0];

  useEffect(() => {
    let cancelled = false;
    void settingsApi
      .getMasters()
      .then((masters) => {
        if (cancelled) return;
        setFloorOptions(buildFloorOptions(masters || {}));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  // Display floors from top to bottom: Second Floor -> First Floor -> Ground Floor
  const stackedFloors = useMemo(() => {
    if (!mainBuilding) return [];
    return [...mainBuilding.floors].reverse();
  }, [mainBuilding]);

  const maxFloorTotal = useMemo(() => {
    if (!mainBuilding) return 1;
    const totals = mainBuilding.floors.map((f) => f.pending + f.inTransit + f.completed);
    return Math.max(1, ...totals);
  }, [mainBuilding]);

  return (
    <div className="ds-totem-stage">
      {/* ── ARCHITECTURAL TOTEM CONTAINER ── */}
      <div className="ds-totem">
        {/* 1. TOP NEON SIGNBOARD */}
        <div className="ds-totem__sign-wrapper">
          <div className="ds-totem__sign">
            <div className="ds-totem__sign-brand">
              <CubeLogo />
              <span className="ds-totem__sign-title">EXACUER GLOBAL</span>
            </div>
            <div className="ds-totem__sign-badge">
              <HeadquartersIcon />
              <span>{loading ? "SYNCING…" : "HEADQUARTERS"}</span>
            </div>
          </div>
          <div className="ds-totem__sign-stem" />
        </div>

        {/* 2. TOTEM MAIN BODY TOWER */}
        <div className="ds-totem__body">
          {/* Top Cap */}
          <div className="ds-totem__cap">
            <div className="ds-totem__led-strip" />
          </div>

          {/* FLOORS STACK (Second Floor -> First Floor -> Ground Floor) */}
          <div className="ds-totem__levels">
            {stackedFloors.map((floor) => {
              const total = floor.pending + floor.inTransit + floor.completed;
              const percent = Math.min(100, Math.max(8, Math.round((total / maxFloorTotal) * 100)));

              return (
                <div key={`${floor.label}-${floor.number}`} className="ds-totem__floor-shelf">
                  <div
                    className="ds-totem__floor-row"
                    onClick={() => {
                      if (onFloorNavigate && mainBuilding) onFloorNavigate(mainBuilding, floor);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        if (onFloorNavigate && mainBuilding) onFloorNavigate(mainBuilding, floor);
                      }
                    }}
                  >
                    {/* Left Wing Pylon Badge */}
                    <div className="ds-totem__wing-pylon">
                      <div className="ds-totem__pylon-icon">
                        <BuildingIcon />
                      </div>
                      <span className="ds-totem__pylon-title">{floor.label}</span>
                      <span className="ds-totem__pylon-code">
                        {floor.floorCode || `FLOOR ${floor.number}`}
                      </span>
                    </div>

                    {/* Right Main Digital Card */}
                    <div className="ds-totem__card-main">
                      <div className="ds-totem__card-head">
                        <div className="ds-totem__card-head-title">
                          <GridIcon />
                          <span>{floor.label}</span>
                        </div>
                        <div className="ds-totem__card-head-trail">
                          <span><b>{total}</b> today</span>
                          <span className="ds-totem__card-chevron">›</span>
                        </div>
                      </div>

                      {/* Blue Gradient Progress / Flow Bar */}
                      <div className="ds-totem__progress-track">
                        <div
                          className="ds-totem__progress-bar"
                          style={{ width: `${total > 0 ? percent : 4}%` }}
                        />
                      </div>

                      {/* 3 Metric Columns: PENDING, IN-TRANSIT, COMPLETED */}
                      <div className="ds-totem__metrics-grid">
                        <div className="ds-totem__metric-box">
                          <span className="ds-totem__metric-num ds-totem__metric-num--blue">
                            {floor.pending}
                          </span>
                          <span className="ds-totem__metric-tag">PENDING</span>
                        </div>
                        <div className="ds-totem__metric-box">
                          <span className="ds-totem__metric-num ds-totem__metric-num--indigo">
                            {floor.inTransit}
                          </span>
                          <span className="ds-totem__metric-tag">IN-TRANSIT</span>
                        </div>
                        <div className="ds-totem__metric-box">
                          <span className="ds-totem__metric-num ds-totem__metric-num--orange">
                            {floor.completed}
                          </span>
                          <span className="ds-totem__metric-tag">COMPLETED</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Shelf Divider Bar with Warm LED */}
                  <div className="ds-totem__shelf-divider">
                    <div className="ds-totem__shelf-led" />
                  </div>
                </div>
              );
            })}

            {/* 3. BOTTOM LEVEL: SECURITY GATE STATION */}
            <div className="ds-totem__gate-shelf">
              <div
                className="ds-totem__gate-row"
                onClick={onGateNavigate}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    if (onGateNavigate) onGateNavigate();
                  }
                }}
              >
                <div className="ds-totem__gate-main">
                  <div className="ds-totem__gate-left">
                    <div className="ds-totem__gate-shield-box">
                      <ShieldIcon />
                    </div>
                    <div className="ds-totem__gate-info">
                      <div className="ds-totem__gate-title-row">
                        <strong className="ds-totem__gate-title">Security Gate Station</strong>
                        <span className="ds-totem__gate-tag">GATE DESK</span>
                      </div>
                      <p className="ds-totem__gate-sub">Visitor entrance & approval desk</p>
                      <div className="ds-totem__gate-approved">
                        <span className="ds-totem__gate-dot" />
                        <span>{formatCount(sceneData.gate.approved, lang)} approved passes</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Pending Approval Box */}
                  <div className="ds-totem__gate-right">
                    <span className="ds-totem__gate-pending-num">
                      {sceneData.gate.pendingApproval}
                    </span>
                    <span className="ds-totem__gate-pending-tag">PENDING APPROVAL</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Foundation Base Platform with Under-Glow */}
          <div className="ds-totem__base">
            <div className="ds-totem__base-led" />
          </div>
        </div>

        {/* 4. MOTORIZED BOOM BARRIER (ORANGE / WHITE STRIPED) ON PLAZA FLOOR */}
        <div className="ds-totem__barrier-wrap" aria-hidden>
          <div className="ds-totem__barrier-arm">
            <span className="ds-totem__barrier-stripe ds-totem__barrier-stripe--orange" />
            <span className="ds-totem__barrier-stripe ds-totem__barrier-stripe--white" />
            <span className="ds-totem__barrier-stripe ds-totem__barrier-stripe--orange" />
            <span className="ds-totem__barrier-stripe ds-totem__barrier-stripe--white" />
            <span className="ds-totem__barrier-stripe ds-totem__barrier-stripe--orange" />
            <span className="ds-totem__barrier-stripe ds-totem__barrier-stripe--white" />
          </div>
          <div className="ds-totem__barrier-post" />
        </div>
      </div>
    </div>
  );
}
