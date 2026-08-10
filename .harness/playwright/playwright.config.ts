import { defineConfig, devices } from "@playwright/test";

/**
 * baln-web 하네스 Playwright 설정
 *
 * 기본 대상: 프로덕션 (https://baln.app)
 * 로컬 테스트: BASE_URL 환경변수로 덮어쓰기
 *   BASE_URL=http://localhost:8080 npx playwright test
 */
export default defineConfig({
  testDir: ".",
  timeout: 30_000,
  retries: 1, // 네트워크 불안정 대비 1회 재시도
  reporter: [["line"], ["html", { open: "never", outputFolder: "../logs/html-report" }]],

  use: {
    baseURL: process.env["BASE_URL"] ?? "https://baln.app",
    // Edge Function 기본 URL (Supabase)
    extraHTTPHeaders: {
      "Content-Type": "application/json",
    },
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
