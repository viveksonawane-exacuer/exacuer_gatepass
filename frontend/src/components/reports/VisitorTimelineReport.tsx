import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { VisitorListRow } from "@/api/vms";
import { formatTime } from "@/lib/format";
import { filterRowsByDate } from "@/lib/visitorFlow";
import { getCurrentStageTimestamp } from "@/lib/visitStages";
import { localizePersonName } from "@/lib/transliterate";
import { useAppLanguage } from "@/context/AppLanguageContext";
import { translateVisitorStatus } from "@/i18n/uiChrome";
import { VisitorAvatar } from "@/components/ui/VisitorAvatar";
import { SearchBar } from "@/components/design-system/SearchBar";

interface VisitorTimelineReportProps {
  rows: VisitorListRow[];
  selectedDate: string;
  loading?: boolean;
}

type TimelineTone = "green" | "blue" | "orange" | "purple" | "slate";

function resolveTimelineTone(status?: string): {
  tone: TimelineTone;
  stageName: string;
} {
  switch (status) {
    case "Checked In":
      return { tone: "blue", stageName: "Check-in" };
    case "Meeting Done":
      return { tone: "purple", stageName: "Meeting Done" };
    case "Approved":
      return { tone: "green", stageName: "Approved" };
    case "Pending Approval":
    case "Pending":
      return { tone: "orange", stageName: "Pending" };
    case "Checked Out":
      return { tone: "slate", stageName: "Checkout" };
    case "Rejected":
      return { tone: "orange", stageName: "Rejected" };
    default:
      return { tone: "slate", stageName: "Check-in" };
  }
}

