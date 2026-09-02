import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  notificationApi,
  visitorApi,
  type InAppNotification,
  type VisitorListRow,
} from "@/api/vms";
import {
  getSavedNotifications,
  markAllSavedNotificationsRead,
  markSavedNotificationRead,
  type SavedInAppNotification,
} from "@/services/localNotificationHistory";
import { VisitorAvatar } from "@/components/ui/VisitorAvatar";
import { EmptyState } from "@/components/design-system/EmptyState";
import { NeedsAttentionBanner } from "@/components/design-system/NeedsAttentionBanner";
import { SectionHeader } from "@/components/design-system/SectionHeader";
import { usePageChrome } from "@/context/PageChromeContext";
import { useAuth } from "@/context/AuthContext";
import { usePageRefresh } from "@/hooks/usePageRefresh";
import { useVmsRealtime } from "@/hooks/useVmsRealtime";
import { formatTime } from "@/lib/format";
import { getCurrentStageTimestamp } from "@/lib/visitStages";
import { userHostScopeFilters } from "@/lib/roles";
import { routeForNotification } from "@/lib/notificationRoutes";

function isPendingStatus(status?: string): boolean {
  return status === "Pending Approval" || status === "Pending";
}

function alertRoute(item: InAppNotification): string {
  return routeForNotification({
    subject: item.subject,
    body: item.email_content,
  });
}

