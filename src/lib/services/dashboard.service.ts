import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import type {
  DashboardResponseDTO,
  UserStats,
  StudyProgress,
  UpcomingSessions,
  RecentDeck,
  AIUsage,
  QuickActions,
} from "@/types";

/**
 * Service for handling dashboard operations
 * Aggregates data from multiple tables to provide comprehensive user overview
 */
export class DashboardService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Get comprehensive dashboard data for user
   */
  async getDashboardData(userId: string): Promise<DashboardResponseDTO> {
    const [userStats, studyProgress, upcomingSessions, recentDecks, aiUsage, quickActions] = await Promise.all([
      this.getUserStats(userId),
      this.getStudyProgress(userId),
      this.getUpcomingSessions(userId),
      this.getRecentDecks(userId),
      this.getAIUsage(userId),
      this.getQuickActions(userId),
    ]);

    return {
      data: {
        user_stats: userStats,
        study_progress: studyProgress,
        upcoming_sessions: upcomingSessions,
        recent_decks: recentDecks,
        ai_usage: aiUsage,
        quick_actions: quickActions,
      },
    };
  }

  /**
   * Get user statistics (total counts)
   */
  private async getUserStats(userId: string): Promise<UserStats> {
    // Get deck count
    const { count: deckCount } = await this.supabase
      .from("decks")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", userId)
      .eq("is_deleted", false);

    // Get flashcard counts by status
    const { data: flashcardStats } = await this.supabase
      .from("flashcards")
      .select(
        `
        status,
        decks!inner(owner_id)
        `
      )
      .eq("decks.owner_id", userId);

    const totalFlashcards = flashcardStats?.length || 0;
    const pendingFlashcards = flashcardStats?.filter((f) => f.status === "pending").length || 0;
    const acceptedFlashcards = flashcardStats?.filter((f) => f.status === "accepted").length || 0;
    const rejectedFlashcards = flashcardStats?.filter((f) => f.status === "rejected").length || 0;

    return {
      total_decks: deckCount || 0,
      total_flashcards: totalFlashcards,
      pending_flashcards: pendingFlashcards,
      accepted_flashcards: acceptedFlashcards,
      rejected_flashcards: rejectedFlashcards,
    };
  }

  /**
   * Get study progress information
   */
  private async getStudyProgress(userId: string): Promise<StudyProgress> {
    const today = new Date().toISOString().split("T")[0];

    // Get today's reviews
    const { count: todayReviews } = await this.supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", `${today}T00:00:00Z`)
      .lt("created_at", `${today}T23:59:59Z`);

    // Calculate streak (simplified version)
    const { data: recentReviews } = await this.supabase
      .from("reviews")
      .select("created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);

    let streakDays = 0;
    let longestStreak = 0;

    if (recentReviews && recentReviews.length > 0) {
      const reviewDates = new Set(recentReviews.map((r) => r.created_at.split("T")[0]));

      // Calculate current streak
      const currentDate = new Date();
      while (reviewDates.has(currentDate.toISOString().split("T")[0])) {
        streakDays++;
        currentDate.setDate(currentDate.getDate() - 1);
      }

      // For longest streak, we'd need more complex logic
      longestStreak = streakDays; // Simplified
    }

    // Check if catchup is available (simplified)
    const todayReviewsCount = todayReviews || 0;
    const catchupAvailable = todayReviewsCount < 50;
    const catchupCount = Math.min(20, Math.max(0, 70 - todayReviewsCount));

    return {
      today_reviews: todayReviewsCount,
      daily_limit: 50,
      daily_limit_reached: todayReviewsCount >= 50,
      catchup_available: catchupAvailable,
      catchup_count: catchupCount,
      streak_days: streakDays,
      longest_streak: longestStreak,
    };
  }

  /**
   * Get upcoming study sessions information
   */
  private async getUpcomingSessions(userId: string): Promise<UpcomingSessions> {
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    // Get due flashcards
    const { data: dueFlashcards } = await this.supabase
      .from("flashcards")
      .select(
        `
        next_due_date,
        decks!inner(owner_id)
        `
      )
      .eq("decks.owner_id", userId)
      .eq("status", "accepted");

    const dueNow = dueFlashcards?.filter((f) => f.next_due_date <= now.toISOString()).length || 0;
    const dueToday =
      dueFlashcards?.filter((f) => f.next_due_date >= `${today}T00:00:00Z` && f.next_due_date <= `${today}T23:59:59Z`)
        .length || 0;
    const dueTomorrow =
      dueFlashcards?.filter(
        (f) => f.next_due_date >= `${tomorrow}T00:00:00Z` && f.next_due_date <= `${tomorrow}T23:59:59Z`
      ).length || 0;
    const overdue = dueFlashcards?.filter((f) => f.next_due_date < `${today}T00:00:00Z`).length || 0;

    return {
      due_now: dueNow,
      due_today: dueToday,
      due_tomorrow: dueTomorrow,
      overdue: overdue,
    };
  }

  /**
   * Get recently studied decks
   */
  private async getRecentDecks(userId: string): Promise<RecentDeck[]> {
    const { data: decks } = await this.supabase
      .from("decks")
      .select(
        `
        id,
        slug,
        name,
        created_at,
        flashcards(count),
        flashcards!flashcards_deck_id_fkey(
          status,
          next_due_date
        )
        `
      )
      .eq("owner_id", userId)
      .eq("is_deleted", false)
      .order("updated_at", { ascending: false })
      .limit(5);

    return (
      decks?.map((deck) => {
        const flashcards = deck.flashcards || [];
        const pendingCount = flashcards.filter((f: { status: string }) => f.status === "pending").length;
        const dueCount = flashcards.filter(
          (f: { status: string; next_due_date: string }) =>
            f.status === "accepted" && f.next_due_date <= new Date().toISOString()
        ).length;

        return {
          id: deck.id,
          slug: deck.slug,
          name: deck.name,
          flashcard_count: flashcards.length,
          pending_count: pendingCount,
          due_count: dueCount,
          last_studied: deck.created_at, // Simplified - would need reviews join
        };
      }) || []
    );
  }

  /**
   * Get AI usage information
   */
  private async getAIUsage(userId: string): Promise<AIUsage> {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    const { data: budgetEvents } = await this.supabase
      .from("budget_events")
      .select("cost_usd, tokens_used")
      .eq("user_id", userId)
      .gte("event_time", `${currentMonth}-01`);

    const monthlyUsage = budgetEvents?.reduce((sum, event) => sum + (event.cost_usd || 0), 0) || 0;
    const tokensUsed = budgetEvents?.reduce((sum, event) => sum + (event.tokens_used || 0), 0) || 0;
    const generationsCount = budgetEvents?.length || 0;

    const monthlyLimit = 10.0; // $10 limit from PRD
    const usagePercentage = (monthlyUsage / monthlyLimit) * 100;

    return {
      monthly_usage_usd: monthlyUsage,
      monthly_limit_usd: monthlyLimit,
      usage_percentage: usagePercentage,
      generations_this_month: generationsCount,
      tokens_used_this_month: tokensUsed,
    };
  }

  /**
   * Get quick actions availability
   */
  private async getQuickActions(userId: string): Promise<QuickActions> {
    // Check if user can generate AI (budget check)
    const aiUsage = await this.getAIUsage(userId);
    const canGenerateAI = aiUsage.usage_percentage < 100;

    // Check if user can start session (has due flashcards)
    const upcomingSessions = await this.getUpcomingSessions(userId);
    const canStartSession = upcomingSessions.due_now > 0;

    // Check if user has pending reviews
    const hasPendingReviews = upcomingSessions.due_now > 0 || upcomingSessions.overdue > 0;

    return {
      can_generate_ai: canGenerateAI,
      can_start_session: canStartSession,
      has_pending_reviews: hasPendingReviews,
    };
  }
}
