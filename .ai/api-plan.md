# REST API Plan

## 1. Resources

| Resource | Database Table | Description |
|----------|---------------|-------------|
| Decks | `decks` | User-owned collections of flashcards |
| Flashcards | `flashcards` | Individual learning cards within decks |
| Reviews | `reviews` | Study session records and answers |
| Study Sessions | Virtual resource | Active learning sessions |
| User Data | Multiple tables | User profile and export functionality |
| Budget | `budget_events` | AI cost tracking and limits |

## 2. Endpoints

### 2.1 Decks Resource

#### Get User's Decks

- **Method**: GET
- **Path**: `/api/decks`
- **Description**: Retrieve all decks for authenticated user
- **Query Parameters**:
  - `limit` (optional): Number of results (default: 20, max: 100)
  - `offset` (optional): Pagination offset (default: 0)
  - `include_deleted` (optional): Include soft-deleted decks (default: false)
- **Response**:

```json
{
  "data": [
    {
      "id": "uuid",
      "slug": "python-basics",
      "name": "Python Basics",
      "description": "Fundamental Python concepts",
      "created_at": "2025-06-11T10:00:00Z",
      "updated_at": "2025-06-11T10:00:00Z",
      "flashcard_count": 25,
      "pending_count": 3
    }
  ],
  "pagination": {
    "total": 5,
    "limit": 20,
    "offset": 0,
    "has_more": false
  }
}
```

- **Success**: 200 OK
- **Errors**: 401 Unauthorized, 500 Internal Server Error

#### Get Single Deck

- **Method**: GET
- **Path**: `/api/decks/{slug}`
- **Description**: Retrieve specific deck by slug
- **Response**:

```json
{
  "data": {
    "id": "uuid",
    "slug": "python-basics",
    "name": "Python Basics",
    "description": "Fundamental Python concepts",
    "created_at": "2025-06-11T10:00:00Z",
    "updated_at": "2025-06-11T10:00:00Z",
    "flashcard_count": 25,
    "pending_count": 3
  }
}
```

- **Success**: 200 OK
- **Errors**: 401 Unauthorized, 404 Not Found, 500 Internal Server Error

#### Create Deck

- **Method**: POST
- **Path**: `/api/decks`
- **Description**: Create new flashcard deck
- **Request Body**:

```json
{
  "slug": "javascript-advanced",
  "name": "Advanced JavaScript",
  "description": "ES6+ features and patterns"
}
```

- **Response**:

```json
{
  "data": {
    "id": "uuid",
    "slug": "javascript-advanced",
    "name": "Advanced JavaScript",
    "description": "ES6+ features and patterns",
    "created_at": "2025-06-11T10:00:00Z",
    "updated_at": "2025-06-11T10:00:00Z",
    "flashcard_count": 0,
    "pending_count": 0
  }
}
```

- **Success**: 201 Created
- **Errors**: 400 Bad Request, 401 Unauthorized, 409 Conflict (slug exists), 500 Internal Server Error

#### Update Deck

- **Method**: PUT
- **Path**: `/api/decks/{slug}`
- **Description**: Update deck information
- **Request Body**:

```json
{
  "name": "Updated Deck Name",
  "description": "Updated description"
}
```

- **Response**: Same as Get Single Deck
- **Success**: 200 OK
- **Errors**: 400 Bad Request, 401 Unauthorized, 404 Not Found, 500 Internal Server Error

#### Delete Deck

- **Method**: DELETE
- **Path**: `/api/decks/{slug}`
- **Description**: Soft delete deck and all flashcards
- **Response**:

```json
{
  "message": "Deck deleted successfully"
}
```

- **Success**: 200 OK
- **Errors**: 401 Unauthorized, 404 Not Found, 500 Internal Server Error

### 2.2 Flashcards Resource

#### Get Deck Flashcards

