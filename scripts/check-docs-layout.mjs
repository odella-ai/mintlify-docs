// Uses the sibling app's existing Playwright installation and a local docs preview.
// node scripts/check-docs-layout.mjs /absolute/path/to/webapp/apps/app [http://localhost:3334]
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import { readFile } from "node:fs/promises";

const appRoot = process.argv[2];
assert(appRoot, "Pass the webapp/apps/app path containing Playwright");
const baseUrl = new URL(process.argv[3] ?? "http://localhost:3334");
assert(
  ["localhost", "127.0.0.1", "[::1]"].includes(baseUrl.hostname),
  "Use a local docs preview, not a customer session",
);
const require = createRequire(join(resolve(appRoot), "package.json"));
const { chromium } = require("playwright");
const browser = await chromium.launch({
  headless: true,
  ...(process.env.DOCS_BROWSER_CHANNEL
    ? { channel: process.env.DOCS_BROWSER_CHANNEL }
    : {}),
});
const pages = [
  "/introduction",
  "/get-started/how-odella-works",
  "/get-started/quickstart",
  "/guides/onboard-an-employee",
  "/guides/assign-and-review-work",
  "/guides/connect-tools-and-channels",
  "/guides/automate-recurring-work",
  "/guides/documents-and-knowledge",
  "/guides/access-and-security",
  "/guides/manage-your-account",
  "/platform/secure-employee-tutorial",
  "/workforce/settings-overview",
  "/workforce/overview",
  "/templates/04_using-templates",
];
try {
  for (const width of [1440, 1024, 390]) {
    const context = await browser.newContext({
      viewport: { width, height: 950 },
    });
    try {
      for (const route of pages) {
        const page = await context.newPage();
        try {
          const response = await page.goto(new URL(route, baseUrl).href, {
            waitUntil: "domcontentloaded",
          });
          assert(response?.ok(), `${route}: unsuccessful response`);
          await page.getByRole("heading", { level: 1 }).first().waitFor();
          await page.evaluate(() => document.fonts.ready);
          assert.equal(
            await page.evaluate(
              () => document.documentElement.scrollWidth > innerWidth + 1,
            ),
            false,
            `${route} overflows at ${width}px`,
          );
          if (route === "/introduction") {
            assert(await page.locator("#header").isVisible(), "Welcome uses the normal docs header");
            assert.equal(await page.locator("#page-title").innerText(), "Welcome to Odella");
            assert.equal(await page.locator('.docs-welcome a[href="/get-started/quickstart"], .docs-welcome a[href="/get-started/how-odella-works"]').count(), 2);
            assert.equal(await page.locator(".docs-hero-grid, .docs-hero-visual").count(), 0, "Do not restore a landing-page hero");
            assert.equal(await page.locator(".docs-welcome img").count(), 0, "Keep promotional artwork off the docs welcome page");
            const preview = page.locator(".docs-product-preview video:visible");
            assert.equal(
              await preview.count(),
              1,
              "The welcome page needs the product walkthrough",
            );
            assert(
              await preview.getAttribute("poster"),
              "The walkthrough needs the landing-page poster before playback",
            );
            const poster = await page.request.get(
              new URL(await preview.getAttribute("poster"), baseUrl).href,
            );
            assert(poster.ok(), "Walkthrough poster must load");
            assert.equal(
              await preview.getAttribute("src"),
              "https://www.odella.ai/videos/odella-demo.mp4",
            );
            assert.equal(
              await preview.getAttribute("poster"),
              "/images/landing/odella-demo-poster.jpg",
            );
            assert.equal(
              await preview.evaluate((video) => video.muted),
              false,
              "Do not mute the narrated landing-page demo",
            );
            assert.equal(
              await preview.evaluate((video) => video.autoplay),
              false,
            );
            assert.equal(await preview.getAttribute("preload"), "none");
            assert.equal(
              await page.getByRole("heading", { level: 1 }).count(),
              1,
              "Welcome must use one native documentation H1",
            );
            if (width >= 1024) {
              assert((await preview.boundingBox()).y < 950, "The video should not be buried below a marketing hero");
            }
            await page
              .getByRole("button", {
                name: "Play the Odella product walkthrough",
                exact: true,
              })
              .waitFor({ state: "visible" });
            await page.goto(new URL("/introduction#walkthrough", baseUrl).href);
            await page.waitForFunction(() => scrollY > 100);
            assert.equal(new URL(page.url()).hash, "#walkthrough");
            await page.evaluate(() => window.scrollTo(0, 0));
            const sidebar = await page.locator("#sidebar-content").innerText();
            assert(
              !/workflow|blocks/i.test(sidebar),
              "App-linked workflow reference must stay out of the normal sidebar",
            );
            assert.equal(
              await page.locator(".docs-welcome a a").count(),
              0,
              "Cards must not contain nested links",
            );
            await page.locator('.docs-welcome a[href="/get-started/quickstart"]').click();
            await page.waitForURL("**/get-started/quickstart");
          }
        } finally {
          await page.close();
        }
      }
    } finally {
      await context.close();
    }
    console.log(`Layout passed: ${pages.length} pages at ${width}px.`);
  }

  const appReferences = JSON.parse(
    await readFile(
      new URL("./app-reference-routes.json", import.meta.url),
      "utf8",
    ),
  );
  const referencePage = await browser.newPage();
  try {
    for (const route of appReferences) {
      const response = await referencePage.request.get(
        new URL(route, baseUrl).href,
      );
      assert.equal(
        response.status(),
        200,
        `App-linked reference must remain available: ${route}`,
      );
      assert.equal(
        new URL(response.url()).pathname,
        route,
        `Do not redirect an app-linked reference: ${route}`,
      );
    }
    console.log(
      `App links passed: all ${appReferences.length} workflow reference routes return 200 at their original URLs.`,
    );
  } finally {
    await referencePage.close();
  }

  const demo = await browser.newPage({
    viewport: { width: 1440, height: 950 },
  });
  try {
    const requests = [];
    demo.on("request", (request) => {
      if (new URL(request.url()).pathname.endsWith("/odella-demo.mp4"))
        requests.push(request.url());
    });
    await demo.goto(new URL("/introduction", baseUrl).href, {
      waitUntil: "domcontentloaded",
    });
    const play = demo.getByRole("button", {
      name: "Play the Odella product walkthrough",
      exact: true,
    });
    await play.waitFor({ state: "visible" });
    assert.equal(
      requests.length,
      0,
      "Do not download the full demo before the user presses play",
    );
    await play.press("Enter");
    await demo.waitForFunction(
      () => {
        const video = document.querySelector(".docs-product-preview video");
        return (
          video &&
          video.readyState >= 1 &&
          video.duration > 379 &&
          !video.paused
        );
      },
      null,
      { timeout: 45000 },
    );
    assert.equal(
      await demo.locator("video").evaluate((video) => video.controls),
      true,
    );
    assert.equal(
      await demo.locator("video").evaluate((video) => video.muted),
      false,
    );
    await demo.locator("video").evaluate((video) => video.pause());
    console.log(
      "Demo playback passed: keyboard activation starts the original narrated video; no video fetch before play.",
    );
  } finally {
    await demo.close();
  }

  const fallbackContext = await browser.newContext({
    javaScriptEnabled: false,
  });
  try {
    const fallback = await fallbackContext.newPage();
    await fallback.goto(new URL("/introduction", baseUrl).href, {
      waitUntil: "domcontentloaded",
    });
    assert.equal(
      await fallback
        .locator(".docs-product-preview video")
        .evaluate((video) => video.controls),
      true,
    );
    assert.equal(
      await fallback.locator("[data-docs-demo-play]").isVisible(),
      false,
    );
    console.log(
      "No-JavaScript fallback passed: native video controls remain available.",
    );
  } finally {
    await fallbackContext.close();
  }

  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  try {
    await page.goto(new URL("/introduction", baseUrl).href, {
      waitUntil: "domcontentloaded",
    });
    await page.getByRole("button", { name: /^Navigation/ }).click();
    await page
      .getByRole("button", { name: "Onboard an AI Employee", exact: true })
      .filter({ visible: true })
      .click();
    await page.waitForURL("**/guides/onboard-an-employee");
    console.log("Mobile navigation passed: guide opens from the drawer.");
  } finally {
    await page.close();
  }

  const retired = await browser.newPage();
  try {
    await retired.goto(
      new URL("/workflow-tutorial/01-simple-flow", baseUrl).href,
      { waitUntil: "domcontentloaded" },
    );
    await retired.waitForURL("**/guides/automate-recurring-work");
    console.log(
      "Retired workflow tutorial redirects to employee scheduling guidance.",
    );
  } finally {
    await retired.close();
  }

  const dark = await browser.newPage({
    viewport: { width: 1440, height: 950 },
  });
  try {
    await dark.goto(new URL("/introduction", baseUrl).href, {
      waitUntil: "domcontentloaded",
    });
    await dark
      .getByRole("button", { name: "Switch to dark theme", exact: true })
      .click();
    assert.match(await dark.locator("html").getAttribute("class"), /dark/);
    assert.equal(
      await dark.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      ),
      false,
    );
    assert.equal(
      await dark.locator(".docs-product-preview video:visible").count(),
      1,
    );
    assert.equal(
      await dark
        .locator(".docs-product-preview video:visible")
        .getAttribute("poster"),
      "/images/landing/odella-demo-poster.jpg",
    );
    console.log("Dark theme and original landing-page demo passed.");
  } finally {
    await dark.close();
  }
} finally {
  await browser.close();
}
