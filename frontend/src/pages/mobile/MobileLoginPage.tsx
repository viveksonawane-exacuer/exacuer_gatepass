import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { authApi } from "@/api/vms";
import { useAuth } from "@/context/AuthContext";
import { extractError } from "@/lib/format";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { firstAllowedPath, hasVmsAppAccess } from "@/lib/roles";

/** PWA login — ERPNext username/email + password only. */
export function MobileLoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, setProfile, loading, user } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!loading && (isAuthenticated || user?.verified) && hasVmsAppAccess(user)) {
    return <Navigate to={firstAllowedPath(user)} replace />;
  }

  if (!loading && isAuthenticated && user && !hasVmsAppAccess(user)) {
    return <Navigate to="/access-denied" replace />;
  }

  async function onPasswordLogin(e: FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError("Please enter your ERPNext Username/Email and Password.");
      return;
    }
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      const res = await authApi.loginWithPassword(username.trim(), password);
      const profile = {
        ...res,
        verified: true,
        authenticated: true,
      };
      if (!hasVmsAppAccess(profile)) {
        try {
          await authApi.logout();
        } catch {
          /* ignore */
        }
        setProfile(null);
        setError(
          "No Visitor Management access. Ask an administrator to grant Visitor Entry permissions in Role Permission Manager.",
        );
        return;
      }
      setProfile(profile);
      navigate(firstAllowedPath(profile), { replace: true });
    } catch (err: unknown) {
      setError(extractError(err, "Invalid ERPNext username or password"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ds-auth-page ds-auth-page--soft">
      <div className="ds-auth-hero" aria-hidden>
        <span className="ds-auth-hero__orb ds-auth-hero__orb--a" />
        <span className="ds-auth-hero__orb ds-auth-hero__orb--b" />
      </div>

      <div className="ds-auth-frame ds-auth-frame--soft">
        <div className="ds-auth-brand-panel">
          <BrandLogo variant="full" className="welcome-wordmark ds-auth-brand-logo" />
          <span className="ds-auth-pill">Visitor Management</span>
          <h1 className="ds-auth-title">Welcome back</h1>
          <p className="ds-auth-subtitle">
            Sign in with your ERPNext account to manage gate approvals and live visitors.
          </p>
        </div>

        <form className="ds-auth-form ds-auth-form--soft" onSubmit={onPasswordLogin}>
          <div className="ds-auth-form__head">
            <strong>ERPNext Sign In</strong>
            <span>Username or email + password</span>
          </div>

          <div className="ds-auth-field">
            <label className="ds-auth-label" htmlFor="login-username">
              Username / Email
            </label>
            <div className="ds-auth-input-shell">
              <span className="ds-auth-input-icon" aria-hidden>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <input
                id="login-username"
                type="text"
                className="ds-input ds-auth-input"
                placeholder="name@company.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoCapitalize="none"
                autoComplete="username"
              />
            </div>
          </div>

          <div className="ds-auth-field">
            <label className="ds-auth-label" htmlFor="login-password">
              Password
            </label>
            <div className="ds-auth-input-shell">
              <span className="ds-auth-input-icon" aria-hidden>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                className="ds-input ds-auth-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="ds-auth-password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {error ? <p className="ds-auth-error">{error}</p> : null}
          {message ? <p className="ds-auth-msg">{message}</p> : null}

          <button type="submit" className="ds-btn-primary ds-auth-submit" disabled={busy}>
            {busy ? "Signing in…" : "Continue"}
          </button>

          <p className="ds-auth-footnote">Secure access · Exacuer Global VMS</p>
        </form>
      </div>
    </div>
  );
}
