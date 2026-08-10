# CLAUDE.md — baln-web

> 이 파일은 Claude Code가 이 레포지토리에서 작업할 때 적용되는 규칙입니다.
> 전역 규칙 (`~/CLAUDE.md`)과 함께 적용됩니다.

---

## 프로젝트 개요

**baln** — 금융 앱 랜딩페이지 + 이벤트/대기자 수집 인프라

| 레이어 | 기술 |
|--------|------|
| 프론트엔드 | 정적 HTML/CSS/JS (프레임워크 없음) |
| 백엔드 | Supabase Edge Functions (Deno TypeScript) |
| 배포 | Vercel (정적 페이지) + Supabase (Edge Functions) |
| CI | GitHub Actions → `scripts/validate-repo.sh` |

### Edge Functions

| 함수 | 역할 |
|------|------|
| `landing-events` | 랜딩 페이지 이벤트 수집 (`landing_events` 테이블) |
| `waitlist-signup` | 대기자 명단 등록 (`waitlist_signups` 테이블) |

---

## 절대 규칙

1. **main 직접 푸시 금지** — 반드시 `codex/<task-name>` 브랜치 사용
2. **EAS 빌드 금지** — `eas build` 명령 사용 안 함
3. **git push 전 확인** — 사용자 승인 후에만 push
4. **시크릿 하드코딩 금지** — `SUPABASE_SERVICE_ROLE_KEY` 등 절대 코드에 포함하지 않음
5. **확인 묻지 않기** — "할까요?", "진행할까요?" 금지. 바로 실행

---

## 커밋 메시지 형식 (Conventional Commits)

```
feat:     새 기능
fix:      버그 수정
chore:    빌드/도구 변경 (코드 영향 없음)
docs:     문서만 변경
refactor: 기능 변경 없는 코드 개선
```

커밋 단위: 논리적 변경 하나. 여러 파일이어도 하나의 변경 이면 하나의 커밋.

---

## 빌드 & 검증

### 코드 검증 (Edge Functions)

```bash
./scripts/validate-repo.sh
```

- Deno fmt, lint, type-check 수행
- CI에서 자동 실행 (`ci.yml`)
- Deno 미설치 시 경고만 출력하고 통과 (CI에서 전체 실행)

### Edge Function 배포

```bash
supabase functions deploy landing-events --no-verify-jwt
supabase functions deploy waitlist-signup --no-verify-jwt
```

배포 전 반드시 확인:
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` 설정 여부
- `ALLOWED_ORIGINS` 값 (`https://baln.app` 포함)

---

## 하네스 (Tier 3 미니멀)

> 어떤 AI가 실행해도 같은 검증 결과가 나오도록 만드는 멱등성 구조.

### 구조

```
.harness/
├── README.md                      # 하네스 개요 및 사용법
├── evaluate.sh                    # 전체 평가 실행 스크립트
├── playwright/
│   ├── playwright.config.ts       # Playwright 설정
│   ├── landing.spec.ts            # 랜딩 페이지 E2E
│   └── edge-functions.spec.ts     # Edge Function HTTP 테스트
└── logs/                          # 평가 결과 로그 (git 추적 안 함)
    └── .gitkeep
```

### 실행 방법

| 목적 | 명령 |
|------|------|
| 코드 검증 (린트/타입) | `./scripts/validate-repo.sh` |
| E2E 평가 전체 | `./.harness/evaluate.sh` |
| 랜딩 페이지만 | `npx playwright test .harness/playwright/landing.spec.ts` |
| Edge Function만 | `npx playwright test .harness/playwright/edge-functions.spec.ts` |

### 자체평가 한계 (알고 있어야 할 것)

- Edge Function 테스트는 **실제 Supabase DB에 연결하지 않음** (HTTP 응답 코드만 검증)
- 실제 DB insert 확인은 Supabase 대시보드 직접 확인 필요
- 성능 회귀 감지 없음 (Lighthouse CI 미설치)
- 평가 로그는 로컬 파일 기반 (`.harness/logs/`) — 중앙 집계 없음

---

## 거버넌스 문서 연계

| 문서 | 내용 |
|------|------|
| `docs/ops/GIT_GOVERNANCE.md` | 브랜치/커밋/PR 정책 |
| `docs/ops/RELEASE_CHECKLIST.md` | 릴리즈 전/후 체크리스트 |
| `docs/ops/MASTER_PLAN.md` | 전체 운영 로드맵 |
| `docs/ops/SUPABASE_GOVERNANCE.md` | DB 마이그레이션, 함수 배포 절차 |

릴리즈 전 반드시 `docs/ops/RELEASE_CHECKLIST.md` 완주.

---

## 환경변수 규칙

- `.env`, `.env.local` 파일은 `.gitignore` 포함 — 절대 커밋 안 함
- 신규 환경변수 추가 시 `baln-config.example.js`도 업데이트
- Supabase 시크릿 변경 시 Edge Function 재배포 필수

---

## 주요 페이지 구조

```
/              → index.html (메인 랜딩)
/career/       → career/index.html (커리어 AI)
/test/         → test/index.html (투자 성향 테스트)
/kkeullim/     → kkeullim/index.html
/admin/        → admin/ (내부 관리)
/en/, /ja/     → 다국어 페이지
```

---

## 하네스 단순화 원칙

1. **Generator 변경 없음** — 기존 CI (`ci.yml`) 그대로 사용
2. **Evaluator = Playwright** — 랜딩 + Edge Function HTTP 레벨 검증
3. **파일 기반 로그** — `.harness/logs/YYYY-MM-DD.log` 로 저장
4. **외부 의존성 최소화** — 추가 서비스 없이 `npx playwright` 만으로 실행
5. **점진적 확장** — 테스트 통과 후 Lighthouse CI 등 추가 가능
