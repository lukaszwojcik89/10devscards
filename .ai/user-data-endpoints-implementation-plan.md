# API Endpoint Implementation Plan: User Data Endpoints (Export & Account Deletion)

## 1. Przegląd endpointów

### Endpoints included in this plan

1. **GET /api/user/export** - Export all user data
2. **DELETE /api/user/account** - Permanently delete user account

### Powiązania z main API plan

- **Specyfikacja**: `/home/lukas/10devscards/.ai/api-plan.md` lines 453-502
- **Resource**: User Data Resource (Section 2.5)
- **DTOs**: `/home/lukas/10devscards/src/types.ts` - UserDataExportResponseDTO, DeleteAccountRequestDTO

## 2. Cel i wymagania biznesowe

### User data export endpoint

- **Cel**: Umożliwienie użytkownikom eksportu wszystkich ich danych zgodnie z GDPR
- **Business value**: Data portability, compliance, user trust
- **Use cases**:
  - Backup osobisty przed migracją
  - Audyt własnych danych nauki
  - Compliance z GDPR Article 20 (Right to data portability)

### Account deletion endpoint

- **Cel**: Umożliwienie użytkownikom trwałego usunięcia konta zgodnie z GDPR
- **Business value**: Privacy compliance, user control, reduced storage costs
- **Use cases**:
  - Definitywne opuszczenie platformy
  - Compliance z GDPR Article 17 (Right to be forgotten)
  - Security incident response

## 3. Szczegóły requestów

### GET /api/user/export

- **Method**: GET
- **Path**: `/api/user/export`
- **Headers**: `Authorization: Bearer <access_token>`
- **Query Parameters**: None
- **Body**: None

### DELETE /api/user/account

- **Method**: DELETE
- **Path**: `/api/user/account`
- **Headers**: `Authorization: Bearer <access_token>`
- **Body**:

```json
{
  "confirmation": "DELETE_MY_ACCOUNT"
}
```

## 4. Szczegóły odpowiedzi

### GET /api/user/export - Sukces (200 OK)

```json
{
  "export_timestamp": "2025-06-11T10:00:00Z",
  "user_id": "uuid",
  "decks": [
    {
      "id": "uuid",
      "slug": "python-basics",
      "name": "Python Basics",
      "description": "Fundamental Python concepts",
      "created_at": "2025-06-11T10:00:00Z",
      "updated_at": "2025-06-11T10:00:00Z"
    }
  ],
  "flashcards": [
    {
      "id": "uuid",
      "deck_id": "uuid",
      "question": "What is a variable in Python?",
      "answer": "A container for storing data values",
      "created_at": "2025-06-11T10:00:00Z",
      "updated_at": "2025-06-11T10:00:00Z",
      "ai_generated": true,
      "generation_model": "gpt-4o-mini",
      "generation_prompt_hash": "abc123"
    }
  ],
  "reviews": [
    {
      "id": "uuid",
      "flashcard_id": "uuid",
      "quality": 4,
      "response_time_ms": 3200,
      "ease_factor": 2.5,
      "interval_days": 4,
      "reviewed_at": "2025-06-11T10:00:00Z"
    }
  ],
  "statistics": {
    "total_flashcards": 150,
    "total_reviews": 1250,
    "accuracy_rate": 0.76,
    "streak_days": 15
  }
}
```

### DELETE /api/user/account - Sukces (200 OK)

```json
{
  "message": "Account deleted successfully"
}
```

### Error responses

#### 400 Bad Request (DELETE only)

```json
{
  "error": "INVALID_CONFIRMATION",
  "message": "Invalid confirmation text. Must be 'DELETE_MY_ACCOUNT'"
}
```

#### 401 Unauthorized

```json
{
  "error": "UNAUTHORIZED",
  "message": "Authentication required"
}
```

#### 500 Internal Server Error

```json
{
  "error": "INTERNAL_SERVER_ERROR",
  "message": "An error occurred processing your request"
}
```

## 5. Przepływ danych

### GET /api/user/export flow

1. **Authentication check** - weryfikacja JWT tokena i aktywności sesji
2. **User identification** - pobranie user_id z tokena
3. **Data aggregation** - równoległe zapytania do wszystkich tabel:
   - Decks owned by user
   - Flashcards in user's decks
   - Reviews by user
   - Calculated statistics
4. **Data serialization** - formatowanie zgodnie z UserDataExportResponseDTO
5. **Response preparation** - dodanie export_timestamp
6. **Audit logging** - zapis zdarzenia eksportu danych
7. **Return response** - JSON z wszystkimi danymi użytkownika

### DELETE /api/user/account flow

