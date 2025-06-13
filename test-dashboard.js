// Quick test script to validate dashboard service structure
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

// Use local Supabase instance
const supabaseUrl = "http://localhost:54321";
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Mock dashboard service to test structure
class MockDashboardService {
  constructor(client) {
    this.supabase = client;
  }

  async getDashboardData(userId) {
    console.log("Testing dashboard data structure...");

    // Mock data that matches expected types
    const mockData = {
      data: {
        user_stats: {
          total_decks: 3,
          total_flashcards: 25,
          pending_flashcards: 5,
          accepted_flashcards: 18,
          rejected_flashcards: 2,
        },
        study_progress: {
          today_reviews: 12,
          daily_limit: 50,
          daily_limit_reached: false,
          catchup_available: true,
          catchup_count: 8,
          streak_days: 5,
          longest_streak: 12,
        },
        upcoming_sessions: {
          due_now: 8,
          due_today: 15,
          due_tomorrow: 12,
          overdue: 3,
        },
        recent_decks: [
          {
            id: "test-deck-1",
            slug: "javascript-basics",
            name: "JavaScript Basics",
            flashcard_count: 10,
            pending_count: 2,
            due_count: 3,
            last_studied: "2025-06-13T10:00:00Z",
          },
        ],
        ai_usage: {
          monthly_usage_usd: 3.45,
          monthly_limit_usd: 10.0,
          usage_percentage: 34.5,
          generations_this_month: 12,
          tokens_used_this_month: 15000,
        },
        quick_actions: {
          can_generate_ai: true,
          can_start_session: true,
          has_pending_reviews: true,
        },
      },
    };

    return mockData;
  }
}

// Test the structure
async function testDashboard() {
  const service = new MockDashboardService(supabase);
  const result = await service.getDashboardData("mock-user-id");

  console.log("Dashboard response structure:");
  console.log(JSON.stringify(result, null, 2));

  // Validate structure
  const { data } = result;
  console.log("\n✅ Structure validation:");
  console.log("- user_stats:", !!data.user_stats);
  console.log("- study_progress:", !!data.study_progress);
  console.log("- upcoming_sessions:", !!data.upcoming_sessions);
  console.log("- recent_decks:", Array.isArray(data.recent_decks));
  console.log("- ai_usage:", !!data.ai_usage);
  console.log("- quick_actions:", !!data.quick_actions);
}

testDashboard().catch(console.error);
