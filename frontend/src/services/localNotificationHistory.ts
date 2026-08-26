export interface SavedInAppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  variant?: string;
  visitorEntry?: string;
  route?: string;
  read?: boolean;
}

const STORAGE_KEY = "vms_saved_in_app_notifications";

export function getSavedNotifications(): SavedInAppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveNotificationToHistory(item: Omit<SavedInAppNotification, "timestamp"> & { timestamp?: number }): void {
  try {
    const list = getSavedNotifications();
    const existingIndex = list.findIndex((n) => n.id === item.id || (item.visitorEntry && n.visitorEntry === item.visitorEntry && n.title === item.title));
    
    const entry: SavedInAppNotification = {
      ...item,
      timestamp: item.timestamp || Date.now(),
      read: false,
    };

    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...entry };
    } else {
      list.unshift(entry);
    }

    // Keep max 50 recent notifications
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 50)));
    window.dispatchEvent(new CustomEvent("vms-notifications-updated"));
  } catch {
    /* ignore storage errors */
  }
}

export function markSavedNotificationRead(id: string): void {
  try {
    const list = getSavedNotifications();
    const updated = list.map((n) => (n.id === id ? { ...n, read: true } : n));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("vms-notifications-updated"));
  } catch {
    /* ignore */
  }
}

export function markAllSavedNotificationsRead(): void {
  try {
    const list = getSavedNotifications();
    const updated = list.map((n) => ({ ...n, read: true }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("vms-notifications-updated"));
  } catch {
    /* ignore */
  }
}
