import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useVmsRealtimeEvent } from "@/hooks/useVmsRealtime";
import { HostAlertRingModal } from "@/components/alerts/HostAlertRingModal";
import {
  NotificationPermissionModal,
  clearNotificationPermissionSkip,
  needsBackgroundPushSetup,
  shouldShowNotificationPermissionModal,
} from "@/components/alerts/NotificationPermissionModal";
import { notificationApi, type AuthProfile } from "@/api/vms";
import { canApproveReject, resolveMode } from "@/lib/roles";
import {
  type ActiveHostAlert,
  type HostAlertPayload,
  primeHostAlertAudio,
  pushHostAlertNotification,
  startHostAlertReminders,
  startHostAlertRing,
  stopAllHostAlertReminders,
  stopHostAlertReminders,
  stopHostAlertRing,
} from "@/services/hostAlertManager";
import { routeForHostAlert } from "@/lib/notificationRoutes";
import { connectVmsSocket } from "@/services/vmsSocket";
import {
  initWebHostNotifications,
  requestNotificationPermission,
} from "@/native/services/notifications";

type HostAlertContextValue = {
  activeAlert: ActiveHostAlert | null;
  clearAlert: (visitorEntry: string) => void;
  goToPendingApprovals: () => void;
  openPermissionSetup: () => void;
};

const HostAlertContext = createContext<HostAlertContextValue | null>(null);

function currentUserIds(user: AuthProfile | null): string[] {
  if (!user) return [];
  const ids = [user.user, user.email]
    .map((v) => (typeof v === "string" ? v.trim().toLowerCase() : ""))
    .filter(Boolean);
  return [...new Set(ids)];
}

/** Subscribe to host urgent rings — host + gate logins; delivery still filtered by host_user. */
function isHostAlertRecipient(user: AuthProfile | null): boolean {
  if (!user?.authenticated) return false;
  const mode = resolveMode(user);
  if (mode === "visitor" || mode === "guest") return false;
  return mode === "host" || mode === "security";
}

/** Strict: urgent host ring only for the assigned host login (Host.user). */
function payloadTargetsCurrentHost(payload: HostAlertPayload, user: AuthProfile | null): boolean {
  const ids = currentUserIds(user);
  if (!ids.length) return false;
  if (ids.includes("administrator")) return true;
  const hostUser = (payload.host_user || "").trim().toLowerCase();
  const hostName = (payload.host || "").trim().toLowerCase();
  const userFullName = (user?.full_name || "").trim().toLowerCase();
  if (hostUser && ids.includes(hostUser)) return true;
  if (hostName && (ids.includes(hostName) || (userFullName && userFullName === hostName))) return true;
  return false;
}

function payloadTargetsCurrentCreator(payload: HostAlertPayload, user: AuthProfile | null): boolean {
  const ids = currentUserIds(user);
  if (!ids.length) return false;
  const owner = (payload.owner || "").trim().toLowerCase();
  if (!owner) return false;
  return ids.includes(owner);
}

function creatorAlertTitle(payload: HostAlertPayload): string {
  const event = payload.lifecycle_event || payload.event || "";
  switch (event) {
    case "approved":
      return "Visitor approved";
    case "rejected":
      return "Visitor rejected";
    case "meeting_done":
      return "Meeting completed";
    case "creator_alert": {
      if (payload.status === "Approved") return "Visitor approved";
      if (payload.status === "Rejected") return "Visitor rejected";
      if (payload.status === "Meeting Done") return "Meeting completed";
      return "Visitor update";
    }
    default:
      if (payload.status === "Approved") return "Visitor approved";
      if (payload.status === "Rejected") return "Visitor rejected";
      if (payload.status === "Meeting Done") return "Meeting completed";
      return "Visitor update";
  }
}

