import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const transcriptResponse = {
  id: 113,
  sourceUrl: "https://lopngoaingu.com/Dynamic_English_Study/index.php?id=113",
  title: "New Dynamic English Bài 113",
  content: "Where were you born?",
  sections: [
    { type: "heading", level: 3, text: "New Dynamic English Bài 113" },
    { type: "paragraph", text: "Today’s lesson asks: Where were you born?" },
    { type: "paragraph", text: "<script>not executable</script>" }
  ],
  fetchedAt: "2026-10-03T00:00:00.000Z",
  status: "fetched"
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem("e2e-storage-reset") !== "done") {
      localStorage.clear();
      sessionStorage.setItem("e2e-storage-reset", "done");
    }
  });
  await page.goto("/");
  await expect(page.locator("#lesson-title")).not.toHaveText("Loading lessons…");
});

test("loads all lessons, searches, navigates, and persists explicit completion", async ({ page }) => {
  await expect(page.locator("#lesson-list .lesson-link")).toHaveCount(340);

  await page.getByRole("searchbox", { name: "Search lessons by title or number" }).fill("113");
  await expect(page.locator("#lesson-list .lesson-link")).toHaveCount(1);
  await page.getByRole("button", { name: /113 Anh Ngữ Sinh Động Bài 113/ }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Anh Ngữ Sinh Động Bài 113");

  const completeButton = page.locator("#complete-button");
  await completeButton.click();
  await expect(completeButton).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Anh Ngữ Sinh Động Bài 113");
  await expect(completeButton).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#progress-count")).toHaveText("1 / 340");
});

test("loads transcript on demand, renders text safely, and uses the cache", async ({ page }) => {
  let requests = 0;
  await page.route("**/api/transcript?id=113", async route => {
    requests += 1;
    await route.fulfill({ json: transcriptResponse });
  });

  await page.getByRole("searchbox", { name: "Search lessons by title or number" }).fill("113");
  await page.getByRole("button", { name: /113 Anh Ngữ Sinh Động Bài 113/ }).click();
  await expect.poll(() => requests).toBe(0);

  await page.getByRole("button", { name: /Show transcript/ }).click();
  await expect(page.getByRole("heading", { name: "New Dynamic English Bài 113" })).toBeVisible();
  await expect(page.locator("#transcript-content")).toContainText("Where were you born?");
  await expect(page.locator("#transcript-content script")).toHaveCount(0);
  await expect(page.locator("#transcript-content")).toContainText("<script>not executable</script>");
  await expect.poll(() => requests).toBe(1);

  await page.getByRole("button", { name: /Hide transcript/ }).click();
  await page.getByRole("button", { name: /Show transcript/ }).click();
  await expect.poll(() => requests).toBe(1);
});

test("reports transcript failures and retries on user action", async ({ page }) => {
  let requests = 0;
  await page.route("**/api/transcript?id=113", async route => {
    requests += 1;
    if (requests === 1) {
      await route.fulfill({ status: 502, json: { error: "Transcript source is unavailable" } });
      return;
    }
    await route.fulfill({ json: transcriptResponse });
  });

  await page.getByRole("searchbox", { name: "Search lessons by title or number" }).fill("113");
  await page.getByRole("button", { name: /113 Anh Ngữ Sinh Động Bài 113/ }).click();
  await page.getByRole("button", { name: /Show transcript/ }).click();
  await expect(page.locator("#transcript-content")).toContainText("Transcript source is unavailable");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.locator("#transcript-content")).toContainText("Where were you born?");
  expect(requests).toBe(2);
});

test("keeps mobile navigation out of tab order when closed and traps focus when open", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const sidebar = page.locator("#lesson-sidebar");
  await expect(sidebar).toHaveAttribute("inert", "");
  await expect(sidebar).toHaveAttribute("aria-hidden", "true");

  await page.getByRole("button", { name: "Open lessons menu" }).click();
  await expect(sidebar).toHaveAttribute("role", "dialog");
  await expect(sidebar).toHaveAttribute("aria-modal", "true");
  await expect(sidebar).toHaveAttribute("aria-hidden", "false");
  await expect(page.getByRole("searchbox", { name: "Search lessons by title or number" })).toBeFocused();

  await page.locator("#lesson-list .lesson-link").last().focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Dynamic English home" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(sidebar).toHaveAttribute("aria-hidden", "true");
  await expect(page.getByRole("button", { name: "Open lessons menu" })).toBeFocused();
});

test("has no horizontal overflow at mobile, tablet, and desktop widths", async ({ page }) => {
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth
    }));
    expect(dimensions.content, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(dimensions.viewport);
  }
});

test("passes automated WCAG 2.1 A/AA and 2.2 A/AA axe checks", async ({ page }) => {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});