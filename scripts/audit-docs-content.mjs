// Generate the editorial decision register from navigation and the reversible archive.
// node scripts/audit-docs-content.mjs > .agents/reviews/content-audit.md
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
const config = JSON.parse(await readFile(join(root, "docs.json"), "utf8"));
const rows = [];
function collect(value, hidden = false, section = "") {
  if (Array.isArray(value))
    return value.forEach((item) => collect(item, hidden, section));
  if (!value || typeof value !== "object") return;
  const isHidden = hidden || value.hidden === true;
  const area = value.group ?? section;
  if (value.root)
    rows.push({ path: value.root, hidden: isHidden, section: area });
  for (const item of value.pages ?? []) {
    if (typeof item === "string")
      rows.push({ path: item, hidden: isHidden, section: area });
    else collect(item, isHidden, area);
  }
  for (const group of value.groups ?? []) collect(group, isHidden, area);
}
collect(config.navigation);
async function archive(directory, prefix = "") {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = prefix + entry.name;
    if (entry.isDirectory())
      await archive(join(directory, entry.name), relative + "/");
    else if (entry.name.endsWith(".mdx"))
      rows.push({
        path: relative.slice(0, -4),
        retired: true,
        file: join(directory, entry.name),
      });
  }
}
await archive(join(root, ".agents/archive"));
for (const row of rows) {
  const text = await readFile(
    row.file ?? join(root, row.path + ".mdx"),
    "utf8",
  );
  row.title = /^title:\s*["']?(.+?)["']?$/m.exec(text)?.[1] ?? row.path;
  row.words = text.split(/\s+/).length;
  row.stub =
    row.hidden && text.includes("## Block metadata") && row.words < 140;
  if (row.retired) {
    row.decision = row.path.startsWith("workflow-tutorial/")
      ? "Retire"
      : "Merge and retire";
    row.reason = row.path.startsWith("workflow-tutorial/")
      ? "Removed from publishing; old URL redirects to employee scheduling. Draft preserved privately."
      : row.path === "workforce/templates"
        ? "Consolidated assignment/use instructions into templates/04_using-templates. Old URL redirects."
        : "Consolidated assigned-resource explanation into workforce/employee-page. Old URL redirects.";
  } else if (row.hidden) {
    row.decision = "Keep: app-linked reference";
    row.reason = row.stub
      ? "Compact block metadata used as in-product help. Keep the URL and search access; omit from the sidebar."
      : "Relevant workflow reference linked from the web app. Keep the URL, content, media and search access; omit from the sidebar.";
  } else if (
    [
      "introduction",
      "workforce/overview",
      "guides/automate-recurring-work",
    ].includes(row.path)
  ) {
    row.decision = "Rewrite: employee-first";
    row.reason =
      row.path === "introduction"
        ? "Landing-page hero asset, original narrated product demo and poster, clear employee setup path; no workflow navigation."
        : row.path === "workforce/overview"
          ? "Creation instructions and recordings first; optional interface tour collapsed."
          : "Schedules and events for employees, not a visual-builder course.";
  } else if (row.path === "templates/04_using-templates") {
    row.decision = "Keep: merged guide";
    row.reason =
      "One guide for assigning templates, requesting drafts and reviewing output; removed builder walkthrough.";
  } else {
    row.decision =
      row.section === "Employee reference" ||
      row.section === "Developer connections"
        ? "Keep as reference"
        : "Keep";
    row.reason = row.path.startsWith("guides/")
      ? "Actionable starting path with links to the specific controls."
      : row.path.startsWith("workforce/")
        ? "Specific employee setup, communication, task, oversight or field-reference need."
        : row.path.startsWith("platform/")
          ? "Account, access, credential, security or billing responsibility; not a prerequisite for every beginner."
          : row.path.startsWith("documents/") ||
              row.path.startsWith("templates/")
            ? "Distinct knowledge, drafting or signing task; keep separate from credential Vault and working files."
            : row.path.startsWith("integrations/")
              ? "Connection setup or technical client reference; permissions and ownership differ from worker assignment."
              : row.path.startsWith("get-started/")
                ? "Beginner mental model, first task or common support question."
                : "Existing hiring path through the Marketplace.";
  }
}
const active = rows.filter((row) => !row.retired && !row.hidden);
const appReferences = rows.filter((row) => row.hidden);
const retired = rows.filter((row) => row.retired);
const stubs = rows.filter((row) => row.stub);
const lines = [
  "# Employee-first content audit and cull register",
  "",
  "## Decision",
  "",
  `The previous inventory contained ${rows.length} pages. The normal employee-focused experience now has **${active.length} active pages**. **${retired.length} pages were retired** (${retired.filter((row) => row.path.startsWith("workflow-tutorial/")).length} workflow tutorials and two redundant resource explainers). **${appReferences.length} app-linked workflow references** remain relevant and accessible by direct URL and search. Their groups are hidden only from navigation; they are not retired or deprecated.`,
  "",
  "This is an editorial and information-architecture audit, not proof that every documented behavior is production-verified. Hiding a sidebar group is not the same as deleting or deprecating its reference pages. Retired drafts are preserved under .agents/archive outside public navigation.",
  "",
  "## What is actually needed",
  "",
  "1. Create or hire an employee; define the job and instructions.",
  "2. Add knowledge, skills and the minimum necessary tools.",
  "3. Assign a task, answer questions, review approvals and inspect the result.",
  "4. Schedule a proven task or respond to an event when repetition is needed.",
  "5. Manage access, accountability, connections and spend.",
  "6. Use document, signing, settings and developer reference only when the job requires it.",
  "",
  "Pages are not kept just to mirror an application tab. Short pages with distinct controls can be useful; long security or syntax references can also be justified for their audience. Word count is a signal, not an automatic deletion rule.",
  "",
  "## Applied cuts and consolidation",
  "",
  "- Retired the entire six-page workflow tutorial sequence, removed internal tutorial links, and added useful redirects. The requested /workflow-tutorial/01-simple-flow URL no longer serves a tutorial.",
  "- Removed builder/block navigation and workflow-assignment guidance from the normal employee path. The reference groups use hidden: true and searchable: true so app links and search remain useful.",
  `- ${stubs.length} compact block-metadata pages remain as in-product reference. Their brevity is not a reason to delete app-linked help. They are distinct from the retired beginner tutorials.`,
  "- Merged the separate Skill tree explainer into Employee profile → Assigned resources.",
  "- Merged the separate worker Templates explainer into Assign and use document templates; removed the visual-builder walkthrough from that active guide.",
  "- Rewrote recurring-work guidance around a tested employee task, Calendar and Actions.",
  "- Rebuilt the welcome page using the landing page's actual hero mockup, narrated demo, video poster and channel artwork, with a split hero and clear employee setup steps. No invented UI or new sidebar icons.",
  "- Shortened the employee-creation guide and replaced workflow-focused beginner FAQ content with employee training guidance.",
  "- Preserved all existing video assets and the quickstart recordings. No media was deleted to make the page list look smaller.",
  "",
  "## Keep distinct, rather than merge blindly",
  "",
  "- App connection versus worker tool assignment: connection ownership and employee permission are separate.",
  "- Knowledge stores versus employee Workspace versus credential Vault: different purpose, audience and security rules.",
  "- Worker Governance versus connected-tool policy versus approval handling: who can use/edit, what can happen, and how a person reviews it are separate.",
  "- Calendar versus event Actions: different triggers; both lead to employee tasks without requiring a builder tutorial.",
  "- Skill assignment versus creating a private skill: selecting a procedure is different from authoring one.",
  "- Template creation versus using a published template versus signing records: distinct jobs and lifecycle stages.",
  "",
  "## Remaining editorial candidates",
  "",
  "- Long DOCX syntax material should remain an optional authoring reference. A later split should preserve its existing anchors and examples.",
  "- Security, credentials and settings detail is intentionally retained for administrators and reviewers; it should not be injected into every beginner page.",
  "- Preserve workflow reference URLs: they are intentionally linked from the web app. The route-contract manifest and browser checks protect all existing app-linked routes.",
  "- Future content should answer a concrete employee task with a clear first action, outcome and recovery path—not create a page for every UI noun.",
  "",
  "## Page-by-page decisions",
  "",
  "| Page | Decision | Words (approx.) | Reason / disposition |",
  "| --- | --- | ---: | --- |",
];
for (const row of rows.sort((a, b) => a.path.localeCompare(b.path))) {
  lines.push(
    `| \`${row.path}\` | ${row.decision} | ${row.words} | ${row.reason} |`,
  );
}
console.log(lines.join("\n"));
