# .harness — baln-web Tier 3 미니멀 하네스

> **목표**: 어떤 AI가 실행해도 같은 검증 결과가 나오는 멱등성 있는 평가 구조.
>
> Anthropic "Harness Design for Long-Running Apps" Tier 3 패턴 적용.

---

## 구성 요소

```
.harness/
├── README.md                       ← 지금 이 파일
├── evaluate.sh                     ← 전체 평가 실행 진입점
├── playwright/
│   ├── playwright.config.ts        ← Playwright 설정
│   ├── landing.spec.ts             ← 랜딩 페이지 스모크 테스트
│   └── edge-functions.spec.ts      ← Edge Function HTTP 레벨 테스트
└── logs/
    └── .gitkeep                    ← 로그 디렉토리 (결과물은 git 제외)
```

---

## Tier 3 선택 이유

| Tier | 특징 | 적용 여부 |
|------|------|-----------|
| Tier 1 | 단순 스크립트 lint/format | 기존 `validate-repo.sh` |
| **Tier 2** | **E2E 브라우저 + HTTP 테스트** | **이 하네스** |
| Tier 3+ | ML 평가, 시맨틱 diff, 자동 회귀 탐지 | 미적용 (규모 초과) |

> baln-web은 정적 사이트 + 2개 Edge Function 구조로, Playwright 기반 Tier 2가 최적.

---

## 빠른 시작

### 1. 의존성 설치

```bash
cd .harness/playwright
npm install
npx playwright install chromium
```

### 2. 전체 평가 실행

```bash
./.harness/evaluate.sh
```

로그는 `.harness/logs/YYYY-MM-DD_HH-MM-SS.log` 에 저장됩니다.

### 3. 개별 테스트 실행

```bash
# 랜딩 페이지만
npx playwright test .harness/playwright/landing.spec.ts --reporter=line

# Edge Function HTTP 테스트만
npx playwright test .harness/playwright/edge-functions.spec.ts --reporter=line
```

---

## Generator (코드 생성 검증)

기존 CI 파이프라인을 그대로 사용합니다. 변경 없음.

```
PR 생성 → GitHub Actions (ci.yml) → validate-repo.sh
                                   → deno fmt --check
                                   → deno lint
                                   → deno check (타입 검사)
```

---

## Evaluator (동작 검증)

Playwright가 두 가지를 검증합니다:

### 랜딩 페이지 (`landing.spec.ts`)

| 검증 항목 | 방법 |
|-----------|------|
| 페이지 로딩 성공 | `page.goto` + 200 확인 |
| 핵심 요소 렌더링 | CSS 셀렉터 존재 확인 |
| CTA 버튼 클릭 가능 | `click()` 동작 확인 |
| 콘솔 에러 없음 | `page.on('console')` 감시 |

### Edge Functions (`edge-functions.spec.ts`)

| 검증 항목 | 방법 |
|-----------|------|
| OPTIONS preflight → 200 | CORS 사전 요청 확인 |
| 유효한 payload → 200 ok:true | 정상 경로 |
| 빈 payload → 400 | 유효성 검사 확인 |
| 허용되지 않는 이벤트 → 400 | allowedEvents 필터 확인 |
| 잘못된 이메일 → 400 | 이메일 정규식 확인 |

> **참고**: Edge Function 테스트는 프로덕션 URL(`https://baln.app`)을 대상으로 합니다.
> 실제 DB insert는 하지 않으며, HTTP 응답 코드와 응답 구조만 검증합니다.

---

## 자체평가 한계

이 하네스가 **검증하지 못하는 것**:

1. **실제 DB 저장** — `landing_events`, `waitlist_signups` 테이블 insert 확인 불가
   - 대안: Supabase 대시보드 Table Editor 직접 확인
2. **이메일 중복 처리 (`duplicate: true`)** — 사전 데이터가 필요해 자동화 어려움
3. **성능 회귀** — Lighthouse CI 미설치, Core Web Vitals 미추적
4. **CORS 실제 브라우저 교차 출처** — 동일 출처로 테스트, preflight만 확인
5. **Supabase 장애 감지** — 외부 모니터링 없음 (Supabase 상태 페이지 수동 확인)

---

## 로그 형식

```
logs/
└── 2026-03-26_14-30-00.log    ← ISO 날짜_시간 형식
```

로그 파일은 `.gitignore`에 포함 (`logs/*`, `!logs/.gitkeep`).

---

## 확장 로드맵 (선택적)

현재 Tier 2에서 필요 시 확장 가능한 항목:

- [ ] **Lighthouse CI** — Core Web Vitals 임계값 설정
- [ ] **axe-core** — 접근성 자동 검사
- [ ] **실제 DB 검증** — Supabase client로 insert 확인 (별도 테스트 Supabase 프로젝트 필요)
- [ ] **Slack 알림** — evaluate.sh 실패 시 알림 전송