- **Method**: GET
- **Path**: `/api/decks/{slug}/flashcards`
- **Description**: Retrieve flashcards for specific deck
- **Query Parameters**:
  - `status` (optional): Filter by status ('pending', 'accepted', 'rejected')
  - `box` (optional): Filter by Leitner box ('box1', 'box2', 'box3', 'graduated')
  - `limit` (optional): Number of results (default: 20, max: 100)
  - `offset` (optional): Pagination offset (default: 0)
- **Response**:

```json
{
  "data": [
    {
      "id": "uuid",
      "question": "What is a closure in JavaScript?",
      "answer": "A closure is a function that has access to variables from its outer scope",
      "status": "accepted",
      "box": "box2",
      "next_due_date": "2025-06-14T10:00:00Z",
      "created_at": "2025-06-11T10:00:00Z",
      "updated_at": "2025-06-11T10:00:00Z",
      "model": "gpt-4o-mini",
      "tokens_used": 95
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
}
```

- **Success**: 200 OK
- **Errors**: 401 Unauthorized, 404 Not Found (deck), 500 Internal Server Error

#### Get Single Flashcard

- **Method**: GET
- **Path**: `/api/flashcards/{id}`
- **Description**: Retrieve specific flashcard
- **Response**:

```json
{
  "data": {
    "id": "uuid",
    "deck_id": "uuid",
    "question": "What is a closure in JavaScript?",
    "answer": "A closure is a function that has access to variables from its outer scope",
    "status": "accepted",
    "box": "box2",
    "next_due_date": "2025-06-14T10:00:00Z",
    "created_at": "2025-06-11T10:00:00Z",
    "updated_at": "2025-06-11T10:00:00Z",
    "model": "gpt-4o-mini",
    "tokens_used": 95
  }
}
```

- **Success**: 200 OK
- **Errors**: 401 Unauthorized, 404 Not Found, 500 Internal Server Error

#### Generate Flashcards with AI

- **Method**: POST
- **Path**: `/api/flashcards/generate`
- **Description**: Generate flashcards from text using AI
- **Request Body**:

```json
{
  "deck_id": "uuid",
  "input_text": "JavaScript closures are functions that retain access to their lexical scope...",
  "max_cards": 5,
  "difficulty": "intermediate"
}
```

- **Response**:

```json
{
  "data": [
    {
      "id": "uuid",
      "question": "What is a closure in JavaScript?",
      "answer": "A closure is a function that has access to variables from its outer scope",
      "status": "pending",
      "box": "box1",
      "next_due_date": "2025-06-11T10:00:00Z",
      "created_at": "2025-06-11T10:00:00Z",
      "model": "gpt-4o-mini",
      "tokens_used": 95,
      "price_usd": 0.000285
    }
  ],
  "metadata": {
    "total_tokens": 450,
    "total_cost_usd": 0.00135,
    "model_used": "gpt-4o-mini",
    "generation_time_ms": 2340
  }
}
```

- **Success**: 201 Created
- **Errors**: 400 Bad Request (text too long, budget exceeded), 401 Unauthorized, 404 Not Found (deck), 429 Too Many Requests, 500 Internal Server Error, 503 Service Unavailable (budget limit reached)

#### Create Manual Flashcard

- **Method**: POST
- **Path**: `/api/flashcards`
- **Description**: Create flashcard manually
- **Request Body**:

```json
{
  "deck_id": "uuid",
  "question": "What is the difference between let and var?",
  "answer": "let has block scope while var has function scope"
}
```

- **Response**: Same as Get Single Flashcard
- **Success**: 201 Created
- **Errors**: 400 Bad Request, 401 Unauthorized, 404 Not Found (deck), 500 Internal Server Error

#### Update Flashcard

- **Method**: PUT
- **Path**: `/api/flashcards/{id}`
- **Description**: Update flashcard content
- **Request Body**:

```json
{
  "question": "Updated question?",
  "answer": "Updated answer"
}
```

- **Response**: Same as Get Single Flashcard
- **Success**: 200 OK
- **Errors**: 400 Bad Request, 401 Unauthorized, 404 Not Found, 500 Internal Server Error

#### Update Flashcard Status

- **Method**: PATCH
- **Path**: `/api/flashcards/{id}/status`
- **Description**: Accept or reject pending flashcard
- **Request Body**:

