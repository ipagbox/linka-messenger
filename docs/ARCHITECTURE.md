# Linka — Архитектура системы

## Обзор

Linka — self-hosted приватный мессенджер по приглашениям, построенный на протоколе Matrix.

```
┌─────────────────────────────────────────────────────────────┐
│                      Клиент (PWA)                           │
│  React + TypeScript + Vite + matrix-js-sdk                  │
│  Service Worker (offline + push notifications)              │
└──────────┬──────────────────────────┬───────────────────────┘
           │ REST API                 │ Matrix Client-Server API
           ▼                          ▼
┌──────────────────┐       ┌──────────────────────┐
│  Control Plane   │       │   Matrix Synapse      │
│  Ruby on Rails   │       │   (messaging server)  │
│                  │◄─────►│                       │
│  - Invites       │ Admin │  - Rooms / Spaces     │
│  - Circles       │  API  │  - Messages           │
│  - Onboarding    │       │  - E2EE (Olm/Megolm)  │
│  - Settings      │       │  - Media              │
│  - User mgmt     │       │  - VoIP signaling     │
└──────┬───────────┘       └──────┬───────────────┘
       │                          │
       ▼                          ▼
┌──────────────┐          ┌──────────────┐
│  PostgreSQL  │          │  PostgreSQL   │
│  (Rails DB)  │          │  (Synapse DB) │
└──────────────┘          └──────────────┘
```

## Компоненты

### 1. Frontend (PWA)

**Стек:** React 18+, TypeScript, Vite, matrix-js-sdk, Zustand

**Структура:**
```
frontend/
├── public/
│   ├── manifest.json
│   └── sw.js
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── api/                    # REST-клиент к Rails backend
│   │   ├── client.ts           # axios/fetch wrapper
│   │   ├── invites.ts
│   │   ├── auth.ts
│   │   └── settings.ts
│   ├── matrix/                 # Обёртка над matrix-js-sdk
│   │   ├── client.ts           # Инициализация MatrixClient
│   │   ├── rooms.ts            # Работа с комнатами
│   │   ├── messages.ts         # Отправка/получение
│   │   ├── voip.ts             # Аудио/видео звонки
│   │   ├── encryption.ts       # E2EE helpers
│   │   ├── media.ts            # Загрузка файлов
│   │   └── sync.ts             # Синхронизация
│   ├── store/                  # Zustand stores
│   │   ├── authStore.ts
│   │   ├── chatStore.ts
│   │   ├── circleStore.ts
│   │   ├── callStore.ts
│   │   └── uiStore.ts
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Header.tsx
│   │   ├── auth/
│   │   │   ├── InvitePage.tsx
│   │   │   ├── OnboardingPage.tsx
│   │   │   └── LoginPage.tsx
│   │   ├── chat/
│   │   │   ├── ChatList.tsx
│   │   │   ├── ChatView.tsx
│   │   │   ├── MessageInput.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── TypingIndicator.tsx
│   │   │   └── ReadReceipt.tsx
│   │   ├── circles/
│   │   │   ├── CircleList.tsx
│   │   │   ├── CircleView.tsx
│   │   │   ├── CircleSettings.tsx
│   │   │   └── InviteCreate.tsx
│   │   ├── calls/
│   │   │   ├── CallView.tsx
│   │   │   ├── IncomingCall.tsx
│   │   │   └── CallControls.tsx
│   │   ├── contacts/
│   │   │   ├── ContactList.tsx
│   │   │   └── ContactCard.tsx
│   │   ├── media/
│   │   │   ├── ImagePreview.tsx
│   │   │   ├── FileAttachment.tsx
│   │   │   └── MediaUpload.tsx
│   │   ├── settings/
│   │   │   ├── SettingsPage.tsx
│   │   │   ├── ProfileSettings.tsx
│   │   │   └── AdminSettings.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Modal.tsx
│   │       ├── Badge.tsx
│   │       ├── Spinner.tsx
│   │       └── Toast.tsx
│   ├── hooks/
│   │   ├── useMatrix.ts
│   │   ├── useMessages.ts
│   │   ├── useCircles.ts
│   │   ├── useCall.ts
│   │   ├── useOnlineStatus.ts
│   │   └── usePushNotifications.ts
│   ├── styles/
│   │   ├── globals.css
│   │   ├── theme.ts
│   │   └── tokens.ts
│   ├── utils/
│   │   ├── storage.ts
│   │   ├── format.ts
│   │   └── errors.ts
│   └── types/
│       ├── index.ts
│       ├── matrix.ts
│       └── api.ts
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
└── vitest.config.ts
```

### 2. Backend (Ruby on Rails — Control Plane)

**Стек:** Ruby 3.2+, Rails 7.1+, PostgreSQL, Sidekiq (опционально)

