// Run: node scripts/check-docs-assets.mjs [path/to/webapp/apps/app] [path/to/landing]
// Protect existing recordings and optionally compare branding with the web app.
import assert from "node:assert/strict";
import { readFile, readdir, access } from "node:fs/promises";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";

const root = fileURLToPath(new URL("../", import.meta.url));
const config = JSON.parse(await readFile(join(root, "docs.json"), "utf8"));
const references = new Set();

async function scan(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
    const file = join(directory, entry.name);
    if (entry.isDirectory()) await scan(file);
    else if (entry.name.endsWith(".mdx")) {
      const source = await readFile(file, "utf8");
      assert(
        !/^icon:/m.test(source),
        `Keep page navigation text-only: ${file}`,
      );
      for (const [, src] of source.matchAll(
        /\bsrc=["']([^"']+\.(?:mp4|webm|gif))["']/g,
      )) {
        if (/^https?:\/\//.test(src)) continue;
        const asset = src.startsWith("/")
          ? join(root, src.slice(1))
          : resolve(dirname(file), src);
        await access(asset);
        references.add(asset);
      }
    }
  }
}
await scan(root);
const recordings = (await readdir(join(root, "assets/videos"))).filter((file) =>
  /\.(mp4|webm)$/.test(file),
);
for (const file of recordings) {
  assert(
    references.has(join(root, "assets/videos", file)),
    `Recording is no longer discoverable: ${file}`,
  );
}
const quickstart = await readFile(
  join(root, "get-started/quickstart.mdx"),
  "utf8",
);
for (const file of [
  "getstarted.mp4",
  "signin.mp4",
  "overviewmp4.mp4",
  "overviewmp4-dark.mp4",
]) {
  assert(
    quickstart.includes(`/assets/videos/${file}`),
    `Restore the quickstart recording: ${file}`,
  );
}
for (const asset of [config.favicon, config.logo.light, config.logo.dark])
  await access(join(root, asset.slice(1)));

if (process.argv[2]) {
  const app = resolve(process.argv[2], "public");
  for (const [docs, webapp] of [
    [config.favicon, "favicon.svg"],
    ["/favicon.png", "favicon.png"],
    ["/favicon.ico", "favicon.ico"],
    [config.logo.light, "images/logo/logo_grayscale.png"],
    [config.logo.dark, "images/logo/logo_white.png"],
  ]) {
    assert.deepEqual(
      await readFile(join(root, docs.slice(1))),
      await readFile(join(app, webapp)),
      `Branding differs from web app: ${docs}`,
    );
  }
  console.log(
    "Branding passed: favicon and both wordmarks match the web app byte-for-byte.",
  );
}
const landingAssets = [
  [
    "images/landing/odella-demo-poster.jpg",
    "public/videos/odella-demo-poster.jpg",
  ],
  ["images/landing/employee-workspace.webp", "public/odella_mockup_lp.webp"],
  ["images/landing/channels.webp", "public/omnichannel.webp"],
];
for (const [file] of landingAssets) await access(join(root, file));
const welcome = await readFile(join(root, "introduction.mdx"), "utf8");
assert(
  welcome.includes("https://www.odella.ai/videos/odella-demo.mp4"),
  "Use the actual landing-page product demo on Welcome",
);
assert(
  welcome.includes("/images/landing/odella-demo-poster.jpg"),
  "Use the original landing-page demo poster",
);
assert(
  !welcome.includes("/assets/videos/WorkforceAgent"),
  "Do not substitute the older app screen capture for the landing demo",
);
async function sha256(file) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest("hex");
}
if (process.argv[3]) {
  for (const [docs, landing] of landingAssets) {
    assert.equal(
      await sha256(join(root, docs)),
      await sha256(resolve(process.argv[3], landing)),
      `Asset differs from landing: ${docs}`,
    );
  }
  const demoConfig = await readFile(
    resolve(process.argv[3], "src/data/demo-video.ts"),
    "utf8",
  );
  const demoPath = /src:\s*['"]([^'"]+)['"]/.exec(demoConfig)?.[1];
  assert.equal(
    demoPath,
    "/videos/odella-demo.mp4",
    "Update the docs if the landing-page demo source changes",
  );
  console.log(
    "Landing assets passed: poster, hero mockup and channel illustration match byte-for-byte; hosted demo matches the landing source.",
  );
}
console.log(
  `Media passed: all ${recordings.length} recordings remain referenced; quickstart clips restored; local media files exist.`,
);
