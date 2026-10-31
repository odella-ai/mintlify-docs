import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
const manifest = JSON.parse(read('package.json'));
const records = read('pnpm-lock.yaml').split('\npackages:\n')[1].split('\nsnapshots:\n')[0];
const floors = [["fast-uri", 3, "3.1.9", "fast-uri"], ["undici", 7, "7.30.1", "undici"], ["qs", 6, "6.16.1", "qs"]];
const compare = (a, b) => { const x=a.split('.').map(Number), y=b.split('.').map(Number); return x[0]-y[0] || x[1]-y[1] || x[2]-y[2]; };
for (const [name, major, floor, key] of floors) {
  test(`${name} ${major} locks and future installs retain ${floor} security floor`, () => {
    const escaped=name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const all=[...records.matchAll(new RegExp(`^  ['"]?${escaped}@(\\d+\\.\\d+\\.\\d+)['"]?:$`, 'gm'))].map(x=>x[1]);
    const versions=all.filter(v=>v.startsWith(`${major}.`));
    assert.ok(versions.length>0, 'Expected affected major to be represented');
    for (const version of versions) assert.ok(compare(version,floor)>=0, `${version} is below ${floor}`);
    assert.equal(manifest.pnpm.overrides[key], `^${floor}`);
  });
}
