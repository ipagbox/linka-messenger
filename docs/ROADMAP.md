# Linka — Roadmap (Этапы реализации)

## Обзор этапов

Проект разбит на **8 этапов**. Каждый этап — самостоятельная функциональная единица, которая может быть протестирована и верифицирована автоматически.

```
Этап 1: Инфраструктура и скелет проекта
Этап 2: Backend — Invite System + Onboarding API
Этап 3: Frontend — Onboarding Flow + Auth
Этап 4: Circles + Контакты + Chat List
Этап 5: Messaging (отправка/получение/E2EE)
Этап 6: Файлы, медиа, offline
Этап 7: Звонки (VoIP) + Push-уведомления
Этап 8: UI polish, PWA, Docker production, E2E тесты
```

---

## Этап 1: Инфраструктура и скелет проекта

**Цель:** Рабочий dev-стек с Docker Compose, пустые проекты frontend/backend, CI pipeline, Synapse запущен и отвечает.

**Задачи:**
1. Docker Compose: PostgreSQL (для Rails), PostgreSQL (для Synapse), Synapse, Redis
2. Synapse: базовая конфигурация `homeserver.yaml`, registration отключена
3. Rails: `rails new backend --api --database=postgresql`, базовая настройка
4. React: `npm create vite@latest frontend -- --template react-ts`, базовая настройка
5. Nginx: reverse proxy конфигурация (dev)
6. GitHub Actions: lint + test для frontend и backend
7. Health check endpoints: Rails `/health`, Synapse `/_matrix/client/versions`
8. `.env.example` с описанием всех переменных

**Definition of Done:**
- [ ] `docker compose up` запускает все сервисы без ошибок
- [ ] `curl http://localhost/health` → 200 (Rails)
- [ ] `curl http://localhost/_matrix/client/versions` → 200 (Synapse)
- [ ] Frontend открывается в браузере на localhost:5173
- [ ] Rails тесты проходят: `rails test` → 0 failures
- [ ] Frontend тесты проходят: `npm test` → 0 failures
- [ ] CI pipeline зелёный

**Тесты:**
- Rails: health controller spec
- Frontend: App component renders test
- Integration: docker compose healthcheck проходит

---

## Этап 2: Backend — Invite System + Onboarding API

**Цель:** REST API для создания инвайтов, валидации, онбординга, создания пользователей через Synapse Admin API.

**Задачи:**
1. Модели: User, Invite, Circle, CircleMembership, ServerSetting
2. Миграции БД
3. MatrixAdminService — обёртка над Synapse Admin API
4. InviteService — создание, валидация, consume
5. OnboardingService — полный flow регистрации
6. CircleService — создание Space + комнат в Matrix
7. API endpoints:
   - `POST /api/v1/invites/validate`
   - `POST /api/v1/onboarding`
   - `POST /api/v1/circles`
   - `GET /api/v1/circles`
   - `POST /api/v1/circles/:id/invites`
   - `GET /api/v1/settings` (серверные настройки)
   - `PUT /api/v1/admin/settings` (админ)
8. Авторизация: JWT tokens для API
9. Admin bootstrap: первый пользователь = admin

**Definition of Done:**
- [ ] Все модели имеют валидации и unit-тесты
- [ ] Invite создаётся, валидируется, consumeится — покрыто тестами
- [ ] Onboarding создаёт пользователя в Synapse (мок в тестах)
- [ ] Circle создаётся, маппится на Matrix Space
- [ ] Все API endpoints покрыты request specs
- [ ] `rails test` → 0 failures, coverage > 90% для новых файлов
- [ ] Seed данные создают admin + первый circle

**Тесты:**
- Unit: модели (валидации, ассоциации, scopes)
- Unit: сервисы (InviteService, OnboardingService, CircleService)
- Request specs: все API endpoints (happy path + errors)
- MatrixAdminService: мок HTTP-запросов через WebMock

---

## Этап 3: Frontend — Onboarding Flow + Auth

**Цель:** Пользователь может открыть invite-ссылку, пройти онбординг, войти в app shell.

**Задачи:**
1. UI Kit: Button, Input, Modal, Spinner, Toast (базовые компоненты)
2. Тема: CSS tokens, тёмная тема по умолчанию
3. API client: axios/fetch обёртка для Rails API
4. Auth store (Zustand): login state, tokens, session persistence
5. Роутинг: React Router (invite, onboarding, app)
6. InvitePage: ввод токена → валидация → переход на onboarding
7. OnboardingPage: ввод display name → создание аккаунта
8. Matrix client инициализация: подключение к Synapse
9. Session persistence: сохранение/восстановление из localStorage
10. AppShell: sidebar placeholder, header, logout
11. LoginPage: повторный вход для существующих пользователей

