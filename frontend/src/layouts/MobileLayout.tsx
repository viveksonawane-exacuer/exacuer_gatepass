import { useCallback, useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate, useNavigationType } from "react-router-dom";
import { FloatingNavbar } from "@/components/navigation/FloatingNavbar";
import { OfflineIndicator } from "@/components/common/OfflineIndicator";
import { HeaderBar } from "@/components/common/HeaderBar";
import { AndroidBrowserHint } from "@/components/ui/AndroidBrowserHint";
import { PwaInstallNudge } from "@/components/ui/PwaInstallNudge";
import { PageChromeProvider, usePageChromeState } from "@/context/PageChromeContext";
import { HostAlertProvider } from "@/context/HostAlertContext";
import { clearApiCache } from "@/api/vms";
import { VMS_PAGE_REFRESH_EVENT } from "@/hooks/usePageRefresh";
import { setSpaNavigators, syncSpaDepth } from "@/native/backNavigation";

function AppTopBar() {
  const chrome = usePageChromeState();
  const navigate = useNavigate();

  const handleBack = () => {
    if (chrome.onBack) {
      chrome.onBack();
      return;
    }
    if (chrome.backTo) {
      navigate(chrome.backTo);
      return;
    }
    navigate(-1);
  };

  return (
    <HeaderBar
      title={chrome.title}
      subtitle={chrome.subtitle}
      showBack={chrome.showBack}
      onBack={handleBack}
      showNotification={chrome.showNotification}
      showProfile={chrome.showProfile}
    />
  );
}

