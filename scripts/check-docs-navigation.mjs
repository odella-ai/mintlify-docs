// Check active guidance, compatibility references, retired routes, and public-page coverage.
// Run: node scripts/check-docs-navigation.mjs
import assert from "node:assert/strict";
import { readFile, readdir, access } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const config = JSON.parse(await readFile(join(root, "docs.json"), "utf8"));
assert.deepEqual(
  config.navigation.groups.map((group) => group.group),
  ["Start here", "Guides", "Reference"],
);
assert.equal(
  config.navigation.tabs,
  undefined,
  "Do not reintroduce product tabs in the header",
);

function* routes(value, hidden = false) {
  if (Array.isArray(value)) {
    for (const item of value) yield* routes(item, hidden);
  } else if (value && typeof value === "object") {
    assert.equal(value.icon, undefined, "Keep sidebar navigation text-only");
    const isHidden = hidden || value.hidden === true;
    if (value.hidden)
      assert.equal(
        value.searchable,
        true,
        "App-linked references should remain searchable even when absent from the sidebar",
      );
    if (value.root) yield { path: value.root, hidden: isHidden };
    for (const [key, items] of Object.entries(value)) {
      if (key === "pages") {
        for (const page of items) {
          if (typeof page === "string") yield { path: page, hidden: isHidden };
          else yield* routes(page, isHidden);
        }
      } else if (key !== "root") yield* routes(items, isHidden);
    }
  }
}
async function* contentFiles(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (
      entry.name.startsWith(".") ||
      ["node_modules", "snippets"].includes(entry.name)
    )
      continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) yield* contentFiles(path);
    else if (entry.name.endsWith(".mdx"))
      yield relative(root, path).replace(/\.mdx$/, "");
  }
}
const entries = [...routes(config.navigation)];
const listed = entries.map((entry) => entry.path);
assert.equal(
  new Set(listed).size,
  listed.length,
  "A page appears more than once in navigation",
);
const files = new Set();
for await (const path of contentFiles(root)) files.add(path);
for (const path of listed) assert(files.has(path), `Missing page: ${path}`);
for (const path of files)
  assert(
    listed.includes(path),
    `Page needs an explicit active/compatibility decision: ${path}`,
  );
const appReferenceRoutes = JSON.parse(
  await readFile(join(root, "scripts/app-reference-routes.json"), "utf8"),
);
for (const route of appReferenceRoutes) {
  assert(
    entries.some((entry) => "/" + entry.path === route && entry.hidden),
    `App reference must remain directly available, outside the sidebar: ${route}`,
  );
  assert(
    !config.redirects.some((redirect) => redirect.source === route),
    `Do not redirect away app-linked reference: ${route}`,
  );
}
const visible = entries.filter((entry) => !entry.hidden);
for (const { path } of visible) {
  assert(
    !/^(workflow\/|workflow-tutorial\/|block-reference\/|workforce\/workflows$)/.test(
      path,
    ),
    `Workflow material must not dominate the employee path: ${path}`,
  );
}
for (const group of config.navigation.groups[1].pages) {
  assert(
    group.root?.startsWith("guides/"),
    `Guide needs an actionable landing page: ${group.group}`,
  );
  assert.equal(
    group.expanded,
    false,
    `Guide should be collapsed until needed: ${group.group}`,
  );
}
const assignAndReview = config.navigation.groups[1].pages.find(
  (group) => group.root === "guides/assign-and-review-work",
);
assert.deepEqual(
  assignAndReview?.pages.slice(0, 2),
  ["workforce/chat", "workforce/contact-an-employee"],
  "Introduce conversations and everyday channel use before task tracking",
);
assert(
  assignAndReview.pages.indexOf("workforce/tasks") >
    assignAndReview.pages.indexOf("workforce/talk"),
  "Voice conversations should precede the task board",
);
const retired = [
  "workflow-tutorial/01-simple-flow",
  "workflow-tutorial/02-dynamic-prompting",
  "workflow-tutorial/03-matching-conditionals",
  "workflow-tutorial/04-subflows",
  "workflow-tutorial/05-batching",
  "workflow-tutorial/06-loops",
  "workforce/skill-tree",
  "workforce/templates",
];
for (const path of retired) {
  assert(!files.has(path), `Retired page is still published: ${path}`);
  await access(join(root, ".agents/archive", `${path}.mdx`));
  const redirect = config.redirects.find((item) => item.source === `/${path}`);
  assert(redirect, `Retired route needs a useful redirect: ${path}`);
  assert(
    files.has(redirect.destination.slice(1).split("#")[0]),
    `Invalid redirect destination: ${path}`,
  );
}
console.log(
  `Navigation passed: ${visible.length} active pages, ${appReferenceRoutes.length} protected app-linked references, ${entries.length - visible.length - appReferenceRoutes.length} additional hidden references, ${retired.length} retired routes; no missing or duplicate pages.`,
);
