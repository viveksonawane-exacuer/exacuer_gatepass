import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { callMethod, dashboardApi, notificationApi, visitorApi, type InAppNotification, type VisitorListRow } from "@/api/vms";
import { useAuth } from "@/context/AuthContext";
import { useAppLanguage } from "@/context/AppLanguageContext";
import { useAppTheme } from "@/context/AppThemeContext";
import { useVmsRealtime } from "@/hooks/useVmsRealtime";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { PwaAppUpdateButton } from "@/components/ui/PwaAppUpdateButton";
import { NotificationSetupPrompt } from "@/components/alerts/NotificationSetupPrompt";
import {
  NotificationPreviewPopover,
  buildNotificationPreviewItems,
} from "@/components/common/NotificationPreviewPopover";
import { IconBell } from "@/components/ui/MobileIcons";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { SheetModal } from "@/components/design-system/SheetModal";
import { COMPANY_NAME, APP_TAGLINE } from "@/config/env";
import { initials } from "@/lib/format";
import { ut } from "@/i18n/uiChrome";
import { hasCapability, userHostScopeFilters } from "@/lib/roles";

interface HeaderBarProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  showNotification?: boolean;
  showProfile?: boolean;
}

function resolveUserImage(path?: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("data:") || path.startsWith("blob:")) return path;
  return path.startsWith("/") ? path : `/${path}`;
}

function IconCamera() {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function IconPalette() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="13.5" cy="6.5" r="2.5" />
      <circle cx="17.5" cy="10.5" r="2.5" />
      <circle cx="8.5" cy="7.5" r="2.5" />
      <circle cx="6.5" cy="12.5" r="2.5" />
      <path d="M12 22a10 10 0 0 0 10-10" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 11h18" />
    </svg>
  );
}

