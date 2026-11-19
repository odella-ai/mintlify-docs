// Local Storybook test-data customization only. Never rewrite DOM text or product
// controls. Fail if the prebuilt fixture changes rather than capture a misleading UI.
export function applySupportTutorialFixture(source) {
  const role =
    /id:\s*([`'"])team:role-employee-collaborator\1,\s*organizationId:\s*([`'"])storybook-org\2,\s*name:\s*([`'"])Employee collaborator\3,[\s\S]*?capabilities:\s*\[[^\]]*\]/g;
  const matches = [...source.matchAll(role)];
  if (!matches.length) return null;
  if (matches.length !== 1)
    throw new Error("Ambiguous Support colleague fixture");
  if (!matches[0][0].includes("employee.view")) {
    throw new Error("Expected view-capable Storybook role fixture");
  }
  return source
    .replace(role, (record) =>
      record.replace(
        /capabilities:\s*\[[^\]]*\]/,
        'capabilities:["employee.view","employee.chat","employee.work.request"]',
      ),
    )
    .replaceAll("Employee collaborator", "Support colleague");
}