```json
{
  "status": "accepted"
}
```

- **Response**: Same as Get Single Flashcard
- **Success**: 200 OK
- **Errors**: 400 Bad Request, 401 Unauthorized, 404 Not Found, 500 Internal Server Error

#### Delete Flashcard

- **Method**: DELETE
- **Path**: `/api/flashcards/{id}`
- **Description**: Delete flashcard
- **Response**:

```json
{
  "message": "Flashcard deleted successfully"
}
```

- **Success**: 200 OK
- **Errors**: 401 Unauthorized, 404 Not Found, 500 Internal Server Error

### 2.3 Study Sessions Resource

#### Get Study Session

- **Method**: GET
- **Path**: `/api/study/session`
- **Description**: Get flashcards for current study session
- **Query Parameters**:
  - `include_catchup` (optional): Include overdue cards (default: false)
  - `deck_slug` (optional): Limit to specific deck
- **Response**:

```json
{
  "data": {
    "session_id": "uuid",
    "flashcards": [
      {
        "id": "uuid",
        "question": "What is a closure in JavaScript?",
        "deck_name": "JavaScript Basics",
        "box": "box1",
        "due_date": "2025-06-11T10:00:00Z"
      }
    ],
    "metadata": {
      "total_due": 15,
      "session_limit": 50,
      "catchup_available": 5,
      "daily_reviews_completed": 23,
      "daily_limit": 50
    }
  }
}
```

- **Success**: 200 OK
- **Errors**: 401 Unauthorized, 429 Too Many Requests (daily limit), 500 Internal Server Error

### 2.4 Reviews Resource

#### Submit Review

- **Method**: POST
- **Path**: `/api/reviews`
- **Description**: Submit answer for flashcard
- **Request Body**:

```json
{
  "flashcard_id": "uuid",
  "is_correct": true,
  "response_time_ms": 3500
}
```

- **Response**:

```json
{
  "data": {
    "id": "uuid",
    "flashcard_id": "uuid",
    "is_correct": true,
    "response_time_ms": 3500,
    "created_at": "2025-06-11T10:00:00Z",
    "next_review": {
      "box": "box2",
      "next_due_date": "2025-06-14T10:00:00Z"
    }
  }
}
```

- **Success**: 201 Created
- **Errors**: 400 Bad Request, 401 Unauthorized, 404 Not Found (flashcard), 429 Too Many Requests (daily limit), 500 Internal Server Error

#### Get Review History

- **Method**: GET
- **Path**: `/api/reviews`
- **Description**: Get user's review history
- **Query Parameters**:
  - `flashcard_id` (optional): Filter by specific flashcard
  - `from_date` (optional): Start date filter
  - `to_date` (optional): End date filter
  - `limit` (optional): Number of results (default: 50, max: 500)
  - `offset` (optional): Pagination offset
- **Response**:

```json
{
  "data": [
    {
      "id": "uuid",
      "flashcard_id": "uuid",
      "is_correct": true,
      "response_time_ms": 3500,
      "created_at": "2025-06-11T10:00:00Z",
      "flashcard": {
        "question": "What is a closure?",
        "deck_name": "JavaScript Basics"
      }
    }
  ],
  "pagination": {
    "total": 125,
    "limit": 50,
    "offset": 0,
    "has_more": true
  }
}
```

- **Success**: 200 OK
- **Errors**: 401 Unauthorized, 500 Internal Server Error

### 2.5 User Data Resource

#### Export User Data

- **Method**: GET
- **Path**: `/api/user/export`
- **Description**: Export all user data as JSON
- **Response**:

```json
{
  "export_timestamp": "2025-06-11T10:00:00Z",
  "user_id": "uuid",
  "decks": [...],
  "flashcards": [...],
  "reviews": [...],
  "statistics": {
    "total_flashcards": 150,
    "total_reviews": 1250,
    "accuracy_rate": 0.76,
    "streak_days": 15
  }
}
```

