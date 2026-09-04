import { useNavigate } from "react-router-dom";

type QuickAction = {
  id: string;
  title: string;
  subtitle: string;
  route: string;
  tone: "blue" | "green" | "amber" | "purple";
  icon: React.ReactNode;
};

export function QuickActionsGrid() {
  const navigate = useNavigate();

  const actions: QuickAction[] = [
    {
      id: "add-visitor",
      title: "Add Visitor",
      subtitle: "Register a new visitor",
      route: "/checkin",
      tone: "blue",
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <line x1="19" y1="8" x2="19" y2="14" />
          <line x1="22" y1="11" x2="16" y2="11" />
        </svg>
      ),
    },
    {
      id: "schedule-meeting",
      title: "Schedule Meeting",
      subtitle: "Create a meeting invite",
      route: "/meetings",
      tone: "green",
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
    {
      id: "generate-gatepass",
      title: "Generate Gate Pass",
      subtitle: "Quick gate pass",
      route: "/pass",
      tone: "amber",
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="9" y1="15" x2="15" y2="15" />
          <polyline points="9 11 12 11" />
        </svg>
      ),
    },
    {
      id: "view-reports",
      title: "View Reports",
      subtitle: "Visitors & analytics",
      route: "/analytics",
      tone: "purple",
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
    },
  ];

  return (
    <section className="vm-quick-actions-section" aria-label="Quick actions">
      <div className="vm-quick-actions-grid ds-stagger">
        {actions.map((act) => (
          <button
            key={act.id}
            type="button"
            className={`vm-quick-action-card vm-quick-action-card--${act.tone}`}
            onClick={() => navigate(act.route)}
            aria-label={`${act.title} - ${act.subtitle}`}
          >
            <div className="vm-quick-action-top">
              <span className={`vm-quick-action-icon vm-quick-action-icon--${act.tone}`}>
                {act.icon}
              </span>
              <span className="vm-quick-action-arrow" aria-hidden>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </span>
            </div>

            <div className="vm-quick-action-copy">
              <strong className="vm-quick-action-title">{act.title}</strong>
              <span className="vm-quick-action-subtitle">{act.subtitle}</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
