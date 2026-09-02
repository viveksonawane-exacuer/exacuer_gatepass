import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { useAppLanguage } from "@/context/AppLanguageContext";
import { useAppTheme } from "@/context/AppThemeContext";
import { NotificationSetupPrompt } from "@/components/alerts/NotificationSetupPrompt";
import { PwaInstallButton } from "@/components/ui/PwaInstallButton";
import { applyAppUpdate, isPwaInstalled } from "@/lib/pwaUpdate";
import { isNativePlatform } from "@/native/platform";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { ut } from "@/i18n/uiChrome";

type SettingsGroupsProps = {
  showProfileCard?: boolean;
  onToggleProfileCard?: () => void;
};

function IconPalette() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="13.5" cy="6.5" r="2.5" />
      <circle cx="17.5" cy="10.5" r="2.5" />
      <circle cx="8.5" cy="7.5" r="2.5" />
      <circle cx="6.5" cy="12.5" r="2.5" />
      <path d="M12 22a10 10 0 0 0 10-10" />
    </svg>
  );
}

function IconGlobe() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconRefresh() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function SettingsGroupSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="ds-settings-group">
      <div className="ds-settings-group__title">
        {icon ? <span className="ds-settings-group__icon">{icon}</span> : null}
        <span>{title}</span>
      </div>
      <div className="ds-settings-group__card">{children}</div>
    </div>
  );
}

function SettingsRowItem({
  icon,
  label,
  value,
  to,
  onClick,
}: {
  icon?: ReactNode;
  label: string;
  value?: string;
  to?: string;
  onClick?: () => void;
}) {
  const inner = (
    <>
      <div className="ds-settings-row__left">
        {icon ? <span className="ds-settings-row__icon">{icon}</span> : null}
        <span className="ds-settings-row__label">{label}</span>
      </div>
      <div className="ds-settings-row__trail">
        {value ? <span className="ds-settings-row__value">{value}</span> : null}
        <span className="ds-settings-row__chevron" aria-hidden>
          ›
        </span>
      </div>
    </>
  );

  if (to) {
    return (
      <Link to={to} className="ds-settings-row">
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" className="ds-settings-row" onClick={onClick}>
      {inner}
    </button>
  );
}

export function SettingsGroups({
  showProfileCard = true,
  onToggleProfileCard,
}: SettingsGroupsProps) {
  const { lang, label, options, requestLangChange } = useAppLanguage();
  const { themeColor, setThemeColor, options: themeOptions, activeTheme } = useAppTheme();
  const { installed } = usePwaInstall();
  const [langModalOpen, setLangModalOpen] = useState(false);
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const showAppUpdate = installed || isPwaInstalled() || isNativePlatform();

  const handleSelectLang = (code: (typeof options)[number]["code"]) => {
    setLangModalOpen(false);
    requestLangChange(code);
  };

  return (
    <div className="ds-settings-stack">
      <SettingsGroupSection title={ut(lang, "appearance")} icon={<IconPalette />}>
        <SettingsRowItem
          icon={<IconPalette />}
          label="App Theme Color"
          value={activeTheme.name}
          onClick={() => setThemeModalOpen(true)}
        />

        <SettingsRowItem
          icon={<IconGlobe />}
          label={ut(lang, "language")}
          value={label}
          onClick={() => setLangModalOpen(true)}
        />

        <SettingsRowItem
          icon={<IconUser />}
          label={ut(lang, "profile")}
          value={showProfileCard ? "Visible" : "Hidden"}
          onClick={onToggleProfileCard}
        />
      </SettingsGroupSection>

      <SettingsGroupSection title={ut(lang, "alerts")} icon={<IconBell />}>
        <NotificationSetupPrompt variant="settings" />
      </SettingsGroupSection>

      <SettingsGroupSection title={ut(lang, "tools")} icon={<IconSettings />}>
        <SettingsRowItem icon={<IconCalendar />} label={ut(lang, "calendar_view")} to="/meetings" />
        {!isNativePlatform() ? (
          <div className="ds-settings-install-wrap">
            <PwaInstallButton variant="full" className="vm-settings-install-btn" />
          </div>
        ) : null}
        {showAppUpdate ? (
          <SettingsRowItem
            icon={<IconRefresh />}
            label={ut(lang, "app_update")}
            onClick={() => void applyAppUpdate()}
          />
        ) : null}
      </SettingsGroupSection>

      {themeModalOpen && typeof document !== "undefined"
        ? createPortal(
            <div className="ds-sheet-modal-root" role="dialog" aria-modal="true" aria-label="Select Theme Color">
              <div className="ds-sheet-modal-backdrop" onClick={() => setThemeModalOpen(false)} aria-hidden />
              <div className="ds-sheet-modal">
                <div className="ds-sheet-modal__header">
                  <div className="ds-sheet-modal__title">
                    <IconPalette />
                    <strong>Select Theme Color</strong>
                  </div>
                  <button
                    type="button"
                    className="ds-sheet-modal__close"
                    onClick={() => setThemeModalOpen(false)}
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>

                <div className="ds-theme-grid">
                  {themeOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className={`ds-theme-option${themeColor === opt.id ? " is-active" : ""}`}
                      onClick={() => {
                        setThemeColor(opt.id);
                        setThemeModalOpen(false);
                      }}
                    >
                      <div className="ds-theme-option__swatch" style={{ background: opt.previewGradient }}>
                        {themeColor === opt.id ? "✓" : null}
                      </div>
                      <span className="ds-theme-option__name">{opt.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {langModalOpen && typeof document !== "undefined"
        ? createPortal(
            <div className="ds-sheet-modal-root" role="dialog" aria-modal="true" aria-label="Select Language">
              <div className="ds-sheet-modal-backdrop" onClick={() => setLangModalOpen(false)} aria-hidden />
              <div className="ds-sheet-modal">
                <div className="ds-sheet-modal__header">
                  <div className="ds-sheet-modal__title">
                    <IconGlobe />
                    <strong>{ut(lang, "select_language")}</strong>
                  </div>
                  <button
                    type="button"
                    className="ds-sheet-modal__close"
                    onClick={() => setLangModalOpen(false)}
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>

                <div className="ds-lang-list">
                  {options.map((opt) => {
                    const isSelected = lang === opt.code;
                    return (
                      <button
                        key={opt.code}
                        type="button"
                        className={`ds-lang-option${isSelected ? " is-selected" : ""}`}
                        onClick={() => handleSelectLang(opt.code)}
                      >
                        <span>{opt.label}</span>
                        {isSelected ? <span aria-hidden>✓</span> : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
