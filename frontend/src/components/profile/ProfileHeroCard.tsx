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
    <div className="ds-card ds-profile-hero">
      <div className="ds-profile-hero__header">
        <button
          type="button"
          className="ds-profile-hero__avatar-wrap"
          onClick={() => fileInputRef.current?.click()}
          title="Tap to change profile photo"
        >
          {displayImage ? (
            <img
              src={
                displayImage.startsWith("http") ||
                displayImage.startsWith("/") ||
                displayImage.startsWith("data:")
                  ? displayImage
                  : `/${displayImage}`
              }
              alt={name}
              className="ds-profile-hero__avatar"
            />
          ) : (
            <div className="ds-profile-hero__avatar-fallback">
              <span>{avatarInitials || "AD"}</span>
            </div>
          )}
          <span className="ds-profile-hero__avatar-badge" aria-hidden>
            {busy ? (
              <span style={{ fontSize: 10 }}>…</span>
            ) : (
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            )}
          </span>
          <span className="ds-profile-hero__status-dot" title="Active" />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handlePhotoSelect}
        />

        <div className="ds-profile-hero__identity">
          <div className="ds-profile-hero__name-row">
            <h2 className="ds-profile-hero__name">{name}</h2>
            <span className="ds-profile-hero__verified" aria-label="Verified">
              ✓
            </span>
          </div>
          <div className="ds-profile-hero__role">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>{role}</span>
          </div>
        </div>
      </div>

      <div className="ds-profile-hero__grid">
        <div className="ds-profile-hero__meta-item">
          <span className="ds-profile-hero__meta-label">{ut(lang, "employee_id")}</span>
          <strong className="ds-profile-hero__meta-value">{employeeId || "—"}</strong>
        </div>
        <div className="ds-profile-hero__meta-item">
          <span className="ds-profile-hero__meta-label">{ut(lang, "email")}</span>
          <strong className="ds-profile-hero__meta-value" title={email}>
            {email || "—"}
          </strong>
        </div>
        <div className="ds-profile-hero__meta-item">
          <span className="ds-profile-hero__meta-label">{ut(lang, "department")}</span>
          <strong className="ds-profile-hero__meta-value">{department || "Operations"}</strong>
        </div>
        <div className="ds-profile-hero__meta-item">
          <span className="ds-profile-hero__meta-label">Status</span>
          <strong className="ds-profile-hero__meta-value is-active">
            <span className="ds-live-pulse-dot" /> Active Session
          </strong>
        </div>
      </div>
    </div>
  );
}
