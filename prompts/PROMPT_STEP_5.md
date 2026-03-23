# Linka Messenger — Этап 7: Звонки + Push + Этап 8: Production

## Контекст
Прочитай: `CLAUDE.md`, `docs/ARCHITECTURE.md`, `docs/CODING_PLAN.md`, `docs/TESTING_STRATEGY.md`

Этапы 1-6 завершены. Мессенджер работает: auth, circles, messaging, files, offline. Осталось добавить звонки, push и production-готовность.

## Задача
Добавить аудио/видеозвонки, push-уведомления, PWA polish, production Docker build и E2E тесты.

## Что нужно сделать

### Часть A: VoIP звонки (Этап 7)

#### Docker: coturn
Добавь в `docker-compose.yml`:
```yaml
coturn:
  image: coturn/coturn:latest
  network_mode: host
  volumes:
    - ./infrastructure/coturn/turnserver.conf:/etc/coturn/turnserver.conf
```

`infrastructure/coturn/turnserver.conf`:
```
listening-port=3478
tls-listening-port=5349
realm=your-domain.com
server-name=your-domain.com
lt-cred-mech
user=linka:password
fingerprint
no-cli
```

В Synapse homeserver.yaml добавь:
```yaml
turn_uris:
  - "turn:your-domain.com:3478?transport=udp"
  - "turn:your-domain.com:3478?transport=tcp"
turn_shared_secret: "your-secret"
turn_user_lifetime: 86400000
```

#### Matrix VoIP (`src/matrix/voip.ts`)
```typescript
import { MatrixClient } from 'matrix-js-sdk'

export function setupCallHandlers(client: MatrixClient, callbacks: CallCallbacks): void
export function placeCall(client: MatrixClient, roomId: string, type: 'voice' | 'video'): MatrixCall
export function answerCall(call: MatrixCall): void
export function rejectCall(call: MatrixCall): void
export function hangupCall(call: MatrixCall): void

interface CallCallbacks {
  onIncomingCall: (call: MatrixCall) => void
  onCallHangup: (call: MatrixCall) => void
  onCallError: (call: MatrixCall, error: Error) => void
}
```

#### Call Store (`src/store/callStore.ts`)
```typescript
interface CallState {
  activeCall: MatrixCall | null
  callState: 'idle' | 'ringing_outgoing' | 'ringing_incoming' | 'connecting' | 'connected' | 'ended'
  callType: 'voice' | 'video' | null
  isMuted: boolean
  isVideoMuted: boolean
  callDuration: number  // seconds
  remoteStream: MediaStream | null
  localStream: MediaStream | null

  startCall(roomId: string, type: 'voice' | 'video'): Promise<void>
  answerCall(): void
  rejectCall(): void
  hangUp(): void
  toggleMute(): void
  toggleVideo(): void
}
```
Напиши тесты для store (мок MatrixCall).

#### Компоненты звонков

**CallView** (`src/components/calls/CallView.tsx`):
- Полноэкранный overlay
- Видеозвонок: два video элемента (local small, remote large)
- Аудиозвонок: аватар собеседника, имя, длительность
- CallControls внизу
- Состояния: connecting (spinner), connected, ended

**IncomingCall** (`src/components/calls/IncomingCall.tsx`):
- Overlay с пульсирующим кругом
- Аватар + имя звонящего
- Тип: "Audio call" / "Video call"
- Кнопки: Accept (зелёная), Reject (красная)
- Звук (опционально, через Audio API)

**CallControls** (`src/components/calls/CallControls.tsx`):
- Кнопка: Mute/Unmute mic (иконка + состояние)
- Кнопка: Video on/off (только для видеозвонков)
- Кнопка: Switch camera (на мобильных, если несколько камер)
- Кнопка: Hang up (красная, большая)

#### Интеграция
- В ChatView header: кнопки "Audio call" и "Video call" (только для DM rooms)
- При входящем звонке — показать IncomingCall overlay (поверх всего)
- При активном звонке — показать CallView (поверх всего)
- При навигации во время звонка — мини-индикатор звонка

Напиши тесты для каждого компонента.

### Часть B: Push-уведомления (Этап 7)

#### VAPID Keys
Генерация при первом запуске (backend seed или rake task):
```ruby
require 'web-push'
vapid_key = WebPush.generate_key
ServerSetting.set('notifications.vapid_public_key', vapid_key.public_key)
ServerSetting.set('notifications.vapid_private_key', vapid_key.private_key)
```

Добавь `gem 'web-push'` в Gemfile.

#### Backend: Push Subscription API
```ruby
# Migration
create_table :push_subscriptions do |t|
  t.references :user, foreign_key: true
  t.string :endpoint, null: false
  t.string :p256dh_key, null: false
  t.string :auth_key, null: false
  t.timestamps
end

# Endpoints
POST /api/v1/push_subscriptions   — { endpoint, keys: { p256dh, auth } }
DELETE /api/v1/push_subscriptions — { endpoint }
GET /api/v1/settings              — включить vapid_public_key в публичные настройки
```

Напиши тесты для push subscription API.

#### Service Worker: Push Handler
В `public/sw.js` добавь:
```javascript
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {}
  const options = {
    body: data.body || 'New message',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    data: { url: data.url || '/', roomId: data.roomId },
    tag: data.roomId,  // group by room
    renotify: true,
  }
  event.waitUntil(self.registration.showNotification(data.title || 'Linka', options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(clients.openWindow(url))
})
```

#### Frontend: Push Registration
```typescript
// src/hooks/usePushNotifications.ts
function usePushNotifications() {
  const subscribe = async () => {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return

    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: vapidPublicKey
    })

    await api.post('/push_subscriptions', {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
        auth: arrayBufferToBase64(subscription.getKey('auth'))
      }
    })
  }

  return { subscribe, isSupported: 'PushManager' in window }
}
```

