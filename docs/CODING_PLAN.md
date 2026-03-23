# Linka — Детальный план кодирования

## Соглашения

### Именование
- **Frontend**: camelCase для переменных/функций, PascalCase для компонентов, kebab-case для CSS
- **Backend**: snake_case (Ruby convention)
- **API**: snake_case для JSON полей
- **Файлы**: kebab-case для CSS/конфигов, camelCase для TS, snake_case для Ruby

### Code Style
- Frontend: ESLint + Prettier (2 spaces, single quotes, no semicolons)
- Backend: RuboCop (Rails default)
- Все файлы UTF-8, LF line endings

### Тестирование
- Frontend: Vitest + React Testing Library
- Backend: RSpec + FactoryBot + WebMock
- E2E: Playwright
- Coverage target: > 85% для бизнес-логики

### Git
- Conventional commits: `feat:`, `fix:`, `test:`, `chore:`, `docs:`
- Один коммит на логическую единицу работы

---

## Этап 1: Инфраструктура и скелет

### 1.1 Корневая структура
```bash
mkdir -p frontend backend infrastructure/{nginx,synapse,coturn}
```

### 1.2 Docker Compose (dev)
**Файл:** `docker-compose.yml`

Сервисы:
- `db-rails`: PostgreSQL 15 (port 5432)
- `db-synapse`: PostgreSQL 15 (port 5433)
- `redis`: Redis 7 (port 6379)
- `synapse`: matrixdotorg/synapse:latest (port 8008)
- `backend`: Rails app (port 3000)
- `frontend`: Vite dev server (port 5173)
- `nginx`: nginx:alpine (port 80)

Volumes:
- `db-rails-data`, `db-synapse-data`, `synapse-data`, `redis-data`

Networks:
- `linka-net` (bridge)

### 1.3 Synapse Configuration
**Файл:** `infrastructure/synapse/homeserver.yaml`

Ключевые параметры:
```yaml
server_name: "localhost"
enable_registration: false
enable_registration_without_verification: false
database:
  name: psycopg2
  args:
    host: db-synapse
    database: synapse
    user: synapse
    password: "${SYNAPSE_DB_PASSWORD}"
```

### 1.4 Rails Setup
```bash
cd backend
rails new . --api --database=postgresql --skip-git --skip-action-mailbox --skip-action-mailer --skip-active-storage --skip-action-cable --skip-javascript --skip-hotwire
```

Добавить в Gemfile:
```ruby
gem 'rack-cors'
gem 'jwt'
gem 'httparty'        # для Synapse Admin API
gem 'bcrypt'

group :development, :test do
  gem 'rspec-rails'
  gem 'factory_bot_rails'
  gem 'webmock'
  gem 'simplecov'
end
```

Health controller:
```ruby
# app/controllers/health_controller.rb
class HealthController < ApplicationController
  def show
    render json: { status: 'ok', version: '0.1.0' }
  end
end
```

### 1.5 Frontend Setup
```bash
cd frontend
npm create vite@latest . -- --template react-ts
npm install matrix-js-sdk zustand react-router-dom axios
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @testing-library/user-event
```

Vite config:
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': 'http://backend:3000',
      '/_matrix': 'http://synapse:8008'
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts'
  }
})
```

### 1.6 Nginx Config
**Файл:** `infrastructure/nginx/default.conf`
```nginx
upstream frontend { server frontend:5173; }
upstream backend  { server backend:3000; }
upstream synapse  { server synapse:8008; }

