# Linka — Стратегия тестирования

## Пирамида тестирования

```
        ╱╲
       ╱E2E╲        Playwright (5-10 тестов)
      ╱──────╲
     ╱ Integr. ╲    Request specs + Component integration (20-30)
    ╱────────────╲
   ╱  Unit Tests  ╲  Models, Services, Components, Stores (100+)
  ╱────────────────╲
```

## Backend (Rails + RSpec)

### Unit Tests

**Модели:**
```ruby
# spec/models/invite_spec.rb
RSpec.describe Invite do
  describe 'validations' do
    it 'requires token_digest'
    it 'requires circle'
    it 'requires max_uses > 0'
  end

  describe '#valid_for_use?' do
    it 'returns true when not expired and not exhausted'
    it 'returns false when expired'
    it 'returns false when uses exhausted'
  end

  describe '#consume!' do
    it 'increments uses_count'
    it 'raises error if not valid for use'
  end
end

# spec/models/user_spec.rb
# spec/models/circle_spec.rb
# spec/models/circle_membership_spec.rb
# spec/models/server_setting_spec.rb
```

**Сервисы:**
```ruby
# spec/services/invite_service_spec.rb
RSpec.describe InviteService do
  describe '#create' do
    it 'creates invite with token digest'
    it 'returns plaintext token'
    it 'sets default max_uses from server settings'
    it 'sets expiry if specified'
  end

  describe '#validate' do
    it 'finds invite by token'
    it 'returns nil for invalid token'
    it 'returns nil for expired invite'
    it 'returns nil for exhausted invite'
  end

  describe '#consume' do
    it 'increments usage count'
    it 'creates circle membership'
    it 'raises on invalid token'
  end
end

# spec/services/onboarding_service_spec.rb
RSpec.describe OnboardingService do
  describe '#register' do
    it 'validates invite token'
    it 'creates matrix user via admin API'
    it 'creates local user record'
    it 'consumes invite'
    it 'joins user to circle rooms'
    it 'returns user with access token'
    it 'raises on invalid invite'
    it 'raises on matrix API failure'
    it 'rolls back on partial failure'
  end
end

# spec/services/circle_service_spec.rb
# spec/services/matrix_admin_service_spec.rb
```

**Мокирование Matrix API:**
```ruby
# spec/support/matrix_stubs.rb
module MatrixStubs
  def stub_matrix_create_user(username, response = {})
    stub_request(:put, "#{matrix_url}/_synapse/admin/v2/users/@#{username}:#{server_name}")
      .to_return(status: 200, body: response.to_json)
  end

  def stub_matrix_create_room(response = {})
    stub_request(:post, "#{matrix_url}/_matrix/client/v3/createRoom")
      .to_return(status: 200, body: response.to_json)
  end

  # ... и другие
end
```

### Request Specs (Integration)

```ruby
# spec/requests/api/v1/invites_spec.rb
RSpec.describe 'Invites API' do
  describe 'POST /api/v1/invites/validate' do
    context 'valid token' do
      it 'returns circle info and valid: true'
    end

    context 'expired token' do
      it 'returns valid: false with reason'
    end

    context 'exhausted token' do
      it 'returns valid: false with reason'
    end

    context 'unknown token' do
      it 'returns 404'
    end
  end
end

# spec/requests/api/v1/onboarding_spec.rb
RSpec.describe 'Onboarding API' do
  describe 'POST /api/v1/onboarding' do
    context 'valid request' do
      it 'creates user and returns credentials'
      it 'consumes invite'
    end

    context 'invalid invite' do
      it 'returns 422'
    end

    context 'duplicate username' do
      it 'returns 409'
    end
  end
end

# spec/requests/api/v1/circles_spec.rb
# spec/requests/api/v1/sessions_spec.rb
# spec/requests/api/v1/admin/server_settings_spec.rb
```

### Factories

```ruby
# spec/factories/users.rb
FactoryBot.define do
  factory :user do
    sequence(:matrix_user_id) { |n| "@user#{n}:localhost" }
    sequence(:display_name) { |n| "User #{n}" }
    is_admin { false }

    trait :admin do
      is_admin { true }
    end
  end
end

# spec/factories/circles.rb
# spec/factories/invites.rb
# spec/factories/circle_memberships.rb
```

---

## Frontend (Vitest + React Testing Library)

### Unit Tests — Components

