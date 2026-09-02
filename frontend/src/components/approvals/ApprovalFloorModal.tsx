import { useEffect, useMemo, useState } from "react";
import { settingsApi, type VisitorListRow } from "@/api/vms";
import { SearchSelect } from "@/components/ui/SearchSelect";
import { buildFloorOptions } from "@/lib/floorOptions";
import { initials } from "@/lib/format";
import { ConfirmModal } from "@/components/design-system/ConfirmModal";
import { StatusPill } from "@/components/design-system/StatusPill";

type Props = {
  visitor: VisitorListRow | null;
  open: boolean;
  busy?: boolean;
  onClose: () => void;
  onConfirm: (visitor: VisitorListRow, floor: string) => Promise<void> | void;
};

export function ApprovalFloorModal({ visitor, open, busy = false, onClose, onConfirm }: Props) {
  const [floor, setFloor] = useState("");
  const [floors, setFloors] = useState<Array<{ value: string; display: string }>>([]);
  const [loadingFloors, setLoadingFloors] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !visitor) return;
    setError(null);
    setSubmitting(false);
    setFloor(visitor.floor || "");
    setLoadingFloors(true);
    let cancelled = false;
    void settingsApi
      .getMasters()
      .then((masters) => {
        if (cancelled) return;
        const options = buildFloorOptions(masters || {});
        setFloors(options);
        if (visitor.floor && !options.some((o) => o.value === visitor.floor)) {
          setFloor("");
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setFloors([]);
        setError(err instanceof Error ? err.message : "Could not load floors from Floor master.");
      })
      .finally(() => {
        if (!cancelled) setLoadingFloors(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, visitor]);

  const floorOptions = useMemo(
    () =>
      floors.map((f) => ({
        value: f.value,
        label: f.display,
      })),
    [floors],
  );

  if (!visitor) return null;

  const visitorName = visitor.full_name || visitor.name;
  const isBusy = busy || submitting;

  async function handleConfirm() {
    if (!visitor) return;
    if (!floors.length) {
      setError("No floors found. Add Floor records in Desk (Visitor Management → Floor).");
      return;
    }
    if (!floor.trim()) {
      setError("Please select a floor.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onConfirm(visitor, floor.trim());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Approve failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      showClose
      title="Approve Visitor"
      subtitle={
        <>
          Select the floor for <strong>{visitorName}</strong> before approval.
        </>
      }
      titleId="vm-approval-floor-title"
      icon={
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      }
      iconTone="success"
      footer={
        <>
          <button type="button" className="ds-btn-secondary" disabled={isBusy} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="ds-btn-primary"
            disabled={isBusy || loadingFloors || floors.length === 0}
            onClick={() => void handleConfirm()}
          >
            {isBusy ? "Approving…" : "Approve"}
          </button>
        </>
      }
    >
      <div className="ds-confirm-modal__body">
        <div className="ds-confirm-modal__visitor">
          <div className="ds-schedule-card__avatar">{initials(visitorName)}</div>
          <div className="ds-confirm-modal__visitor-copy">
            <strong>{visitorName}</strong>
            <span>{visitor.name}</span>
          </div>
          <StatusPill label="Pending" variant="pending" />
        </div>

        <div className="ds-form-field">
          <label className="ds-form-field__label" htmlFor="approval-floor-select">
            Floor No. <span className="ds-form-field__required">*</span>
          </label>
          <SearchSelect
            id="approval-floor-select"
            value={floor}
            options={floorOptions}
            onChange={(val) => {
              setFloor(val);
              setError(null);
            }}
            placeholder={loadingFloors ? "Loading floors…" : floors.length ? "Select" : "No floors configured"}
            searchPlaceholder="Search floor"
            loading={loadingFloors}
            loadingText="Loading floors…"
            emptyText="No floors found in Floor master"
            disabled={isBusy || loadingFloors || floors.length === 0}
            required
            allowEmpty
            menuPlacement="top"
            aria-label="Floor"
          />
          {error ? <p className="ds-auth-error">{error}</p> : null}
        </div>
      </div>
    </ConfirmModal>
  );
}
