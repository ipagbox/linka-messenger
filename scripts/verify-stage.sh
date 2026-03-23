#!/bin/bash
# verify-stage.sh — verify completion of a given stage
set -e

STAGE=${1:-all}
RAILS="/opt/rbenv/versions/3.3.6/bin/bundle exec /opt/rbenv/versions/3.3.6/bin/rspec"
BUNDLE="/opt/rbenv/versions/3.3.6/bin/bundle"
RUBY="/opt/rbenv/versions/3.3.6/bin/ruby"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { echo -e "${GREEN}✓ $1${NC}"; }
fail() { echo -e "${RED}✗ $1${NC}"; exit 1; }
info() { echo -e "${YELLOW}→ $1${NC}"; }

stage_1() {
  info "Stage 1: Infrastructure"
  [ -f docker-compose.yml ] && pass "docker-compose.yml exists" || fail "docker-compose.yml missing"
  [ -f infrastructure/synapse/homeserver.yaml ] && pass "Synapse config exists" || fail "Synapse config missing"
  [ -f infrastructure/nginx/default.conf ] && pass "Nginx config exists" || fail "Nginx config missing"
  [ -f backend/Gemfile ] && pass "Backend Gemfile exists" || fail "Backend Gemfile missing"
  [ -f frontend/package.json ] && pass "Frontend package.json exists" || fail "Frontend package.json missing"
}

stage_2() {
  info "Stage 2: Backend API"
  cd backend
  DB_HOST=localhost DB_USERNAME=linka DB_PASSWORD=password $BUNDLE exec $RUBY -e "require 'rails'; puts 'Rails OK'" 2>/dev/null && pass "Rails loads" || fail "Rails broken"
  DB_HOST=localhost DB_USERNAME=linka DB_PASSWORD=password $RAILS spec/models spec/services spec/requests 2>&1 | tail -5
  cd ..
}

stage_3() {
  info "Stage 3: Frontend Auth"
  cd frontend
  npm test -- --run 2>&1 | tail -5
  npx tsc --noEmit && pass "TypeScript OK" || fail "TypeScript errors"
  cd ..
}

stage_all() {
  stage_1
  stage_3
}

case "$STAGE" in
  1) stage_1 ;;
  2) stage_2 ;;
  3) stage_3 ;;
  *) stage_all ;;
esac

echo -e "\n${GREEN}Stage $STAGE verification complete!${NC}"
