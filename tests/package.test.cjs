const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const root = path.join(__dirname, '..');
const pkg = require('../package.json');

test('renderer preparation script parses without npm dependencies', () => {
  const run = spawnSync(process.execPath, ['--check', 'scripts/prepare-renderer.mjs'], { cwd: root, encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
});
test('desktop entry and installer inputs exist', () => {
  assert.ok(fs.existsSync(path.join(root, pkg.main)));
  assert.ok(fs.existsSync(path.join(root, pkg.build.win.icon)));
  assert.equal(pkg.build.win.target[0].target, 'nsis');
  assert.deepEqual(pkg.build.win.target[0].arch, ['x64']);
  assert.equal(pkg.build.nsis.deleteAppDataOnUninstall, false);
});
test('renderer includes local artwork, app content and no remote font import', () => {
  const html = fs.readFileSync(path.join(root, 'renderer/dist/index.html'), 'utf8');
  assert.match(html, /ARSES/);
  assert.ok(html.includes('data:image/webp;base64,') || fs.existsSync(path.join(root, 'renderer/dist/assets')), 'Hero artwork must be embedded or bundled');
  assert.ok(!html.includes('https://artifact-assets.placeholder/'), 'No asset placeholders may remain');
  assert.doesNotMatch(html, /@import[^;]*fonts\.googleapis/);
  assert.match(html, /connect-src 'none'/);
  assert.doesNotMatch(html, /script-src[^;]*(unsafe-inline|unsafe-eval)/);
});
test('inline scripts match the content security policy', () => {
  const html = fs.readFileSync(path.join(root, 'renderer/dist/index.html'), 'utf8');
  for (const match of html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)) {
    const hash = crypto.createHash('sha256').update(match[1]).digest('base64');
    assert.ok(html.includes(`'sha256-${hash}'`), 'Inline script must have a CSP hash');
  }
});
test('native shell disables dangerous renderer capabilities', () => {
  const main = fs.readFileSync(path.join(root, pkg.main), 'utf8');
  assert.match(main, /nodeIntegration:\s*false/);
  assert.match(main, /contextIsolation:\s*true/);
  assert.match(main, /sandbox:\s*true/);
  assert.match(main, /webSecurity:\s*true/);
  assert.match(main, /setWindowOpenHandler/);
  assert.doesNotMatch(main, /ipcMain|child_process|shell\.openExternal/);
});
