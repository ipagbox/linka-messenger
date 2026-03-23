# Linka — Серверные настройки и кастомизация

## Настройки сервера (ServerSettings)

Все настройки хранятся в таблице `server_settings` и могут быть изменены администратором через API или админ-панель.

### Circles (Круги)

| Ключ | Тип | По умолчанию | Описание |
|------|-----|--------------|----------|
| `circles.max_per_user` | integer | 10 | Максимальное количество кругов, которые может создать один пользователь |
| `circles.max_members_default` | integer | 15 | Максимальное количество участников в круге по умолчанию |
| `circles.max_members_limit` | integer | 50 | Абсолютный максимум участников в круге (нельзя создать круг с бОльшим количеством) |
| `circles.allow_member_create` | boolean | true | Могут ли обычные участники создавать свои круги |

### Invites (Приглашения)

| Ключ | Тип | По умолчанию | Описание |
|------|-----|--------------|----------|
| `invites.default_max_uses` | integer | 15 | Максимальное количество использований инвайта по умолчанию |
| `invites.max_uses_limit` | integer | 50 | Абсолютный максимум использований одного инвайта |
| `invites.default_expiry_hours` | integer | 168 (7 дней) | Срок действия инвайта по умолчанию (часы). 0 = без срока |
| `invites.max_active_per_circle` | integer | 5 | Максимальное количество активных инвайтов для одного круга |

### Media (Медиа/Файлы)

| Ключ | Тип | По умолчанию | Описание |
|------|-----|--------------|----------|
| `media.max_upload_size_mb` | integer | 50 | Максимальный размер загружаемого файла (МБ) |
| `media.retention_days` | integer | 30 | Количество дней хранения медиа-файлов. 0 = без ограничения |
| `media.allowed_types` | string | `*` | Разрешённые MIME-типы через запятую. `*` = все |
| `media.max_storage_per_user_mb` | integer | 500 | Максимальный объём медиа на пользователя (МБ) |

### Users (Пользователи)

| Ключ | Тип | По умолчанию | Описание |
|------|-----|--------------|----------|
| `users.max_sessions` | integer | 5 | Максимальное количество одновременных сессий (устройств) |
| `users.display_name_max_length` | integer | 30 | Максимальная длина отображаемого имени |
| `users.display_name_min_length` | integer | 2 | Минимальная длина отображаемого имени |
| `users.allow_display_name_change` | boolean | true | Могут ли пользователи менять своё имя |

### Server (Сервер)

| Ключ | Тип | По умолчанию | Описание |
|------|-----|--------------|----------|
| `server.name` | string | `Linka` | Название инстанса (отображается в UI) |
| `server.description` | string | `""` | Описание инстанса |
| `server.max_users` | integer | 100 | Максимальное общее количество пользователей. 0 = без ограничения |
| `server.registration_open` | boolean | true | Принимает ли сервер новые регистрации по инвайтам |
| `server.maintenance_mode` | boolean | false | Режим обслуживания (только админы могут входить) |

### Notifications (Уведомления)

| Ключ | Тип | По умолчанию | Описание |
|------|-----|--------------|----------|
| `notifications.push_enabled` | boolean | true | Включены ли push-уведомления |
| `notifications.vapid_public_key` | string | `""` | VAPID public key для Web Push |
| `notifications.vapid_private_key` | string | `""` | VAPID private key для Web Push |

### Calls (Звонки)

| Ключ | Тип | По умолчанию | Описание |
|------|-----|--------------|----------|
| `calls.enabled` | boolean | true | Включены ли звонки |
| `calls.max_duration_minutes` | integer | 120 | Максимальная длительность звонка (минуты). 0 = без ограничения |
| `calls.turn_server_url` | string | `""` | URL TURN-сервера |
| `calls.turn_username` | string | `""` | Логин TURN-сервера |
| `calls.turn_password` | string | `""` | Пароль TURN-сервера |

---

## Реализация

### Модель

```ruby
class ServerSetting < ApplicationRecord
  DEFAULTS = {
    'circles.max_per_user' => { value: '10', type: 'integer', description: 'Max circles per user' },
    'circles.max_members_default' => { value: '15', type: 'integer', description: 'Default max members per circle' },
    'circles.max_members_limit' => { value: '50', type: 'integer', description: 'Absolute max members per circle' },
    'circles.allow_member_create' => { value: 'true', type: 'boolean', description: 'Allow members to create circles' },
    # ... etc
  }.freeze

  validates :key, presence: true, uniqueness: true

  def self.get(key)
    setting = find_by(key: key)
    return parse_default(key) unless setting
    parse_value(setting.value, setting.value_type)
  end

  def self.set(key, value)
    setting = find_or_initialize_by(key: key)
    setting.update!(value: value.to_s)
    Rails.cache.delete("server_setting:#{key}")
  end

  def self.load_defaults!
    DEFAULTS.each do |key, config|
      find_or_create_by!(key: key) do |s|
        s.value = config[:value]
        s.value_type = config[:type]
        s.description = config[:description]
      end
    end
  end

  private

  def self.parse_value(value, type)
    case type
    when 'integer' then value.to_i
    when 'boolean' then value == 'true'
    else value
    end
  end
end
```

### API Endpoints

```
GET  /api/v1/settings                  → Публичные настройки (server.name, media limits, etc.)
GET  /api/v1/admin/server_settings     → Все настройки (только admin)
PUT  /api/v1/admin/server_settings     → Обновить настройки (только admin)
```

### Валидация при использовании

```ruby
# CircleService
def create(name:, creator:, max_members: nil)
  max_members ||= ServerSetting.get('circles.max_members_default')
  limit = ServerSetting.get('circles.max_members_limit')

  raise 'Max members exceeds server limit' if max_members > limit

  user_limit = ServerSetting.get('circles.max_per_user')
  raise 'Circle limit reached' if creator.created_circles.count >= user_limit

  unless creator.is_admin? || ServerSetting.get('circles.allow_member_create')
    raise 'Circle creation not allowed'
  end

  # ... proceed with creation
end
```

---

## Environment Variables (.env)

Некоторые настройки задаются через переменные окружения (не через БД), так как нужны при запуске:

```env
# Database
DATABASE_URL=postgres://user:pass@host:5432/linka
REDIS_URL=redis://host:6379/0

# Security
SECRET_KEY_BASE=<generate>
JWT_SECRET=<generate>
JWT_EXPIRY_HOURS=720

# Matrix
MATRIX_HOMESERVER_URL=http://synapse:8008
MATRIX_SERVER_NAME=your-domain.com
SYNAPSE_ADMIN_TOKEN=<from synapse>

# Application
RAILS_ENV=production
RAILS_LOG_LEVEL=info
ALLOWED_ORIGINS=https://your-domain.com

# Admin bootstrap
ADMIN_DISPLAY_NAME=Admin
ADMIN_PASSWORD=<secure password>
```
