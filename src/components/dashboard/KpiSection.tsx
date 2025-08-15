import React from "react";
import { KpiTile } from "./KpiTile";
import type { DashboardData } from "@/types";

interface KpiSectionProps {
  studyProgress: DashboardData["study_progress"];
  upcomingSessions: DashboardData["upcoming_sessions"];
  onKpiClick?: (type: string) => void;
}

/**
 * Sekcja wyświetlająca 3 główne kafle KPI w responsywnym grid layout
 */
export const KpiSection: React.FC<KpiSectionProps> = ({ studyProgress, upcomingSessions, onKpiClick }) => {
  const handleKpiClick = (type: string) => {
    if (onKpiClick) {
      onKpiClick(type);
    }
  };

  // Kalkulacja variant na podstawie danych
  const getDueTodayVariant = () => {
    if (upcomingSessions.overdue > 0) return "warning";
    if (upcomingSessions.due_now > 0) return "primary";
    return "success";
  };

  const getCatchupVariant = () => {
    if (upcomingSessions.overdue > 5) return "warning";
    if (upcomingSessions.overdue > 0) return "primary";
    return "neutral";
  };

  const getStreakVariant = () => {
    if (studyProgress.streak_days >= 7) return "success";
    if (studyProgress.streak_days >= 3) return "primary";
    return "neutral";
  };

  return (
    <section aria-labelledby="kpi-section-title" className="space-y-4">
      <h2 id="kpi-section-title" className="sr-only">
        Statystyki nauki
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiTile
          title="Do nauki dziś"
          value={upcomingSessions.due_now}
          subtitle={
            upcomingSessions.due_today > upcomingSessions.due_now
              ? `${upcomingSessions.due_today} łącznie dziś`
              : undefined
          }
          variant={getDueTodayVariant()}
          isClickable={upcomingSessions.due_now > 0}
          onClick={() => handleKpiClick("study-today")}
          tooltip={upcomingSessions.due_now > 0 ? "Kliknij aby rozpocząć naukę" : "Brak fiszek do nauki"}
        />

        <KpiTile
          title="Zaległe"
          value={upcomingSessions.overdue}
          subtitle={studyProgress.catchup_available ? "Catchup dostępny" : undefined}
          variant={getCatchupVariant()}
          isClickable={upcomingSessions.overdue > 0}
          onClick={() => handleKpiClick("catchup")}
          tooltip={upcomingSessions.overdue > 0 ? "Kliknij aby nadrobić zaległości" : "Brak zaległości"}
        />

        <KpiTile
          title="Streak"
          value={studyProgress.streak_days}
          subtitle={`Najdłuższy: ${studyProgress.longest_streak} dni`}
          variant={getStreakVariant()}
          isClickable={studyProgress.streak_days > 0}
          onClick={() => handleKpiClick("streak")}
          tooltip="Aktualna passa nauki"
        />
      </div>
    </section>
  );
};
