// Isolated actual-product Storybook fixture preview; does not modify the app checkout.
// node scripts/start-key-area-ui-preview.mjs ../webapp/apps/app [6119]
import { mkdtemp, writeFile, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const app = resolve(process.argv[2] ?? '../webapp/apps/app');
const port = Number(process.argv[3] ?? 6119);
assert(Number.isInteger(port) && port > 1024 && port < 65536);
const root = fileURLToPath(new URL('../', import.meta.url));
const config = await mkdtemp(join(tmpdir(), 'odella-docs-key-area-ui-'));
await symlink(join(app, 'node_modules'), join(config, 'node_modules'), 'dir');
const q = JSON.stringify;
const require = createRequire(join(app, 'package.json'));
const packagePath = (name) => dirname(require.resolve(name + '/package.json'));
const storyFiles = [
  'account/vault', 'workforce-create-action-modal', 'workforce',
  'workforce/settings/identity-settings', 'workforce/skill-workshop',
  'workforce/skill-assignment-upgrade', 'workforce/tasks/create-task',
  'workforce/activity/activity-trace-panel', 'packages/approvals/approval-panel',
  'document-store/creation', 'document-store/metadata-editing', 'document-store/status-badges',
  'documents/templates', 'template-builder-redesign/editor', 'template-builder-redesign/sidebar',
  'template-builder-redesign/modals', 'packages/workforce/components/settings/tabs/SecurityPrivacyTab',
  'account-phone-numbers', 'account-billing', 'account-models',
].map((file) => join(app, '.storybook/stories', file + '.stories.tsx'));
await writeFile(join(config, 'main.ts'), `import base from ${q(join(app, '.storybook/main.ts'))};
export default { ...base, staticDirs: [${q(join(app, 'public'))}], addons: ${q(['@storybook/addon-a11y', '@storybook/addon-themes'].map(packagePath))}, framework: { ...base.framework, name: ${q(packagePath('@storybook/nextjs-vite'))} }, stories: ${q([join(root, '.agents/fixtures/key-area-ui.stories.tsx'), ...storyFiles])},
  viteFinal: async (...args) => { const c = await base.viteFinal(...args); c.root = ${q(app)}; c.cacheDir = ${q(join(config, 'vite-cache'))}; c.server.fs.allow.push(${q(root)}, ${q(config)}); c.resolve.alias['@odella/core'] = ${q(resolve(app, '../../packages/core/src/index.ts'))}; c.resolve.alias['@odella/tools'] = ${q(resolve(app, '../../packages/tools/src/index.ts'))}; c.resolve.alias.react = ${q(dirname(require.resolve('react')))}; c.resolve.alias['react-dom'] = ${q(dirname(require.resolve('react-dom')))}; return c; }
};\n`);
await writeFile(join(config, 'preview.tsx'), `export { default } from ${q(join(app, '.storybook/preview.tsx'))};\n`);
const child = spawn(join(app, 'node_modules/.bin/storybook'), ['dev', '--port', String(port), '--host', '127.0.0.1', '--ci', '--no-open', '--config-dir', config], { cwd: app, env: { ...process.env, SKIP_ENV_VALIDATION: '1' }, stdio: 'inherit' });
console.log(`Isolated fixture config: ${config}`);
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('exit', (code) => { process.exitCode = code ?? 0; });
