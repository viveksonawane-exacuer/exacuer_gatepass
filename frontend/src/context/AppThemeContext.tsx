import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ThemeColorId =
  | "indigo"
  | "purple"
  | "blue"
  | "emerald"
  | "amber"
  | "rose"
  | "slate";

export interface ThemeOption {
  id: ThemeColorId;
  name: string;
  primary: string;
  primaryHover: string;
  primaryLight: string;
  primaryBorder: string;
  secondary: string;
  secondaryLight: string;
  previewGradient: string;
  accentGradient: string;
  meshGradient: string;
  ambientGradient: string;
  fabGradient: string;
  glow: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: "indigo",
    name: "Royal Indigo",
    primary: "#4F46E5",
    primaryHover: "#4338CA",
    primaryLight: "#EEF2FF",
    primaryBorder: "#C7D2FE",
    secondary: "#6366F1",
    secondaryLight: "#E0E7FF",
    previewGradient: "linear-gradient(135deg, #4F46E5, #818CF8)",
    accentGradient: "linear-gradient(135deg, #4F46E5 0%, #6366F1 50%, #818CF8 100%)",
    meshGradient: "linear-gradient(135deg, #4F46E5 0%, #6366F1 38%, #818CF8 70%, #06B6D4 100%)",
    ambientGradient: "linear-gradient(180deg, rgba(79, 70, 229, 0.16) 0%, rgba(99, 102, 241, 0.08) 35%, rgba(248, 250, 252, 0) 100%)",
    fabGradient: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #EC4899 100%)",
    glow: "rgba(79, 70, 229, 0.35)",
  },
  {
    id: "purple",
    name: "Electric Purple",
    primary: "#9333EA",
    primaryHover: "#7E22CE",
    primaryLight: "#FAF5FF",
    primaryBorder: "#E9D5FF",
    secondary: "#A855F7",
    secondaryLight: "#F3E8FF",
    previewGradient: "linear-gradient(135deg, #9333EA, #C084FC)",
    accentGradient: "linear-gradient(135deg, #9333EA 0%, #A855F7 50%, #C084FC 100%)",
    meshGradient: "linear-gradient(135deg, #7E22CE 0%, #9333EA 38%, #C084FC 70%, #F43F5E 100%)",
    ambientGradient: "linear-gradient(180deg, rgba(147, 51, 234, 0.16) 0%, rgba(168, 85, 247, 0.08) 35%, rgba(248, 250, 252, 0) 100%)",
    fabGradient: "linear-gradient(135deg, #7E22CE 0%, #A855F7 50%, #F43F5E 100%)",
    glow: "rgba(147, 51, 234, 0.35)",
  },
  {
    id: "blue",
    name: "Ocean Blue",
    primary: "#0284C7",
    primaryHover: "#0369A1",
    primaryLight: "#F0F9FF",
    primaryBorder: "#BAE6FD",
    secondary: "#0EA5E9",
    secondaryLight: "#E0F2FE",
    previewGradient: "linear-gradient(135deg, #0284C7, #38BDF8)",
    accentGradient: "linear-gradient(135deg, #0284C7 0%, #0EA5E9 50%, #38BDF8 100%)",
    meshGradient: "linear-gradient(135deg, #0369A1 0%, #0284C7 38%, #38BDF8 70%, #06B6D4 100%)",
    ambientGradient: "linear-gradient(180deg, rgba(2, 132, 199, 0.16) 0%, rgba(14, 165, 233, 0.08) 35%, rgba(248, 250, 252, 0) 100%)",
    fabGradient: "linear-gradient(135deg, #0369A1 0%, #0284C7 50%, #06B6D4 100%)",
    glow: "rgba(2, 132, 199, 0.35)",
  },
  {
    id: "emerald",
    name: "Emerald Green",
    primary: "#059669",
    primaryHover: "#047857",
    primaryLight: "#ECFDF5",
    primaryBorder: "#A7F3D0",
    secondary: "#10B981",
    secondaryLight: "#D1FAE5",
    previewGradient: "linear-gradient(135deg, #059669, #34D399)",
    accentGradient: "linear-gradient(135deg, #059669 0%, #10B981 50%, #34D399 100%)",
    meshGradient: "linear-gradient(135deg, #047857 0%, #059669 38%, #34D399 70%, #14B8A6 100%)",
    ambientGradient: "linear-gradient(180deg, rgba(5, 150, 105, 0.16) 0%, rgba(16, 185, 129, 0.08) 35%, rgba(248, 250, 252, 0) 100%)",
    fabGradient: "linear-gradient(135deg, #047857 0%, #10B981 50%, #06B6D4 100%)",
    glow: "rgba(5, 150, 105, 0.35)",
  },
  {
    id: "amber",
    name: "Sunset Orange",
    primary: "#EA580C",
    primaryHover: "#C2410C",
    primaryLight: "#FFF7ED",
    primaryBorder: "#FED7AA",
    secondary: "#F97316",
    secondaryLight: "#FFEDD5",
    previewGradient: "linear-gradient(135deg, #EA580C, #FBBF24)",
    accentGradient: "linear-gradient(135deg, #EA580C 0%, #F97316 50%, #FBBF24 100%)",
    meshGradient: "linear-gradient(135deg, #C2410C 0%, #EA580C 38%, #FBBF24 70%, #E11D48 100%)",
    ambientGradient: "linear-gradient(180deg, rgba(234, 88, 12, 0.16) 0%, rgba(249, 115, 22, 0.08) 35%, rgba(248, 250, 252, 0) 100%)",
    fabGradient: "linear-gradient(135deg, #C2410C 0%, #EA580C 50%, #E11D48 100%)",
    glow: "rgba(234, 88, 12, 0.35)",
  },
  {
    id: "rose",
    name: "Crimson Rose",
    primary: "#E11D48",
    primaryHover: "#BE123C",
    primaryLight: "#FFF1F2",
    primaryBorder: "#FECDD3",
    secondary: "#F43F5E",
    secondaryLight: "#FFE4E6",
    previewGradient: "linear-gradient(135deg, #E11D48, #FB7185)",
    accentGradient: "linear-gradient(135deg, #E11D48 0%, #F43F5E 50%, #FB7185 100%)",
    meshGradient: "linear-gradient(135deg, #BE123C 0%, #E11D48 38%, #FB7185 70%, #9333EA 100%)",
    ambientGradient: "linear-gradient(180deg, rgba(225, 29, 72, 0.16) 0%, rgba(244, 63, 94, 0.08) 35%, rgba(248, 250, 252, 0) 100%)",
    fabGradient: "linear-gradient(135deg, #BE123C 0%, #E11D48 50%, #9333EA 100%)",
    glow: "rgba(225, 29, 72, 0.35)",
  },
  {
    id: "slate",
    name: "Midnight Slate",
    primary: "#0F172A",
    primaryHover: "#020617",
    primaryLight: "#F8FAFC",
    primaryBorder: "#CBD5E1",
    secondary: "#334155",
    secondaryLight: "#F1F5F9",
    previewGradient: "linear-gradient(135deg, #0F172A, #64748B)",
    accentGradient: "linear-gradient(135deg, #0F172A 0%, #334155 50%, #64748B 100%)",
    meshGradient: "linear-gradient(135deg, #020617 0%, #0F172A 38%, #475569 70%, #64748B 100%)",
    ambientGradient: "linear-gradient(180deg, rgba(15, 23, 42, 0.16) 0%, rgba(51, 65, 85, 0.08) 35%, rgba(248, 250, 252, 0) 100%)",
    fabGradient: "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #475569 100%)",
    glow: "rgba(15, 23, 42, 0.35)",
  },
];