function BellIcon({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

export function MobileNotificationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pending, setPending] = useState<VisitorListRow[]>([]);
  const [alerts, setAlerts] = useState<InAppNotification[]>([]);
  const [savedAlerts, setSavedAlerts] = useState<SavedInAppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());

  usePageChrome({
    title: "Notifications",
    subtitle: "Your pending approvals",
    showBack: true,
    backTo: "/",
    showNotification: false,
    showProfile: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [visitors, logs] = await Promise.all([
        visitorApi.listDetailed(200, userHostScopeFilters(user)).catch(() => [] as VisitorListRow[]),
        notificationApi.list(40).catch(() => [] as InAppNotification[]),
      ]);
      setPending((visitors || []).filter((row) => isPendingStatus(row.status)));
      setAlerts(logs || []);
      setSavedAlerts(getSavedNotifications());
    } catch {
      setPending([]);
      setAlerts([]);
      setSavedAlerts(getSavedNotifications());
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const handler = () => {
      setSavedAlerts(getSavedNotifications());
    };
    window.addEventListener("vms-notifications-updated", handler);
    return () => window.removeEventListener("vms-notifications-updated", handler);
  }, []);

  usePageRefresh(load);

  useVmsRealtime(() => {
    void load();
  }, true);

  const unreadPending = useMemo(
    () => pending.filter((item) => !readIds.has(item.name)).length,
    [pending, readIds],
  );

  const unreadAlerts = useMemo(
    () => alerts.filter((item) => !item.read).length,
    [alerts],
  );

  const unreadSaved = useMemo(
    () => savedAlerts.filter((item) => !item.read).length,
    [savedAlerts],
  );

  const markAllRead = async () => {
    setReadIds(new Set(pending.map((item) => item.name)));
    markAllSavedNotificationsRead();
    setSavedAlerts((prev) => prev.map((s) => ({ ...s, read: true })));
    try {
      await notificationApi.markAllRead();
      setAlerts((prev) => prev.map((row) => ({ ...row, read: 1 })));
    } catch {
      /* ignore */
    }
  };

  const openPending = (item: VisitorListRow) => {
    setReadIds((prev) => new Set(prev).add(item.name));
    navigate("/approvals");
  };

  const openSavedAlert = (item: SavedInAppNotification) => {
    markSavedNotificationRead(item.id);
    setSavedAlerts((prev) => prev.map((s) => (s.id === item.id ? { ...s, read: true } : s)));
    if (item.route) {
      navigate(item.route);
    } else {
      navigate("/approvals");
    }
  };

  const openAlert = async (item: InAppNotification) => {
    if (!item.read) {
      try {
        await notificationApi.markRead(item.name);
        setAlerts((prev) =>
          prev.map((row) => (row.name === item.name ? { ...row, read: 1 } : row)),
        );
      } catch {
        /* ignore */
      }
    }
    navigate(alertRoute(item));
  };

  const showMarkAll =
    (pending.length > 0 && unreadPending > 0) || unreadAlerts > 0 || unreadSaved > 0;

  return (
    <div className="ds-notifications-page ds-stagger">
      <NeedsAttentionBanner
        count={unreadPending}
        title="Pending approvals need action"
        description="Review and approve visitor requests"
      />

      <div className="ds-notifications-toolbar">
        <SectionHeader title="Pending Approvals" />
        {showMarkAll ? (
          <button type="button" className="ds-notifications-mark-read" onClick={() => void markAllRead()}>
            Mark all as read
          </button>
        ) : null}
      </div>

      <main className="ds-notifications-section">
        {loading ? (
          <EmptyState title="Loading notifications…" />
        ) : pending.length === 0 ? (
          <EmptyState
            icon={<BellIcon />}
            title="No pending approvals"
            description="You're all caught up. New visitor alerts will appear here."
          />
        ) : (
          <div className="ds-notifications-card">
            <ul className="ds-notifications-list" role="list">
              {pending.map((item) => {
                const isUnread = !readIds.has(item.name);
                return (
                  <li key={item.name}>
                    <button
                      type="button"
                      className={`ds-notif-row${isUnread ? " is-unread" : ""}`}
                      onClick={() => openPending(item)}
                    >
                      <VisitorAvatar
                        name={item.full_name || item.name}
                        photo={item.photo}
                        size={40}
                        className="vm-notif-avatar avatar-orange"
                      />
                      <div className="ds-notif-row__copy">
                        <strong>{item.full_name || item.name}</strong>
                        <span>
                          {item.person_to_meet_name || item.person_to_meet || "Awaiting assignment"}
                        </span>
                      </div>
                      <span className="ds-notif-row__time">
                        {formatTime(getCurrentStageTimestamp(item)) || "—"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <button
              type="button"
              className="ds-notifications-footer-btn"
              onClick={() => navigate("/approvals")}
            >
              Open visitors queue ›
            </button>
          </div>
        )}

        {savedAlerts.length > 0 ? (
          <section className="ds-notifications-section" aria-label="In-app alerts">
            <SectionHeader title="In-App & Confirmation Alerts" />
            <div className="ds-notifications-card">
              <ul className="ds-notifications-list" role="list">
                {savedAlerts.map((item) => {
                  const isUnread = !item.read;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        className={`ds-notif-row${isUnread ? " is-unread" : ""}`}
                        onClick={() => openSavedAlert(item)}
                      >
                        <div className="ds-notif-row__icon" aria-hidden>
                          <BellIcon size={20} />
                        </div>
                        <div className="ds-notif-row__copy">
                          <strong>{item.title}</strong>
                          <span>{item.message || "Visitor check-in / update"}</span>
                        </div>
                        <span className="ds-notif-row__time">
                          {formatTime(new Date(item.timestamp)) || "—"}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        ) : null}

        {alerts.length > 0 ? (
          <section className="ds-notifications-section" aria-label="Recent alerts">
            <SectionHeader title="Recent System Alerts" />
            <div className="ds-notifications-card">
              <ul className="ds-notifications-list" role="list">
                {alerts.map((item) => {
                  const isUnread = !item.read;
                  return (
                    <li key={item.name}>
                      <button
                        type="button"
                        className={`ds-notif-row${isUnread ? " is-unread" : ""}`}
                        onClick={() => void openAlert(item)}
                      >
                        <div className="ds-notif-row__icon" aria-hidden>
                          <BellIcon size={20} />
                        </div>
                        <div className="ds-notif-row__copy">
                          <strong>{item.subject || "Visitor update"}</strong>
                          <span>{item.email_content || item.document_name || "—"}</span>
                        </div>
                        <span className="ds-notif-row__time">{formatTime(item.creation) || "—"}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
