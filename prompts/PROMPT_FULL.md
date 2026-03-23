# Linka Messenger — Полный промпт для Claude Code (все этапы)

Ты — кодинг-агент, который реализует проект Linka Messenger. Перед началом работы прочитай все файлы документации:
- `CLAUDE.md` — общие инструкции
- `docs/ARCHITECTURE.md` — архитектура
- `docs/ROADMAP.md` — этапы
- `docs/CODING_PLAN.md` — детальный план
- `docs/TESTING_STRATEGY.md` — стратегия тестирования
- `docs/SERVER_CONFIG.md` — настройки сервера

## Общие правила

1. **Работай последовательно по этапам** (1 → 2 → 3 → 4 → 5 → 6 → 7 → 8)
2. **После каждого этапа** запусти проверку: `./scripts/verify-stage.sh <N>` и убедись что все тесты проходят
3. **Не переходи к следующему этапу** пока не прошли все тесты текущего
4. **Коммить после каждого этапа** с сообщением формата: `feat: stage N - <описание>`
5. **Пиши тесты ПЕРЕД или ОДНОВРЕМЕННО с кодом**, не откладывай тесты на потом
6. **Используй моки** для Matrix API и Synapse Admin API в тестах
7. **Не пропускай тесты**: если тест падает — исправь код, не удаляй тест

## Порядок работы

### Этап 1: Инфраструктура и скелет
1. Создай структуру директорий
2. Напиши `docker-compose.yml` с сервисами: db-rails, db-synapse, redis, synapse
3. Создай конфигурацию Synapse (`infrastructure/synapse/homeserver.yaml`)
4. Инициализируй Rails проект (`backend/`): `rails new . --api --database=postgresql`
5. Добавь зависимости в Gemfile (rack-cors, jwt, httparty, rspec-rails, factory_bot_rails, webmock)
6. Настрой RSpec
7. Инициализируй React проект (`frontend/`): Vite + React + TypeScript
8. Добавь зависимости: matrix-js-sdk, zustand, react-router-dom, axios, vitest, @testing-library/react
9. Настрой Vitest
10. Создай Nginx конфигурацию (`infrastructure/nginx/default.conf`)
11. Напиши health endpoint для Rails
12. Напиши базовый тест для Rails (health spec)
13. Напиши базовый тест для Frontend (App renders)
14. Создай `.env.example`
15. Создай `scripts/verify-stage.sh`
16. Создай `.github/workflows/ci.yml`
17. **Проверка**: запусти тесты Rails и Frontend, убедись что проходят
18. Коммит: `feat: stage 1 - infrastructure and project skeleton`

### Этап 2: Backend — Invite System + Onboarding API
1. Создай миграции: users, circles, circle_memberships, invites, server_settings
2. Создай модели с валидациями и ассоциациями
3. Создай concern TokenDigestable
4. Напиши unit-тесты для всех моделей
5. Создай MatrixAdminService (с HTTParty)
6. Напиши тесты для MatrixAdminService (WebMock)
7. Создай InviteService
8. Напиши тесты для InviteService
9. Создай OnboardingService
10. Напиши тесты для OnboardingService
11. Создай CircleService
12. Напиши тесты для CircleService
13. Создай JWT authentication concern (Authenticatable)
14. Создай API контроллеры: invites, onboarding, circles, sessions, admin/server_settings
15. Напиши request specs для всех API эндпоинтов
16. Создай factories для всех моделей
17. Создай db/seeds.rb (admin bootstrap + default settings)
18. Настрой routes.rb
19. Настрой CORS (rack-cors)
20. **Проверка**: `bundle exec rspec` — все тесты зелёные
21. Коммит: `feat: stage 2 - backend invite system and onboarding API`

### Этап 3: Frontend — Onboarding Flow + Auth
1. Создай design tokens (`src/styles/tokens.ts`) — тёмная тема
2. Создай глобальные стили (`src/styles/globals.css`)
3. Создай UI компоненты: Button, Input, Modal, Spinner, Toast, Badge, Avatar
4. Напиши тесты для каждого UI компонента
5. Создай API client (`src/api/client.ts`) — axios обёртка с interceptors
6. Создай API модули: auth.ts, invites.ts, circles.ts, settings.ts
7. Создай Auth store (Zustand) с persist middleware
8. Напиши тесты для Auth store
9. Создай Matrix client wrapper (`src/matrix/client.ts`)
10. Настрой роутинг (React Router): /invite/:token, /onboarding, /login, / (protected)
11. Создай InvitePage компонент
12. Создай OnboardingPage компонент
13. Создай LoginPage компонент
14. Создай AppShell (layout: sidebar + header + content area)
15. Создай ProtectedRoute компонент
16. Напиши тесты для InvitePage, OnboardingPage, LoginPage
17. Напиши integration тест для onboarding flow
18. **Проверка**: `npm test -- --run && npx tsc --noEmit && npm run build`
19. Коммит: `feat: stage 3 - frontend onboarding and auth`