const STORAGE_KEY = "vms_app_theme_color";

function applyThemeVariables(opt: ThemeOption) {
  const root = document.documentElement;
  root.style.setProperty("--vms-primary", opt.primary);
  root.style.setProperty("--vms-primary-hover", opt.primaryHover);
  root.style.setProperty("--vms-primary-soft", opt.primaryLight);
  root.style.setProperty("--vms-primary-light", opt.primaryLight);
  root.style.setProperty("--vms-primary-border", opt.primaryBorder);
  root.style.setProperty("--vms-secondary", opt.secondary);
  root.style.setProperty("--vms-secondary-soft", opt.secondaryLight);
  root.style.setProperty("--vms-accent-gradient", opt.accentGradient);
  root.style.setProperty("--vms-gradient-primary", opt.accentGradient);
  root.style.setProperty("--vms-gradient-mesh", opt.meshGradient);
  root.style.setProperty("--vms-gradient-ambient", opt.ambientGradient);
  root.style.setProperty("--vms-fab-gradient", opt.fabGradient);
  root.style.setProperty("--vms-shadow-glow", `0 8px 24px ${opt.glow}`);
  root.style.setProperty("--vms-shadow-btn", `0 8px 20px ${opt.glow}`);
  root.style.setProperty("--vms-shadow-dock", `0 12px 36px ${opt.glow}`);
  root.style.setProperty("--vms-theme-glow", opt.glow);
  root.style.setProperty("--vms-focus-ring", `0 0 0 4px ${opt.glow}`);
  root.style.setProperty("--vms-pass-accent", opt.primary);
  root.style.setProperty("--vms-meeting", opt.primary);
  root.style.setProperty("--vms-brand-accent", opt.primary);
}

type AppThemeContextValue = {
  themeColor: ThemeColorId;
  activeTheme: ThemeOption;
  setThemeColor: (id: ThemeColorId) => void;
  options: typeof THEME_OPTIONS;
};

const AppThemeContext = createContext<AppThemeContextValue | undefined>(undefined);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [themeColor, setThemeColorState] = useState<ThemeColorId>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ThemeColorId | null;
      if (stored && THEME_OPTIONS.some((o) => o.id === stored)) {
        return stored;
      }
    } catch {
      /* ignore */
    }
    return "indigo";
  });

  const activeTheme = useMemo(() => {
    return THEME_OPTIONS.find((o) => o.id === themeColor) || THEME_OPTIONS[0];
  }, [themeColor]);

  const setThemeColor = useCallback((id: ThemeColorId) => {
    setThemeColorState(id);
    const target = THEME_OPTIONS.find((o) => o.id === id) || THEME_OPTIONS[0];
    applyThemeVariables(target);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    applyThemeVariables(activeTheme);
  }, [activeTheme]);

  const value = useMemo(
    () => ({
      themeColor,
      activeTheme,
      setThemeColor,
      options: THEME_OPTIONS,
    }),
    [themeColor, activeTheme, setThemeColor],
  );

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

export function useAppTheme(): AppThemeContextValue {
  const ctx = useContext(AppThemeContext);
  if (!ctx) {
    throw new Error("useAppTheme must be used within an AppThemeProvider");
  }
  return ctx;
}
