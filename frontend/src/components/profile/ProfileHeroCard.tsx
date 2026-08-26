import { initials } from "@/lib/format";
import { useAppLanguage } from "@/context/AppLanguageContext";
import { ut } from "@/i18n/uiChrome";

interface ProfileHeroCardProps {
  name?: string;
  role?: string;
  email?: string;
  employeeId?: string;
  department?: string;
  imageUrl?: string;
}

export function ProfileHeroCard({
  name = "Administrator",
  role = "Employee",
  email = "—",
  employeeId = "—",
  department = "—",
  imageUrl,
}: ProfileHeroCardProps) {
  const { lang } = useAppLanguage();
  const avatarInitials = initials(name);

  return (
    <div className="vm-profile-modern-card">
      <div className="vm-profile-modern-header">
        <div className="vm-profile-avatar-container">
          {imageUrl ? (
            <img
              src={imageUrl.startsWith("http") || imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`}
              alt={name}
              className="vm-profile-avatar-img"
            />
          ) : (
            <div className="vm-profile-avatar-fallback">
              <span>{avatarInitials || "AD"}</span>
            </div>
          )}
          <span className="vm-profile-status-dot" title="Active" />
        </div>

        <div className="vm-profile-identity-box">
          <div className="vm-profile-name-row">
            <h2 className="vm-profile-name">{name}</h2>
            <span className="vm-profile-verified-badge">✓</span>
          </div>
          <div className="vm-profile-role-pill">
            <span className="vm-profile-role-icon">🛡️</span>
            <span>{role}</span>
          </div>
        </div>
      </div>

      <div className="vm-profile-grid-meta">
        <div className="vm-profile-meta-item">
          <span className="vm-profile-meta-label">{ut(lang, "employee_id")}</span>
          <strong className="vm-profile-meta-val">{employeeId || "—"}</strong>
        </div>
        <div className="vm-profile-meta-item">
          <span className="vm-profile-meta-label">{ut(lang, "email")}</span>
          <strong className="vm-profile-meta-val" title={email}>{email || "—"}</strong>
        </div>
        <div className="vm-profile-meta-item">
          <span className="vm-profile-meta-label">{ut(lang, "department")}</span>
          <strong className="vm-profile-meta-val">{department || "Operations"}</strong>
        </div>
        <div className="vm-profile-meta-item">
          <span className="vm-profile-meta-label">Status</span>
          <strong className="vm-profile-meta-val vm-profile-status-val">
            <span className="vm-live-pulse-dot" /> Active Session
          </strong>
        </div>
      </div>
    </div>
  );
}
