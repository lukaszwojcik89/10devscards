# Plan implementacji widoku Ustawienia

## 1. Przegląd

Widok Ustawienia to kompleksowy panel zarządzania kontem użytkownika w aplikacji AI Flashcards. Umożliwia zarządzanie profilem, eksport danych osobowych zgodnie z RODO oraz bezpieczne usuwanie konta. Widok implementuje system tabulacji z trzema głównymi sekcjami: Profil (zarządzanie kontem i hasłem), Twoje dane (eksport danych z opcjami zakresu) oraz Bezpieczeństwo (zarządzanie sesjami i usuwanie konta). Wszystkie operacje są zabezpieczone dodatkowymi potwierdzeniami oraz implementują najlepsze praktyki bezpieczeństwa i dostępności.

## 2. Routing widoku

**Ścieżka**: `/settings`

**Query parameters**:

- `tab` (string, opcjonalny) - aktywna zakładka ('profile' | 'data' | 'security')
- `action` (string, opcjonalny) - konkretna akcja do wykonania ('export' | 'delete')

**Przykłady URL**:

- `/settings` - widok ustawień z domyślną zakładką Profile
- `/settings?tab=data` - bezpośrednie otwarcie zakładki Twoje dane
- `/settings?tab=security&action=delete` - przejście do usuwania konta
- `/settings?tab=profile` - zakładka zarządzania profilem

## 3. Struktura komponentów

```
SettingsView (src/pages/settings.astro - główny layout)
├── SettingsContainer (React wrapper z tab navigation)
    ├── SettingsHeader
    │   ├── PageTitle
    │   └── BreadcrumbNavigation
    ├── SettingsTabs (Profile|Data|Security)
    │   ├── TabNavigation
    │   └── TabIndicator
    ├── ProfileTab
    │   ├── UserProfileSection
    │   │   ├── EmailDisplay (readonly)
    │   │   └── ProfileMetadata
    │   └── PasswordManagement
    │       ├── PasswordResetTrigger
    │       └── PasswordChangeForm
    ├── DataTab
    │   ├── ExportSection
    │   │   ├── ExportDescription
    │   │   ├── ExportOptionsForm
    │   │   └── ExportButton
    │   ├── ExportModal
    │   │   ├── ScopeSelector
    │   │   ├── DeckPicker (conditional)
    │   │   ├── OptionsCheckboxes
    │   │   ├── ExportProgress
    │   │   └── DownloadLink
    │   └── ExportHistory (optional)
    └── SecurityTab
        ├── SessionManagement
        │   ├── ActiveSessions
        │   └── LogoutOptions
        └── DangerZone
            ├── DangerZoneWarning
            ├── DeleteAccountTrigger
            └── DeleteAccountModal
                ├── ConfirmationPhrase
                ├── PasswordVerification
                └── FinalConfirmation
```

## 4. Szczegóły komponentów

### SettingsContainer

- **Opis**: Główny kontener widoku ustawień zarządzający stanem tabulacji, ładowaniem danych użytkownika oraz koordynujący wszystkie operacje w panelu. Implementuje responsive layout i error boundary.
- **Główne elementy**: Tab navigation system, content area z conditional rendering, loading states, error boundary wrapper
- **Obsługiwane interakcje**: Tab switching, keyboard navigation, URL state synchronization, responsive layout adjustments
- **Obsługiwana walidacja**: Sprawdzenie autoryzacji użytkownika, walidacja dostępu do poszczególnych sekcji, session validity checking
- **Typy**: `SettingsViewState`, `TabType`, `SettingsError`, `LoadingState`
- **Propsy**: `initialTab?: TabType`, `initialAction?: string`, `onNavigate: (tab: TabType) => void`

### SettingsTabs

- **Opis**: System nawigacji tabulacyjnej umożliwiający przełączanie między sekcjami Profil, Twoje dane i Bezpieczeństwo. Implementuje accessibility guidelines i keyboard navigation.
- **Główne elementy**: Tab buttons z icons, active tab indicator, responsive tab layout, keyboard focus management
- **Obsługiwane interakcje**: Click navigation, keyboard navigation (arrow keys, tab), touch navigation on mobile
- **Obsługiwana walidacja**: Tab access permissions, state persistence during navigation
- **Typy**: `TabNavigationProps`, `TabItem`, `ActiveTabState`
- **Propsy**: `activeTab: TabType`, `onTabChange: (tab: TabType) => void`, `accessibleTabs: TabType[]`