- **Success**: 200 OK
- **Errors**: 401 Unauthorized, 500 Internal Server Error

#### Delete User Account

- **Method**: DELETE
- **Path**: `/api/user/account`
- **Description**: Permanently delete user account and all data
- **Request Body**:

```json
{
  "confirmation": "DELETE_MY_ACCOUNT"
}
```

- **Response**:

```json
{
  "message": "Account deleted successfully"
}
```

- **Success**: 200 OK
- **Errors**: 400 Bad Request (invalid confirmation), 401 Unauthorized, 500 Internal Server Error

### 2.6 Budget Resource (Admin Only)

#### Get Budget Status

- **Method**: GET
- **Path**: `/api/admin/budget/status`
- **Description**: Get current budget usage and alerts
- **Response**:

```json
{
  "data": {
    "current_month": "2025-06",
    "budget_limit_usd": 10.00,
    "current_usage_usd": 7.85,
    "usage_percentage": 78.5,
    "threshold_80_reached": false,
    "threshold_100_reached": false,
    "generation_blocked": false,
    "last_updated": "2025-06-11T10:00:00Z"
  }
}
```

- **Success**: 200 OK
- **Errors**: 401 Unauthorized, 403 Forbidden (not admin), 500 Internal Server Error

### 2.7 Authentication Resource

#### Register User

- **Method**: POST
- **Path**: `/api/auth/register`
- **Description**: Register new user account
- **Request Body**:

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "age_confirmation": true
}
```

- **Response**:

```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "email_confirmed_at": null,
      "created_at": "2025-06-11T10:00:00Z"
    },
    "message": "Please check your email to confirm your account"
  }
}
```

- **Success**: 201 Created
- **Errors**: 400 Bad Request (invalid email/password, age confirmation missing), 409 Conflict (email exists), 500 Internal Server Error

#### Login User

- **Method**: POST
- **Path**: `/api/auth/login`
- **Description**: Authenticate user and return JWT tokens
- **Request Body**:

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

- **Response**:

```json
{
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600,
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "email_confirmed_at": "2025-06-11T10:00:00Z"
    }
  }
}
```

- **Success**: 200 OK
- **Errors**: 400 Bad Request (invalid credentials), 401 Unauthorized (unconfirmed email), 429 Too Many Requests, 500 Internal Server Error

#### Logout User

- **Method**: POST
- **Path**: `/api/auth/logout`
- **Description**: Invalidate current session
- **Headers**: `Authorization: Bearer <access_token>`
- **Response**:

```json
{
  "message": "Logged out successfully"
}
```

- **Success**: 200 OK
- **Errors**: 401 Unauthorized, 500 Internal Server Error

#### Refresh Token

- **Method**: POST
- **Path**: `/api/auth/refresh`
- **Description**: Get new access token using refresh token
- **Request Body**:

```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

- **Response**:

```json
{
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600
  }
}
```

- **Success**: 200 OK
- **Errors**: 400 Bad Request (invalid refresh token), 401 Unauthorized, 500 Internal Server Error

#### Get Current User

- **Method**: GET
- **Path**: `/api/auth/me`
- **Description**: Get current authenticated user profile
- **Headers**: `Authorization: Bearer <access_token>`
- **Response**:

```json
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "email_confirmed_at": "2025-06-11T10:00:00Z",
    "created_at": "2025-06-11T10:00:00Z",
    "last_sign_in_at": "2025-06-11T09:30:00Z"
  }
}
```

- **Success**: 200 OK
- **Errors**: 401 Unauthorized, 500 Internal Server Error

#### Password Reset Request

- **Method**: POST
- **Path**: `/api/auth/password/reset`
- **Description**: Send password reset email
- **Request Body**:

```json
{
  "email": "user@example.com"
}
```

- **Response**:

```json
{
  "message": "If an account with this email exists, you will receive password reset instructions"
}
```

- **Success**: 200 OK
- **Errors**: 429 Too Many Requests, 500 Internal Server Error

#### Password Reset Confirm

- **Method**: POST
- **Path**: `/api/auth/password/update`
- **Description**: Update password with reset token
- **Request Body**:

