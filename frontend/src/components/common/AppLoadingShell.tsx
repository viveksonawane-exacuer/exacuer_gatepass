type AppLoadingShellProps = {
  message?: string;
};

export function AppLoadingShell({ message = "Loading…" }: AppLoadingShellProps) {
  return (
    <div className="ds-auth-page">
      <div className="ds-auth-frame">
        <div className="ds-loading-shell">
          <div className="ds-skeleton ds-loading-shell__bar" aria-hidden />
          <div className="ds-skeleton ds-loading-shell__bar is-short" aria-hidden />
          <p className="ds-loading-shell__text">{message}</p>
        </div>
      </div>
    </div>
  );
}
