# API Endpoint Implementation Plan: Budget Admin Endpoint (Budget Status)

## 1. Przegląd endpointów

### Endpoints included in this plan

1. **GET /api/admin/budget/status** - Get current budget usage and alerts

### Powiązania z main API plan

- **Specyfikacja**: `/home/lukas/10devscards/.ai/api-plan.md` lines 503-530
- **Resource**: Budget Resource (Admin Only) (Section 2.6)
- **DTOs**: `/home/lukas/10devscards/src/types.ts` - BudgetStatusData, BudgetStatusResponseDTO

## 2. Cel i wymagania biznesowe

### Budget status endpoint

- **Cel**: Monitoring kosztów AI generation i zarządzanie budżetem
- **Business value**: Cost control, operational visibility, automated alerts
- **Use cases**:
  - Daily cost monitoring przez administratorów
  - Automated alerting przy przekroczeniu thresholds
  - Monthly budget planning i forecasting
  - Cost optimization decision making

### Admin-only access

- **Security requirement**: Tylko administratorzy mają dostęp do financial data
- **Compliance**: Separation of concerns między user data a operational data
- **Operational necessity**: Monitoring AI costs dla platform sustainability

## 3. Szczegóły requestów

### GET /api/admin/budget/status

- **Method**: GET
- **Path**: `/api/admin/budget/status`
- **Headers**:
  - `Authorization: Bearer <admin_access_token>`
  - `Content-Type: application/json`
- **Query Parameters**: None
- **Body**: None

### Authentication requirements

- **Admin role verification**: Token musi zawierać admin permissions
- **Service role access**: Alternative access via service_role token
- **IP restrictions**: Optional additional security layer

## 4. Szczegóły odpowiedzi

### Sukces (200 OK)

```json
{
  "data": {
    "current_month": "2025-06",
    "budget_limit_usd": 10.0,
    "current_usage_usd": 7.85,
    "usage_percentage": 78.5,
    "threshold_80_reached": false,
    "threshold_100_reached": false,
    "generation_blocked": false,
    "last_updated": "2025-06-11T10:00:00Z"
  }
}
```

### Error responses

#### 401 Unauthorized

```json
{
  "error": "UNAUTHORIZED",
  "message": "Authentication required"
}
```

#### 403 Forbidden (Not Admin)

```json
{
  "error": "FORBIDDEN",
  "message": "Admin access required"
}
```

#### 500 Internal Server Error

```json
{
  "error": "INTERNAL_SERVER_ERROR",
  "message": "Failed to retrieve budget status"
}
```

## 5. Przepływ danych

### Budget status retrieval flow

1. **Authentication check** - weryfikacja JWT tokena i admin permissions
2. **Admin role verification** - sprawdzenie czy user ma admin role lub service_role
3. **Current month calculation** - określenie aktualnego miesiąca budżetowego
4. **Budget configuration fetch** - pobranie limitu budżetu z environment/config
5. **Usage calculation** - suma kosztów z budget_events dla current month
6. **Threshold evaluation** - sprawdzenie czy przekroczono 80% lub 100% budżetu
7. **Generation status check** - czy generation jest blocked due to budget
8. **Response formatting** - przygotowanie BudgetStatusResponseDTO
9. **Audit logging** - zapis zdarzenia dostępu do budget data
10. **Return response** - JSON z current budget status

## 6. Database queries

### Budget usage calculation

```sql
-- Get current month budget usage
SELECT
  COALESCE(SUM(cost_usd), 0) as current_usage_usd,
  MAX(created_at) as last_updated
FROM budget_events
WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE);

-- Get threshold events for current month
SELECT
  threshold_reached,
  created_at
FROM budget_events
WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
  AND threshold_reached = true
ORDER BY created_at DESC
LIMIT 1;

-- Check if generation is currently blocked
SELECT
  CASE
    WHEN COALESCE(SUM(cost_usd), 0) >= $1 THEN true
    ELSE false
  END as generation_blocked
FROM budget_events
WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE);
```

### Budget events monitoring query

```sql
-- Recent budget events for context
SELECT
  event_type,
  cost_usd,
  cumulative_usd,
  threshold_reached,
  created_at,
  metadata
FROM budget_events
WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
ORDER BY created_at DESC
LIMIT 10;
```

## 7. Security considerations

### Authentication & Authorization

- **Admin verification**: Strict verification of admin role w JWT token
- **Service role support**: Alternative access dla automated systems
- **Token validation**: Fresh token validation z proper expiry
- **Role-based access**: Integration z Supabase RLS policies

### Data protection

