# Linka Messenger — Этап 2: Backend API (Invite + Onboarding + Circles)

## Контекст
Прочитай документацию: `CLAUDE.md`, `docs/ARCHITECTURE.md`, `docs/CODING_PLAN.md`, `docs/SERVER_CONFIG.md`

Этап 1 завершён — Rails проект настроен, RSpec работает.

## Задача
Создай полноценный REST API для системы инвайтов, онбординга и кругов.

## Что нужно сделать

### 1. Миграции
Создай миграции для таблиц (схемы в CODING_PLAN.md):
- `users`: matrix_user_id, display_name, is_admin, auth_token_digest, timestamps
- `circles`: name, matrix_space_id, matrix_general_room_id, matrix_announcements_room_id, creator_id, max_members, timestamps
- `circle_memberships`: user_id, circle_id, role, timestamps (unique index на user_id + circle_id)
- `invites`: token_digest, circle_id, creator_id, max_uses, uses_count, expires_at, timestamps
- `server_settings`: key, value, value_type, description, timestamps

### 2. Модели
Для каждой модели напиши:
- Валидации
- Ассоциации
- Scopes
- Instance methods
- **Unit тесты** (spec/models/)

Детали моделей — в CODING_PLAN.md секция 2.2.

Concern `TokenDigestable`:
```ruby
module TokenDigestable
  extend ActiveSupport::Concern

  class_methods do
    def generate_token
      SecureRandom.urlsafe_base64(32)
    end

    def digest_token(token)
      Digest::SHA256.hexdigest(token)
    end

    def find_by_token(token)
      find_by(token_digest: digest_token(token))
    end
  end
end
```

### 3. Сервисы
Создай сервисы (детали в CODING_PLAN.md секция 2.3):

**MatrixAdminService** — HTTP-клиент к Synapse Admin API:
- `create_user(username, display_name, password)` → PUT `/_synapse/admin/v2/users/@user:server`
- `create_space(name, creator_user_id)` → POST `/_matrix/client/v3/createRoom` с `type: m.space`
- `create_room(name, space_id, creator_user_id)` → POST `/_matrix/client/v3/createRoom`
- `join_room(user_id, room_id)` → POST `/_synapse/admin/v1/join/{roomId}`
- `get_user_access_token(user_id)` → POST `/_synapse/admin/v1/users/{userId}/login`

**InviteService**:
- `create(circle:, creator:, max_uses:, expires_in:)`
- `validate(token)` → Invite or nil
- `consume(token, user)` → CircleMembership

**OnboardingService**:
- `register(token:, display_name:)` → { user, matrix_credentials }
- `bootstrap_admin(display_name:, password:)` — создание первого админа

**CircleService**:
- `create(name:, creator:, max_members:)` → { circle, invite }
- Проверяет лимиты из ServerSettings

Для каждого сервиса напиши тесты. Для MatrixAdminService используй WebMock.

### 4. Authentication
Concern `Authenticatable`:
- Парсит `Authorization: Bearer <jwt>` header
- Декодирует JWT
- Находит User
- Возвращает 401 при ошибке

### 5. API контроллеры
Все под `Api::V1` namespace:

```ruby
# POST /api/v1/invites/validate — { token } → { valid, circle_name, ... }
# POST /api/v1/onboarding        — { token, display_name } → { user, matrix_credentials }
# POST /api/v1/sessions           — { matrix_user_id, password } → { jwt, user }
# DELETE /api/v1/sessions         — Logout

# GET  /api/v1/circles            — Список кругов текущего пользователя
# POST /api/v1/circles            — Создать круг { name, max_members }
# GET  /api/v1/circles/:id        — Детали круга

# GET  /api/v1/circles/:id/members — Участники круга
# POST /api/v1/circles/:id/invites — Создать инвайт для круга
# GET  /api/v1/circles/:id/invites — Список инвайтов круга

# GET  /api/v1/profile             — Профиль текущего пользователя
# PUT  /api/v1/profile             — Обновить профиль

# GET  /api/v1/settings            — Публичные настройки сервера

# GET  /api/v1/admin/server_settings — Все настройки (admin only)
# PUT  /api/v1/admin/server_settings — Обновить настройки (admin only)
# GET  /api/v1/admin/users           — Список пользователей (admin only)
```

Для каждого контроллера напиши request specs (happy path + error cases).

### 6. Seeds
```ruby
# db/seeds.rb
ServerSetting.load_defaults!

if User.count == 0
  service = OnboardingService.new
  admin = service.bootstrap_admin(
    display_name: ENV.fetch('ADMIN_DISPLAY_NAME', 'Admin'),
    password: ENV.fetch('ADMIN_PASSWORD') { SecureRandom.hex(16) }
  )
  puts "Admin created: #{admin.matrix_user_id}"
  puts "Admin password: #{ENV['ADMIN_PASSWORD'] || 'check logs'}"
end
```

### 7. Routes
Смотри CODING_PLAN.md секция 2.4.

### 8. Factories
Создай factories для всех моделей (spec/factories/).

## Definition of Done
- [ ] Все миграции проходят: `rails db:migrate`
- [ ] Все модели имеют тесты: `rspec spec/models/` — 0 failures
- [ ] Все сервисы имеют тесты: `rspec spec/services/` — 0 failures
- [ ] Все API endpoints имеют тесты: `rspec spec/requests/` — 0 failures
- [ ] Полный прогон: `bundle exec rspec` — 0 failures
- [ ] Нет pending тестов

## Коммит
```
feat: stage 2 - backend invite system, onboarding, and circles API
```