export function HeaderBar({
  title = "Exacuer Global",
  subtitle = "MAIN GATE DESK",
  showBack = false,
  onBack,
  showNotification = true,
  showProfile = true,
}: HeaderBarProps) {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { lang } = useAppLanguage();
  const { themeColor, setThemeColor, options: themeOptions } = useAppTheme();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [notifyPreview, setNotifyPreview] = useState<{
    pending: VisitorListRow[];
    alerts: InAppNotification[];
  }>({ pending: [], alerts: [] });
  const [customPhoto, setCustomPhoto] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const notifyAnchorRef = useRef<HTMLDivElement>(null);

  const photo = customPhoto || resolveUserImage(user?.user_image);
  const displayName = user?.full_name || user?.user || "User";
  const canSeeNotifications = hasCapability(user, "notifications");
  const previewItems = buildNotificationPreviewItems(notifyPreview.pending, notifyPreview.alerts, lang);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoBusy(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) {
        setCustomPhoto(dataUrl);
        try {
          if (user) user.user_image = dataUrl;
          await callMethod("visitor_management.auth.session.update_user_photo", {
            photo_data: dataUrl,
          });
        } catch {
          /* ignore */
        }
      }
      setPhotoBusy(false);
    };
    reader.readAsDataURL(file);
  };

  const loadNotificationData = useCallback(async () => {
    if (authLoading || !isAuthenticated || !canSeeNotifications) {
      setPendingCount(0);
      setNotifyPreview({ pending: [], alerts: [] });
      return;
    }
    try {
      const [list, alerts] = await Promise.all([
        visitorApi.listDetailed(100, userHostScopeFilters(user)),
        notificationApi.list(40).catch(() => []),
      ]);
      const pendingRows = (list || []).filter(
        (row) => row.status === "Pending Approval" || row.status === "Pending",
      );
      const unreadAlerts = (alerts || []).filter((row) => !row.read).length;
      setPendingCount(pendingRows.length + unreadAlerts);
      setNotifyPreview({ pending: pendingRows, alerts: alerts || [] });
    } catch {
      try {
        const list = await dashboardApi.getPendingApprovals();
        setPendingCount(list?.length || 0);
        setNotifyPreview({ pending: list || [], alerts: [] });
      } catch {
        setPendingCount(0);
        setNotifyPreview({ pending: [], alerts: [] });
      }
    }
  }, [authLoading, isAuthenticated, canSeeNotifications, user]);

  useEffect(() => {
    void loadNotificationData();
    const interval = window.setInterval(() => {
      void loadNotificationData();
    }, 15_000);
    return () => window.clearInterval(interval);
  }, [loadNotificationData]);

  useVmsRealtime(() => {
    void loadNotificationData();
  }, isAuthenticated);

  useEffect(() => {
    if (!notifyOpen) return;
    setNotifyLoading(true);
    void loadNotificationData().finally(() => setNotifyLoading(false));
  }, [notifyOpen, loadNotificationData]);

  function openPhotoPicker() {
    fileInputRef.current?.click();
  }

  function toggleNotifyPopover() {
    setNotifyOpen((open) => !open);
    setProfileOpen(false);
  }

  return (
    <>
      <header className={`ds-topbar${showBack ? " ds-topbar--page" : ""}`}>
        <div className="ds-topbar__inner">
          {showBack ? (
            <div className="ds-topbar__brand">
              <button
                type="button"
                className="ds-topbar__back"
                onClick={onBack || (() => navigate(-1))}
                aria-label="Go back"
                title="Go back"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
              </button>
              <div className="ds-topbar__titles">
                <h1 className="ds-topbar__title">{title}</h1>
                <span className="ds-topbar__subtitle">{subtitle}</span>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="ds-topbar__company"
              onClick={() => navigate("/profile")}
              aria-label="Open settings"
              title="Open Settings"
            >
              <div className="ds-topbar__company-logo-wrap">
                <BrandLogo variant="icon" className="ds-topbar__company-logo" alt={COMPANY_NAME} />
                <span className="ds-topbar__live-dot" aria-hidden />
              </div>
              <div className="ds-topbar__company-copy">
                <strong className="ds-topbar__company-name">{COMPANY_NAME}</strong>
                <span className="ds-topbar__company-sub">{APP_TAGLINE}</span>
              </div>
            </button>
          )}

          <div className="ds-topbar__actions">
            {showNotification && canSeeNotifications ? (
              <div className="ds-topbar__notify-wrap" ref={notifyAnchorRef}>
                <button
                  type="button"
                  className={`ds-topbar__icon-btn${notifyOpen ? " is-active" : ""}`}
                  onClick={toggleNotifyPopover}
                  aria-label="Notifications"
                  aria-expanded={notifyOpen}
                  title="Notifications"
                >
                  <IconBell size={18} />
                  {pendingCount > 0 ? <span className="ds-topbar__badge-dot" aria-hidden /> : null}
                </button>
                <NotificationPreviewPopover
                  open={notifyOpen}
                  onClose={() => setNotifyOpen(false)}
                  lang={lang}
                  loading={notifyLoading}
                  items={previewItems}
                  anchorRef={notifyAnchorRef}
                />
              </div>
            ) : null}

            <LanguageSwitcher variant="icon" />

            {showProfile ? (
              <button
                type="button"
                className={`ds-topbar__icon-btn${profileOpen ? " is-active" : ""}`}
                onClick={() => {
                  setNotifyOpen(false);
                  setProfileOpen(true);
                }}
                aria-label="User profile menu"
                title="Profile menu"
              >
                {photo ? (
                  <img src={photo} alt="" className="ds-topbar__avatar" />
                ) : (
                  <span className="ds-topbar__avatar-fallback">{initials(displayName)}</span>
                )}
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <SheetModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        title="Quick menu"
        ariaLabel="Profile quick menu"
      >
        <div className="ds-profile-sheet">
          <div className="ds-profile-sheet__user">
            <div
              className="ds-profile-sheet__avatar-wrap"
              role="button"
              tabIndex={0}
              onClick={openPhotoPicker}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") openPhotoPicker();
              }}
              title="Change profile photo"
            >
              {photo ? (
                <img src={photo} alt="" className="ds-profile-sheet__avatar" />
              ) : (
                <span className="ds-profile-sheet__avatar-fallback">{initials(displayName)}</span>
              )}
              <span className="ds-profile-sheet__avatar-badge" aria-hidden>
                <IconCamera />
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handlePhotoUpload}
            />

            <div className="ds-profile-sheet__copy">
              <strong>{displayName}</strong>
              <span>{user?.email || user?.user || "Signed in"}</span>
              <button type="button" className="ds-profile-sheet__photo-link" onClick={openPhotoPicker}>
                {photoBusy ? "Uploading…" : "Change photo"}
              </button>
            </div>
          </div>

          <div>
            <div className="ds-profile-sheet__section-title">
              <span>
                <IconPalette />
                Accent color
              </span>
              <span>{themeOptions.find((t) => t.id === themeColor)?.name}</span>
            </div>
            <div className="ds-theme-grid">
              {themeOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`ds-theme-option${themeColor === opt.id ? " is-active" : ""}`}
                  onClick={() => setThemeColor(opt.id)}
                  aria-label={`Select ${opt.name} theme`}
                  title={opt.name}
                >
                  <div className="ds-theme-option__swatch" style={{ background: opt.primary }} />
                  <span className="ds-theme-option__name">{opt.name}</span>
                </button>
              ))}
            </div>
          </div>

          <NotificationSetupPrompt variant="popup" onAction={() => setProfileOpen(false)} />
          <PwaAppUpdateButton variant="popup" onStarted={() => setProfileOpen(false)} />

          <div className="ds-settings-group__card">
            <button
              type="button"
              className="ds-settings-row"
              onClick={() => {
                setProfileOpen(false);
                navigate("/meetings");
              }}
            >
              <span className="ds-settings-row__left">
                <span className="ds-settings-row__icon">{<IconCalendar />}</span>
                <span className="ds-settings-row__label">{ut(lang, "calendar_view")}</span>
              </span>
              <span className="ds-settings-row__trail">
                <span className="ds-settings-row__value">{ut(lang, "todays_schedule")}</span>
                <span className="ds-settings-row__chevron" aria-hidden>
                  ›
                </span>
              </span>
            </button>
            <button
              type="button"
              className="ds-settings-row"
              onClick={() => {
                setProfileOpen(false);
                navigate("/profile");
              }}
            >
              <span className="ds-settings-row__left">
                <span className="ds-settings-row__label">{ut(lang, "settings")}</span>
              </span>
              <span className="ds-settings-row__trail">
                <span className="ds-settings-row__chevron" aria-hidden>
                  ›
                </span>
              </span>
            </button>
          </div>
        </div>
      </SheetModal>
    </>
  );
}
