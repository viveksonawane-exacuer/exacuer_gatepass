import { AppRouter } from "@/routes/AppRouter";
import { AuthProvider } from "@/context/AuthContext";
import { AppLanguageProvider } from "@/context/AppLanguageContext";
import { AppThemeProvider } from "@/context/AppThemeContext";
import { CapacitorBootstrap } from "@/components/common/CapacitorBootstrap";
import { NativeErrorBoundary } from "@/components/common/NativeErrorBoundary";

export function App() {
  return (
    <NativeErrorBoundary>
      <AppThemeProvider>
        <AppLanguageProvider>
          <AuthProvider>
            <CapacitorBootstrap />
            <AppRouter />
          </AuthProvider>
        </AppLanguageProvider>
      </AppThemeProvider>
    </NativeErrorBoundary>
  );
}
