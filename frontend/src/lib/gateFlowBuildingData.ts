import type { DashboardKpis, VisitorListRow } from "@/api/vms";

export type VisitorFlowBucket = "pending" | "inTransit" | "completed";

export type LiveVisitorFigure = {
  id: string;
  name: string;
  bucket: VisitorFlowBucket;
  rawStatus: string;
};

/** Site-wide visitor occupancy (no floor split). */
export type SiteOccupancy = {
  pending: number;
  inTransit: number;
  completed: number;
  visitors: LiveVisitorFigure[];
};

export type GateFlowSceneData = {
  occupancy: SiteOccupancy;
  gate: {
    pendingApproval: number;
    approved: number;
    queue: LiveVisitorFigure[];
  };
  totalLive: number;
};

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

function visitorName(row: VisitorListRow): string {
  return row.full_name || row.first_name || row.name || "Visitor";
}

export function buildGateFlowSceneData(
  kpis: DashboardKpis = {},
  rows: VisitorListRow[] = [],
): GateFlowSceneData {
  const pendingApproval = Number(kpis["Pending Approval"] ?? kpis.pending ?? 0);
  const approved = Number(kpis.Approved ?? 0);

  const todayRows = rows.filter(isRecordFromToday);

  const occupancy: SiteOccupancy = {
    pending: 0,
    inTransit: 0,
    completed: 0,
    visitors: [],
  };
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

    if (bucket === "pending") {
      gateQueue.push(figure);
      occupancy.pending += 1;
      continue;
    }

    if (bucket === "inTransit") occupancy.inTransit += 1;
    if (bucket === "completed") occupancy.completed += 1;
    occupancy.visitors.push(figure);
  }

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
    occupancy,
    gate: { pendingApproval: effectivePending, approved, queue },
    totalLive,
  };
}
