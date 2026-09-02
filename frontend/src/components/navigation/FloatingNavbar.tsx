import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useAppLanguage } from "@/context/AppLanguageContext";
import { mobileTabsFor } from "@/lib/roles";
import { MobileTabIconView } from "@/components/ui/MobileIcons";
import { ut, type UiCopyKey } from "@/i18n/uiChrome";
import type { VisitorLang } from "@/i18n/visitorJourney";
import { shouldUseHashRouter } from "@/native/platform";

function dockLabel(lang: VisitorLang, to: string, fallback: string): string {
  const keyByPath: Record<string, UiCopyKey> = {
    "/": "home",
    "/approvals": "pending",
    "/check-in": "add_entry",
    "/inside": "inside",
    "/analytics": "reports",
  };
  const key = keyByPath[to];
  return key ? ut(lang, key) : fallback;
}

export function FloatingNavbar() {
  const { user } = useAuth();
  const { lang } = useAppLanguage();
  const navigate = useNavigate();
  const allTabs = mobileTabsFor(user);
  const location = useLocation();
  const nativeNav = shouldUseHashRouter();
  const [fabBurst, setFabBurst] = useState(false);

  const hideDock = location.pathname === "/check-in";
  const fabTab = allTabs.find((t) => t.fab || t.to === "/check-in");
  const tabs = allTabs.filter((t) => !t.fab && t.to !== "/check-in");

  if (hideDock || (tabs.length === 0 && !fabTab)) return null;

  const rawPath = location.pathname || "/";
  const normalizedPath = rawPath.replace(/\/+$/, "") || "/";

  const activeIndex = tabs.findIndex((t) => {
    const tabPath = (t.to || "/").replace(/\/+$/, "") || "/";
    if (tabPath === "/") {
      return normalizedPath === "/" || normalizedPath === "/m";
    }
    return normalizedPath === tabPath || normalizedPath.startsWith(`${tabPath}/`);
  });

  const validIndex = activeIndex >= 0 ? activeIndex : 0;

  const handleFabClick = () => {
    if (fabBurst) return;
    setFabBurst(true);
    window.setTimeout(() => {
      navigate("/check-in");
      window.setTimeout(() => setFabBurst(false), 400);
    }, 180);
  };

  return (
    <div className="vm-dock-shell" aria-label="Visitor Management Navigation">
      {fabBurst ? <div className="vm-fab-fullscreen-zoom-circle" aria-hidden="true" /> : null}

      {tabs.length > 0 ? (
        <nav className="vm-dock">
          <div
            className="vm-dock-inner"
            style={
              {
                "--dock-tab-count": tabs.length,
                "--dock-active-index": validIndex,
              } as React.CSSProperties
            }
          >
            <div className="vm-dock-liquid-slider" aria-hidden="true">
              <div className="vm-dock-waterdrop-glow" />
            </div>

            {tabs.map((tab, idx) => {
              const label = dockLabel(lang, tab.to, tab.label);
              const isTabActive = idx === validIndex;

              return (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  end={tab.to === "/"}
                  className={({ isActive: navActive }) =>
                    `vm-dock-tab${isTabActive || navActive ? " is-active" : ""}`
                  }
                  aria-label={label}
                  title={label}
                  onClick={(event) => {
                    if (!nativeNav) return;
                    event.preventDefault();
                    if (location.pathname === tab.to) return;
                    navigate(tab.to);
                  }}
                >
                  <div className="vm-dock-item-stack">
                    <span className="vm-dock-tab-icon">
                      <MobileTabIconView name={tab.icon} size={22} />
                    </span>
                    <span className="vm-dock-label">{label}</span>
                  </div>
                </NavLink>
              );
            })}
          </div>
        </nav>
      ) : null}

      {fabTab ? (
        <button
          type="button"
          className={`vm-dock-fab${fabBurst ? " is-bursting" : ""}`}
          onClick={handleFabClick}
          aria-label={dockLabel(lang, "/check-in", fabTab.label)}
          title={dockLabel(lang, "/check-in", fabTab.label)}
        >
          {fabBurst ? <span className="vm-fab-ripple-burst" /> : null}
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
