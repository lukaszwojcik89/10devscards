import type { Tables, TablesInsert, TablesUpdate, Enums } from "./db/database.types";

// =============================================================================
// COMMON TYPES
// =============================================================================

/**
 * Standard pagination metadata for list responses
 */
export interface PaginationDTO {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

/**
 * Standard error response format
 */
export interface ErrorResponseDTO {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Standard success message response
 */
export interface SuccessMessageResponseDTO {
  message: string;
}

// =============================================================================
// DECK RESOURCE DTO
// =============================================================================

/**
 * Extended deck data with computed fields for list responses
 */
export interface DeckWithCounts extends Tables<"decks"> {
  flashcard_count: number;
  pending_count: number;
}

/**
 * Response DTO for GET /api/decks
 */
export interface DeckListResponseDTO {
  data: DeckWithCounts[];
  pagination: PaginationDTO;
}

/**
 * Response DTO for GET /api/decks/{slug}
 */
export interface DeckDetailResponseDTO {
  data: DeckWithCounts;
}

/**
 * Request DTO for POST /api/decks
 */
export type CreateDeckRequestDTO = Pick<TablesInsert<"decks">, "slug" | "name" | "description">;

/**
 * Response DTO for POST /api/decks
 */
export interface CreateDeckResponseDTO {
  data: DeckWithCounts;
}

/**
 * Request DTO for PUT /api/decks/{slug}
 */
export type UpdateDeckRequestDTO = Partial<Pick<TablesUpdate<"decks">, "name" | "description">>;

/**
 * Response DTO for DELETE /api/decks/{slug}
 */
export type DeleteDeckResponseDTO = SuccessMessageResponseDTO;

// =============================================================================
// FLASHCARD RESOURCE DTO
// =============================================================================

/**
 * Extended flashcard data for responses
 */
export type FlashcardResponseData = Tables<"flashcards">;

/**
 * Minimal flashcard data returned from INSERT operations
 */
export interface FlashcardListItem {
  id: string;
  question: string;
  answer: string;
  status: Enums<"flashcard_status_enum">;
  box: Enums<"leitner_box_enum">;
  next_due_date: string;
  model: string | null;
  tokens_used: number | null;
  price_usd: number | null;
  created_at: string;
}

/**
 * Response DTO for GET /api/decks/{slug}/flashcards
 */
export interface FlashcardListResponseDTO {
  data: FlashcardResponseData[];
  pagination: PaginationDTO;
}

/**
 * Response DTO for GET /api/flashcards/{id}
 */
export interface FlashcardDetailResponseDTO {
  data: FlashcardResponseData;
}

/**
 * Request DTO for POST /api/flashcards/generate
 */
export interface GenerateFlashcardsRequestDTO {
  deck_id: string;
  input_text: string;
  max_cards?: number;
  difficulty?: "beginner" | "intermediate" | "advanced";
  context?: string;
  language?: "pl" | "en" | "de" | "fr" | "es" | "it";
}

/**
 * AI generation metadata
 */
export interface AIGenerationMetadata {
  total_tokens: number;
  total_cost_usd: number;
  model_used: string;
  generation_time_ms: number;
}

/**
 * Response DTO for POST /api/flashcards/generate
 */
export interface GenerateFlashcardsResponseDTO {
  generated_flashcards: FlashcardListItem[];
  generation_summary: {
    total_generated: number;
    total_tokens: number;
    total_cost_usd: number;
    model_used: string;
  };
}

/**
 * Request DTO for POST /api/flashcards
 */
export type CreateFlashcardRequestDTO = Pick<TablesInsert<"flashcards">, "deck_id" | "question" | "answer">;

/**
 * Request DTO for PUT /api/flashcards/{id}
 */
export type UpdateFlashcardRequestDTO = Partial<Pick<TablesUpdate<"flashcards">, "question" | "answer">>;

/**
 * Request DTO for PATCH /api/flashcards/{id}/status
 */
export interface UpdateFlashcardStatusRequestDTO {
  status: Enums<"flashcard_status_enum">;
}

/**
 * Response DTO for DELETE /api/flashcards/{id}
 */
export type DeleteFlashcardResponseDTO = SuccessMessageResponseDTO;

// =============================================================================
// STUDY SESSION RESOURCE DTO
// =============================================================================

/**
 * Flashcard data for study sessions (simplified view)
 */
export interface StudyFlashcardData {
  id: string;
  question: string;
  deck_name: string;
  box: Enums<"leitner_box_enum">;
  due_date: string;
}

/**
 * Study session metadata
 */
export interface StudySessionMetadata {
  total_due: number;
  session_limit: number;
  catchup_available: number;
  daily_reviews_completed: number;
  daily_limit: number;
}

/**
 * Response DTO for GET /api/study/session
 */
export interface StudySessionResponseDTO {
  data: {
    session_id: string;
    flashcards: StudyFlashcardData[];
    metadata: StudySessionMetadata;
  };
}

// =============================================================================
// REVIEW RESOURCE DTO
// =============================================================================

/**
 * Request DTO for POST /api/reviews
 */
export type SubmitReviewRequestDTO = Pick<TablesInsert<"reviews">, "flashcard_id" | "is_correct" | "response_time_ms">;

/**
 * Next review information after submission
 */
export interface NextReviewInfo {
  box: Enums<"leitner_box_enum">;
  next_due_date: string;
}

/**
 * Response DTO for POST /api/reviews
 */
export interface SubmitReviewResponseDTO {
  data: Tables<"reviews"> & {
    next_review: NextReviewInfo;
  };
}

/**
 * Review data with related flashcard info for history
 */
export interface ReviewWithFlashcard extends Tables<"reviews"> {
  flashcard: {
    question: string;
    deck_name: string;
  };
}

/**
 * Response DTO for GET /api/reviews
 */
export interface ReviewHistoryResponseDTO {
  data: ReviewWithFlashcard[];
  pagination: PaginationDTO;
}

// =============================================================================
// USER DATA RESOURCE DTO
// =============================================================================

/**
 * User statistics for export
 */
export interface UserStatistics {
  total_flashcards: number;
  total_reviews: number;
  accuracy_rate: number;
  streak_days: number;
}

/**
 * Response DTO for GET /api/user/export
 */
export interface UserExportResponseDTO {
  export_timestamp: string;
  user_id: string;
  decks: Tables<"decks">[];
  flashcards: Tables<"flashcards">[];
  reviews: Tables<"reviews">[];
  statistics: UserStatistics;
}

/**
 * Request DTO for DELETE /api/user/account
 */
export interface DeleteAccountRequestDTO {
  confirmation: "DELETE_MY_ACCOUNT";
}

// =============================================================================
// BUDGET RESOURCE DTO
// =============================================================================

/**
 * Budget status data for admin panel
 */
export interface BudgetStatusData {
  current_month: string;
  budget_limit_usd: number;
  current_usage_usd: number;
  usage_percentage: number;
  threshold_80_reached: boolean;
  threshold_100_reached: boolean;
  generation_blocked: boolean;
  last_updated: string;
}

/**
 * Response DTO for GET /api/admin/budget/status
 */
export interface BudgetStatusResponseDTO {
  data: BudgetStatusData;
}

// =============================================================================
// AUTHENTICATION RESOURCE DTO
// =============================================================================

/**
 * User profile data
 */
export interface UserProfile {
  id: string;
  email: string;
  email_confirmed_at: string | null;
  created_at: string;
  last_sign_in_at?: string;
}

/**
 * Request DTO for POST /api/auth/register
 */
export interface RegisterRequestDTO {
  email: string;
  password: string;
  age_confirmation: boolean;
}

/**
 * Response DTO for POST /api/auth/register
 */
export interface RegisterResponseDTO {
  data: {
    user: UserProfile;
    message: string;
  };
}

/**
 * Request DTO for POST /api/auth/login
 */
export interface LoginRequestDTO {
  email: string;
  password: string;
}

/**
 * Auth tokens data
 */
export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

/**
 * Response DTO for POST /api/auth/login
 */
export interface LoginResponseDTO {
  data: AuthTokens & {
    user: UserProfile;
  };
}

/**
 * Request DTO for POST /api/auth/refresh
 */
export interface RefreshTokenRequestDTO {
  refresh_token: string;
}

/**
 * Response DTO for POST /api/auth/refresh
 */
export interface RefreshTokenResponseDTO {
  data: Pick<AuthTokens, "access_token" | "expires_in">;
}

/**
 * Response DTO for GET /api/auth/me
 */
export interface UserProfileResponseDTO {
  data: UserProfile;
}

/**
 * Request DTO for POST /api/auth/password/reset
 */
export interface PasswordResetRequestDTO {
  email: string;
}

/**
 * Request DTO for POST /api/auth/password/update
 */
export interface PasswordUpdateRequestDTO {
  token: string;
  password: string;
}

/**
 * Response DTO for POST /api/auth/logout
 */
export type LogoutResponseDTO = SuccessMessageResponseDTO;

/**
 * Response DTO for POST /api/auth/password/reset
 */
export type PasswordResetResponseDTO = SuccessMessageResponseDTO;

// =============================================================================
// COMMAND MODELS (for business logic operations)
// =============================================================================

/**
 * Command for creating a new deck
 */
export interface CreateDeckCommand {
  slug?: string;
  name: string;
  description?: string | null;
  owner_id: string;
}

/**
 * Command for updating a deck
 */
export interface UpdateDeckCommand extends UpdateDeckRequestDTO {
  slug: string;
  owner_id: string;
}

/**
 * Command for generating flashcards with AI
 */
export interface GenerateFlashcardsCommand extends GenerateFlashcardsRequestDTO {
  user_id: string;
}

/**
 * Command for creating a manual flashcard
 */
export interface CreateFlashcardCommand extends CreateFlashcardRequestDTO {
  user_id?: string;
}

/**
 * Command for submitting a review
 */
export interface SubmitReviewCommand extends SubmitReviewRequestDTO {
  user_id: string;
}

/**
 * Command for updating flashcard status
 */
export interface UpdateFlashcardStatusCommand extends UpdateFlashcardStatusRequestDTO {
  flashcard_id: string;
  user_id: string;
}

/**
 * Command for starting a study session
 */
export interface StartStudySessionCommand {
  user_id: string;
  include_catchup?: boolean;
  deck_slug?: string;
}

/**
 * Command for deleting a deck
 */
export interface DeleteDeckCommand {
  slug: string;
  owner_id: string;
}

/**
 * Command for updating a flashcard
 */
export interface UpdateFlashcardCommand extends UpdateFlashcardRequestDTO {
  flashcard_id: string;
  user_id: string;
}

/**
 * Command for deleting a flashcard
 */
export interface DeleteFlashcardCommand {
  flashcard_id: string;
  user_id: string;
}

/**
 * Command for user data export
 */
export interface ExportUserDataCommand {
  user_id: string;
}

/**
 * Command for user account deletion
 */
export interface DeleteUserAccountCommand extends DeleteAccountRequestDTO {
  user_id: string;
}

// =============================================================================
// TYPE ALIASES FOR BACKWARD COMPATIBILITY
// =============================================================================

/**
 * Compatibility aliases for existing service code
 */
export type GenerateFlashcardsRequest = GenerateFlashcardsRequestDTO;
export type GenerateFlashcardsResponse = GenerateFlashcardsResponseDTO;
export type ErrorResponse = ErrorResponseDTO;

// =============================================================================
// DASHBOARD RESOURCE DTO
// =============================================================================

/**
 * User statistics for dashboard
 */
export interface UserStats {
  total_decks: number;
  total_flashcards: number;
  pending_flashcards: number;
  accepted_flashcards: number;
  rejected_flashcards: number;
}

/**
 * Study progress information
 */
export interface StudyProgress {
  today_reviews: number;
  daily_limit: number;
  daily_limit_reached: boolean;
  catchup_available: boolean;
  catchup_count: number;
  streak_days: number;
  longest_streak: number;
}

/**
 * Upcoming study sessions information
 */
export interface UpcomingSessions {
  due_now: number;
  due_today: number;
  due_tomorrow: number;
  overdue: number;
}

/**
 * Recent deck information for dashboard
 */
export interface RecentDeck {
  id: string;
  slug: string;
  name: string;
  flashcard_count: number;
  pending_count: number;
  due_count: number;
  last_studied: string;
}

/**
 * AI usage information
 */
export interface AIUsage {
  monthly_usage_usd: number;
  monthly_limit_usd: number;
  usage_percentage: number;
  generations_this_month: number;
  tokens_used_this_month: number;
}

/**
 * Quick actions availability
 */
export interface QuickActions {
  can_generate_ai: boolean;
  can_start_session: boolean;
  has_pending_reviews: boolean;
}

/**
 * Dashboard data structure
 */
export interface DashboardData {
  user_stats: UserStats;
  study_progress: StudyProgress;
  upcoming_sessions: UpcomingSessions;
  recent_decks: RecentDeck[];
  ai_usage: AIUsage;
  quick_actions: QuickActions;
}

/**
 * Response DTO for GET /api/dashboard
 */
export interface DashboardResponseDTO {
  data: DashboardData;
}

// =============================================================================
// DASHBOARD VIEW MODEL TYPES
// =============================================================================

/**
 * Stan całego dashboard
 */
export interface DashboardState {
  data: DashboardData | null;
  isLoading: boolean;
  error: string | null;
  lastRefresh: Date | null;
  showWelcomeToast: boolean;
}

/**
 * Props dla kafla KPI
 */
export interface KpiTileProps {
  title: string;
  value: number | string;
  subtitle?: string;
  variant: "primary" | "warning" | "success" | "neutral";
  onClick?: () => void;
  isClickable?: boolean;
  icon?: React.ComponentType;
  tooltip?: string;
}

/**
 * Props dla karty talii
 */
export interface DeckCardProps {
  deck: RecentDeck;
  onClick: (slug: string) => void;
  showStats?: boolean;
  showLastActivity?: boolean;
}

/**
 * Props dla przycisku szybkiej akcji
 */
export interface QuickActionButtonProps {
  title: string;
  description?: string;
  icon: React.ComponentType;
  onClick: () => void;
  isDisabled?: boolean;
  variant: "primary" | "secondary";
  disabledReason?: string;
}

/**
 * Props dla bannera limitów
 */
export interface BannerLimitsProps {
  aiUsage: AIUsage;
  onDismiss: () => void;
  onLearnMore?: () => void;
  type: "warning" | "info";
}

/**
 * Props dla toasta powitalnego
 */
export interface ToastWelcomeProps {
  userName?: string;
  onDismiss: () => void;
  autoClose?: boolean;
  duration?: number;
}

/**
 * Props dla sekcji recent decks
 */
export interface RecentDecksSectionProps {
  recentDecks: RecentDeck[];
  onDeckClick: (slug: string) => void;
  onViewAll: () => void;
  isLoading?: boolean;
}

/**
 * Props dla sekcji quick actions
 */
export interface QuickActionsSectionProps {
  quickActions: QuickActions;
  onActionClick: (action: string) => void;
}