### UserProfileSection

- **Opis**: Sekcja wyświetlająca podstawowe informacje o profilu użytkownika w formie readonly. Pokazuje email, datę rejestracji oraz status weryfikacji konta.
- **Główne elementy**: Email display field, account creation date, email verification status, profile completeness indicator
- **Obsługiwane interakcje**: Copy email to clipboard, tooltip information display
- **Obsługiwana walidacja**: Email format display validation, verification status checking
- **Typy**: `UserProfile`, `ProfileDisplayProps`, `VerificationStatus`
- **Propsy**: `userProfile: UserProfile`, `showMetadata: boolean`, `onEmailCopy?: () => void`

### PasswordManagement

- **Opis**: Sekcja zarządzania hasłem użytkownika z opcjami resetowania przez email oraz zmiany hasła. Implementuje secure password reset flow z Supabase Auth.
- **Główne elementy**: Password reset trigger button, password change form (optional), security recommendations, last password change info
- **Obsługiwane interakcje**: Trigger password reset email, form submission for password change, show/hide password fields
- **Obsługiwana walidacja**: Email verification before reset, password policy compliance, current password verification
- **Typy**: `PasswordResetRequest`, `PasswordChangeRequest`, `PasswordPolicy`, `SecurityState`
- **Propsy**: `userEmail: string`, `onPasswordReset: (email: string) => void`, `lastPasswordChange?: string`

### ExportSection

- **Opis**: Sekcja umożliwiająca eksport danych użytkownika zgodnie z RODO. Oferuje różne zakresy eksportu i opcje konfiguracji danych do pobrania.
- **Główne elementy**: Export description text, scope selection form, options checkboxes, export trigger button, progress indicator
- **Obsługiwane interakcje**: Scope selection (radio buttons), options toggling, export initiation, download link handling
- **Obsługiwana walidacja**: Scope validation (selected decks when applicable), options validation, file size warnings
- **Typy**: `ExportOptions`, `ExportScope`, `ExportProgress`, `ExportResult`
- **Propsy**: `availableDecks: DeckInfo[]`, `onExport: (options: ExportOptions) => void`, `exportInProgress: boolean`

### ExportModal

- **Opis**: Modal dialog dla szczegółowej konfiguracji eksportu danych z zaawansowanymi opcjami wyboru zakresu i formatu danych.
- **Główne elementy**: Scope selector (all/selected decks/accepted only), deck multi-picker, inclusion options, progress bar, download area
- **Obsługiwane interakcje**: Radio button selection, multi-select deck picker, checkbox options, modal close/confirm actions
- **Obsługiwana walidacja**: At least one deck selected for "selected decks" scope, reasonable file size estimation, format validation
- **Typy**: `ExportModalProps`, `ScopeSelection`, `DeckSelectionState`, `ExportConfiguration`
- **Propsy**: `isOpen: boolean`, `onClose: () => void`, `onExport: (config: ExportConfiguration) => void`, `availableDecks: DeckInfo[]`

### DangerZone

- **Opis**: Sekcja z operacjami o wysokim ryzyku jak usuwanie konta. Implementuje wielopoziomowe potwierdzenia i wyraźne ostrzeżenia o nieodwracalności działań.
- **Główne elementy**: Warning banner, danger zone styling, delete account trigger, multiple confirmation steps, irreversibility warnings
- **Obsługiwane interakcje**: Delete account initiation, confirmation phrase typing, password verification, final confirmation dialog
- **Obsługiwana walidacja**: Exact confirmation phrase match, valid current password, double confirmation requirement
- **Typy**: `DangerZoneProps`, `DeleteAccountRequest`, `ConfirmationState`, `DeletionProgress`
- **Propsy**: `onDeleteAccount: (request: DeleteAccountRequest) => void`, `deletionInProgress: boolean`, `userEmail: string`

### DeleteAccountModal

- **Opis**: Modal z wieloetapowym procesem usuwania konta implementującym najwyższe standardy bezpieczeństwa. Wymaga wpisania frazy potwierdzającej oraz hasła.
- **Główne elementy**: Warning messages, confirmation phrase input, password verification field, progress stepper, final confirmation
- **Obsługiwane interakcje**: Text input validation, password field interaction, step navigation, final deletion confirmation
- **Obsługiwana walidacja**: Exact phrase match validation, password verification, all required fields completion
- **Typy**: `DeleteAccountModalProps`, `DeletionStep`, `ConfirmationPhrase`, `DeletionState`
- **Propsy**: `isOpen: boolean`, `onClose: () => void`, `onConfirm: (data: DeleteAccountRequest) => void`, `confirmationPhrase: string`

