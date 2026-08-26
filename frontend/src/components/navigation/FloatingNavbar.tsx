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
  const tabs = mobileTabsFor(user);
  const location = useLocation();
  const nativeNav = shouldUseHashRouter();
  const [fabBurst, setFabBurst] = useState(false);

  /* Hide dock on Add Entry so the + button does not cover Continue. */
  const hideDock = location.pathname === "/check-in";

  if (hideDock || tabs.length === 0) return null;

  const rawPath = location.pathname || "/";
  const normalizedPath = rawPath.replace(/\/+$/, "") || "/";

  const activeIndex = tabs.findIndex((t) => {
    const tabPath = (t.to || "/").replace(/\/+$/, "") || "/";
    if (tabPath === "/") {
      return normalizedPath === "/" || normalizedPath === "/m";
    }
    return normalizedPath === tabPath || normalizedPath.startsWith(tabPath + "/");
  });

  const validIndex = activeIndex >= 0 ? activeIndex : 0;

  const handleFabClick = (event: React.MouseEvent) => {
    event.preventDefault();
    if (fabBurst) return;
    setFabBurst(true);
    window.setTimeout(() => {
      navigate("/check-in");
      window.setTimeout(() => {
        setFabBurst(false);
      }, 400);
    }, 220);
  };

  return (
    <nav className="vm-dock" aria-label="Visitor Management Navigation">
      {fabBurst && <div className="vm-fab-fullscreen-zoom-circle" aria-hidden="true" />}
      <div className="vm-dock-inner">
        {/* Horizontal Traveling Water-Drop Liquid Glow */}
        <div
          className="vm-dock-liquid-slider"
          style={{
            width: `${100 / tabs.length}%`,
            transform: `translateX(${validIndex * 100}%)`,
          }}
          aria-hidden="true"
        >
          <div className="vm-dock-waterdrop-glow" />
        </div>

        {tabs.map((tab, idx) => {
          const isAddEntry = Boolean(tab.fab || tab.to === "/check-in");
          const label = dockLabel(lang, tab.to, tab.label);
          const isTabActive = idx === validIndex && !isAddEntry;

          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === "/"}
              className={({ isActive: navActive }) =>
                `vm-dock-tab${isAddEntry ? " is-add" : ""}${isTabActive || (navActive && !isAddEntry) ? " is-active" : ""}`
              }
              aria-label={label}
              title={label}
              onClick={(event) => {
                if (isAddEntry) {
                  handleFabClick(event);
                  return;
                }
                if (!nativeNav) return;
                event.preventDefault();
                if (location.pathname === tab.to) return;
                navigate(tab.to);
              }}
            >
              {isAddEntry ? (
                <div className={`vm-dock-add-btn${fabBurst ? " is-bursting" : ""}`} aria-hidden>
                  {fabBurst ? <span className="vm-fab-ripple-burst" /> : null}
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.6">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </div>
              ) : (
                <div className="vm-dock-item-stack">
                  <span className="vm-dock-tab-icon">
                    <MobileTabIconView name={tab.icon} size={21} />
                  </span>
                  <span className="vm-dock-label">{label}</span>
                </div>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}


