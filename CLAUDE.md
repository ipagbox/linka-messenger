# Linka Messenger — Инструкции для Claude Code

## Проект

Linka — self-hosted приватный мессенджер по приглашениям на базе Matrix. PWA-first.

## Структура репозитория

```
/
├── frontend/          # React + TypeScript + Vite (PWA)
├── backend/           # Ruby on Rails API (control plane)
├── infrastructure/    # Docker, Nginx, Synapse configs
├── e2e/               # Playwright E2E тесты
├── scripts/           # Утилиты (verify-stage.sh и др.)
├── docs/              # Документация проекта
│   ├── ARCHITECTURE.md
│   ├── ROADMAP.md
│   ├── CODING_PLAN.md
│   ├── TESTING_STRATEGY.md
│   └── SERVER_CONFIG.md
└── CLAUDE.md          # Этот файл
```

## Ключевые команды

### Frontend
```bash
cd frontend
npm install            # Установка зависимостей
npm run dev            # Dev server (port 5173)
npm test               # Vitest (watch)
npm test -- --run      # Vitest (single run)
npx tsc --noEmit       # TypeScript check
npm run build          # Production build
npm run lint           # ESLint
```

### Backend
```bash
cd backend
bundle install         # Установка зависимостей
rails s                # Dev server (port 3000)
bundle exec rspec      # Все тесты
bundle exec rubocop    # Lint
rails db:migrate       # Миграции
rails db:seed          # Seed данные
```

### Infrastructure
```bash
docker compose up -d             # Запуск всех сервисов
docker compose logs -f synapse   # Логи Synapse
docker compose down              # Остановка
```

### E2E
```bash
npx playwright test              # Все E2E тесты
npx playwright test --ui         # С UI
```

## Правила разработки

1. **Тесты обязательны**: каждый новый файл с логикой должен иметь тест
2. **TypeScript strict**: никаких `any`, все типы явные
3. **Нет кастомной криптографии**: только matrix-js-sdk E2EE
4. **Mobile-first**: все UI компоненты сначала для мобильного экрана
5. **Минимализм UI**: тёмная тема, flat design, без анимаций (кроме transitions)
6. **API versioning**: все эндпоинты под `/api/v1/`
7. **Conventional commits**: `feat:`, `fix:`, `test:`, `chore:`
8. **Без лишних зависимостей**: не добавлять пакеты без крайней необходимости

## Стек технологий

- **Frontend**: React 18, TypeScript, Vite, Zustand, matrix-js-sdk, React Router, Vitest
- **Backend**: Ruby 3.2+, Rails 7.1+ (API mode), PostgreSQL, RSpec
- **Infrastructure**: Docker Compose, Nginx, Synapse, coturn, Redis
- **E2E**: Playwright

## Проверка работоспособности

После каждого этапа запускай:
```bash
./scripts/verify-stage.sh <номер_этапа>
```

## Архитектурные решения

- Matrix Spaces = Linka Circles
- Synapse Admin API для создания пользователей (регистрация отключена)
- JWT для аутентификации Rails API
- IndexedDB для хранения Matrix crypto store
- Service Worker для PWA + Push + Offline
