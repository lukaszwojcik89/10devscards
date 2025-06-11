# REST API Plan

## 1. Resources

| Resource      | Database Table             | Description                                                  |
| ------------- | -------------------------- | ------------------------------------------------------------ |
| Decks         | `decks`                    | Collections of flashcards organized by topic                 |
| Flashcards    | `flashcards`               | Individual question-answer pairs with AI generation metadata |
| Reviews       | `reviews`                  | User's study session records and performance data            |
| Budget Events | `budget_events`            | AI generation cost tracking (admin only)                     |
| KPI           | `kpi_daily`, `kpi_monthly` | Analytics and metrics (admin only)                           |

## 2. Endpoints

### 2.1 Authentication

#### POST /auth/signup

- **Description**: Create new user account with age verification
- **Request Body**:

```json
{
  "email": "user@example.com",
  "password": "SecurePass123#",
  "age_verification": true
}
```

- **Response**: `201 Created`

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "email_confirmed_at": null
  },
  "message": "Verification email sent"
}
```

- **Error Codes**:
  - `400 Bad Request`: Invalid email/password format or missing age verification
  - `409 Conflict`: Email already exists

#### POST /auth/signin

- **Description**: Authenticate existing user
- **Request Body**:

```json
{
  "email": "user@example.com",
  "password": "SecurePass123#"
}
```

- **Response**: `200 OK`

```json
{
  "access_token": "jwt_token",
  "refresh_token": "refresh_token",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

- **Error Codes**:
  - `400 Bad Request`: Invalid credentials
  - `401 Unauthorized`: Account not verified

#### POST /auth/signout

- **Description**: Invalidate user session
- **Response**: `200 OK`

### 2.2 Decks

#### GET /api/decks

- **Description**: List user's decks with pagination
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 20, max: 50)
  - `search`: Filter by deck name (optional)
- **Response**: `200 OK`

```json
{
  "data": [
    {
      "id": "uuid",
      "slug": "javascript-basics",
      "name": "JavaScript Basics",
      "description": "Core JavaScript concepts",
      "flashcard_count": 25,
      "pending_count": 3,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-02T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "total_pages": 1
  }
}
```

#### POST /api/decks

- **Description**: Create new deck
- **Request Body**:

```json
{
  "name": "Python Advanced",
  "slug": "python-advanced",
  "description": "Advanced Python concepts"
}
```

- **Response**: `201 Created`

