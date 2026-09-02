import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { InAppNotification, VisitorListRow } from "@/api/vms";
import { formatTime } from "@/lib/format";
import { getCurrentStageTimestamp } from "@/lib/visitStages";
import { routeForNotification } from "@/lib/notificationRoutes";
import { ut } from "@/i18n/uiChrome";
import type { VisitorLang } from "@/i18n/visitorJourney";

export type NotificationPreviewItem = {
  id: string;
  title: string;
  subtitle: string;
  time?: string;
  route: string;
  unread?: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  lang: VisitorLang;
  loading: boolean;
  items: NotificationPreviewItem[];
  anchorRef: React.RefObject<HTMLElement | null>;
};

export function buildNotificationPreviewItems(
  pending: VisitorListRow[],
  alerts: InAppNotification[],
  lang: VisitorLang,
): NotificationPreviewItem[] {
  const pendingItems: NotificationPreviewItem[] = pending.slice(0, 3).map((row) => ({
    id: `pending-${row.name}`,
    title: row.full_name || row.name,
    subtitle: "Awaiting approval",
    time: formatTime(getCurrentStageTimestamp(row), lang) || undefined,
    route: `/visitor/${encodeURIComponent(row.name)}`,
    unread: true,
  }));

  const alertItems: NotificationPreviewItem[] = alerts.slice(0, 4).map((row) => ({
    id: row.name,
    title: row.subject || "Notification",
    subtitle: (row.email_content || "").replace(/\s+/g, " ").trim().slice(0, 72) || "Tap to open",
    time: row.creation ? formatTime(row.creation, lang) || undefined : undefined,
    route: routeForNotification({ subject: row.subject, body: row.email_content }),
    unread: !row.read,
  }));

  return [...pendingItems, ...alertItems].slice(0, 5);
}

export function NotificationPreviewPopover({
  open,
  onClose,
  lang,
  loading,
  items,
  anchorRef,
}: Props) {
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onDocClick(e: MouseEvent) {
      const target = e.target as Node | null;
      if (!target) return;
      if (panelRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      onClose();
    }

    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  return (
    <div ref={panelRef} className="ds-notify-popover" role="dialog" aria-label="Notifications preview">
      <div className="ds-notify-popover__head">
        <strong>Notifications</strong>
        {items.length > 0 ? (
          <span className="ds-notify-popover__count">{items.length}</span>
        ) : null}
      </div>

      <div className="ds-notify-popover__body">
        {loading ? (
          <p className="ds-notify-popover__empty">Loading…</p>
        ) : items.length === 0 ? (
          <p className="ds-notify-popover__empty">No new notifications</p>
        ) : (
          <ul className="ds-notify-popover__list">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={`ds-notify-popover__item${item.unread ? " is-unread" : ""}`}
                  onClick={() => {
                    onClose();
                    navigate(item.route);
                  }}
                >
                  <span className="ds-notify-popover__item-title">{item.title}</span>
                  <span className="ds-notify-popover__item-sub">{item.subtitle}</span>
                  {item.time ? <span className="ds-notify-popover__item-time">{item.time}</span> : null}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        className="ds-notify-popover__view-all"
        onClick={() => {
          onClose();
          navigate("/notifications");
        }}
      >
        {ut(lang, "view_all")}
      </button>
    </div>
  );
}