**Структура:**
```
backend/
├── app/
│   ├── controllers/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── invites_controller.rb
│   │   │       ├── circles_controller.rb
│   │   │       ├── onboarding_controller.rb
│   │   │       ├── sessions_controller.rb
│   │   │       ├── settings_controller.rb
│   │   │       └── admin/
│   │   │           ├── users_controller.rb
│   │   │           └── server_settings_controller.rb
│   │   └── health_controller.rb
│   ├── models/
│   │   ├── user.rb
│   │   ├── invite.rb
│   │   ├── circle.rb
│   │   ├── circle_membership.rb
│   │   ├── server_setting.rb
│   │   └── concerns/
│   │       └── token_digestable.rb
│   ├── services/
│   │   ├── invite_service.rb
│   │   ├── onboarding_service.rb
│   │   ├── matrix_admin_service.rb       # Synapse Admin API
│   │   ├── circle_service.rb
│   │   └── media_cleanup_service.rb
│   ├── serializers/
│   │   ├── invite_serializer.rb
│   │   ├── circle_serializer.rb
│   │   └── user_serializer.rb
│   └── jobs/
│       ├── expire_invites_job.rb
│       └── cleanup_media_job.rb
├── config/
│   ├── routes.rb
│   ├── database.yml
│   └── initializers/
│       └── matrix.rb
├── db/
│   └── migrate/
├── spec/
│   ├── models/
│   ├── controllers/
│   ├── services/
│   └── requests/
├── Gemfile
└── Dockerfile
```

### 3. Matrix Synapse

Используется как есть (Docker image). Конфигурируется через `homeserver.yaml`.

**Ключевые настройки:**
- Registration disabled (регистрация только через Rails + Synapse Admin API)
- E2EE enabled
- Media repository с TTL
- TURN server для VoIP (coturn)

### 4. Infrastructure

```
infrastructure/
├── docker-compose.yml
├── docker-compose.dev.yml
├── nginx/
│   └── default.conf
├── synapse/
│   ├── homeserver.yaml
│   └── log.config
├── coturn/
│   └── turnserver.conf
└── .env.example
```

## Ключевые потоки данных

### Регистрация по инвайту
```
1. User opens /invite/<token>
2. Frontend → Rails: POST /api/v1/invites/validate { token }
3. Rails validates token (not expired, not exhausted)
4. Rails → Frontend: { valid: true, circle_name, ... }
5. User enters display_name
6. Frontend → Rails: POST /api/v1/onboarding { token, display_name }
7. Rails → Synapse Admin API: Create user
8. Rails creates User record, CircleMembership
9. Rails marks invite usage (+1)
10. Rails → Synapse Admin API: Join user to circle Space + rooms
11. Rails → Frontend: { matrix_user_id, access_token, device_id }
12. Frontend initializes MatrixClient with credentials
```

### Создание круга
```
1. User → Frontend: Create circle { name, max_members }
2. Frontend → Rails: POST /api/v1/circles { name, max_members }
3. Rails validates (user limits, server limits)
4. Rails → Synapse Admin API: Create Space
5. Rails → Synapse Admin API: Create general chat room in Space
6. Rails → Synapse Admin API: Create announcement room in Space
7. Rails creates Circle, Invite records
8. Rails → Frontend: { circle, invite_link }
```

### Отправка сообщения
```
1. User types message
2. Frontend → matrix-js-sdk → Synapse: PUT /_matrix/client/v3/rooms/{roomId}/send/m.room.message
3. Synapse encrypts (if E2EE room), stores, delivers
4. Recipients' matrix-js-sdk receives via /sync
5. Frontend renders message
```

### Звонок 1-1
```
1. Caller → matrix-js-sdk: createCall(roomId)
2. matrix-js-sdk → Synapse: m.call.invite event
3. Callee receives event via /sync
4. Callee → matrix-js-sdk: answerCall()
5. WebRTC connection established via TURN/STUN
6. Media flows P2P (or via TURN relay)
```

## Маппинг Matrix-сущностей на Linka-концепции

| Linka | Matrix | Описание |
|-------|--------|----------|
| Circle | Space | Пространство с дочерними комнатами |
| Circle General Chat | Room (in Space) | Общий чат круга |
| Circle Announcements | Room (in Space, restricted) | Доска объявлений |
| Direct Chat | DM Room | Приватный чат 1-1 внутри Space |
| User | Matrix User | @username:domain |
| File attachment | Matrix Media | mxc:// URLs |
| Call | VoIP events | m.call.* events |

## Безопасность

1. **E2EE**: Olm/Megolm через matrix-js-sdk. Cross-signing для верификации устройств.
2. **Invite tokens**: Хранятся как SHA-256 digest в БД Rails. Plaintext токен существует только в URL.
3. **Session**: Matrix access_token хранится в IndexedDB/localStorage. Rails session через httpOnly cookie.
4. **HTTPS**: Обязателен в production. Nginx terminates TLS.
5. **CORS**: Rails разрешает только origin фронтенда.
6. **Rate limiting**: На уровне Nginx и Synapse.

## Технологические решения

| Решение | Обоснование |
|---------|-------------|
| React + Vite | Быстрая сборка, широкая экосистема |
| Zustand | Легковесный state management, проще Redux |
| matrix-js-sdk | Официальный SDK, полная поддержка протокола |
| Ruby on Rails | Быстрая разработка control plane, convention over configuration |
| PostgreSQL | Надёжность, поддержка Synapse |
| Docker Compose | Простой self-hosted deployment |
| Nginx | Reverse proxy, TLS termination, static files |
| coturn | TURN/STUN для VoIP через NAT |