export function MobileLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const navType = useNavigationType();
  const mainRef = useRef<HTMLDivElement | null>(null);

  const [refreshKey, setRefreshKey] = useState(0);
  const [pullProgress, setPullProgress] = useState(0);
  const [pullPixels, setPullPixels] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const refreshingRef = useRef(false);
  const isPullingRef = useRef(false);
  const pullProgressRef = useRef(0);
  const hideDock = location.pathname === "/check-in";

  useEffect(() => {
    return setSpaNavigators(
      () => navigate(-1),
      () => navigate("/", { replace: false }),
    );
  }, [navigate]);

  useEffect(() => {
    syncSpaDepth(navType);
  }, [location.key, navType]);

  /* New route → scroll to top + soft-reload page data (no window.reload). */
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const reset = () => {
      el.scrollTop = 0;
      el.scrollTo?.({ top: 0, left: 0, behavior: "auto" });
      window.scrollTo?.(0, 0);
    };
    reset();
    const id = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(reset);
    });
    window.dispatchEvent(new Event(VMS_PAGE_REFRESH_EVENT));
    return () => window.cancelAnimationFrame(id);
  }, [location.pathname, location.key]);

  const doRefresh = useCallback(() => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    setRefreshing(true);
    setPullPixels(54);

    // Light tactile feedback on trigger
    try {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(18);
      }
    } catch {
      /* ignore */
    }

    clearApiCache();
    // Dispatch refresh event to all listeners
    window.dispatchEvent(new Event(VMS_PAGE_REFRESH_EVENT));
    // Also bump refresh key to force subcomponent data re-fetch
    setRefreshKey((prev) => prev + 1);

    window.setTimeout(() => {
      refreshingRef.current = false;
      setRefreshing(false);
      setPullPixels(0);
      setPullProgress(0);
      pullProgressRef.current = 0;
      isPullingRef.current = false;
    }, 750);
  }, []);

  useEffect(() => {
    const scrollEl = mainRef.current;
    if (!scrollEl) return;

    let startY: number | null = null;
    let isDragging = false;

    function handleStart(clientY: number) {
      if (refreshingRef.current || !scrollEl) return;
      if (scrollEl.scrollTop <= 6) {
        startY = clientY;
        isDragging = false;
      } else {
        startY = null;
      }
    }

    function handleMove(clientY: number, cancelable: boolean, prevent: () => void) {
      if (refreshingRef.current || !scrollEl) return;

      if (startY === null && scrollEl.scrollTop <= 6) {
        startY = clientY;
      }

      if (startY !== null && scrollEl.scrollTop <= 6) {
        const delta = clientY - startY;
        if (delta > 4) {
          if (cancelable) prevent();
          isDragging = true;
          isPullingRef.current = true;
          const clamped = Math.min(160, delta);
          const damped = Math.min(65, clamped * 0.44);
          const progress = Math.min(1, damped / 36);
          pullProgressRef.current = progress;
          setPullPixels(damped);
          setPullProgress(progress);
        }
      }
    }

    function handleEnd() {
      if (refreshingRef.current) return;
      if (isDragging && pullProgressRef.current >= 0.6) {
        doRefresh();
      } else {
        startY = null;
        isDragging = false;
        isPullingRef.current = false;
        pullProgressRef.current = 0;
        setPullProgress(0);
        setPullPixels(0);
      }
    }

    const onTouchStart = (ev: TouchEvent) => {
      if (ev.touches.length === 1) handleStart(ev.touches[0].clientY);
    };

    const onTouchMove = (ev: TouchEvent) => {
      if (ev.touches.length === 1) {
        handleMove(ev.touches[0].clientY, ev.cancelable, () => ev.preventDefault());
      }
    };

    const onTouchEnd = () => handleEnd();

    scrollEl.addEventListener("touchstart", onTouchStart, { passive: true });
    scrollEl.addEventListener("touchmove", onTouchMove, { passive: false });
    scrollEl.addEventListener("touchend", onTouchEnd, { passive: true });
    scrollEl.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      scrollEl.removeEventListener("touchstart", onTouchStart);
      scrollEl.removeEventListener("touchmove", onTouchMove);
      scrollEl.removeEventListener("touchend", onTouchEnd);
      scrollEl.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [doRefresh]);

  const showIndicator = refreshing || pullProgress > 0.05;
  const isReady = pullProgress >= 0.65;
  const circumference = 56.54; // 2 * pi * 9
  const strokeOffset = circumference * (1 - Math.min(1, pullProgress));

  return (
    <PageChromeProvider>
      <HostAlertProvider>
        <div className={`m-shell m-shell--chrome${hideDock ? " m-shell--no-dock" : ""}`}>
          <OfflineIndicator />
          <AndroidBrowserHint />
          <PwaInstallNudge />
          <div className="m-app-topbar">
            <AppTopBar />
          </div>
          <main className="m-content" id="vms-scroll-root" ref={mainRef}>
            {/* Ultra Smooth iOS Pull-to-Refresh Floating Indicator */}
            <div
              className={`vm-pull-refresh-indicator${refreshing ? " is-refreshing" : ""}${isReady ? " is-ready" : ""}`}
              aria-hidden="true"
              style={{
                opacity: showIndicator ? 1 : 0,
                transform: `translateY(${Math.min(pullPixels, 58)}px) scale(${0.85 + Math.min(pullProgress, 1) * 0.15})`,
                transition: refreshing || !isPullingRef.current ? "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease" : "none",
              }}
            >
              <div className="vm-pull-refresh-pill">
                <div className={`vm-pull-spinner-box${refreshing ? " is-active-spin" : ""}`}>
                  <svg className="vm-pull-svg" viewBox="0 0 24 24" width="18" height="18">
                    <circle
                      className="vm-pull-svg-track"
                      cx="12"
                      cy="12"
                      r="9"
                      fill="none"
                      strokeWidth="2.5"
                    />
                    <circle
                      className="vm-pull-svg-indicator"
                      cx="12"
                      cy="12"
                      r="9"
                      fill="none"
                      strokeWidth="2.5"
                      strokeDasharray={circumference}
                      strokeDashoffset={refreshing ? 14 : strokeOffset}
                      strokeLinecap="round"
                      style={{
                        transform: `rotate(${pullProgress * 280}deg)`,
                        transformOrigin: "center",
                      }}
                    />
                  </svg>
                </div>
                <span className="vm-pull-refresh-text">
                  {refreshing ? "Refreshing…" : isReady ? "Release to refresh" : "Pull down to refresh"}
                </span>
              </div>
            </div>

            {/* Main Content with smooth spring motion */}
            <div
              className="vm-page-content-wrapper"
              style={{
                transform: `translateY(${refreshing ? 32 : pullPixels * 0.45}px)`,
                transition: refreshing || !isPullingRef.current ? "transform 0.32s cubic-bezier(0.16, 1, 0.3, 1)" : "none",
              }}
            >
              {/* Remount on pathname and refreshKey so pull-to-refresh genuinely refreshes live data */}
              <Outlet key={`${location.pathname}-${refreshKey}`} />
            </div>
          </main>
          <FloatingNavbar />
        </div>
      </HostAlertProvider>
    </PageChromeProvider>
  );
}
