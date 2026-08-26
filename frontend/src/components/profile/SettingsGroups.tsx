import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { useAppLanguage } from "@/context/AppLanguageContext";
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

function SettingsGroupSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: string;
  children: ReactNode;
}) {
  return (
    <div className="vm-settings-modern-group">
      <div className="vm-settings-group-title">
        {icon && <span className="vm-settings-group-icon">{icon}</span>}
        <span>{title}</span>
      </div>
      <div className="vm-settings-group-card">{children}</div>
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
  icon?: string;
  label: string;
  value?: string;
  to?: string;
  onClick?: () => void;
}) {
  const inner = (
    <>
      <div className="vm-settings-row-left">
        {icon && <span className="vm-settings-row-icon">{icon}</span>}
        <span className="vm-settings-row-label">{label}</span>
      </div>
      <div className="vm-settings-row-trail">
        {value ? <span className="vm-settings-row-value">{value}</span> : null}
        <span className="vm-settings-chevron" aria-hidden>›</span>
      </div>
    </>
  );

  if (to) {
    return (
      <Link to={to} className="vm-settings-row-item">
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" className="vm-settings-row-item" onClick={onClick}>
      {inner}
    </button>
  );
}

export function SettingsGroups({
  showProfileCard = true,
  onToggleProfileCard,
}: SettingsGroupsProps) {
  const { lang, label, options, requestLangChange } = useAppLanguage();
  const { installed } = usePwaInstall();
  const [langModalOpen, setLangModalOpen] = useState(false);
  const showAppUpdate = installed || isPwaInstalled() || isNativePlatform();

  const handleSelectLang = (code: (typeof options)[number]["code"]) => {
    setLangModalOpen(false);
    requestLangChange(code);
  };

  return (
    <div className="vm-settings-modern-stack">
      {/* Group 1: Preferences & Appearance */}
      <SettingsGroupSection title={ut(lang, "appearance")} icon="🎨">
        <SettingsRowItem
          icon="🌐"
          label={ut(lang, "language")}
          value={label}
          onClick={() => setLangModalOpen(true)}
        />

        <SettingsRowItem
          icon="🪪"
          label={ut(lang, "profile")}
          value={showProfileCard ? "Visible" : "Hidden"}
          onClick={onToggleProfileCard}
        />
      </SettingsGroupSection>

      {/* Group 2: Alerts & Notifications */}
      <SettingsGroupSection title={ut(lang, "alerts")} icon="🔔">
        <NotificationSetupPrompt variant="settings" />
      </SettingsGroupSection>

      {/* Group 3: Workspace Tools */}
      <SettingsGroupSection title={ut(lang, "tools")} icon="⚙️">
        <SettingsRowItem icon="📅" label={ut(lang, "calendar_view")} to="/meetings" />
        {!isNativePlatform() ? (
          <div className="vm-settings-install-wrap">
            <PwaInstallButton variant="full" className="vm-settings-install-btn" />
          </div>
        ) : null}
        {showAppUpdate ? (
          <SettingsRowItem
            icon="🔄"
            label={ut(lang, "app_update")}
            onClick={() => void applyAppUpdate()}
          />
        ) : null}
      </SettingsGroupSection>

      {/* Clean iOS Language Picker Modal */}
      {langModalOpen && typeof document !== "undefined"
        ? createPortal(
            <div className="vm-lang-modal-root" role="dialog" aria-modal="true" aria-label="Select Language">
              <div className="vm-lang-modal-backdrop" onClick={() => setLangModalOpen(false)} aria-hidden />
              <div className="vm-lang-modal-sheet">
                <div className="vm-lang-modal-header">
                  <div className="vm-lang-modal-title">
                    <span className="vm-lang-modal-icon">🌐</span>
                    <strong>{ut(lang, "select_language")}</strong>
                  </div>
                  <button
                    type="button"
                    className="vm-lang-modal-close"
                    onClick={() => setLangModalOpen(false)}
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>

                <div className="vm-lang-modal-list">
                  {options.map((opt) => {
                    const isSelected = lang === opt.code;
                    return (
                      <button
                        key={opt.code}
                        type="button"
                        className={`vm-lang-modal-option${isSelected ? " is-selected" : ""}`}
                        onClick={() => handleSelectLang(opt.code)}
                      >
                        <span className="vm-lang-modal-option-name">{opt.label}</span>
                        {isSelected && <span className="vm-lang-modal-check">✓</span>}
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