```json
{
  "token": "reset_token_from_email",
  "password": "NewSecurePassword123!"
}
```

- **Response**:

```json
{
  "message": "Password updated successfully"
}
```

- **Success**: 200 OK
- **Errors**: 400 Bad Request (invalid token/password), 500 Internal Server Error

## 3. Authentication and Authorization

### 3.1 Authentication Method

- **Supabase Auth Integration**: All endpoints require valid JWT token from Supabase Auth
- **Token Location**: Authorization header: `Bearer <jwt_token>`
- **Session Management**: 30-minute inactivity timeout
- **Token Refresh**: Automatic refresh handled by Supabase client

### 3.2 Authorization Rules

- **User Resources**: Users can only access their own decks, flashcards, and reviews (enforced by RLS)
- **Admin Resources**: Budget endpoints require `service_role` JWT claim
- **Rate Limiting**:
  - Study sessions: 50 reviews per day + 20 catch-up
  - AI generation: Limited by budget constraints
  - General API: 1000 requests per hour per user

### 3.3 Security Headers

- All responses include:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`

## 4. Validation and Business Logic

### 4.1 Validation Rules

#### Decks

- `name`: Required, 1-100 characters
- `slug`: Required, lowercase alphanumeric with hyphens, unique per user
- `description`: Optional, max 500 characters

#### Flashcards

- `question`: Required, max 256 characters
- `answer`: Required, max 512 characters
- `status`: Must be 'pending', 'accepted', or 'rejected'
- `box`: Must be 'box1', 'box2', 'box3', or 'graduated'

#### Reviews

- `is_correct`: Required boolean
- `response_time_ms`: Required positive integer
- `flashcard_id`: Must reference existing flashcard owned by user

#### AI Generation

- `input_text`: Required, max 2000 characters
- `max_cards`: Optional, 1-10 (default: 5)
- `deck_id`: Must reference existing deck owned by user

### 4.2 Business Logic Implementation

#### Leitner System Progression

- Correct answer: Advance to next box with scheduled intervals
  - box1 → box2 (3 days)
  - box2 → box3 (7 days)
  - box3 → graduated (30 days)
- Incorrect answer: Reset to box1 (1 day)
- Implemented via database triggers on review insertion

#### Auto-acceptance Logic

- Flashcards with status 'pending' for >5 days automatically become 'accepted'
- Implemented via Edge Function cron job (runs every 12 hours)

#### Budget Management

- Real-time cost tracking in `budget_events` table
- 80% threshold triggers warning alerts
- 100% threshold blocks AI generation until next month
- Cumulative cost calculation with monthly reset

#### Daily Limits

- Study sessions limited to 50 reviews + 20 catch-up per day
- Catch-up option only available once per day
- Limits reset at midnight UTC

#### Rate Limiting

- Per-user API rate limits enforced at Edge Function level
- Study session limits enforced in application logic
- Budget limits enforced before AI API calls

### 4.3 Error Handling

#### Standard Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Question text exceeds maximum length of 256 characters",
    "details": {
      "field": "question",
      "received_length": 312,
      "max_length": 256
    }
  }
}
```

#### Error Codes

- `VALIDATION_ERROR`: Request validation failed
- `UNAUTHORIZED`: Invalid or missing authentication
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Requested resource not found
- `RATE_LIMITED`: Too many requests
- `BUDGET_EXCEEDED`: AI budget limit reached
- `DAILY_LIMIT_EXCEEDED`: Study session limit reached
- `INTERNAL_ERROR`: Server error

### 4.4 Performance Considerations

#### Caching Strategy

- Study session results cached in Supabase KV (12-hour TTL)
- Budget status cached for 5 minutes
- User deck lists cached for 1 hour

#### Database Optimization

- Indexes on frequently queried fields (due dates, user IDs, deck IDs)
- Partitioned reviews table for large datasets
- Connection pooling for database queries

#### Response Optimization

- Pagination for all list endpoints
- Selective field loading for large responses
- Compressed responses for large exports
