import type { DashboardKpis, VisitorListRow } from "@/api/vms";
import type { FloorOption } from "@/lib/floorOptions";

export type VisitorFlowBucket = "pending" | "inTransit" | "completed";

export type LiveVisitorFigure = {
  id: string;
  name: string;
  bucket: VisitorFlowBucket;
  rawStatus: string;
};

export type FloorOccupancy = {
  number: number;
  label: string;
  floorCode: string;
  pending: number;
  inTransit: number;
  completed: number;
  visitors: LiveVisitorFigure[];
};

export type BuildingOccupancy = {
  id: string;
  name: string;
  floors: FloorOccupancy[];
};

export type GateFlowSceneData = {
  buildings: BuildingOccupancy[];
  gate: {
    pendingApproval: number;
    approved: number;
    queue: LiveVisitorFigure[];
  };
  totalLive: number;
};

const MAIN_BUILDING_NAME = "Exacuer Global";

export function mapVisitorFlowBucket(status?: string): VisitorFlowBucket | null {
  const value = (status || "").trim();
  switch (value) {
    case "Pending Approval":
    case "Pending":
      return "pending";
    case "Approved":
    case "Checked In":
    case "Meeting Done":
    case "Checkout Pending":
      return "inTransit";
    case "Checked Out":
      return "completed";
    default:
      return null;
  }
}

export function isRecordFromToday(row: VisitorListRow): boolean {
  if (
    row.status === "Checked In" ||
    row.status === "Meeting Done" ||
    row.status === "Checkout Pending"
  ) {
    return true;
  }

  const rawDate =
    row.check_in ||
    row.checked_in_on ||
    row.creation ||
    row.modified ||
    row.approved_on ||
    row.checked_out_on;

  if (!rawDate) return false;

  try {
    const d = new Date(rawDate);
    if (Number.isNaN(d.getTime())) return false;
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  } catch {
    return false;
  }
}

function emptyFloor(label: string, number: number, floorCode: string): FloorOccupancy {
  return { number, label, floorCode, pending: 0, inTransit: 0, completed: 0, visitors: [] };
}

function visitorName(row: VisitorListRow): string {
  return row.full_name || row.first_name || row.name || "Visitor";
}

export function buildGateFlowSceneData(
  kpis: DashboardKpis = {},
  rows: VisitorListRow[] = [],
  _floorOptions: FloorOption[] = [],
): GateFlowSceneData {
  const pendingApproval = Number(kpis["Pending Approval"] ?? kpis.pending ?? 0);
  const approved = Number(kpis.Approved ?? 0);

  // Filter rows strictly to today
  const todayRows = rows.filter(isRecordFromToday);

  // Standard 3 proper floors from Ground to Second Floor
  const groundFloor = emptyFloor("Ground Floor", 1, "FLOOR 1");
  const firstFloor = emptyFloor("First Floor", 2, "FLOOR 2");
  const secondFloor = emptyFloor("Second Floor", 3, "FLOOR 3");

  const gateQueue: LiveVisitorFigure[] = [];

  for (const row of todayRows) {
    const bucket = mapVisitorFlowBucket(row.status);
    if (!bucket) continue;

    const figure: LiveVisitorFigure = {
      id: row.name,
      name: visitorName(row),
      bucket,
      rawStatus: row.status || "—",
    };

    // Pending approvals belong strictly at the Security Gate
    if (bucket === "pending") {
      gateQueue.push(figure);
      continue;
    }

    const rawFloor = String(row.floor || "").trim().toLowerCase();

    // Map to the proper building floor (Ground Floor, First Floor, Second Floor)
    let targetFloor: FloorOccupancy = groundFloor;
    if (rawFloor.includes("second") || rawFloor.includes("2nd") || rawFloor === "2") {
      targetFloor = secondFloor;
    } else if (rawFloor.includes("first") || rawFloor.includes("1st") || rawFloor === "1") {
      targetFloor = firstFloor;
    } else {
      targetFloor = groundFloor;
    }

    if (bucket === "inTransit") targetFloor.inTransit += 1;
    if (bucket === "completed") targetFloor.completed += 1;
    targetFloor.visitors.push(figure);
  }

  const floors = [groundFloor, firstFloor, secondFloor];

  const totalLive =
    todayRows.filter((row) => mapVisitorFlowBucket(row.status) === "inTransit").length ||
    Number(kpis["On Premises"] ?? kpis["Checked In"] ?? 0);

  const effectivePending = pendingApproval || gateQueue.length;

  const queue =
    gateQueue.length > 0
      ? gateQueue
      : Array.from({ length: Math.min(effectivePending, 6) }, (_, i) => ({
          id: `gate-synth-${i}`,
          name: "Awaiting host",
          bucket: "pending" as const,
          rawStatus: "Pending Approval",
        }));

  return {
    buildings: [{ id: "main-campus", name: MAIN_BUILDING_NAME, floors }],
    gate: { pendingApproval: effectivePending, approved, queue },
    totalLive,
  };
}