- **Financial data security**: Encryption w transit i at rest
- **Access logging**: Comprehensive audit trail dla financial access
- **No caching**: Prevent sensitive financial data caching
- **Secure transmission**: HTTPS only dla admin endpoints

### Admin session management

- **Enhanced security**: Shorter token expiry dla admin sessions
- **Activity monitoring**: Track admin access patterns
- **IP restrictions**: Optional IP allowlisting dla admin access
- **Multi-factor authentication**: Recommended dla admin accounts

## 8. Performance optimizations

### Query optimization

- **Indexed queries**: Efficient indexes na budget_events.created_at
- **Aggregation caching**: Optional caching dla expensive calculations
- **Connection pooling**: Proper database connection management
- **Query batching**: Combine related queries gdzie possible

### Response optimization

- **Minimal payload**: Only essential data w response
- **Response compression**: Gzip compression dla larger responses
- **Cache headers**: Appropriate cache headers dla budget data
- **Partial updates**: Future support dla real-time updates

### Monitoring performance

- **Query timing**: Monitor database query performance
- **Response latency**: Track end-to-end response times
- **Concurrent access**: Handle multiple admin requests efficiently
- **Resource usage**: Monitor memory i CPU usage

## 9. Monitoring i metryki

### Kluczowe metryki

- **Budget utilization**: Current usage vs limit percentage
- **Threshold alerts**: Number i frequency of threshold breaches
- **Admin access patterns**: Frequency i timing of budget checks
- **Cost trends**: Daily/weekly spending patterns
- **Generation blocking events**: How often generation gets blocked

### Alerty i notifikacje

- **80% threshold**: Alert gdy budget usage przekracza 80%
- **100% threshold**: Critical alert przy full budget utilization
- **Unusual spending**: Alert przy anomalous cost spikes
- **Admin access failures**: Security alerts dla failed admin access
- **System errors**: Alert przy budget calculation failures

### Logging strategia

- **Structured logging**: JSON format z correlation IDs
- **Financial audit**: Permanent logs dla wszystkich budget access
- **Performance logging**: Query timing i response metrics
- **Security logging**: All admin authentication events
- **Retention**: 7 lat dla financial audit logs

## 10. Error handling

### Budget calculation errors

```typescript
try {
  const budgetStatus = await calculateBudgetStatus();
  return Response.json({ data: budgetStatus });
} catch (error) {
  if (error instanceof DatabaseConnectionError) {
    logger.error("Database connection failed for budget status", { error });
    return Response.json(
      { error: "SERVICE_UNAVAILABLE", message: "Budget service temporarily unavailable" },
      { status: 503 }
    );
  }

  if (error instanceof BudgetConfigurationError) {
    logger.error("Budget configuration missing", { error });
    return Response.json({ error: "CONFIGURATION_ERROR", message: "Budget configuration not found" }, { status: 500 });
  }

  logger.error("Budget status calculation failed", { error: error.message });
  return Response.json(
    { error: "INTERNAL_SERVER_ERROR", message: "Failed to retrieve budget status" },
    { status: 500 }
  );
}
```

### Authentication errors

```typescript
try {
  const isAdmin = await verifyAdminAccess(authToken);
  if (!isAdmin) {
    return Response.json({ error: "FORBIDDEN", message: "Admin access required" }, { status: 403 });
  }
} catch (error) {
  if (error instanceof TokenExpiredError) {
    return Response.json({ error: "TOKEN_EXPIRED", message: "Admin token has expired" }, { status: 401 });
  }

  logger.error("Admin verification failed", { error: error.message });
  return Response.json({ error: "UNAUTHORIZED", message: "Authentication required" }, { status: 401 });
}
```

## 11. Testing strategy

### Unit tests

- **Budget calculation**: Test accurate cost summation i percentage calculation
- **Threshold detection**: Test proper threshold breach detection
- **Admin verification**: Test various admin authentication scenarios
- **Error handling**: Test all error conditions i proper error responses
- **Date calculations**: Test month boundary conditions

### Integration tests

- **End-to-end admin flow**: Complete admin authentication to budget data
- **Database integration**: Test real budget_events queries
- **Authentication integration**: Test admin role verification
- **Error scenarios**: Database failures, configuration issues
- **Performance testing**: Load testing dla concurrent admin requests

### Security tests

- **Unauthorized access**: Verify non-admin users cannot access
- **Token validation**: Test expired, invalid, malformed tokens
- **Role verification**: Test various role combinations
- **Data exposure**: Ensure no sensitive data leaks w errors
- **Audit logging**: Verify all access is properly logged

## 12. Dependencies i Prerequisites

### Environment setup

- **Admin authentication**: Supabase auth z admin role configuration
- **Database access**: Read access do budget_events table
- **Configuration management**: Budget limit configuration (ENV variable)
- **Logging infrastructure**: Audit-grade logging dla financial data