```json
{
  "id": "uuid",
  "slug": "python-advanced",
  "name": "Python Advanced",
  "description": "Advanced Python concepts",
  "flashcard_count": 0,
  "pending_count": 0,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

- **Error Codes**:
  - `400 Bad Request`: Invalid name/slug format or duplicate slug
  - `422 Unprocessable Entity`: Validation errors

#### GET /api/decks/{id}

- **Description**: Get specific deck details
- **Response**: `200 OK`

```json
{
  "id": "uuid",
  "slug": "javascript-basics",
  "name": "JavaScript Basics",
  "description": "Core JavaScript concepts",
  "flashcard_count": 25,
  "pending_count": 3,
  "accepted_count": 20,
  "rejected_count": 2,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-02T00:00:00Z"
}
```

- **Error Codes**:
  - `404 Not Found`: Deck doesn't exist or not owned by user

#### PUT /api/decks/{id}

- **Description**: Update deck information
- **Request Body**:

```json
{
  "name": "JavaScript Fundamentals",
  "description": "Updated description"
}
```

- **Response**: `200 OK` (same structure as GET)
- **Error Codes**:
  - `400 Bad Request`: Invalid data format
  - `404 Not Found`: Deck not found

#### DELETE /api/decks/{id}

- **Description**: Soft delete deck and all flashcards
- **Response**: `204 No Content`
- **Error Codes**:
  - `404 Not Found`: Deck not found

### 2.3 Flashcards

#### GET /api/decks/{deck_id}/flashcards

- **Description**: List flashcards in a deck
- **Query Parameters**:
  - `status`: Filter by status (pending, accepted, rejected)
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 20, max: 50)
- **Response**: `200 OK`

```json
{
  "data": [
    {
      "id": "uuid",
      "question": "What is closure in JavaScript?",
      "answer": "A function that has access to variables in its outer scope",
      "status": "accepted",
      "box": "box2",
      "next_due_date": "2024-01-05T00:00:00Z",
      "model": "gpt-4o-mini",
      "tokens_used": 85,
      "price_usd": 0.000025,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 25,
    "total_pages": 2
  }
}
```

#### POST /api/decks/{deck_id}/flashcards

- **Description**: Manually create flashcard
- **Request Body**:

```json
{
  "question": "What is a Promise in JavaScript?",
  "answer": "An object representing eventual completion of an async operation"
}
```

- **Response**: `201 Created`

```json
{
  "id": "uuid",
  "question": "What is a Promise in JavaScript?",
  "answer": "An object representing eventual completion of an async operation",
  "status": "accepted",
  "box": "box1",
  "next_due_date": "2024-01-02T00:00:00Z",
  "created_at": "2024-01-01T00:00:00Z"
}
```

- **Error Codes**:
  - `400 Bad Request`: Question/answer too long or empty
  - `404 Not Found`: Deck not found

#### POST /api/flashcards/generate

- **Description**: Generate flashcards using AI
- **Request Body**:

```json
{
  "deck_id": "uuid",
  "input_text": "JavaScript closures are functions that have access to variables in their outer scope...",
  "max_flashcards": 5
}
```

- **Response**: `201 Created`

```json
{
  "generated_flashcards": [
    {
      "id": "uuid",
      "question": "What is a closure in JavaScript?",
      "answer": "A function that has access to variables in its outer scope",
      "status": "pending",
      "model": "gpt-4o-mini",
      "tokens_used": 85,
      "price_usd": 0.000025
    }
  ],
  "generation_summary": {
    "total_generated": 3,
    "total_tokens": 255,
    "total_cost_usd": 0.000075,
    "model_used": "gpt-4o-mini"
  }
}
```

- **Error Codes**:
  - `400 Bad Request`: Input text too long (>2000 chars) or empty
  - `402 Payment Required`: Budget limit reached
  - `429 Too Many Requests`: Rate limit exceeded

#### GET /api/flashcards/{id}

- **Description**: Get specific flashcard
- **Response**: `200 OK` (same structure as list item)

#### PUT /api/flashcards/{id}

- **Description**: Update flashcard content
- **Request Body**:

```json
{
  "question": "Updated question",
  "answer": "Updated answer"
}
```

- **Response**: `200 OK` (same structure as GET)

#### DELETE /api/flashcards/{id}

- **Description**: Delete flashcard
- **Response**: `204 No Content`

#### POST /api/flashcards/{id}/accept

- **Description**: Accept AI-generated flashcard
- **Response**: `200 OK`

```json
{
  "id": "uuid",
  "status": "accepted",
  "box": "box1",
  "next_due_date": "2024-01-02T00:00:00Z"
}
```

#### POST /api/flashcards/{id}/reject

- **Description**: Reject AI-generated flashcard
- **Response**: `200 OK`

```json
{
  "id": "uuid",
  "status": "rejected"
}
```

### 2.4 Review Sessions

#### GET /api/reviews/session

- **Description**: Get flashcards due for review
- **Query Parameters**:
  - `limit`: Max flashcards to review (default: 50, max: 70 with catch-up)
  - `include_catchup`: Include overdue flashcards (boolean)
- **Response**: `200 OK`

```json
{
  "session_id": "uuid",
  "flashcards": [
    {
      "id": "uuid",
      "question": "What is closure in JavaScript?",
      "deck_name": "JavaScript Basics",
      "box": "box2",
      "due_date": "2024-01-01T00:00:00Z"
    }
  ],
  "session_info": {
    "total_due": 15,
    "daily_limit_remaining": 35,
    "catchup_available": 5
  }
}
```

#### POST /api/reviews

- **Description**: Submit review answer
- **Request Body**:

```json
{
  "flashcard_id": "uuid",
  "is_correct": true,
  "response_time_ms": 3500
}
```

- **Response**: `201 Created`

```json
{
  "review_id": "uuid",
  "flashcard": {
    "id": "uuid",
    "new_box": "box3",
    "next_due_date": "2024-01-08T00:00:00Z"
  },
  "session_progress": {
    "completed": 5,
    "remaining": 10,
    "daily_limit_remaining": 30
  }
}
```

- **Error Codes**:
  - `400 Bad Request`: Invalid response data
  - `429 Too Many Requests`: Daily review limit exceeded

#### GET /api/reviews/stats

- **Description**: Get user's review statistics
- **Query Parameters**:
  - `period`: daily, weekly, monthly (default: daily)
- **Response**: `200 OK`

```json
{
  "period": "daily",
  "stats": {
    "reviews_completed": 25,
    "accuracy_rate": 0.84,
    "average_response_time_ms": 4200,
    "streak_days": 7,
    "flashcards_graduated": 3
  },
  "daily_breakdown": [
    {
      "date": "2024-01-01",
      "reviews": 15,
      "accuracy": 0.87
    }
  ]
}
```

### 2.5 User Management

#### GET /api/users/profile

- **Description**: Get current user profile
- **Response**: `200 OK`

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "created_at": "2024-01-01T00:00:00Z",
  "stats": {
    "total_decks": 3,
    "total_flashcards": 75,
    "total_reviews": 250
  }
}
```

#### GET /api/users/export

- **Description**: Export all user data
- **Response**: `200 OK`

```json
{
  "export_date": "2024-01-01T00:00:00Z",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "decks": [...],
  "flashcards": [...],
  "reviews": [...]
}
```

#### DELETE /api/users/account

- **Description**: Permanently delete user account and all data
- **Response**: `204 No Content`
- **Error Codes**:
  - `400 Bad Request`: Account deletion confirmation required

### 2.6 Admin Endpoints

#### GET /api/admin/budget

- **Description**: Get budget usage and alerts
- **Response**: `200 OK`

```json
{
  "current_month": {
    "spent_usd": 8.50,
    "budget_usd": 10.00,
    "percentage_used": 85.0,
    "alert_triggered": true
  },
  "recent_events": [...]
}
```

#### GET /api/admin/kpi

- **Description**: Get KPI metrics
- **Query Parameters**:
  - `period`: daily, monthly
  - `start_date`, `end_date`: Date range
- **Response**: `200 OK`

```json
{
  "period": "daily",
  "metrics": [
    {
      "date": "2024-01-01",
      "accepted_count": 150,
      "rejected_count": 25,
      "accepted_pct": 85.7,
      "active_users": 45,
      "cost_usd": 0.75
    }
  ]
}
```

## 3. Authentication and Authorization

### Authentication

- **Method**: Supabase Auth with JWT tokens
- **Session Management**: 30-minute token expiry with refresh tokens
- **Password Requirements**: Minimum 12 characters with uppercase, lowercase, number, and special character
- **Email Verification**: Required before account activation

### Authorization

- **Row Level Security (RLS)**: Implemented at database level
- **User Access**: Users can only access their own decks, flashcards, and reviews
- **Admin Access**: Special role required for budget and KPI endpoints
- **Rate Limiting**:
  - AI generation: Budget-based limiting
  - Reviews: 50 per day + 20 catch-up
  - General API: 1000 requests per hour per user

## 4. Validation and Business Logic

### Validation Rules

#### Decks

- **Name**: 1-100 characters, required
- **Slug**: Lowercase letters, numbers, hyphens only; unique per user
- **Description**: Optional, max 500 characters

#### Flashcards

- **Question**: Required, max 256 characters
- **Answer**: Required, max 512 characters
- **Status**: Must be 'pending', 'accepted', or 'rejected'
- **Box**: Must be 'box1', 'box2', 'box3', or 'graduated'

#### Reviews

- **Response Time**: Positive integer (milliseconds)
- **Is Correct**: Boolean, required
- **Daily Limit**: Max 50 reviews + 20 catch-up per day

#### AI Generation

- **Input Text**: Required, max 2000 characters
- **Max Flashcards**: 1-10 per request
- **Budget Check**: Verify available budget before generation

### Business Logic Implementation

#### Leitner Box System

1. **Correct Answer**: Advance to next box (box1→box2→box3→graduated)
2. **Incorrect Answer**: Reset to box1
3. **Due Date Calculation**:
   - Box1: +1 day
   - Box2: +3 days
   - Box3: +7 days
   - Graduated: +30 days

#### Auto-Acceptance

- Flashcards with 'pending' status automatically become 'accepted' after 5 days
- Implemented via background Edge Function (not API endpoint)

#### Budget Management

- Track all AI generation costs in `budget_events` table
- Alert at 80% of monthly budget
- Block generation at 100% of budget
- Monthly reset of budget calculations

#### Session Management

- Cache review sessions in Supabase KV with 12-hour TTL
- Validate daily review limits before creating sessions
- Update flashcard scheduling after each review submission
