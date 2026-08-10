#!/usr/bin/env bash
# .harness/evaluate.sh — baln-web 전체 평가 실행 스크립트
#
# 사용법:
#   ./.harness/evaluate.sh              # 전체 평가
#   ./.harness/evaluate.sh landing      # 랜딩 페이지만
#   ./.harness/evaluate.sh edge         # Edge Function만
#   ./.harness/evaluate.sh validate     # 코드 검증만 (validate-repo.sh)
#
# 결과: .harness/logs/YYYY-MM-DD_HH-MM-SS.log

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HARNESS_DIR="$ROOT_DIR/.harness"
LOG_DIR="$HARNESS_DIR/logs"
PLAYWRIGHT_DIR="$HARNESS_DIR/playwright"
TIMESTAMP="$(date '+%Y-%m-%d_%H-%M-%S')"
LOG_FILE="$LOG_DIR/${TIMESTAMP}.log"

# 색상
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 로그 + 출력 동시에
log() {
  echo -e "$1" | tee -a "$LOG_FILE"
}

log_section() {
  log ""
  log "${BLUE}══════════════════════════════════════${NC}"
  log "${BLUE}  $1${NC}"
  log "${BLUE}══════════════════════════════════════${NC}"
}

PASS=0
FAIL=0
SKIP=0

step_pass() { log "${GREEN}  ✓ $1${NC}"; ((PASS++)) || true; }
step_fail() { log "${RED}  ✗ $1${NC}"; ((FAIL++)) || true; }
step_skip() { log "${YELLOW}  ○ $1 (건너뜀)${NC}"; ((SKIP++)) || true; }

MODE="${1:-all}"

# ─────────────────────────────────────────
# 로그 디렉토리 생성
# ─────────────────────────────────────────
mkdir -p "$LOG_DIR"

log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "  baln-web 하네스 평가"
log "  시작: $TIMESTAMP"
log "  모드: $MODE"
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ─────────────────────────────────────────
# STEP 1: 코드 검증 (Generator 출력 검증)
# ─────────────────────────────────────────
if [[ "$MODE" == "all" || "$MODE" == "validate" ]]; then
  log_section "STEP 1: 코드 검증 (validate-repo.sh)"

  if bash "$ROOT_DIR/scripts/validate-repo.sh" >> "$LOG_FILE" 2>&1; then
    step_pass "코드 검증 통과"
  else
    step_fail "코드 검증 실패 — 로그 확인: $LOG_FILE"
    if [[ "$MODE" == "validate" ]]; then
      exit 1
    fi
  fi
fi

# ─────────────────────────────────────────
# STEP 2: Playwright 의존성 확인
# ─────────────────────────────────────────
if [[ "$MODE" == "all" || "$MODE" == "landing" || "$MODE" == "edge" ]]; then
  log_section "STEP 2: Playwright 환경 확인"

  if ! command -v npx >/dev/null 2>&1; then
    step_skip "npx 없음 — Node.js 설치 필요"
    log "${YELLOW}  설치: https://nodejs.org${NC}"
    PLAYWRIGHT_AVAILABLE=false
  else
    # playwright.config.ts 기준으로 package.json 확인
    if [[ ! -f "$PLAYWRIGHT_DIR/package.json" ]]; then
      log "  package.json 없음 → 의존성 설치 중..."
      (cd "$PLAYWRIGHT_DIR" && npm install) >> "$LOG_FILE" 2>&1 || true
    fi

    if (cd "$PLAYWRIGHT_DIR" && npx playwright --version) >> "$LOG_FILE" 2>&1; then
      PW_VERSION=$(cd "$PLAYWRIGHT_DIR" && npx playwright --version 2>/dev/null | head -1)
      step_pass "Playwright 사용 가능 ($PW_VERSION)"
      PLAYWRIGHT_AVAILABLE=true
    else
      step_skip "Playwright 미설치 — 브라우저 테스트 건너뜀"
      log "${YELLOW}  설치: cd .harness/playwright && npm install && npx playwright install chromium${NC}"
      PLAYWRIGHT_AVAILABLE=false
    fi
  fi
fi

# ─────────────────────────────────────────
# STEP 3: 랜딩 페이지 E2E
# ─────────────────────────────────────────
if [[ "$MODE" == "all" || "$MODE" == "landing" ]]; then
  log_section "STEP 3: 랜딩 페이지 E2E (Playwright)"

  if [[ "${PLAYWRIGHT_AVAILABLE:-false}" == "true" ]]; then
    if (cd "$PLAYWRIGHT_DIR" && \
        npx playwright test landing.spec.ts \
          --reporter=line \
          --timeout=30000) >> "$LOG_FILE" 2>&1; then
      step_pass "랜딩 페이지 E2E 통과"
    else
      step_fail "랜딩 페이지 E2E 실패 — 로그 확인: $LOG_FILE"
    fi
  else
    step_skip "Playwright 없음 — 랜딩 테스트 건너뜀"
  fi
fi

# ─────────────────────────────────────────
# STEP 4: Edge Function HTTP 테스트
# ─────────────────────────────────────────
if [[ "$MODE" == "all" || "$MODE" == "edge" ]]; then
  log_section "STEP 4: Edge Function HTTP 테스트"

  if [[ "${PLAYWRIGHT_AVAILABLE:-false}" == "true" ]]; then
    if (cd "$PLAYWRIGHT_DIR" && \
        npx playwright test edge-functions.spec.ts \
          --reporter=line \
          --timeout=30000) >> "$LOG_FILE" 2>&1; then
      step_pass "Edge Function HTTP 테스트 통과"
    else
      step_fail "Edge Function HTTP 테스트 실패 — 로그 확인: $LOG_FILE"
    fi
  else
    step_skip "Playwright 없음 — Edge Function 테스트 건너뜀"
  fi
fi

# ─────────────────────────────────────────
# 최종 요약
# ─────────────────────────────────────────
log ""
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "  평가 완료: $(date '+%Y-%m-%d %H:%M:%S')"
log "  통과: ${GREEN}${PASS}${NC}  실패: ${RED}${FAIL}${NC}  건너뜀: ${YELLOW}${SKIP}${NC}"
log "  로그: $LOG_FILE"
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [[ "$FAIL" -gt 0 ]]; then
  exit 1
fi

exit 0