export function VisitorTimelineReport({
  rows,
  selectedDate,
  loading = false,
}: VisitorTimelineReportProps) {
  const navigate = useNavigate();
  const { lang } = useAppLanguage();
  const [visitorSearch, setVisitorSearch] = useState("");
  const [selectedVisitorKey, setSelectedVisitorKey] = useState<string | null>(null);

  // Group visits by unique visitor identity (mobile or name)
  const groupedVisitors = useMemo(() => {
    const map = new Map<
      string,
      {
        primaryName: string;
        mobile?: string;
        photo?: string;
        company?: string;
        latestStatus: string;
        visits: VisitorListRow[];
      }
    >();

    const targetRows = filterRowsByDate(rows, selectedDate);
    const dataset = targetRows.length > 0 ? targetRows : rows.slice(0, 30);

    for (const row of dataset) {
      const key = (row.mobile || row.full_name || row.name).trim();
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          primaryName: row.full_name || row.name,
          mobile: row.mobile,
          photo: row.photo,
          company: row.visitor_company,
          latestStatus: row.status || "",
          visits: [row],
        });
      } else {
        existing.visits.push(row);
      }
    }

    return Array.from(map.entries()).map(([key, data]) => ({
      key,
      ...data,
      totalVisits: data.visits.length,
    }));
  }, [rows, selectedDate]);

  // Filter visitors by search
  const filteredVisitors = useMemo(() => {
    if (!visitorSearch.trim()) return groupedVisitors;
    const q = visitorSearch.toLowerCase().trim();
    return groupedVisitors.filter(
      (v) =>
        v.primaryName.toLowerCase().includes(q) ||
        (v.mobile && v.mobile.includes(q)) ||
        (v.company && v.company.toLowerCase().includes(q)),
    );
  }, [groupedVisitors, visitorSearch]);

  const activeVisitor = useMemo(() => {
    if (!selectedVisitorKey) return null;
    return groupedVisitors.find((v) => v.key === selectedVisitorKey) || null;
  }, [groupedVisitors, selectedVisitorKey]);

  if (loading) {
    return (
      <div className="ds-timeline-empty ds-timeline-report">
        <span>Loading visitor analytics & timeline...</span>
      </div>
    );
  }

  if (!groupedVisitors.length) {
    return (
      <div className="ds-timeline-empty ds-timeline-report">
        <span>No visitor activity found for this date.</span>
      </div>
    );
  }

  return (
    <div className="vm-visitor-analytics-container ds-timeline-report">
      <SearchBar
        value={visitorSearch}
        onChange={setVisitorSearch}
        placeholder="Search by visitor name, mobile, or company..."
      />

      {/* Selected Visitor Detail Modal / Banner */}
      {activeVisitor ? (
        <div className="vm-active-visitor-card">
          <div className="vm-active-visitor-head">
            <div className="vm-active-visitor-info">
              <VisitorAvatar
                name={activeVisitor.primaryName}
                photo={activeVisitor.photo}
                className="vm-active-visitor-avatar"
              />
              <div className="vm-active-visitor-copy">
                <strong>{localizePersonName(activeVisitor.primaryName, lang)}</strong>
                <span>
                  {activeVisitor.mobile || "No mobile"} • {activeVisitor.company || "Direct Guest"}
                </span>
              </div>
            </div>
            <button
              type="button"
              className="vm-active-visitor-close"
              onClick={() => setSelectedVisitorKey(null)}
              aria-label="Close individual view"
            >
              ✕
            </button>
          </div>

          <div className="vm-active-visitor-metrics">
            <div className="vm-av-metric">
              <span>Total Passes Today</span>
              <strong>{activeVisitor.totalVisits}</strong>
            </div>
            <div className="vm-av-metric">
              <span>Current Status</span>
              <strong className="text-blue">{translateVisitorStatus(lang, activeVisitor.latestStatus, { short: true })}</strong>
            </div>
          </div>
        </div>
      ) : null}

      {/* Grouped Visitor Cards */}
      <div className="vm-visitor-grouped-list">
        {filteredVisitors.map((visitorGroup) => {
          const isSelected = selectedVisitorKey === visitorGroup.key;
          const { tone } = resolveTimelineTone(visitorGroup.latestStatus);

          return (
            <div
              key={visitorGroup.key}
              className={`vm-visitor-profile-card${isSelected ? " is-selected" : ""}`}
            >
              {/* Profile Card Header */}
              <div
                className="vm-vpc-head"
                role="button"
                tabIndex={0}
                onClick={() => setSelectedVisitorKey((prev) => (prev === visitorGroup.key ? null : visitorGroup.key))}
              >
                <div className="vm-vpc-left">
                  <VisitorAvatar
                    name={visitorGroup.primaryName}
                    photo={visitorGroup.photo}
                    className={`vm-vpc-avatar is-${tone}`}
                  />
                  <div className="vm-vpc-details">
                    <strong className="vm-vpc-name">{localizePersonName(visitorGroup.primaryName, lang)}</strong>
                    <span className="vm-vpc-sub">
                      {visitorGroup.company || "Visitor"} {visitorGroup.mobile ? `• ${visitorGroup.mobile}` : ""}
                    </span>
                  </div>
                </div>

                <div className="vm-vpc-right">
                  <span className={`vm-vpc-badge is-${tone}`}>
                    {translateVisitorStatus(lang, visitorGroup.latestStatus, { short: true })}
                  </span>
                  <span className="vm-vpc-chevron">{isSelected ? "▲" : "▼"}</span>
                </div>
              </div>

              {/* Individual Visitor Activity Timeline */}
              <div className="vm-vpc-timeline-wrap">
                {visitorGroup.visits.map((visit, vIdx) => {
                  const rawTime = getCurrentStageTimestamp(visit) || visit.creation;
                  const timeStr = formatTime(rawTime, lang) || "—";
                  const hostName = localizePersonName(visit.person_to_meet_name || "—", lang);
                  const purpose = visit.visit_purpose_type || "Meeting";
                  const visitTone = resolveTimelineTone(visit.status);
                  const isLastVisit = vIdx === visitorGroup.visits.length - 1;

                  return (
                    <div key={visit.name || vIdx} className="vm-timeline-item-row">
                      {/* Left: Time & Stage */}
                      <div className="vm-timeline-time-col">
                        <strong className="vm-timeline-stage-title">{visitTone.stageName}</strong>
                        <span className="vm-timeline-time-val">{timeStr}</span>
                      </div>

                      {/* Center: Colored Node & Rail */}
                      <div className="vm-timeline-rail">
                        <span className={`vm-timeline-node is-${visitTone.tone}`} />
                        {!isLastVisit && <span className="vm-timeline-rail-line" />}
                      </div>

                      {/* Right: Pastel Card */}
                      <div
                        className={`vm-timeline-card-pill is-${visitTone.tone}`}
                        role="button"
                        tabIndex={0}
                        onClick={() => navigate(`/visitor/${encodeURIComponent(visit.name)}`)}
                      >
                        <div className="vm-timeline-card-main">
                          <strong className="vm-timeline-card-title">{visit.name}</strong>
                          <p className="vm-timeline-card-desc">
                            {purpose} • Host: {hostName}
                          </p>
                          <div className="vm-timeline-card-tags">
                            <span className={`vm-timeline-status-tag is-${visitTone.tone}`}>
                              {translateVisitorStatus(lang, visit.status, { short: true })}
                            </span>
                            {visit.floor && <span className="vm-timeline-company-tag">Floor {visit.floor}</span>}
                          </div>
                        </div>

                        <span className="vm-timeline-card-arrow" aria-hidden>
                          ›
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
