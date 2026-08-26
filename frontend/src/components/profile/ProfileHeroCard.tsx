import { useRef, useState } from "react";
import { initials } from "@/lib/format";
import { useAppLanguage } from "@/context/AppLanguageContext";
import { useAuth } from "@/context/AuthContext";
import { callMethod } from "@/api/vms";
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
  const { user } = useAuth();
  const [photo, setPhoto] = useState<string | undefined>(imageUrl);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInitials = initials(name);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) {
        setPhoto(dataUrl);
        try {
          if (user) user.user_image = dataUrl;
          await callMethod("visitor_management.auth.session.update_user_photo", {
            photo_data: dataUrl,
          });
        } catch {
          /* ignore */
        }
      }
      setBusy(false);
    };
    reader.readAsDataURL(file);
  };

  const displayImage = photo || imageUrl;

  return (
    <div className="vm-profile-modern-card">
      <div className="vm-profile-modern-header">
        <div
          className="vm-profile-avatar-container is-clickable"
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          title="Tap to change profile photo"
        >
          {displayImage ? (
            <img
              src={displayImage.startsWith("http") || displayImage.startsWith("/") || displayImage.startsWith("data:") ? displayImage : `/${displayImage}`}
              alt={name}
              className="vm-profile-avatar-img"
            />
          ) : (
            <div className="vm-profile-avatar-fallback">
              <span>{avatarInitials || "AD"}</span>
            </div>
          )}
          <div className="vm-avatar-upload-badge">
            {busy ? "..." : "📷"}
          </div>
          <span className="vm-profile-status-dot" title="Active" />
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handlePhotoSelect}
        />

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
