# Linka Messenger — Этап 3: Frontend Auth + Этап 4: Circles & Chat List

## Контекст
Прочитай: `CLAUDE.md`, `docs/ARCHITECTURE.md`, `docs/CODING_PLAN.md`

Этапы 1-2 завершены. Backend API готов. Теперь строим frontend.

Этот промпт объединяет этапы 3 и 4 — они тесно связаны и лучше делать вместе.

## Задача
Создай полный frontend: UI kit, авторизация, onboarding, circles, chat list, контакты.

## Что нужно сделать

### Часть A: UI Kit и тема (Этап 3)

#### Design Tokens (`src/styles/tokens.ts`)
Тёмная тема. Цвета, spacing, radius, fonts — смотри CODING_PLAN.md секция 3.1.

#### Global Styles (`src/styles/globals.css`)
```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { font-size: 16px; }
body {
  font-family: 'Inter', -apple-system, sans-serif;
  background: #0a0a0c;
  color: #e4e4e8;
  -webkit-font-smoothing: antialiased;
}
```

#### UI компоненты (`src/components/ui/`)
Создай каждый с CSS-модулем и тестом:
- **Button**: variants (primary/secondary/ghost), sizes (sm/md/lg), loading, disabled
- **Input**: text/password, label, error, icon prefix
- **Modal**: overlay с backdrop-blur, close, title, children
- **Spinner**: CSS-only анимация
- **Toast**: success/error/info, auto-dismiss 3s, stack
- **Badge**: numeric count, dot variant
- **Avatar**: initials из имени, цвет из hash user id

### Часть B: API и Auth (Этап 3)

#### API Client (`src/api/client.ts`)
- axios instance с baseURL из env
- Request interceptor: добавляет `Authorization: Bearer <jwt>`
- Response interceptor: 401 → logout

#### API модули
- `src/api/auth.ts`: login, logout
- `src/api/invites.ts`: validate(token)
- `src/api/onboarding.ts`: register(token, displayName)
- `src/api/circles.ts`: list, create, getMembers, createInvite
- `src/api/settings.ts`: getPublic

#### Auth Store (`src/store/authStore.ts`)
```typescript
interface AuthState {
  user: User | null
  jwt: string | null
  matrixCredentials: MatrixCredentials | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  login(matrixUserId: string, password: string): Promise<void>
  onboard(token: string, displayName: string): Promise<void>
  restoreSession(): Promise<boolean>
  logout(): void
}
```
- Persist в localStorage (jwt, matrixCredentials, user)
- При restore — валидация JWT expiry + init matrix client

Напиши тесты для store.

#### Matrix Client (`src/matrix/client.ts`)
- `initMatrixClient(credentials)` — создаёт и стартует MatrixClient
- `getMatrixClient()` — возвращает текущий клиент
- `destroyMatrixClient()` — stopClient + cleanup
- Настрой IndexedDB store для sync и crypto

Напиши тесты с моком matrix-js-sdk.

### Часть C: Страницы и роутинг (Этап 3)

#### Роутинг (`src/App.tsx`)
```tsx
<Routes>
  <Route path="/invite/:token" element={<InvitePage />} />
  <Route path="/onboarding" element={<OnboardingPage />} />
  <Route path="/login" element={<LoginPage />} />
  <Route element={<ProtectedRoute />}>
    <Route element={<AppShell />}>
      <Route path="/" element={<ChatListPage />} />
      <Route path="/chat/:roomId" element={<ChatViewPage />} />
      <Route path="/circles" element={<CirclesPage />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Route>
  </Route>
</Routes>
```

#### InvitePage
- Извлекает token из URL params
- Вызывает validate API
- Показывает loading → success (circle name, кнопка "Join") → redirect to /onboarding
- Или error если токен невалидный

#### OnboardingPage
- Поле display name (с валидацией длины)
- Кнопка "Create Account"
- Вызывает onboarding API
- При успехе → init matrix client → redirect to /

#### LoginPage
- Поля: username, password
- Кнопка Login
- Вызывает sessions API → init matrix client → redirect to /

#### ProtectedRoute
- Проверяет isAuthenticated
- Если нет — redirect to /login
- При mount — restoreSession()

#### AppShell
- Layout: sidebar (circles + chats) + main content
- Header: server name, user avatar, settings icon
- Mobile: sidebar как drawer

Напиши тесты для каждой страницы.

### Часть D: Circles и Chat List (Этап 4)

#### Circle Store (`src/store/circleStore.ts`)
```typescript
interface CircleState {
  circles: Circle[]
  activeCircleId: string | null
  isLoading: boolean

  loadCircles(): Promise<void>
  setActiveCircle(id: string): void
  createCircle(name: string, maxMembers: number): Promise<Circle>
}
```
Напиши тесты.

#### Matrix Rooms (`src/matrix/rooms.ts`)
```typescript
export function getSpaces(client: MatrixClient): Room[]
export function getSpaceChildren(client: MatrixClient, spaceId: string): Room[]
export function getRoomType(room: Room): 'general' | 'announcements' | 'dm'
export function createDM(client: MatrixClient, userId: string): Promise<Room>
export function getUnreadCount(room: Room): number
export function getLastMessage(room: Room): Message | null
```
Напиши тесты с моком.

#### Компоненты
- **Sidebar** (`src/components/layout/Sidebar.tsx`): CircleList сверху, ChatList внизу
- **CircleList**: список кругов, активный выделен, кнопка "+"
- **ChatList**: pinned (general, announcements) → sorted by last message. Каждый item: avatar, name, last message preview, unread badge, timestamp
- **ContactList**: список участников текущего круга, клик → открыть/создать DM
- **ContactCard**: avatar, display name, online status dot
- **CircleSettings**: название, участники, инвайт-ссылки
- **InviteCreate**: кнопка создания инвайта, отображение ссылки, кнопка копирования

Напиши тесты для каждого компонента.

### Часть E: Types

```typescript
// src/types/index.ts
interface User {
  id: number
  matrixUserId: string
  displayName: string
  isAdmin: boolean
}

interface Circle {
  id: number
  name: string
  matrixSpaceId: string
  maxMembers: number
  memberCount: number
  role: 'admin' | 'member'
}

interface MatrixCredentials {
  userId: string
  accessToken: string
  deviceId: string
  homeserverUrl: string
}

interface ChatListItem {
  roomId: string
  name: string
  type: 'general' | 'announcements' | 'dm'
  lastMessage: string | null
  lastMessageTime: number | null
  unreadCount: number
  isPinned: boolean
  avatarUrl: string | null
}

interface Invite {
  id: number
  token: string  // only on creation
  maxUses: number
  usesCount: number
  expiresAt: string | null
  circleId: number
  link: string
}
```

## Definition of Done
- [ ] UI компоненты рендерятся, тесты проходят
- [ ] Invite flow: /invite/:token → validate → /onboarding → create account → app shell
- [ ] Login flow: /login → auth → app shell
- [ ] Session persist: reload → auto-login
- [ ] Logout: очистка + redirect to /login
- [ ] Circle list загружается и отображается
- [ ] Chat list отображается с pinning и sorting
- [ ] Создание круга работает (frontend → API)
- [ ] Все тесты: `npm test -- --run` → 0 failures
- [ ] TypeScript: `npx tsc --noEmit` → 0 errors
- [ ] Build: `npm run build` → success

## Коммиты
```
feat: stage 3 - frontend UI kit, auth, and onboarding
feat: stage 4 - circles, contacts, and chat list
```