server {
    listen 80;

    location / { proxy_pass http://frontend; }
    location /api { proxy_pass http://backend; }
    location /_matrix { proxy_pass http://synapse; }
    location /_synapse { proxy_pass http://synapse; }
}
```

### 1.7 GitHub Actions
**Файл:** `.github/workflows/ci.yml`

Jobs: `backend-test`, `frontend-test`, `lint`

### 1.8 Environment
**Файл:** `.env.example`
```env
# Rails
RAILS_ENV=development
DATABASE_URL=postgres://linka:password@db-rails:5432/linka_dev
SECRET_KEY_BASE=generate-me
JWT_SECRET=generate-me

# Synapse
SYNAPSE_SERVER_NAME=localhost
SYNAPSE_DB_PASSWORD=synapse_password
SYNAPSE_ADMIN_TOKEN=generate-me

# Matrix
MATRIX_HOMESERVER_URL=http://synapse:8008
MATRIX_SERVER_NAME=localhost

# Media
MAX_UPLOAD_SIZE_MB=50
MEDIA_RETENTION_DAYS=30

# Frontend
VITE_API_URL=http://localhost/api
VITE_MATRIX_URL=http://localhost
```

---

## Этап 2: Backend — Invite System + Onboarding API

### 2.1 Database Schema

```ruby
# users
create_table :users do |t|
  t.string :matrix_user_id, null: false, index: { unique: true }
  t.string :display_name, null: false
  t.boolean :is_admin, default: false
  t.string :auth_token_digest
  t.timestamps
end

# circles
create_table :circles do |t|
  t.string :name, null: false
  t.string :matrix_space_id, index: { unique: true }
  t.string :matrix_general_room_id
  t.string :matrix_announcements_room_id
  t.references :creator, foreign_key: { to_table: :users }
  t.integer :max_members, default: 15
  t.timestamps
end

# circle_memberships
create_table :circle_memberships do |t|
  t.references :user, foreign_key: true
  t.references :circle, foreign_key: true
  t.string :role, default: 'member'  # member, admin
  t.timestamps
  t.index [:user_id, :circle_id], unique: true
end

# invites
create_table :invites do |t|
  t.string :token_digest, null: false, index: { unique: true }
  t.references :circle, foreign_key: true
  t.references :creator, foreign_key: { to_table: :users }
  t.integer :max_uses, default: 15
  t.integer :uses_count, default: 0
  t.datetime :expires_at
  t.timestamps
end

# server_settings
create_table :server_settings do |t|
  t.string :key, null: false, index: { unique: true }
  t.string :value
  t.string :value_type, default: 'string'  # string, integer, boolean
  t.string :description
  t.timestamps
end
```

### 2.2 Models

**User** (`app/models/user.rb`):
- Validations: matrix_user_id presence/uniqueness, display_name presence
- Associations: has_many :circle_memberships, has_many :circles (through), has_many :created_circles, has_many :invites (as creator)
- Scopes: admin, active
- Methods: admin?, can_create_circle?, circles_count_within_limit?

**Circle** (`app/models/circle.rb`):
- Validations: name presence, max_members > 0
- Associations: has_many :circle_memberships, has_many :members (through), belongs_to :creator, has_many :invites
- Methods: full?, member_count, has_member?(user)

**Invite** (`app/models/invite.rb`):
- Validations: token_digest presence/uniqueness, max_uses > 0
- Associations: belongs_to :circle, belongs_to :creator
- Concerns: TokenDigestable (генерация/проверка token digest)
- Methods: valid_for_use?, expired?, exhausted?, consume!
- Scopes: active (not expired, not exhausted)

**ServerSetting** (`app/models/server_setting.rb`):
- Class methods: get(key), set(key, value), defaults
- Кэширование: Rails.cache

### 2.3 Services

**MatrixAdminService** (`app/services/matrix_admin_service.rb`):
```ruby
class MatrixAdminService
  BASE_URL = ENV['MATRIX_HOMESERVER_URL']
  ADMIN_TOKEN = ENV['SYNAPSE_ADMIN_TOKEN']

  def create_user(username, display_name, password)
  def create_space(name, creator_user_id)
  def create_room(name, space_id, creator_user_id)
  def join_room(user_id, room_id)
  def invite_to_room(user_id, room_id)
  def deactivate_user(user_id)
end
```

**InviteService** (`app/services/invite_service.rb`):
```ruby
class InviteService
  def create(circle:, creator:, max_uses: 15, expires_in: nil)
    # Generate random token
    # Store SHA-256 digest
    # Return plaintext token (once)
  end

  def validate(token)
    # Find by digest, check expiry + uses
  end

  def consume(token, user)
    # Increment uses_count
    # Create CircleMembership
  end
end
```

**OnboardingService** (`app/services/onboarding_service.rb`):
```ruby
class OnboardingService
  def register(token:, display_name:)
    # 1. Validate invite
    # 2. Generate matrix username
    # 3. Create user in Synapse
    # 4. Create User record
    # 5. Consume invite (create membership)
    # 6. Join circle rooms in Matrix
    # 7. Return user + access_token
  end
end
```

**CircleService** (`app/services/circle_service.rb`):
```ruby
class CircleService
  def create(name:, creator:, max_members: 15)
    # 1. Check user limits
    # 2. Create Space in Matrix
    # 3. Create general chat room
    # 4. Create announcements room
    # 5. Create Circle record
    # 6. Create CircleMembership (creator = admin)
    # 7. Generate invite
    # 8. Return circle + invite_link
  end
end
```

### 2.4 API Endpoints

```ruby
# config/routes.rb
Rails.application.routes.draw do
  get '/health', to: 'health#show'

  namespace :api do
    namespace :v1 do
      post 'invites/validate', to: 'invites#validate'
      post 'onboarding', to: 'onboarding#create'

      resources :circles, only: [:index, :show, :create] do
        resources :invites, only: [:create, :index], module: :circles
        resources :members, only: [:index], module: :circles
      end

      resource :profile, only: [:show, :update]
      resources :sessions, only: [:create, :destroy]

      namespace :admin do
        resources :users, only: [:index, :show, :destroy]
        resource :server_settings, only: [:show, :update]
      end
    end
  end
end
```

### 2.5 Authentication

JWT-based:
```ruby
# app/controllers/concerns/authenticatable.rb
module Authenticatable
  def authenticate!
    token = request.headers['Authorization']&.split(' ')&.last
    payload = JWT.decode(token, ENV['JWT_SECRET'], true, algorithm: 'HS256')
    @current_user = User.find(payload.first['user_id'])
  rescue
    render json: { error: 'Unauthorized' }, status: :unauthorized
  end
end
```

### 2.6 Admin Bootstrap

```ruby
# db/seeds.rb
if User.count == 0
  admin = OnboardingService.new.bootstrap_admin(
    display_name: ENV.fetch('ADMIN_DISPLAY_NAME', 'Admin'),
    password: ENV.fetch('ADMIN_PASSWORD', SecureRandom.hex(16))
  )
  puts "Admin created: #{admin.matrix_user_id}"
end

ServerSetting.load_defaults!
```

---

## Этап 3: Frontend — Onboarding Flow + Auth

### 3.1 Design Tokens
```typescript
// src/styles/tokens.ts
export const tokens = {
  colors: {
    bg: {
      primary: '#0a0a0c',
      secondary: '#131318',
      tertiary: '#1c1c24',
      hover: '#24242e',
    },
    text: {
      primary: '#e4e4e8',
      secondary: '#9494a0',
      muted: '#5c5c68',
    },
    accent: {
      primary: '#6366f1',    // indigo
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
    border: {
      default: '#2a2a36',
      focus: '#6366f1',
    },
  },
  spacing: { xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px' },
  radius: { sm: '4px', md: '8px', lg: '12px', full: '9999px' },
  font: {
    family: "'Inter', -apple-system, sans-serif",
    mono: "'JetBrains Mono', monospace",
    size: { xs: '12px', sm: '14px', md: '16px', lg: '20px', xl: '24px' },
  },
}
```

### 3.2 UI Components
Минимальный набор:
- `Button`: primary/secondary/ghost variants, loading state, disabled
- `Input`: text/password, label, error message, icon
- `Modal`: overlay, close button, title, children
- `Spinner`: loading indicator
- `Toast`: success/error/info messages, auto-dismiss
- `Badge`: notification count
- `Avatar`: initials-based, color from user id hash

### 3.3 Auth Store
```typescript
// src/store/authStore.ts
interface AuthState {
  user: User | null
  matrixAccessToken: string | null
  matrixUserId: string | null
  matrixDeviceId: string | null
  isAuthenticated: boolean
  isLoading: boolean

  login: (credentials: LoginCredentials) => Promise<void>
  onboard: (token: string, displayName: string) => Promise<void>
  restoreSession: () => Promise<void>
  logout: () => void
}
```

### 3.4 Matrix Client Init
```typescript
// src/matrix/client.ts
import { createClient, MatrixClient } from 'matrix-js-sdk'

let matrixClient: MatrixClient | null = null

export function initMatrixClient(params: {
  baseUrl: string
  accessToken: string
  userId: string
  deviceId: string
}): MatrixClient {
  matrixClient = createClient({
    baseUrl: params.baseUrl,
    accessToken: params.accessToken,
    userId: params.userId,
    deviceId: params.deviceId,
    store: new IndexedDBStore({ ... }),
    cryptoStore: new IndexedDBCryptoStore(...)
  })

  matrixClient.initCrypto()
  matrixClient.startClient({ initialSyncLimit: 20 })

  return matrixClient
}
```

### 3.5 Routing
```typescript
// src/App.tsx
<Routes>
  <Route path="/invite/:token" element={<InvitePage />} />
  <Route path="/onboarding" element={<OnboardingPage />} />
  <Route path="/login" element={<LoginPage />} />
  <Route path="/" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
    <Route index element={<ChatList />} />
    <Route path="chat/:roomId" element={<ChatView />} />
    <Route path="circles" element={<CircleList />} />
    <Route path="circles/:id" element={<CircleView />} />
    <Route path="settings" element={<SettingsPage />} />
  </Route>
</Routes>
```

---

## Этап 4: Circles + Контакты + Chat List

### 4.1 Circle Store
```typescript
interface CircleState {
  circles: Circle[]
  activeCircleId: string | null
  isLoading: boolean

  loadCircles: () => Promise<void>
  setActiveCircle: (id: string) => void
  createCircle: (name: string, maxMembers: number) => Promise<Circle>
  getMembers: (circleId: string) => User[]
}
```

### 4.2 Chat List Logic
- Сортировка: pinned (general, announcements) → по дате последнего сообщения
- Группировка: по активному кругу
- Unread count: из Matrix sync
- Last message preview: текст или "[Файл]" / "[Изображение]"

### 4.3 Matrix Spaces Integration
```typescript
// src/matrix/rooms.ts
export function getSpaces(client: MatrixClient): Room[] {
  return client.getRooms().filter(r => r.isSpaceRoom())
}

export function getSpaceChildren(client: MatrixClient, spaceId: string): Room[] {
  // Via space state events
}

export function createDM(client: MatrixClient, userId: string, spaceId: string): Promise<Room> {
  // Create room, add to space, invite user
}
```

---

## Этап 5: Messaging

### 5.1 Chat Store
```typescript
interface ChatState {
  messages: Map<string, Message[]>  // roomId → messages
  pendingMessages: Message[]
  typingUsers: Map<string, string[]>  // roomId → userIds

  sendMessage: (roomId: string, body: string) => Promise<void>
  loadHistory: (roomId: string, limit: number) => Promise<void>
  setTyping: (roomId: string, isTyping: boolean) => void
  markRead: (roomId: string, eventId: string) => void
}
```

### 5.2 E2EE Setup
```typescript
// matrix-js-sdk handles E2EE internally
// We need to:
// 1. Initialize crypto on client start
// 2. Handle verification requests (auto-verify for same-user devices)
// 3. Handle key backup (optional for MVP)
```

### 5.3 Message States
```
composing → sending → sent → delivered → read
                    → error (retry available)
```

---

## Этап 6: Файлы и Offline

### 6.1 File Upload Flow
```
1. User selects file
2. Client checks size limit
3. Client uploads via matrix-js-sdk uploadContent()
4. Client sends m.room.message with msgtype: m.file/m.image
5. Recipient renders preview/download link
6. TTL badge shows "expires in N days"
```

### 6.2 Service Worker
```typescript
// public/sw.js
// Cache strategies:
// - App shell: Cache First
// - API calls: Network First
// - Matrix media: Cache First with TTL
// - Offline fallback page
```

### 6.3 Offline Queue
```typescript
// src/utils/offlineQueue.ts
// Store pending messages in IndexedDB
// On reconnect: flush queue in order
// Show pending status in UI
```

---

## Этап 7: Звонки + Push

### 7.1 VoIP Architecture
```
matrix-js-sdk VoIP module handles:
- Call signaling via Matrix events (m.call.invite, m.call.answer, etc.)
- WebRTC peer connection
- TURN/STUN configuration from Synapse

Our code handles:
- UI for call states
- Media stream management
- Camera/mic permissions
```

### 7.2 Call Store
```typescript
interface CallState {
  activeCall: MatrixCall | null
  callState: 'idle' | 'ringing' | 'connecting' | 'connected' | 'ended'
  isMuted: boolean
  isVideoMuted: boolean

  startCall: (roomId: string, type: 'voice' | 'video') => Promise<void>
  answerCall: () => void
  rejectCall: () => void
  hangUp: () => void
  toggleMute: () => void
  toggleVideo: () => void
}
```

### 7.3 Push Notifications
```typescript
// Service Worker handles push events
// Rails stores push subscriptions
// Synapse webhook or polling triggers push via Rails
```

---

## Этап 8: Polish + Production

### 8.1 PWA Manifest
```json
{
  "name": "Linka",
  "short_name": "Linka",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0a0c",
  "theme_color": "#0a0a0c",
  "icons": [...]
}
```

### 8.2 Production Docker
```
frontend/ → multi-stage: node build → nginx serve static
backend/  → multi-stage: ruby build → puma serve
```

### 8.3 E2E Tests (Playwright)
```typescript
// Key flows:
test('full onboarding flow')
test('send and receive message')
test('create circle and invite')
test('file upload')
test('audio call')
```