## 5. Typy

```typescript
// Settings View State Management
interface SettingsViewState {
  activeTab: TabType;
  userProfile: UserProfile | null;
  loading: boolean;
  error: SettingsError | null;
  hasUnsavedChanges: boolean;
}

type TabType = 'profile' | 'data' | 'security';

interface SettingsError {
  type: 'network' | 'authentication' | 'validation' | 'server';
  message: string;
  retryable: boolean;
  details?: Record<string, any>;
}

// User Profile Types
interface UserProfile {
  id: string;
  email: string;
  email_confirmed_at: string | null;
  created_at: string;
  last_sign_in_at: string;
  last_password_change?: string;
  profile_completeness: number;
}

// Data Export Types
interface ExportOptions {
  scope: ExportScope;
  selectedDeckIds?: string[];
  includeReviews: boolean;
  includeStatistics: boolean;
  includeMetadata: boolean;
  format: 'json' | 'csv';
}

type ExportScope = 'all' | 'selected_decks' | 'accepted_only';

interface ExportConfiguration {
  options: ExportOptions;
  estimatedSize: number;
  estimatedDuration: number;
}

interface ExportProgress {
  status: 'preparing' | 'exporting' | 'complete' | 'error';
  percentage: number;
  currentStep: string;
  eta?: number;
}

interface ExportResult {
  success: boolean;
  downloadUrl?: string;
  fileName?: string;
  fileSize?: number;
  expiresAt?: string;
  error?: string;
}

// Password Management Types
interface PasswordResetRequest {
  email: string;
}

interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  forbiddenPatterns: string[];
}

// Account Deletion Types
interface DeleteAccountRequest {
  confirmationPhrase: string;
  currentPassword: string;
  reason?: string;
  finalConfirmation: boolean;
}

interface DeletionProgress {
  status: 'confirming' | 'verifying' | 'deleting' | 'complete' | 'error';
  currentStep: string;
  irreversible: boolean;
}

// Component Props Types
interface SettingsContainerProps {
  initialTab?: TabType;
  initialAction?: string;
  onNavigate: (tab: TabType) => void;
}

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  accessibleTabs: TabType[];
  showBadges?: boolean;
}

interface ExportSectionProps {
  availableDecks: DeckInfo[];
  onExport: (options: ExportOptions) => void;
  exportInProgress: boolean;
  lastExport?: ExportResult;
}

interface DangerZoneProps {
  onDeleteAccount: (request: DeleteAccountRequest) => void;
  deletionInProgress: boolean;
  userEmail: string;
  confirmationPhrase: string;
}

// Supporting Types
interface DeckInfo {
  id: string;
  slug: string;
  name: string;
  flashcard_count: number;
  pending_count: number;
  last_studied?: string;
}

interface SecurityState {
  activeSessions: number;
  lastPasswordChange?: string;
  twoFactorEnabled: boolean;
  recentSecurityEvents: SecurityEvent[];
}

interface SecurityEvent {
  type: 'login' | 'password_change' | 'export' | 'settings_change';
  timestamp: string;
  ip_address?: string;
  user_agent?: string;
}
```

## 6. Zarządzanie stanem

Widok używa lokalnego stanu zarządzanego przez custom hook `useSettings` wraz z dodatkowymi hooks dla specyficznych operacji jak eksport danych czy usuwanie konta.

### Custom Hook: useSettings

```typescript
function useSettings(initialTab?: TabType) {
  const [settingsState, setSettingsState] = useState<SettingsViewState>({
    activeTab: initialTab || 'profile',
    userProfile: null,
    loading: true,
    error: null,
    hasUnsavedChanges: false
  });

  // API integration
  const loadUserProfile = async () => {
    // GET /api/auth/me
  };

  const resetPassword = async (email: string) => {
    // POST /api/auth/password/reset
  };

  const changeTab = (tab: TabType) => {
    // Update URL and state
  };

  return {
    settingsState,
    loadUserProfile,
    resetPassword,
    changeTab,
    clearError: () => setSettingsState(prev => ({ ...prev, error: null }))
  };
}
```

### Supporting Hooks

