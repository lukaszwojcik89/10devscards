import type { Tables, TablesInsert, TablesUpdate, Enums } from "./db/database.types";

// =============================================================================
// COMMON UTILITY TYPES
// =============================================================================

/**
 * Standard pagination information used across all paginated API responses
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

/**
 * Standardized error response structure for API errors
 */
export interface ErrorResponse {
  error: string;
  message?: string;
  details?: unknown;
}

/**
 * String representations of database enums for API responses
 */
export type FlashcardStatus = Enums<"flashcard_status_enum">;
export type LeitnerBox = Enums<"leitner_box_enum">;

// =============================================================================
// AUTHENTICATION DTO TYPES
// =============================================================================

/**
 * Request body for user registration
 */
export interface SignupRequest {
  email: string;
  password: string;
  age_verification: boolean;
}

/**
 * Response from successful user registration
 */
export interface SignupResponse {
  user: {
    id: string;
    email: string;
    email_confirmed_at: string | null;
  };
  message: string;
}

/**
 * Request body for user authentication
 */
export interface SigninRequest {
  email: string;
  password: string;
}

/**
 * Response from successful user authentication
 */
export interface SigninResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
  };
}

// =============================================================================
// DECK DTO TYPES
// =============================================================================

/**
 * Deck item for list views - derived from decks table with aggregated flashcard counts
 */
export interface DeckListItem
  extends Pick<Tables<"decks">, "id" | "slug" | "name" | "description" | "created_at" | "updated_at"> {
  flashcard_count: number;
  pending_count: number;
}

/**
 * Paginated response for deck listings
 */
export interface DeckListResponse {
  data: DeckListItem[];
  pagination: PaginationInfo;
}

/**
 * Request body for creating a new deck - only user-provided fields from decks table
 */
export interface CreateDeckRequest extends Pick<TablesInsert<"decks">, "name" | "slug"> {
  description?: string;
}

/**
 * Detailed deck response with additional aggregated data
 */
export interface DeckResponse
  extends Pick<Tables<"decks">, "id" | "slug" | "name" | "description" | "created_at" | "updated_at"> {
  flashcard_count: number;
  pending_count: number;
  accepted_count: number;
  rejected_count: number;
}

/**
 * Request body for updating deck information - only editable fields
 */
export type UpdateDeckRequest = Partial<Pick<Tables<"decks">, "name" | "description">>;

// =============================================================================
// FLASHCARD DTO TYPES
// =============================================================================

/**
 * Flashcard item for list views - derived from flashcards table with enum conversion to strings
 */
export interface FlashcardListItem
  extends Pick<
    Tables<"flashcards">,
    "id" | "question" | "answer" | "next_due_date" | "model" | "tokens_used" | "price_usd" | "created_at"
  > {
  status: FlashcardStatus;
  box: LeitnerBox;
}

/**
 * Paginated response for flashcard listings
 */
export interface FlashcardListResponse {
  data: FlashcardListItem[];
  pagination: PaginationInfo;
}

/**
 * Request body for manually creating a flashcard - only essential user-provided fields
 */
export type CreateFlashcardRequest = Pick<TablesInsert<"flashcards">, "question" | "answer">;

/**
 * Request body for AI flashcard generation - not directly mapped to database table
 */
export interface GenerateFlashcardsRequest {
  deck_id: string;
  input_text: string;
  max_flashcards: number;
}

/**
 * Response from AI flashcard generation with generated cards and metadata
 */
export interface GenerateFlashcardsResponse {
  generated_flashcards: FlashcardListItem[];
  generation_summary: {
    total_generated: number;
    total_tokens: number;
    total_cost_usd: number;
    model_used: string;
  };
}

/**
 * Individual flashcard response - same structure as list item
 */
export type FlashcardResponse = FlashcardListItem;

/**
 * Request body for updating flashcard content - only editable content fields
 */
export type UpdateFlashcardRequest = Pick<TablesUpdate<"flashcards">, "question" | "answer">;

/**
 * Response from accepting a pending flashcard with updated scheduling
 */
export interface AcceptFlashcardResponse extends Pick<Tables<"flashcards">, "id" | "next_due_date"> {
  status: FlashcardStatus;
  box: LeitnerBox;
}

