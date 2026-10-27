// Capture synthetic UI illustrations from an already-running webapp Storybook.
// Usage: node scripts/capture-guide-screenshots.mjs /absolute/path/to/webapp/apps/app [http://127.0.0.1:6106]
// Uses that app's Playwright installation; starts no server and uses no credentials.
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = process.argv[2];
if (!appRoot)
  throw new Error(
    "Pass the absolute webapp/apps/app path containing Playwright.",
  );
const baseUrl = new URL(process.argv[3] ?? "http://127.0.0.1:6106");
if (!["127.0.0.1", "localhost", "[::1]"].includes(baseUrl.hostname)) {
  throw new Error(
    "Use a local synthetic Storybook, not a signed-in or production app.",
  );
}
const require = createRequire(join(resolve(appRoot), "package.json"));
const { chromium } = require("playwright");
const out = fileURLToPath(new URL("../images/guides/", import.meta.url));
const shots = [
  {
    file: "task-details",
    id: "workforce-tasks-task-details--waiting-for-input",
    expected: "Waiting",
  },
  {
    file: "approval-review",
    id: "approvals-task-panel--email-send",
    expected: "Approve",
    clip: { x: 312, y: 137, width: 576, height: 576 },
  },
  {
    file: "employee-governance",
    id: "access-control-employee-governance--governance-restricted-editors",
    expected: "Governance",
    clip: { x: 325, y: 0, width: 755, height: 760 },
  },
  {
    file: "signing-store",
    id: "stores-settings-storage--signing-records",
    expected: "Signing records",
  },
  {
    file: "organization-teams",
    id: "access-control-organization--teams-overview",
    expected: "Teams",
    clip: { x: 145, y: 20, width: 910, height: 395 },
  },
  {
    file: "developer-token",
    id: "account-developer--create-token-inline-view",
    expected: "Create personal access token",
    clip: { x: 155, y: 155, width: 790, height: 548 },
  },
];
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  for (const shot of shots) {
    const page = await browser.newPage({
      viewport: { width: 1200, height: 850 },
      deviceScaleFactor: 1,
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    // Stories are mocks. Fail closed if an unexpected network call is attempted.
    await page.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      if (
        url.origin === baseUrl.origin ||
        ["data:", "blob:"].includes(url.protocol)
      )
        return route.continue();
      // Optional provider logos are not needed for these cropped illustrations.
      // Abort them without contacting the external host; reject other traffic.
      if (!(
        url.origin === "https://models.dev" &&
        url.pathname.startsWith("/logos/") &&
        route.request().resourceType() === "image"
      )) {
        errors.push(`Unexpected external request: ${url.origin}`);
      }
      return route.abort();
    });
    try {
      const url = new URL("/iframe.html", baseUrl);
      url.search = new URLSearchParams({
        id: shot.id,
        viewMode: "story",
        globals: "theme:light",
      }).toString();
      await page.goto(url.href, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });
      await page
        .getByText(shot.expected, { exact: false })
        .first()
        .waitFor({ timeout: 60000 });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(1500);
      const text = await page.locator("body").innerText();
      if (
        /Couldn't find story|Failed to fetch dynamically|No Preview/.test(
          text,
        ) ||
        errors.length
      ) {
        throw new Error(
          `${shot.id}: ${errors.join("; ") || text.slice(0, 300)}`,
        );
      }
      await page.screenshot({
        path: join(out, `${shot.file}.png`),
        ...(shot.clip ? { clip: shot.clip } : { fullPage: true }),
        animations: "disabled",
      });
      console.log(`Captured ${shot.file}: ${shot.id}`);
    } finally {
      await page.close();
    }
  }
} finally {
  await browser.close();
}