1. **Authentication check** - weryfikacja JWT tokena
2. **Request validation** - sprawdzenie confirmation field
3. **User identification** - pobranie user_id z tokena
4. **Transaction start** - rozpoczęcie atomowej transakcji
5. **Cascading deletion** - usunięcie w odpowiedniej kolejności:
   - Reviews (foreign keys to flashcards)
   - Flashcards (foreign keys to decks)
   - Decks (owned by user)
   - User profile data
6. **Supabase auth deletion** - usunięcie z auth.users
7. **Transaction commit** - zatwierdzenie wszystkich zmian
8. **Session invalidation** - unieważnienie wszystkich tokenów
9. **Audit logging** - zapis zdarzenia usunięcia konta
10. **Response** - potwierdzenie sukcesu

## 6. Database queries

### Export endpoint queries

```sql
-- Get user's decks
SELECT id, slug, name, description, created_at, updated_at
FROM decks
WHERE owner_id = $1 AND deleted_at IS NULL
ORDER BY created_at;

-- Get user's flashcards with deck info
SELECT f.id, f.deck_id, f.question, f.answer, f.created_at, f.updated_at,
       f.ai_generated, f.generation_model, f.generation_prompt_hash
FROM flashcards f
JOIN decks d ON f.deck_id = d.id
WHERE d.owner_id = $1 AND f.deleted_at IS NULL
ORDER BY f.created_at;

-- Get user's reviews
SELECT r.id, r.flashcard_id, r.quality, r.response_time_ms,
       r.ease_factor, r.interval_days, r.reviewed_at
FROM reviews r
JOIN flashcards f ON r.flashcard_id = f.id
JOIN decks d ON f.deck_id = d.id
WHERE d.owner_id = $1
ORDER BY r.reviewed_at;

-- Calculate statistics
SELECT
  COUNT(DISTINCT f.id) as total_flashcards,
  COUNT(DISTINCT r.id) as total_reviews,
  ROUND(AVG(CASE WHEN r.quality >= 3 THEN 1.0 ELSE 0.0 END), 2) as accuracy_rate,
  COALESCE(MAX(streak.days), 0) as streak_days
FROM decks d
LEFT JOIN flashcards f ON d.id = f.deck_id AND f.deleted_at IS NULL
LEFT JOIN reviews r ON f.id = r.flashcard_id
LEFT JOIN (
  -- Subquery to calculate current streak
  SELECT COUNT(*) as days
  FROM generate_series(CURRENT_DATE - INTERVAL '365 days', CURRENT_DATE, '1 day'::interval) AS day
  WHERE EXISTS (
    SELECT 1 FROM reviews r2
    JOIN flashcards f2 ON r2.flashcard_id = f2.id
    JOIN decks d2 ON f2.deck_id = d2.id
    WHERE d2.owner_id = $1 AND DATE(r2.reviewed_at) = day::date
  )
) streak ON true
WHERE d.owner_id = $1;
```

### Account deletion queries

```sql
-- Start transaction
BEGIN;

-- Delete reviews (must be first due to foreign keys)
DELETE FROM reviews
WHERE flashcard_id IN (
  SELECT f.id FROM flashcards f
  JOIN decks d ON f.deck_id = d.id
  WHERE d.owner_id = $1
);

-- Delete flashcards
DELETE FROM flashcards
WHERE deck_id IN (
  SELECT id FROM decks WHERE owner_id = $1
);

-- Delete decks
DELETE FROM decks WHERE owner_id = $1;

-- Delete from Supabase auth (requires admin client)
-- This will be handled via Supabase Admin API

COMMIT;
```

## 7. Security considerations

### Authentication & Authorization

- **Required auth**: Bearer token w każdym requeście
- **User isolation**: RLS policies zapewniają dostęp tylko do własnych danych
- **Session validation**: Weryfikacja aktywności tokena
- **Admin permissions**: Brak - tylko właściciel może eksportować/usunąć swoje dane

### Data protection (Export)

- **PII handling**: Secure transmission, nie cachowanie odpowiedzi
- **Data minimization**: Tylko niezbędne dane w eksporcie
- **Access logging**: Audit trail dla compliance
- **Response sanitization**: Validacja przed zwróceniem

### Account deletion security

- **Confirmation required**: Explicit confirmation text to prevent accidents
- **Atomic operations**: Transaction zapewnia consistency
- **Irreversible action**: Clear warnings and confirmation flows
- **Session cleanup**: Invalidation wszystkich tokenów
- **Audit trail**: Permanent log zdarzenia usunięcia

### Rate limiting

- **Export endpoint**: 5 requests per hour per user (resource intensive)
- **Delete endpoint**: 1 request per day per user (safety measure)
- **IP-based limits**: Additional protection against abuse

## 8. Performance optimizations

### Export endpoint optimizations

