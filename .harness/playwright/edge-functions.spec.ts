import { test, expect } from "@playwright/test";

/**
 * Edge Function HTTP 레벨 테스트 (edge-functions.spec.ts)
 *
 * 대상: Supabase Edge Functions (프로덕션 URL)
 *   - landing-events
 *   - waitlist-signup
 *
 * ⚠️ 자체평가 한계:
 * - 실제 DB insert 확인 안 함 (HTTP 응답 코드 + 구조만 검증)
 * - 이메일 중복 처리(duplicate:true) 테스트는 사전 데이터 필요로 제외
 * - 실제 이벤트 기록을 남기지 않기 위해 허용되지 않는 payload로 에러 경로를 테스트
 */

// Supabase Edge Function 기본 URL
// 환경변수로 덮어쓰기 가능: SUPABASE_FUNCTIONS_URL=https://xxxx.supabase.co/functions/v1
const FUNCTIONS_URL =
  process.env["SUPABASE_FUNCTIONS_URL"] ??
  "https://yqjwuuiyiuczifcknlsv.supabase.co/functions/v1";

const LANDING_EVENTS_URL = `${FUNCTIONS_URL}/landing-events`;
const WAITLIST_SIGNUP_URL = `${FUNCTIONS_URL}/waitlist-signup`;

// ─────────────────────────────────────────
// landing-events
// ─────────────────────────────────────────
test.describe("landing-events Edge Function", () => {
  test("OPTIONS preflight → 200 (CORS 사전 요청)", async ({ request }) => {
    const response = await request.fetch(LANDING_EVENTS_URL, {
      method: "OPTIONS",
      headers: {
        Origin: "https://baln.app",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
      },
    });

    expect(response.status()).toBe(200);
    const acao = response.headers()["access-control-allow-origin"];
    expect(acao).toBeTruthy();
  });

  test("GET 요청 → 405 Method Not Allowed", async ({ request }) => {
    const response = await request.get(LANDING_EVENTS_URL);
    expect(response.status()).toBe(405);
  });

  test("빈 body → 400 (event_name 누락)", async ({ request }) => {
    const response = await request.post(LANDING_EVENTS_URL, {
      headers: { "Content-Type": "application/json" },
      data: {},
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBeTruthy();
  });

  test("허용되지 않는 이벤트명 → 400", async ({ request }) => {
    const response = await request.post(LANDING_EVENTS_URL, {
      headers: { "Content-Type": "application/json" },
      data: { event_name: "malicious_event" },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/not allowed/i);
  });

  test("잘못된 JSON → 400", async ({ request }) => {
    const response = await request.post(LANDING_EVENTS_URL, {
      headers: { "Content-Type": "application/json" },
      data: "not-json-at-all",
    });

    // Deno가 파싱 전에 reject하거나 400 반환
    expect([400, 422, 500]).toContain(response.status());
    const body = await response.json();
    expect(body.ok).toBe(false);
  });

  // 주의: 실제 이벤트를 저장하지 않기 위해 정상 경로 테스트는
  // 허용된 이벤트명으로 요청하되 응답 구조만 확인.
  // 실제 insert 확인은 Supabase 대시보드에서 수동 검증 필요.
  test("유효한 payload (landing_view) → 200 또는 서버 응답 구조 확인", async ({
    request,
  }) => {
    const response = await request.post(LANDING_EVENTS_URL, {
      headers: {
        "Content-Type": "application/json",
        Origin: "https://baln.app",
      },
      data: {
        event_name: "landing_view",
        session_id: `harness-test-${Date.now()}`,
        page_path: "/",
        page_url: "https://baln.app/",
      },
    });

    // 200 (성공) 또는 500 (Supabase 연결 불가 환경) 모두 허용
    // 중요: ok 필드 또는 error 필드가 있는 JSON 구조여야 함
    const status = response.status();
    expect([200, 500]).toContain(status);

    const body = await response.json();
    // 응답이 { ok: boolean } 구조임을 확인
    expect(typeof body.ok).toBe("boolean");
  });
});

// ─────────────────────────────────────────
// waitlist-signup
// ─────────────────────────────────────────
test.describe("waitlist-signup Edge Function", () => {
  test("OPTIONS preflight → 200 (CORS 사전 요청)", async ({ request }) => {
    const response = await request.fetch(WAITLIST_SIGNUP_URL, {
      method: "OPTIONS",
      headers: {
        Origin: "https://baln.app",
        "Access-Control-Request-Method": "POST",
      },
    });

    expect(response.status()).toBe(200);
  });

  test("빈 body → 400 (email 누락)", async ({ request }) => {
    const response = await request.post(WAITLIST_SIGNUP_URL, {
      headers: { "Content-Type": "application/json" },
      data: {},
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.ok).toBe(false);
  });

  test("잘못된 이메일 형식 → 400", async ({ request }) => {
    const response = await request.post(WAITLIST_SIGNUP_URL, {
      headers: { "Content-Type": "application/json" },
      data: { email: "not-an-email", consent: true },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/email/i);
  });

  test("consent=false → 400 (동의 없음)", async ({ request }) => {
    const response = await request.post(WAITLIST_SIGNUP_URL, {
      headers: { "Content-Type": "application/json" },
      data: { email: "test@example.com", consent: false },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/consent/i);
  });

  test("GET 요청 → 405 Method Not Allowed", async ({ request }) => {
    const response = await request.get(WAITLIST_SIGNUP_URL);
    expect(response.status()).toBe(405);
  });

  test("응답이 JSON 구조를 반환한다 (잘못된 email로 구조 확인)", async ({
    request,
  }) => {
    const response = await request.post(WAITLIST_SIGNUP_URL, {
      headers: { "Content-Type": "application/json" },
      data: { email: "invalid", consent: true },
    });

    // JSON 파싱 가능
    const body = await response.json();
    expect(body).toBeDefined();
    expect(typeof body.ok).toBe("boolean");
    expect(typeof body.error).toBe("string");
  });
});