### Этап 4: Circles + Контакты + Chat List
1. Создай Circle store (Zustand)
2. Напиши тесты для Circle store
3. Создай Matrix rooms wrapper (`src/matrix/rooms.ts`) — spaces, children, DM creation
4. Напиши тесты для rooms wrapper (мок matrix-js-sdk)
5. Создай CircleList компонент (sidebar)
6. Создай CircleView компонент
7. Создай ContactList компонент
8. Создай ContactCard компонент
9. Создай ChatList компонент (с pinning general/announcements)
10. Создай InviteCreate компонент (создание + копирование ссылки)
11. Создай CircleSettings компонент
12. Интегрируй всё в AppShell
13. Напиши тесты для всех компонентов
14. Напиши integration тест: создание круга → получение инвайт-ссылки
15. **Проверка**: `npm test -- --run && npx tsc --noEmit`
16. Коммит: `feat: stage 4 - circles, contacts, and chat list`

### Этап 5: Messaging
1. Создай Chat store (Zustand) — messages, pending, typing, pagination
2. Напиши тесты для Chat store
3. Создай Matrix messages wrapper (`src/matrix/messages.ts`)
4. Напиши тесты для messages wrapper
5. Создай ChatView компонент (с infinite scroll)
6. Создай MessageInput компонент
7. Создай MessageBubble компонент (стили: не пузыри, а минималистичные блоки)
8. Создай TypingIndicator компонент
9. Создай ReadReceipt компонент
10. Настрой E2EE initialization в Matrix client
11. Реализуй message states: composing → sending → sent → error
12. Напиши тесты для всех чат-компонентов
13. Напиши integration тест: отправка → отображение сообщения
14. **Проверка**: `npm test -- --run && npx tsc --noEmit`
15. Коммит: `feat: stage 5 - messaging with E2EE`

### Этап 6: Файлы, медиа, offline
1. Создай Matrix media wrapper (`src/matrix/media.ts`) — upload, download
2. Напиши тесты для media wrapper
3. Создай MediaUpload компонент (выбор файла + drag-and-drop)
4. Создай ImagePreview компонент (thumbnail + lightbox)
5. Создай FileAttachment компонент (имя, размер, TTL badge, скачивание)
6. Добавь поддержку файлов в MessageInput и MessageBubble
7. Добавь валидацию размера файла (клиентская)
8. Создай Service Worker (`public/sw.js`) — кэширование app shell
9. Создай offline queue (`src/utils/offlineQueue.ts`) — IndexedDB
10. Создай хук useOnlineStatus
11. Реализуй reconnect + flush queue
12. Backend: создай MediaCleanupService + cleanup job
13. Backend: напиши тесты для cleanup
14. Напиши тесты для всех frontend компонентов
15. **Проверка**: `npm test -- --run && cd ../backend && bundle exec rspec`
16. Коммит: `feat: stage 6 - files, media, and offline support`

### Этап 7: Звонки + Push-уведомления
1. Добавь coturn в docker-compose.yml
2. Настрой TURN credentials в Synapse
3. Создай Matrix VoIP wrapper (`src/matrix/voip.ts`)
4. Создай Call store (Zustand)
5. Напиши тесты для Call store
6. Создай CallView компонент (видео + аудио)
7. Создай IncomingCall компонент (accept/reject)
8. Создай CallControls компонент (mute, video, hang up)
9. Добавь кнопку звонка в ChatView (только для DM)
10. Настрой Push API в Service Worker
11. Backend: создай Push subscription endpoint
12. Backend: напиши тесты для push subscription
13. Создай хук usePushNotifications
14. Реализуй отображение push для новых сообщений и входящих звонков
15. Напиши тесты для всех компонентов звонков
16. **Проверка**: `npm test -- --run && cd ../backend && bundle exec rspec`
17. Коммит: `feat: stage 7 - VoIP calls and push notifications`

### Этап 8: UI polish, PWA, production, E2E
1. Создай PWA manifest (`public/manifest.json`) — иконки, цвета, display: standalone
2. Создай install prompt UI
3. Проведи responsive audit — убедись что всё работает на мобильных экранах
4. Создай AdminSettings компонент (управление пользователями, серверные настройки)
5. Создай SettingsPage компонент (профиль, уведомления)
6. Добавь Error Boundaries
7. Создай production Docker multi-stage builds (frontend → nginx, backend → puma)
8. Создай docker-compose.prod.yml
9. Настрой Nginx production (security headers, gzip)
10. Создай E2E тесты (Playwright):
    - Onboarding flow
    - Messaging flow
    - Circle creation
    - File upload
11. Создай README.md с инструкциями по deployment
12. **Проверка**: `npm test -- --run && bundle exec rspec && npx playwright test`
13. Коммит: `feat: stage 8 - PWA, production build, E2E tests`

## Важные замечания

- **matrix-js-sdk**: используй `createClient()` из пакета. Документация: https://matrix-org.github.io/matrix-js-sdk/
- **Synapse Admin API**: https://element-hq.github.io/synapse/latest/admin_api/
- **Для тестов НЕ нужен запущенный Synapse** — используй моки (WebMock для Ruby, vi.mock для TS)
- **UI стиль**: минималистичный, тёмная тема. Сообщения НЕ пузыри, а блоки с левым бордером для чужих и правым для своих
- **Не используй** MUI, Chakra, Tailwind — пиши CSS вручную (CSS Modules или styled-components)
- **Mobile-first**: все media queries от мобильного к десктопу