### Code dependencies

- **Admin middleware**: Authentication middleware z admin verification
- **Database client**: Supabase client z proper RLS policies
- **Type definitions**: BudgetStatusData, BudgetStatusResponseDTO
- **Error handling**: Standard error response types
- **Audit logging**: Financial audit trail infrastructure

### Database prerequisites

- **Budget events table**: Properly structured z cost tracking
- **RLS policies**: Admin-only access policies dla budget_events
- **Indexes**: Performance indexes na created_at, cost calculations
- **Data integrity**: Proper constraints i validation

## 13. Risk mitigation

### Security risks

- **Unauthorized access**: Strict admin verification prevents data leaks
- **Financial data exposure**: Comprehensive logging i audit trails
- **Admin account compromise**: Enhanced security dla admin sessions
- **Data tampering**: Read-only access prevents malicious modifications

### Operational risks

- **Budget miscalculation**: Multiple verification steps i validation
- **Configuration errors**: Environment validation i fallbacks
- **Database performance**: Optimized queries i monitoring
- **Admin workflow disruption**: Reliable service availability

### Financial risks

- **Cost overruns**: Real-time monitoring i automated blocking
- **Billing surprises**: Proactive alerts i threshold management
- **Budget tracking errors**: Accurate calculation i audit trails
- **Forecasting issues**: Historical data dla trend analysis

## 14. Success criteria

### Funkcjonalne wymagania

- ✅ Budget status accurately reflects current month spending
- ✅ Threshold detection works correctly dla 80% i 100% limits
- ✅ Admin authentication i authorization function properly
- ✅ Error handling covers all failure scenarios
- ✅ Audit logging captures all financial data access

### Performance requirements

- ✅ Response time < 2 seconds dla budget status requests
- ✅ Database queries execute efficiently z proper indexes
- ✅ Concurrent admin access doesn't degrade performance
- ✅ Memory usage remains within reasonable bounds
- ✅ System handles peak admin usage periods

### Security requirements

- ✅ Only verified admins can access budget data
- ✅ All access is logged dla audit purposes
- ✅ No financial data exposure w error messages
- ✅ Secure token handling i validation
- ✅ Protection against common security vulnerabilities

### Operational requirements

- ✅ Real-time budget monitoring capabilities
- ✅ Automated alerting przy threshold breaches
- ✅ Reliable service availability dla admin operations
- ✅ Comprehensive error reporting i debugging capability
- ✅ Integration z existing admin workflows

## 15. Implementation phases

### Faza 1: Core budget calculation (2 dni)

- **Day 1**:
  - Setup endpoint structure i admin authentication
  - Implement basic budget calculation queries
  - Create response formatting logic
- **Day 2**:
  - Add threshold detection logic
  - Implement error handling i validation
  - Create comprehensive unit tests

### Faza 2: Security & admin features (2.5 dni)

- **Day 1**:
  - Implement admin role verification
  - Add audit logging dla financial access
  - Setup security hardening measures
- **Day 1.5**:
  - Add comprehensive error handling
  - Implement session security features
  - Create security tests
- **Day 2.5**:
  - Integration testing z admin authentication
  - Security penetration testing
  - Performance optimization

### Faza 3: Monitoring & alerting (2 dni)

- **Day 1**:
  - Setup monitoring dla budget metrics
  - Implement alerting dla threshold breaches
  - Add performance monitoring
- **Day 2**:
  - Create admin dashboard integration
  - Setup operational monitoring
  - Documentation finalization

### Faza 4: Testing & deployment (1.5 dni)

- **Day 1**:
  - End-to-end testing w staging environment
  - Load testing dla concurrent admin access
  - Financial calculation validation
- **Day 1.5**:
  - Production deployment preparation
  - Monitoring setup i validation
  - Final security review

**Total estimated time: 8 dni**

## 16. Post-implementation considerations

### Monitoring setup

- **Financial dashboards**: Real-time budget usage visualization
- **Alert management**: Threshold breach notification system
- **Performance monitoring**: Query i response time tracking
- **Security monitoring**: Admin access pattern analysis

### Future enhancements

- **Forecasting**: Predictive budget usage analysis
- **Historical reporting**: Month-over-month cost trends
- **Multi-currency support**: International cost tracking
- **Budget categories**: Breakdown by different AI operations

### Maintenance requirements

- **Monthly reconciliation**: Verify budget calculations accuracy
- **Performance tuning**: Optimize queries as data volume grows
- **Security reviews**: Regular admin access security audits
- **Configuration updates**: Budget limit adjustments i policy changes
