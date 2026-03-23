#!/usr/bin/env bash
#
# Linka Messenger — установка на чистый VPS (Debian/Ubuntu)
#
# Запуск одной строкой:
#   curl -fsSL https://raw.githubusercontent.com/ipagbox/linka-messenger/main/install.sh -o /tmp/linka-install.sh && sudo bash /tmp/linka-install.sh
#
# Или если уже клонирован репозиторий:
#   sudo bash install.sh
#
set -euo pipefail

# ─── Цвета ───────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

info()  { echo -e "${CYAN}▸${NC} $*"; }
ok()    { echo -e "${GREEN}✓${NC} $*"; }
warn()  { echo -e "${YELLOW}⚠${NC} $*"; }
err()   { echo -e "${RED}✗${NC} $*" >&2; }
fatal() { err "$*"; exit 1; }

header() {
    echo ""
    echo -e "${BOLD}════════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}  $*${NC}"
    echo -e "${BOLD}════════════════════════════════════════════════════${NC}"
    echo ""
}

# ─── Проверка ОС ─────────────────────────────────────────────────────
check_os() {
    if [ "$(id -u)" -ne 0 ]; then
        fatal "Скрипт нужно запускать от root (sudo bash install.sh)"
    fi

    if [ ! -f /etc/os-release ]; then
        fatal "Не удалось определить ОС. Поддерживаются Debian и Ubuntu."
    fi

    . /etc/os-release
    case "$ID" in
        debian|ubuntu) ok "ОС: $PRETTY_NAME" ;;
        *) fatal "Поддерживаются только Debian и Ubuntu. Обнаружена: $ID" ;;
    esac
}

# ─── Установка зависимостей ───────────────────────────────────────────
install_deps() {
    header "Установка зависимостей"

    info "Обновление пакетов..."
    apt-get update -qq

    info "Установка базовых пакетов..."
    apt-get install -y -qq \
        ca-certificates curl gnupg lsb-release git ufw > /dev/null

    ok "Базовые пакеты установлены"
}

# ─── Установка Docker ────────────────────────────────────────────────
install_docker() {
    if command -v docker &> /dev/null; then
        ok "Docker уже установлен: $(docker --version)"
        return
    fi

    header "Установка Docker"

    install -m 0755 -d /etc/apt/keyrings

    . /etc/os-release

    curl -fsSL "https://download.docker.com/linux/$ID/gpg" \
        | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg

    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
       https://download.docker.com/linux/$ID \
       $(lsb_release -cs) stable" \
       > /etc/apt/sources.list.d/docker.list

    apt-get update -qq
    apt-get install -y -qq \
        docker-ce docker-ce-cli containerd.io \
        docker-buildx-plugin docker-compose-plugin > /dev/null

    systemctl enable --now docker

    ok "Docker установлен: $(docker --version)"
}

# ─── Генерация секрета ────────────────────────────────────────────────
gen_secret() {
    openssl rand -hex "$1"
}