```typescript
// src/components/ui/__tests__/Button.test.tsx
describe('Button', () => {
  it('renders with text')
  it('calls onClick handler')
  it('shows spinner when loading')
  it('is disabled when disabled prop is true')
  it('applies variant class')
})

// src/components/ui/__tests__/Input.test.tsx
// src/components/ui/__tests__/Modal.test.tsx
// src/components/ui/__tests__/Toast.test.tsx
```

```typescript
// src/components/auth/__tests__/InvitePage.test.tsx
describe('InvitePage', () => {
  it('extracts token from URL')
  it('shows loading while validating')
  it('shows error for invalid token')
  it('redirects to onboarding for valid token')
})

// src/components/auth/__tests__/OnboardingPage.test.tsx
describe('OnboardingPage', () => {
  it('shows display name input')
  it('validates display name is not empty')
  it('calls onboarding API on submit')
  it('shows error on API failure')
  it('redirects to app on success')
})
```

```typescript
// src/components/chat/__tests__/ChatList.test.tsx
describe('ChatList', () => {
  it('renders list of chats')
  it('pins general and announcements at top')
  it('shows unread count badge')
  it('shows last message preview')
  it('sorts by last message time')
  it('filters by active circle')
})

// src/components/chat/__tests__/ChatView.test.tsx
describe('ChatView', () => {
  it('renders messages')
  it('scrolls to bottom on new message')
  it('loads history on scroll up')
  it('shows typing indicator')
  it('shows read receipts')
})

// src/components/chat/__tests__/MessageInput.test.tsx
describe('MessageInput', () => {
  it('sends message on Enter')
  it('does not send empty message')
  it('emits typing event')
  it('clears input after send')
})

// src/components/chat/__tests__/MessageBubble.test.tsx
describe('MessageBubble', () => {
  it('renders text message')
  it('shows sender name for others')
  it('shows timestamp')
  it('shows pending state')
  it('shows error state with retry')
  it('shows image preview for image messages')
  it('shows file attachment for file messages')
})
```

### Unit Tests — Stores

```typescript
// src/store/__tests__/authStore.test.ts
describe('authStore', () => {
  it('starts unauthenticated')
  it('sets user on login')
  it('persists to localStorage')
  it('restores from localStorage')
  it('clears on logout')
  it('handles invalid stored session')
})

// src/store/__tests__/chatStore.test.ts
describe('chatStore', () => {
  it('adds message to correct room')
  it('handles pending state')
  it('handles error state')
  it('loads history with pagination')
  it('updates typing users')
  it('marks messages as read')
})

// src/store/__tests__/circleStore.test.ts
// src/store/__tests__/callStore.test.ts
```

### Unit Tests — Matrix Wrapper

```typescript
// src/matrix/__tests__/client.test.ts
describe('Matrix client', () => {
  it('initializes with credentials')
  it('starts sync')
  it('handles sync errors')
  it('cleans up on destroy')
})

// src/matrix/__tests__/rooms.test.ts
describe('Matrix rooms', () => {
  it('gets spaces')
  it('gets space children')
  it('creates DM room')
})

// src/matrix/__tests__/messages.test.ts
describe('Matrix messages', () => {
  it('sends text message')
  it('sends typing notification')
  it('sends read receipt')
  it('uploads file')
})
```

### Integration Tests — Frontend

```typescript
// src/__tests__/integration/onboarding.test.tsx
describe('Onboarding Flow', () => {
  it('validates invite → enters name → creates account → enters app')
  it('handles invalid invite gracefully')
  it('handles network error during onboarding')
})

// src/__tests__/integration/messaging.test.tsx
describe('Messaging Flow', () => {
  it('sends message → appears in chat → marked as read')
  it('receives message → notification → scroll to bottom')
})

// src/__tests__/integration/circles.test.tsx
describe('Circles Flow', () => {
  it('creates circle → gets invite link → member joins')
  it('switches circle → chat list updates')
})
```

### Мокирование matrix-js-sdk

```typescript
// src/test/matrixMock.ts
export function createMockMatrixClient() {
  return {
    startClient: vi.fn(),
    stopClient: vi.fn(),
    login: vi.fn(),
    getRooms: vi.fn(() => []),
    getRoom: vi.fn(),
    sendMessage: vi.fn(),
    sendTyping: vi.fn(),
    sendReadReceipt: vi.fn(),
    uploadContent: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    initCrypto: vi.fn(),
    // ... etc
  }
}
```

---

## E2E Tests (Playwright)

