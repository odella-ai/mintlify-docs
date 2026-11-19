import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
const root = new URL('../', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'));
const records = readFileSync(new URL('pnpm-lock.yaml', root), 'utf8').split('\nsnapshots:')[0];
const atLeast = (a, b) => {
  const x = a.split('.').map(Number), y = b.split('.').map(Number);
  return x[0] > y[0] || (x[0] === y[0] && (x[1] > y[1] || (x[1] === y[1] && x[2] >= y[2])));
};

test('updated official CLI removes vulnerable HTTP dependencies without requiring removed packages to exist', () => {
  assert.equal(manifest.devDependencies.mintlify, '^4.2.1184');
  assert.match(records, /^  mintlify@4\.2\.1184:/m);
  for (const [, version] of records.matchAll(/^  ['"]?@hono\/node-server@(\d+\.\d+\.\d+)['"]?:$/gm)) assert.ok(atLeast(version, '2.1.3'));
  for (const [, version] of records.matchAll(/^  body-parser@(2\.\d+\.\d+):$/gm)) assert.ok(atLeast(version, '2.4.0'));
  assert.equal(manifest.pnpm.overrides['@hono/node-server'], '^2.1.3');
  assert.equal(manifest.pnpm.overrides['body-parser@>=2.0.0 <2.4.0'], '^2.4.0');
});

test('legacy schema consumers are not silently forced across Zod majors', () => {
  assert.equal(manifest.pnpm.overrides.zod, undefined);
  assert.equal(manifest.pnpm.overrides['zod@>=4.0.0 <4.6.6'], '^4.6.6');
  // The residual Zod 3 advisory stays visible until its actual consumers migrate.
});

test('real CLI esbuild host and native executable remain compatible', () => {
  const store = new URL('node_modules/.pnpm/', root);
  const dir = readdirSync(store).find(name => /^esbuild@0\.28\.2/.test(name));
  assert.ok(dir);
  const require = createRequire(new URL(`${dir}/node_modules/esbuild/package.json`, store));
  const esbuild = require('esbuild');
  assert.match(esbuild.transformSync('const value: number = 1', { loader: 'ts' }).code, /1/);
});
