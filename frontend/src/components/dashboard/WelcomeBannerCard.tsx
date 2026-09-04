import { useMemo } from "react";
import type { AuthProfile } from "@/api/vms";
import type { VisitorLang } from "@/i18n/visitorJourney";

type Props = {
  user: AuthProfile | null;
  lang?: VisitorLang;
};

export function WelcomeBannerCard({ user }: Props) {
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);

  const firstName = useMemo(() => {
    if (user?.full_name?.trim()) return user.full_name.trim().split(" ")[0];
    if (user?.user?.trim() && user.user !== "Guest") return user.user.trim().split("@")[0];
    return "Vivek";
  }, [user]);

  const dateString = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, []);

  return (
    <div className="vm-welcome-banner ds-card">
      <div className="vm-welcome-content">
        <div className="vm-welcome-header">
          <div className="vm-welcome-titles">
            <h2 className="vm-welcome-greeting">
              {greeting}, {firstName} <span className="vm-wave-hand">👋</span>
            </h2>
            <p className="vm-welcome-sub">Here's what's happening at Exacuer Global today.</p>
          </div>

          <div className="vm-welcome-date-wrap">
            <span className="vm-welcome-date">{dateString}</span>
            <span className="vm-welcome-subline">Have a productive day!</span>
          </div>
        </div>

        <div className="vm-welcome-campus-strip">
          <div className="vm-welcome-campus-img-wrap">
            <img
              src="/brand/campus-banner-building.jpg"
              alt="Exacuer Global Campus"
              className="vm-welcome-campus-img"
              loading="eager"
            />
            <div className="vm-welcome-campus-overlay" />
          </div>
          <div className="vm-welcome-quote-wrap">
            <span className="vm-welcome-quote">“Every visitor is an opportunity.”</span>
          </div>
        </div>
      </div>
    </div>
  );
}
