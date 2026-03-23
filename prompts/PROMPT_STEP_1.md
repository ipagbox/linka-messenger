# Linka Messenger — Этап 1: Инфраструктура и скелет проекта

## Контекст
Прочитай файлы документации проекта перед началом работы:
- `CLAUDE.md`, `docs/ARCHITECTURE.md`, `docs/ROADMAP.md`, `docs/CODING_PLAN.md`

## Задача
Создай полную инфраструктуру и скелеты проектов frontend и backend.

## Что нужно сделать

### 1. Структура директорий
```bash
mkdir -p frontend backend infrastructure/{nginx,synapse,coturn} scripts e2e .github/workflows
```

### 2. Docker Compose (`docker-compose.yml`)
Сервисы:
- `db-rails`: postgres:15, порт 5432, volume db-rails-data
- `db-synapse`: postgres:15, порт 5433, volume db-synapse-data
- `redis`: redis:7-alpine, порт 6379
- `synapse`: matrixdotorg/synapse:latest, порт 8008, depends_on db-synapse
- `backend`: Rails app, порт 3000, depends_on db-rails + redis
- `frontend`: Vite dev server, порт 5173
- `nginx`: nginx:alpine, порт 80, depends_on всех

Все сервисы в сети `linka-net`.

### 3. Synapse конфигурация
Файл `infrastructure/synapse/homeserver.yaml`:
- server_name из ENV
- registration отключена
- БД: psycopg2 → db-synapse
- media store path: /data/media_store
- Logging config

### 4. Rails проект
```bash
cd backend
rails new . --api --database=postgresql --skip-git --skip-action-mailbox --skip-action-mailer --skip-active-storage --skip-action-cable --skip-javascript --skip-hotwire
```

Gemfile — добавь:
```ruby
gem 'rack-cors'
gem 'jwt'
gem 'httparty'
gem 'bcrypt'

group :development, :test do
  gem 'rspec-rails', '~> 6.0'
  gem 'factory_bot_rails'
  gem 'webmock'
  gem 'simplecov', require: false
end
```

Настрой:
- `config/database.yml` — читает DATABASE_URL из ENV
- `config/initializers/cors.rb` — разрешить фронтенд origin
- RSpec: `rails generate rspec:install`
- Health controller + route + spec

### 5. React проект (frontend/)
```bash
npm create vite@latest . -- --template react-ts
```

Зависимости:
```json
{
  "dependencies": {
    "matrix-js-sdk": "latest",
    "zustand": "latest",
    "react-router-dom": "^6",
    "axios": "latest"
  },
  "devDependencies": {
    "vitest": "latest",
    "@testing-library/react": "latest",
    "@testing-library/jest-dom": "latest",
    "@testing-library/user-event": "latest",
    "jsdom": "latest"
  }
}
```

Настрой:
- `vite.config.ts` с proxy (/api → backend, /_matrix → synapse)
- `vitest.config.ts` (jsdom environment)
- `src/test/setup.ts` (import @testing-library/jest-dom)
- Базовый App.tsx + тест

### 6. Nginx
Файл `infrastructure/nginx/default.conf`:
- `/` → frontend:5173
- `/api` → backend:3000
- `/_matrix` → synapse:8008
- `/_synapse` → synapse:8008
- WebSocket support для frontend HMR и Matrix sync

### 7. Скрипты
Файл `scripts/verify-stage.sh` — смотри TESTING_STRATEGY.md

### 8. CI
Файл `.github/workflows/ci.yml`:
- Job `backend-test`: Ruby setup, bundle install, rspec
- Job `frontend-test`: Node setup, npm ci, npm test -- --run
- Job `lint`: ESLint + RuboCop

### 9. Файлы окружения
- `.env.example` с описанием всех переменных
- `.gitignore` (node_modules, .env, tmp, log, coverage)

## Definition of Done
- [ ] `docker compose config` не выдаёт ошибок
- [ ] Rails: `bundle exec rspec` проходит (health spec)
- [ ] Frontend: `npm test -- --run` проходит (App render test)
- [ ] Frontend: `npx tsc --noEmit` без ошибок
- [ ] Frontend: `npm run build` успешен
- [ ] `.env.example` содержит все нужные переменные
- [ ] `scripts/verify-stage.sh` существует и исполняемый

## Коммит
```
feat: stage 1 - infrastructure and project skeleton
```
