import { test, expect, type Page } from "@playwright/test";

/**
 * 랜딩 페이지 스모크 테스트 (landing.spec.ts)
 *
 * 대상: https://baln.app (BASE_URL 환경변수로 덮어쓰기 가능)
 * 목적: 배포 후 핵심 UI 요소 정상 동작 확인
 *
 * ⚠️ 자체평가 한계:
 * - Supabase DB insert 확인 안 함 (HTTP 요청 발생 여부만 관찰)
 * - 성능 지표 미측정
 */

// 콘솔 에러 수집 헬퍼
function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(msg.text());
    }
  });
  return errors;
}

test.describe("랜딩 페이지 스모크", () => {
  test("페이지가 정상적으로 로딩된다", async ({ page }) => {
    const errors = collectConsoleErrors(page);

    const response = await page.goto("/", { waitUntil: "domcontentloaded" });

    expect(response?.status()).toBe(200);

    // 기본 HTML 구조
    await expect(page).toHaveTitle(/baln/i);

    // 콘솔 에러 없음 (심각한 에러만 필터링)
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes("favicon") && // favicon 404 무시
        !e.includes("analytics") && // 분석 스크립트 오류 무시
        !e.includes("gtag") // Google Analytics 무시
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test("body에 콘텐츠가 렌더링된다 (빈 페이지 아님)", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const bodyText = await page.evaluate(
      () => document.body.innerText.trim().length
    );
    expect(bodyText).toBeGreaterThan(0);
  });

  test("baln 브랜드 요소가 존재한다", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    // 페이지 내 baln 텍스트 존재 확인
    const hasBaln = await page.evaluate(() =>
      document.body.innerText.toLowerCase().includes("baln")
    );
    expect(hasBaln).toBe(true);
  });

  test("CTA 버튼이 존재하고 클릭 가능하다", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    // 일반적인 CTA 패턴 탐색
    const ctaSelectors = [
      "button",
      "a[href*='waitlist']",
      "a[href*='signup']",
      "[class*='cta']",
      "[class*='btn']",
    ];

    let ctaFound = false;
    for (const selector of ctaSelectors) {
      const el = page.locator(selector).first();
      if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
        ctaFound = true;
        // 클릭 가능한지 확인 (실제 클릭은 대기자 명단 등록을 방지하기 위해 생략)
        await expect(el).toBeEnabled();
        break;
      }
    }

    expect(ctaFound, "CTA 요소를 찾지 못했습니다").toBe(true);
  });

  test("og:image 메타 태그가 존재한다", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const ogImage = await page
      .locator('meta[property="og:image"]')
      .getAttribute("content");
    expect(ogImage).toBeTruthy();
    expect(ogImage).toContain("baln.app");
  });

  test("모바일 뷰포트에서 정상 렌더링된다", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone 14
    await page.goto("/", { waitUntil: "domcontentloaded" });

    // 가로 스크롤 없음 확인
    const hasHorizontalScroll = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(hasHorizontalScroll).toBe(false);
  });
});

test.describe("주요 서브페이지 접근성", () => {
  const pages = [
    { path: "/test/", description: "투자 성향 테스트" },
    { path: "/privacy.html", description: "개인정보처리방침" },
    { path: "/terms.html", description: "이용약관" },
  ];

  for (const { path, description } of pages) {
    test(`${description} 페이지가 200 반환한다`, async ({ page }) => {
      const response = await page.goto(path, {
        waitUntil: "domcontentloaded",
      });
      expect(
        response?.status(),
        `${description} (${path}) 페이지 접근 실패`
      ).toBe(200);
    });
  }
});