- **Parallel queries**: Równoczesne pobieranie danych z różnych tabel
- **Streaming response**: Dla dużych exportów (future enhancement)
- **Pagination considerations**: Limit na liczbę rekordów per export
- **Database indexing**: Optimized queries na owner_id, deleted_at
- **Response compression**: Gzip compression dla dużych JSON

### Delete endpoint optimizations

- **Batch operations**: Efficient bulk deletes
- **Index utilization**: Proper foreign key indexes
- **Connection pooling**: Zarządzanie połączeniami DB
- **Background cleanup**: Optional async cleanup nieużywanych resources

### Monitoring metrics

- **Export timing**: Czas generowania eksportu
- **Export size**: Rozmiar odpowiedzi w bytes
- **Delete timing**: Czas trwania operacji usunięcia
- **Error rates**: Success/failure ratio dla obu endpoints

## 9. Monitoring i metryki

### Kluczowe metryki

- **Export success rate**: % udanych eksportów danych
- **Export response time**: P50, P95, P99 czasów odpowiedzi
- **Export size distribution**: Rozkład rozmiarów eksportowanych danych
- **Delete success rate**: % udanych usunięć kont
- **Delete timing**: Czas trwania procesu usuwania
- **GDPR compliance**: Czas odpowiedzi na żądania danych

### Alerty i notyfikacje

- **Export failures**: Alert gdy success rate < 95%
- **Large exports**: Notification przy eksportach > 10MB
- **Delete failures**: Immediate alert przy failed deletions
- **Rate limit hits**: Monitor for abuse patterns
- **Performance degradation**: Alert gdy P95 > 30s dla eksportu

### Logging strategia

- **Structured logging**: JSON format z correlation ID
- **PII protection**: Hash user IDs, no personal data in logs
- **Audit events**: Permanent record export/delete działań
- **Error details**: Comprehensive error context for debugging
- **Retention**: 2 lata dla audit logs, 90 dni dla operational logs

## 10. Error handling

### Export endpoint errors

```typescript
try {
  const exportData = await generateUserExport(userId);
  return Response.json(exportData);
} catch (error) {
  if (error instanceof DatabaseConnectionError) {
    return Response.json(
      { error: "SERVICE_UNAVAILABLE", message: "Database temporarily unavailable" },
      { status: 503 }
    );
  }

  if (error instanceof DataTooLargeError) {
    return Response.json({ error: "EXPORT_TOO_LARGE", message: "Data export exceeds size limit" }, { status: 413 });
  }

  logger.error("Export failed", { userId, error: error.message });
  return Response.json({ error: "INTERNAL_SERVER_ERROR", message: "Export failed" }, { status: 500 });
}
```

### Delete endpoint errors

```typescript
try {
  await deleteUserAccount(userId, confirmationText);
  return Response.json({ message: "Account deleted successfully" });
} catch (error) {
  if (error instanceof InvalidConfirmationError) {
    return Response.json({ error: "INVALID_CONFIRMATION", message: "Invalid confirmation text" }, { status: 400 });
  }

  if (error instanceof AccountDeletionError) {
    // Rollback transaction
    await rollbackDeletion(userId);
    return Response.json({ error: "DELETION_FAILED", message: "Account deletion failed" }, { status: 500 });
  }

  logger.error("Account deletion failed", { userId, error: error.message });
  return Response.json({ error: "INTERNAL_SERVER_ERROR", message: "Deletion failed" }, { status: 500 });
}
```

## 11. Testing strategy

### Unit tests

- **Export data aggregation**: Test correct data collection from all tables
- **Statistics calculation**: Verify accuracy rate, streak calculation
- **Deletion cascade**: Test proper order of deletions
- **Confirmation validation**: Test various confirmation text scenarios
- **Error scenarios**: Database failures, invalid inputs

### Integration tests

- **End-to-end export**: Full user data export workflow
- **End-to-end deletion**: Complete account removal process
- **Authentication flows**: Token validation scenarios
- **Database transactions**: Atomic deletion testing
- **Rate limiting**: Verify limits are enforced

### Performance tests

- **Large dataset export**: Users with thousands of flashcards
- **Concurrent operations**: Multiple exports/deletions simultaneously
- **Database load**: Impact on performance during peak usage
- **Memory usage**: Resource consumption during large exports

## 12. Dependencies i Prerequisites

### Environment setup

- **Database access**: Połączenie do głównej bazy danych
- **Supabase admin**: Admin client do usuwania z auth.users
- **Rate limiting**: Redis lub in-memory dla development
- **Logging infrastructure**: Structured logging setup

### Code dependencies

- **Authentication**: Existing JWT validation middleware
- **Database client**: Supabase client z RLS policies
- **Type definitions**: UserDataExportResponseDTO, DeleteAccountRequestDTO
- **Error handling**: Standard error response types
- **Audit logging**: Existing audit trail infrastructure

### Database prerequisites

