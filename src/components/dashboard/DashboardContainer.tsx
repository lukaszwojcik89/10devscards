import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle } from "lucide-react";
import { useDashboard } from "@/hooks/useDashboard";
import { useQuickActions } from "@/hooks/useQuickActions";
import { KpiSection } from "./KpiSection";
import { RecentDecksSection } from "./RecentDecksSection";
import { QuickActionsSection } from "./QuickActionsSection";
import { ToastWelcome } from "./ToastWelcome";
import { BannerLimits } from "./BannerLimits";
import { SkeletonDashboard } from "./SkeletonDashboard";

/**
 * Główny kontener React zarządzający stanem dashboard, API calls, loading states i error handling
 */
export const DashboardContainer: React.FC = () => {
  const { dashboardData, isLoading, error, lastRefresh, showWelcomeToast, refresh, dismissWelcomeToast, isRefreshing } =
    useDashboard();

  const { handleActionClick, handleKpiClick, navigateToDecks, navigateToDeckDetail, navigateToHelp } =
    useQuickActions();

  const [dismissedBanner, setDismissedBanner] = useState(false);

  // Error state
  if (error && !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Wystąpił błąd</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={refresh} className="inline-flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Spróbuj ponownie
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading && !dashboardData) {
    return <SkeletonDashboard />;
  }

  // No data state (shouldn't happen normally)
  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md mx-auto p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Brak danych</h3>
          <p className="text-gray-600 mb-4">Nie udało się załadować danych dashboard.</p>
          <Button onClick={refresh} variant="outline">
            Odśwież
          </Button>
        </div>
      </div>
    );
  }

  const shouldShowBanner = !dismissedBanner && dashboardData.ai_usage.usage_percentage >= 80;

  const bannerType = dashboardData.ai_usage.usage_percentage >= 90 ? "warning" : "info";

  return (
    <div className="space-y-8">
      {/* Welcome Toast */}
      {showWelcomeToast && <ToastWelcome onDismiss={dismissWelcomeToast} autoClose={true} duration={5000} />}

      {/* AI Usage Banner */}
      {shouldShowBanner && (
        <BannerLimits
          aiUsage={dashboardData.ai_usage}
          type={bannerType}
          onDismiss={() => setDismissedBanner(true)}
          onLearnMore={navigateToHelp}
        />
      )}

      {/* Error banner for refresh errors */}
      {error && dashboardData && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Błąd odświeżania</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <Button
              onClick={refresh}
              variant="outline"
              size="sm"
              disabled={isRefreshing}
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              {isRefreshing ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Spróbuj ponownie"}
            </Button>
          </div>
        </div>
      )}

      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          {lastRefresh && (
            <p className="text-sm text-gray-500 mt-1">
              Ostatnia aktualizacja: {lastRefresh.toLocaleTimeString("pl-PL")}
            </p>
          )}
        </div>
        <Button
          onClick={refresh}
          variant="outline"
          size="sm"
          disabled={isRefreshing}
          className="inline-flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Odśwież
        </Button>
      </div>

      {/* KPI Section */}
      <KpiSection
        studyProgress={dashboardData.study_progress}
        upcomingSessions={dashboardData.upcoming_sessions}
        onKpiClick={handleKpiClick}
      />

      {/* Recent Decks Section */}
      <RecentDecksSection
        recentDecks={dashboardData.recent_decks}
        onDeckClick={navigateToDeckDetail}
        onViewAll={navigateToDecks}
        isLoading={false}
      />

      {/* Quick Actions Section */}
      <QuickActionsSection quickActions={dashboardData.quick_actions} onActionClick={handleActionClick} />
    </div>
  );
};
