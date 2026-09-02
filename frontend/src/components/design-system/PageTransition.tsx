import { Outlet, useLocation, useNavigationType } from "react-router-dom";

type PageTransitionProps = {
  refreshKey?: number;
};

export function PageTransition({ refreshKey = 0 }: PageTransitionProps) {
  const location = useLocation();
  const navType = useNavigationType();

  const direction =
    navType === "POP" ? "back" : navType === "REPLACE" ? "fade" : "forward";

  return (
    <div
      key={`${location.pathname}-${location.key}-${refreshKey}`}
      className={`ds-page-transition ds-page-transition--${direction}`}
    >
      <Outlet />
    </div>
  );
}