**Definition of Done:**
- [ ] Invite flow работает end-to-end (с моком бекенда в тестах)
- [ ] Session сохраняется и восстанавливается при reload
- [ ] Logout полностью очищает state
- [ ] UI компоненты имеют unit-тесты
- [ ] Auth store покрыт тестами
- [ ] Невалидный invite показывает ошибку
- [ ] Все компоненты рендерятся без ошибок
- [ ] `npm test` → 0 failures

**Тесты:**
- Unit: UI компоненты (render + interaction)
- Unit: Auth store (login, logout, persist, restore)
- Unit: API client (мок запросов)
- Integration: Invite flow (мок API → validate → onboarding → app shell)

---

## Этап 4: Circles + Контакты + Chat List

**Цель:** Пользователь видит свои круги, контакты в каждом круге, список чатов.

**Задачи:**
1. Circle store (Zustand): список кругов, активный круг
2. CircleList: sidebar — переключение между кругами
3. CircleView: отображение участников круга
4. ContactList: список контактов текущего круга
5. ChatList: список чатов (general chat закреплён сверху, announcements, 1-1 чаты)
6. Создание DM: нажатие на контакт → создание/открытие DM room
7. Circle creation: форма создания нового круга + генерация invite ссылки
8. InviteCreate: UI для создания и копирования invite-ссылки
9. Matrix sync: получение списка rooms/spaces из Synapse
10. Маппинг Matrix Spaces → Circles в store

**Definition of Done:**
- [ ] Список кругов загружается из Matrix (Spaces)
- [ ] Переключение между кругами обновляет chat list и contacts
- [ ] General chat и Announcements закреплены вверху
- [ ] Создание DM работает
- [ ] Создание нового круга работает (frontend → backend → Matrix)
- [ ] Invite-ссылка генерируется и копируется
- [ ] Все компоненты покрыты тестами
- [ ] `npm test` → 0 failures

**Тесты:**
- Unit: Circle store (load, switch, create)
- Unit: ChatList (rendering, sorting, pinning)
- Unit: ContactList (rendering, filtering by circle)
- Integration: Circle creation flow
- Integration: DM creation flow

---

## Этап 5: Messaging (отправка/получение/E2EE)

**Цель:** Полноценный чат: отправка, получение, E2EE, typing indicators, read receipts.

**Задачи:**
1. Chat store (Zustand): messages, loading state, pagination
2. ChatView: отображение сообщений с infinite scroll вверх
3. MessageInput: ввод текста, отправка по Enter
4. MessageBubble: рендеринг сообщения (свой/чужой, время, статус)
5. Отправка через matrix-js-sdk: `sendMessage()`
6. Получение через sync: `on("Room.timeline", ...)`
7. E2EE: инициализация crypto, верификация устройств (auto)
8. Typing indicators: отправка + отображение
9. Read receipts: отправка при просмотре + отображение
10. Pending state: сообщение в очереди до подтверждения
11. Error state: отображение ошибки отправки + retry

**Definition of Done:**
- [ ] Текстовое сообщение отправляется и отображается
- [ ] Входящие сообщения появляются в реальном времени
- [ ] E2EE работает (сообщения шифруются)
- [ ] Typing indicator отображается при наборе
- [ ] Read receipts обновляются
- [ ] Pending/error состояния отображаются
- [ ] Scroll вверх загружает историю
- [ ] `npm test` → 0 failures

**Тесты:**
- Unit: Chat store (send, receive, pagination, pending states)
- Unit: MessageBubble (all states: sent, pending, error, received)
- Unit: MessageInput (submit, typing event)
- Unit: TypingIndicator, ReadReceipt
- Integration: Send → receive flow (мок matrix-js-sdk)

---

## Этап 6: Файлы, медиа, offline

**Цель:** Отправка файлов/изображений, preview, offline-режим, auto-удаление медиа.

**Задачи:**
1. MediaUpload: UI для выбора файла + drag-and-drop
2. Загрузка через Matrix media API: `uploadContent()`
3. ImagePreview: отображение изображений в чате (thumbnail + lightbox)
4. FileAttachment: отображение файлов (имя, размер, скачивание)
5. Ограничение размера: проверка на клиенте + серверная настройка
6. TTL для файлов: отображение "будет удалён через N дней"
7. Media cleanup job (Rails + Synapse Admin API)
8. Service Worker: кэширование app shell
9. Offline queue: сообщения в очереди при offline
10. Reconnect: автоматический retry при восстановлении сети
11. Online status indicator