/**
 * Response from rejecting a pending flashcard
 */
export interface RejectFlashcardResponse extends Pick<Tables<"flashcards">, "id"> {
  status: FlashcardStatus;
}

// =============================================================================
// REVIEW SESSION DTO TYPES
// =============================================================================

/**
 * Flashcard item for review sessions - simplified view for study
 */
export interface ReviewSessionFlashcard extends Pick<Tables<"flashcards">, "id" | "question" | "next_due_date"> {
  deck_name: string;
  box: LeitnerBox;
}

/**
 * Review session response with flashcards due for review and session metadata
 */
export interface ReviewSessionResponse {
  session_id: string;
  flashcards: ReviewSessionFlashcard[];
  session_info: {
    total_due: number;
    daily_limit_remaining: number;
    catchup_available: number;
  };
}

/**
 * Request body for submitting a review answer - core fields from reviews table
 */
export type SubmitReviewRequest = Pick<TablesInsert<"reviews">, "flashcard_id" | "is_correct" | "response_time_ms">;

/**
 * Response from submitting a review with updated flashcard scheduling and session progress
 */
export interface SubmitReviewResponse {
  review_id: string;
  flashcard: {
    id: string;
    new_box: LeitnerBox;
    next_due_date: string;
  };
  session_progress: {
    completed: number;
    remaining: number;
    daily_limit_remaining: number;
  };
}

/**
 * Review statistics response with aggregated performance data
 */
export interface ReviewStatsResponse {
  period: "daily" | "weekly" | "monthly";
  stats: {
    reviews_completed: number;
    accuracy_rate: number;
    average_response_time_ms: number;
    streak_days: number;
    flashcards_graduated: number;
  };
  daily_breakdown: {
    date: string;
    reviews: number;
    accuracy: number;
  }[];
}

// =============================================================================
// USER MANAGEMENT DTO TYPES
// =============================================================================

/**
 * User profile response with aggregated statistics
 */
export interface UserProfileResponse {
  id: string;
  email: string;
  created_at: string;
  stats: {
    total_decks: number;
    total_flashcards: number;
    total_reviews: number;
  };
}

/**
 * Complete user data export response - contains all user's data from all tables
 */
export interface UserExportResponse {
  export_date: string;
  user: Pick<UserProfileResponse, "id" | "email">;
  decks: Tables<"decks">[];
  flashcards: Tables<"flashcards">[];
  reviews: Tables<"reviews">[];
}

// =============================================================================
// ADMIN DTO TYPES
// =============================================================================

/**
 * Admin budget monitoring response - derived from budget_events table with aggregation
 */
export interface AdminBudgetResponse {
  current_month: {
    spent_usd: number;
    budget_usd: number;
    percentage_used: number;
    alert_triggered: boolean;
  };
  recent_events: Tables<"budget_events">[];
}

/**
 * Admin KPI metrics response - derived from kpi_daily or kpi_monthly tables
 */
export interface AdminKPIResponse {
  period: "daily" | "monthly";
  metrics: (
    | Pick<
        Tables<"kpi_daily">,
        "date" | "accepted_count" | "rejected_count" | "accepted_pct" | "active_users" | "cost_usd"
      >
    | Pick<
        Tables<"kpi_monthly">,
        "year_month" | "accepted_count" | "rejected_count" | "accepted_pct" | "mau" | "cost_usd"
      >
  )[];
}

// =============================================================================
// QUERY PARAMETER TYPES
// =============================================================================

/**
 * Common pagination query parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Query parameters for deck listing
 */
export interface DeckListParams extends PaginationParams {
  search?: string;
}

/**
 * Query parameters for flashcard listing
 */
export interface FlashcardListParams extends PaginationParams {
  status?: FlashcardStatus;
}

/**
 * Query parameters for review session
 */
export interface ReviewSessionParams {
  limit?: number;
  include_catchup?: boolean;
}

/**
 * Query parameters for review stats
 */
export interface ReviewStatsParams {
  period?: "daily" | "weekly" | "monthly";
}

/**
 * Query parameters for admin KPI
 */
export interface AdminKPIParams {
  period?: "daily" | "monthly";
  start_date?: string;
  end_date?: string;
}
