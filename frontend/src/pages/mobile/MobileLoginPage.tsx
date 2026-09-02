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
    <div className="ds-auth-page">
      <div className="ds-auth-frame">
        <span className="ds-auth-pill">ERPNext Sign In</span>

        <div className="ds-auth-intro">
          <BrandLogo variant="full" className="welcome-wordmark" />
          <h1 className="ds-auth-title">Sign In to Exacuer Global</h1>
          <p className="ds-auth-subtitle">Use your ERPNext username or email and password</p>
        </div>

        <form className="ds-auth-form" onSubmit={onPasswordLogin}>
          <div className="ds-auth-field">
            <label className="ds-auth-label" htmlFor="login-username">
              ERPNext Username / Email *
            </label>
            <input
              id="login-username"
              type="text"
              className="ds-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoCapitalize="none"
              autoComplete="username"
            />
          </div>

          <div className="ds-auth-field">
            <label className="ds-auth-label" htmlFor="login-password">
              Password *
            </label>
            <div className="ds-auth-password-wrap">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                className="ds-input"
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
            {busy ? "Signing in…" : "Sign In with ERPNext"}
          </button>
        </form>
      </div>
    </div>
  );
}
