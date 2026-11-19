// Exhaustive screenshots, not a representative-page smoke test.
// node scripts/capture-docs-audit.mjs /path/to/webapp/apps/app http://localhost:3334 /tmp/odella-docs-visual-audit before
// Add --retry-failures for serial recovery, or --routes=a/b,c/d to refresh changed pages.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const appRoot = process.argv[2];
assert(appRoot, "Pass the app path containing Playwright");
const base = new URL(process.argv[3] ?? "http://localhost:3334");
assert(["localhost", "127.0.0.1", "[::1]"].includes(base.hostname), "Capture a local public docs preview, never a customer session");
const out = resolve(process.argv[4] ?? "/tmp/odella-docs-visual-audit");
const phase = process.argv[5] ?? "before";
assert(/^[a-z0-9-]+$/.test(phase), "Use a simple phase name");
const project = fileURLToPath(new URL("../", import.meta.url));
const config = JSON.parse(await readFile(join(project, "docs.json"), "utf8"));
const routes = [];
function walk(value, hidden = false) {
  if (Array.isArray(value)) return value.forEach((item) => walk(item, hidden));
  if (!value || typeof value !== "object") return;
  const isHidden = hidden || value.hidden === true;
  if (value.root) routes.push({ route: value.root, hidden: isHidden });
  for (const item of value.pages ?? []) {
    if (typeof item === "string") routes.push({ route: item, hidden: isHidden });
    else walk(item, isHidden);
  }
  for (const item of value.groups ?? []) walk(item, isHidden);
}
walk(config.navigation);
assert.equal(new Set(routes.map((item) => item.route)).size, routes.length);
routes.sort((a, b) => a.route.localeCompare(b.route));
await mkdir(join(out, phase), { recursive: true });
const require = createRequire(join(resolve(appRoot), "package.json"));
const { chromium } = require("playwright");
const browser = await chromium.launch({ headless: true, ...(process.env.DOCS_BROWSER_CHANNEL ? { channel: process.env.DOCS_BROWSER_CHANNEL } : {}) });
const retry = process.argv.includes('--retry-failures');
const selected = process.argv.find((arg) => arg.startsWith('--routes='))?.slice(9).split(',');
if (selected) selected.forEach((route) => assert(routes.some((item) => item.route === route), `Unknown route: ${route}`));
const results = retry || selected ? JSON.parse(await readFile(join(out, phase, 'manifest.json'), 'utf8')).filter((row) => !row.failure && row.httpStatus === 200 && !selected?.includes(row.route)) : [];
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: "reduce", colorScheme: "light" });
    let next = 0;
    try {
      await Promise.all(Array.from({ length: retry ? 1 : 3 }, async () => {
        while (next < routes.length) {
          const index = next++;
          const item = routes[index];
          if (selected && !selected.includes(item.route)) continue;
          if (results.some((row) => row.route === item.route && row.width === width)) continue;
          const id = String(index + 1).padStart(3, "0");
          const filename = `${id}-${item.route.replaceAll("/", "--")}-${width}.png`;
          const page = await context.newPage();
          const errors = [];
          page.on("pageerror", (error) => errors.push(error.message));
          const result = { id, ...item, width, file: filename, phase };
          try {
            const response = await page.goto(new URL("/" + item.route, base).href, { waitUntil: "domcontentloaded", timeout: 45000 });
            result.httpStatus = response?.status();
            await page.getByRole("heading", { level: 1 }).first().waitFor({ timeout: 15000 });
            await page.evaluate(() => document.fonts.ready);
            await page.evaluate(async () => {
              document.querySelectorAll("video").forEach((video) => { video.pause(); video.autoplay = false; });
              await Promise.race([
                Promise.all([...document.querySelectorAll("#content img")].map(async (image) => { image.loading = "eager"; try { await image.decode(); } catch {} })),
                new Promise((resolve) => setTimeout(resolve, 6000)),
              ]);
              document.activeElement?.blur();
              document.documentElement.style.scrollBehavior = "auto";
              window.scrollTo({ top: 0, behavior: "instant" });
            });
            await page.waitForTimeout(200);
            const metrics = await page.evaluate(() => {
              const visible = (e) => e.getClientRects().length > 0 && getComputedStyle(e).visibility !== "hidden";
              const rect = (e) => { const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y + scrollY), width: Math.round(r.width), height: Math.round(r.height) }; };
              const content = document.querySelector("#content");
              const header = document.querySelector("#header");
              const h1s = [...document.querySelectorAll("h1")].filter(visible);
              const h2s = [...document.querySelectorAll("#content h2")].filter(visible);
              const paragraphs = [...document.querySelectorAll('#content p, #content [data-as="p"]')].filter(visible);
              return {
                title: h1s[0]?.innerText ?? document.title,
                h1s: h1s.map((e) => e.innerText),
                content: content ? rect(content) : null,
                header: header ? rect(header) : null,
                documentHeight: document.documentElement.scrollHeight,
                overflow: document.documentElement.scrollWidth > innerWidth + 1,
                brokenImages: [...document.querySelectorAll("#content img")].filter((e) => e.complete && !e.naturalWidth).map((e) => e.getAttribute("src")),
                headings: h2s.map((e) => ({ text: e.innerText, ...rect(e) })),
                tables: [...document.querySelectorAll("#content table")].map(rect),
                codeBlocks: [...document.querySelectorAll("#content pre")].map(rect),
                videos: [...document.querySelectorAll("#content video")].map((e) => ({ src: e.getAttribute("src"), ...rect(e) })),
                longParagraphs: paragraphs.filter((e) => e.innerText.length > 700).length,
                firstActionY: [...document.querySelectorAll("#content a[href]")].filter((e) => !e.classList.contains("anchor-link") && !e.getAttribute("href").startsWith("#")).map((e) => rect(e).y).sort((a, b) => a - b)[0] ?? null,
              };
            });
            Object.assign(result, metrics, { errors });
            await page.screenshot({ path: join(out, phase, filename), fullPage: true, animations: "disabled", timeout: 30000 });
            console.log(`${phase} ${width} ${id}/${routes.length} ${item.route} h=${result.documentHeight}${result.overflow ? " OVERFLOW" : ""}${result.brokenImages.length ? " BROKEN IMAGE" : ""}`);
          } catch (error) {
            result.failure = error.message;
            console.error(`FAILED ${width} ${item.route}: ${error.message}`);
          } finally {
            results.push(result);
            await writeFile(join(out, phase, "manifest.json"), JSON.stringify(results.sort((a, b) => a.id.localeCompare(b.id) || b.width - a.width), null, 2));
            await page.close();
          }
        }
      }));
    } finally { await context.close(); }
  }
} finally { await browser.close(); }
const failures = results.filter((row) => row.failure || row.httpStatus !== 200);
console.log(`Captured ${results.length - failures.length}/${routes.length * 2} screenshots across ${routes.length} published pages. Failures: ${failures.length}. Output: ${join(out, phase)}`);
process.exitCode = failures.length ? 1 : 0;