export function HostAlertProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const mode = resolveMode(user);
  const receivesHostAlerts = isHostAlertRecipient(user);
  const [alerts, setAlerts] = useState<Record<string, ActiveHostAlert>>({});
  /** Entries the host dismissed via Review — reminders still fire every 5 min until approve/reject. */
  const [suppressedEntries, setSuppressedEntries] = useState<Record<string, true>>({});
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  /** Avoid double-register when both dedicated alert channel and visitor_update arrive. */
  const securityAlertCooldownRef = useRef<Record<string, number>>({});
  const ringAlertCooldownRef = useRef<Record<string, number>>({});
  const seenAlertsRef = useRef<Set<string>>(new Set());

  const activeAlert = useMemo(() => {
    const list = Object.values(alerts).filter((a) => !suppressedEntries[a.visitorEntry]);
    if (!list.length) return null;
    return list.sort((a, b) => b.receivedAt - a.receivedAt)[0] ?? null;
  }, [alerts, suppressedEntries]);

  const clearAlert = useCallback((visitorEntry: string) => {
    stopHostAlertReminders(visitorEntry);
    seenAlertsRef.current.delete(visitorEntry);
    setSuppressedEntries((prev) => {
      if (!prev[visitorEntry]) return prev;
      const next = { ...prev };
      delete next[visitorEntry];
      return next;
    });
    setAlerts((prev) => {
      if (!prev[visitorEntry]) return prev;
      const next = { ...prev };
      delete next[visitorEntry];
      if (!Object.keys(next).length) stopHostAlertRing();
      return next;
    });
  }, []);

  const snoozeAlertModal = useCallback((visitorEntry?: string) => {
    stopHostAlertRing();
    if (!visitorEntry) return;
    setSuppressedEntries((prev) => ({ ...prev, [visitorEntry]: true }));
  }, []);

  const goToPendingApprovals = useCallback(() => {
    const current = Object.values(alerts).sort((a, b) => b.receivedAt - a.receivedAt)[0];
    snoozeAlertModal(current?.visitorEntry);
    navigate(current ? routeForHostAlert(current) : "/approvals");
  }, [alerts, navigate, snoozeAlertModal]);

  const onReminderTick = useCallback((next: ActiveHostAlert) => {
    const visitorEntry = next.visitorEntry;
    setAlerts((prev) => {
      if (!prev[visitorEntry]) return prev;
      return { ...prev, [visitorEntry]: next };
    });
    // Re-open the ring modal every 5 minutes until the visit is accepted/rejected.
    setSuppressedEntries((prev) => {
      if (!prev[visitorEntry]) return prev;
      const cleared = { ...prev };
      delete cleared[visitorEntry];
      return cleared;
    });
    startHostAlertRing();
  }, []);

  const withinRingCooldown = useCallback((key: string): boolean => {
    const now = Date.now();
    const lastAt = ringAlertCooldownRef.current[key] || 0;
    if (now - lastAt < 2500) return true;
    ringAlertCooldownRef.current[key] = now;
    return false;
  }, []);

  const registerAlert = useCallback(
    (payload: HostAlertPayload) => {
      const visitorEntry = payload.visitor_entry;
      if (!visitorEntry) return;

      // STRICT RULE 1: Host only receives Pending Approval alerts
      const isPending =
        payload.status === "Pending Approval" ||
        payload.status === "Pending" ||
        payload.lifecycle_event === "host_notified" ||
        payload.lifecycle_event === "created" ||
        payload.lifecycle_event === "transferred" ||
        payload.event === "host_notified" ||
        payload.event === "created" ||
        payload.event === "transferred" ||
        (payload.message || "").toLowerCase().includes("waiting") ||
        (payload.message || "").toLowerCase().includes("approval");

      if (!isPending) {
        // Suppress checkin, checkout, approved, rejected, meeting done from host popup
        return;
      }

      if (withinRingCooldown(`host:${visitorEntry}`)) return;

      const visitorName = payload.visitor_name || visitorEntry;
      const message = payload.message || `${visitorName} is waiting for your approval at the gate.`;
      const hostName = payload.host || "Host";
      const title = "Visitor waiting for approval";

      const alert: ActiveHostAlert = {
        visitorEntry,
        visitorName,
        message,
        hostName,
        receivedAt: Date.now(),
        reminderCount: 0,
        variant: "host",
        title,
      };

      setSuppressedEntries((prev) => {
        if (!prev[visitorEntry]) return prev;
        const next = { ...prev };
        delete next[visitorEntry];
        return next;
      });
      setAlerts((prev) => ({ ...prev, [visitorEntry]: alert }));

      void requestNotificationPermission();
      startHostAlertRing();
      void pushHostAlertNotification(visitorEntry, title, message, 0, routeForHostAlert(alert));
      startHostAlertReminders(alert, onReminderTick);
    },
    [onReminderTick, withinRingCooldown],
  );

  const registerCreatorAlert = useCallback(
    (payload: HostAlertPayload) => {
      const visitorEntry = payload.visitor_entry;
      if (!visitorEntry) return;
      if (withinRingCooldown(`creator:${visitorEntry}`)) return;

      const visitorName = payload.visitor_name || visitorEntry;
      const title = creatorAlertTitle(payload);
      const message = payload.message || `${visitorName}: ${title}`;
      const hostName = payload.host || "Host";

      const alert: ActiveHostAlert = {
        visitorEntry,
        visitorName,
        message,
        hostName,
        receivedAt: Date.now(),
        reminderCount: 0,
        variant: "creator",
        title,
      };

      setSuppressedEntries((prev) => {
        if (!prev[visitorEntry]) return prev;
        const next = { ...prev };
        delete next[visitorEntry];
        return next;
      });
      setAlerts((prev) => ({ ...prev, [visitorEntry]: alert }));

      void requestNotificationPermission();
      startHostAlertRing();
      void pushHostAlertNotification(visitorEntry, title, message, 0, routeForHostAlert(alert));

      startHostAlertReminders(alert, onReminderTick);
    },
    [onReminderTick, withinRingCooldown],
  );

  const registerSecurityAlert = useCallback(
    (payload: HostAlertPayload) => {
      const visitorEntry = payload.visitor_entry;
      if (!visitorEntry) return;

      // STRICT RULE 2: Security guard receives Check-in and Check-out alerts
      const subLower = (payload.message || "").toLowerCase();
      const event = payload.lifecycle_event || payload.event || "";
      const status = payload.status || "";

      const isCheckIn =
        event === "checked_in" || status === "Checked In" || subLower.includes("checked in");
      const isCheckOut =
        event === "checked_out" ||
        event === "security_checkout_required" ||
        status === "Checked Out" ||
        status === "Meeting Done" ||
        subLower.includes("checked out") ||
        subLower.includes("checkout");

      if (!isCheckIn && !isCheckOut) {
        return;
      }

      const now = Date.now();
      const lastAt = securityAlertCooldownRef.current[visitorEntry] || 0;
      if (now - lastAt < 2500) return;
      securityAlertCooldownRef.current[visitorEntry] = now;

      const visitorName = payload.visitor_name || visitorEntry;
      const title = isCheckIn ? "Visitor Checked In" : "Visitor Checked Out";
      const message =
        payload.message ||
        (isCheckIn
          ? `${visitorName} has checked in at the gate.`
          : `${visitorName} has checked out at the gate.`);
      const hostName = payload.host || "Host";

      const alert: ActiveHostAlert = {
        visitorEntry,
        visitorName,
        message,
        hostName,
        receivedAt: Date.now(),
        reminderCount: 0,
        variant: "security",
        title,
      };

      setSuppressedEntries((prev) => {
        if (!prev[visitorEntry]) return prev;
        const next = { ...prev };
        delete next[visitorEntry];
        return next;
      });
      setAlerts((prev) => ({ ...prev, [visitorEntry]: alert }));

      void requestNotificationPermission();
      startHostAlertRing();
      void pushHostAlertNotification(visitorEntry, title, message, 0, routeForHostAlert(alert));
    },
    [],
  );

  useVmsRealtimeEvent<HostAlertPayload>(
    "vms_host_alert",
    (payload) => {
      if (!receivesHostAlerts || !payload) return;
      if (!payloadTargetsCurrentHost(payload, user)) return;
      registerAlert(payload);
    },
    Boolean(user?.user) && receivesHostAlerts,
  );

  useVmsRealtimeEvent<HostAlertPayload>(
    "vms_creator_alert",
    (payload) => {
      if (!user?.authenticated || !payload) return;
      if (!payloadTargetsCurrentCreator(payload, user)) return;
      registerCreatorAlert(payload);
    },
    Boolean(user?.user),
  );

  useVmsRealtimeEvent<HostAlertPayload>(
    "vms_security_alert",
    (payload) => {
      if (mode !== "security") return;
      registerSecurityAlert(payload);
    },
    Boolean(user?.user) && mode === "security",
  );

  // Site-wide visitor_update — refresh lists only; urgent rings use dedicated user rooms.
  useVmsRealtimeEvent<HostAlertPayload>(
    "vms_visitor_update",
    (payload) => {
      if (!payload || !user?.authenticated) return;

      const visitorEntry = payload.visitor_entry;
      const event = payload.event;
      if (!visitorEntry || !event) return;

      // Clear previous ring when status moves past that recipient's job.
      if (event === "approved" || event === "rejected" || event === "meeting_done") {
        if (payloadTargetsCurrentHost(payload, user)) {
          clearAlert(visitorEntry);
        }
        return;
      }
      if (event === "checked_out") {
        clearAlert(visitorEntry);
      }
    },
    Boolean(user?.user),
  );

  useEffect(() => {
    if (!user?.user) {
      setPermissionModalOpen(false);
      return;
    }

    connectVmsSocket();

    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        // Refresh push subscription first when already allowed — do not race the modal check.
        await initWebHostNotifications();

        if (!(mode === "host" || mode === "security" || canApproveReject(user))) {
          if (!cancelled) setPermissionModalOpen(false);
          return;
        }

        const needsPush = await needsBackgroundPushSetup();
        const needsPermission = shouldShowNotificationPermissionModal();

        if (!cancelled) {
          setPermissionModalOpen(needsPush || needsPermission);
        }
      })();
    }, 600);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [user, mode]);

  useEffect(() => {
    if (!user?.user) return;

    const primeFeedback = () => {
      primeHostAlertAudio();
    };
    document.addEventListener("pointerdown", primeFeedback, { once: true });
    document.addEventListener("keydown", primeFeedback, { once: true });

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        connectVmsSocket();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      document.removeEventListener("pointerdown", primeFeedback);
      document.removeEventListener("keydown", primeFeedback);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [user?.user]);

  // Auto-sync unread alerts from backend Notification Log on login / reconnect
  useEffect(() => {
    if (!user?.authenticated || (!receivesHostAlerts && mode !== "security")) return;

    let mounted = true;
    const syncLatestAlerts = async () => {
      try {
        const notifs = await notificationApi.list(10);
        if (!mounted || !notifs || !notifs.length) return;

        const unreadAlert = notifs.find((n) => {
          if (n.read) return false;
          const sub = (n.subject || "").toLowerCase();
          const body = (n.email_content || "").toLowerCase();

          if (mode === "security") {
            return (
              sub.includes("checked in") ||
              body.includes("checked in") ||
              sub.includes("check in") ||
              body.includes("check in") ||
              sub.includes("checked out") ||
              body.includes("checked out") ||
              sub.includes("check out") ||
              body.includes("check out") ||
              sub.includes("checkout") ||
              body.includes("checkout")
            );
          }

          if (mode === "host") {
            const isCheckout = sub.includes("check out") || sub.includes("checked out") || body.includes("check out") || body.includes("checked out");
            const isCheckIn = sub.includes("check in") || sub.includes("checked in") || body.includes("check in") || body.includes("checked in");
            if (isCheckout || isCheckIn) return false;

            return (
              (n.document_type === "Visitor Entry" || Boolean(n.document_name)) &&
              (sub.includes("waiting") ||
                sub.includes("approval") ||
                sub.includes("pending") ||
                body.includes("waiting") ||
                body.includes("approval") ||
                body.includes("pending"))
            );
          }

          return false;
        });

        if (unreadAlert && unreadAlert.document_name) {
          if (unreadAlert.name) {
            void notificationApi.markRead(unreadAlert.name).catch(() => {});
          }

          const entryName = unreadAlert.document_name;
          if (seenAlertsRef.current.has(entryName)) return;
          seenAlertsRef.current.add(entryName);

          const subject = unreadAlert.subject || "Visitor update";
          const body = unreadAlert.email_content || subject;
          const subLower = subject.toLowerCase();
          const bodyLower = body.toLowerCase();

          const visitorName =
            body.replace(/^Visitor\s+/i, "").split(/\s+(?:is|has)\s+/i)[0]?.trim() ||
            subject.replace(/^Visitor\s+/i, "").split(/\s+(?:waiting|checked)/i)[0]?.trim() ||
            entryName;

          if (mode === "security") {
            const isCheckIn = subLower.includes("checked in") || bodyLower.includes("checked in") || subLower.includes("check in");
            registerSecurityAlert({
              visitor_entry: entryName,
              visitor_name: visitorName,
              message: body,
              status: isCheckIn ? "Checked In" : "Checked Out",
              lifecycle_event: isCheckIn ? "checked_in" : "checked_out",
              event: isCheckIn ? "checked_in" : "checked_out",
            });
          } else if (mode === "host") {
            registerAlert({
              visitor_entry: entryName,
              visitor_name: visitorName,
              message: body,
              host: user.full_name || user.user || undefined,
              host_user: user.user || undefined,
              lifecycle_event: "host_notified",
              event: "host_notified",
              status: "Pending Approval",
            });
          }
        }
      } catch {
        /* best-effort background sync */
      }
    };

    void syncLatestAlerts();
    const interval = window.setInterval(() => {
      void syncLatestAlerts();
    }, 4500);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, [user, registerAlert, registerSecurityAlert, receivesHostAlerts, mode]);

  useEffect(() => {
    return () => {
      stopAllHostAlertReminders();
    };
  }, []);

  const handleReview = useCallback(() => {
    const current = Object.values(alerts).sort((a, b) => b.receivedAt - a.receivedAt)[0];
    snoozeAlertModal(current?.visitorEntry);
    navigate(current ? routeForHostAlert(current) : "/approvals");
  }, [alerts, navigate, snoozeAlertModal]);

  const openPermissionSetup = useCallback(() => {
    clearNotificationPermissionSkip();
    setPermissionModalOpen(true);
  }, []);

  const showPermissionModal =
    permissionModalOpen && (mode === "host" || mode === "security") && Boolean(user?.user);

  const value = useMemo<HostAlertContextValue>(
    () => ({
      activeAlert,
      clearAlert,
      goToPendingApprovals,
      openPermissionSetup,
    }),
    [activeAlert, clearAlert, goToPendingApprovals, openPermissionSetup],
  );

  return (
    <HostAlertContext.Provider value={value}>
      <NotificationPermissionModal
        open={showPermissionModal}
        onClose={() => setPermissionModalOpen(false)}
        onEnabled={() => {
          window.dispatchEvent(new CustomEvent("vms-alerts-setup"));
        }}
      />
      {children}
      {activeAlert ? (
        <HostAlertRingModal
          alert={activeAlert}
          onReview={handleReview}
          onClose={() => snoozeAlertModal(activeAlert.visitorEntry)}
        />
      ) : null}
    </HostAlertContext.Provider>
  );
}

export function useHostAlerts(): HostAlertContextValue {
  const ctx = useContext(HostAlertContext);
  if (!ctx) {
    throw new Error("useHostAlerts must be used within HostAlertProvider");
  }
  return ctx;
}