**Definition of Done:**
- [ ] Изображения отправляются и отображаются с preview
- [ ] Файлы отправляются и доступны для скачивания
- [ ] Превышение лимита размера показывает ошибку
- [ ] TTL отображается на файлах в чате
- [ ] Cleanup job удаляет просроченные медиа
- [ ] Offline: сообщения ставятся в очередь
- [ ] Reconnect: очередь отправляется при восстановлении
- [ ] Service Worker кэширует app shell
- [ ] `npm test` + `rails test` → 0 failures

**Тесты:**
- Unit: MediaUpload (file selection, size validation)
- Unit: ImagePreview, FileAttachment (rendering)
- Unit: Offline queue (enqueue, dequeue, retry)
- Backend: MediaCleanupService (мок Synapse API)
- Backend: cleanup job scheduling
- Integration: Upload → display flow

---

## Этап 7: Звонки (VoIP) + Push-уведомления

**Цель:** Аудио- и видеозвонки 1-1, push-уведомления через PWA.

**Задачи:**
1. coturn: добавить в Docker Compose, настроить TURN/STUN
2. Synapse: настроить TURN credentials
3. Call store (Zustand): call state, media streams
4. CallView: UI для активного звонка (видео/аудио)
5. IncomingCall: UI для входящего звонка (accept/reject)
6. CallControls: mute audio, mute video, switch camera, end call
7. Инициация звонка: кнопка в ChatView → createCall
8. Приём звонка: обработка m.call.invite
9. Push notifications: Service Worker + Push API
10. Rails: Web Push subscription endpoint
11. Notification display: новое сообщение, входящий звонок
12. Permission request: запрос разрешения на уведомления

**Definition of Done:**
- [ ] Аудиозвонок работает между двумя вкладками
- [ ] Видеозвонок работает между двумя вкладками
- [ ] Mute/unmute audio и video работает
- [ ] Входящий звонок показывает UI с accept/reject
- [ ] Push-уведомление приходит при новом сообщении (с разрешения)
- [ ] Push-уведомление приходит при входящем звонке
- [ ] TURN relay работает (для NAT traversal)
- [ ] `npm test` → 0 failures

**Тесты:**
- Unit: Call store (all states: idle, ringing, connected, ended)
- Unit: CallView, IncomingCall, CallControls (rendering)
- Unit: Push notification subscription
- Integration: Call flow (мок WebRTC + matrix-js-sdk)
- Backend: Push subscription API

---

## Этап 8: UI polish, PWA, Docker production, E2E тесты

**Цель:** Production-ready: PWA installable, Docker production build, E2E тесты, UI финализация.

**Задачи:**
1. PWA manifest: icons, splash screen, display: standalone
2. Install prompt: custom UI для "Add to Home Screen"
3. UI polish: responsive layout (mobile-first), transitions
4. Admin panel: управление пользователями, серверные настройки
5. Settings page: профиль, уведомления, тема
6. Error boundaries: graceful error handling
7. Docker production: multi-stage builds, production configs
8. Nginx production: TLS, security headers, gzip
9. E2E тесты (Playwright): основные user flows
10. Documentation: README, deployment guide
11. Финальная проверка безопасности

**Definition of Done:**
- [ ] PWA устанавливается на мобильном и десктопе
- [ ] Все основные flows работают на мобильном экране
- [ ] Admin может управлять пользователями и настройками
- [ ] Docker production build запускается одной командой
- [ ] E2E тесты проходят для: onboarding, messaging, circles
- [ ] Lighthouse PWA score > 90
- [ ] `npm test` + `rails test` + `npx playwright test` → 0 failures
- [ ] README содержит инструкции по deployment

**Тесты:**
- E2E: Полный onboarding flow
- E2E: Отправка и получение сообщений
- E2E: Создание круга и инвайт
- E2E: Файловые вложения
- E2E: Responsive layout
- Performance: Lighthouse audit

---

## Зависимости между этапами

```
Этап 1 ──► Этап 2 ──► Этап 3 ──► Этап 4 ──► Этап 5
                                                 │
                                    Этап 6 ◄─────┘
                                       │
                                    Этап 7
                                       │
                                    Этап 8
```

Этапы строго последовательные — каждый следующий зависит от предыдущего.

## Оценка объёма

| Этап | Файлов | Сложность | Примерный объём |
|------|--------|-----------|-----------------|
| 1 | ~15 | Средняя | Конфигурация + скелет |
| 2 | ~25 | Высокая | Модели + сервисы + API + тесты |
| 3 | ~20 | Средняя | UI + auth + matrix init |
| 4 | ~15 | Средняя | Stores + компоненты |
| 5 | ~12 | Высокая | Matrix messaging + E2EE |
| 6 | ~12 | Средняя | Media + offline |
| 7 | ~10 | Высокая | WebRTC + Push API |
| 8 | ~15 | Средняя | Polish + E2E + production |