- **useDataExport**: Zarządzanie procesem eksportu danych z progress tracking
- **useAccountDeletion**: Obsługa wieloetapowego procesu usuwania konta
- **usePasswordManagement**: Zarządzanie operacjami związanymi z hasłem
- **useTabNavigation**: Obsługa nawigacji między zakładkami z URL sync

### State Persistence

- **Tab state**: Synchronizacja aktywnej zakładki z URL query parameters
- **Form state**: Preservation form data podczas przełączania zakładek
- **Export progress**: Utrzymanie stanu eksportu podczas nawigacji
- **Error recovery**: Restoration stanu po błędach sieciowych

## 7. Integracja API

### GET /api/auth/me (Profil użytkownika)

**Wykorzystanie**: Ładowanie danych profilu użytkownika w ProfileTab

**Request**: Brak parametrów, autoryzacja przez JWT token

**Response**: UserProfile z podstawowymi informacjami o koncie

**Error handling**: 401 → redirect do login, 500 → retry mechanism

### POST /api/auth/password/reset (Reset hasła)

**Wykorzystanie**: Inicjowanie procesu resetowania hasła

**Request**:

```typescript
{
  email: string
}
```

**Response**: Potwierdzenie wysłania emaila z instrukcjami

**Error handling**: Rate limiting, email validation, user feedback

### GET /api/user/export (Eksport danych)

**Wykorzystanie**: Generowanie eksportu danych użytkownika z opcjami

**Request**: Query parameters z ExportOptions

**Response**: Download URL lub streaming response z danymi

**Error handling**: Large file handling, timeout management, progress tracking

### DELETE /api/user/account (Usuwanie konta)

**Wykorzystanie**: Trwałe usunięcie konta użytkownika

**Request**:

```typescript
{
  confirmationPhrase: string,
  currentPassword: string
}
```

**Response**: Potwierdzenie usunięcia konta

**Error handling**: Irreversible action safeguards, final confirmations

### POST /api/auth/logout (Wylogowanie)

**Wykorzystanie**: Wylogowanie po operacjach bezpieczeństwa

**Request**: Brak parametrów, autoryzacja przez JWT token

**Response**: Potwierdzenie wylogowania

**Error handling**: Session cleanup, redirect handling

## 8. Interakcje użytkownika

### Przepływ podstawowy

1. **Wejście do ustawień**: Użytkownik klika link "Ustawienia" w nawigacji
2. **Ładowanie profilu**: Automatic fetch danych użytkownika z API
3. **Nawigacja między zakładkami**: Tab switching z URL synchronization
4. **Wykonywanie operacji**: Specific actions w każdej zakładce
5. **Potwierdzenia**: Multi-step confirmations dla sensitive operations

### Profile Tab Interactions

**Wyświetlanie profilu**:

- View email (readonly) z copy-to-clipboard option
- Display account metadata (creation date, verification status)
- Show last password change date

**Zarządzanie hasłem**:

- Click "Reset Password" → email reset flow
- Fill password change form (jeśli enabled)
- Validation i security checks

### Data Tab Interactions

**Konfiguracja eksportu**:

- Select scope: All data / Selected decks / Accepted cards only
- If "Selected decks" → multi-select deck picker
- Toggle additional options: Reviews, Statistics, Metadata
- Choose format: JSON / CSV

**Proces eksportu**:

- Click "Export Data" → progress modal
- Real-time progress tracking
- Download link generation
- File expiration handling

### Security Tab Interactions

**Zarządzanie sesjami**:

- View active sessions (current + others)
- "Logout everywhere" option
- Security event history

**Usuwanie konta**:

- Click "Delete Account" → warning modal
- Type exact confirmation phrase
- Enter current password
- Final "I understand this is irreversible" checkbox
- Final confirmation dialog

### Keyboard Navigation

- **Tab key**: Navigation między interactive elements
- **Arrow keys**: Tab navigation (when focused)
- **Enter/Space**: Activate buttons i checkboxes
- **Escape**: Close modals i cancel operations

## 9. Warunki i walidacja

### Profile Tab Validation

- **Email display**: Proper email format verification
- **Password reset**: Email verification before allowing reset
- **Account status**: Verification status checking and display

### Data Export Validation

- **Scope selection**: Required scope selection validation
- **Deck selection**: At least one deck when scope="selected_decks"
- **File size estimation**: Warning dla very large exports
- **Format validation**: Supported format checking

### Security Tab Validation

