import { useNavigate } from "react-router-dom";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { useAuth } from "@/context/AuthContext";

/** Shown when an ERPNext user signs in without Visitor Entry DocPerm access. */
export function MobileAccessDeniedPage() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  async function handleSignOut() {
    await logout();
    navigate("/", { replace: true });
  }

  return (
    <div className="ds-auth-page">
      <div className="ds-auth-frame">
        <div className="ds-auth-intro">
          <BrandLogo variant="full" className="welcome-wordmark" />
          <h1 className="ds-auth-title">Access restricted</h1>
          <p className="ds-auth-subtitle">
            {user?.full_name || user?.user || "This account"} does not have Visitor Management access.
            Ask an administrator to grant Visitor Entry permissions in Role Permission Manager.
          </p>
        </div>
        <button type="button" className="ds-btn-primary ds-auth-submit" onClick={() => void handleSignOut()}>
          Sign out
        </button>
      </div>
    </div>
  );
}
