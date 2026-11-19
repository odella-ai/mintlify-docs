import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readdirSync, readFileSync } from 'node:fs';
import { mkdtemp, mkdir, writeFile, readFile, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
const root = new URL('../', import.meta.url);
const store = new URL('node_modules/.pnpm/', root);
const lock = readFileSync(new URL('pnpm-lock.yaml', root), 'utf8').split('\nsnapshots:')[0];
async function installed(name, prefix) {
  const dir = readdirSync(store).find(d => d.startsWith(`${name}@${prefix}`));
  assert.ok(dir, `Real installed ${name}@${prefix} required`);
  const require = createRequire(new URL(`${dir}/node_modules/${name}/package.json`, store));
  const module = await import(pathToFileURL(require.resolve(name)).href);
  return module.default ?? module;
}

for (const [minor, floor] of [['7', 5], ['8', 3]]) {
  test(`fflate 0.${minor} retains its compatible patched minor`, () => {
    const versions = [...lock.matchAll(new RegExp(`^  fflate@0\\.${minor}\\.(\\d+):$`, 'gm'))];
    assert.ok(versions.length);
    for (const [, patch] of versions) assert.ok(Number(patch) >= floor);
  });
}

test('actual TOML, image, regex and ZIP parsers retain valid-input behavior', async () => {
  const toml = await installed('smol-toml', '1.9.');
  assert.equal(toml.parse('[service]\nport = 8080').service.port, 8080);
  assert.throws(() => toml.parse('x = [unterminated'));
  const image = await installed('image-size', '2.0.4');
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jB0kAAAAASUVORK5CYII=', 'base64');
  assert.equal(image.imageSize(png).width, 1);
  const regex = await installed('re2js', '2.');
  assert.equal(regex.RE2JS.compile('^safe$').test('safe'), true);
  const zip = await installed('fflate', '0.8.3');
  assert.equal(zip.strFromU8(zip.unzipSync(zip.zipSync({ 'ok.txt': zip.strToU8('safe') }))['ok.txt']), 'safe');
});

function markSymlink(archive, filename) {
  const bytes = Buffer.from(archive);
  for (let offset = 0; offset < bytes.length - 46; offset++) {
    if (bytes.readUInt32LE(offset) !== 0x02014b50) continue;
    const size = bytes.readUInt16LE(offset + 28);
    if (bytes.subarray(offset + 46, offset + 46 + size).toString() !== filename) continue;
    bytes.writeUInt16LE((3 << 8) | 20, offset + 4);
    bytes.writeUInt32LE(0xa1ff0000, offset + 38);
    return bytes;
  }
  throw new Error('Missing real ZIP central directory entry');
}

test('actual patched extract-zip rejects escaping archive and pre-existing parent symlinks', async () => {
  const extract = await installed('extract-zip', '2.0.1');
  const zip = await installed('fflate', '0.8.3');
  const work = await mkdtemp(join(tmpdir(), 'mint-zip-security-'));
  try {
    const destination = join(work, 'destination'), outside = join(work, 'outside');
    await mkdir(destination); await mkdir(outside);
    const archive = join(work, 'escaping.zip');
    await writeFile(archive, markSymlink(zip.zipSync({ link: zip.strToU8('../outside') }), 'link'));
    await assert.rejects(extract(archive, { dir: destination }), /Out of bound symlink/);
    await symlink(outside, join(destination, 'parent'));
    await writeFile(archive, zip.zipSync({ 'parent/escaped.txt': zip.strToU8('unsafe') }));
    await assert.rejects(extract(archive, { dir: destination }), /Out of bound path/);
    await assert.rejects(readFile(join(outside, 'escaped.txt')), { code: 'ENOENT' });
  } finally { await rm(work, { recursive: true, force: true }); }
});

test('actual patched extract-zip preserves safe archives and replaces unsafe destination links', async () => {
  const extract = await installed('extract-zip', '2.0.1');
  const zip = await installed('fflate', '0.8.3');
  const work = await mkdtemp(join(tmpdir(), 'mint-zip-replacement-'));
  try {
    const destination = join(work, 'destination'), outside = join(work, 'outside.txt');
    await mkdir(destination); await writeFile(outside, 'unchanged');
    await symlink(outside, join(destination, 'ok.txt'));
    const archive = join(work, 'safe.zip');
    await writeFile(archive, zip.zipSync({ 'ok.txt': zip.strToU8('safe') }));
    await extract(archive, { dir: destination });
    assert.equal(await readFile(join(destination, 'ok.txt'), 'utf8'), 'safe');
    assert.equal(await readFile(outside, 'utf8'), 'unchanged');
  } finally { await rm(work, { recursive: true, force: true }); }
});