### Setup

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 5'] } },
  ],
  webServer: {
    command: 'docker compose up',
    url: 'http://localhost/health',
    timeout: 120000,
  },
})
```

### Test Suites

```typescript
// e2e/onboarding.spec.ts
test('complete onboarding flow', async ({ page }) => {
  // 1. Create invite via API
  // 2. Open invite URL
  // 3. Enter display name
  // 4. Submit
  // 5. Verify app shell loaded
  // 6. Verify circle membership
})

// e2e/messaging.spec.ts
test('send and receive message', async ({ browser }) => {
  // 1. Setup: two users in same circle
  // 2. User A opens chat with User B
  // 3. User A sends message
  // 4. User B sees message appear
  // 5. Verify message content
})

// e2e/circles.spec.ts
test('create circle and invite member', async ({ browser }) => {
  // 1. User A creates circle
  // 2. User A gets invite link
  // 3. User B opens invite link
  // 4. User B joins
  // 5. Both see each other in circle
})

// e2e/files.spec.ts
test('upload and view image', async ({ page }) => {
  // 1. Open chat
  // 2. Upload image
  // 3. Verify preview appears
  // 4. Verify download works
})

// e2e/calls.spec.ts
test('audio call between users', async ({ browser }) => {
  // 1. Two users in DM
  // 2. User A initiates call
  // 3. User B sees incoming call
  // 4. User B answers
  // 5. Verify connected state
  // 6. User A hangs up
})
```

---

## Автоматическая верификация каждого этапа

### Скрипт проверки: `scripts/verify-stage.sh`

```bash
#!/bin/bash
# Usage: ./scripts/verify-stage.sh <stage_number>

STAGE=$1

case $STAGE in
  1)
    echo "=== Verifying Stage 1: Infrastructure ==="
    docker compose up -d
    sleep 10
    curl -f http://localhost/health || exit 1
    curl -f http://localhost/_matrix/client/versions || exit 1
    cd backend && bundle exec rspec || exit 1
    cd ../frontend && npm test -- --run || exit 1
    echo "✓ Stage 1 PASSED"
    ;;
  2)
    echo "=== Verifying Stage 2: Backend API ==="
    cd backend
    bundle exec rspec || exit 1
    bundle exec rspec spec/models/ || exit 1
    bundle exec rspec spec/services/ || exit 1
    bundle exec rspec spec/requests/ || exit 1
    echo "✓ Stage 2 PASSED"
    ;;
  3)
    echo "=== Verifying Stage 3: Frontend Auth ==="
    cd frontend
    npm test -- --run || exit 1
    npx tsc --noEmit || exit 1
    npm run build || exit 1
    echo "✓ Stage 3 PASSED"
    ;;
  4)
    echo "=== Verifying Stage 4: Circles & Contacts ==="
    cd frontend
    npm test -- --run || exit 1
    npx tsc --noEmit || exit 1
    echo "✓ Stage 4 PASSED"
    ;;
  5)
    echo "=== Verifying Stage 5: Messaging ==="
    cd frontend
    npm test -- --run || exit 1
    npx tsc --noEmit || exit 1
    echo "✓ Stage 5 PASSED"
    ;;
  6)
    echo "=== Verifying Stage 6: Files & Offline ==="
    cd frontend && npm test -- --run || exit 1
    cd ../backend && bundle exec rspec || exit 1
    echo "✓ Stage 6 PASSED"
    ;;
  7)
    echo "=== Verifying Stage 7: Calls & Push ==="
    cd frontend && npm test -- --run || exit 1
    cd ../backend && bundle exec rspec || exit 1
    echo "✓ Stage 7 PASSED"
    ;;
  8)
    echo "=== Verifying Stage 8: Production ==="
    cd frontend && npm test -- --run || exit 1
    cd ../backend && bundle exec rspec || exit 1
    npx playwright test || exit 1
    docker compose -f docker-compose.yml -f docker-compose.prod.yml build || exit 1
    echo "✓ Stage 8 PASSED"
    ;;
  *)
    echo "Unknown stage: $STAGE"
    exit 1
    ;;
esac
```

---

## Критерии качества

| Метрика | Цель |
|---------|------|
| Unit test coverage (backend) | > 90% |
| Unit test coverage (frontend) | > 85% |
| E2E tests passing | 100% |
| TypeScript strict mode | No errors |
| ESLint | No errors |
| RuboCop | No offenses |
| Build | Succeeds without warnings |
| Lighthouse PWA | > 90 |