- **RLS policies**: Proper row-level security dla wszystkich tabel
- **Foreign key constraints**: Dla zapewnienia data integrity
- **Indexes**: Optimized indexes na owner_id i related fields
- **Backup strategy**: Before allowing account deletions

## 13. Risk mitigation

### Data integrity risks

- **Export inconsistency**: Multiple queries mogą pokazać różne snapshot'y
- **Partial deletion**: Transaction failure może zostawić orphaned data
- **Race conditions**: Concurrent operations podczas eksportu/usuwania
- **Backup corruption**: Ensuring valid backups before deletions

### Security risks

- **Data leakage**: Unauthorized access to export data
- **Accidental deletion**: User mistakes w confirmation process
- **Malicious abuse**: Bulk deletion attacks
- **Session hijacking**: Stolen tokens used for malicious actions

### Performance risks

- **Large exports**: Memory exhaustion na dużych dataset'ach
- **Database load**: Export queries impacting other operations
- **Cascade delays**: Long deletion times dla users z dużo danych
- **Concurrent load**: Multiple heavy operations simultaneously

### Compliance risks

- **GDPR violations**: Incorrect data export or deletion
- **Audit trail gaps**: Missing logs dla compliance
- **Data retention**: Keeping data that should be deleted
- **Recovery issues**: Inability to restore accidentally deleted accounts

## 14. Success criteria

### Funkcjonalne wymagania

- ✅ Export zwraca wszystkie user data w specified format
- ✅ Account deletion removes all traces użytkownika
- ✅ Confirmation mechanism prevents accidental deletions
- ✅ Proper error handling dla wszystkich edge cases
- ✅ Authentication i authorization działają poprawnie

### Performance requirements

- ✅ Export completes w < 30 sekund dla typical user
- ✅ Deletion completes w < 60 sekund dla typical user
- ✅ Rate limiting prevents abuse without blocking legitimate use
- ✅ Database performance nie degraduje during operations
- ✅ Memory usage pozostaje w reasonable bounds

### Security requirements

- ✅ Only authenticated users can access własne dane
- ✅ Audit trail zachowuje record wszystkich działań
- ✅ Sensitive data nie leak w logs lub errors
- ✅ Confirmation mechanism skutecznie prevents accidents
- ✅ Session cleanup zapewnia complete logout po deletion

### Compliance requirements

- ✅ GDPR Article 20 (data portability) compliance
- ✅ GDPR Article 17 (right to be forgotten) compliance
- ✅ Export format suitable dla data import do other systems
- ✅ Deletion ensures complete data removal
- ✅ Audit logs satisfy regulatory requirements

## 15. Implementation phases

### Faza 1: Core export functionality (2.5 dni)

- **Day 1**:
  - Setup endpoint structure i authentication
  - Implement basic data queries dla decks, flashcards, reviews
  - Create response formatting logic
- **Day 1.5**:
  - Add statistics calculation
  - Implement error handling i validation
  - Add basic unit tests
- **Day 2.5**:
  - Performance optimization dla queries
  - Integration testing
  - Documentation updates

### Faza 2: Account deletion functionality (3 dni)

- **Day 1**:
  - Setup deletion endpoint i confirmation validation
  - Implement transaction-based deletion logic
  - Handle Supabase auth integration
- **Day 2**:
  - Add comprehensive error handling
  - Implement session invalidation
  - Create audit logging
- **Day 3**:
  - Extensive testing all deletion scenarios
  - Performance optimization
  - Security review

### Faza 3: Security & monitoring (2 dni)

- **Day 1**:
  - Implement rate limiting dla both endpoints
  - Add comprehensive audit logging
  - Security hardening review
- **Day 2**:
  - Setup monitoring i alerting
  - Performance testing i optimization
  - Documentation finalization

### Faza 4: Testing & deployment (1.5 dni)

- **Day 1**:
  - End-to-end testing w staging environment
  - Load testing dla performance validation
  - Security penetration testing
- **Day 1.5**:
  - Production deployment preparation
  - Monitoring dashboard setup
  - Final documentation review

**Total estimated time: 9 dni**

## 16. Post-implementation considerations

### Monitoring setup

- **Performance dashboards**: Export/deletion timing i success rates
- **Compliance tracking**: GDPR request fulfillment metrics
- **Security monitoring**: Unusual patterns w data access
- **Capacity planning**: Growth w export sizes i deletion frequency

### Future enhancements

- **Streaming exports**: Dla very large datasets
- **Scheduled deletions**: User-initiated delayed deletion
- **Partial exports**: Export specific data types only
- **Data anonymization**: Alternative do complete deletion

### Maintenance requirements

- **Regular audits**: Verify deletion completeness
- **Performance optimization**: Query tuning as data grows
- **Compliance updates**: Adapt do changing regulations
- **Security reviews**: Regular security assessment