- **Confirmation phrase**: Exact match required (case-sensitive)
- **Password verification**: Current password must be correct
- **Final confirmation**: All checkboxes must be checked
- **Irreversibility acknowledgment**: User must acknowledge permanent deletion

### Form Validation Patterns

- **Real-time validation**: Immediate feedback na form fields
- **Submit validation**: Final validation przed API calls
- **Error recovery**: Clear error messages z recovery suggestions
- **Success feedback**: Confirmation messages dla completed actions

## 10. Obsługa błędów

### Authentication Errors

**Scenario**: JWT token expired lub invalid podczas operacji
**Handling**:

- Clear notification "Session expired"
- Automatic redirect do login page
- Preserve intended action w URL dla post-login redirect
- Clear sensitive form data

### Network Connectivity Errors

**Scenario**: Brak połączenia internetowego lub API unavailable
**Handling**:

- Retry mechanism z exponential backoff
- Offline mode indicators
- Queue operations dla retry when online
- Graceful degradation z cached data

### Validation Errors

**Scenario**: Form validation failures lub API validation errors
**Handling**:

- Inline error messages przy relevant fields
- Summary error message na top of form
- Focus management do first error field
- Clear recovery instructions

### Export Process Errors

**Scenario**: Export fails due do large data size lub server issues
**Handling**:

- Progress tracking z error detection
- Partial export options (resume functionality)
- Alternative format suggestions
- Customer support contact information

### Account Deletion Errors

**Scenario**: Account deletion fails due do dependencies lub server errors
**Handling**:

- Clear error explanation
- Data dependency information
- Manual deletion request process
- Rollback safety measures

### Critical Security Errors

**Scenario**: Unauthorized access attempts lub security breaches
**Handling**:

- Immediate session termination
- Security event logging
- User notification via email
- Temporary account protection measures

## 11. Kroki implementacji

### Etap 1: Przygotowanie infrastruktury (Kroki 1-8)

1. **Utwórz routing w src/pages/settings.astro**
   - Astro layout z React island dla settings
   - Query parameters extraction (tab, action)
   - SEO meta tags i breadcrumb setup
   - Authentication guard implementation

2. **Dodaj typy do src/types.ts**
   - `SettingsViewState`, `TabType`, `SettingsError`
   - `ExportOptions`, `ExportConfiguration`, `ExportResult`
   - `DeleteAccountRequest`, `PasswordChangeRequest`
   - All component props interfaces