# ─── Диалог с пользователем ──────────────────────────────────────────
ask_config() {
    header "Настройка Linka Messenger"

    echo -e "${CYAN}Ответьте на несколько вопросов для настройки.${NC}"
    echo ""

    # Домен
    while true; do
        read -rp "$(echo -e "${BOLD}Домен${NC} (например, messenger.example.com): ")" DOMAIN </dev/tty
        if [[ "$DOMAIN" =~ ^[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$ ]]; then
            break
        fi
        warn "Введите корректный домен (например, msg.example.com)"
    done
    ok "Домен: $DOMAIN"
    echo ""

    # Email для Let's Encrypt
    while true; do
        read -rp "$(echo -e "${BOLD}Email${NC} (для SSL-сертификата Let's Encrypt): ")" EMAIL </dev/tty
        if [[ "$EMAIL" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
            break
        fi
        warn "Введите корректный email"
    done
    ok "Email: $EMAIL"
    echo ""

    # Пароль администратора
    while true; do
        read -rsp "$(echo -e "${BOLD}Пароль администратора${NC} (мин. 8 символов): ")" ADMIN_PASSWORD </dev/tty
        echo ""
        if [ ${#ADMIN_PASSWORD} -ge 8 ]; then
            read -rsp "$(echo -e "Повторите пароль: ")" ADMIN_PASSWORD_CONFIRM </dev/tty
            echo ""
            if [ "$ADMIN_PASSWORD" = "$ADMIN_PASSWORD_CONFIRM" ]; then
                break
            fi
            warn "Пароли не совпадают"
        else
            warn "Пароль слишком короткий (минимум 8 символов)"
        fi
    done
    ok "Пароль администратора задан"
    echo ""

    # Подтверждение
    echo -e "${BOLD}Итого:${NC}"
    echo -e "  Домен:  ${GREEN}$DOMAIN${NC}"
    echo -e "  Email:  ${GREEN}$EMAIL${NC}"
    echo ""
    read -rp "$(echo -e "${BOLD}Всё верно? (y/n):${NC} ")" CONFIRM </dev/tty
    if [[ ! "$CONFIRM" =~ ^[yYдДтТ]$ ]]; then
        info "Установка отменена."
        exit 0
    fi
}

# ─── Клонирование репозитория ─────────────────────────────────────────
clone_repo() {
    INSTALL_DIR="/opt/linka"

    if [ -d "$INSTALL_DIR" ] && [ -f "$INSTALL_DIR/docker-compose.production.yml" ]; then
        ok "Linka уже установлена в $INSTALL_DIR"
        cd "$INSTALL_DIR"
        info "Обновление до последней версии..."
        git pull --ff-only origin main || warn "Не удалось обновить, используется текущая версия"
        return
    fi

    # Если скрипт запущен из клонированного репо
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    if [ -f "$SCRIPT_DIR/docker-compose.production.yml" ]; then
        INSTALL_DIR="$SCRIPT_DIR"
        ok "Используется локальная копия: $INSTALL_DIR"
        cd "$INSTALL_DIR"
        return
    fi

    header "Клонирование репозитория"
    git clone https://github.com/ipagbox/linka-messenger.git "$INSTALL_DIR"
    cd "$INSTALL_DIR"
    ok "Репозиторий клонирован в $INSTALL_DIR"
}

# ─── Генерация конфигов ──────────────────────────────────────────────
generate_configs() {
    header "Генерация конфигурации"

    # Генерация секретов
    RAILS_DB_PASSWORD=$(gen_secret 16)
    SYNAPSE_DB_PASSWORD=$(gen_secret 16)
    SECRET_KEY_BASE=$(gen_secret 32)
    JWT_SECRET=$(gen_secret 32)
    SYNAPSE_SHARED_SECRET=$(gen_secret 32)
    SYNAPSE_MACAROON_SECRET=$(gen_secret 32)
    SYNAPSE_FORM_SECRET=$(gen_secret 32)
    TURN_SECRET=$(gen_secret 32)

    ok "Секреты сгенерированы"

    # .env
    cat > .env <<ENVFILE
# Linka Messenger — production config
# Сгенерировано $(date -Iseconds)

DOMAIN=${DOMAIN}

# Database
RAILS_DB_PASSWORD=${RAILS_DB_PASSWORD}
SYNAPSE_DB_PASSWORD=${SYNAPSE_DB_PASSWORD}

# Rails
SECRET_KEY_BASE=${SECRET_KEY_BASE}
JWT_SECRET=${JWT_SECRET}

# Matrix / Synapse
SYNAPSE_SHARED_SECRET=${SYNAPSE_SHARED_SECRET}

# Admin
ADMIN_PASSWORD=${ADMIN_PASSWORD}

# TURN
TURN_SECRET=${TURN_SECRET}
ENVFILE
    chmod 600 .env
    ok ".env создан"

    # Synapse production config
    cat > infrastructure/synapse/homeserver.production.yaml <<SYNAPSE
server_name: "${DOMAIN}"
pid_file: /data/homeserver.pid

listeners:
  - port: 8008
    tls: false
    type: http
    x_forwarded: true
    resources:
      - names: [client, federation]
        compress: false

database:
  name: psycopg2
  args:
    host: db-synapse
    database: synapse
    user: synapse
    password: "${SYNAPSE_DB_PASSWORD}"
    cp_min: 5
    cp_max: 10

log_config: "/config/log.config"

media_store_path: /data/media_store

registration_shared_secret: "${SYNAPSE_SHARED_SECRET}"

report_stats: false

macaroon_secret_key: "${SYNAPSE_MACAROON_SECRET}"

form_secret: "${SYNAPSE_FORM_SECRET}"

signing_key_path: "/data/homeserver.signing.key"

trusted_key_servers:
  - server_name: "matrix.org"

enable_registration: false
enable_registration_without_verification: false

allow_guest_access: false

media_retention:
  local_media_lifetime: 30d

rc_message:
  per_second: 0.2
  burst_count: 10

rc_registration:
  per_second: 0.17
  burst_count: 3

rc_login:
  address:
    per_second: 0.17
    burst_count: 3
  account:
    per_second: 0.17
    burst_count: 3
  failed_attempts:
    per_second: 0.17
    burst_count: 3

encryption_enabled_by_default_for_room_type: all

push:
  include_content: false

turn_uris:
  - "turn:${DOMAIN}:3478?transport=udp"
  - "turn:${DOMAIN}:3478?transport=tcp"
turn_shared_secret: "${TURN_SECRET}"
turn_user_lifetime: 86400000

suppress_key_server_warning: true
SYNAPSE
    ok "Synapse конфиг создан"

    # Nginx — подставляем домен
    sed "s/DOMAIN_PLACEHOLDER/${DOMAIN}/g" \
        infrastructure/nginx/production.conf \
        > infrastructure/nginx/production.active.conf
    cp infrastructure/nginx/production.active.conf infrastructure/nginx/production.conf.bak

    ok "Nginx конфиг создан"
}

# ─── Настройка файрвола ──────────────────────────────────────────────
setup_firewall() {
    header "Настройка файрвола"

    ufw allow 22/tcp   > /dev/null 2>&1 || true
    ufw allow 80/tcp   > /dev/null 2>&1 || true
    ufw allow 443/tcp  > /dev/null 2>&1 || true
    ufw allow 3478/udp > /dev/null 2>&1 || true

    if ! ufw status | grep -q "Status: active"; then
        echo "y" | ufw enable > /dev/null 2>&1 || true
    fi

    ok "Файрвол настроен (SSH, HTTP, HTTPS, TURN)"
}

# ─── Получение SSL сертификата ────────────────────────────────────────
obtain_ssl() {
    header "Получение SSL-сертификата"

    # Первый запуск nginx без SSL для ACME challenge
    # Временный конфиг только для HTTP
    cat > infrastructure/nginx/production.active.conf <<TMPNGINX
server {
    listen 80;
    server_name ${DOMAIN};

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'Linka is being installed...';
        add_header Content-Type text/plain;
    }
}
TMPNGINX

    # Временно подменяем конфиг nginx для получения сертификата
    ORIG_NGINX_CONF="infrastructure/nginx/production.conf"
    cp "$ORIG_NGINX_CONF" "${ORIG_NGINX_CONF}.full"
    cp infrastructure/nginx/production.active.conf "$ORIG_NGINX_CONF"

    info "Запуск nginx для проверки домена..."
    docker compose -f docker-compose.production.yml up -d nginx
    sleep 3

    info "Запрос сертификата у Let's Encrypt..."
    docker compose -f docker-compose.production.yml run --rm certbot \
        certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        -d "$DOMAIN"

    if [ $? -ne 0 ]; then
        # Восстанавливаем
        cp "${ORIG_NGINX_CONF}.full" "$ORIG_NGINX_CONF"
        docker compose -f docker-compose.production.yml down
        fatal "Не удалось получить SSL-сертификат. Убедитесь, что домен $DOMAIN указывает на этот сервер."
    fi

    # Восстанавливаем полный nginx конфиг с SSL
    cp "${ORIG_NGINX_CONF}.full" "$ORIG_NGINX_CONF"
    rm -f "${ORIG_NGINX_CONF}.full" infrastructure/nginx/production.active.conf infrastructure/nginx/production.conf.bak

    docker compose -f docker-compose.production.yml down

    ok "SSL-сертификат получен"
}

# ─── Подставляем домен в nginx конфиг ─────────────────────────────────
finalize_nginx() {
    sed -i "s/DOMAIN_PLACEHOLDER/${DOMAIN}/g" infrastructure/nginx/production.conf
}

# ─── Запуск ──────────────────────────────────────────────────────────
start_services() {
    header "Запуск Linka Messenger"

    info "Сборка образов (это может занять несколько минут)..."
    docker compose -f docker-compose.production.yml build --quiet

    info "Запуск сервисов..."
    docker compose -f docker-compose.production.yml up -d

    ok "Все сервисы запущены"
}

# ─── Ожидание готовности ──────────────────────────────────────────────
wait_for_ready() {
    header "Проверка работоспособности"

    info "Ожидание запуска сервисов..."

    # Ждём backend health
    for i in $(seq 1 30); do
        if docker compose -f docker-compose.production.yml exec -T backend \
            curl -sf http://localhost:3000/health > /dev/null 2>&1; then
            ok "Backend готов"
            break
        fi
        if [ "$i" -eq 30 ]; then
            warn "Backend ещё запускается. Проверьте позже: docker compose -f docker-compose.production.yml logs backend"
        fi
        sleep 2
    done

    # Ждём synapse
    for i in $(seq 1 30); do
        if docker compose -f docker-compose.production.yml exec -T synapse \
            curl -sf http://localhost:8008/_matrix/client/versions > /dev/null 2>&1; then
            ok "Matrix Synapse готов"
            break
        fi
        if [ "$i" -eq 30 ]; then
            warn "Synapse ещё запускается. Проверьте позже: docker compose -f docker-compose.production.yml logs synapse"
        fi
        sleep 2
    done

    # Entrypoint ждёт Synapse и выполняет db:prepare + db:seed автоматически.
    # Проверяем, что admin создан.
    info "Проверка создания администратора..."
    for i in $(seq 1 15); do
        ADMIN_CHECK=$(docker compose -f docker-compose.production.yml exec -T backend \
            bundle exec rails runner "puts User.find_by(matrix_user_id: '@admin:${DOMAIN}')&.matrix_user_id || 'NOT_FOUND'" 2>/dev/null || echo "NOT_READY")
        if echo "$ADMIN_CHECK" | grep -q "@admin:"; then
            ok "Администратор создан: @admin:${DOMAIN}"
            break
        fi
        if [ "$i" -eq 15 ]; then
            warn "Админ ещё не создан. Перезапустите backend: docker compose -f docker-compose.production.yml restart backend"
        fi
        sleep 4
    done
}

# ─── Итоговая информация ─────────────────────────────────────────────
show_result() {
    header "Установка завершена!"

    echo -e "${GREEN}${BOLD}Linka Messenger успешно установлен!${NC}"
    echo ""
    echo -e "  ${BOLD}URL:${NC}             https://${DOMAIN}"
    echo -e "  ${BOLD}Matrix User ID:${NC}  @admin:${DOMAIN}"
    echo -e "  ${BOLD}Пароль:${NC}          (тот, что вы указали при установке)"
    echo -e "  ${BOLD}Установка:${NC}       ${INSTALL_DIR}"
    echo ""
    echo -e "${CYAN}Полезные команды:${NC}"
    echo -e "  cd ${INSTALL_DIR}"
    echo -e "  docker compose -f docker-compose.production.yml logs -f    # Логи"
    echo -e "  docker compose -f docker-compose.production.yml restart    # Перезапуск"
    echo -e "  docker compose -f docker-compose.production.yml down       # Остановка"
    echo ""
    echo -e "${YELLOW}Откройте https://${DOMAIN} и войдите как @admin:${DOMAIN}${NC}"
    echo ""
}

# ─── Main ────────────────────────────────────────────────────────────
main() {
    header "Linka Messenger — Установка"

    check_os
    ask_config
    install_deps
    install_docker
    clone_repo
    generate_configs
    finalize_nginx
    setup_firewall
    obtain_ssl
    start_services
    wait_for_ready
    show_result
}

main "$@"
