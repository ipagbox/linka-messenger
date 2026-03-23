# Linka Messenger

Self-hosted приватный мессенджер по приглашениям на базе [Matrix](https://matrix.org/). PWA-first.

## Возможности

- Сквозное шифрование (E2EE) из коробки
- Круги (Circles) — приватные группы на основе Matrix Spaces
- Система приглашений — регистрация только по инвайту
- PWA — работает как приложение на телефоне и десктопе
- Видео/аудио звонки через TURN-сервер
- Полностью self-hosted — ваши данные остаются на вашем сервере

## Быстрая установка на VPS

Требования: чистый VPS с **Debian** или **Ubuntu**, домен, направленный на IP сервера.

```bash
curl -sSL https://raw.githubusercontent.com/ipagbox/linka-messenger/main/install.sh | sudo bash
```

Скрипт задаст три вопроса:

1. **Домен** — например, `msg.example.com`
2. **Email** — для SSL-сертификата Let's Encrypt
3. **Пароль администратора**

Всё остальное (Docker, базы данных, SSL, секреты) установится и настроится автоматически.

После установки откройте `https://ваш-домен` в браузере.

## Управление

```bash
cd /opt/linka

# Логи
docker compose -f docker-compose.production.yml logs -f

# Перезапуск
docker compose -f docker-compose.production.yml restart

# Остановка
docker compose -f docker-compose.production.yml down

# Обновление
git pull origin main
docker compose -f docker-compose.production.yml up -d --build
```

## Разработка

### Frontend

```bash
cd frontend
npm install
npm run dev       # Dev server (port 5173)
npm test          # Vitest
npm run build     # Production build
npm run lint      # ESLint
```

### Backend

```bash
cd backend
bundle install
rails s              # Dev server (port 3000)
bundle exec rspec    # Тесты
bundle exec rubocop  # Lint
```

### Всё через Docker

```bash
docker compose up -d          # Запуск dev-окружения
docker compose logs -f        # Логи
docker compose down           # Остановка
```

## Стек

| Компонент | Технология |
|-----------|-----------|
| Frontend | React, TypeScript, Vite, Zustand, matrix-js-sdk |
| Backend | Ruby on Rails (API mode), PostgreSQL |
| Messaging | Matrix Synapse |
| Infrastructure | Docker Compose, Nginx, Let's Encrypt, coturn |
| E2E тесты | Playwright |

## Лицензия

MIT