3. **Utwórz hook useSettings w src/lib/hooks/**
   - State management dla settings view
   - Tab navigation logic
   - Error handling infrastructure
   - URL synchronization

4. **Utwórz service functions w src/lib/services/settings.service.ts**
   - API wrapper functions dla all endpoints
   - Response data transformation
   - Error mapping i handling
   - Progress tracking utilities

5. **Utwórz główny layout SettingsContainer**
   - React component z responsive design
   - Tab navigation system
   - Loading states i error boundaries
   - Accessibility foundation

6. **Implementuj SettingsTabs component**
   - Tab navigation UI z icons
   - Active state management
   - Keyboard navigation support
   - URL state synchronization

7. **Setup Tailwind styles dla settings**
   - Tab styling i animations
   - Form layouts i spacing
   - Danger zone special styling
   - Responsive breakpoints

8. **Utwórz base error handling**
   - Error boundary components
   - Network error detection
   - User-friendly error messages
   - Retry mechanisms

### Etap 2: Profile Tab Implementation (Kroki 9-16)

9. **Implementuj UserProfileSection**
   - Email display z readonly styling
   - Account metadata presentation
   - Profile completeness indicator
   - Copy-to-clipboard functionality

10. **Dodaj profile data loading**
    - Integration z GET /api/auth/me
    - Loading skeleton dla profile section
    - Error handling dla profile fetch
    - Data refresh mechanisms

11. **Implementuj PasswordManagement section**
    - Password reset trigger button
    - Integration z POST /api/auth/password/reset
    - Email confirmation flow
    - Security recommendations display

12. **Dodaj password reset flow**
    - Email validation przed reset
    - Progress feedback dla email sending
    - Success confirmation z next steps
    - Error handling dla failed resets

13. **Implementuj password policy display**
    - Current password policy rules
    - Security strength indicators
    - Last password change information
    - Password security tips

14. **Dodaj form validation dla password operations**
    - Email format validation
    - Password strength checking
    - Confirmation password matching
    - Real-time validation feedback

15. **Implementuj success/error notifications**
    - Toast notifications dla operations
    - Email confirmation messages
    - Error recovery suggestions
    - Progress status updates

16. **Dodaj accessibility features**
    - ARIA labels dla all form fields
    - Screen reader announcements
    - Keyboard navigation optimization
    - Focus management

### Etap 3: Data Export Implementation (Kroki 17-26)

17. **Implementuj ExportSection base layout**
    - Export description i instructions
    - GDPR compliance information
    - Export scope selection UI
    - File format options

18. **Dodaj scope selection logic**
    - Radio button group dla scopes
    - Conditional deck picker dla "selected decks"
    - All/none selection dla decks
    - Scope validation rules

19. **Implementuj DeckPicker component**
    - Multi-select deck interface
    - Search i filter functionality
    - Deck metadata display (card counts)
    - Select all/none convenience

20. **Dodaj export options configuration**
    - Checkboxes dla include options
    - File size estimation
    - Format selection (JSON/CSV)
    - Advanced options toggle

21. **Implementuj ExportModal**
    - Modal dialog z configuration
    - Progress tracking display
    - Real-time status updates
    - Download link generation

22. **Dodaj export API integration**
    - GET /api/user/export z parameters
    - Progress tracking mechanism
    - File download handling
    - Large file streaming support

23. **Implementuj export progress tracking**
    - Real-time progress updates
    - ETA calculation i display
    - Cancel operation capability
    - Error detection i recovery

24. **Dodaj download link management**
    - Secure download URL generation
    - Link expiration handling
    - Browser download triggering
    - File validation checks

25. **Implementuj export history**
    - Previous export tracking
    - Re-download capability
    - Export metadata display
    - Cleanup of expired exports

26. **Dodaj export error handling**
    - Large file warnings
    - Timeout error recovery
    - Partial export options
    - Alternative download methods

### Etap 4: Security Tab Implementation (Kroki 27-34)

27. **Implementuj SecurityTab base layout**
    - Session management section
    - Security events display
    - Danger zone separation
    - Warning styling i messaging

28. **Dodaj SessionManagement component**
    - Active sessions display
    - Session metadata (device, location, time)
    - "Logout everywhere" functionality
    - Current session highlighting

29. **Implementuj DangerZone section**
    - Clear visual separation
    - Warning messages i styling
    - Delete account trigger
    - Irreversibility warnings

30. **Dodaj DeleteAccountModal**
    - Multi-step confirmation process
    - Confirmation phrase input
    - Password verification field
    - Final confirmation checkbox

31. **Implementuj account deletion flow**
    - Step-by-step wizard interface
    - Progress indication
    - Validation po każdym step
    - Rollback prevention

32. **Dodaj deletion API integration**
    - DELETE /api/user/account integration
    - Request validation
    - Progress tracking
    - Success/error handling

33. **Implementuj confirmation phrase validation**
    - Exact phrase matching
    - Case-sensitive validation
    - Real-time validation feedback
    - Clear instruction display

34. **Dodaj final safety measures**
    - Double confirmation dialogs
    - Irreversibility acknowledgment
    - Final warning messages
    - Emergency contact information

### Etap 5: Advanced Features (Kroki 35-40)

35. **Implementuj tab state persistence**
    - URL query parameter sync
    - Browser history management
    - Deep linking support
    - State restoration na refresh

36. **Dodaj form state management**
    - Unsaved changes detection
    - Navigation warnings
    - Auto-save dla long forms
    - Data recovery mechanisms

37. **Implementuj advanced error recovery**
    - Retry mechanisms z exponential backoff
    - Partial operation recovery
    - State rollback capabilities
    - User guidance dla error resolution

38. **Dodaj loading state optimization**
    - Progressive loading
    - Skeleton screens
    - Lazy loading dla heavy components
    - Performance monitoring

39. **Implementuj advanced accessibility**
    - High contrast mode support
    - Reduced motion preferences
    - Screen reader optimizations
    - Keyboard shortcut hints

40. **Dodaj security enhancements**
    - Re-authentication dla sensitive operations
    - Session timeout warnings
    - Security event monitoring
    - Anomaly detection

### Etap 6: Testing & Validation (Kroki 41-42)

41. **Comprehensive testing**
    - Unit tests dla all hooks i utilities
    - Integration tests dla API calls
    - End-to-end user flow testing
    - Accessibility compliance testing

42. **Final polish i optimization**
    - Performance optimization
    - Bundle size optimization
    - Cross-browser compatibility
    - Mobile responsiveness verification
