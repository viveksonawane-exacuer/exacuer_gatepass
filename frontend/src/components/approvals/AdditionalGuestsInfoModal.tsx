import type { AdditionalGuest } from "@/lib/additionalGuests";
import { ConfirmModal } from "@/components/design-system/ConfirmModal";

type Props = {
  open: boolean;
  primaryName: string;
  visitorCount: number;
  guests: AdditionalGuest[];
  onClose: () => void;
};

export function AdditionalGuestsInfoModal({
  open,
  primaryName,
  visitorCount,
  guests,
  onClose,
}: Props) {
  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      closeOnBackdrop
      title={`Visitors (${visitorCount})`}
      subtitle="Primary contact and additional guests for this entry."
      titleId="vm-additional-guests-info-title"
      footer={
        <button type="button" className="ds-btn-primary" onClick={onClose}>
          Close
        </button>
      }
    >
      <div className="ds-confirm-modal__body">
        <div className="ds-guest-list">
          <div className="ds-guest-list__row">
            <p className="ds-guest-list__kicker">Guest 1 (primary)</p>
            <p className="ds-guest-list__name">{primaryName || "—"}</p>
          </div>

          {guests.length ? (
            guests.map((guest, index) => (
              <div key={`${guest.name}-${index}`} className="ds-guest-list__row">
                <p className="ds-guest-list__kicker">Guest {index + 2}</p>
                <p className="ds-guest-list__name">{guest.name.trim() || "—"}</p>
                {guest.mobile.trim() ? (
                  <p className="ds-guest-list__mobile">{guest.mobile.trim()}</p>
                ) : null}
              </div>
            ))
          ) : visitorCount > 1 ? (
            <p className="ds-confirm-modal__sub" style={{ margin: 0 }}>
              No additional guest details were saved in remarks for this entry.
            </p>
          ) : null}
        </div>
      </div>
    </ConfirmModal>
  );
}
