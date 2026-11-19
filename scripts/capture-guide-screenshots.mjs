// Capture synthetic UI illustrations from an already-running webapp Storybook.
// Usage: node scripts/capture-guide-screenshots.mjs /absolute/path/to/webapp/apps/app [http://127.0.0.1:6106] [shot-name ...]
// Optional: DOCS_BROWSER_CHANNEL=chrome. Tutorial shots customize local mock data only.
// Uses that app's Playwright installation; starts no server and uses no credentials.
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { applySupportTutorialFixture } from "./guide-tutorial-fixture.mjs";

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
const selectedShots = new Set(process.argv.slice(4));
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
    file: "organization-team-create",
    id: "access-control-organization--team-create",
    expected: "Create Team",
    prepare: async (page) => {
      await page
        .getByLabel("Name", { exact: true })
        .fill("Customer operations");
      await page
        .getByLabel("Description", { exact: true })
        .fill("Customer support and service reviews");
    },
  },
  {
    file: "organization-role-create",
    id: "access-control-organization--role-create-team",
    expected: "Where should this role apply?",
  },
  {
    file: "organization-role-capabilities",
    id: "access-control-organization--role-create-team",
    expected: "Where should this role apply?",
    prepare: async (page) => {
      await page.getByRole("button", { name: "Continue", exact: true }).click();
      await page.getByLabel("Name", { exact: true }).fill("Support colleague");
      await page
        .getByLabel("Description", { exact: true })
        .fill(
          "View, chat with, and request work from Customer operations employees",
        );
      await page.getByRole("button", { name: "Continue", exact: true }).click();
      await page
        .getByRole("navigation", { name: "Capability categories" })
        .getByRole("button", { name: /^Employee / })
        .click();
      await page.getByPlaceholder("Search capabilities").fill("employee");
      for (const name of [
        "View employee",
        "Chat with employee",
        "Request work",
      ]) {
        await page.locator(`[role="checkbox"][aria-label="${name}"]`).click();
      }
    },
  },
  {
    file: "organization-team-details",
    id: "access-control-organization--team-details",
    expected: "Customer operations",
    tutorialFixture: true,
  },
  {
    file: "organization-team-member-roles",
    id: "access-control-organization--team-details",
    expected: "Customer operations",
    tutorialFixture: true,
    prepare: async (page) => {
      await page.getByRole("button", { name: "Manage", exact: true }).click();
      await page
        .getByRole("heading", { name: "Manage members", exact: true })
        .waitFor();
      await page
        .getByRole("combobox", {
          name: "Casey Nguyen role in Customer operations",
        })
        .click();
      await page
        .getByRole("option", { name: "Support colleague", exact: true })
        .click();
    },
  },
  {
    file: "secure-worker-governance",
    id: "access-control-employee-governance--governance-restricted-editors",
    expected: "Governance",
    tutorialFixture: true,
    clip: { x: 325, y: 0, width: 755, height: 760 },
    prepare: async (page) => {
      await page.getByText("Support colleague", { exact: true }).waitFor();
      await page
        .getByRole("button", { name: "Remove Casey Nguyen", exact: true })
        .click();
      await page
        .getByText("No additional editors yet.", { exact: false })
        .waitFor();
    },
  },
  {
    file: "developer-token",
    id: "account-developer--create-token-inline-view",
    expected: "Create personal access token",
    clip: { x: 155, y: 155, width: 790, height: 548 },
  },
];
for (const name of selectedShots) {
  if (!shots.some((shot) => shot.file === name))
    throw new Error(`Unknown shot: ${name}`);
}
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.DOCS_BROWSER_CHANNEL
    ? { channel: process.env.DOCS_BROWSER_CHANNEL }
    : {}),
});
try {
  for (const shot of shots) {
    if (selectedShots.size && !selectedShots.has(shot.file)) continue;
    const page = await browser.newPage({
      viewport: { width: 1200, height: 850 },
      deviceScaleFactor: 1,
    });
    const errors = [];
    let fixtureApplied = false;
    page.on("pageerror", (error) => errors.push(error.message));
    // Stories are mocks. Fail closed if an unexpected network call is attempted.
    await page.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      if (url.origin === baseUrl.origin) {
        if (shot.tutorialFixture && url.pathname.endsWith(".js")) {
          const response = await route.fetch();
          const source = await response.text();
          const customized = applySupportTutorialFixture(source);
          if (customized !== null) fixtureApplied = true;
          return route.fulfill({ response, body: customized ?? source });
        }
        return route.continue();
      }
      if (["data:", "blob:"].includes(url.protocol)) return route.continue();
      // Optional provider logos are not needed for these cropped illustrations.
      // Abort them without contacting the external host; reject other traffic.
      if (
        !(
          url.origin === "https://models.dev" &&
          url.pathname.startsWith("/logos/") &&
          route.request().resourceType() === "image"
        )
      ) {
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
      if (shot.tutorialFixture && !fixtureApplied) {
        throw new Error(
          "Expected local Support colleague fixture was not found",
        );
      }
      if (shot.prepare) await shot.prepare(page);
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
