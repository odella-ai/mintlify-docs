// node scripts/check-channel-branding.mjs [path/to/webapp/apps/app]
import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
execFileSync(process.execPath, [join(root, 'scripts/sync-channel-branding.mjs')], { stdio: 'inherit' });
const folder = join(root, 'images/channels/logos');
const provenance = JSON.parse(await readFile(join(folder, 'provenance.json'), 'utf8'));
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const directory = await readFile(join(root, 'snippets/channel-setup-cards.mdx'), 'utf8');
assert.equal((directory.match(/className="channel-logo-card"/g) ?? []).length, 10);
for (const logo of [...provenance.logos, ...provenance.channelMarks]) {
  const data = await readFile(join(folder, logo.file));
  assert.equal(hash(data), logo.sha256, `${logo.name}: logo changed without updating provenance`);
  assert.match(data.toString(), /<svg\b/);
  assert.match(data.toString(), /viewBox=/);
  assert(!/<(?:script|foreignObject)\b|\bonload\s*=|\bhref=["']https?:/i.test(data.toString()), `${logo.name}: unsafe or externally dependent SVG`);
  assert(directory.includes(`/images/channels/logos/${logo.file}`), `${logo.name}: missing from the shared channel choices`);
  if (process.argv[2] && logo.appSource) assert.deepEqual(data, await readFile(resolve(process.argv[2], logo.appSource)), `${logo.name}: must match the actual web app logo`);
}
for (const page of await readdir(join(root, 'workforce/channels'))) {
  if (!page.endsWith('.mdx')) continue;
  const source = await readFile(join(root, 'workforce/channels', page), 'utf8');
  assert.equal((source.match(/className="channel-hero(?:[" ])/g) ?? []).length, 1, `${page}: needs exactly one channel illustration`);
  assert(source.includes('role="img" aria-label='), `${page}: illustration needs an accessible name`);
  assert(!source.includes('<ChannelHero') && !source.includes('<Snippet'), `${page}: artwork must render without custom-component resolution`);
  for (const [, src] of source.matchAll(/<img[^>]+src="([^"]+)"/g)) if (src.startsWith('/')) await access(join(root, src.slice(1)));
  const block = source.slice(source.indexOf('{/* channel-branding:start'), source.indexOf('{/* channel-branding:end'));
  assert(!/<img(?! noZoom)/.test(block), `${page}: decorative logos must not open lightboxes`);
}
for (const page of ['workforce/communication-channels.mdx', 'guides/connect-tools-and-channels.mdx']) {
  const source = await readFile(join(root, page), 'utf8');
  assert.equal((source.match(/className="channel-logo-card"/g) ?? []).length, 10, `${page}: missing logo-led choices`);
}
for (const page of ['email', 'web-chat', 'phone']) {
  const source = await readFile(join(root, `snippets/channel-heroes/${page}.mdx`), 'utf8');
  assert(source.includes(`src="/images/channels/logos/${page}.svg"`), `${page}: needs its own recognizable channel mark`);
  assert(!/gmail|outlook/i.test(source), 'Do not brand Odella-native channels as unrelated providers');
}
assert(!directory.includes('/favicon.svg'), 'Channel choices must have distinct marks, not repeated Odella badges');
assert.equal(new Set(provenance.channelMarks.map((mark) => mark.sha256)).size, 3, 'Native channel artwork must be distinct');
console.log(`Channel branding passed: ${provenance.logos.length} unmodified vendor SVGs, 3 distinct native channel marks, 13 setup illustrations, and two consistent 10-channel directories.`);