### Часть C: PWA Polish (Этап 8)

#### PWA Manifest (`public/manifest.json`)
```json
{
  "name": "Linka Messenger",
  "short_name": "Linka",
  "description": "Private self-hosted messenger",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0a0c",
  "theme_color": "#0a0a0c",
  "orientation": "any",
  "icons": [
    { "src": "/icons/icon-72.png", "sizes": "72x72", "type": "image/png" },
    { "src": "/icons/icon-96.png", "sizes": "96x96", "type": "image/png" },
    { "src": "/icons/icon-128.png", "sizes": "128x128", "type": "image/png" },
    { "src": "/icons/icon-144.png", "sizes": "144x144", "type": "image/png" },
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

Создай простые SVG иконки (буква "L" на тёмном фоне) и конвертируй в PNG размеры.
Или создай placeholder иконки (цветные квадраты) — лучше чем ничего.

#### Install Prompt
```typescript
// src/hooks/useInstallPrompt.ts
function useInstallPrompt() {
  // Слушает beforeinstallprompt
  // Показывает кастомный UI "Install Linka"
  // Вызывает prompt() при клике
}
```

#### Responsive
- Убедись что все компоненты работают на 320px-1920px
- Sidebar: на мобильных — drawer (открывается по гамбургеру)
- ChatView: на мобильных — полноэкранный (back arrow в header)
- CallView: адаптивный для portrait и landscape

### Часть D: Admin Panel (Этап 8)

#### AdminSettings (`src/components/settings/AdminSettings.tsx`)
- Таблица пользователей (имя, круги, дата регистрации, действия)
- Удаление пользователя (с подтверждением)
- Серверные настройки: форма с полями из SERVER_CONFIG.md
- Только для admin пользователей

#### SettingsPage (`src/components/settings/SettingsPage.tsx`)
- Профиль: изменение display name
- Уведомления: включить/выключить push
- Сессии: список устройств (из Matrix), logout other sessions
- О сервере: версия, server name

### Часть E: Error Handling (Этап 8)

#### Error Boundary
```typescript
// src/components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) { return { hasError: true, error } }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} onRetry={() => this.setState({ hasError: false })} />
    }
    return this.props.children
  }
}
```

Оберни в ErrorBoundary: AppShell, ChatView, CallView.

### Часть F: Production Docker (Этап 8)

#### Frontend Dockerfile
```dockerfile
# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

#### Backend Dockerfile
```dockerfile
FROM ruby:3.2-alpine AS build
RUN apk add build-base postgresql-dev
WORKDIR /app
COPY Gemfile* ./
RUN bundle install --without development test
COPY . .

FROM ruby:3.2-alpine
RUN apk add postgresql-client
WORKDIR /app
COPY --from=build /usr/local/bundle /usr/local/bundle
COPY --from=build /app .
EXPOSE 3000
CMD ["bundle", "exec", "puma", "-C", "config/puma.rb"]
```

#### docker-compose.prod.yml
Override для production: no dev servers, production ENV, volumes для certs.

#### Nginx production
Security headers: X-Frame-Options, X-Content-Type-Options, CSP, HSTS.
gzip compression. Rate limiting.

### Часть G: E2E тесты (Этап 8)

#### Playwright Setup
```bash
npm init playwright@latest -- --quiet
```

`playwright.config.ts` — настрой baseURL, projects (chromium + mobile).

#### Тесты

**e2e/onboarding.spec.ts**:
```typescript
test('new user can join via invite link', async ({ page }) => {
  // Setup: create invite via API
  // Open invite URL
  // Enter display name
  // Submit
  // Verify app shell loaded
  // Verify user sees circle
})
```

**e2e/messaging.spec.ts**:
```typescript
test('users can exchange messages', async ({ browser }) => {
  // Setup: two users in same circle
  // User A opens DM with User B
  // User A types and sends message
  // User B opens same DM
  // User B sees the message
})
```

**e2e/circles.spec.ts**:
```typescript
test('user can create circle and generate invite', async ({ page }) => {
  // Login as existing user
  // Create new circle
  // Verify circle appears in list
  // Copy invite link
  // Verify invite link format
})
```

**e2e/files.spec.ts**:
```typescript
test('user can upload and view image', async ({ page }) => {
  // Open chat
  // Attach image file
  // Verify upload
  // Verify thumbnail in chat
  // Click → lightbox
})
```

#### README.md
Создай README с секциями:
- О проекте
- Quick Start (docker compose up)
- Configuration
- Development
- Deployment
- Architecture overview (ссылка на docs/)

## Definition of Done
- [ ] Аудиозвонок: initiate → ring → connect → hangup
- [ ] Видеозвонок: initiate → ring → connect → hangup
- [ ] Mute/unmute работает
- [ ] Incoming call UI показывается
- [ ] Push-уведомления: subscription → receive notification
- [ ] PWA manifest корректный
- [ ] PWA installable (beforeinstallprompt)
- [ ] Responsive: работает на 320px и 1920px
- [ ] Admin panel: управление пользователями и настройками
- [ ] Error boundaries работают
- [ ] Docker production build: `docker compose -f docker-compose.prod.yml build` — success
- [ ] E2E: `npx playwright test` — все проходят
- [ ] Unit: `npm test -- --run` — 0 failures
- [ ] Backend: `bundle exec rspec` — 0 failures
- [ ] TypeScript: `npx tsc --noEmit` — 0 errors
- [ ] README.md существует и содержит инструкции

## Коммиты
```
feat: stage 7 - VoIP calls and push notifications
feat: stage 8 - PWA, production build, E2E tests, admin panel
```
