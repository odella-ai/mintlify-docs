import assert from "node:assert/strict";
import test from "node:test";
import { applySupportTutorialFixture } from "./guide-tutorial-fixture.mjs";

const fixture =
  "id:`team:role-employee-collaborator`,organizationId:`storybook-org`,name:`Employee collaborator`,description:`Example role`,capabilities:[`employee.view`]";

test("customizes the synthetic role and its capabilities, not UI controls", () => {
  const result = applySupportTutorialFixture(
    fixture + ';label="Manager and selected editors"',
  );
  assert.match(result, /name:`Support colleague`/);
  assert.match(
    result,
    /capabilities:\["employee.view","employee.chat","employee.work.request"\]/,
  );
  assert.match(result, /label="Manager and selected editors"/);
});

test("ignores scripts without the expected fixture", () => {
  assert.equal(
    applySupportTutorialFixture('const title = "Employee collaborator";'),
    null,
  );
});

test("refuses ambiguous or unexpectedly changed fixtures", () => {
  assert.throws(
    () => applySupportTutorialFixture(fixture + fixture),
    /Ambiguous/,
  );
  assert.throws(
    () =>
      applySupportTutorialFixture(
        fixture.replace("employee.view", "billing.view"),
      ),
    /Expected view-capable/,
  );
});
