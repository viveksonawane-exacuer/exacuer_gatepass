import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useAppLanguage } from "@/context/AppLanguageContext";
import { frappeGetList } from "@/api/vms";
import { ProfileHeroCard } from "@/components/profile/ProfileHeroCard";
import { SettingsGroups } from "@/components/profile/SettingsGroups";
import { ut } from "@/i18n/uiChrome";
import { usePageChrome } from "@/context/PageChromeContext";

type EmployeeRow = {
  name?: string;
  employee?: string;
  department?: string;
  designation?: string;
};

export function MobileProfilePage() {
  const { user, logout, isAuthenticated } = useAuth();
  const { lang } = useAppLanguage();

  usePageChrome({
    title: ut(lang, "profile"),
    subtitle: "Account & settings",
    showBack: true,
    backTo: "/",
    showNotification: false,
    showProfile: false,
  });

  const [department, setDepartment] = useState("—");
  const [employeeId, setEmployeeId] = useState(user?.user || "—");
  const [showProfileCard, setShowProfileCard] = useState(true);

  const name = user?.full_name || user?.user || "Administrator";
  const email = user?.email || user?.user || "—";
  const role = user?.vms_roles?.[0] || user?.roles?.find((r) => r !== "All" && r !== "Guest") || "PA Security Guard";
  const image = user?.user_image || undefined;

  useEffect(() => {
    setEmployeeId(user?.user || "—");
    if (!user?.user || user.user === "Guest") return;

    let cancelled = false;
    void frappeGetList<EmployeeRow>({
      doctype: "Employee",
      fields: ["name", "employee", "department", "designation"],
      filters: { user_id: user.user },
      limit_page_length: 1,
    })
      .then((rows) => {
        if (cancelled) return;
        const row = rows[0];
        if (!row) return;
        if (row.employee || row.name) setEmployeeId(row.employee || row.name || user.user || "—");
        if (row.department) setDepartment(row.department);
        else if (row.designation) setDepartment(row.designation);
      })
      .catch(() => {
        /* Employee DocType may be unavailable */
      });

    return () => {
      cancelled = true;
    };
  }, [user?.user]);

  return (
    <div className="ds-profile-page">
      <main className="ds-profile-container">
        {showProfileCard ? (
          <ProfileHeroCard
            name={name}
            email={email}
            role={role}
            imageUrl={image}
            employeeId={employeeId}
            department={department}
          />
        ) : null}

        <SettingsGroups
          showProfileCard={showProfileCard}
          onToggleProfileCard={() => setShowProfileCard((prev) => !prev)}
        />

        <div className="ds-profile-session">
          {isAuthenticated || user?.verified ? (
            <button
              type="button"
              className="ds-profile-logout-btn"
              onClick={() => void logout()}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              <span>{ut(lang, "logout")}</span>
            </button>
          ) : (
            <Link to="/" className="ds-btn-primary">
              {ut(lang, "sign_in")}
            </Link>
          )}

          <div className="ds-profile-app-meta">
            <span>Exacuer GatePass VMS • v2.4.0</span>
            <span>Secured & Powered by Frappe Framework</span>
          </div>
        </div>
      </main>
    </div>
  );
}
